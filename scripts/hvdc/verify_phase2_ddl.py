#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify Phase 2 DDL: schemas, tables, views.
Uses SUPABASE_DB_URL or --db-url. Optional: --connect-timeout/PGCONNECT_TIMEOUT.
Run after apply_ddl.py.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print(
        "[verify_phase2_ddl] ERROR: psycopg[binary] required. pip install 'psycopg[binary]>=3.0.0'",
        file=sys.stderr,
    )
    sys.exit(1)


QUERIES = [
    ("schemas", "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('status','case','ops') ORDER BY schema_name;"),
    ("status tables", "SELECT table_name FROM information_schema.tables WHERE table_schema = 'status' ORDER BY table_name;"),
    ("case tables", "SELECT table_name FROM information_schema.tables WHERE table_schema = 'case' ORDER BY table_name;"),
    ("ops tables", "SELECT table_name FROM information_schema.tables WHERE table_schema = 'ops' ORDER BY table_name;"),
    ("public v_* views", "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'v_%' ORDER BY table_name;"),
]

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
        print(f"[verify_phase2_ddl] ERROR: {label} must be an integer", file=sys.stderr)
        sys.exit(1)
    if number < 1:
        print(f"[verify_phase2_ddl] ERROR: {label} must be >= 1", file=sys.stderr)
        sys.exit(1)
    return number


def parse_db_url(args: list[str]) -> tuple[Optional[str], list[str]]:
    db_url = os.getenv("SUPABASE_DB_URL")
    if "--db-url" in args:
        i = args.index("--db-url")
        if i + 1 >= len(args):
            print("[verify_phase2_ddl] ERROR: --db-url requires a value", file=sys.stderr)
            sys.exit(1)
        db_url = args[i + 1]
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]
    return db_url, args


def parse_connect_timeout(args: list[str], db_url: Optional[str]) -> tuple[Optional[int], list[str]]:
    connect_timeout: Optional[int] = None
    if "--connect-timeout" in args:
        i = args.index("--connect-timeout")
        if i + 1 >= len(args):
            print("[verify_phase2_ddl] ERROR: --connect-timeout requires a value", file=sys.stderr)
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
    if not db_url:
        print("[verify_phase2_ddl] ERROR: SUPABASE_DB_URL or --db-url required", file=sys.stderr)
        sys.exit(1)

    timeout_label = f"{connect_timeout}s" if connect_timeout else "default"
    print(f"[verify_phase2_ddl] Connecting (timeout={timeout_label})...")
    print(f"[verify_phase2_ddl] Database: {redact_db_url(db_url)}")
    try:
        connect_kwargs = {}
        if connect_timeout:
            connect_kwargs["connect_timeout"] = connect_timeout
        with psycopg.connect(db_url, **connect_kwargs) as conn:
            with conn.cursor() as cur:
                for label, sql in QUERIES:
                    cur.execute(sql)
                    rows = cur.fetchall()
                    cols = [d.name for d in cur.description] if cur.description else []
                    print(f"\n--- {label} ---")
                    if cols:
                        print(" ".join(cols))
                        print("-" * 40)
                    for r in rows:
                        print(" ".join(str(x) for x in r))
    except Exception as e:
        print(f"[verify_phase2_ddl] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    print("\n[verify_phase2_ddl] Done.")


if __name__ == "__main__":
    main()
