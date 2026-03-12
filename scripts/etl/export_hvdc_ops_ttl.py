#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
export_hvdc_ops_ttl.py

Supabase CSV(SSOT Status + Option-C Case) -> RDF/Turtle instance data export
- Ontology schema: hvdc_ops_ontology.ttl
- SHACL shapes:   hvdc_ops_shapes.ttl

Inputs (auto-detect by filename):
1) Status layer (Untitled-4 output)
   - shipments.csv OR shipments_status.csv
   - logistics_events.csv OR events_status.csv

2) Case layer (Untitled-3 output folder)
   - cases.csv
   - flows.csv
   - locations.csv
   - events.csv (or events_case.csv)

Outputs:
- out_ttl: hvdc_ops_data.ttl (instances only)
- (optional) copy schema/shapes alongside output

Usage examples:
  python export_hvdc_ops_ttl.py \
    --status-dir out/supabase \
    --case-dir supabase/data/output/optionC \
    --schema-ttl hvdc_ops_ontology.ttl \
    --shapes-ttl hvdc_ops_shapes.ttl \
    --out out/ontology/hvdc_ops_data.ttl

Notes:
- SSOT key: hvdc_code
- Case key: (hvdc_code, case_no)
- Location key: location_code
- CaseEvent IRI: deterministic from natural key (hvdc_code, case_no, event_type, event_time_iso, location_code, source_field, source_system)
- StatusEvent IRI: from event_id
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import re
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# -----------------------------
# Helpers
# -----------------------------
def _read_csv(path: Path) -> List[dict]:
    with path.open("r", encoding="utf-8", errors="replace", newline="") as f:
        r = csv.DictReader(f)
        return list(r)

def _pick_existing(dir_path: Path, candidates: List[str]) -> Optional[Path]:
    for name in candidates:
        p = dir_path / name
        if p.exists():
            return p
    return None

def _is_blank(v: Optional[str]) -> bool:
    return v is None or str(v).strip() == ""

def _as_bool(v: str) -> Optional[bool]:
    if _is_blank(v): return None
    s = str(v).strip().lower()
    if s in ("true","t","1","yes","y"): return True
    if s in ("false","f","0","no","n"): return False
    return None

def _as_int(v: str) -> Optional[int]:
    if _is_blank(v): return None
    m = re.search(r"-?\d+", str(v).replace(",",""))
    return int(m.group(0)) if m else None

def _as_decimal_str(v: str) -> Optional[str]:
    if _is_blank(v): return None
    s = str(v).strip().replace(",","")
    # keep as lexical xsd:decimal
    try:
        float(s)
        return s
    except Exception:
        return None

def _as_date(v: str) -> Optional[str]:
    if _is_blank(v): return None
    s = str(v).strip()
    # accept YYYY-MM-DD only
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return s
    except Exception:
        return None

def _as_datetime(v: str) -> Optional[str]:
    if _is_blank(v): return None
    s = str(v).strip()
    # accept ISO-ish
    try:
        # normalize Z
        if s.endswith("Z"):
            dt = datetime.fromisoformat(s[:-1]).replace(tzinfo=timezone.utc)
            return dt.isoformat().replace("+00:00","Z")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00","Z")
    except Exception:
        return None

