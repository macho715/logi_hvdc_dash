## Exec (3–5L)

* 요청하신 **Option C(ALL+WH+추론)**을 “SSOT 불변조건(ALL=Universe, WH=Subset LEFT 보강)” 기준으로 **Supabase 적재용 CSV + Flow v3.5 재계산(0~5) + 파생 출고(WH_OUT/MOSB_OUT)**까지 **한 번에 생성**하는 파이썬 스크립트(단일 파일)를 제공합니다.
* 기존 `hvdc_json_to_supabase.py`의 단일 JSON 처리 한계를 해소(ALL+WH LEFT, dedup, locations FK, Flow 재계산/리뷰 큐)하도록 재구성했습니다.
* Flow 재계산은 업로드된 `flow_code_calculator.py`(v3.5 알고리즘) 기반으로 수행하며, **AGI/DAS 도메인 룰(Flow≥3), Flow5(Mixed/Incomplete) 리뷰 플래그**를 포함합니다.

---

## EN Sources

* 외부 검색 없음(업로드 파일/내부 알고리즘 기반)

---

## 산출물(파일)

* `shipments.csv`, `cases.csv`, `flows.csv`, `locations.csv`, `events.csv` (**Supabase DDL 로딩용**)
* `events_debug.csv` (location_code 포함 디버그용)
* `report.json`, `report.md` (SSOT 게이트/중복 제거/Flow 재계산 결과 요약)
* `hvdc_supabase.ttl` (옵션: `--export-ttl`)

---

## 사용 방법(명령)

> 스크립트 파일명 예: `hvdc_optionC_etl.py`
> 같은 폴더에 `flow_code_calculator.py`도 같이 두세요.

```bash
python hvdc_optionC_etl.py \
  --all hvdc_allshpt_status.json \
  --wh hvdc_warehouse_status.json \
  --customs "HVDC SATUS.JSON" \
  --output-dir output_supabase_optionC \
  --export-ttl
```

---

## Supabase 로딩 순서(COPY 권장)

1. `locations.csv`
2. `shipments.csv`
3. `cases.csv`
4. `flows.csv`
5. `events.csv`

---

## 스크립트 (Option C 완성본)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HVDC Option C ETL (ALL + WH + Inference) → Supabase CSV + TTL(Optional)

불변조건(SSOT):
- hvdc_allshpt_status.json = Universe(ALL). 모든 (HVDC CODE, Case No.)는 Supabase cases/flows에 반드시 존재.
- hvdc_warehouse_status.json = Subset(WH). ALL 기준 LEFT JOIN으로만 보강(없다고 Case 삭제 금지).

산출물(기본):
- shipments.csv
- cases.csv
- flows.csv
- locations.csv
- events.csv   (DDL 기준: location_id FK 포함)

산출물(옵션):
- events_debug.csv (location_code 포함)
- report.json / report.md
- hvdc_supabase.ttl (옵션: --export-ttl)

주의:
- 입력 JSON의 시간 값은 Unix epoch(ms)로 가정.
- UAE 도착(ATA)와 ETA가 합쳐진 경우(ETA/ATA)에는 Status 기반으로 ETA/ATA를 분기(가정 규칙).
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd
import numpy as np

# Flow Code v3.5 (0~5) 계산기 (같은 폴더에 flow_code_calculator.py 필요)
from flow_code_calculator import calculate_flow_code_v35, normalize_column_names  # type: ignore


DUBAI_TZ = timezone(timedelta(hours=4))

# ---------- Domain config ----------
SITE_COLS = ["MIR", "SHU", "DAS", "AGI"]  # JSON 컬럼(현장)
WAREHOUSE_ALIASES = {
    # alias : (location_code, category)
    "DHL Warehouse": ("DHL_WAREHOUSE", "WAREHOUSE"),
    "DSV Indoor": ("DSV_INDOOR", "WAREHOUSE"),
    "DSV Indoor Indoor": ("DSV_INDOOR", "WAREHOUSE"),
    "DSV Al Markaz": ("DSV_AL_MARKAZ", "WAREHOUSE"),
    "DSV Outdoor": ("DSV_OUTDOOR", "WAREHOUSE"),
    "Hauler Indoor": ("HAULER_INDOOR", "WAREHOUSE"),
    "DSV MZP": ("DSV_MZP", "WAREHOUSE"),
    "DSV Kizad": ("DSV_KIZAD", "WAREHOUSE"),
    "JDN MZD": ("JDN_MZD", "WAREHOUSE"),
    "JDN Waterfront": ("JDN_WATERFRONT", "WAREHOUSE"),
    "AAA Storage": ("AAA_STORAGE", "WAREHOUSE"),
    "ZENER (WH)": ("ZENER_WH", "WAREHOUSE"),
    "ZENER": ("ZENER_WH", "WAREHOUSE"),
    "Vijay Tanks": ("VIJAY_TANKS", "WAREHOUSE"),
    "Hauler DG Storage": ("HAULER_DG_STORAGE", "WAREHOUSE"),
    # MOSB
    "MOSB": ("MOSB", "MOSB"),
    # 기타(내부 이동)
    "Shifting": ("SHIFTING", "TRANSIT"),
}

# Customs/Port ops virtual locations
VIRTUAL_LOCATIONS = {
    "CUSTOMS_UAE": ("CUSTOMS_UAE", "CUSTOMS", "Customs (UAE)"),
    "EDAS": ("EDAS", "CUSTOMS", "eDAS / Attestation"),
    "PORT_AGENT": ("PORT_AGENT", "PORT", "Port Agent / DO Collection"),
}

