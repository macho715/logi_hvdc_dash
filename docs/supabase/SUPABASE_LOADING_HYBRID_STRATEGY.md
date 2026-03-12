# Supabase Loading Hybrid Strategy

> Purpose: standardize initial bulk load and recurring incremental loads for HVDC + Logistics data in Supabase.
> Last updated: 2026-02-07
> Related: [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [RUN_ALL_EXECUTION_GUIDE.md](../guides/RUN_ALL_EXECUTION_GUIDE.md), [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md)

---

## Executive Summary

Recommended operating model:

- Initial full load: Postgres bulk COPY via `psql \copy` (fast, deterministic)
- Recurring incremental loads: UPSERT-based loader (`scripts/hvdc/load_csv.py` or `scripts/hvdc/load_csv.psql`) (idempotent + logged)

Rationale:

- COPY is the fastest and most reliable for large, one-time ingestion.
- UPSERT-based scripts are safer for daily/weekly refresh and dedupe.
- Both methods are compatible with Gate 1 QA and audit logging.

---

## Scope

This strategy covers:

- Status layer (shipments_status + events_status)
- Case/Option-C layer (locations, shipments_case, cases, flows, events_case)
- HVDC JSON -> CSV + TTL pipeline outputs (ETL scripts in `supabase/data/raw/`)
- Supabase DB loading and validation (Gate 1 QA)

Out of scope:

- Replacing Supabase as SSOT
- Changing RDF/SHACL validation pipeline
- Client-side loading with elevated keys

---

## Hybrid Loading Flow (Overview)

1) ETL step
- Inputs: `HVDC_all_status.json`, `hvdc_warehouse_status.json`, `HVDC_STATUS.json`
- Scripts:
  - `supabase/data/raw/scripts/etl/status_etl.py` (status)
  - `supabase/data/raw/scripts/etl/optionc_etl.py` (option-c)
- Outputs:
  - CSVs (status + option-c)
  - TTL (optional)
  - `report.json` / `report.md`

2) Initial full load (fast path)
- Use `psql \copy` through `scripts/hvdc/load_csv.psql`
- Order-sensitive for FK integrity

3) Incremental load (safe path)
- Use UPSERT loader to merge recent changes
- Append audit logs (ingest run metadata)

4) Validation and enablement
- Gate 1 QA checks
- Realtime publications enabled after load

---

## Decision Matrix

| Option | Best For | Pros | Cons |
| --- | --- | --- | --- |
| Dashboard Import | Quick sanity checks | zero setup | manual, size limits, not repeatable |
| `psql \copy` | Initial full load | fastest | requires correct order + CSV hygiene |
| UPSERT loader | Recurring incremental | idempotent + logs | slower than COPY |
| API-based load | Small/test data | easy for app integration | not suitable for bulk |

Conclusion: Hybrid (COPY + UPSERT) is the preferred production path.

---

## Loading Order (FK-safe)

Status layer:
1. `status.shipments_status`
2. `status.events_status`

Case/Option-C layer:
1. `public.locations`
2. `public.shipments_case`
3. `public.cases`
4. `public.flows`
5. `public.events_case`

Notes:
- Do not delete case rows due to missing WH data (ALL is SSOT).
- Always keep ALL rows; WH is LEFT JOIN overlay.

---

## Recommended Commands

### 1) End-to-end run (Windows)

```powershell
$env:SUPABASE_DB_URL="postgresql://..."
powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_all.ps1
```

### 2) Manual ETL (if needed)

```powershell
python supabase/data/raw/scripts/etl/status_etl.py \
  --status supabase/data/raw/HVDC_all_status.json \
  --warehouse supabase/data/raw/hvdc_warehouse_status.json \
  --outdir hvdc_output

python supabase/data/raw/scripts/etl/optionc_etl.py \
  --all supabase/data/raw/HVDC_all_status.json \
  --wh supabase/data/raw/hvdc_warehouse_status.json \
  --customs supabase/data/raw/HVDC_STATUS.json \
  --output-dir supabase/data/output/optionC \
  --export-ttl
```

### 3) CSV loading only

```powershell
psql $env:SUPABASE_DB_URL -f scripts/hvdc/load_csv.psql
```

---

## Incremental Load Strategy

Goal: keep data current with minimal risk.

Baseline:

- Re-run ETL on latest source files (or filtered recent subset).
- Load output CSVs using UPSERT-based loader (idempotent).
- Record ingest run metadata (time, source, rows affected).

Operational pattern:

- Daily or weekly job (Windows Task Scheduler or CI).
- Reprocess only recent changes if available.
- Validate with Gate 1 QA after each run.

---

## Validation (Gate 1 QA)

Run:

```powershell
psql $env:SUPABASE_DB_URL -f scripts/hvdc/gate1_qa.sql
```

Minimum checks:

- Row counts match SSOT expectations (no unexpected drops)
- Key integrity (no missing case keys)
- KPI readiness (flows and events exist)

---

## RLS / Security Notes

- Do not expose `service_role` or elevated keys to clients.
- Use `SUPABASE_DB_URL` only for server-side or local scripts.
- All tables exposed via Data APIs must have RLS enabled and explicit policies.

---

## Failure Modes and 대응

| Failure | Symptom | 대응 |
| --- | --- | --- |
| Missing HVDC CODE | all_invalid_rows = all_rows | Update ETL key mapping (`SCT SHIP NO.` -> hvdc_code) or use correct file |
| FK load failure | COPY error | Fix ordering; load parent tables first |
| Empty output CSV | report shows 0 rows | Validate source JSON fields and ETL logs |
| Mismatch counts | QA fails | Re-run ETL, inspect `report.json` and `events_debug.csv` |

---

## Observability / Artifacts

- `supabase/data/output/optionC/report.json` and `report.md`
- `hvdc_output/report/qa_report.md`
- Gate 1 QA SQL output

Store these artifacts per run for audit and rollback.

---

## Recommended Default

- Use `run_all.ps1` for full pipeline execution.
- Use `load_csv.py` UPSERT for recurring incremental loads.
- Always run Gate 1 QA after each load.

---

## Appendix: Source Files

Inputs:
- `supabase/data/raw/HVDC_all_status.json`
- `supabase/data/raw/hvdc_warehouse_status.json`
- `supabase/data/raw/HVDC_STATUS.json`

Outputs:
- `hvdc_output/` (status layer)
- `supabase/data/output/optionC/` (option-c layer)

---

Last updated: 2026-02-07

**최근 변경사항** (2026-02-05~2026-02-07):
- Phase 2~6 데이터 적재 완료: DDL 적용, CSV 적재 (871+928 rows), Gate 1 QA, Realtime 활성화
- 대시보드 데이터 반영 완료: `public.shipments` 뷰 생성, Worklist API 연동, 로컬 테스트 성공
- UI/UX 개선 완료: 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화
