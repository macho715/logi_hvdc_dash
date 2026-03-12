"""Integration tests for HVDC ETL scripts.

These map directly to the test cases referenced in plan.md:
- test_etl_script_untitled4_executes
- test_etl_script_untitled3_executes
- test_csv_files_generated
- test_csv_data_matches_source

By default these tests are skipped because they can be heavy.
Enable with:
  HVDC_ETL_RUN=1 pytest -q tests/integration/test_etl.py

Required local files (per docs/DATA_LOADING_PLAN.md / docs/ETL_GUIDE.md):
- supabass_ontol/HVDC all status.json (or HVDC_all_status.json)
- supabass_ontol/hvdc_warehouse_status.json
- (Option-C) supabass_ontol/HVDC_STATUS.json
"""

from __future__ import annotations

import csv
import json
import os
import subprocess
from pathlib import Path
from typing import Any, Iterable, Iterator

import pytest


def _repo_root() -> Path:
    # tests/integration/test_etl.py -> repo root is two levels up
    return Path(__file__).resolve().parents[2]


def _first_existing(base: Path, candidates: Iterable[str]) -> Path | None:
    for name in candidates:
        p = base / name
        if p.exists():
            return p
    # case-insensitive fallback
    lower_map = {p.name.lower(): p for p in base.glob('*')}
    for name in candidates:
        hit = lower_map.get(name.lower())
        if hit is not None and hit.exists():
            return hit
    return None


def _extract_hvdc_codes(obj: Any) -> Iterator[str]:
    """Best-effort recursive extractor for hvdc_code-like fields."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            lk = str(k).lower()
            if lk in {"hvdc_code", "hvdccode", "hvdc", "code"} and isinstance(v, str):
                yield v.strip()
            yield from _extract_hvdc_codes(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from _extract_hvdc_codes(item)


@pytest.mark.integration
@pytest.mark.skipif(os.getenv("HVDC_ETL_RUN") not in {"1", "true", "on"}, reason="Set HVDC_ETL_RUN=1 to execute heavy ETL integration tests")
def test_etl_script_untitled4_executes_and_generates_csv(tmp_path: Path) -> None:
    repo = _repo_root()
    src = repo / "supabass_ontol"

    status_json = _first_existing(src, ["HVDC all status.json", "HVDC_all_status.json", "hvdc_all_status.json"])
    warehouse_json = _first_existing(src, ["hvdc_warehouse_status.json"])

    if status_json is None or warehouse_json is None:
        pytest.skip("Missing required source JSON files in supabass_ontol/")

    script = src / "Untitled-4_dashboard_ready_FULL.py"
    if not script.exists():
        pytest.skip("Missing ETL script Untitled-4_dashboard_ready_FULL.py")

    outdir = tmp_path / "hvdc_output"
    outdir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "python",
        str(script),
        "--status",
        str(status_json),
        "--warehouse",
        str(warehouse_json),
        "--outdir",
        str(outdir),
        "--base-iri",
        "https://example.com/hvdc",
    ]

    # Optional: case locations
    case_locations = repo / "supabase_csv_optionC_v3" / "locations.csv"
    if case_locations.exists():
        cmd += ["--case-locations", str(case_locations)]

    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0, f"ETL failed\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"

    assert (outdir / "supabase" / "shipments_status.csv").exists()
    assert (outdir / "supabase" / "events_status.csv").exists()
    assert (outdir / "supabase" / "schema.sql").exists()
    assert (outdir / "report" / "qa_report.md").exists()
    assert (outdir / "report" / "orphan_wh.json").exists()


@pytest.mark.integration
@pytest.mark.skipif(os.getenv("HVDC_ETL_RUN") not in {"1", "true", "on"}, reason="Set HVDC_ETL_RUN=1 to execute heavy ETL integration tests")
def test_etl_script_untitled3_executes_and_generates_csv(tmp_path: Path) -> None:
    repo = _repo_root()
    src = repo / "supabass_ontol"

    all_json = _first_existing(src, ["HVDC all status.json", "HVDC_all_status.json", "hvdc_allshpt_status.json"])
    warehouse_json = _first_existing(src, ["hvdc_warehouse_status.json"])
    customs_json = _first_existing(src, ["HVDC_STATUS.json", "hvdc_status.json"])

    if all_json is None or warehouse_json is None or customs_json is None:
        pytest.skip("Missing required JSON files for Option-C ETL")

    script = src / "Untitled-3_dashboard_ready_FULL.py"
    if not script.exists():
        pytest.skip("Missing ETL script Untitled-3_dashboard_ready_FULL.py")

    outdir = tmp_path / "supabase_csv_optionC_v3"
    outdir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "python",
        str(script),
        "--all",
        str(all_json),
        "--wh",
        str(warehouse_json),
        "--customs",
        str(customs_json),
        "--output-dir",
        str(outdir),
        "--base-iri",
        "https://example.com/hvdc",
        "--export-ttl",
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0, f"ETL failed\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"

    for name in ["locations.csv", "shipments_case.csv", "cases.csv", "flows.csv", "events_case.csv"]:
        assert (outdir / name).exists(), f"Missing output: {name}"


@pytest.mark.integration
@pytest.mark.skipif(os.getenv("HVDC_ETL_RUN") not in {"1", "true", "on"}, reason="Set HVDC_ETL_RUN=1 to execute heavy ETL integration tests")
def test_csv_data_matches_source_best_effort(tmp_path: Path) -> None:
    """Best-effort coverage validation: unique hvdc_code in JSON == unique hvdc_code in shipments_status.csv.

    This can be skipped if JSON structure is not parseable or does not expose hvdc_code fields.
    """

    repo = _repo_root()
    src = repo / "supabass_ontol"

    status_json = _first_existing(src, ["HVDC all status.json", "HVDC_all_status.json", "hvdc_all_status.json"])
    warehouse_json = _first_existing(src, ["hvdc_warehouse_status.json"])
    if status_json is None or warehouse_json is None:
        pytest.skip("Missing required source JSON")

    script = src / "Untitled-4_dashboard_ready_FULL.py"
    if not script.exists():
        pytest.skip("Missing ETL script")

    outdir = tmp_path / "hvdc_output"
    outdir.mkdir(parents=True, exist_ok=True)

    res = subprocess.run(
        [
            "python",
            str(script),
            "--status",
            str(status_json),
            "--warehouse",
            str(warehouse_json),
            "--outdir",
            str(outdir),
            "--base-iri",
            "https://example.com/hvdc",
        ],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"ETL failed\nSTDERR:\n{res.stderr}"

    csv_path = outdir / "supabase" / "shipments_status.csv"
    assert csv_path.exists()

    # Load hvdc_code set from CSV
    csv_codes: set[str] = set()
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if "hvdc_code" not in (reader.fieldnames or []):
            pytest.skip("shipments_status.csv missing hvdc_code column")
        for row in reader:
            code = (row.get("hvdc_code") or "").strip()
            if code:
                csv_codes.add(code)

    # Load JSON and extract hvdc codes
    try:
        with status_json.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, MemoryError) as e:
        pytest.skip(f"Unable to parse status JSON for coverage check: {e}")

    json_codes = {c for c in _extract_hvdc_codes(data) if c}
    if not json_codes:
        pytest.skip("Could not extract hvdc_code-like fields from JSON; skipping coverage check")

    assert csv_codes == json_codes