FLOW_DESC = {
    0: "Flow 0: Pre Arrival",
    1: "Flow 1: Port → Site",
    2: "Flow 2: Port → WH → Site",
    3: "Flow 3: Port → MOSB → Site",
    4: "Flow 4: Port → WH → MOSB → Site",
    5: "Flow 5: Mixed / Waiting / Incomplete leg",
}


# ---------- Data classes ----------
@dataclass
class ShipmentRow:
    hvdc_code: str
    shipment_invoice_no: Optional[str] = None
    vendor: Optional[str] = None
    coe: Optional[str] = None
    pol: Optional[str] = None
    pod: Optional[str] = None
    vessel: Optional[str] = None
    hs_code: Optional[str] = None
    currency: Optional[str] = None
    price: Optional[float] = None


@dataclass
class CaseRow:
    hvdc_code: str
    case_no: int
    site_code: Optional[str] = None
    eq_no: Optional[str] = None
    pkg: Optional[int] = None
    description: Optional[str] = None
    final_location: Optional[str] = None
    storage: Optional[str] = None
    l_cm: Optional[float] = None
    w_cm: Optional[float] = None
    h_cm: Optional[float] = None
    cbm: Optional[float] = None
    nw_kg: Optional[float] = None
    gw_kg: Optional[float] = None
    sqm: Optional[float] = None
    vendor: Optional[str] = None


@dataclass
class FlowRow:
    hvdc_code: str
    case_no: int
    flow_code: int
    flow_code_original: Optional[int]
    flow_code_derived: Optional[int]
    override_reason: Optional[str]
    warehouse_count: Optional[int]
    has_mosb_leg: bool
    has_site_arrival: bool
    customs_code: Optional[str]
    customs_start_iso: Optional[str]
    customs_end_iso: Optional[str]
    last_status: Optional[str]
    requires_review: bool


@dataclass
class LocationRow:
    location_id: int
    location_code: str
    name: str
    category: str
    hvdc_node: Optional[str] = None
    is_mosb: bool = False
    is_site: bool = False
    is_port: bool = False
    active: bool = True


@dataclass
class EventRow:
    hvdc_code: str
    case_no: int
    event_type: str
    event_time_iso: str
    location_id: int
    source_field: str
    source_system: str
    raw_epoch_ms: Optional[int] = None


@dataclass
class EventDebugRow:
    hvdc_code: str
    case_no: int
    event_type: str
    event_time_iso: str
    location_code: str
    source_field: str
    source_system: str
    raw_epoch_ms: Optional[int] = None


# ---------- Utilities ----------
def _as_str_or_none(v: Any) -> Optional[str]:
    if v in (None, ""):
        return None
    s = str(v).strip()
    return s if s else None


def _to_int(v: Any) -> Optional[int]:
    if v in (None, "", 0):
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _to_float(v: Any) -> Optional[float]:
    if v in (None, ""):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _is_epoch_ms(v: Any) -> bool:
    # epoch(ms)는 보통 13자리 이상(>= 1e11)로 가정
    try:
        iv = int(v)
        return iv >= 100_000_000_000
    except Exception:
        return False


def _epoch_ms_to_iso(ms: int, tz: timezone = DUBAI_TZ) -> str:
    dt = datetime.fromtimestamp(ms / 1000.0, tz=tz)
    return dt.isoformat()


def _date_str_to_iso(date_str: str, tz: timezone = DUBAI_TZ) -> Optional[str]:
    try:
        dt = pd.to_datetime(date_str, errors="coerce")
        if pd.isna(dt):
            return None
        if isinstance(dt, pd.Timestamp):
            if dt.tzinfo is None:
                dt = dt.tz_localize(tz)
            else:
                dt = dt.tz_convert(tz)
            return dt.to_pydatetime().isoformat()
        return None
    except Exception:
        return None


def _normalize_token(value: str) -> str:
    token = "".join(ch if ch.isalnum() else "_" for ch in value.upper())
    token = re.sub(r"_+", "_", token).strip("_")
    return token or "UNKNOWN"


def _extract_ids(record: Dict[str, Any]) -> Tuple[str, int]:
    hvdc_raw = record.get("HVDC CODE") or record.get("hvdc_code")
    hvdc_code = str(hvdc_raw).strip() if hvdc_raw is not None else ""
    if not hvdc_code:
        raise ValueError("HVDC CODE is missing")

    case_raw = record.get("Case No.") or record.get("case_no") or record.get("CASE_NO") or record.get("case")
    if case_raw is None:
        raise ValueError(f"Case No. is missing for hvdc_code={hvdc_code}")
    return hvdc_code, int(case_raw)


