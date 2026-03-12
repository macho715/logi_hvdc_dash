#!/usr/bin/env python3
"""
JSON → TTL (event-based) converter for HVDC_STATUS.

Key outputs:
- Turtle file (*.ttl)
- used_cols audit (*.used_cols.json)

This script materializes:
- hvdc:hasSiteArrivalDate + site-specific properties (SHU2/MIR3/DAS4/AGI5)
- hvdc:hasSiteArrival (derived boolean)
- hvdc:StockEvent bnodes (hvdc:hasInboundEvent) for warehouse/site dates
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from rdflib import BNode, Graph, Literal, Namespace, RDF, XSD

from scripts.core.flow_code_calc import calculate_flow_code_v35

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

HVDC = Namespace("http://samsung.com/project-logistics#")


def load_colspec(config_path: Path) -> dict:
    return json.loads(config_path.read_text(encoding="utf-8"))


def load_json_data(json_path: Path) -> pd.DataFrame:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        for k in ("data", "records", "items"):
            if k in data and isinstance(data[k], list):
                data = data[k]
                break
    if not isinstance(data, list):
        raise ValueError("JSON top-level must be list[dict] or dict(data/records/items=list).")
    return pd.DataFrame(data)


def apply_site_aliases(df: pd.DataFrame, aliases: dict) -> pd.DataFrame:
    for src, dst in aliases.items():
        if src in df.columns and dst not in df.columns:
            df[dst] = df[src]
    return df


def normalize_dates(df: pd.DataFrame, cols: List[str], null_strings: set) -> None:
    for c in cols:
        if c not in df.columns:
            continue
        s = df[c].astype(str).str.strip()
        df[c] = pd.to_datetime(df[c].mask(s.isin(null_strings), np.nan), errors="coerce").dt.date


def _present_mask(s: pd.Series, null_strings: set) -> pd.Series:
    s_str = s.astype(str).str.strip()
    return s.notna() & ~s_str.isin(null_strings)


def pick_id(row: pd.Series, id_cols_priority: List[str]) -> Optional[str]:
    for c in id_cols_priority:
        if c in row.index and pd.notna(row.get(c)):
            v = str(row.get(c)).strip()
            if v:
                return v
    return None


def resolve_vendor(row: pd.Series, vendor_cols_priority: List[str]) -> Optional[str]:
    for c in vendor_cols_priority:
        if c in row.index and pd.notna(row.get(c)):
            v = str(row.get(c)).strip()
            if v:
                return v
    return None


def site_arrival_props() -> Dict[str, str]:
    return {
        "SHU2": "hasSHUArrivalDate",
        "MIR3": "hasMIRArrivalDate",
        "DAS4": "hasDASArrivalDate",
        "AGI5": "hasAGIArrivalDate",
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("-i", "--input", required=True, help="Input JSON path")
    p.add_argument("-o", "--output", required=True, help="Output TTL path")
    p.add_argument("--config", required=True, help="Column spec JSON path (SSOT)")
    p.add_argument("--schema", help="Optional schema TTL to preload")
    return p.parse_args()


def main():
    args = parse_args()
    cfg = load_colspec(Path(args.config))

    df = load_json_data(Path(args.input))
    df = apply_site_aliases(df, cfg.get("site_arrival_aliases", {}))

    null_strings = set(cfg.get("null_strings", []))
    date_cols = list(dict.fromkeys(
        cfg.get("date_cols_vectorize", []) +
        cfg.get("warehouse_cols", []) +
        cfg.get("site_cols", []) +
        cfg.get("site_arrival_cols_raw", [])
    ))
    normalize_dates(df, date_cols, null_strings)

    df = calculate_flow_code_v35(
        df,
        warehouse_columns=cfg.get("warehouse_cols", []),
        site_columns=cfg.get("site_cols", []),
        final_location_col=cfg.get("final_location_col", "Final_Location"),
    )

    wh_cols_used = [c for c in cfg.get("warehouse_cols", []) if c in df.columns and _present_mask(df[c], null_strings).sum() > 0]
    site_cols_used = [c for c in cfg.get("site_cols", []) if c in df.columns and _present_mask(df[c], null_strings).sum() > 0]
    raw_site_cols_used = [c for c in cfg.get("site_arrival_cols_raw", []) if c in df.columns and _present_mask(df[c], null_strings).sum() > 0]

    used_cols = {
        "warehouse_cols_input": cfg.get("warehouse_cols", []),
        "warehouse_cols_used": wh_cols_used,
        "site_cols_input": cfg.get("site_cols", []),
        "site_cols_used": site_cols_used,
        "site_arrival_cols_raw_input": cfg.get("site_arrival_cols_raw", []),
        "site_arrival_cols_raw_used": raw_site_cols_used,
        "df_columns": list(df.columns),
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    used_cols_path = out_path.with_suffix(".used_cols.json")
    used_cols_path.write_text(json.dumps(used_cols, ensure_ascii=False, indent=2), encoding="utf-8")

    g = Graph()
    g.bind("hvdc", HVDC)

    if args.schema:
        sp = Path(args.schema)
        if sp.exists():
            g.parse(str(sp), format="turtle")
            logger.info(f"Loaded schema: {sp}")

    sap = site_arrival_props()
    site_label_by_raw = {"SHU2": "SHU", "MIR3": "MIR", "DAS4": "DAS", "AGI5": "AGI"}

    for idx, row in df.iterrows():
        ship_id = pick_id(row, cfg.get("id_cols_priority", [])) or f"ROW_{idx+1:06d}"
        case_uri = HVDC[f"Case_{ship_id.replace(' ', '_')}"]
        g.add((case_uri, RDF.type, HVDC.Case))

        g.add((case_uri, HVDC.hasShipmentId, Literal(ship_id, datatype=XSD.string)))

        vendor = resolve_vendor(row, cfg.get("vendor_cols_priority", []))
        if vendor:
            g.add((case_uri, HVDC.hasVendor, Literal(vendor, datatype=XSD.string)))

        flc = cfg.get("final_location_col", "Final_Location")
        if flc in row.index and pd.notna(row.get(flc)):
            g.add((case_uri, HVDC.hasFinalLocation, Literal(str(row.get(flc)).strip(), datatype=XSD.string)))

        # Flow
        if pd.notna(row.get("FLOW_CODE")):
            g.add((case_uri, HVDC.hasFlowCode, Literal(int(row["FLOW_CODE"]), datatype=XSD.integer)))
        if pd.notna(row.get("FLOW_CODE_ORIG")):
            g.add((case_uri, HVDC.hasFlowCodeOriginal, Literal(int(row["FLOW_CODE_ORIG"]), datatype=XSD.integer)))
        if pd.notna(row.get("FLOW_OVERRIDE_REASON")):
            g.add((case_uri, HVDC.hasFlowOverrideReason, Literal(str(row["FLOW_OVERRIDE_REASON"]), datatype=XSD.string)))
        if pd.notna(row.get("FLOW_DESCRIPTION")):
            g.add((case_uri, HVDC.hasFlowDescription, Literal(str(row["FLOW_DESCRIPTION"]), datatype=XSD.string)))

        # key dates
        for c, prop in [("ETD", "hasETD"), ("ATD", "hasATD"), ("ETA", "hasETA"), ("ATA", "hasATA")]:
            if c in row.index and pd.notna(row.get(c)):
                g.add((case_uri, HVDC[prop], Literal(row.get(c), datatype=XSD.date)))

        # site arrival dates (raw columns)
        any_site = False
        chosen_site = None
        chosen_date = None

        for raw_col, prop_local in sap.items():
            if raw_col in row.index and pd.notna(row.get(raw_col)):
                d = row.get(raw_col)
                any_site = True
                g.add((case_uri, HVDC[prop_local], Literal(d, datatype=XSD.date)))
                if chosen_date is None or d > chosen_date:
                    chosen_date = d
                    chosen_site = site_label_by_raw.get(raw_col)

        if chosen_date is not None:
            g.add((case_uri, HVDC.hasSiteArrivalDate, Literal(chosen_date, datatype=XSD.date)))
            if chosen_site:
                g.add((case_uri, HVDC.hasSiteArrivalLocation, Literal(chosen_site, datatype=XSD.string)))

        g.add((case_uri, HVDC.hasSiteArrival, Literal(bool(any_site), datatype=XSD.boolean)))

        # StockEvent nodes (warehouse/site/raw site)
        loc_cols = []
        for c in wh_cols_used:
            loc_cols.append((c, c))
        for c in site_cols_used:
            loc_cols.append((c, c))
        for c in raw_site_cols_used:
            loc_cols.append((c, site_label_by_raw.get(c, c)))

        for col, label in loc_cols:
            if col in row.index and pd.notna(row.get(col)):
                bn = BNode()
                g.add((bn, RDF.type, HVDC.StockEvent))
                g.add((bn, HVDC.hasEventDate, Literal(row.get(col), datatype=XSD.date)))
                g.add((bn, HVDC.hasLocationAtEvent, Literal(str(label), datatype=XSD.string)))
                g.add((case_uri, HVDC.hasInboundEvent, bn))

    g.serialize(destination=str(out_path), format="turtle")
    logger.info(f"Saved TTL: {out_path} (triples={len(g)})")
    logger.info(f"Saved used_cols: {used_cols_path}")


if __name__ == "__main__":
    main()
