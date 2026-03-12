"""DB helpers for integration/validation tests.

Assumptions:
- Tests run against a Supabase Postgres instance.
- Connection string is provided via SUPABASE_DB_URL.

We intentionally avoid bundling Supabase client libs here to keep DB checks explicit and schema-aware.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Iterator, Sequence


def _require_db_url() -> str:
    url = os.getenv("SUPABASE_DB_URL")
    if not url:
        raise RuntimeError("SUPABASE_DB_URL is required")
    return url


@contextmanager
def db_conn() -> Iterator[Any]:
    """Yield a DB connection using psycopg (v3) or psycopg2.

    Raises:
      RuntimeError: when no driver is installed or SUPABASE_DB_URL is missing.
    """

    url = _require_db_url()

    try:
        import psycopg  # type: ignore

        conn = psycopg.connect(url)
        try:
            yield conn
        finally:
            conn.close()
        return
    except ModuleNotFoundError:
        pass

    try:
        import psycopg2  # type: ignore

        conn = psycopg2.connect(url)
        try:
            yield conn
        finally:
            conn.close()
        return
    except ModuleNotFoundError:
        pass

    raise RuntimeError("No Postgres driver installed. Install psycopg or psycopg2 to run DB integration tests.")


def fetch_one(sql: str, params: Sequence[Any] | None = None) -> Any:
    params = params or []
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        row = cur.fetchone()
        cur.close()
        return row
