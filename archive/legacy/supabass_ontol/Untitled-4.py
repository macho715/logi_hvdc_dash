#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HVDC Status(SSOT) + Warehouse(Overlay) → Supabase CSV + Ontology TTL 변환기

입력(예)
- hvdc_allshpt_status.json      # SSOT: "No"(1~830xx), "SCT SHIP NO." 포함
- hvdc_warehouse_status.json    # Overlay: "HVDC CODE", location 필드(DSV/MOSB/SHU 등) 포함

핵심 원칙
1) SSOT 전량 출력: Status 레코드 수 == shipments 출력 수 (Coverage=100.00%)
2) Warehouse는 subset overlay: WH는 이벤트 테이블로 분리 + shipments에 last WH만 overlay로 저장
3) 조인 키: hvdc_code (Status의 "SCT SHIP NO." ↔ WH의 "HVDC CODE")

출력
- out/supabase/schema.sql
- out/supabase/shipments.csv
- out/supabase/logistics_events.csv
- out/ontology/hvdc.ttl
- out/report/qa_report.md
- out/report/orphan_wh.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


# ---------- Utils ----------
def norm_key(k: str) -> str:
    return re.sub(r"\s+", " ", str(k).strip().lower())


def load_json_any(path: Path) -> Any:
    """JSON 또는 JSONL 지원"""
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        raise ValueError(f"빈 파일: {path}")

    lines = text.splitlines()
    if len(lines) > 1 and all(
        ln.strip().startswith("{") for ln in lines[: min(3, len(lines))]
    ):
        out = []
        for i, ln in enumerate(lines, 1):
            ln = ln.strip()
            if not ln:
                continue
            try:
                out.append(json.loads(ln))
            except json.JSONDecodeError as e:
                raise ValueError(f"JSONL 파싱 실패: {path} line={i} err={e}") from e
        return out

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON 파싱 실패: {path} err={e}") from e


def to_records(obj: Any) -> List[Dict[str, Any]]:
    if isinstance(obj, list):
        if not all(isinstance(x, dict) for x in obj):
            raise ValueError("리스트 내부가 dict가 아닙니다.")
        return obj
    if isinstance(obj, dict):
        for k in ["records", "rows", "data", "items", "shipments"]:
            if (
                k in obj
                and isinstance(obj[k], list)
                and all(isinstance(x, dict) for x in obj[k])
            ):
                return obj[k]
        return [obj]
    raise ValueError("지원하지 않는 JSON 최상위 타입입니다. list/dict만 지원.")


def detect_key(record: Dict[str, Any], candidates: List[str]) -> Optional[str]:
    m = {norm_key(k): k for k in record.keys()}
    for c in candidates:
        if c in m:
            return m[c]
    return None


def parse_int_maybe(v: Any) -> Optional[int]:
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    m = re.search(r"-?\d+", s.replace(",", ""))
    return int(m.group(0)) if m else None


def parse_num_maybe(v: Any) -> Optional[float]:
    """1,290.89 같은 문자열을 float로"""
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    s = s.replace(",", "")
    try:
        return float(s)
    except Exception:
        return None


def parse_date_iso_maybe(v: Any) -> Optional[date]:
    """안전한 ISO 중심: YYYY-MM-DD만 확정 파싱. (MM/DD/YYYY 등은 오해 가능 → raw로 유지)"""
    if v is None:
        return None
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    if isinstance(v, datetime):
        return v.date()
    s = str(v).strip()
    if not s:
        return None
    # YYYY-MM-DD
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        try:
            return datetime.strptime(s, "%Y-%m-%d").date()
        except Exception:
            return None
    return None


