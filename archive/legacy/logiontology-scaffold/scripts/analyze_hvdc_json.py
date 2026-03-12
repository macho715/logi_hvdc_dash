#!/usr/bin/env python3
"""
HVDC JSON Analytics
- Flow Code distribution (v3.5)
- Site statistics (SHU/MIR/DAS/AGI, typically aliased from SHU2/MIR3/DAS4/AGI5)
- Vendor stats

Outputs:
- JSON report
- Markdown report
- Summary CSVs
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd

from scripts.core.flow_code_calc import calculate_flow_code_v35

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def load_colspec(config_path: Path) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_json_data(json_path: Path) -> pd.DataFrame:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

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


def normalize_dates(df: pd.DataFrame, cols: list, null_strings: set) -> None:
    for c in cols:
        if c not in df.columns:
            continue
        s = df[c].astype(str).str.strip()
        df[c] = pd.to_datetime(df[c].mask(s.isin(null_strings), np.nan), errors="coerce").dt.date


def resolve_vendor_col(df: pd.DataFrame, vendor_cols_priority: list) -> Optional[str]:
    for c in vendor_cols_priority:
        if c in df.columns:
            return c
    return None


def _present_mask(s: pd.Series, null_strings: set) -> pd.Series:
    s_str = s.astype(str).str.strip()
    return s.notna() & ~s_str.isin(null_strings)


def analyze_flow(df: pd.DataFrame) -> Dict:
    dist = df["FLOW_CODE"].value_counts().sort_index()
    total = int(len(df))
    pct = (dist / total * 100.0).round(2) if total else dist * 0.0
    return {
        "total": total,
        "distribution": dist.to_dict(),
        "percentage": pct.to_dict(),
    }


def analyze_sites(df: pd.DataFrame, site_cols: list, vendor_col: Optional[str], null_strings: set) -> Dict:
    out: Dict = {}
    total = int(len(df))
    for site in site_cols:
        if site not in df.columns:
            continue
        m = _present_mask(df[site], null_strings)
        cnt = int(m.sum())
        site_flow = df.loc[m, "FLOW_CODE"].value_counts().sort_index().to_dict()
        top_vendors = {}
        if vendor_col:
            top_vendors = df.loc[m, vendor_col].fillna("UNKNOWN").value_counts().head(10).to_dict()
        out[site] = {
            "count": cnt,
            "pct": float(round(cnt / total * 100.0, 2)) if total else 0.0,
            "flow_distribution": site_flow,
            "top_vendors": top_vendors,
        }
    return out


def write_csv_summaries(df: pd.DataFrame, site_cols: list, vendor_col: Optional[str], out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)

    dist = df["FLOW_CODE"].value_counts().sort_index()
    total = len(df)
    pd.DataFrame({
        "flow_code": dist.index.astype(int),
        "count": dist.values.astype(int),
        "pct": (dist.values / total * 100.0).round(2) if total else 0.0,
    }).to_csv(out_dir / "flow_distribution.csv", index=False, encoding="utf-8-sig")

    rows = []
    for site in site_cols:
        if site in df.columns:
            cnt = int(df[site].notna().sum())
            rows.append({"site": site, "count": cnt, "pct": round(cnt / total * 100.0, 2) if total else 0.0})
    pd.DataFrame(rows).to_csv(out_dir / "site_summary.csv", index=False, encoding="utf-8-sig")

    if vendor_col:
        top = df[vendor_col].fillna("UNKNOWN").value_counts().head(20).index
        vf = (df[df[vendor_col].fillna("UNKNOWN").isin(top)]
              .assign(vendor=df[vendor_col].fillna("UNKNOWN"))
              .groupby(["vendor", "FLOW_CODE"]).size()
              .reset_index(name="count"))
        vf.to_csv(out_dir / "vendor_flow_top20.csv", index=False, encoding="utf-8-sig")


def generate_md(report: dict) -> str:
    flow = report["flow"]
    lines = []
    lines.append("# HVDC JSON Analytics Report\n\n")
    lines.append(f"GeneratedAt: {report['generated_at']}\n\n")
    lines.append(f"Total: {flow['total']}\n\n")
    lines.append("## Flow distribution\n\n")
    lines.append("| Flow | Count | Pct(%) |\n|---:|---:|---:|\n")
    for k in sorted(flow["distribution"].keys()):
        lines.append(f"| {k} | {flow['distribution'][k]} | {flow['percentage'][k]:.2f} |\n")
    lines.append("\n## Site stats\n\n")
    for site, s in report["sites"].items():
        lines.append(f"### {site}\n\n")
        lines.append(f"- Count: {s['count']} ({s['pct']:.2f}%)\n")
        lines.append(f"- Flow: {s['flow_distribution']}\n")
        if s["top_vendors"]:
            top5 = list(s["top_vendors"].keys())[:5]
            lines.append(f"- Top vendors: {', '.join(top5)}\n")
        lines.append("\n")
    return "".join(lines)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("-i", "--input", required=True, help="Input JSON path")
    p.add_argument("-o", "--output", required=True, help="Output report JSON path")
    p.add_argument("--config", required=True, help="Column spec JSON path (SSOT)")
    p.add_argument("--csv-dir", default="reports/analysis/csv", help="CSV output directory")
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
        cfg.get("site_cols", [])
    ))
    normalize_dates(df, date_cols, null_strings)

    df = calculate_flow_code_v35(
        df,
        cfg.get("warehouse_cols", []),
        cfg.get("site_cols", []),
        cfg.get("final_location_col", "Final_Location"),
    )

    vendor_col = resolve_vendor_col(df, cfg.get("vendor_cols_priority", []))

    report = {
        "generated_at": pd.Timestamp.now().isoformat(),
        "flow": analyze_flow(df),
        "sites": analyze_sites(df, cfg.get("site_cols", []), vendor_col, null_strings),
    }

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    md = generate_md(report)
    out.with_suffix(".md").write_text(md, encoding="utf-8")

    write_csv_summaries(df, cfg.get("site_cols", []), vendor_col, Path(args.csv_dir))

    logger.info(f"Saved: {out} and {out.with_suffix('.md')}")


if __name__ == "__main__":
    main()
