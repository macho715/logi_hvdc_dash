from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def _load_etl_module():
    repo_root = Path(__file__).resolve().parents[2]
    etl_path = repo_root / "scripts" / "etl" / "optionc_etl.py"
    sys.path.insert(0, str(etl_path.parent))
    spec = importlib.util.spec_from_file_location("etl_optionc", etl_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load ETL module: {etl_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_extract_ids_accepts_sct_ship_no_with_dot():
    etl = _load_etl_module()
    hvdc_code, case_no = etl._extract_ids(  # type: ignore[attr-defined]
        {"SCT SHIP NO.": "HVDC-ADOPT-PPL-0001", "Case No.": "CASE-001"}
    )
    assert hvdc_code == "HVDC-ADOPT-PPL-0001"
    assert case_no == "CASE-001"


def test_extract_ids_accepts_sct_ship_no_without_dot():
    etl = _load_etl_module()
    hvdc_code, case_no = etl._extract_ids(  # type: ignore[attr-defined]
        {"SCT SHIP NO": "HVDC-ADOPT-PPL-0002", "Case No.": "CASE-002"}
    )
    assert hvdc_code == "HVDC-ADOPT-PPL-0002"
    assert case_no == "CASE-002"
