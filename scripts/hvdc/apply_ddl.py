#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apply DDL to Supabase using Python (psql 대안)

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
    print("[apply_ddl] ERROR: psycopg[binary] is required. Install with: pip install 'psycopg[binary]>=3.0.0'", file=sys.stderr)
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
        print(f"[apply_ddl] ERROR: {label} must be an integer", file=sys.stderr)
        sys.exit(1)
    if number < 1:
        print(f"[apply_ddl] ERROR: {label} must be >= 1", file=sys.stderr)
        sys.exit(1)
    return number


def parse_db_url(args: list[str]) -> tuple[Optional[str], list[str]]:
    db_url = os.getenv("SUPABASE_DB_URL")
    if "--db-url" in args:
        i = args.index("--db-url")
        if i + 1 >= len(args):
            print("[apply_ddl] ERROR: --db-url requires a value", file=sys.stderr)
            sys.exit(1)
        db_url = args[i + 1]
        args = [a for j, a in enumerate(args) if j not in (i, i + 1)]
    return db_url, args


def parse_connect_timeout(args: list[str], db_url: Optional[str]) -> tuple[Optional[int], list[str]]:
    connect_timeout: Optional[int] = None
    if "--connect-timeout" in args:
        i = args.index("--connect-timeout")
        if i + 1 >= len(args):
            print("[apply_ddl] ERROR: --connect-timeout requires a value", file=sys.stderr)
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


def apply_ddl(db_url: str, sql_file: Path, connect_timeout: Optional[int]) -> None:
    """Apply DDL from SQL file to database"""
    if not sql_file.exists():
        print(f"[apply_ddl] ERROR: SQL file not found: {sql_file}", file=sys.stderr)
        sys.exit(1)
    
    sql_content = sql_file.read_text(encoding='utf-8')
    
    timeout_label = f"{connect_timeout}s" if connect_timeout else "default"
    print(f"[apply_ddl] Connecting to database (timeout={timeout_label})...")
    print(f"[apply_ddl] Database: {redact_db_url(db_url)}")
    print(f"[apply_ddl] SQL file: {sql_file}")
    
    try:
        connect_kwargs = {"autocommit": True}
        if connect_timeout:
            connect_kwargs["connect_timeout"] = connect_timeout
        with psycopg.connect(db_url, **connect_kwargs) as conn:
            with conn.cursor() as cursor:
                print(f"[apply_ddl] Executing DDL...")
                cursor.execute(sql_content)
                print(f"[apply_ddl] DDL applied successfully")
        
    except psycopg.Error as e:
        print(f"[apply_ddl] ERROR: Database error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[apply_ddl] ERROR: Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    args = sys.argv[1:]
    db_url, args = parse_db_url(args)
    connect_timeout, args = parse_connect_timeout(args, db_url)
    if not db_url:
        print("[apply_ddl] ERROR: SUPABASE_DB_URL or --db-url required", file=sys.stderr)
        print("[apply_ddl] Usage: python scripts/hvdc/apply_ddl.py [--db-url URL] [--connect-timeout SECONDS] <sql_file>", file=sys.stderr)
        sys.exit(1)
    if len(args) < 1:
        print("[apply_ddl] ERROR: SQL file path is required", file=sys.stderr)
        print("[apply_ddl] Usage: python scripts/hvdc/apply_ddl.py [--db-url URL] [--connect-timeout SECONDS] <sql_file>", file=sys.stderr)
        sys.exit(1)
    sql_file = Path(args[0])
    apply_ddl(db_url, sql_file, connect_timeout)


if __name__ == "__main__":
    main()