def parse_epoch_ms_date(v: Any) -> Optional[date]:
    """1739577600000 같은 epoch ms → date"""
    i = parse_int_maybe(v)
    if i is None:
        return None
    # epoch ms는 보통 10^12 수준
    if i < 10**11:
        return None
    try:
        dt = datetime.fromtimestamp(i / 1000.0, tz=timezone.utc)
        return dt.date()
    except Exception:
        return None


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def write_csv(path: Path, headers: List[str], rows: Iterable[Dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def ttl_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


# ---------- Field maps (샘플 기반 고정 + 유연 확장) ----------
STATUS_NO_KEYS = ["no", "no.", "s no", "sno", "s_no", "s-no", "s#", "s number", "s.no"]
STATUS_HVDC_KEYS = ["sct ship no.", "sct ship no", "hvdc code", "hvdc_code", "hvdc"]
STATUS_VENDOR_KEYS = ["vendor", "vender", "supplier"]
STATUS_BAND_KEYS = ["band", "brand", "maker", "oem"]

WH_HVDC_KEYS = ["hvdc code", "hvdc_code", "sct ship no.", "sct ship no"]

# WH에서 이벤트 후보로 볼 location 키들(현장/창고/포트 혼합)
# 실제 파일에 더 있으면 자동 포함(값이 날짜/epoch ms면 이벤트로 취급)
KNOWN_LOCATION_KEYS = set(
    map(
        norm_key,
        [
            "DHL Warehouse",
            "DSV Indoor",
            "DSV Al Markaz",
            "DSV Outdoor",
            "Hauler Indoor",
            "DSV MZP",
            "MOSB",
            "Shifting",
            "SHU",
            "MIR",
            "DAS",
            "AGI",
            "JDN MZD",
            "JDN Waterfront",
            "DSV Indoor Indoor",
            "DSV Kizad",
            "AAA Storage",
            "ZENER (WH)",
            "Hauler DG Storage",
            "Vijay Tanks",
        ],
    )
)

# Status/WH에서 메타 필드로 간주(이벤트 후보에서 제외)
META_KEYS = set(
    map(
        norm_key,
        [
            "no",
            "no.",
            "s no",
            "sno",
            "s_no",
            "sct ship no.",
            "sct ship no",
            "hvdc code",
            "hvdc_code",
            "mr#",
            "commercial invoice no.",
            "invoice date",
            "po no.",
            "vendor",
            "category",
            "main description (po)",
            "sub description",
            "incoterms",
            "currency",
            "coe",
            "pol",
            "pod",
            "b/l no.awb no.",
            "vessel name/ flight no.",
            "shipping line",
            "forwarder",
            "ship mode",
            "pkg",
            "qty of cntr",
            "cbm",
            "gwt(kg)",
            "etd",
            "atd",
            "eta",
            "ata",
            "flow_code",
            "flow_description",
            "final_location",
            "status_current",
            "status_location",
            "status_location_temp",
            "status_location_date",
            "status_location_date_year",
            "status_location_date_month",
            "status_storage",
        ],
    )
)


@dataclass
class ShipmentOut:
    hvdc_code: str
    status_no: Optional[int]
    vendor: Optional[str]
    band: Optional[str]
    incoterms: Optional[str]
    currency: Optional[str]
    pol: Optional[str]
    pod: Optional[str]
    bl_awb: Optional[str]
    vessel: Optional[str]
    ship_mode: Optional[str]
    pkg: Optional[int]
    qty_cntr: Optional[int]
    cbm: Optional[float]
    gwt_kg: Optional[float]
    etd: Optional[date]
    eta: Optional[date]
    ata: Optional[date]
    warehouse_flag: bool
    warehouse_last_location: Optional[str]
    warehouse_last_date: Optional[date]
    raw: Dict[str, Any]


@dataclass
class EventOut:
    event_id: str
    hvdc_code: str
    event_type: str  # WH/SITE/PORT/GEN
    location: str
    event_date: date
    source: str
    raw: Dict[str, Any]


def get_status_hvdc_code(r: Dict[str, Any]) -> str:
    k = detect_key(r, STATUS_HVDC_KEYS)
    if not k:
        raise ValueError(
            f"Status에서 HVDC 코드 키 탐지 실패. keys={list(r.keys())[:20]}"
        )
    v = str(r.get(k, "")).strip()
    if not v:
        raise ValueError("Status HVDC 코드 값이 비어 있습니다.")
    return v


def get_wh_hvdc_code(r: Dict[str, Any]) -> str:
    k = detect_key(r, WH_HVDC_KEYS)
    if not k:
        raise ValueError(f"WH에서 HVDC 코드 키 탐지 실패. keys={list(r.keys())[:20]}")
    v = str(r.get(k, "")).strip()
    if not v:
        raise ValueError("WH HVDC 코드 값이 비어 있습니다.")
    return v


def get_status_no(r: Dict[str, Any]) -> Optional[int]:
    k = detect_key(r, STATUS_NO_KEYS)
    return parse_int_maybe(r.get(k)) if k else None


def get_str(r: Dict[str, Any], keys: List[str]) -> Optional[str]:
    k = detect_key(r, keys)
    if not k:
        return None
    v = r.get(k)
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def classify_event_type(loc: str) -> str:
    n = norm_key(loc)
    if n in set(map(norm_key, ["shu", "mir", "das", "agi"])):
        return "SITE"
    if "port" in n or "mzp" in n or "jdn" in n or "mosb" in n:
        return "PORT"
    if (
        "dsv" in n
        or "warehouse" in n
        or "storage" in n
        or "markaz" in n
        or "hauler" in n
        or "zener" in n
    ):
        return "WH"
    return "GEN"


def extract_events_from_record(
    hvdc_code: str, record: Dict[str, Any], source: str
) -> List[EventOut]:
    """
    레코드 내에서 '날짜/epoch ms'로 보이는 값들을 이벤트로 변환.
    - ISO(YYYY-MM-DD) 또는 epoch ms만 확정 이벤트로 채택
    - 그 외(예: "O")는 이벤트에서 제외
    """
    events: List[EventOut] = []
    for k, v in record.items():
        nk = norm_key(k)
        if nk in META_KEYS:
            continue

        # location 후보: known list 우선 + 값이 날짜면 자동 포함
        iso_d = parse_date_iso_maybe(v)
        ep_d = parse_epoch_ms_date(v)
        d = iso_d or ep_d
        if not d:
            continue

        # location 이름은 원본 key 사용
        loc = str(k).strip()
        # event_id 결정적 생성
        safe_loc = re.sub(r"[^0-9a-zA-Z]+", "", loc)[:24]
        event_id = f"ev_{re.sub(r'[^0-9a-zA-Z]+','',hvdc_code)[:24]}_{safe_loc}_{d.isoformat()}"
        events.append(
            EventOut(
                event_id=event_id,
                hvdc_code=hvdc_code,
                event_type=classify_event_type(loc),
                location=loc,
                event_date=d,
                source=source,
                raw=record,
            )
        )

    # 날짜 오름차순
    events.sort(key=lambda x: x.event_date)
    return events


def gen_schema_sql() -> str:
    return """\
-- HVDC SSOT(Status) + Warehouse Overlay schema (Supabase/Postgres)
create extension if not exists pgcrypto;

create table if not exists public.shipments (
  hvdc_code text primary key,
  status_no bigint,
  vendor text,
  band text,
  incoterms text,
  currency text,
  pol text,
  pod text,
  bl_awb text,
  vessel text,
  ship_mode text,
  pkg integer,
  qty_cntr integer,
  cbm numeric,
  gwt_kg numeric,
  etd date,
  eta date,
  ata date,
  warehouse_flag boolean not null default false,
  warehouse_last_location text,
  warehouse_last_date date,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_status_no on public.shipments(status_no);
create index if not exists idx_shipments_vendor on public.shipments(vendor);
create index if not exists idx_shipments_band on public.shipments(band);
create index if not exists idx_shipments_wh_flag on public.shipments(warehouse_flag);

create table if not exists public.logistics_events (
  event_id text primary key,
  hvdc_code text not null references public.shipments(hvdc_code) on delete cascade,
  event_type text not null,
  location text not null,
  event_date date not null,
  source text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_hvdc on public.logistics_events(hvdc_code);
create index if not exists idx_events_date on public.logistics_events(event_date);
create index if not exists idx_events_loc on public.logistics_events(location);
"""


def write_ttl(path: Path, shipments: List[ShipmentOut], events: List[EventOut]) -> None:
    ensure_dir(path.parent)
    lines: List[str] = []
    lines.append("@prefix hvdc: <https://example.com/hvdc#> .")
    lines.append("@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .")
    lines.append("")

    for sh in shipments:
        subj = f"hvdc:Shipment_{ttl_escape(sh.hvdc_code)}"
        lines.append(f"{subj} a hvdc:Shipment ;")
        lines.append(f'  hvdc:hvdcCode "{ttl_escape(sh.hvdc_code)}" ;')
        if sh.status_no is not None:
            lines.append(f'  hvdc:statusNo "{sh.status_no}"^^xsd:integer ;')
        if sh.vendor:
            lines.append(f'  hvdc:vendor "{ttl_escape(sh.vendor)}" ;')
        if sh.band:
            lines.append(f'  hvdc:band "{ttl_escape(sh.band)}" ;')
        if sh.incoterms:
            lines.append(f'  hvdc:incoterms "{ttl_escape(sh.incoterms)}" ;')
        if sh.pol:
            lines.append(f'  hvdc:pol "{ttl_escape(sh.pol)}" ;')
        if sh.pod:
            lines.append(f'  hvdc:pod "{ttl_escape(sh.pod)}" ;')
        lines.append(
            f'  hvdc:warehouseFlag "{str(sh.warehouse_flag).lower()}"^^xsd:boolean ;'
        )
        if sh.warehouse_last_location:
            lines.append(
                f'  hvdc:warehouseLastLocation "{ttl_escape(sh.warehouse_last_location)}" ;'
            )
        if sh.warehouse_last_date:
            lines.append(
                f'  hvdc:warehouseLastDate "{sh.warehouse_last_date.isoformat()}"^^xsd:date ;'
            )
        lines.append(f'  hvdc:rawJson """{json.dumps(sh.raw, ensure_ascii=False)}""" .')
        lines.append("")

    for ev in events:
        subj = f"hvdc:Event_{ttl_escape(ev.event_id)}"
        sh_ref = f"hvdc:Shipment_{ttl_escape(ev.hvdc_code)}"
        lines.append(f"{subj} a hvdc:LogisticsEvent ;")
        lines.append(f"  hvdc:forShipment {sh_ref} ;")
        lines.append(f'  hvdc:eventType "{ttl_escape(ev.event_type)}" ;')
        lines.append(f'  hvdc:location "{ttl_escape(ev.location)}" ;')
        lines.append(f'  hvdc:eventDate "{ev.event_date.isoformat()}"^^xsd:date ;')
        lines.append(f'  hvdc:source "{ttl_escape(ev.source)}" ;')
        lines.append(f'  hvdc:rawJson """{json.dumps(ev.raw, ensure_ascii=False)}""" .')
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def write_qa_report(
    path: Path, status_in: int, ship_out: int, wh_in: int, wh_matched: int, orphan: int
) -> None:
    ensure_dir(path.parent)
    coverage = (ship_out / status_in * 100.0) if status_in else 0.0
    orphan_rate = (orphan / wh_in * 100.0) if wh_in else 0.0
    verdict = "PASS" if abs(coverage - 100.0) < 1e-9 and orphan == 0 else "FAIL"

    md = []
    md.append("# HVDC 변환 QA 리포트")
    md.append("")
    md.append(f"- Status 입력: **{status_in:.2f}**")
    md.append(f"- Shipments 출력(SSOT 전량): **{ship_out:.2f}**")
    md.append(f"- Coverage: **{coverage:.2f}%** (목표 100.00%)")
    md.append(f"- Warehouse 입력(overlay subset): **{wh_in:.2f}**")
    md.append(f"- Warehouse 매칭 성공(hvdc_code): **{wh_matched:.2f}**")
    md.append(f"- Orphan WH(매칭 실패): **{orphan:.2f}** (비율 {orphan_rate:.2f}%)")
    md.append("")
    md.append("## 판정")
    md.append(f"- 결과: **{verdict}**")
    md.append("")
    md.append("## 해석")
    md.append(
        "- Coverage != 100.00% 이면: Status 로딩/필터/파싱 오류(SSOT 전량 출력 위반)"
    )
    md.append(
        "- Orphan WH > 0.00 이면: WH의 HVDC CODE가 Status의 SCT SHIP NO.와 불일치(키 정제 필요)"
    )
    path.write_text("\n".join(md), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--status", required=True, help="hvdc_allshpt_status.json 경로")
    ap.add_argument(
        "--warehouse", required=True, help="hvdc_warehouse_status.json 경로"
    )
    ap.add_argument(
        "--outdir",
        default="../hvdc_output",
        help="출력 루트 폴더 (default: ../hvdc_output)",
    )
    args = ap.parse_args()

    status_path = Path(args.status)
    wh_path = Path(args.warehouse)
    outdir = Path(args.outdir)

    status_records = to_records(load_json_any(status_path))
    wh_records = to_records(load_json_any(wh_path))

    # Status index by hvdc_code
    status_by_code: Dict[str, Dict[str, Any]] = {}
    dup_codes = 0
    for r in status_records:
        code = get_status_hvdc_code(r)
        if code in status_by_code:
            dup_codes += 1
        status_by_code[code] = r

    # WH index by hvdc_code
    wh_by_code: Dict[str, Dict[str, Any]] = {}
    wh_dup = 0
    for r in wh_records:
        try:
            code = get_wh_hvdc_code(r)
        except Exception:
            continue
        if code in wh_by_code:
            wh_dup += 1
        wh_by_code[code] = r

    shipments: List[ShipmentOut] = []
    events: List[EventOut] = []

    orphan_wh_codes: List[str] = []
    wh_matched = 0

    # SSOT 전량 출력: status_records 전부 shipments로
    for r in status_records:
        hvdc_code = get_status_hvdc_code(r)
        status_no = get_status_no(r)

        vendor = get_str(r, ["vendor"])  # Status 샘플: "VENDOR"
        if vendor is None:
            vendor = get_str(r, STATUS_VENDOR_KEYS)

        band = get_str(
            r, STATUS_BAND_KEYS
        )  # 없으면 vendor uppercase로 대체(가정 최소화)
        if band is None and vendor:
            band = vendor.strip().upper()

        incoterms = get_str(r, ["incoterms"])
        currency = get_str(r, ["currency"])
        pol = get_str(r, ["pol"])
        pod = get_str(r, ["pod"])
        bl_awb = get_str(r, ["b/l no.awb no."])
        vessel = get_str(r, ["vessel name/ flight no."])
        ship_mode = get_str(r, ["ship mode"])

        pkg = (
            parse_int_maybe(r.get(detect_key(r, ["pkg"]) or ""))
            if detect_key(r, ["pkg"])
            else None
        )
        qty_cntr = (
            parse_int_maybe(
                r.get(
                    detect_key(r, ["qty of cntr", "qty_of cntr", "qty_of_cntr"]) or ""
                )
            )
            if detect_key(r, ["qty of cntr", "qty_of cntr", "qty_of_cntr"])
            else None
        )

        cbm = parse_num_maybe(r.get("CBM")) or parse_num_maybe(r.get("cbm"))
        gwt_kg = parse_num_maybe(r.get("GWT(KG)")) or parse_num_maybe(r.get("gwt(kg)"))

        etd = parse_date_iso_maybe(r.get("ETD"))
        eta = parse_date_iso_maybe(r.get("ETA"))
        ata = parse_date_iso_maybe(r.get("ATA"))

        # Overlay: WH record가 있으면 이벤트 생성 + last location/date
        wh_r = wh_by_code.get(hvdc_code)
        warehouse_flag = bool(wh_r is not None)

        last_loc = None
        last_dt: Optional[date] = None

        if wh_r is not None:
            wh_matched += 1
            evs = extract_events_from_record(
                hvdc_code, wh_r, source="hvdc_warehouse_status"
            )
            events.extend(evs)
            if evs:
                last_loc = evs[-1].location
                last_dt = evs[-1].event_date

            # vendor/band 보완(SSOT에 없을 때만)
            if vendor is None:
                vendor = get_str(wh_r, ["vendor"])
            if band is None and vendor:
                band = vendor.strip().upper()

        shipments.append(
            ShipmentOut(
                hvdc_code=hvdc_code,
                status_no=status_no,
                vendor=vendor,
                band=band,
                incoterms=incoterms,
                currency=currency,
                pol=pol,
                pod=pod,
                bl_awb=bl_awb,
                vessel=vessel,
                ship_mode=ship_mode,
                pkg=pkg,
                qty_cntr=qty_cntr,
                cbm=cbm,
                gwt_kg=gwt_kg,
                etd=etd,
                eta=eta,
                ata=ata,
                warehouse_flag=warehouse_flag,
                warehouse_last_location=last_loc,
                warehouse_last_date=last_dt,
                raw=r,
            )
        )

    # Orphan WH: WH에는 있는데 Status에 없는 hvdc_code
    status_codes = set(status_by_code.keys())
    wh_codes = set(wh_by_code.keys())
    orphan_wh_codes = sorted(list(wh_codes - status_codes))

    # Output paths
    supa_dir = outdir / "supabase"
    onto_dir = outdir / "ontology"
    rep_dir = outdir / "report"
    ensure_dir(supa_dir)
    ensure_dir(onto_dir)
    ensure_dir(rep_dir)

    # schema
    (supa_dir / "schema.sql").write_text(gen_schema_sql(), encoding="utf-8")

    # shipments.csv
    ship_headers = [
        "hvdc_code",
        "status_no",
        "vendor",
        "band",
        "incoterms",
        "currency",
        "pol",
        "pod",
        "bl_awb",
        "vessel",
        "ship_mode",
        "pkg",
        "qty_cntr",
        "cbm",
        "gwt_kg",
        "etd",
        "eta",
        "ata",
        "warehouse_flag",
        "warehouse_last_location",
        "warehouse_last_date",
        "raw",
    ]
    ship_rows = []
    for sh in shipments:
        ship_rows.append(
            {
                "hvdc_code": sh.hvdc_code,
                "status_no": sh.status_no if sh.status_no is not None else "",
                "vendor": sh.vendor or "",
                "band": sh.band or "",
                "incoterms": sh.incoterms or "",
                "currency": sh.currency or "",
                "pol": sh.pol or "",
                "pod": sh.pod or "",
                "bl_awb": sh.bl_awb or "",
                "vessel": sh.vessel or "",
                "ship_mode": sh.ship_mode or "",
                "pkg": sh.pkg if sh.pkg is not None else "",
                "qty_cntr": sh.qty_cntr if sh.qty_cntr is not None else "",
                "cbm": f"{sh.cbm:.4f}" if sh.cbm is not None else "",
                "gwt_kg": f"{sh.gwt_kg:.2f}" if sh.gwt_kg is not None else "",
                "etd": sh.etd.isoformat() if sh.etd else "",
                "eta": sh.eta.isoformat() if sh.eta else "",
                "ata": sh.ata.isoformat() if sh.ata else "",
                "warehouse_flag": "true" if sh.warehouse_flag else "false",
                "warehouse_last_location": sh.warehouse_last_location or "",
                "warehouse_last_date": (
                    sh.warehouse_last_date.isoformat() if sh.warehouse_last_date else ""
                ),
                "raw": json.dumps(sh.raw, ensure_ascii=False),
            }
        )
    write_csv(supa_dir / "shipments.csv", ship_headers, ship_rows)

    # events.csv
    ev_headers = [
        "event_id",
        "hvdc_code",
        "event_type",
        "location",
        "event_date",
        "source",
        "raw",
    ]
    ev_rows = []
    for ev in events:
        ev_rows.append(
            {
                "event_id": ev.event_id,
                "hvdc_code": ev.hvdc_code,
                "event_type": ev.event_type,
                "location": ev.location,
                "event_date": ev.event_date.isoformat(),
                "source": ev.source,
                "raw": json.dumps(ev.raw, ensure_ascii=False),
            }
        )
    write_csv(supa_dir / "logistics_events.csv", ev_headers, ev_rows)

    # TTL
    write_ttl(onto_dir / "hvdc.ttl", shipments, events)

    # QA
    write_qa_report(
        rep_dir / "qa_report.md",
        status_in=len(status_records),
        ship_out=len(shipments),
        wh_in=len(wh_records),
        wh_matched=wh_matched,
        orphan=len(orphan_wh_codes),
    )
    (rep_dir / "orphan_wh.json").write_text(
        json.dumps({"orphan_hvdc_code": orphan_wh_codes}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("DONE")
    print(f"- {supa_dir / 'schema.sql'}")
    print(f"- {supa_dir / 'shipments.csv'}")
    print(f"- {supa_dir / 'logistics_events.csv'}")
    print(f"- {onto_dir / 'hvdc.ttl'}")
    print(f"- {rep_dir / 'qa_report.md'}")
    print(f"- {rep_dir / 'orphan_wh.json'}")
    if dup_codes > 0 or wh_dup > 0:
        print(
            f"WARNING: duplicate hvdc_code detected. status_dups={dup_codes}, wh_dups={wh_dup}"
        )


if __name__ == "__main__":
    main()
