#!/usr/bin/env python3
"""
Verify source data pipeline for Realtime KPI Dashboard implementation.

Checks:
1. Source JSON files exist
2. ETL CSV files generated
3. Migration file exists
4. CSV files have expected structure
5. Gate 1 QA validation queries (requires Supabase connection)
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Project root (assuming script is in scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
SUPABASS_ONTOL = PROJECT_ROOT / "supabase" / "data" / "raw"
HVDC_OUTPUT = PROJECT_ROOT / "hvdc_output"
MIGRATION_FILE = PROJECT_ROOT / "supabase" / "scripts" / "20260124_hvdc_layers_status_case_ops.sql"


def check_source_json_files() -> Tuple[bool, List[str]]:
    """Check if source JSON files exist."""
    errors = []
    required_files = [
        SUPABASS_ONTOL / "HVDC all status.json",
        SUPABASS_ONTOL / "hvdc_warehouse_status.json",
    ]
    
    for file_path in required_files:
        if not file_path.exists():
            errors.append(f"Missing source file: {file_path}")
    
    return len(errors) == 0, errors


def check_etl_csv_files() -> Tuple[bool, List[str]]:
    """Check if ETL output CSV files exist."""
    errors = []
    required_csvs = {
        "Status layer": [
            HVDC_OUTPUT / "supabase" / "shipments.csv",
            HVDC_OUTPUT / "supabase" / "logistics_events.csv",
        ],
        "Case Option-C layer": [
            HVDC_OUTPUT / "optionC" / "locations.csv",
            HVDC_OUTPUT / "optionC" / "shipments.csv",
            HVDC_OUTPUT / "optionC" / "cases.csv",
            HVDC_OUTPUT / "optionC" / "flows.csv",
            HVDC_OUTPUT / "optionC" / "events.csv",
        ],
    }
    
    for layer, files in required_csvs.items():
        for file_path in files:
            if not file_path.exists():
                errors.append(f"Missing {layer} CSV: {file_path}")
    
    return len(errors) == 0, errors


def check_csv_structure() -> Tuple[bool, List[str]]:
    """Check if CSV files have expected headers (basic validation)."""
    errors = []
    warnings = []
    
    # Expected headers for key files
    expected_headers = {
        HVDC_OUTPUT / "optionC" / "locations.csv": ["location_id", "location_code", "name", "category"],
        HVDC_OUTPUT / "optionC" / "cases.csv": ["hvdc_code", "case_no"],
        HVDC_OUTPUT / "optionC" / "flows.csv": ["hvdc_code", "case_no", "flow_code"],
        HVDC_OUTPUT / "optionC" / "events.csv": ["hvdc_code", "case_no", "event_type", "event_time_iso"],
    }
    
    for file_path, expected_cols in expected_headers.items():
        if not file_path.exists():
            continue
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                first_line = f.readline().strip()
                headers = [h.strip() for h in first_line.split(",")]
                
                missing_cols = [col for col in expected_cols if col not in headers]
                if missing_cols:
                    warnings.append(
                        f"{file_path.name}: Missing expected columns: {missing_cols}"
                    )
        except Exception as e:
            errors.append(f"Error reading {file_path}: {e}")
    
    return len(errors) == 0, errors + warnings


def check_migration_file() -> Tuple[bool, List[str]]:
    """Check if migration file exists and has expected content."""
    errors = []
    
    if not MIGRATION_FILE.exists():
        errors.append(f"Migration file not found: {MIGRATION_FILE}")
        return False, errors
    
    # Check for key schema/table creation
    try:
        with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            
            required_patterns = [
                "create schema if not exists status",
                "create schema if not exists \"case\"",
                "create table if not exists status.shipments_status",
                "create table if not exists \"case\".cases",
                "create table if not exists \"case\".flows",
                "create table if not exists \"case\".events_case",
                "create or replace view public.v_case_segments",
            ]
            
            missing_patterns = [
                pattern for pattern in required_patterns
                if pattern.lower() not in content.lower()
            ]
            
            if missing_patterns:
                errors.append(
                    f"Migration file missing expected patterns: {missing_patterns}"
                )
    except Exception as e:
        errors.append(f"Error reading migration file: {e}")
    
    return len(errors) == 0, errors


def generate_gate1_qa_queries() -> str:
    """Generate Gate 1 QA validation SQL queries."""
    return """
