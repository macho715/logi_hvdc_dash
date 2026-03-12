#!/usr/bin/env python3
"""HVDC Data Loading - Input/Environment Validator

This script validates the prerequisites described in `docs/DATA_LOADING_PLAN.md` Phase 1.

It checks:
- Source JSON presence (Status/Warehouse/Customs)
- ETL scripts presence (Untitled-4, Untitled-3)
- Optional Flow Code script presence (flow_code_calculator.py)
- Python dependencies import (pandas, numpy)

Usage:
  python scripts/hvdc/validate_inputs.py --repo-root . --source-dir supabase/data/raw

Exit codes:
  0 = OK
  1 = Missing required inputs
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
from typing import Iterable


STATUS_CANDIDATES = [
    "HVDC all status.json",  # space version
    "HVDC_all_status.json",  # underscore version
    "HVDC_all_status.json".lower(),
]

WAREHOUSE_CANDIDATES = [
    "hvdc_warehouse_status.json",  # 기본 이름
    "HVDC_warehouse_status.json",  # 대문자 변형
    "warehouse_status.json",        # 단축 이름
    "hvdc_warehouse_status.json".lower(),
    "HVDC_warehouse_status.json".lower(),
    "warehouse_status.json".lower(),
]

CUSTOMS_CANDIDATES = [
    "HVDC_STATUS.json",
    "HVDC_STATUS.json".lower(),
]


def _first_existing(base: Path, candidates: Iterable[str]) -> Path | None:
    for name in candidates:
        p = base / name
        if p.exists():
            return p
    # also try case-insensitive match
    lower_map = {c.name.lower(): c for c in base.glob("*")}
    for name in candidates:
        p = lower_map.get(name.lower())
        if p is not None and p.exists():
            return p
    return None


def _check_import(pkg: str) -> tuple[bool, str]:
    try:
        __import__(pkg)
        return True, "ok"
    except Exception as e:  # pragma: no cover
        return False, f"{type(e).__name__}: {e}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--source-dir", default="supabase/data/raw")
    ap.add_argument("--require-customs", action="store_true", help="Fail if HVDC_STATUS.json is missing")
    args = ap.parse_args()

    repo_root = Path(args.repo_root).resolve()
    src = (repo_root / args.source_dir).resolve()

    print("[validate_inputs] repo_root:", repo_root)
    print("[validate_inputs] source_dir:", src)

    missing: list[str] = []

    if not src.exists():
        missing.append(f"Missing source dir: {src}")
        print("[FAIL]", missing[-1])
        return 1

    status_json = _first_existing(src, STATUS_CANDIDATES)
    wh_json = _first_existing(src, WAREHOUSE_CANDIDATES)
    customs_json = _first_existing(src, CUSTOMS_CANDIDATES)

    if status_json is None:
        missing.append("Missing Status JSON (HVDC all status.json / HVDC_all_status.json)")
    if wh_json is None:
        missing.append("Missing Warehouse JSON (hvdc_warehouse_status.json)")
    if args.require_customs and customs_json is None:
        missing.append("Missing Customs JSON (HVDC_STATUS.json) but --require-customs enabled")

    etl4 = src / "Untitled-4_dashboard_ready_FULL.py"
    etl3 = src / "Untitled-3_dashboard_ready_FULL.py"
    flow_calc = src / "flow_code_calculator.py"

    if not etl4.exists():
        missing.append(f"Missing ETL script: {etl4}")
    if not etl3.exists():
        missing.append(f"Missing ETL script: {etl3}")

    print("\n[inputs]")
    print("- status_json:", status_json if status_json else "(missing)")
    print("- warehouse_json:", wh_json if wh_json else "(missing)")
    print("- customs_json:", customs_json if customs_json else "(missing)")
    print("- etl4:", etl4 if etl4.exists() else "(missing)")
    print("- etl3:", etl3 if etl3.exists() else "(missing)")
    print("- flow_code_calculator:", flow_calc if flow_calc.exists() else "(missing)")

    print("\n[python deps]")
    for pkg in ["pandas", "numpy"]:
        ok, detail = _check_import(pkg)
        print(f"- {pkg}: {'OK' if ok else 'FAIL'} ({detail})")
        if not ok:
            missing.append(f"Python dependency missing/unimportable: {pkg} ({detail})")

    if missing:
        print("\n[RESULT] FAIL")
        for m in missing:
            print("-", m)
        return 1

    print("\n[RESULT] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
