#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check row counts in status tables and verify Phase 4 completion"""

import os
import sys
from urllib.parse import urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print("[check_status_tables] ERROR: psycopg[binary] is required", file=sys.stderr)
    sys.exit(1)


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


def main():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("[check_status_tables] ERROR: SUPABASE_DB_URL required", file=sys.stderr)
        sys.exit(1)

    print(f"[check_status_tables] Database: {redact_db_url(db_url)}")
    print("\n=== Phase 4 CSV Loading Verification ===\n")

    try:
        with psycopg.connect(db_url, autocommit=True) as conn:
            with conn.cursor() as cursor:
                # 1. Row counts
                cursor.execute("SELECT COUNT(*) FROM status.shipments_status")
                shipments_count = cursor.fetchone()[0]
                print(f"[OK] status.shipments_status: {shipments_count} rows")

                cursor.execute("SELECT COUNT(*) FROM status.events_status")
                events_count = cursor.fetchone()[0]
                print(f"[OK] status.events_status: {events_count} rows")

                total_rows = shipments_count + events_count
                print(f"[OK] Total rows: {total_rows}")

                # 2. Unique hvdc_codes
                cursor.execute("SELECT COUNT(DISTINCT hvdc_code) FROM status.shipments_status")
                unique_hvdc = cursor.fetchone()[0]
                print(f"[OK] Unique hvdc_codes: {unique_hvdc}")

                # 3. Orphan events check
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM status.events_status e
                    LEFT JOIN status.shipments_status s ON e.hvdc_code = s.hvdc_code
                    WHERE s.hvdc_code IS NULL
                """)
                orphan_count = cursor.fetchone()[0]
                print(f"[OK] Orphan events: {orphan_count}")

                # 4. Sample data
                if shipments_count > 0:
                    cursor.execute("SELECT hvdc_code FROM status.shipments_status LIMIT 5")
                    sample = [r[0] for r in cursor.fetchall()]
                    print(f"[OK] Sample hvdc_codes: {sample}")

                # 5. Phase 4 completion check
                print("\n=== Phase 4 Completion Status ===")
                expected_shipments = 871
                expected_events = 928
                expected_total = 1799
                expected_unique = 871
                expected_orphan = 0

                all_pass = (
                    shipments_count == expected_shipments
                    and events_count == expected_events
                    and total_rows == expected_total
                    and unique_hvdc == expected_unique
                    and orphan_count == expected_orphan
                )

                if all_pass:
                    print("[OK] Phase 4 CSV loading: COMPLETE")
                    print(f"    - shipments_status: {shipments_count}/{expected_shipments} ok")
                    print(f"    - events_status: {events_count}/{expected_events} ok")
                    print(f"    - Total rows: {total_rows}/{expected_total} ok")
                    print(f"    - Unique hvdc_codes: {unique_hvdc}/{expected_unique} ok")
                    print(f"    - Orphan events: {orphan_count}/{expected_orphan} ok")
                else:
                    print("[FAIL] Phase 4 CSV loading: INCOMPLETE or MISMATCH")
                    if shipments_count != expected_shipments:
                        print(f"    - shipments_status: {shipments_count} (expected {expected_shipments})")
                    if events_count != expected_events:
                        print(f"    - events_status: {events_count} (expected {expected_events})")
                    if total_rows != expected_total:
                        print(f"    - Total rows: {total_rows} (expected {expected_total})")
                    if unique_hvdc != expected_unique:
                        print(f"    - Unique hvdc_codes: {unique_hvdc} (expected {expected_unique})")
                    if orphan_count != expected_orphan:
                        print(f"    - Orphan events: {orphan_count} (expected {expected_orphan})")

    except Exception as e:
        print(f"[check_status_tables] ERROR: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