-- Gate 1 QA Validation Queries
-- Run these in Supabase SQL Editor after applying migration and loading CSV data

-- 3.1 Orphan Check (Status layer)
SELECT COUNT(*)::bigint AS orphan_status_events
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;

-- 3.1 Orphan Check (Case layer)
SELECT COUNT(*)::bigint AS orphan_case_events
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;

-- 3.2 Duplicate Check (natural key)
SELECT
  hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
  COUNT(*)::bigint AS cnt
FROM "case".events_case
GROUP BY 1, 2, 3, 4, 5, 6, 7
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- 3.3 Flow Code 5 Rule
SELECT COUNT(*)::bigint AS bad_flow5
FROM "case".flows
WHERE flow_code = 5 AND requires_review IS NOT TRUE;

-- Verify KPI Views Exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'v_case_segments',
    'v_voyage_segments',
    'v_case_kpi',
    'v_kpi_site_flow_daily',
    'v_shipments_master',
    'v_shipments_timeline',
    'v_cases_kpi',
    'v_case_event_segments'
  )
ORDER BY table_name;
"""


def main() -> int:
    """Run all validation checks."""
    print("=" * 80)
    print("Source Data Pipeline Validation")
    print("=" * 80)
    print()
    
    all_passed = True
    all_errors = []
    all_warnings = []
    
    # Check 1: Source JSON files
    print("1. Checking source JSON files...")
    passed, errors = check_source_json_files()
    if passed:
        print("   [OK] Source JSON files exist")
    else:
        print("   [FAIL] Source JSON files missing:")
        for error in errors:
            print(f"     - {error}")
        all_passed = False
        all_errors.extend(errors)
    print()
    
    # Check 2: ETL CSV files
    print("2. Checking ETL CSV output files...")
    passed, errors = check_etl_csv_files()
    if passed:
        print("   [OK] All required CSV files exist")
    else:
        print("   [FAIL] Missing CSV files:")
        for error in errors:
            print(f"     - {error}")
        all_passed = False
        all_errors.extend(errors)
    print()
    
    # Check 3: CSV structure
    print("3. Checking CSV file structure...")
    passed, issues = check_csv_structure()
    if passed and not issues:
        print("   [OK] CSV files have expected structure")
    else:
        for issue in issues:
            if "Missing expected columns" in issue:
                print(f"   [WARN] {issue}")
                all_warnings.append(issue)
            else:
                print(f"   [FAIL] {issue}")
                all_errors.append(issue)
                all_passed = False
    print()
    
    # Check 4: Migration file
    print("4. Checking migration file...")
    passed, errors = check_migration_file()
    if passed:
        print(f"   [OK] Migration file exists: {MIGRATION_FILE}")
        print("   [OK] Migration file contains expected schema/table definitions")
    else:
        print("   [FAIL] Migration file issues:")
        for error in errors:
            print(f"     - {error}")
        all_passed = False
        all_errors.extend(errors)
    print()
    
    # Generate Gate 1 QA queries
    print("5. Gate 1 QA Validation Queries")
    print("   (Run these in Supabase SQL Editor after applying migration)")
    qa_queries_file = PROJECT_ROOT / "scripts" / "gate1_qa_queries.sql"
    with open(qa_queries_file, "w", encoding="utf-8") as f:
        f.write(generate_gate1_qa_queries())
    print(f"   [OK] Generated: {qa_queries_file}")
    print()
    
    # Summary
    print("=" * 80)
    print("Summary")
    print("=" * 80)
    
    if all_passed:
        print("[OK] All validation checks passed!")
        print()
        print("Next steps:")
        print("1. Apply migration: supabase/scripts/20260124_hvdc_layers_status_case_ops.sql")
        print("2. Load CSV data in order: locations -> shipments -> cases -> flows -> events")
        print("3. Run Gate 1 QA queries: scripts/gate1_qa_queries.sql")
        return 0
    else:
        print("[FAIL] Validation failed with errors:")
        for error in all_errors:
            print(f"  - {error}")
        
        if all_warnings:
            print()
            print("[WARN] Warnings:")
            for warning in all_warnings:
                print(f"  - {warning}")
        
        return 1


if __name__ == "__main__":
    sys.exit(main())
