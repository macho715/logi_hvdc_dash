#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gate 1 QA validation for Supabase data integrity.

Requirements:
  - SUPABASE_DB_URL or --db-url
  - Optional: --connect-timeout SECONDS or PGCONNECT_TIMEOUT
  - Optional: --json or -j for JSON output (CI/CD friendly)
  - psycopg[binary]>=3.0.0
"""

from __future__ import annotations

import json
import os
import sys
from typing import Optional
from urllib.parse import parse_qs, urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print(
        "[gate1_qa] ERROR: psycopg[binary] is required. Install with: pip install 'psycopg[binary]>=3.0.0'",
        file=sys.stderr,
    )
    sys.exit(1)

DEFAULT_CONNECT_TIMEOUT = 10


def redact_db_url(db_url: str) -> str:
    try:
        parts = urlsplit(db_url)
        if not parts.scheme or not parts.netloc:
            return "<redacted>"
        netloc = parts.netloc
        if "@" in netloc:
            userinfo, hostinfo = netloc.split("@", 1)
            if ":" in userinfo:
                user = userinfo.split(":", 1)[0]
                userinfo = f"{user}:***"
            else:
                userinfo = "***"
            netloc = f"{userinfo}@{hostinfo}"
        return urlunsplit((parts.scheme, netloc, parts.path, "", ""))
    except Exception:
        return "<redacted>"


def has_connect_timeout(db_url: str) -> bool:
    if "connect_timeout" in db_url:
        return True
    try:
        parts = urlsplit(db_url)
        if not parts.query:
            return False
        return "connect_timeout" in parse_qs(parts.query)
    except Exception:
        return False


def parse_positive_int(value: str, label: str) -> int:
    try:
        number = int(value)
    except ValueError:
        print(f"[gate1_qa] ERROR: {label} must be an integer", file=sys.stderr)
        sys.exit(1)
    if number < 1:
        print(f"[gate1_qa] ERROR: {label} must be >= 1", file=sys.stderr)
        sys.exit(1)
    return number


def parse_db_url(args: list[str]) -> tuple[Optional[str], list[str]]:
    db_url = os.getenv("SUPABASE_DB_URL")
    if "--db-url" in args:
        i = args.index("--db-url")
        if i + 1 >= len(args):
            print("[gate1_qa] ERROR: --db-url requires a value", file=sys.stderr)
            sys.exit(1)
        db_url = args[i + 1]
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]
    return db_url, args


def parse_connect_timeout(args: list[str], db_url: Optional[str]) -> tuple[Optional[int], list[str]]:
    connect_timeout: Optional[int] = None
    if "--connect-timeout" in args:
        i = args.index("--connect-timeout")
        if i + 1 >= len(args):
            print("[gate1_qa] ERROR: --connect-timeout requires a value", file=sys.stderr)
            sys.exit(1)
        connect_timeout = parse_positive_int(args[i + 1], "connect timeout")
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]

    if connect_timeout is None:
        env_timeout = os.getenv("PGCONNECT_TIMEOUT")
        if env_timeout:
            connect_timeout = parse_positive_int(env_timeout, "PGCONNECT_TIMEOUT")

    if connect_timeout is None and db_url and not has_connect_timeout(db_url):
        connect_timeout = DEFAULT_CONNECT_TIMEOUT

    return connect_timeout, args


def main() -> None:
    args = sys.argv[1:]
    db_url, args = parse_db_url(args)
    connect_timeout, args = parse_connect_timeout(args, db_url)
    json_output = "--json" in args or "-j" in args
    args = [a for a in args if a not in ("--json", "-j")]
    if args:
        print(f"[gate1_qa] ERROR: Unknown arguments: {' '.join(args)}", file=sys.stderr)
        sys.exit(1)
    if not db_url:
        print("[gate1_qa] ERROR: SUPABASE_DB_URL or --db-url required", file=sys.stderr)
        print(
            "[gate1_qa] Usage: python scripts/hvdc/gate1_qa.py [--db-url URL] [--connect-timeout SECONDS] [--json]",
            file=sys.stderr,
        )
        sys.exit(1)

    if not json_output:
        timeout_label = f"{connect_timeout}s" if connect_timeout else "default"
        print(f"[gate1_qa] Connecting to database (timeout={timeout_label})...")
        print(f"[gate1_qa] Database: {redact_db_url(db_url)}")
        print("\n=== Gate 1 QA ===\n")

    try:
        connect_kwargs = {"autocommit": True}
        if connect_timeout:
            connect_kwargs["connect_timeout"] = connect_timeout
        with psycopg.connect(db_url, **connect_kwargs) as conn:
            with conn.cursor() as cursor:
                results: dict = {}
                all_pass = True

                # 1. Orphan checks
                if not json_output:
                    print("--- Orphan checks ---")
                cursor.execute(
                    """
                    SELECT COUNT(*)::bigint AS orphan_status_events
                    FROM status.events_status es
                    LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
                    WHERE ss.hvdc_code IS NULL
                    """
                )
                orphan_status_events = cursor.fetchone()[0]
                status_ok = orphan_status_events == 0
                results["orphan_status_events"] = {"count": orphan_status_events, "ok": status_ok}
                if not json_output:
                    print(f"orphan_status_events: {orphan_status_events} {'OK' if status_ok else 'FAIL'}")
                if not status_ok:
                    all_pass = False

                cursor.execute(
                    """
                    SELECT COUNT(*)::bigint AS orphan_case_events
                    FROM "case".events_case e
                    LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
                    WHERE c.hvdc_code IS NULL
                    """
                )
                orphan_case_events = cursor.fetchone()[0]
                case_ok = orphan_case_events == 0
                results["orphan_case_events"] = {"count": orphan_case_events, "ok": case_ok}
                if not json_output:
                    print(f"orphan_case_events: {orphan_case_events} {'OK' if case_ok else 'FAIL'}")
                if not case_ok:
                    all_pass = False

                # 2. Duplicate checks
                if not json_output:
                    print("\n--- Duplicate checks ---")
                cursor.execute(
                    """
                    SELECT COUNT(*)::bigint AS dup_events_case_rows
                    FROM (
                        SELECT
                            hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
                            COUNT(*)::bigint AS cnt
                        FROM "case".events_case
                        GROUP BY 1,2,3,4,5,6,7
                        HAVING COUNT(*) > 1
                    ) d
                    """
                )
                dup_events_case_rows = cursor.fetchone()[0]
                dup_ok = dup_events_case_rows == 0
                results["dup_events_case_rows"] = {"count": dup_events_case_rows, "ok": dup_ok}
                if not json_output:
                    print(f"dup_events_case_rows: {dup_events_case_rows} {'OK' if dup_ok else 'FAIL'}")
                if not dup_ok:
                    all_pass = False

                # 3. Flow code rules
                if not json_output:
                    print("\n--- Flow code rules ---")
                cursor.execute(
                    """
                    SELECT COUNT(*)::bigint AS bad_flow5
                    FROM "case".flows
                    WHERE flow_code = 5 AND requires_review IS NOT TRUE
                    """
                )
                bad_flow5 = cursor.fetchone()[0]
                flow5_ok = bad_flow5 == 0
                results["bad_flow5"] = {"count": bad_flow5, "ok": flow5_ok}
                if not json_output:
                    print(f"bad_flow5: {bad_flow5} {'OK' if flow5_ok else 'FAIL'}")
                if not flow5_ok:
                    all_pass = False

                cursor.execute(
                    """
                    SELECT COUNT(*)::bigint AS agi_das_violation
                    FROM "case".cases c
                    JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
                    WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3
                    """
                )
                agi_das_violation = cursor.fetchone()[0]
                agi_das_ok = agi_das_violation == 0
                results["agi_das_violation"] = {"count": agi_das_violation, "ok": agi_das_ok}
                if not json_output:
                    print(f"agi_das_violation: {agi_das_violation} {'OK' if agi_das_ok else 'FAIL'}")
                if not agi_das_ok:
                    all_pass = False

                # 4. Coverage
                if not json_output:
                    print("\n--- Coverage ---")
                cursor.execute(
                    """
                    SELECT
                        (SELECT COUNT(DISTINCT hvdc_code) FROM status.shipments_status) AS shipments_count,
                        (SELECT COUNT(DISTINCT hvdc_code) FROM status.events_status) AS events_shipments_count
                    """
                )
                shipments_count, events_shipments_count = cursor.fetchone()
                results["coverage"] = {
                    "shipments_count": shipments_count,
                    "events_shipments_count": events_shipments_count,
                }
                if not json_output:
                    print(f"shipments_count: {shipments_count}")
                    print(f"events_shipments_count: {events_shipments_count}")

                cursor.execute(
                    """
                    SELECT
                        (SELECT COUNT(*) FROM "case".cases) AS cases_count,
                        (SELECT COUNT(DISTINCT hvdc_code) FROM "case".cases) AS unique_hvdc_codes
                    """
                )
                cases_count, unique_hvdc_codes = cursor.fetchone()
                results["coverage"]["cases_count"] = cases_count
                results["coverage"]["unique_hvdc_codes"] = unique_hvdc_codes
                if not json_output:
                    print(f"cases_count: {cases_count}")
                    print(f"unique_hvdc_codes: {unique_hvdc_codes}")

                results["all_pass"] = all_pass
                results["status"] = "OK" if all_pass else "FAIL"

                if json_output:
                    print(json.dumps(results, indent=2))
                else:
                    print("\n=== Gate 1 QA Summary ===")
                    if all_pass:
                        print("OK: All checks passed.")
                    else:
                        print("FAIL: Some checks failed. Review the results above.")

                sys.exit(0 if all_pass else 1)

    except psycopg.Error as e:
        if json_output:
            print(json.dumps({"error": str(e), "status": "ERROR"}, indent=2), file=sys.stderr)
        else:
            print(f"[gate1_qa] ERROR: Database error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        if json_output:
            print(json.dumps({"error": str(e), "status": "ERROR"}, indent=2), file=sys.stderr)
        else:
            print(f"[gate1_qa] ERROR: Unexpected error: {e}", file=sys.stderr)
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