def load_json_records(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    raise ValueError(f"Expected JSON array, got {type(data)!r} at {path}")


def compute_row_last_ms(record: Dict[str, Any]) -> int:
    """dedup 기준: 해당 레코드가 보유한 모든 epoch(ms) 중 최대값"""
    max_ms = 0
    for v in record.values():
        if _is_epoch_ms(v):
            max_ms = max(max_ms, int(v))
    return max_ms


def pick_best_record(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    """
    동일 키 중 최신 스냅샷 선택:
    - row_last_ms가 큰 레코드 우선
    - 동률이면 Status_Location_Date가 큰 레코드 우선
    - 그래도 동률이면 source 우선순위: WH > ALL (가정)
    """
    a_ms = compute_row_last_ms(a)
    b_ms = compute_row_last_ms(b)
    if a_ms != b_ms:
        return a if a_ms > b_ms else b

    a_sd = int(a.get("Status_Location_Date") or 0) if _is_epoch_ms(a.get("Status_Location_Date")) else 0
    b_sd = int(b.get("Status_Location_Date") or 0) if _is_epoch_ms(b.get("Status_Location_Date")) else 0
    if a_sd != b_sd:
        return a if a_sd > b_sd else b

    a_src = str(a.get("_source") or "")
    b_src = str(b.get("_source") or "")
    if a_src != b_src:
        if b_src == "WH":
            return b
        if a_src == "WH":
            return a
    return a


def left_merge_all_wh(
    all_records: List[Dict[str, Any]],
    wh_records: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    ALL 기준 LEFT JOIN:
    - ALL 레코드의 모든 행은 유지
    - WH에 동일 키가 있으면, WH 보강 컬럼을 추가/덮어씀(WH 우선)
    """
    wh_index: Dict[Tuple[str, int], Dict[str, Any]] = {}
    stats = {"all_rows": len(all_records), "wh_rows": 0, "wh_matched": 0, "wh_unmatched": 0}

    if wh_records:
        stats["wh_rows"] = len(wh_records)
        for r in wh_records:
            r["_source"] = "WH"
            try:
                k = _extract_ids(r)
            except Exception:
                continue
            prev = wh_index.get(k)
            wh_index[k] = pick_best_record(prev, r) if prev else r

    merged: List[Dict[str, Any]] = []
    for r in all_records:
        r["_source"] = "ALL"
        try:
            k = _extract_ids(r)
        except Exception:
            continue
        wh = wh_index.get(k)
        if wh is not None:
            stats["wh_matched"] += 1
            out = dict(r)
            for col, val in wh.items():
                if col.startswith("_"):
                    continue
                if val in (None, "", 0):
                    continue
                out[col] = val
            out["_has_wh"] = True
            merged.append(out)
        else:
            merged.append(dict(r))
    stats["wh_unmatched"] = stats["wh_rows"] - stats["wh_matched"]
    return merged, stats


def dedup_by_case_key(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    """(hvdc_code, case_no) 유니크 보장"""
    by_key: Dict[Tuple[str, int], Dict[str, Any]] = {}
    dup = 0
    for r in records:
        try:
            k = _extract_ids(r)
        except Exception:
            continue
        prev = by_key.get(k)
        if prev is None:
            by_key[k] = r
        else:
            dup += 1
            by_key[k] = pick_best_record(prev, r)
    out = list(by_key.values())
    out.sort(key=lambda x: (_extract_ids(x)[0], _extract_ids(x)[1]))
    return out, dup


# ---------- Build tables ----------
def build_shipments(records: Iterable[Dict[str, Any]]) -> List[ShipmentRow]:
    shipments: Dict[str, ShipmentRow] = {}
    for r in records:
        try:
            hvdc_code, _ = _extract_ids(r)
        except Exception:
            continue
        s = shipments.get(hvdc_code)
        if s is None:
            s = ShipmentRow(hvdc_code=hvdc_code)
            shipments[hvdc_code] = s

        def first(cur: Any, newv: Any) -> Any:
            if cur not in (None, ""):
                return cur
            if newv in (None, ""):
                return cur
            return newv

        s.shipment_invoice_no = first(s.shipment_invoice_no, _as_str_or_none(r.get("Shipment Invoice No.")))
        s.vendor = first(s.vendor, _as_str_or_none(r.get("Vendor")))
        s.coe = first(s.coe, _as_str_or_none(r.get("COE")))
        s.pol = first(s.pol, _as_str_or_none(r.get("POL")))
        s.pod = first(s.pod, _as_str_or_none(r.get("POD")))
        s.vessel = first(s.vessel, _as_str_or_none(r.get("Vessel")))

        hs = r.get("HS Code")
        if s.hs_code in (None, "") and hs not in (None, ""):
            s.hs_code = str(hs)

        s.currency = first(s.currency, _as_str_or_none(r.get("Currency")))
        if s.price is None and r.get("Price") not in (None, ""):
            s.price = _to_float(r.get("Price"))

    return sorted(shipments.values(), key=lambda x: x.hvdc_code)


def build_cases(records: Iterable[Dict[str, Any]]) -> List[CaseRow]:
    out: List[CaseRow] = []
    for r in records:
        try:
            hvdc_code, case_no = _extract_ids(r)
        except Exception:
            continue
        out.append(
            CaseRow(
                hvdc_code=hvdc_code,
                case_no=case_no,
                site_code=_as_str_or_none(r.get("Site")),
                eq_no=_as_str_or_none(r.get("EQ No")),
                pkg=_to_int(r.get("Pkg")),
                description=_as_str_or_none(r.get("Description")),
                final_location=_as_str_or_none(r.get("Final_Location")),
                storage=_as_str_or_none(r.get("Storage")),
                l_cm=_to_float(r.get("L(CM)")),
                w_cm=_to_float(r.get("W(CM)")),
                h_cm=_to_float(r.get("H(CM)")),
                cbm=_to_float(r.get("CBM")),
                nw_kg=_to_float(r.get("N.W(kgs)")),
                gw_kg=_to_float(r.get("G.W(kgs)")),
                sqm=_to_float(r.get("SQM")),
                vendor=_as_str_or_none(r.get("Vendor")),
            )
        )
    out.sort(key=lambda x: (x.hvdc_code, x.case_no))
    return out


def _infer_port_event_type(record: Dict[str, Any], field: str) -> str:
    """
    ETD/ATD, ETA/ATA 단일 ms 필드의 event_type을 Status 기반으로 분기(가정).
    - Status_Current 또는 Status_Location에 'Pre Arrival'이 있으면 Plan(ETD/ETA)로
    - 그 외에는 Actual(ATD/ATA)로
    """
    status = (_as_str_or_none(record.get("Status_Current")) or _as_str_or_none(record.get("Status_Location")) or "").lower()
    is_pre = "pre arrival" in status or status.strip() in ("prearrival", "pre-arrival")
    if field == "ETD/ATD":
        return "PORT_ETD" if is_pre else "PORT_ATD"
    if field == "ETA/ATA":
        return "PORT_ETA" if is_pre else "PORT_ATA"
    return "OTHER"


def detect_location_columns(records: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
    """입력 JSON에서 이벤트 후보 컬럼(warehouse/site)을 자동 탐지"""
    cols = set()
    for r in records[:2000]:
        cols.update(r.keys())

    wh_cols = [c for c in cols if c in WAREHOUSE_ALIASES and c not in SITE_COLS]
    wh_cols = sorted(wh_cols, key=lambda x: (WAREHOUSE_ALIASES[x][1], WAREHOUSE_ALIASES[x][0]))
    site_cols = [c for c in SITE_COLS if c in cols]
    return wh_cols, site_cols


def build_locations(records: List[Dict[str, Any]], wh_cols: List[str], site_cols: List[str]) -> Dict[str, LocationRow]:
    """locations dimension 생성(결정적 location_id 부여)"""
    loc_map: Dict[str, Tuple[str, str, str]] = {}  # code -> (name, category, hvdc_node)

    for col in wh_cols:
        code, cat = WAREHOUSE_ALIASES[col]
        name = col
        hvdc_node = "MOSB" if code == "MOSB" else None
        loc_map[code] = (name, cat, hvdc_node)

    for col in site_cols:
        code = f"{col}_SITE"
        loc_map[code] = (col, "SITE", col)

    for r in records[:2000]:
        pol = _as_str_or_none(r.get("POL"))
        pod = _as_str_or_none(r.get("POD"))
        if pol:
            code = f"PORT_POL_{_normalize_token(pol)}"
            loc_map[code] = (pol, "PORT", "PORT")
        if pod:
            code = f"PORT_POD_{_normalize_token(pod)}"
            loc_map[code] = (pod, "PORT", "PORT")

    for _k, (code, cat, name) in VIRTUAL_LOCATIONS.items():
        loc_map[code] = (name, cat, "CUSTOMS" if cat == "CUSTOMS" else "PORT")

    codes_sorted = sorted(loc_map.keys())
    out: Dict[str, LocationRow] = {}
    for idx, code in enumerate(codes_sorted, start=1):
        name, cat, hvdc_node = loc_map[code]
        out[code] = LocationRow(
            location_id=idx,
            location_code=code,
            name=name,
            category=cat,
            hvdc_node=hvdc_node,
            is_mosb=(cat == "MOSB" or code == "MOSB"),
            is_site=(cat == "SITE"),
            is_port=(cat == "PORT"),
            active=True,
        )
    return out


def iter_events(
    record: Dict[str, Any],
    source_system: str,
    wh_cols: List[str],
    site_cols: List[str],
    locations: Dict[str, LocationRow],
    customs_join: Optional[Dict[str, Any]] = None,
) -> Iterable[Tuple[EventRow, EventDebugRow]]:
    hvdc_code, case_no = _extract_ids(record)

    for fld in ("ETD/ATD", "ETA/ATA"):
        raw = _to_int(record.get(fld))
        if raw is None or not _is_epoch_ms(raw):
            continue

        if fld == "ETD/ATD":
            pol = _as_str_or_none(record.get("POL")) or "UNKNOWN"
            loc_code = f"PORT_POL_{_normalize_token(pol)}"
        else:
            pod = _as_str_or_none(record.get("POD")) or "UNKNOWN"
            loc_code = f"PORT_POD_{_normalize_token(pod)}"

        if loc_code not in locations:
            continue

        etype = _infer_port_event_type(record, fld)
        iso = _epoch_ms_to_iso(raw)
        lid = locations[loc_code].location_id
        yield (
            EventRow(hvdc_code, case_no, etype, iso, lid, fld, source_system, raw),
            EventDebugRow(hvdc_code, case_no, etype, iso, loc_code, fld, source_system, raw),
        )

    for col in wh_cols:
        raw = _to_int(record.get(col))
        if raw is None or not _is_epoch_ms(raw):
            continue
        loc_code, cat = WAREHOUSE_ALIASES[col]
        if cat == "MOSB":
            etype = "MOSB_IN"
        elif cat == "TRANSIT":
            etype = "YARD_SHIFT"
        else:
            etype = "WH_IN"

        if loc_code not in locations:
            continue
        iso = _epoch_ms_to_iso(raw)
        lid = locations[loc_code].location_id
        yield (
            EventRow(hvdc_code, case_no, etype, iso, lid, col, source_system, raw),
            EventDebugRow(hvdc_code, case_no, etype, iso, loc_code, col, source_system, raw),
        )

    for col in site_cols:
        raw = _to_int(record.get(col))
        if raw is None or not _is_epoch_ms(raw):
            continue
        loc_code = f"{col}_SITE"
        if loc_code not in locations:
            continue
        iso = _epoch_ms_to_iso(raw)
        lid = locations[loc_code].location_id
        yield (
            EventRow(hvdc_code, case_no, "SITE_ARRIVAL", iso, lid, col, source_system, raw),
            EventDebugRow(hvdc_code, case_no, "SITE_ARRIVAL", iso, loc_code, col, source_system, raw),
        )

    if customs_join:
        att = _as_str_or_none(customs_join.get("Attestation Date"))
        if att:
            iso = _date_str_to_iso(att)
            if iso and "EDAS" in locations:
                lid = locations["EDAS"].location_id
                yield (
                    EventRow(hvdc_code, case_no, "CUSTOMS_START", iso, lid, "Attestation Date", "hvdc_status_json", None),
                    EventDebugRow(hvdc_code, case_no, "CUSTOMS_START", iso, "EDAS", "Attestation Date", "hvdc_status_json", None),
                )
        cs = _as_str_or_none(customs_join.get("Customs Start"))
        if cs:
            iso = _date_str_to_iso(cs)
            if iso and "CUSTOMS_UAE" in locations:
                lid = locations["CUSTOMS_UAE"].location_id
                yield (
                    EventRow(hvdc_code, case_no, "CUSTOMS_FORMAL_START", iso, lid, "Customs Start", "hvdc_status_json", None),
                    EventDebugRow(hvdc_code, case_no, "CUSTOMS_FORMAL_START", iso, "CUSTOMS_UAE", "Customs Start", "hvdc_status_json", None),
                )
        cc = _as_str_or_none(customs_join.get("Customs Close"))
        if cc:
            iso = _date_str_to_iso(cc)
            if iso and "CUSTOMS_UAE" in locations:
                lid = locations["CUSTOMS_UAE"].location_id
                yield (
                    EventRow(hvdc_code, case_no, "CUSTOMS_END", iso, lid, "Customs Close", "hvdc_status_json", None),
                    EventDebugRow(hvdc_code, case_no, "CUSTOMS_END", iso, "CUSTOMS_UAE", "Customs Close", "hvdc_status_json", None),
                )
        do = _as_str_or_none(customs_join.get("DO Collection"))
        if do:
            iso = _date_str_to_iso(do)
            if iso and "PORT_AGENT" in locations:
                lid = locations["PORT_AGENT"].location_id
                yield (
                    EventRow(hvdc_code, case_no, "DO_COLLECTION", iso, lid, "DO Collection", "hvdc_status_json", None),
                    EventDebugRow(hvdc_code, case_no, "DO_COLLECTION", iso, "PORT_AGENT", "DO Collection", "hvdc_status_json", None),
                )


def derive_out_events(events_debug: List[EventDebugRow], locations: Dict[str, LocationRow]) -> List[Tuple[EventRow, EventDebugRow]]:
    """WH_OUT_DERIVED / MOSB_OUT_DERIVED 생성(시간순 다음 이벤트)"""
    out: List[Tuple[EventRow, EventDebugRow]] = []
    by_case: Dict[Tuple[str, int], List[EventDebugRow]] = {}
    for e in events_debug:
        by_case.setdefault((e.hvdc_code, e.case_no), []).append(e)

    for (hvdc_code, case_no), evs in by_case.items():
        evs_sorted = sorted(evs, key=lambda x: x.event_time_iso)
        for i, e in enumerate(evs_sorted):
            if e.event_type not in ("WH_IN", "MOSB_IN"):
                continue
            next_time = None
            for j in range(i + 1, len(evs_sorted)):
                e2 = evs_sorted[j]
                if e2.event_time_iso <= e.event_time_iso:
                    continue
                if e2.location_code != e.location_code or e2.event_type == "SITE_ARRIVAL":
                    next_time = e2.event_time_iso
                    break
            if not next_time:
                continue

            etype = "WH_OUT_DERIVED" if e.event_type == "WH_IN" else "MOSB_OUT_DERIVED"
            loc_code = e.location_code
            if loc_code not in locations:
                continue
            lid = locations[loc_code].location_id
            out.append(
                (
                    EventRow(hvdc_code, case_no, etype, next_time, lid, e.source_field, "derived", None),
                    EventDebugRow(hvdc_code, case_no, etype, next_time, loc_code, e.source_field, "derived", None),
                )
            )
    return out


def build_flows_option_c(
    merged_records: List[Dict[str, Any]],
    wh_cols: List[str],          # Flow 계산용(WAREHOUSE+MOSB만)
    site_cols: List[str],
    customs_by_hvdc: Dict[str, Dict[str, Any]],
) -> List[FlowRow]:
    """Option C: Flow v3.5 재계산 + 오버라이드/리뷰 플래그"""
    df = pd.DataFrame(merged_records)
    if df.empty:
        return []
    df = normalize_column_names(df)

    # ETA/ATA 단일 ms → ATA 보조 생성(가정): Pre Arrival이면 ATA=NaN, 그 외는 ATA=ETA/ATA
    status_series = df.get("Status_Current")
    if status_series is None:
        status_series = df.get("Status_Location")
    status_series = status_series.astype(str).str.lower() if status_series is not None else pd.Series("", index=df.index)

    eta_ata = df.get("ETA/ATA")
    ata_col = pd.Series(pd.NA, index=df.index, dtype="float64")
    if eta_ata is not None:
        ata_col = pd.to_numeric(eta_ata, errors="coerce")
        is_pre = status_series.str.contains("pre arrival", na=False)
        has_any_ws = pd.Series(False, index=df.index)
        for c in wh_cols + site_cols:
            if c in df.columns:
                has_any_ws = has_any_ws | pd.to_numeric(df[c], errors="coerce").notna()
        ata_col = ata_col.where(~is_pre | has_any_ws, np.nan)

    df["ATA"] = ata_col

    df_calc = calculate_flow_code_v35(df, warehouse_columns=wh_cols, site_columns=site_cols)

    # warehouse_count(정의: MOSB 제외 WAREHOUSE 컬럼 notna 개수)
    wh_cnt = pd.Series(0, index=df_calc.index, dtype="int64")
    for c in wh_cols:
        if c == "MOSB":
            continue
        if c in df_calc.columns:
            wh_cnt = wh_cnt + pd.to_numeric(df_calc[c], errors="coerce").notna().astype(int)

    has_mosb = pd.Series(False, index=df_calc.index)
    if "MOSB" in df_calc.columns:
        has_mosb = pd.to_numeric(df_calc["MOSB"], errors="coerce").notna()

    has_site = pd.Series(False, index=df_calc.index)
    for c in site_cols:
        if c in df_calc.columns:
            has_site = has_site | pd.to_numeric(df_calc[c], errors="coerce").notna()

    flow_source = pd.Series(np.nan, index=df_calc.index)
    if "_FLOW_CODE_SOURCE" in df_calc.columns:
        flow_source = pd.to_numeric(df_calc["_FLOW_CODE_SOURCE"], errors="coerce")

    out: List[FlowRow] = []
    for i, row in df_calc.iterrows():
        try:
            hvdc_code = str(row["HVDC CODE"]).strip()
            case_no = int(row["Case No."])
        except Exception:
            continue

        fc = int(row.get("FLOW_CODE") or 0)
        derived_pre = int(row.get("FLOW_CODE_ORIG")) if pd.notna(row.get("FLOW_CODE_ORIG")) else None
        src = int(flow_source.iloc[i]) if i < len(flow_source) and pd.notna(flow_source.iloc[i]) else None

        override_reason = None
        if row.get("FLOW_OVERRIDE_REASON") not in (None, "", np.nan):
            override_reason = str(row.get("FLOW_OVERRIDE_REASON"))
        if src is not None and src != fc and not override_reason:
            override_reason = "FLOW_RECALC_MISMATCH"

        requires_review = bool(fc == 5)

        cjoin = customs_by_hvdc.get(hvdc_code, {})
        customs_code = _as_str_or_none(cjoin.get("Custom Code") or cjoin.get("Customs Code"))
        customs_start_iso = _date_str_to_iso(str(cjoin.get("Attestation Date"))) if cjoin.get("Attestation Date") else None
        customs_end_iso = _date_str_to_iso(str(cjoin.get("Customs Close"))) if cjoin.get("Customs Close") else None

        last_status = _as_str_or_none(row.get("Status_Current") or row.get("Status_Storage") or row.get("Status_Location"))

        out.append(
            FlowRow(
                hvdc_code=hvdc_code,
                case_no=case_no,
                flow_code=fc,
                flow_code_original=src,
                flow_code_derived=derived_pre,
                override_reason=override_reason,
                warehouse_count=int(wh_cnt.iloc[i]) if i < len(wh_cnt) else None,
                has_mosb_leg=bool(has_mosb.iloc[i]) if i < len(has_mosb) else False,
                has_site_arrival=bool(has_site.iloc[i]) if i < len(has_site) else False,
                customs_code=customs_code,
                customs_start_iso=customs_start_iso,
                customs_end_iso=customs_end_iso,
                last_status=last_status,
                requires_review=requires_review,
            )
        )
    out.sort(key=lambda x: (x.hvdc_code, x.case_no))
    return out


def write_csv(path: Path, rows: Iterable[dict]) -> None:
    data = list(rows)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not data:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        w.writeheader()
        for r in data:
            w.writerow({k: ("" if v is None else v) for k, v in r.items()})


def write_report(output_dir: Path, report: Dict[str, Any]) -> None:
    (output_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md = ["# HVDC Option C ETL Report", ""]
    for k, v in report.items():
        if isinstance(v, (dict, list)):
            continue
        md.append(f"- **{k}**: {v}")
    (output_dir / "report.md").write_text("\n".join(md), encoding="utf-8")


def export_ttl_stub(output_ttl: Path, cases: List[CaseRow], flows: List[FlowRow], events_dbg: List[EventDebugRow]) -> None:
    """최소 TTL export (rdflib 필요)."""
    try:
        from rdflib import Graph, Namespace, Literal, RDF, XSD, URIRef  # type: ignore
    except Exception:
        return

    HVDC = Namespace("http://samsung.com/project-logistics#")
    g = Graph()
    g.bind("hvdc", HVDC)

    for c in cases:
        case_uri = URIRef(f"{HVDC}case/{c.hvdc_code}/{c.case_no}")
        g.add((case_uri, RDF.type, HVDC.Case))
        g.add((case_uri, HVDC.hasHvdcCode, Literal(c.hvdc_code)))
        g.add((case_uri, HVDC.hasCaseNo, Literal(c.case_no)))
        if c.final_location:
            g.add((case_uri, HVDC.hasFinalLocation, Literal(c.final_location)))

    flow_by_key = {(f.hvdc_code, f.case_no): f for f in flows}
    for (hvdc_code, case_no), f in flow_by_key.items():
        case_uri = URIRef(f"{HVDC}case/{hvdc_code}/{case_no}")
        g.add((case_uri, HVDC.hasFlowCode, Literal(int(f.flow_code))))
        if f.flow_code_original is not None:
            g.add((case_uri, HVDC.hasFlowCodeOriginal, Literal(int(f.flow_code_original))))
        if f.override_reason:
            g.add((case_uri, HVDC.hasFlowOverrideReason, Literal(f.override_reason)))

    for i, e in enumerate(events_dbg, start=1):
        ev_uri = URIRef(f"{HVDC}event/{e.hvdc_code}/{e.case_no}/{i}")
        case_uri = URIRef(f"{HVDC}case/{e.hvdc_code}/{e.case_no}")
        g.add((ev_uri, RDF.type, HVDC.TransportEvent))
        g.add((case_uri, HVDC.hasEvent, ev_uri))
        g.add((ev_uri, HVDC.hasEventType, Literal(e.event_type)))
        g.add((ev_uri, HVDC.hasEventTime, Literal(e.event_time_iso, datatype=XSD.dateTime)))
        g.add((ev_uri, HVDC.hasLocationCode, Literal(e.location_code)))

    output_ttl.parent.mkdir(parents=True, exist_ok=True)
    output_ttl.write_text(g.serialize(format="turtle"), encoding="utf-8")


def parse_customs_status(path: Optional[Path]) -> Dict[str, Dict[str, Any]]:
    """
    HVDC STATUS(JSON)에서 Customs/DO/Attestation 정보를 hvdc_code 키로 맵핑.
    다양한 키 이름(SCT SHIP NO./COMMERCIAL INVOICE No.)을 방어적으로 흡수.
    """
    if not path:
        return {}
    recs = load_json_records(path)
    out: Dict[str, Dict[str, Any]] = {}
    for r in recs:
        hvdc_code = _as_str_or_none(r.get("HVDC CODE")) or _as_str_or_none(r.get("SCT SHIP NO.")) or _as_str_or_none(r.get("COMMERCIAL INVOICE No."))
        if not hvdc_code:
            continue
        prev = out.get(hvdc_code)
        if prev is None:
            out[hvdc_code] = r
        else:
            p = _as_str_or_none(prev.get("Customs Close")) or ""
            n = _as_str_or_none(r.get("Customs Close")) or ""
            if n > p:
                out[hvdc_code] = r
    return out


def run_etl(
    all_path: Path,
    wh_path: Optional[Path],
    customs_path: Optional[Path],
    output_dir: Path,
    export_ttl: bool = False,
) -> None:
    all_records = load_json_records(all_path)
    wh_records = load_json_records(wh_path) if wh_path else None

    # SSOT Gate 기준치 계산(ALL unique key)
    all_valid_keys = []
    all_invalid = 0
    for r in all_records:
        try:
            all_valid_keys.append(_extract_ids(r))
        except Exception:
            all_invalid += 1
    all_unique = len(set(all_valid_keys))

    wh_unique = 0
    if wh_records:
        wh_valid_keys = []
        wh_invalid = 0
        for r in wh_records:
            try:
                wh_valid_keys.append(_extract_ids(r))
            except Exception:
                wh_invalid += 1
        wh_unique = len(set(wh_valid_keys))
    else:
        wh_invalid = 0

    merged, merge_stats = left_merge_all_wh(all_records, wh_records)
    merged_dedup, dup_cnt = dedup_by_case_key(merged)

    wh_cols, site_cols = detect_location_columns(merged_dedup)
    # Flow 재계산에는 TRANSIT(예: Shifting) 제외
    wh_flow_cols = [c for c in wh_cols if WAREHOUSE_ALIASES.get(c, ("", "OTHER"))[1] in ("WAREHOUSE", "MOSB")]

    customs_by_hvdc = parse_customs_status(customs_path)

    shipments = build_shipments(merged_dedup)
    cases = build_cases(merged_dedup)

    locations = build_locations(merged_dedup, wh_cols=wh_cols, site_cols=site_cols)

    events: List[EventRow] = []
    events_dbg: List[EventDebugRow] = []
    for r in merged_dedup:
        source_system = str(all_path.name)
        try:
            hvdc_code, _ = _extract_ids(r)
        except Exception:
            continue
        cjoin = customs_by_hvdc.get(hvdc_code)
        for e, ed in iter_events(r, source_system, wh_cols, site_cols, locations, customs_join=cjoin):
            events.append(e)
            events_dbg.append(ed)

    derived = derive_out_events(events_dbg, locations)
    for e, ed in derived:
        events.append(e)
        events_dbg.append(ed)

    events.sort(key=lambda x: (x.hvdc_code, x.case_no, x.event_time_iso, x.event_type))
    events_dbg.sort(key=lambda x: (x.hvdc_code, x.case_no, x.event_time_iso, x.event_type))

    # 원천 FLOW_CODE 보존
    for r in merged_dedup:
        r["_FLOW_CODE_SOURCE"] = r.get("FLOW_CODE")

    flows = build_flows_option_c(merged_dedup, wh_cols=wh_flow_cols, site_cols=site_cols, customs_by_hvdc=customs_by_hvdc)

    case_keys = {(c.hvdc_code, c.case_no) for c in cases}
    ev_missing = sum(1 for e in events if (e.hvdc_code, e.case_no) not in case_keys)
    flow_missing = sum(1 for f in flows if (f.hvdc_code, f.case_no) not in case_keys)

    flow_mismatch = sum(1 for f in flows if f.flow_code_original is not None and f.flow_code_original != f.flow_code)
    flow5 = sum(1 for f in flows if f.flow_code == 5)
    agi_das_violation = sum(
        1
        for c in cases
        if (c.final_location or "").upper() in ("AGI", "DAS")
        and next((f.flow_code for f in flows if f.hvdc_code == c.hvdc_code and f.case_no == c.case_no), 0) < 3
    )

    report = {
        "all_rows": merge_stats["all_rows"],
        "all_invalid_rows": all_invalid,
        "all_unique_case_keys": all_unique,
        "wh_rows": merge_stats["wh_rows"],
        "wh_unique_case_keys": wh_unique,
        "wh_invalid_rows": wh_invalid,
        "wh_matched": merge_stats["wh_matched"],
        "wh_unmatched": merge_stats["wh_unmatched"],
        "merged_rows": len(merged),
        "dedup_rows": len(merged_dedup),
        "dedup_duplicates_removed": dup_cnt,
        "shipments": len(shipments),
        "cases": len(cases),
        "ssot_cases_minus_all_unique": len(cases) - all_unique,
        "flows": len(flows),
        "events": len(events),
        "events_missing_case_fk": ev_missing,
        "flows_missing_case_fk": flow_missing,
        "flow_mismatch_cnt": flow_mismatch,
        "flow_mismatch_pct": round((flow_mismatch / max(len(flows), 1)) * 100.0, 2),
        "flow5_cnt": flow5,
        "agi_das_violation_cnt": agi_das_violation,
        "detected_wh_cols": wh_cols,
        "detected_site_cols": site_cols,
        "customs_hvdc_keys": len(customs_by_hvdc),
    }

    output_dir.mkdir(parents=True, exist_ok=True)

    write_csv(output_dir / "shipments.csv", (asdict(x) for x in shipments))
    write_csv(output_dir / "cases.csv", (asdict(x) for x in cases))
    write_csv(output_dir / "flows.csv", (asdict(x) for x in flows))
    write_csv(output_dir / "locations.csv", (asdict(x) for x in locations.values()))
    write_csv(output_dir / "events.csv", (asdict(x) for x in events))
    write_csv(output_dir / "events_debug.csv", (asdict(x) for x in events_dbg))
    write_report(output_dir, report)

    if export_ttl:
        export_ttl_stub(output_dir / "hvdc_supabase.ttl", cases, flows, events_dbg)


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="HVDC Option C ETL (ALL+WH+Inference) → Supabase CSV")
    p.add_argument("--all", required=True, help="hvdc_allshpt_status.json (SSOT universe)")
    p.add_argument("--wh", required=False, default=None, help="hvdc_warehouse_status.json (subset augment)")
    p.add_argument("--customs", required=False, default=None, help="HVDC STATUS JSON (customs/DO/attestation)")
    p.add_argument("--output-dir", default="output_supabase_optionC", help="Output directory")
    p.add_argument("--export-ttl", action="store_true", help="Also export hvdc_supabase.ttl (rdflib required)")
    return p


def main() -> None:
    args = build_arg_parser().parse_args()
    all_path = Path(args.all).expanduser().resolve()
    wh_path = Path(args.wh).expanduser().resolve() if args.wh else None
    customs_path = Path(args.customs).expanduser().resolve() if args.customs else None
    out_dir = Path(args.output_dir).expanduser().resolve()

    run_etl(all_path, wh_path, customs_path, out_dir, export_ttl=bool(args.export_ttl))


if __name__ == "__main__":
    main()
```

---

## 검증(ETL 완료 후 “필수 게이트”)

1. **SSOT 게이트**

* `report.json`의 `ssot_cases_minus_all_unique == 0` 이어야 합니다. (0 아니면 ALL 키 누락/파싱 실패 존재)

2. **PK/FK 게이트**

* `events_missing_case_fk == 0`, `flows_missing_case_fk == 0`

3. **AGI/DAS 규칙**

* `agi_das_violation_cnt == 0` 이어야 합니다(Flow≥3 강제).

---

## Acc (가정:)

* 가정: `ETD/ATD`, `ETA/ATA`, WH/Site 컬럼 값은 **Unix epoch(ms)** 입니다.
* 가정: `ETA/ATA`가 단일 컬럼인 경우, `Status_Current/Status_Location`에 **Pre Arrival**이 있으면 ETA로, 아니면 ATA로 간주합니다(운영 규칙에 맞게 조정 가능).

---

## 🔧 /cmd 3

1. `/switch_mode LATTICE + /logi-master --deep report`
2. `/analyze data-quality`
3. `/logi-master kpi-dash`

---

## ZERO log

* ZERO 미발동(요청은 ETL 스크립트 제공이며, 규정/요율/실시간 정보 단정 없음).
