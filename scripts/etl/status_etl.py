#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[Dashboard-Ready FULL] Untitled-4 (Status SSOT 레이어)
HVDC Status(SSOT) + Warehouse(Overlay) → Supabase CSV(status.*) + OPS TTL + QA/매핑 리포트

입력(예)
- HVDC_all_status.json           # SSOT: "No"(1~830xx), "SCT SHIP NO." 포함
- hvdc_warehouse_status.json     # Overlay(케이스 단위): "HVDC CODE" + location date 필드 포함
- (옵션) supabase/data/output/optionC/locations.csv  # Option-C locations 디멘전 (location_code, name, ...)

핵심 원칙
1) SSOT 전량 출력: Status 레코드 수 == shipments_status 출력 수 (Coverage=100.00%)
2) Warehouse는 subset overlay: WH json(케이스 단위)을 hvdc_code 기준으로 집계(가벼운 이벤트/마지막 위치만)
3) 조인 키: hvdc_code (Status의 "SCT SHIP NO." ↔ WH의 "HVDC CODE")
4) 대시보드 호환: events_status에 location_code(Option-C locations와 join 가능) 포함

출력(기본: out/)
- out/supabase/schema.sql
- out/supabase/shipments_status.csv
- out/supabase/events_status.csv
- out/supabase/shipments.csv              (호환용 복제본)
- out/supabase/logistics_events.csv        (호환용 복제본)
- out/ontology/hvdc_ops_status.ttl         (OPS TTL, 기본 ON)
- out/ontology/hvdc.ttl                    (legacy TTL, 기본 ON)
- out/report/qa_report.md
- out/report/orphan_wh.json

출력(옵션: --case-locations 사용 시)
- out/report/status_locations_distinct.csv
- out/report/location_match_map.csv
- out/report/location_unmatched.json
- out/report/location_match_report.md

