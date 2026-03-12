#!/usr/bin/env bash
set -euo pipefail

# HVDC Option-C Case ETL runner
# - wraps supabass_ontol/Untitled-3_dashboard_ready_FULL.py
# - aligns with docs/DATA_LOADING_PLAN.md Phase 3.2

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC_DIR="${SRC_DIR:-${REPO_ROOT}/supabass_ontol}"
OUT_DIR="${OUT_DIR:-${REPO_ROOT}/supabase_csv_optionC_v3}"
BASE_IRI="${HVDC_BASE_IRI:-https://example.com/hvdc}"
EXPORT_TTL="${EXPORT_TTL:-1}"

ALL_JSON=""
for cand in "HVDC all status.json" "HVDC_all_status.json" "hvdc_allshpt_status.json"; do
  if [[ -f "${SRC_DIR}/${cand}" ]]; then
    ALL_JSON="${SRC_DIR}/${cand}"
    break
  fi
  # try case-insensitive match
  if [[ -z "${ALL_JSON}" ]]; then
    for f in "${SRC_DIR}"/*; do
      if [[ "$(basename "$f" | tr '[:upper:]' '[:lower:]')" == "$(echo "$cand" | tr '[:upper:]' '[:lower:]')" ]]; then
        ALL_JSON="$f"
        break
      fi
    done
  fi
  if [[ -n "${ALL_JSON}" ]]; then
    break
  fi
done

if [[ -z "${ALL_JSON}" ]]; then
  echo "[run_etl_case] ERROR: Input --all JSON not found in ${SRC_DIR} (expected 'HVDC all status.json' or 'hvdc_allshpt_status.json')" >&2
  exit 1
fi

WAREHOUSE_JSON="${SRC_DIR}/hvdc_warehouse_status.json"
if [[ ! -f "${WAREHOUSE_JSON}" ]]; then
  echo "[run_etl_case] ERROR: Warehouse JSON not found: ${WAREHOUSE_JSON}" >&2
  exit 1
fi

CUSTOMS_JSON=""
for cand in "HVDC_STATUS.json" "hvdc_status.json"; do
  if [[ -f "${SRC_DIR}/${cand}" ]]; then
    CUSTOMS_JSON="${SRC_DIR}/${cand}"
    break
  fi
done

if [[ -z "${CUSTOMS_JSON}" ]]; then
  echo "[run_etl_case] ERROR: Customs JSON not found in ${SRC_DIR} (expected 'HVDC_STATUS.json')" >&2
  exit 1
fi

ETL_SCRIPT="${SRC_DIR}/Untitled-3_dashboard_ready_FULL.py"
if [[ ! -f "${ETL_SCRIPT}" ]]; then
  echo "[run_etl_case] ERROR: ETL script not found: ${ETL_SCRIPT}" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

EXPORT_TTL_ARG=()
if [[ "${EXPORT_TTL}" == "1" || "${EXPORT_TTL}" == "true" || "${EXPORT_TTL}" == "on" ]]; then
  EXPORT_TTL_ARG=(--export-ttl)
fi

echo "[run_etl_case] repo_root=${REPO_ROOT}"
echo "[run_etl_case] src_dir=${SRC_DIR}"
echo "[run_etl_case] output_dir=${OUT_DIR}"
echo "[run_etl_case] all_json=${ALL_JSON}"
echo "[run_etl_case] warehouse_json=${WAREHOUSE_JSON}"
echo "[run_etl_case] customs_json=${CUSTOMS_JSON}"

python "${ETL_SCRIPT}" \
  --all "${ALL_JSON}" \
  --wh "${WAREHOUSE_JSON}" \
  --customs "${CUSTOMS_JSON}" \
  --output-dir "${OUT_DIR}" \
  --base-iri "${BASE_IRI}" \
  "${EXPORT_TTL_ARG[@]}"

echo "[run_etl_case] Done. Expected outputs:"
ls -la "${OUT_DIR}" || true
