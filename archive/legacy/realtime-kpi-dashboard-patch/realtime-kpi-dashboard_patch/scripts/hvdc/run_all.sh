#!/usr/bin/env bash
set -euo pipefail

# End-to-end HVDC data loading pipeline (local operator script)
#
# Steps:
#  1) Validate inputs
#  2) Apply DDL
#  3) Run ETL (status + option-c)
#  4) Load CSV into Supabase (\copy)
#  5) Gate 1 QA
#  6) Enable Realtime publication
#
# Requirements:
#  - SUPABASE_DB_URL set

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "[run_all] ERROR: SUPABASE_DB_URL is required" >&2
  exit 1
fi

python "${REPO_ROOT}/scripts/hvdc/validate_inputs.py" --repo-root "${REPO_ROOT}" --source-dir "supabass_ontol" --require-customs

echo "[run_all] Applying DDL..."
psql "${SUPABASE_DB_URL}" -f "${REPO_ROOT}/supabass_ontol/20260124_hvdc_layers_status_case_ops.sql"

echo "[run_all] Creating baseline dashboard views (optional)..."
psql "${SUPABASE_DB_URL}" -f "${REPO_ROOT}/supabase/migrations/20260124_create_dashboard_views.sql"

echo "[run_all] Running ETL (status)..."
bash "${REPO_ROOT}/scripts/hvdc/run_etl_status.sh"

echo "[run_all] Running ETL (option-c)..."
bash "${REPO_ROOT}/scripts/hvdc/run_etl_case.sh"

echo "[run_all] Loading CSVs..."
psql "${SUPABASE_DB_URL}" \
  -v do_truncate=on \
  -v status_shipments_csv="${REPO_ROOT}/hvdc_output/supabase/shipments_status.csv" \
  -v status_events_csv="${REPO_ROOT}/hvdc_output/supabase/events_status.csv" \
  -v case_locations_csv="${REPO_ROOT}/supabase_csv_optionC_v3/locations.csv" \
  -v case_shipments_csv="${REPO_ROOT}/supabase_csv_optionC_v3/shipments_case.csv" \
  -v case_cases_csv="${REPO_ROOT}/supabase_csv_optionC_v3/cases.csv" \
  -v case_flows_csv="${REPO_ROOT}/supabase_csv_optionC_v3/flows.csv" \
  -v case_events_csv="${REPO_ROOT}/supabase_csv_optionC_v3/events_case.csv" \
  -f "${REPO_ROOT}/scripts/hvdc/load_csv.psql"

echo "[run_all] Gate 1 QA..."
bash "${REPO_ROOT}/scripts/hvdc/run_gate1_qa.sh"

echo "[run_all] Enable Realtime..."
psql "${SUPABASE_DB_URL}" -f "${REPO_ROOT}/supabase/migrations/20260124_enable_realtime_layers.sql"

echo "[run_all] DONE"