def _ttl_escape(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace('"', '\\"')

def _iri(base: str, *parts: str) -> str:
    # conservative URL-safe slug (not full percent-encoding; enough for stable IDs)
    def slug(x: str) -> str:
        x = str(x).strip()
        x = re.sub(r"\s+", "_", x)
        x = re.sub(r"[^0-9A-Za-z._\-]+", "-", x)
        return x[:180] if len(x) > 180 else x
    return base.rstrip("/") + "/" + "/".join(slug(p) for p in parts)

def _hash_id(*vals: str) -> str:
    h = hashlib.sha256("||".join([str(v) for v in vals]).encode("utf-8")).hexdigest()
    return h[:20]

# -----------------------------
# Turtle builder
# -----------------------------
class TTL:
    def __init__(self):
        self.lines: List[str] = []

    def add(self, line: str = ""):
        self.lines.append(line)

    def triple(self, s: str, p: str, o: str):
        self.lines.append(f"{s} {p} {o} .")

    def start_block(self, s: str, types: List[str], props: List[Tuple[str,str]]):
        # types + props rendered as ; chain
        self.lines.append(f"{s} a {', '.join(types)} ;")
        for i, (p, o) in enumerate(props):
            end = " ." if i == len(props)-1 else " ;"
            self.lines.append(f"  {p} {o}{end}")

    def text(self) -> str:
        return "\n".join(self.lines) + "\n"

# -----------------------------
# Export logic
# -----------------------------
def export_instances(
    status_dir: Path,
    case_dir: Optional[Path],
    out_ttl: Path,
    schema_ttl: Optional[Path],
    shapes_ttl: Optional[Path],
    base_iri: str,
) -> None:
    # Status files
    shipments_path = _pick_existing(status_dir, ["shipments_status.csv", "shipments.csv"])
    events_status_path = _pick_existing(status_dir, ["events_status.csv", "logistics_events.csv"])

    if not shipments_path or not events_status_path:
        raise SystemExit(f"[FAIL] status_dir에서 shipments/events CSV를 찾지 못했습니다: {status_dir}")

    shipments = _read_csv(shipments_path)
    status_events = _read_csv(events_status_path)

    # Case files (optional)
    cases = flows = locations = events_case = None
    if case_dir:
        cases_p = _pick_existing(case_dir, ["cases.csv"])
        flows_p = _pick_existing(case_dir, ["flows.csv"])
        loc_p   = _pick_existing(case_dir, ["locations.csv"])
        ev_p    = _pick_existing(case_dir, ["events_case.csv", "events.csv"])
        if all([cases_p, flows_p, loc_p, ev_p]):
            cases = _read_csv(cases_p)
            flows = _read_csv(flows_p)
            locations = _read_csv(loc_p)
            events_case = _read_csv(ev_p)
        else:
            # allow missing case layer
            cases = flows = locations = events_case = None

    # Build lookups
    case_by_ship: Dict[str, List[dict]] = {}
    flow_by_key: Dict[Tuple[str,str], dict] = {}
    loc_by_id: Dict[str, dict] = {}
    loc_by_code: Dict[str, dict] = {}
    if cases:
        for r in cases:
            code = (r.get("hvdc_code") or "").strip()
            case_no = (r.get("case_no") or "").strip()
            if not code or not case_no: 
                continue
            case_by_ship.setdefault(code, []).append(r)
    if flows:
        for r in flows:
            code = (r.get("hvdc_code") or "").strip()
            case_no = (r.get("case_no") or "").strip()
            if not code or not case_no:
                continue
            flow_by_key[(code, case_no)] = r
    if locations:
        for r in locations:
            lid = str(r.get("location_id") or "").strip()
            lcode = (r.get("location_code") or "").strip()
            if lid: loc_by_id[lid] = r
            if lcode: loc_by_code[lcode] = r

    # TTL output
    t = TTL()
    t.add(f"@prefix hvdc: <{base_iri.rstrip('/') + '#'}> .")
    t.add("@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .")
    t.add("")
    t.add("# ------------------------------------------------------------")
    t.add("# Instance data exported from Supabase CSV (status + case)")
    t.add("# ------------------------------------------------------------")
    t.add("")

    # Locations first (dimension)
    if locations:
        for r in locations:
            lcode = (r.get("location_code") or "").strip()
            if not lcode:
                continue
            loc_iri = f"<{_iri(base_iri, 'Location', lcode)}>"
            props: List[Tuple[str,str]] = [
                ("hvdc:locationCode", f"\"{_ttl_escape(lcode)}\""),
                ("hvdc:locationName", f"\"{_ttl_escape((r.get('name') or '').strip())}\""),
            ]
            cat = (r.get("category") or "").strip()
            if cat:
                props.append(("hvdc:locationCategory", f"\"{_ttl_escape(cat)}\""))
            hvdc_node = (r.get("hvdc_node") or "").strip()
            if hvdc_node:
                props.append(("hvdc:hvdcNode", f"\"{_ttl_escape(hvdc_node)}\""))
            for flag_key, pred in [("is_mosb","hvdc:isMosb"),("is_site","hvdc:isSite"),("is_port","hvdc:isPort"),("active","hvdc:active")]:
                b = _as_bool(r.get(flag_key,""))
                if b is not None:
                    props.append((pred, f"\"{str(b).lower()}\"^^xsd:boolean"))
            t.start_block(loc_iri, ["hvdc:Location"], props)
            t.add("")

    # Shipments (SSOT)
    for sh in shipments:
        code = (sh.get("hvdc_code") or "").strip()
        if not code:
            continue
        ship_iri = f"<{_iri(base_iri, 'Shipment', code)}>"
        props: List[Tuple[str,str]] = [
            ("hvdc:hvdcCode", f"\"{_ttl_escape(code)}\""),
        ]
        i = _as_int(sh.get("status_no",""))
        if i is not None:
            props.append(("hvdc:statusNo", f"\"{i}\"^^xsd:integer"))
        for key, pred in [
            ("vendor","hvdc:vendor"), ("band","hvdc:band"), ("incoterms","hvdc:incoterms"),
            ("currency","hvdc:currency"), ("pol","hvdc:pol"), ("pod","hvdc:pod"),
            ("bl_awb","hvdc:blAwb"), ("vessel","hvdc:vessel"), ("ship_mode","hvdc:shipMode"),
        ]:
            v = (sh.get(key) or "").strip()
            if v:
                props.append((pred, f"\"{_ttl_escape(v)}\""))
        for key, pred in [("pkg","hvdc:pkg"), ("qty_cntr","hvdc:qtyCntr")]:
            i = _as_int(sh.get(key,""))
            if i is not None:
                props.append((pred, f"\"{i}\"^^xsd:integer"))
        for key, pred in [("cbm","hvdc:cbm"), ("gwt_kg","hvdc:gwtKg")]:
            d = _as_decimal_str(sh.get(key,""))
            if d is not None:
                props.append((pred, f"\"{d}\"^^xsd:decimal"))
        for key, pred in [("etd","hvdc:etd"), ("eta","hvdc:eta"), ("ata","hvdc:ata")]:
            d = _as_date(sh.get(key,""))
            if d is not None:
                props.append((pred, f"\"{d}\"^^xsd:date"))
        b = _as_bool(sh.get("warehouse_flag",""))
        if b is not None:
            props.append(("hvdc:warehouseFlag", f"\"{str(b).lower()}\"^^xsd:boolean"))
        wl = (sh.get("warehouse_last_location") or "").strip()
        wd = _as_date(sh.get("warehouse_last_date",""))
        if wl:
            props.append(("hvdc:warehouseLastLocation", f"\"{_ttl_escape(wl)}\""))
        if wd:
            props.append(("hvdc:warehouseLastDate", f"\"{wd}\"^^xsd:date"))
        raw = (sh.get("raw") or "").strip()
        if raw:
            # keep raw compact; already JSON string
            props.append(("hvdc:rawJson", f"\"\"\"{raw}\"\"\""))
        t.start_block(ship_iri, ["hvdc:Shipment"], props)

        # Link cases if available
        if cases and code in case_by_ship:
            for cr in case_by_ship[code]:
                case_no = (cr.get("case_no") or "").strip()
                if not case_no: 
                    continue
                case_iri = f"<{_iri(base_iri, 'Case', code, case_no)}>"
                t.triple(ship_iri, "hvdc:hasCase", case_iri)

        t.add("")

    # Status events
    for ev in status_events:
        eid = (ev.get("event_id") or "").strip()
        code = (ev.get("hvdc_code") or "").strip()
        if not eid or not code:
            continue
        ev_iri = f"<{_iri(base_iri, 'StatusEvent', eid)}>"
        ship_iri = f"<{_iri(base_iri, 'Shipment', code)}>"
        props: List[Tuple[str,str]] = [
            ("hvdc:eventId", f"\"{_ttl_escape(eid)}\""),
            ("hvdc:eventType", f"\"{_ttl_escape((ev.get('event_type') or '').strip())}\""),
            ("hvdc:eventDate", f"\"{_as_date(ev.get('event_date','')) or (str(ev.get('event_date','')).strip())}\"^^xsd:date"),
            ("hvdc:sourceSystem", f"\"{_ttl_escape((ev.get('source') or '').strip())}\""),
            ("hvdc:forShipment", ship_iri),
        ]
        loc_txt = (ev.get("location") or "").strip()
        if loc_txt:
            props.append(("hvdc:locationText", f"\"{_ttl_escape(loc_txt)}\""))
        raw = (ev.get("raw") or "").strip()
        if raw:
            props.append(("hvdc:rawJson", f"\"\"\"{raw}\"\"\""))
        t.start_block(ev_iri, ["hvdc:StatusEvent"], props)
        # shipment -> event
        t.triple(ship_iri, "hvdc:hasStatusEvent", ev_iri)
        t.add("")

    # Cases, Flows, CaseEvents
    if cases and flows:
        for cr in cases:
            code = (cr.get("hvdc_code") or "").strip()
            case_no = (cr.get("case_no") or "").strip()
            if not code or not case_no:
                continue
            case_iri = f"<{_iri(base_iri, 'Case', code, case_no)}>"
            ship_iri = f"<{_iri(base_iri, 'Shipment', code)}>"
            props: List[Tuple[str,str]] = [
                ("hvdc:caseNo", f"\"{_ttl_escape(case_no)}\""),
                ("hvdc:belongsToShipment", ship_iri),
            ]
            for key, pred in [
                ("site_code","hvdc:siteCode"), ("eq_no","hvdc:eqNo"), ("description","hvdc:description"),
                ("final_location","hvdc:finalLocation"), ("storage","hvdc:storage"), ("vendor","hvdc:vendor"),
            ]:
                v = (cr.get(key) or "").strip()
                if v:
                    props.append((pred, f"\"{_ttl_escape(v)}\""))
            for key, pred in [("pkg","hvdc:pkg")]:
                i = _as_int(cr.get(key,""))
                if i is not None:
                    props.append((pred, f"\"{i}\"^^xsd:integer"))
            for key, pred in [("l_cm","hvdc:lCm"), ("w_cm","hvdc:wCm"), ("h_cm","hvdc:hCm"),
                              ("cbm","hvdc:cbm"), ("nw_kg","hvdc:nwKg"), ("gw_kg","hvdc:gwKg"), ("sqm","hvdc:sqm")]:
                d = _as_decimal_str(cr.get(key,""))
                if d is not None:
                    props.append((pred, f"\"{d}\"^^xsd:decimal"))
            # include hvdc_code as data for convenience
            props.insert(0, ("hvdc:hvdcCode", f"\"{_ttl_escape(code)}\""))
            t.start_block(case_iri, ["hvdc:Case"], props)
            t.add("")

            # Flow per case
            fr = flow_by_key.get((code, case_no))
            if fr:
                flow_iri = f"<{_iri(base_iri, 'Flow', code, case_no)}>"
                fprops: List[Tuple[str,str]] = []
                fc = _as_int(fr.get("flow_code",""))
                if fc is not None:
                    fprops.append(("hvdc:flowCode", f"\"{fc}\"^^xsd:integer"))
                for key, pred in [
                    ("override_reason","hvdc:overrideReason"),
                    ("customs_code","hvdc:customsCode"),
                    ("last_status","hvdc:lastStatus"),
                ]:
                    v = (fr.get(key) or "").strip()
                    if v:
                        fprops.append((pred, f"\"{_ttl_escape(v)}\""))
                for key, pred in [("flow_code_original","hvdc:flowCodeOriginal"), ("flow_code_derived","hvdc:flowCodeDerived"),
                                  ("warehouse_count","hvdc:warehouseCount")]:
                    i = _as_int(fr.get(key,""))
                    if i is not None:
                        fprops.append((pred, f"\"{i}\"^^xsd:integer"))
                for key, pred in [("has_mosb_leg","hvdc:hasMosbLeg"), ("has_site_arrival","hvdc:hasSiteArrival"),
                                  ("requires_review","hvdc:requiresReview")]:
                    b = _as_bool(fr.get(key,""))
                    if b is not None:
                        fprops.append((pred, f"\"{str(b).lower()}\"^^xsd:boolean"))
                for key, pred in [("customs_start_iso","hvdc:customsStart"), ("customs_end_iso","hvdc:customsEnd")]:
                    dt = _as_datetime(fr.get(key,""))
                    if dt is not None:
                        fprops.append((pred, f"\"{dt}\"^^xsd:dateTime"))
                fprops.insert(0, ("hvdc:caseNo", f"\"{_ttl_escape(case_no)}\""))
                fprops.insert(0, ("hvdc:hvdcCode", f"\"{_ttl_escape(code)}\""))
                t.start_block(flow_iri, ["hvdc:Flow"], fprops)
                t.triple(case_iri, "hvdc:hasFlow", flow_iri)
                t.add("")

    if events_case and locations:
        # Build CaseEvent instances + link to Case + Location
        for er in events_case:
            code = (er.get("hvdc_code") or "").strip()
            case_no = (er.get("case_no") or "").strip()
            if not code or not case_no:
                continue
            et = (er.get("event_type") or "").strip()
            ts = (er.get("event_time_iso") or "").strip()
            lid = str(er.get("location_id") or "").strip()
            sf = (er.get("source_field") or "").strip()
            ss = (er.get("source_system") or "").strip()

            dt = _as_datetime(ts)
            if dt is None:
                continue

            loc = loc_by_id.get(lid)
            if not loc:
                continue
            lcode = (loc.get("location_code") or "").strip()
            if not lcode:
                continue

            # deterministic IRI from natural key
            hid = _hash_id(code, case_no, et, dt, lcode, sf, ss)
            ev_iri = f"<{_iri(base_iri, 'CaseEvent', code, case_no, hid)}>"
            case_iri = f"<{_iri(base_iri, 'Case', code, case_no)}>"
            loc_iri = f"<{_iri(base_iri, 'Location', lcode)}>"
            props: List[Tuple[str,str]] = [
                ("hvdc:eventId", f"\"{_ttl_escape(hid)}\""),
                ("hvdc:eventType", f"\"{_ttl_escape(et)}\""),
                ("hvdc:eventTime", f"\"{dt}\"^^xsd:dateTime"),
                ("hvdc:sourceSystem", f"\"{_ttl_escape(ss)}\""),
                ("hvdc:sourceField", f"\"{_ttl_escape(sf)}\""),
                ("hvdc:rawEpochMs", f"\"{_as_int(er.get('raw_epoch_ms','')) or 0}\"^^xsd:integer"),
                ("hvdc:atLocation", loc_iri),
                ("hvdc:forCase", case_iri),
            ]
            t.start_block(ev_iri, ["hvdc:CaseEvent"], props)
            t.triple(case_iri, "hvdc:hasEvent", ev_iri)
            t.add("")

    # Write output
    out_ttl.parent.mkdir(parents=True, exist_ok=True)
    out_ttl.write_text(t.text(), encoding="utf-8")

    # Optional: copy schema/shapes next to output
    if schema_ttl and schema_ttl.exists():
        (out_ttl.parent / schema_ttl.name).write_text(schema_ttl.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")
    if shapes_ttl and shapes_ttl.exists():
        (out_ttl.parent / shapes_ttl.name).write_text(shapes_ttl.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--status-dir",
        default="../hvdc_output/supabase",
        help="Status CSV 폴더 (default: ../hvdc_output/supabase)",
    )
    ap.add_argument(
        "--case-dir",
        default="../hvdc_output/optionC",
        help="Option-C CSV 폴더 (default: ../hvdc_output/optionC). 없으면 생략 가능",
    )
    ap.add_argument("--schema-ttl", default="", help="hvdc_ops_ontology.ttl 경로(선택)")
    ap.add_argument("--shapes-ttl", default="", help="hvdc_ops_shapes.ttl 경로(선택)")
    ap.add_argument(
        "--out",
        default="../hvdc_output/ontology/hvdc_ops_data.ttl",
        help="출력 TTL 경로 (default: ../hvdc_output/ontology/hvdc_ops_data.ttl)",
    )
    ap.add_argument("--base-iri", default="https://example.com/hvdc", help="Instance base IRI (기본: https://example.com/hvdc)")
    args = ap.parse_args()

    status_dir = Path(args.status_dir)
    case_dir = Path(args.case_dir) if args.case_dir.strip() else None
    schema_ttl = Path(args.schema_ttl) if args.schema_ttl.strip() else None
    shapes_ttl = Path(args.shapes_ttl) if args.shapes_ttl.strip() else None
    out_ttl = Path(args.out)

    export_instances(
        status_dir=status_dir,
        case_dir=case_dir,
        out_ttl=out_ttl,
        schema_ttl=schema_ttl,
        shapes_ttl=shapes_ttl,
        base_iri=args.base_iri,
    )

    print("DONE")
    print(f"- out_ttl: {out_ttl}")
    if schema_ttl and schema_ttl.exists():
        print(f"- copied schema: {out_ttl.parent / schema_ttl.name}")
    if shapes_ttl and shapes_ttl.exists():
        print(f"- copied shapes: {out_ttl.parent / shapes_ttl.name}")


if __name__ == "__main__":
    main()
