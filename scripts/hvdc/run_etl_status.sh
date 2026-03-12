#!/usr/bin/env bash
set -euo pipefail

# HVDC Status SSOT ETL runner
# - wraps scripts/etl/status_etl.py (이전: supabass_ontol/Untitled-4_dashboard_ready_FULL.py)
# - aligns with docs/DATA_LOADING_PLAN.md Phase 3.1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC_DIR="${SRC_DIR:-${REPO_ROOT}/supabase/data/raw}"
OUTDIR="${OUTDIR:-${REPO_ROOT}/hvdc_output}"
BASE_IRI="${HVDC_BASE_IRI:-https://example.com/hvdc}"

# Auto-detect status json filename variants
STATUS_JSON=""
for cand in "HVDC all status.json" "HVDC_all_status.json" "hvdc_all_status.json"; do
  if [[ -f "${SRC_DIR}/${cand}" ]]; then
    STATUS_JSON="${SRC_DIR}/${cand}"
    break
  fi
done

if [[ -z "${STATUS_JSON}" ]]; then
  echo "[run_etl_status] ERROR: Status JSON not found in ${SRC_DIR} (expected 'HVDC all status.json' or 'HVDC_all_status.json')" >&2
  exit 1
fi

# Auto-detect warehouse json filename variants
WAREHOUSE_JSON=""
for cand in "hvdc_warehouse_status.json" "HVDC_warehouse_status.json" "warehouse_status.json"; do
  if [[ -f "${SRC_DIR}/${cand}" ]]; then
    WAREHOUSE_JSON="${SRC_DIR}/${cand}"
    break
  fi
done

if [[ -z "${WAREHOUSE_JSON}" ]]; then
  echo "[run_etl_status] ERROR: Warehouse JSON not found in ${SRC_DIR} (expected hvdc_warehouse_status.json or variants)" >&2
  exit 1
fi

ETL_SCRIPT="${REPO_ROOT}/scripts/etl/status_etl.py"
if [[ ! -f "${ETL_SCRIPT}" ]]; then
  echo "[run_etl_status] ERROR: ETL script not found: ${ETL_SCRIPT}" >&2
  exit 1
fi

# Optional: locations.csv to enrich events_status
CASE_LOCATIONS="${REPO_ROOT}/supabase/data/output/optionC/locations.csv"
CASE_LOCATIONS_ARG=()
if [[ -f "${CASE_LOCATIONS}" ]]; then
  CASE_LOCATIONS_ARG=(--case-locations "${CASE_LOCATIONS}")
fi

mkdir -p "${OUTDIR}"

echo "[run_etl_status] repo_root=${REPO_ROOT}"
echo "[run_etl_status] src_dir=${SRC_DIR}"
echo "[run_etl_status] outdir=${OUTDIR}"
echo "[run_etl_status] status_json=${STATUS_JSON}"
echo "[run_etl_status] warehouse_json=${WAREHOUSE_JSON}"

python "${ETL_SCRIPT}" \
  --status "${STATUS_JSON}" \
  --warehouse "${WAREHOUSE_JSON}" \
  --outdir "${OUTDIR}" \
  --base-iri "${BASE_IRI}" \
  "${CASE_LOCATIONS_ARG[@]}"

echo "[run_etl_status] Done. Expected outputs:"
ls -la "${OUTDIR}/supabase" || true
ls -la "${OUTDIR}/report" || true
