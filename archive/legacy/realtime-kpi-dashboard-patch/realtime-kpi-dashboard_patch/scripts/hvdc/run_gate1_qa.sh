#!/usr/bin/env bash
set -euo pipefail

# Run Gate 1 QA queries (Phase 5)
# Requires: SUPABASE_DB_URL

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "[run_gate1_qa] ERROR: SUPABASE_DB_URL is required" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
psql "${SUPABASE_DB_URL}" -f "${SCRIPT_DIR}/gate1_qa.sql"
