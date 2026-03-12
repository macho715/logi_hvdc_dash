#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check if specific hvdc_code exists"""

import os
import sys
from urllib.parse import urlsplit, urlunsplit

try:
    import psycopg
except ImportError:
    print("[check_duplicate_key] ERROR: psycopg[binary] is required", file=sys.stderr)
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
        print("[check_duplicate_key] ERROR: SUPABASE_DB_URL required", file=sys.stderr)
        sys.exit(1)
    
    print(f"[check_duplicate_key] Database: {redact_db_url(db_url)}")
    
    try:
        with psycopg.connect(db_url, autocommit=True) as conn:
            with conn.cursor() as cursor:
                # Check total count
                cursor.execute("SELECT COUNT(*) FROM status.shipments_status")
                total = cursor.fetchone()[0]
                print(f"[check_duplicate_key] Total rows: {total}")
                
                # Check specific key
                cursor.execute("SELECT hvdc_code FROM status.shipments_status WHERE hvdc_code = %s", ("HVDC-ADOPT-ZEN-0003",))
                result = cursor.fetchone()
                if result:
                    print(f"[check_duplicate_key] FOUND: HVDC-ADOPT-ZEN-0003 exists")
                    cursor.execute("SELECT hvdc_code, status_no, vendor FROM status.shipments_status WHERE hvdc_code = %s", ("HVDC-ADOPT-ZEN-0003",))
                    row = cursor.fetchone()
                    print(f"[check_duplicate_key] Row data: {row}")
                else:
                    print(f"[check_duplicate_key] NOT FOUND: HVDC-ADOPT-ZEN-0003")
                
                # List all hvdc_codes
                cursor.execute("SELECT hvdc_code FROM status.shipments_status ORDER BY hvdc_code LIMIT 10")
                all_codes = [r[0] for r in cursor.fetchall()]
                print(f"[check_duplicate_key] All hvdc_codes (first 10): {all_codes}")
                
    except Exception as e:
        print(f"[check_duplicate_key] ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
