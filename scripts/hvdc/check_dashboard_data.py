#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check dashboard data availability and Realtime status"""

import os
import sys
from urllib.parse import urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print("[check_dashboard_data] ERROR: psycopg[binary] is required", file=sys.stderr)
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
        print("[check_dashboard_data] ERROR: SUPABASE_DB_URL required", file=sys.stderr)
        sys.exit(1)

    print(f"[check_dashboard_data] Database: {redact_db_url(db_url)}")
    print("\n=== Dashboard Data Availability Check ===\n")

    try:
        with psycopg.connect(db_url, autocommit=True) as conn:
            with conn.cursor() as cursor:
                # 1. Status layer tables
                print("--- Status Layer ---")
                cursor.execute("SELECT COUNT(*) FROM status.shipments_status")
                status_shipments = cursor.fetchone()[0]
                print(f"status.shipments_status: {status_shipments} rows")

                cursor.execute("SELECT COUNT(*) FROM status.events_status")
                status_events = cursor.fetchone()[0]
                print(f"status.events_status: {status_events} rows")

                # 2. Public tables / views (dashboard queries these)
                print("\n--- Public Tables & Views (Dashboard Queries) ---")
                cursor.execute("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name IN ('shipments', 'warehouse_inventory', 'location_statuses', 'hvdc_kpis', 'hvdc_worklist')
                    ORDER BY table_name
                """)
                public_tables = [r[0] for r in cursor.fetchall()]
                cursor.execute("""
                    SELECT table_name
                    FROM information_schema.views
                    WHERE table_schema = 'public'
                    AND table_name IN ('shipments', 'warehouse_inventory', 'location_statuses', 'hvdc_kpis', 'hvdc_worklist')
                    ORDER BY table_name
                """)
                public_views = [r[0] for r in cursor.fetchall()]
                print(f"Public tables: {public_tables}")
                print(f"Public views (dashboard): {public_views}")

                for name in ["shipments", "warehouse_inventory", "location_statuses", "hvdc_kpis", "hvdc_worklist"]:
                    if name in public_views:
                        cursor.execute(f'SELECT COUNT(*) FROM public."{name}"')
                        count = cursor.fetchone()[0]
                        print(f"  public.{name}: {count} rows (view)")
                    elif name in public_tables:
                        cursor.execute(f'SELECT COUNT(*) FROM public."{name}"')
                        count = cursor.fetchone()[0]
                        print(f"  public.{name}: {count} rows (table)")
                    else:
                        print(f"  public.{name}: NOT EXISTS")

                # 3. Dashboard views
                print("\n--- Dashboard Views ---")
                cursor.execute("""
                    SELECT table_name
                    FROM information_schema.views
                    WHERE table_schema = 'public'
                    AND table_name LIKE 'v_%'
                    ORDER BY table_name
                """)
                views = [r[0] for r in cursor.fetchall()]
                print(f"Views found: {views}")

                for view in views:
                    try:
                        cursor.execute(f'SELECT COUNT(*) FROM public."{view}"')
                        count = cursor.fetchone()[0]
                        print(f"  public.{view}: {count} rows")
                    except Exception as e:
                        print(f"  public.{view}: ERROR ({e})")

                # 4. Realtime publication
                print("\n--- Realtime Publication ---")
                cursor.execute("""
                    SELECT schemaname, tablename
                    FROM pg_publication_tables
                    WHERE pubname = 'supabase_realtime'
                    AND schemaname IN ('status', 'case', 'public')
                    ORDER BY schemaname, tablename
                """)
                realtime_tables = cursor.fetchall()
                print(f"Realtime enabled tables: {len(realtime_tables)}")
                for schema, table in realtime_tables:
                    print(f"  {schema}.{table}")

                # 5. Dashboard compatibility check
                print("\n=== Dashboard Compatibility Check ===")
                has_public_shipments = "shipments" in public_tables or "shipments" in public_views
                has_status_data = status_shipments > 0

                if has_public_shipments:
                    cursor.execute('SELECT COUNT(*) FROM public."shipments"')
                    public_shipments_count = cursor.fetchone()[0]
                    if public_shipments_count == 0:
                        print("[WARN] Dashboard queries public.shipments but it's empty")
                        print(f"   - status.shipments_status has {status_shipments} rows")
                        print("   - Consider: Create view or sync data to public.shipments")
                    else:
                        kind = "view" if "shipments" in public_views else "table"
                        print(f"[OK] public.shipments ({kind}) has {public_shipments_count} rows")
                else:
                    print("[WARN] public.shipments table does not exist")
                    print(f"   - status.shipments_status has {status_shipments} rows")
                    print("   - Dashboard API may need to query status.shipments_status or views")

                if has_status_data:
                    print(
                        f"[OK] Status layer has data ({status_shipments} shipments, {status_events} events)"
                    )
                else:
                    print("[FAIL] Status layer is empty")

    except Exception as e:
        print(f"[check_dashboard_data] ERROR: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