주의
- 날짜 파싱은 안전 우선: ISO(YYYY-MM-DD) 또는 epoch(ms)만 이벤트로 확정 채택
- Status의 MM/DD/YYYY는 raw에 남기고 typed(date)로는 사용하지 않음(오해 방지)
"""

from __future__ import annotations

import argparse
import csv
import difflib
import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


# -----------------------------
# Utils
# -----------------------------
def norm_key(k: str) -> str:
    return re.sub(r"\s+", " ", str(k).strip().lower())


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def load_json_any(path: Path) -> Any:
    """JSON 또는 JSONL 지원"""
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        raise ValueError(f"빈 파일: {path}")

    lines = text.splitlines()
    # JSONL로 간주: 처음 몇 줄이 모두 { 로 시작하면
    if len(lines) > 1 and all(ln.strip().startswith("{") for ln in lines[: min(3, len(lines))]):
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
            if k in obj and isinstance(obj[k], list) and all(isinstance(x, dict) for x in obj[k]):
                return obj[k]
        return [obj]
    raise ValueError("지원하지 않는 JSON 최상위 타입입니다. list/dict만 지원.")


def detect_key(record: Dict[str, Any], candidates_norm: List[str]) -> Optional[str]:
    m = {norm_key(k): k for k in record.keys()}
    for c in candidates_norm:
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
    """안전한 ISO 중심: YYYY-MM-DD만 확정 파싱"""
    if v is None:
        return None
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    if isinstance(v, datetime):
        return v.date()
    s = str(v).strip()
    if not s:
        return None
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
    if i < 10**11:
        return None
    try:
        dt = datetime.fromtimestamp(i / 1000.0, tz=timezone.utc)
        return dt.date()
    except Exception:
        return None


def write_csv(path: Path, headers: List[str], rows: Iterable[Dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def ttl_escape(s: str) -> str:
    return str(s).replace("\\", "\\\\").replace('"', '\\"')


def _slug_token(value: str) -> str:
    s = str(value).strip()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^0-9A-Za-z._\\-]+", "-", s)
    return s[:180] if len(s) > 180 else s


def _iri(base_iri: str, *parts: str) -> str:
    base = base_iri.rstrip("/")
    return base + "/" + "/".join(_slug_token(p) for p in parts)


# -----------------------------
# Field candidates
# -----------------------------
STATUS_NO_KEYS = list(map(norm_key, ["No", "no.", "S No", "SNO", "S_No", "S-No", "S#", "S Number", "S.No"]))
STATUS_HVDC_KEYS = list(map(norm_key, ["SCT SHIP NO.", "SCT SHIP NO", "HVDC CODE", "hvdc_code", "hvdc"]))
STATUS_VENDOR_KEYS = list(map(norm_key, ["VENDOR", "Vendor", "Supplier"]))
STATUS_BAND_KEYS = list(map(norm_key, ["BAND", "Band", "BRAND", "Brand", "Maker", "OEM"]))

WH_HVDC_KEYS = list(map(norm_key, ["HVDC CODE", "hvdc_code", "SCT SHIP NO.", "SCT SHIP NO"]))

# Status/WH에서 메타(이벤트 후보에서 제외)
META_KEYS = set(map(norm_key, [
    "No", "no.", "S No", "SNO", "S_No", "SCT SHIP NO.", "SCT SHIP NO", "HVDC CODE", "hvdc_code",
    "MR#", "COMMERCIAL INVOICE No.", "INVOICE Date", "PO No.", "VENDOR", "Vendor",
    "CATEGORY", "MAIN DESCRIPTION (PO)", "SUB DESCRIPTION",
    "INCOTERMS", "CURRENCY", "COE", "POL", "POD",
    "B/L No.AWB No.", "VESSEL NAME/ FLIGHT No.", "SHIPPING LINE", "FORWARDER",
    "SHIP MODE", "PKG", "QTY OF CNTR", "CBM", "GWT(KG)",
    "ETD", "ATD", "ETA", "ATA",
    # WH record meta
    "Shipment Invoice No.", "Shipment Invoice No", "HVDC CODE", "Site", "EQ No", "EQ No.", "Case No.", "Case No",
    "Pkg", "Storage", "Description", "L(CM)", "W(CM)", "H(CM)", "CBM", "N.W(kgs)", "G.W(kgs)", "Stack", "stack status",
    "HS Code", "Currency", "Price", "Vessel", "COE", "POL", "POD", "ETD/ATD", "ETA/ATA",
    "Status_WAREHOUSE", "Status_SITE", "Status_Current", "Status_Location_Temp", "Status_Location",
    "Status_Location_Date", "Status_Location_Date_Year", "Status_Location_Date_Month",
    "Status_Storage", "wh_handling_legacy", "site handling", "total handling", "minus", "final handling", "SQM",
    "stack status2", "Status_Location_YearMonth",
    "Vendor", "site_handling_original", "total_handling_original", "wh_handling_original",
    "FLOW_CODE", "FLOW_DESCRIPTION", "Final_Location",
]))


# -----------------------------
# Location mapping (StatusEvent.location -> case.locations.location_code)
# -----------------------------
def _norm_loc_text(s: str) -> str:
    s = str(s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    # 괄호/슬래시/언더스코어 등 정규화(대시보드 매칭용)
    s = s.replace("_", " ")
    s = s.replace("/", " ")
    s = re.sub(r"[()]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


class LocationMapper:
    """
    case.locations.csv 기준으로 StatusEvent.location(문자열)을 location_code로 매핑
    - locations.csv 컬럼 예상: location_code, name, hvdc_node
    """

    def __init__(self, locations_csv: Optional[Path], alias_json: Optional[Path] = None):
        self.locations_csv = locations_csv
        self.alias_json = alias_json
        self.enabled = False

        self.code_norm_to_code: Dict[str, str] = {}
        self.name_norm_to_code: Dict[str, str] = {}
        self.node_norm_to_code: Dict[str, str] = {}
        self.alias_norm_to_code: Dict[str, str] = {}

        # 후보 리스트(퍼지 매칭)
        self._name_candidates: List[Tuple[str, str]] = []  # (name_norm, code)

        if locations_csv and locations_csv.exists():
            self._load_locations(locations_csv)
            self.enabled = True

        # built-in alias (현장 데이터에서 자주 나오는 변형)
        builtin_alias = {
            "dsv indoor indoor": "DSV_INDOOR",
            "dsv indoor": "DSV_INDOOR",
            "dsv outdoor": "DSV_OUTDOOR",
            "dsv al markaz": "DSV_AL_MARKAZ",
            "dsv mzp": "DSV_MZP",
            "dsv mzd": "DSV_MZP",
            "dhl warehouse": "DHL_WAREHOUSE",
            "zener wh": "ZENER_WH",
            "zener": "ZENER_WH",
            "zener (wh)": "ZENER_WH",
            "aaa storage": "AAA_STORAGE",
            "hauler indoor": "HAULER_INDOOR",
            "hauler dg storage": "HAULER_DG_STORAGE",
            "vijay tanks": "VIJAY_TANKS",
            "jdn mzd": "JDN_MZD",
            "jdn waterfront": "JDN_WATERFRONT",
            "mosb": "MOSB",
            "shifting": "SHIFTING",
            "shu": "SHU",
            "mir": "MIR",
            "das": "DAS",
            "agi": "AGI",
            "khalifa port": "KHALIFA_PORT",
            "mina zayed": "MINA_ZAYED",
        }
        for k, v in builtin_alias.items():
            self.alias_norm_to_code[_norm_loc_text(k)] = v

        # user alias json
        if alias_json and alias_json.exists():
            self._load_alias_json(alias_json)

    def _load_locations(self, path: Path) -> None:
        with path.open("r", encoding="utf-8", errors="replace", newline="") as f:
            r = csv.DictReader(f)
            for row in r:
                code = str(row.get("location_code") or "").strip()
                name = str(row.get("name") or "").strip()
                node = str(row.get("hvdc_node") or "").strip()
                if not code:
                    continue
                self.code_norm_to_code[_norm_loc_text(code)] = code
                if name:
                    nn = _norm_loc_text(name)
                    self.name_norm_to_code[nn] = code
                    self._name_candidates.append((nn, code))
                if node:
                    self.node_norm_to_code[_norm_loc_text(node)] = code

    def _load_alias_json(self, path: Path) -> None:
        """
        지원 포맷:
        - {"DSV Indoor Indoor":"DSV_INDOOR", ...}
        """
        try:
            obj = json.loads(path.read_text(encoding="utf-8", errors="replace"))
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if not k or not v:
                        continue
                    self.alias_norm_to_code[_norm_loc_text(k)] = str(v).strip()
        except Exception:
            return

    def map(self, location_text: str) -> Tuple[Optional[str], str, float]:
        """
        반환: (location_code, method, score)
        method:
          - NONE (mapper disabled)
          - ALIAS / CODE_EXACT / NAME_EXACT / NODE_EXACT / NAME_SUBSTRING / NAME_SIMILARITY / UNMATCHED
        """
        if not self.enabled:
            return (None, "NONE", 0.0)

        k = _norm_loc_text(location_text)
        if not k:
            return (None, "UNMATCHED", 0.0)

        # 1) alias
        if k in self.alias_norm_to_code:
            return (self.alias_norm_to_code[k], "ALIAS", 1.0)

        # 2) exact code
        if k in self.code_norm_to_code:
            return (self.code_norm_to_code[k], "CODE_EXACT", 1.0)

        # 3) exact name
        if k in self.name_norm_to_code:
            return (self.name_norm_to_code[k], "NAME_EXACT", 1.0)

        # 4) exact node
        if k in self.node_norm_to_code:
            return (self.node_norm_to_code[k], "NODE_EXACT", 1.0)

        # 5) substring match (가장 긴 name_norm)
        best_code = None
        best_len = 0
        for nn, code in self._name_candidates:
            if not nn:
                continue
            if nn in k or k in nn:
                if len(nn) > best_len:
                    best_len = len(nn)
                    best_code = code
        if best_code:
            score = min(0.99, max(0.50, best_len / max(len(k), 1)))
            return (best_code, "NAME_SUBSTRING", float(score))

        # 6) similarity (SequenceMatcher)
        best_ratio = 0.0
        best_code2 = None
        for nn, code in self._name_candidates:
            r = difflib.SequenceMatcher(None, k, nn).ratio()
            if r > best_ratio:
                best_ratio = r
                best_code2 = code
        if best_code2 and best_ratio >= 0.85:
            return (best_code2, "NAME_SIMILARITY", float(best_ratio))

        return (None, "UNMATCHED", 0.0)


# -----------------------------
# Output models
# -----------------------------
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
    warehouse_last_location_code: Optional[str]
    warehouse_last_date: Optional[date]
    raw: Dict[str, Any]


@dataclass
class EventOut:
    event_id: str
    hvdc_code: str
    event_type: str  # WH/SITE/PORT/GEN
    location: str
    location_code: Optional[str]
    location_match_method: Optional[str]
    location_match_score: Optional[float]
    event_date: date
    source: str
    raw: Dict[str, Any]


# -----------------------------
# Extractors
# -----------------------------
def get_status_hvdc_code(r: Dict[str, Any]) -> str:
    k = detect_key(r, STATUS_HVDC_KEYS)
    if not k:
        raise ValueError(f"Status에서 HVDC 코드 키 탐지 실패. keys={list(r.keys())[:20]}")
    v = str(r.get(k, "")).strip()
    if not v:
        raise ValueError("Status HVDC 코드 값이 비어 있습니다.")
    return v


def get_wh_hvdc_code(r: Dict[str, Any]) -> Optional[str]:
    k = detect_key(r, WH_HVDC_KEYS)
    if not k:
        return None
    v = str(r.get(k, "")).strip()
    return v if v else None


def get_status_no(r: Dict[str, Any]) -> Optional[int]:
    k = detect_key(r, STATUS_NO_KEYS)
    return parse_int_maybe(r.get(k)) if k else None


def get_str(r: Dict[str, Any], keys_norm: List[str]) -> Optional[str]:
    k = detect_key(r, keys_norm)
    if not k:
        return None
    v = r.get(k)
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def classify_event_type(loc: str) -> str:
    n = norm_key(loc)
    # SITE
    if n in set(map(norm_key, ["SHU", "MIR", "DAS", "AGI"])):
        return "SITE"
    # PORT/MOSB/TRANSIT(단순 분류)
    if "port" in n or "mzp" in n or "jdn" in n or "mosb" in n:
        return "PORT"
    # WAREHOUSE 계열
    if ("dsv" in n) or ("warehouse" in n) or ("storage" in n) or ("markaz" in n) or ("hauler" in n) or ("zener" in n):
        return "WH"
    return "GEN"


def extract_location_dates_from_wh_row(row: Dict[str, Any]) -> List[Tuple[str, date]]:
    """
    WH(케이스 단위) row에서 (location_key, date) 목록을 추출.
    - ISO(YYYY-MM-DD) 또는 epoch(ms)만 이벤트로 인정
    """
    out: List[Tuple[str, date]] = []
    for k, v in row.items():
        nk = norm_key(k)
        if nk in META_KEYS:
            continue
        d = parse_date_iso_maybe(v) or parse_epoch_ms_date(v)
        if not d:
            continue
        loc = str(k).strip()
        if not loc:
            continue
        out.append((loc, d))
    return out


# -----------------------------
# DDL generator (status schema)
# -----------------------------
def gen_schema_sql() -> str:
    return """\
