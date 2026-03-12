"""Integration tests for data loading into Supabase.

Maps to plan.md:
- test_status_tables_loaded
- test_case_tables_loaded
- test_csv_loading_order_enforced

These tests assume CSV import has been completed.
They are skipped automatically if SUPABASE_DB_URL is missing.
"""

from __future__ import annotations

import os
import pytest

from tests.utils.db import db_conn, fetch_one


def _skip_if_no_db() -> None:
    if not os.getenv("SUPABASE_DB_URL"):
        pytest.skip("SUPABASE_DB_URL not set")


@pytest.mark.integration
def test_status_tables_loaded() -> None:
    _skip_if_no_db()
    try:
        row = fetch_one("SELECT COUNT(*)::bigint FROM status.shipments_status;")
        shipments_count = int(row[0])
        row = fetch_one("SELECT COUNT(*)::bigint FROM status.events_status;")
        events_count = int(row[0])
    except Exception as e:
        pytest.fail(f"DB query failed (did you apply DDL?): {e}")

    assert shipments_count > 0, "status.shipments_status is empty"
    assert events_count > 0, "status.events_status is empty"


@pytest.mark.integration
def test_case_tables_loaded() -> None:
    _skip_if_no_db()
    try:
        counts = {
            "locations": int(fetch_one('SELECT COUNT(*)::bigint FROM "case".locations;')[0]),
            "shipments_case": int(fetch_one('SELECT COUNT(*)::bigint FROM "case".shipments_case;')[0]),
            "cases": int(fetch_one('SELECT COUNT(*)::bigint FROM "case".cases;')[0]),
            "flows": int(fetch_one('SELECT COUNT(*)::bigint FROM "case".flows;')[0]),
            "events_case": int(fetch_one('SELECT COUNT(*)::bigint FROM "case".events_case;')[0]),
        }
    except Exception as e:
        pytest.fail(f"DB query failed (did you apply DDL & load CSVs?): {e}")

    # Minimal sanity: Option-C present means these should be > 0
    assert counts["locations"] > 0
    assert counts["cases"] > 0
    assert counts["flows"] > 0
    assert counts["events_case"] > 0


@pytest.mark.integration
def test_csv_loading_order_enforced_no_orphans() -> None:
    """Validates that FK/order constraints were respected (Gate 1 orphan checks + location integrity)."""

    _skip_if_no_db()

    orphan_status_events = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM status.events_status es
        LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
        WHERE ss.hvdc_code IS NULL;
        """
    )[0])

    orphan_case_events = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM "case".events_case e
        LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
        WHERE c.hvdc_code IS NULL;
        """
    )[0])

    orphan_location_refs = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM "case".events_case e
        LEFT JOIN "case".locations l ON l.location_id = e.location_id
        WHERE e.location_id IS NOT NULL
          AND l.location_id IS NULL;
        """
    )[0])

    assert orphan_status_events == 0
    assert orphan_case_events == 0
    assert orphan_location_refs == 0
