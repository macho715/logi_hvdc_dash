"""Validation tests for Gate 1 QA.

These correspond to Phase 5 in docs/DATA_LOADING_PLAN.md.
They should be executed after CSV import.

The intent is to make Gate 1 a hard CI gate before enabling Realtime subscriptions.
"""

from __future__ import annotations

import os
import pytest

from tests.utils.db import fetch_one


def _skip_if_no_db() -> None:
    if not os.getenv("SUPABASE_DB_URL"):
        pytest.skip("SUPABASE_DB_URL not set")


@pytest.mark.validation

def test_gate1_orphan_checks() -> None:
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

    assert orphan_status_events == 0
    assert orphan_case_events == 0


@pytest.mark.validation

def test_gate1_duplicate_events_case() -> None:
    _skip_if_no_db()
    dup_rows = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM (
          SELECT
            hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
            COUNT(*)::bigint AS cnt
          FROM "case".events_case
          GROUP BY 1,2,3,4,5,6,7
          HAVING COUNT(*) > 1
        ) d;
        """
    )[0])
    assert dup_rows == 0


@pytest.mark.validation

def test_gate1_flow_code_rules() -> None:
    _skip_if_no_db()

    bad_flow5 = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM "case".flows
        WHERE flow_code = 5 AND requires_review IS NOT TRUE;
        """
    )[0])

    agi_das_violation = int(fetch_one(
        """
        SELECT COUNT(*)::bigint
        FROM "case".cases c
        JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
        WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3;
        """
    )[0])

    assert bad_flow5 == 0
    assert agi_das_violation == 0
