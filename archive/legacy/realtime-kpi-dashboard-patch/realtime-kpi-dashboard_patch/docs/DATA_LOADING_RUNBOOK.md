# HVDC Dashboard Data Loading Runbook (Supabase)

> 목적: `DATA_LOADING_PLAN.md` (Phase 1~7)을 **실행 가능한 Runbook** 형태로 정리하고,
> 로컬/CI 환경에서 재현 가능한 스크립트/SQL 진입점을 제공한다.
>
> 기준 문서:
> - `docs/DATA_LOADING_PLAN.md`
> - `docs/ETL_GUIDE.md`

---

## 0) 준비물

### 0.1 필수 파일 (Source JSON)

- `supabass_ontol/HVDC all status.json` (또는 `HVDC_all_status.json`)
- `supabass_ontol/hvdc_warehouse_status.json`
- (Option-C) `supabass_ontol/HVDC_STATUS.json`

> 파일명은 환경마다 underscore/space가 혼재할 수 있으므로, `scripts/hvdc/validate_inputs.py`가 자동 탐지한다.

### 0.2 필수 스크립트 (ETL)

- `supabass_ontol/Untitled-4_dashboard_ready_FULL.py` (Status)
- `supabass_ontol/Untitled-3_dashboard_ready_FULL.py` (Option-C)
- (Option-C) `supabass_ontol/flow_code_calculator.py`

### 0.3 필수 환경변수

- `SUPABASE_DB_URL` : `postgresql://...` (psql 접속 문자열)

옵션:
- `HVDC_BASE_IRI` : TTL export 시 base IRI

---

## 1) Phase 1 — 사전 검증

### 1.1 입력 파일/스크립트 존재 확인

```bash
python scripts/hvdc/validate_inputs.py \
  --repo-root . \
  --source-dir supabass_ontol
```

**성공 기준**: required JSON/ETL 스크립트가 모두 존재하고, pandas/numpy import 가능.

---

## 2) Phase 2 — DDL 적용

### 2.1 스키마 생성/갱신

> DDL 파일은 runbook 상 경로만 고정. 실제 파일 존재는 레포에서 확인.

```bash
psql "$SUPABASE_DB_URL" -f supabass_ontol/20260124_hvdc_layers_status_case_ops.sql
```

---

## 3) Phase 3 — ETL 실행 (CSV 생성)

### 3.1 Status SSOT (Untitled-4)

```bash
bash scripts/hvdc/run_etl_status.sh
```

생성물(기본):
- `hvdc_output/supabase/shipments_status.csv`
- `hvdc_output/supabase/events_status.csv`
- `hvdc_output/report/qa_report.md`

### 3.2 Option-C Case (Untitled-3)

```bash
bash scripts/hvdc/run_etl_case.sh
```

생성물(기본):
- `supabase_csv_optionC_v3/locations.csv`
- `supabase_csv_optionC_v3/shipments_case.csv`
- `supabase_csv_optionC_v3/cases.csv`
- `supabase_csv_optionC_v3/flows.csv`
- `supabase_csv_optionC_v3/events_case.csv`

---

## 4) Phase 4 — CSV 적재 (psql \copy)

> Supabase hosted DB는 서버 측 `COPY ... FROM '/path'`가 불가능하므로, 클라이언트 측 `\copy`를 권장.

```bash
psql "$SUPABASE_DB_URL" \
  -v do_truncate=on \
  -v status_shipments_csv="$(pwd)/hvdc_output/supabase/shipments_status.csv" \
  -v status_events_csv="$(pwd)/hvdc_output/supabase/events_status.csv" \
  -v case_locations_csv="$(pwd)/supabase_csv_optionC_v3/locations.csv" \
  -v case_shipments_csv="$(pwd)/supabase_csv_optionC_v3/shipments_case.csv" \
  -v case_cases_csv="$(pwd)/supabase_csv_optionC_v3/cases.csv" \
  -v case_flows_csv="$(pwd)/supabase_csv_optionC_v3/flows.csv" \
  -v case_events_csv="$(pwd)/supabase_csv_optionC_v3/events_case.csv" \
  -f scripts/hvdc/load_csv.psql
```

---

## 5) Phase 5 — Gate 1 QA (orphan/duplicate/flow 규칙)

```bash
bash scripts/hvdc/run_gate1_qa.sh
```

**통과 조건**
- orphan_count = 0
- duplicate rows = 0 (또는 사전 합의된 예외만)
- Flow Code 규칙 위반 = 0

---

## 6) Phase 6 — 대시보드 연결 및 Realtime

### 6.1 (필요 시) View 생성

- `public.v_shipments_master` 등은 프론트에서 직접 JOIN 금지 원칙을 위해 View로 제공.

### 6.2 Realtime publication 활성화

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260124_enable_realtime_layers.sql
```

---

## 7) Phase 7 — 리포트/문서화

- `docs/DATA_LOADING_REPORT_TEMPLATE.md`를 복사해서 적재 결과/이슈를 기록

