#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Load CSV files into Supabase using Python (psql 대안)

Requirements:
  - SUPABASE_DB_URL or --db-url
  - Optional: --connect-timeout SECONDS or PGCONNECT_TIMEOUT
  - psycopg[binary]>=3.0.0
"""

import csv
import io
import os
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print("[load_csv] ERROR: psycopg[binary] is required. Install with: pip install 'psycopg[binary]>=3.0.0'", file=sys.stderr)
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
        print(f"[load_csv] ERROR: {label} must be an integer", file=sys.stderr)
        sys.exit(1)
    if number < 1:
        print(f"[load_csv] ERROR: {label} must be >= 1", file=sys.stderr)
        sys.exit(1)
    return number


def parse_db_url(args: list[str]) -> tuple[Optional[str], list[str]]:
    db_url = os.getenv("SUPABASE_DB_URL")
    if "--db-url" in args:
        i = args.index("--db-url")
        if i + 1 >= len(args):
            print("[load_csv] ERROR: --db-url requires a value", file=sys.stderr)
            sys.exit(1)
        db_url = args[i + 1]
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]
    return db_url, args


def parse_connect_timeout(args: list[str], db_url: Optional[str]) -> tuple[Optional[int], list[str]]:
    connect_timeout: Optional[int] = None
    if "--connect-timeout" in args:
        i = args.index("--connect-timeout")
        if i + 1 >= len(args):
            print("[load_csv] ERROR: --connect-timeout requires a value", file=sys.stderr)
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


def load_csv_table(
    conn: psycopg.Connection,
    schema: str,
    table: str,
    csv_path: Path,
    columns: list[str],
    do_truncate: bool = False,
    force_null: Optional[list[str]] = None,
    primary_key: Optional[list[str]] = None,
    dedupe_order_by: Optional[str] = None,
    fk_filter: Optional[tuple[str, str, str, str]] = None,  # (ref_schema, ref_table, ref_col, local_col)
) -> int:
    """
    Load CSV file into a table using COPY FROM STDIN.

    If primary_key is provided, uses staging + dedupe + UPSERT to handle duplicates.
    If fk_filter is provided, uses staging + FK JOIN filter to exclude orphan rows.
    """
    if not csv_path.exists():
        print(f"[load_csv] WARNING: CSV file not found: {csv_path}, skipping...", file=sys.stderr)
        return 0
    
    print(f"[load_csv] Loading {schema}.{table} from {csv_path.name}...")
    
    with conn.cursor() as cursor:
        # Truncate if requested
        if do_truncate:
            print(f"[load_csv] Truncating {schema}.{table}...")
            cursor.execute(f'TRUNCATE TABLE "{schema}"."{table}" RESTART IDENTITY CASCADE')
        
        copy_opts = "FORMAT csv, HEADER false, ENCODING 'UTF8'"
        if force_null:
            copy_opts += f", FORCE_NULL ({', '.join(force_null)})"
        
        # Read CSV and copy — use csv.writer with QUOTE_NONNUMERIC so raw/json etc. are properly quoted
        with csv_path.open('r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            buf = io.StringIO()
            writer = csv.writer(buf, quoting=csv.QUOTE_NONNUMERIC)
            rows_read = 0
            for row in reader:
                values = [row.get(col, '') for col in columns]
                writer.writerow(values)
                rows_read += 1

        buf.seek(0)

        if primary_key:
            staging_table = f"stg_{schema}_{table}".replace(".", "_")
            mode_msg = "UPSERT mode (staging + dedupe"
            if fk_filter:
                mode_msg += " + FK filter"
            mode_msg += ")"
            print(f"[load_csv] Using {mode_msg}")

            cursor.execute(f'DROP TABLE IF EXISTS "{staging_table}"')
            cursor.execute(
                f'CREATE TEMP TABLE "{staging_table}" (LIKE "{schema}"."{table}" INCLUDING DEFAULTS) ON COMMIT DROP'
            )

            with cursor.copy(f'COPY "{staging_table}" ({", ".join(columns)}) FROM STDIN WITH ({copy_opts})') as copy:
                copy.write(buf.read())

            pk_cols = ", ".join(primary_key)
            update_cols = [col for col in columns if col not in primary_key]
            if update_cols:
                update_sql = ", ".join([f"{col} = EXCLUDED.{col}" for col in update_cols])
                on_conflict = f"DO UPDATE SET {update_sql}"
            else:
                on_conflict = "DO NOTHING"

            if fk_filter:
                ref_schema, ref_table, ref_col, local_col = fk_filter
                fk_join = f'INNER JOIN "{ref_schema}"."{ref_table}" ref ON st.{local_col} = ref.{ref_col}'
                pk_qualified = ", ".join([f"st.{c}" for c in primary_key])
                sel_from_st = ", ".join([f"st.{c}" for c in columns])
                from_clause = f'"{staging_table}" st'
            else:
                fk_join = ""
                pk_qualified = pk_cols
                sel_from_st = ", ".join(columns)
                from_clause = f'"{staging_table}"'

            if dedupe_order_by:
                order_by = f"{pk_qualified}, {dedupe_order_by}"
                dedupe_sql = f"""
                    WITH dedup AS (
                        SELECT DISTINCT ON ({pk_qualified})
                            {sel_from_st if fk_filter else ", ".join(columns)}
                        FROM {from_clause}
                        {fk_join}
                        ORDER BY {order_by}
                    )
                    INSERT INTO "{schema}"."{table}" ({", ".join(columns)})
                    SELECT {", ".join(columns)}
                    FROM dedup
                    ON CONFLICT ({pk_cols}) {on_conflict}
                """
            else:
                dedupe_sql = f"""
                    INSERT INTO "{schema}"."{table}" ({", ".join(columns)})
                    SELECT {sel_from_st}
                    FROM {from_clause}
                    {fk_join}
                    ON CONFLICT ({pk_cols}) {on_conflict}
                """

            cursor.execute(dedupe_sql)
            rows_loaded = cursor.rowcount
            if fk_filter and rows_loaded < rows_read:
                print(f"[load_csv] WARNING: Filtered out {rows_read - rows_loaded} orphan rows (FK constraint)")
        elif fk_filter:
            # FK filter mode: staging + JOIN filter to exclude orphan rows
            ref_schema, ref_table, ref_col, local_col = fk_filter
            staging_table = f"stg_{schema}_{table}".replace(".", "_")
            print(f"[load_csv] Using FK filter mode (staging + JOIN filter)")

            cursor.execute(f'DROP TABLE IF EXISTS "{staging_table}"')
            cursor.execute(
                f'CREATE TEMP TABLE "{staging_table}" (LIKE "{schema}"."{table}" INCLUDING DEFAULTS) ON COMMIT DROP'
            )

            with cursor.copy(f'COPY "{staging_table}" ({", ".join(columns)}) FROM STDIN WITH ({copy_opts})') as copy:
                copy.write(buf.read())

            # Filter orphan rows via JOIN
            fk_filter_sql = f"""
                INSERT INTO "{schema}"."{table}" ({", ".join(columns)})
                SELECT {", ".join([f"st.{col}" for col in columns])}
                FROM "{staging_table}" st
                INNER JOIN "{ref_schema}"."{ref_table}" ref ON st.{local_col} = ref.{ref_col}
            """
            cursor.execute(fk_filter_sql)
            rows_loaded = cursor.rowcount
            if rows_loaded < rows_read:
                print(f"[load_csv] WARNING: Filtered out {rows_read - rows_loaded} orphan rows (FK constraint)")
        else:
            with cursor.copy(f'COPY "{schema}"."{table}" ({", ".join(columns)}) FROM STDIN WITH ({copy_opts})') as copy:
                copy.write(buf.read())
            rows_loaded = rows_read
        
        # Analyze table for query optimizer
        cursor.execute(f'ANALYZE "{schema}"."{table}"')
        conn.commit()
        
        print(f"[load_csv] Loaded {rows_loaded} rows into {schema}.{table}")
        return rows_loaded


def main():
    args = sys.argv[1:]
    db_url, args = parse_db_url(args)
    connect_timeout, args = parse_connect_timeout(args, db_url)
    if not db_url:
        print("[load_csv] ERROR: SUPABASE_DB_URL or --db-url required", file=sys.stderr)
        print("[load_csv] Usage: python scripts/hvdc/load_csv.py [--db-url URL] [--connect-timeout SECONDS] [--truncate] [--status-only]", file=sys.stderr)
        sys.exit(1)

    do_truncate = "--truncate" in args or "-t" in args
    status_only = "--status-only" in args or "-s" in args
    
    repo_root = Path.cwd()
    
    # CSV file paths
    status_shipments_csv = repo_root / "hvdc_output" / "supabase" / "shipments_status.csv"
    status_events_csv = repo_root / "hvdc_output" / "supabase" / "events_status.csv"
    
    # Case layer CSV paths (optional)
    case_locations_csv = repo_root / "supabase" / "data" / "output" / "optionC" / "locations.csv"
    case_shipments_csv = repo_root / "supabase" / "data" / "output" / "optionC" / "shipments_case.csv"
    case_cases_csv = repo_root / "supabase" / "data" / "output" / "optionC" / "cases.csv"
    case_flows_csv = repo_root / "supabase" / "data" / "output" / "optionC" / "flows.csv"
    case_events_csv = repo_root / "supabase" / "data" / "output" / "optionC" / "events_case.csv"
    
    timeout_label = f"{connect_timeout}s" if connect_timeout else "default"
    print(f"[load_csv] Connecting to database (timeout={timeout_label})...")
    print(f"[load_csv] Database: {redact_db_url(db_url)}")
    print(f"[load_csv] do_truncate = {do_truncate}")
    print(f"[load_csv] status_only = {status_only}")
    
    try:
        connect_kwargs = {"autocommit": False}
        if connect_timeout:
            connect_kwargs["connect_timeout"] = connect_timeout
        with psycopg.connect(db_url, **connect_kwargs) as conn:
            total_rows = 0
            
            # Status layer (required)
            print("\n=== Loading Status Layer ===")
            if status_shipments_csv.exists():
                rows = load_csv_table(
                    conn, "status", "shipments_status", status_shipments_csv,
                    columns=[
                        "hvdc_code", "status_no", "vendor", "band", "incoterms", "currency",
                        "pol", "pod", "bl_awb", "vessel", "ship_mode", "pkg", "qty_cntr",
                        "cbm", "gwt_kg", "etd", "eta", "ata",
                        "warehouse_flag", "warehouse_last_location", "warehouse_last_date", "raw"
                    ],
                    do_truncate=do_truncate,
                    force_null=[
                        "status_no", "pkg", "qty_cntr", "cbm", "gwt_kg",
                        "etd", "eta", "ata", "warehouse_last_location", "warehouse_last_date",
                    ],
                    primary_key=["hvdc_code"],
                    dedupe_order_by="status_no DESC NULLS LAST",
                )
                total_rows += rows
                do_truncate = False  # Only truncate once
            else:
                print(f"[load_csv] ERROR: Required file not found: {status_shipments_csv}", file=sys.stderr)
                sys.exit(1)
            
            if status_events_csv.exists():
                rows = load_csv_table(
                    conn, "status", "events_status", status_events_csv,
                    columns=[
                        "event_id", "hvdc_code", "event_type", "location", "event_date", "source", "raw"
                    ],
                    do_truncate=False,
                    primary_key=["event_id"],
                    fk_filter=("status", "shipments_status", "hvdc_code", "hvdc_code"),
                )
                total_rows += rows
            else:
                print(f"[load_csv] ERROR: Required file not found: {status_events_csv}", file=sys.stderr)
                sys.exit(1)
            
            # Case layer (optional, only if files exist and not status_only)
            if not status_only:
                print("\n=== Loading Case Layer (if files exist) ===")
                
                if case_locations_csv.exists():
                    rows = load_csv_table(
                        conn, "case", "locations", case_locations_csv,
                        columns=[
                            "location_id", "location_code", "name", "category", "hvdc_node",
                            "is_mosb", "is_site", "is_port", "active"
                        ],
                        do_truncate=False
                    )
                    total_rows += rows
                
                if case_shipments_csv.exists():
                    rows = load_csv_table(
                        conn, "case", "shipments_case", case_shipments_csv,
                        columns=[
                            "hvdc_code", "shipment_invoice_no", "vendor", "coe", "pol", "pod",
                            "vessel", "hs_code", "currency", "price"
                        ],
                        do_truncate=False,
                        force_null=["price"]
                    )
                    total_rows += rows
                
                if case_cases_csv.exists():
                    rows = load_csv_table(
                        conn, "case", "cases", case_cases_csv,
                        columns=[
                            "hvdc_code", "case_no", "site_code", "eq_no", "pkg", "description",
                            "final_location", "storage", "l_cm", "w_cm", "h_cm", "cbm", "nw_kg", "gw_kg", "sqm", "vendor"
                        ],
                        do_truncate=False,
                        force_null=["pkg", "l_cm", "w_cm", "h_cm", "cbm", "nw_kg", "gw_kg", "sqm"]
                    )
                    total_rows += rows
                
                if case_flows_csv.exists():
                    rows = load_csv_table(
                        conn, "case", "flows", case_flows_csv,
                        columns=[
                            "hvdc_code", "case_no", "flow_code", "flow_code_original", "flow_code_derived",
                            "override_reason", "warehouse_count", "has_mosb_leg", "has_site_arrival",
                            "customs_code", "customs_start_iso", "customs_end_iso", "last_status", "requires_review"
                        ],
                        do_truncate=False,
                        force_null=[
                            "flow_code_original",
                            "flow_code_derived",
                            "warehouse_count",
                            "customs_start_iso",
                            "customs_end_iso",
                        ]
                    )
                    total_rows += rows
                
                if case_events_csv.exists():
                    rows = load_csv_table(
                        conn, "case", "events_case", case_events_csv,
                        columns=[
                            "hvdc_code", "case_no", "event_type", "event_time_iso", "location_id",
                            "source_field", "source_system", "raw_epoch_ms"
                        ],
                        do_truncate=False,
                        force_null=["raw_epoch_ms"]
                    )
                    total_rows += rows
            
            print(f"\n[load_csv] Done. Total rows loaded: {total_rows}")
        
    except psycopg.Error as e:
        print(f"[load_csv] ERROR: Database error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[load_csv] ERROR: Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