-- Dashboard-Ready FULL (status schema)
create schema if not exists status;

create table if not exists status.shipments_status (
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
  warehouse_last_location_code text,
  warehouse_last_date date,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_status_no on status.shipments_status(status_no);
create index if not exists idx_shipments_vendor on status.shipments_status(vendor);
create index if not exists idx_shipments_band on status.shipments_status(band);
create index if not exists idx_shipments_whflag on status.shipments_status(warehouse_flag);

create table if not exists status.events_status (
  event_id text primary key,
  hvdc_code text not null references status.shipments_status(hvdc_code) on delete cascade,
  event_type text not null,
  location text not null,
  location_code text,
  location_match_method text,
  location_match_score numeric,
  event_date date not null,
  source text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_hvdc on status.events_status(hvdc_code);
create index if not exists idx_events_date on status.events_status(event_date);
create index if not exists idx_events_loc_code on status.events_status(location_code);

-- If you already created tables before, apply incremental alters:
alter table status.shipments_status add column if not exists warehouse_last_location_code text;
alter table status.events_status add column if not exists location_code text;
alter table status.events_status add column if not exists location_match_method text;
alter table status.events_status add column if not exists location_match_score numeric;
"""


# -----------------------------
# TTL writers
# -----------------------------
def write_legacy_ttl(path: Path, shipments: List[ShipmentOut], events: List[EventOut]) -> None:
    """
    기존 hvdc.ttl 호환(간단)
    """
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
        lines.append(f'  hvdc:warehouseFlag "{str(sh.warehouse_flag).lower()}"^^xsd:boolean ;')
        if sh.warehouse_last_location:
            lines.append(f'  hvdc:warehouseLastLocation "{ttl_escape(sh.warehouse_last_location)}" ;')
        if sh.warehouse_last_date:
            lines.append(f'  hvdc:warehouseLastDate "{sh.warehouse_last_date.isoformat()}"^^xsd:date ;')
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


def write_ops_ttl_status(path: Path, shipments: List[ShipmentOut], events: List[EventOut], base_iri: str, locations_csv: Optional[Path]) -> None:
    """
    OPS TTL (hvdc_ops_ontology.ttl 정렬) — Status 레이어 인스턴스
    - Location 인스턴스(옵션): locations_csv가 있으면 함께 출력
    - StatusEvent는 locationText 유지 + 매핑되면 hvdc:atLocation 링크 추가
    """
    ensure_dir(path.parent)
    hvdc_ns = base_iri.rstrip("/") + "#"

    # load locations rows for instance export
    loc_rows: List[Dict[str, str]] = []
    if locations_csv and locations_csv.exists():
        with locations_csv.open("r", encoding="utf-8", errors="replace", newline="") as f:
            loc_rows = list(csv.DictReader(f))

    lines: List[str] = []
    lines.append(f"@prefix hvdc: <{hvdc_ns}> .")
    lines.append("@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .")
    lines.append("")
    lines.append("# Instance data (Status SSOT layer)")
    lines.append("")

    # Locations
    for r in loc_rows:
        code = str(r.get("location_code") or "").strip()
        if not code:
            continue
        loc_iri = f"<{_iri(base_iri, 'Location', code)}>"
        lines.append(f"{loc_iri} a hvdc:Location ;")
        lines.append(f'  hvdc:locationCode "{ttl_escape(code)}" ;')
        name = str(r.get("name") or "").strip()
        if name:
            lines.append(f'  hvdc:locationName "{ttl_escape(name)}" ;')
        cat = str(r.get("category") or "").strip()
        if cat:
            lines.append(f'  hvdc:locationCategory "{ttl_escape(cat)}" ;')
        node = str(r.get("hvdc_node") or "").strip()
        if node:
            lines.append(f'  hvdc:hvdcNode "{ttl_escape(node)}" ;')
        # bools
        for k, pred in [("is_mosb","hvdc:isMosb"),("is_site","hvdc:isSite"),("is_port","hvdc:isPort"),("active","hvdc:active")]:
            v = str(r.get(k) or "").strip().lower()
            if v in ("true","false","1","0","yes","no","y","n","t","f"):
                b = "true" if v in ("true","1","yes","y","t") else "false"
                lines.append(f'  {pred} "{b}"^^xsd:boolean ;')
        lines[-1] = lines[-1].rstrip(" ;") + " ."
        lines.append("")

    # Shipments
    for sh in shipments:
        ship_iri = f"<{_iri(base_iri, 'Shipment', sh.hvdc_code)}>"
        lines.append(f"{ship_iri} a hvdc:Shipment ;")
        lines.append(f'  hvdc:hvdcCode "{ttl_escape(sh.hvdc_code)}" ;')
        if sh.status_no is not None:
            lines.append(f'  hvdc:statusNo "{int(sh.status_no)}"^^xsd:integer ;')
        if sh.vendor:
            lines.append(f'  hvdc:vendor "{ttl_escape(sh.vendor)}" ;')
        if sh.band:
            lines.append(f'  hvdc:band "{ttl_escape(sh.band)}" ;')
        if sh.incoterms:
            lines.append(f'  hvdc:incoterms "{ttl_escape(sh.incoterms)}" ;')
        if sh.currency:
            lines.append(f'  hvdc:currency "{ttl_escape(sh.currency)}" ;')
        if sh.pol:
            lines.append(f'  hvdc:pol "{ttl_escape(sh.pol)}" ;')
        if sh.pod:
            lines.append(f'  hvdc:pod "{ttl_escape(sh.pod)}" ;')
        lines.append(f'  hvdc:warehouseFlag "{str(sh.warehouse_flag).lower()}"^^xsd:boolean ;')
        if sh.warehouse_last_location:
            lines.append(f'  hvdc:warehouseLastLocation "{ttl_escape(sh.warehouse_last_location)}" ;')
        if sh.warehouse_last_date:
            lines.append(f'  hvdc:warehouseLastDate "{sh.warehouse_last_date.isoformat()}"^^xsd:date ;')
        lines.append(f'  hvdc:rawJson """{json.dumps(sh.raw, ensure_ascii=False)}""" .')
        lines.append("")

    # Events
    for ev in events:
        ev_iri = f"<{_iri(base_iri, 'StatusEvent', ev.event_id)}>"
        ship_iri = f"<{_iri(base_iri, 'Shipment', ev.hvdc_code)}>"
        lines.append(f"{ev_iri} a hvdc:StatusEvent ;")
        lines.append(f'  hvdc:eventId "{ttl_escape(ev.event_id)}" ;')
        lines.append(f'  hvdc:eventType "{ttl_escape(ev.event_type)}" ;')
        lines.append(f'  hvdc:eventDate "{ev.event_date.isoformat()}"^^xsd:date ;')
        lines.append(f'  hvdc:sourceSystem "{ttl_escape(ev.source)}" ;')
        if ev.location:
            lines.append(f'  hvdc:locationText "{ttl_escape(ev.location)}" ;')
        if ev.location_code:
            loc_iri = f"<{_iri(base_iri, 'Location', ev.location_code)}>"
            lines.append(f"  hvdc:atLocation {loc_iri} ;")
        lines.append(f"  hvdc:forShipment {ship_iri} ;")
        lines.append(f'  hvdc:rawJson """{json.dumps(ev.raw, ensure_ascii=False)}""" .')
        lines.append("")
        # link from Shipment
        lines.append(f"{ship_iri} hvdc:hasStatusEvent {ev_iri} .")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


# -----------------------------
# Reports
# -----------------------------
def write_qa_report(path: Path, status_in: int, ship_out: int, wh_in: int, wh_matched: int, orphan: int) -> None:
    ensure_dir(path.parent)
    coverage = (ship_out / status_in * 100.0) if status_in else 0.0
    orphan_rate = (orphan / wh_in * 100.0) if wh_in else 0.0
    verdict = "PASS" if abs(coverage - 100.0) < 1e-9 else "FAIL"

    md = []
    md.append("# HVDC Status(SSOT) 변환 QA 리포트")
    md.append("")
    md.append(f"- Status 입력: **{status_in:.2f}**")
    md.append(f"- Shipments 출력(SSOT 전량): **{ship_out:.2f}**")
    md.append(f"- Coverage: **{coverage:.2f}%** (목표 100.00%)")
    md.append(f"- Warehouse 입력(row): **{wh_in:.2f}** (케이스 단위 row)")
    md.append(f"- Warehouse 매칭 성공(hvdc_code): **{wh_matched:.2f}**")
    md.append(f"- Orphan WH(매칭 실패 hvdc_code): **{orphan:.2f}** (비율 {orphan_rate:.2f}%)")
    md.append("")
    md.append("## 판정")
    md.append(f"- 결과: **{verdict}**")
    md.append("")
    md.append("## 해석")
    md.append("- Coverage != 100.00% 이면: Status 로딩/필터/파싱 오류(SSOT 전량 출력 위반)")
    md.append("- Orphan WH > 0.00 이면: WH의 HVDC CODE가 Status의 SCT SHIP NO.와 불일치(키 정제 필요)")
    path.write_text("\n".join(md), encoding="utf-8")


def write_location_match_reports(rep_dir: Path, distinct_counts: Dict[str, int], mapped: Dict[str, Tuple[Optional[str], str, float]]) -> None:
    """
    distinct_counts: location_text -> count(events)
    mapped: location_text -> (location_code, method, score)
    """
    ensure_dir(rep_dir)

    total_distinct = len(distinct_counts)
    total_events = sum(distinct_counts.values())

    matched_distinct = 0
    matched_events = 0
    unmatched: List[Tuple[str, int]] = []

    rows = []
    for loc, cnt in sorted(distinct_counts.items(), key=lambda x: (-x[1], x[0])):
        code, method, score = mapped.get(loc, (None, "UNMATCHED", 0.0))
        ok = bool(code)
        if ok:
            matched_distinct += 1
            matched_events += cnt
        else:
            unmatched.append((loc, cnt))
        rows.append({
            "location_text": loc,
            "count": cnt,
            "location_code": code or "",
            "match_method": method,
            "match_score": f"{score:.4f}",
        })

    write_csv(rep_dir / "status_locations_distinct.csv",
              ["location_text", "count"],
              [{"location_text": k, "count": v} for k, v in sorted(distinct_counts.items(), key=lambda x: (-x[1], x[0]))])

    write_csv(rep_dir / "location_match_map.csv",
              ["location_text", "count", "location_code", "match_method", "match_score"],
              rows)

    (rep_dir / "location_unmatched.json").write_text(
        json.dumps([{"location_text": x, "count": c} for x, c in unmatched], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    match_rate = (matched_events / total_events * 100.0) if total_events else 0.0
    md = []
    md.append("# StatusEvent Location 매핑 리포트")
    md.append("")
    md.append(f"- distinct location_text: **{total_distinct:.2f}**")
    md.append(f"- matched distinct: **{matched_distinct:.2f}**")
    md.append(f"- total events: **{total_events:.2f}**")
    md.append(f"- matched events: **{matched_events:.2f}**")
    md.append(f"- match rate(events): **{match_rate:.2f}%**")
    md.append("")
    md.append("## 미매핑 Top 20 (count 기준)")
    md.append("")
    top20 = unmatched[:20]
    if not top20:
        md.append("- 없음")
    else:
        for loc, cnt in top20:
            md.append(f"- {loc} : {cnt}")
    md.append("")
    md.append("## 조치 가이드")
    md.append("- locations.csv의 name/location_code를 확인하고, alias JSON으로 수동 매핑을 보강할 수 있습니다.")
    md.append("  - 예: {\"DSV Indoor Indoor\":\"DSV_INDOOR\"}")
    (rep_dir / "location_match_report.md").write_text("\n".join(md), encoding="utf-8")


# -----------------------------
# Main
# -----------------------------
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--status", required=True, help="HVDC all status JSON 경로")
    ap.add_argument("--warehouse", required=True, help="HVDC warehouse status JSON 경로(케이스 단위)")
    ap.add_argument("--outdir", default="out", help="출력 폴더 (default: out)")
    ap.add_argument("--base-iri", default="https://example.com/hvdc", help="OPS TTL instance base IRI (no #).")
    ap.add_argument("--case-locations", default="", help="Option-C locations.csv 경로(있으면 StatusEvent location_code 매핑 + atLocation 생성).")
    ap.add_argument("--location-alias-json", default="", help="(옵션) locationText->location_code alias JSON 경로")
    ap.add_argument("--no-ops-ttl", action="store_true", help="OPS TTL(hvdc_ops_status.ttl) 생성 비활성화")
    ap.add_argument("--no-legacy-ttl", action="store_true", help="legacy hvdc.ttl 생성 비활성화")
    args = ap.parse_args()

    status_path = Path(args.status).expanduser().resolve()
    wh_path = Path(args.warehouse).expanduser().resolve()
    outdir = Path(args.outdir).expanduser().resolve()

    locations_csv = Path(args.case_locations).expanduser().resolve() if args.case_locations else None
    alias_json = Path(args.location_alias_json).expanduser().resolve() if args.location_alias_json else None

    # LocationMapper 준비(있으면)
    mapper = LocationMapper(locations_csv=locations_csv, alias_json=alias_json)

    status_records = to_records(load_json_any(status_path))
    wh_records = to_records(load_json_any(wh_path))

    # Status: hvdc_code index(중복은 마지막 값 유지)
    status_by_code: Dict[str, Dict[str, Any]] = {}
    status_dups = 0
    for r in status_records:
        code = get_status_hvdc_code(r)
        if code in status_by_code:
            status_dups += 1
        status_by_code[code] = r

    # WH: hvdc_code -> rows (케이스 단위 다건)
    wh_by_code: Dict[str, List[Dict[str, Any]]] = {}
    wh_rows_skipped = 0
    for r in wh_records:
        code = get_wh_hvdc_code(r)
        if not code:
            wh_rows_skipped += 1
            continue
        wh_by_code.setdefault(code, []).append(r)

    # WH 집계 이벤트: (hvdc_code, location_text) -> min_date, max_date, count
    agg_min: Dict[Tuple[str, str], date] = {}
    agg_max: Dict[Tuple[str, str], date] = {}
    agg_cnt: Dict[Tuple[str, str], int] = {}

    # hvdc_code별 last event (max date)
    last_by_code: Dict[str, Tuple[date, str]] = {}  # hvdc_code -> (date, location_text)

    for code, rows in wh_by_code.items():
        for row in rows:
            for loc, d in extract_location_dates_from_wh_row(row):
                key = (code, loc)
                # min
                if key not in agg_min or d < agg_min[key]:
                    agg_min[key] = d
                # max
                if key not in agg_max or d > agg_max[key]:
                    agg_max[key] = d
                agg_cnt[key] = agg_cnt.get(key, 0) + 1

                # last per hvdc_code
                if code not in last_by_code or d > last_by_code[code][0]:
                    last_by_code[code] = (d, loc)

    # Events_status 생성(집계: location별 "min date"를 event_date로 사용)
    events: List[EventOut] = []
    distinct_loc_counts: Dict[str, int] = {}

    for (code, loc), min_d in agg_min.items():
        max_d = agg_max.get((code, loc), min_d)
        cnt = agg_cnt.get((code, loc), 1)
        distinct_loc_counts[loc] = distinct_loc_counts.get(loc, 0) + cnt

        # location_code mapping
        loc_code, method, score = mapper.map(loc)

        safe_code = re.sub(r"[^0-9A-Za-z]+", "", code)[:24]
        safe_loc = re.sub(r"[^0-9A-Za-z]+", "", loc)[:24]
        event_id = f"sev_{safe_code}_{safe_loc}_{min_d.isoformat()}"
        events.append(EventOut(
            event_id=event_id,
            hvdc_code=code,
            event_type=classify_event_type(loc),
            location=loc,
            location_code=loc_code,
            location_match_method=method,
            location_match_score=score,
            event_date=min_d,
            source="warehouse_overlay(min)",
            raw={"agg": "min", "max_date": max_d.isoformat(), "count": cnt, "field": loc},
        ))

    # 정렬: hvdc_code, event_date
    events.sort(key=lambda x: (x.hvdc_code, x.event_date, x.location))

    # Shipments_status 생성(SSOT 전량)
    shipments: List[ShipmentOut] = []
    for r in status_records:
        hvdc_code = get_status_hvdc_code(r)
        status_no = get_status_no(r)

        vendor = get_str(r, STATUS_VENDOR_KEYS)
        band = get_str(r, STATUS_BAND_KEYS)

        incoterms = get_str(r, list(map(norm_key, ["INCOTERMS"])))
        currency = get_str(r, list(map(norm_key, ["CURRENCY"])))
        pol = get_str(r, list(map(norm_key, ["POL"])))
        pod = get_str(r, list(map(norm_key, ["POD"])))
        bl_awb = get_str(r, list(map(norm_key, ["B/L No.AWB No.", "B/L No.AWB No"])))
        vessel = get_str(r, list(map(norm_key, ["VESSEL NAME/ FLIGHT No.", "VESSEL NAME/\\nFLIGHT No.", "VESSEL NAME/ FLIGHT No"])))
        ship_mode = get_str(r, list(map(norm_key, ["SHIP MODE"])))

        # 숫자/날짜 필드
        pkg = parse_int_maybe(r.get(detect_key(r, [norm_key("PKG")]) or "")) if detect_key(r, [norm_key("PKG")]) else parse_int_maybe(r.get("PKG"))
        qty_cntr = parse_int_maybe(r.get(detect_key(r, [norm_key("QTY OF CNTR")]) or "")) if detect_key(r, [norm_key("QTY OF CNTR")]) else parse_int_maybe(r.get("QTY OF CNTR"))
        cbm = parse_num_maybe(r.get(detect_key(r, [norm_key("CBM")]) or "")) if detect_key(r, [norm_key("CBM")]) else parse_num_maybe(r.get("CBM"))
        gwt_kg = parse_num_maybe(r.get(detect_key(r, [norm_key("GWT(KG)")]) or "")) if detect_key(r, [norm_key("GWT(KG)")]) else parse_num_maybe(r.get("GWT(KG)"))

        etd = parse_date_iso_maybe(r.get(detect_key(r, [norm_key("ETD")]) or "")) if detect_key(r, [norm_key("ETD")]) else parse_date_iso_maybe(r.get("ETD"))
        eta = parse_date_iso_maybe(r.get(detect_key(r, [norm_key("ETA")]) or "")) if detect_key(r, [norm_key("ETA")]) else parse_date_iso_maybe(r.get("ETA"))
        ata = parse_date_iso_maybe(r.get(detect_key(r, [norm_key("ATA")]) or "")) if detect_key(r, [norm_key("ATA")]) else parse_date_iso_maybe(r.get("ATA"))

        warehouse_flag = hvdc_code in wh_by_code and hvdc_code in last_by_code
        last_loc = last_by_code[hvdc_code][1] if warehouse_flag else None
        last_dt = last_by_code[hvdc_code][0] if warehouse_flag else None
        last_loc_code, _, _ = mapper.map(last_loc) if (last_loc and mapper.enabled) else (None, "NONE", 0.0)

        shipments.append(ShipmentOut(
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
            warehouse_last_location_code=last_loc_code,
            warehouse_last_date=last_dt,
            raw=r,
        ))

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

    # schema.sql
    (supa_dir / "schema.sql").write_text(gen_schema_sql(), encoding="utf-8")

    # shipments_status.csv
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
        "warehouse_last_location_code",
        "warehouse_last_date",
        "raw",
    ]
    ship_rows = []
    for sh in shipments:
        ship_rows.append({
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
            "warehouse_last_location_code": sh.warehouse_last_location_code or "",
            "warehouse_last_date": sh.warehouse_last_date.isoformat() if sh.warehouse_last_date else "",
            "raw": json.dumps(sh.raw, ensure_ascii=False),
        })
    write_csv(supa_dir / "shipments_status.csv", ship_headers, ship_rows)

    # events_status.csv
    ev_headers = [
        "event_id",
        "hvdc_code",
        "event_type",
        "location",
        "location_code",
        "location_match_method",
        "location_match_score",
        "event_date",
        "source",
        "raw",
    ]
    ev_rows = []
    for ev in events:
        ev_rows.append({
            "event_id": ev.event_id,
            "hvdc_code": ev.hvdc_code,
            "event_type": ev.event_type,
            "location": ev.location,
            "location_code": ev.location_code or "",
            "location_match_method": ev.location_match_method or "",
            "location_match_score": f"{(ev.location_match_score or 0.0):.4f}",
            "event_date": ev.event_date.isoformat(),
            "source": ev.source,
            "raw": json.dumps(ev.raw, ensure_ascii=False),
        })
    write_csv(supa_dir / "events_status.csv", ev_headers, ev_rows)

    # 호환용 복제본
    (supa_dir / "shipments.csv").write_text((supa_dir / "shipments_status.csv").read_text(encoding="utf-8"), encoding="utf-8")
    (supa_dir / "logistics_events.csv").write_text((supa_dir / "events_status.csv").read_text(encoding="utf-8"), encoding="utf-8")

    # TTL
    if not args.no_legacy_ttl:
        write_legacy_ttl(onto_dir / "hvdc.ttl", shipments, events)
    if not args.no_ops_ttl:
        write_ops_ttl_status(
            onto_dir / "hvdc_ops_status.ttl",
            shipments,
            events,
            base_iri=str(args.base_iri),
            locations_csv=locations_csv if (locations_csv and locations_csv.exists()) else None,
        )

    # QA
    wh_matched = sum(1 for code in wh_by_code.keys() if code in status_codes)
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

    # location mapping reports (if mapper enabled)
    if mapper.enabled:
        mapped = {loc: mapper.map(loc) for loc in distinct_loc_counts.keys()}
        write_location_match_reports(rep_dir, distinct_loc_counts, mapped)

    # console
    print("DONE")
    print(f"- {supa_dir / 'schema.sql'}")
    print(f"- {supa_dir / 'shipments_status.csv'}")
    print(f"- {supa_dir / 'events_status.csv'}")
    print(f"- {rep_dir / 'qa_report.md'}")
    print(f"- {rep_dir / 'orphan_wh.json'}")
    if mapper.enabled:
        print(f"- {rep_dir / 'location_match_report.md'}")
    if status_dups > 0:
        print(f"WARNING: Status duplicate hvdc_code detected: {status_dups}")

if __name__ == "__main__":
    main()
