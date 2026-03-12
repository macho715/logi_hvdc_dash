#!/usr/bin/env python3
"""Verify Realtime publication tables (status, case)."""
import os
import sys

import psycopg

def main():
    url = os.getenv("SUPABASE_DB_URL")
    if not url:
        print("SUPABASE_DB_URL required", file=sys.stderr)
        sys.exit(1)
    with psycopg.connect(url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT schemaname, tablename
                FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime' AND schemaname IN ('status', 'case')
                ORDER BY schemaname, tablename
            """)
            rows = cur.fetchall()
    print("Realtime enabled tables:")
    for s, t in rows:
        print(f"  {s}.{t}")
    if not rows:
        print("  (none)")

if __name__ == "__main__":
    main()
