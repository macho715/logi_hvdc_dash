#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Clear status tables before CSV load (FK-safe order)

Requirements:
  - SUPABASE_DB_URL or --db-url
  - Optional: --connect-timeout SECONDS or PGCONNECT_TIMEOUT
  - psycopg[binary]>=3.0.0
"""

import os
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print("[clear_status_tables] ERROR: psycopg[binary] is required. Install with: pip install 'psycopg[binary]>=3.0.0'", file=sys.stderr)
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


def parse_db_url(args: list[str]) -> tuple[Optional[str], list[str]]:
    db_url = os.getenv("SUPABASE_DB_URL")
    if "--db-url" in args:
        i = args.index("--db-url")
        if i + 1 >= len(args):
            print("[clear_status_tables] ERROR: --db-url requires a value", file=sys.stderr)
            sys.exit(1)
        db_url = args[i + 1]
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]
    return db_url, args


def parse_connect_timeout(args: list[str], db_url: Optional[str]) -> tuple[Optional[int], list[str]]:
    connect_timeout: Optional[int] = None
    if "--connect-timeout" in args:
        i = args.index("--connect-timeout")
        if i + 1 >= len(args):
            print("[clear_status_tables] ERROR: --connect-timeout requires a value", file=sys.stderr)
            sys.exit(1)
        try:
            connect_timeout = int(args[i + 1])
        except ValueError:
            print("[clear_status_tables] ERROR: --connect-timeout must be an integer", file=sys.stderr)
            sys.exit(1)
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]

    if connect_timeout is None:
        env_timeout = os.getenv("PGCONNECT_TIMEOUT")
        if env_timeout:
            try:
                connect_timeout = int(env_timeout)
            except ValueError:
                pass

    if connect_timeout is None and db_url:
        try:
            parts = urlsplit(db_url)
            if parts.query:
                from urllib.parse import parse_qs
                qs = parse_qs(parts.query)
                if "connect_timeout" in qs:
                    try:
                        connect_timeout = int(qs["connect_timeout"][0])
                    except (ValueError, IndexError):
                        pass
        except Exception:
            pass

    if connect_timeout is None:
        connect_timeout = DEFAULT_CONNECT_TIMEOUT

    return connect_timeout, args


def main():
    args = sys.argv[1:]
    db_url, args = parse_db_url(args)
    connect_timeout, args = parse_connect_timeout(args, db_url)
    
    if not db_url:
        print("[clear_status_tables] ERROR: SUPABASE_DB_URL or --db-url required", file=sys.stderr)
        print("[clear_status_tables] Usage: python scripts/hvdc/clear_status_tables.py [--db-url URL] [--connect-timeout SECONDS]", file=sys.stderr)
        sys.exit(1)

    print(f"[clear_status_tables] Connecting to database (timeout={connect_timeout}s)...")
    print(f"[clear_status_tables] Database: {redact_db_url(db_url)}")
    
    try:
        connect_kwargs = {"autocommit": True}  # Use autocommit for DELETE
        if connect_timeout:
            connect_kwargs["connect_timeout"] = connect_timeout
        
        with psycopg.connect(db_url, **connect_kwargs) as conn:
            with conn.cursor() as cursor:
                # Delete in FK-safe order: events_status first (references shipments_status)
                print("[clear_status_tables] Deleting from status.events_status...")
                cursor.execute('DELETE FROM status.events_status')
                events_count = cursor.rowcount
                print(f"[clear_status_tables] Deleted {events_count} rows from status.events_status")
                
                print("[clear_status_tables] Deleting from status.shipments_status...")
                cursor.execute('DELETE FROM status.shipments_status')
                shipments_count = cursor.rowcount
                print(f"[clear_status_tables] Deleted {shipments_count} rows from status.shipments_status")
                
                print(f"[clear_status_tables] Done. Total deleted: {events_count + shipments_count} rows")
        
    except psycopg.Error as e:
        print(f"[clear_status_tables] ERROR: Database error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[clear_status_tables] ERROR: Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
