# 대시보드 데이터 Supabase 적재 작업 계획

> **HVDC + Logistics 통합 대시보드 데이터 적재 단계별 실행 계획**  
> **최종 업데이트**: 2026-02-07  
> **참조**: [RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md), [README_dashboard_ready_FULL.md](../supabase/data/raw/README_dashboard_ready_FULL.md)

---

## 🎯 목표

대시보드에 필요한 HVDC 데이터를 Supabase에 적재하여 실시간 KPI 대시보드가 정상 작동하도록 합니다.

### 데이터 레이어 구조

```
원본 JSON
  ↓
ETL 스크립트 (Python)
  ↓
CSV 파일 생성
  ↓
Supabase 적재 (COPY/Import)
  ↓
대시보드 연결 (View/API)
```

---

## 📋 작업 단계

### Phase 1: 사전 준비 및 검증 (0.5일)

#### 1.1 입력 파일 확인
- [ ] `supabase/data/raw/HVDC all status.json` 존재 확인
- [ ] `supabase/data/raw/hvdc_warehouse_status.json` 존재 확인
- [ ] (Option-C용) `supabase/data/raw/hvdc_excel_reporter_final_sqm_rev_3.json` 존재 확인 (✅ 우선: FLOW_CODE 포함된 처리 완료 데이터, 8,804 rows)
- [ ] (Option-C용) `supabase/data/raw/hvdc_excel_reporter_final_sqm_rev_3.csv` 존재 확인 (✅ 백업/참조용)
- [ ] (Option-C용) `HVDC_STATUS.json` 존재 확인
- [ ] 파일 크기 및 형식 검증

#### 1.2 ETL 스크립트 확인
- [ ] `supabase/data/raw/scripts/etl/status_etl.py` 실행 가능 확인
- [ ] `supabase/data/raw/scripts/etl/optionc_etl.py` 실행 가능 확인
- [ ] Python 의존성 설치 확인 (pandas, numpy 등)
- [ ] `flow_code_calculator.py` 존재 확인 (Option-C용)

#### 1.3 Supabase 환경 확인
- [ ] Supabase 프로젝트 접근 권한 확인
- [ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] 기존 데이터 백업 (필요 시)

---

### Phase 2: DDL 적용 (0.5일)

#### 2.1 스키마 마이그레이션 실행

**실행 방법**:
- **권장**: `SUPABASE_DB_URL` (Session pooler :5432 권장, VPN/IPv4 대응) 설정 후 `run_phase2_ddl.ps1` (또는 `apply_ddl.py` + `verify_phase2_ddl.py`). Access Token 불필요. `PGCONNECT_TIMEOUT=10` 또는 `--connect-timeout 10` 권장(무한 대기 방지).
- **대안**: Supabase CLI (`supabase login` + `link` → `db execute -f ...`) 또는 `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` 후 `run_phase2_ddl.ps1`.
- **대안**: Supabase Dashboard SQL Editor, 로컬 psql.
- **VPN/failed to resolve/SSL reset** 시 [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432) 참조.
- 상세: [Phase 2 DDL 적용 계획](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md)

**체크리스트**:
- [ ] `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql` 실행
  - Status 레이어: `status.shipments_status`, `status.events_status`
  - Case 레이어: `case.locations`, `case.shipments_case`, `case.cases`, `case.flows`, `case.events_case`
  - Ops 레이어: (향후 확장)

#### 2.2 RLS 정책 확인
- [ ] Status 레이어 RLS 정책 적용 확인
- [ ] Case 레이어 RLS 정책 적용 확인
- [ ] 테스트 사용자로 접근 권한 확인

#### 2.3 인덱스 생성 확인
- [ ] 모든 인덱스 생성 완료 확인
- [ ] 인덱스 성능 확인 (ANALYZE 실행)

---

### Phase 3: ETL 실행 및 CSV 생성 (1일)

#### 3.1 Status SSOT 레이어 ETL 실행

```bash
cd supabase/data/raw

python scripts/etl/status_etl.py \
  --status "HVDC all status.json" \
  --warehouse hvdc_warehouse_status.json \
  --outdir ../hvdc_output \
  --base-iri https://example.com/hvdc \
  --case-locations .../supabase/supabase/data/output/optionC/locations.csv
```

**생성 파일 확인**:
- [ ] `hvdc_output/supabase/shipments_status.csv` 생성 확인
- [ ] `hvdc_output/supabase/events_status.csv` 생성 확인
- [ ] `hvdc_output/supabase/schema.sql` 생성 확인
- [ ] `hvdc_output/report/qa_report.md` 생성 확인
- [ ] `hvdc_output/report/orphan_wh.json` 생성 확인

**QA 리포트 검토**:
- [ ] Coverage 100% 확인 (Status 레코드 수 == shipments_status 행 수)
- [ ] Orphan Warehouse 데이터 검토
- [ ] 날짜 파싱 오류 확인

#### 3.2 Option-C Case 레이어 ETL 실행

```bash
python scripts/etl/optionc_etl.py \
  --all "HVDC all status.json" \
  --wh hvdc_warehouse_status.json \
  --customs "HVDC_STATUS.json" \
  --output-dir .../supabase/supabase/data/output/optionC \
  --export-ttl \
  --base-iri https://example.com/hvdc
```

**생성 파일 확인**:
- [ ] `supabase/data/output/optionC/locations.csv` 생성 확인
- [ ] `supabase/data/output/optionC/shipments_case.csv` 생성 확인
- [ ] `supabase/data/output/optionC/cases.csv` 생성 확인
- [ ] `supabase/data/output/optionC/flows.csv` 생성 확인 (Flow Code v3.5 포함)
- [ ] `supabase/data/output/optionC/events_case.csv` 생성 확인
- [ ] `supabase/data/output/optionC/events_case_debug.csv` 생성 확인 (옵션)
- [ ] `supabase/data/output/optionC/report.md` 생성 확인

**QA 리포트 검토**:
- [ ] Flow Code 분포 확인 (0~5)
- [ ] AGI/DAS 규칙 위반 확인 (flow_code >= 3)
- [ ] requires_review 플래그 확인 (flow_code=5인 경우)

---

### Phase 4: CSV 적재 (1일)

#### 4.1 Status 레이어 적재

**순서**: shipments_status → events_status

**실행 방법**:
- **권장**: Supabase Dashboard Table Editor Import
  - Table Editor → `status.shipments_status` → Import data → CSV 업로드
  - 상세: [Phase 4 CSV 적재 계획](../data-loading/PHASE4_CSV_LOADING_PLAN.md)
- **대안**: `SUPABASE_DB_URL`(Session 5432 권장) 또는 `--db-url` 설정 후 `python scripts/hvdc/load_csv.py [--db-url URL] [--connect-timeout 10] [--truncate] --status-only`. **VPN/failed to resolve** 시 [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432) 참조.
- **고급**: psql \copy (로컬 psql 사용 시)

**방법 1: psql \copy (로컬 psql 사용 시)**

```sql
-- 1) shipments_status 적재
\copy status.shipments_status (
  hvdc_code, status_no, vendor, band, incoterms, currency,
  pol, pod, bl_awb, vessel, ship_mode, pkg, qty_cntr,
  cbm, gwt_kg, etd, eta, ata,
  warehouse_flag, warehouse_last_location, warehouse_last_date, raw
)
FROM 'hvdc_output/supabase/shipments_status.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2) events_status 적재
\copy status.events_status (
  event_id, hvdc_code, event_type, location, event_date, source, raw
)
FROM 'hvdc_output/supabase/events_status.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

**방법 2: Staging Table + UPSERT (대용량/재적재용)**

```sql
-- staging_shipments_status 임시 테이블 생성
CREATE TEMPORARY TABLE staging_shipments_status (LIKE status.shipments_status INCLUDING DEFAULTS);

-- CSV 로드
\copy staging_shipments_status(...) FROM '...' WITH (FORMAT csv, HEADER true);

-- UPSERT
INSERT INTO status.shipments_status
SELECT * FROM staging_shipments_status
ON CONFLICT (hvdc_code) DO UPDATE SET ...;
```

**검증**:
- [ ] `SELECT COUNT(*) FROM status.shipments_status` == CSV 행 수
- [ ] `SELECT COUNT(*) FROM status.events_status` == CSV 행 수
- [ ] Orphan 체크: `events_status` 중 `shipments_status`에 없는 `hvdc_code` = 0

#### 4.2 Case 레이어 적재

**순서**: locations → shipments_case → cases → flows → events_case

```sql
-- 1) locations 먼저 (FK 참조)
\copy "case".locations (
  location_id, location_code, name, category, hvdc_node,
  is_mosb, is_site, is_port, active
)
FROM 'supabase/data/output/optionC/locations.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2) shipments_case
\copy "case".shipments_case (
  hvdc_code, shipment_invoice_no, vendor, coe, pol, pod,
  vessel, hs_code, currency, price
)
FROM 'supabase/data/output/optionC/shipments_case.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 3) cases
\copy "case".cases (
  hvdc_code, case_no, site_code, eq_no, pkg, description,
  final_location, storage, l_cm, w_cm, h_cm, cbm, nw_kg, gw_kg, sqm, vendor
)
FROM 'supabase/data/output/optionC/cases.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 4) flows
\copy "case".flows (
  hvdc_code, case_no, flow_code, flow_code_original, flow_code_derived,
  override_reason, warehouse_count, has_mosb_leg, has_site_arrival,
  customs_code, customs_start_iso, customs_end_iso, last_status, requires_review
)
FROM 'supabase/data/output/optionC/flows.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 5) events_case
\copy "case".events_case (
  hvdc_code, case_no, event_type, event_time_iso, location_id,
  source_field, source_system, raw_epoch_ms
)
FROM 'supabase/data/output/optionC/events_case.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

**검증**:
- [ ] 각 테이블 행 수 == CSV 행 수
- [ ] FK 제약조건 위반 없음
- [ ] Orphan 체크: `events_case` 중 `cases`에 없는 (hvdc_code, case_no) = 0

---

### Phase 5: Gate 1 QA 검증 (0.5일)

**실행 방법**:
- **권장**: 스크립트 실행 (`scripts/hvdc/run_gate1_qa.ps1` 또는 `.sh`)
- **대안**: Supabase Dashboard SQL Editor
- **상세**: [Phase 5 Gate 1 QA 계획](../data-loading/PHASE5_GATE1_QA_PLAN.md)

#### 5.1 Orphan 체크

```sql
-- Status 레이어
SELECT COUNT(*)::bigint AS orphan_status_events
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;

-- Case 레이어
SELECT COUNT(*)::bigint AS orphan_case_events
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;
```

**통과 조건**: orphan_count = 0

#### 5.2 Duplicate 체크

```sql
-- events_case 중복 확인
SELECT
  hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
  COUNT(*)::bigint AS cnt
FROM "case".events_case
GROUP BY 1,2,3,4,5,6,7
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```

**통과 조건**: 중복 행 = 0 또는 명시된 예외만 존재

#### 5.3 Flow Code 규칙 검증

```sql
-- Flow Code 5는 requires_review=true 필수
SELECT COUNT(*)::bigint AS bad_flow5
FROM "case".flows
WHERE flow_code = 5 AND requires_review IS NOT TRUE;

-- AGI/DAS 규칙: final_location이 AGI/DAS인 경우 flow_code >= 3
SELECT COUNT(*)::bigint AS agi_das_violation
FROM "case".cases c
JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3;
```

**통과 조건**: bad_flow5 = 0, agi_das_violation = 0

#### 5.4 Coverage 검증

```sql
-- Status 레이어 Coverage
SELECT
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.shipments_status) AS shipments_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.events_status) AS events_shipments_count;

-- Case 레이어 Coverage
SELECT
  (SELECT COUNT(*) FROM "case".cases) AS cases_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM "case".cases) AS unique_hvdc_codes;
```

---

### Phase 6: 대시보드 연결 (0.5일)

#### 6.1 View 생성 (필요 시)

대시보드에서 사용할 View가 아직 없다면 생성:

```sql
-- 예시: KPI 집계 뷰
CREATE OR REPLACE VIEW public.v_shipments_master AS
SELECT
  ss.hvdc_code,
  ss.status_no,
  ss.vendor,
  ss.eta,
  ss.ata,
  COUNT(DISTINCT c.case_no) AS case_count,
  SUM(c.cbm) AS total_cbm
FROM status.shipments_status ss
LEFT JOIN "case".cases c ON c.hvdc_code = ss.hvdc_code
GROUP BY ss.hvdc_code, ss.status_no, ss.vendor, ss.eta, ss.ata;
```

#### 6.3 API 엔드포인트 테스트
- [ ] `/api/worklist` 엔드포인트 정상 작동 확인
- [ ] KPI 계산 정상 작동 확인
- [ ] Flow Code 표시 정상 확인

#### 6.4 Realtime 구독 테스트
- [ ] `status.shipments_status` Realtime 구독 확인
- [ ] KPI 업데이트 정상 작동 확인
- [ ] ConnectionStatusBadge 상태 확인

---

### Phase 7: 문서화 및 정리 (0.5일)

#### 7.1 적재 리포트 생성
- [ ] 적재 완료 리포트 작성
  - 적재된 행 수
  - 검증 결과
  - 발견된 이슈 및 해결 방법

#### 7.2 문서 업데이트
- [ ] STATUS.md 업데이트 (데이터 적재 완료 표시)
- [ ] PROJECT_SUMMARY.md 업데이트
- [ ] CHANGELOG.md 업데이트

---

## ⚠️ 주의사항

### 롤백 전략

1. **스키마 롤백**: 마이그레이션 파일에 롤백 SQL 포함 여부 확인
2. **데이터 롤백**: 적재 전 백업 또는 TRUNCATE 후 재적재
3. **부분 롤백**: 특정 테이블만 TRUNCATE 후 재적재

### 성능 고려사항

- **대용량 CSV**: 10만 행 이상인 경우 배치 적재 고려
- **인덱스**: 적재 전 인덱스 일시 비활성화 후 재생성 (선택)
- **ANALYZE**: 적재 후 통계 정보 업데이트

### 데이터 일관성

- **트랜잭션**: 가능한 경우 트랜잭션으로 묶어서 적재
- **FK 제약조건**: 적재 순서 준수 (locations → cases → events)
- **타임존**: 모든 날짜는 Asia/Dubai 기준으로 통일

---

## 📊 예상 일정

| Phase | 작업 | 예상 시간 | 누적 시간 |
|-------|------|----------|----------|
| Phase 1 | 사전 준비 및 검증 | 0.5일 | 0.5일 |
| Phase 2 | DDL 적용 | 0.5일 | 1일 |
| Phase 3 | ETL 실행 및 CSV 생성 | 1일 | 2일 |
| Phase 4 | CSV 적재 | 1일 | 3일 |
| Phase 5 | Gate 1 QA 검증 | 0.5일 | 3.5일 |
| Phase 6 | 대시보드 연결 | 0.5일 | 4일 |
| Phase 7 | 문서화 및 정리 | 0.5일 | 4.5일 |

**총 예상 시간**: 4.5일

---

## ✅ 체크리스트

### 사전 준비
- [ ] 입력 파일 확인 완료
- [ ] ETL 스크립트 실행 가능 확인
- [ ] Supabase 환경 확인 완료

### DDL 적용
- [ ] 스키마 마이그레이션 실행 완료
- [ ] RLS 정책 적용 확인
- [ ] 인덱스 생성 확인

### ETL 실행
- [ ] Status 레이어 CSV 생성 완료
- [ ] Option-C Case 레이어 CSV 생성 완료
- [ ] QA 리포트 검토 완료

### CSV 적재
- [ ] Status 레이어 적재 완료
- [ ] Case 레이어 적재 완료
- [ ] 각 테이블 행 수 검증 완료

### Gate 1 QA
- [ ] Orphan 체크 통과
- [ ] Duplicate 체크 통과
- [ ] Flow Code 규칙 검증 통과
- [ ] Coverage 검증 통과

### 대시보드 연결
- [ ] View 생성 완료 (필요 시)
- [ ] API 엔드포인트 테스트 통과
- [ ] Realtime 구독 테스트 통과

### 문서화
- [ ] 적재 리포트 작성 완료
- [ ] 문서 업데이트 완료

---

## 📚 참조 문서

### Phase별 상세 플랜
- [Phase 2: DDL 적용 계획](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) - Supabase CLI 사용
- [Phase 4: CSV 적재 계획](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - Dashboard Import 또는 Python 스크립트
- [Phase 5: Gate 1 QA 계획](../data-loading/PHASE5_GATE1_QA_PLAN.md) - 데이터 무결성 검증
- [Phase 6: Realtime 활성화 계획](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md) - Realtime publication 활성화

### 통합 플랜
- [supabase/data/raw 데이터 Supabase 업로드 완전 플랜](../supabase/SUPABASE_UPLOAD_COMPLETE_PLAN.md) - Phase 2~6 통합 플랜

### 관련 문서
- [RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md) - Supabase 구성 Runbook
- [README_dashboard_ready_FULL.md](../supabase/data/raw/README_dashboard_ready_FULL.md) - ETL 스크립트 설명
- [ETL_GUIDE.md](./ETL_GUIDE.md) - ETL 스크립트 가이드
- [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md) - 실행 Runbook
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - 진행 상황
- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) - 프로젝트 종합 현황

---

**최종 업데이트**: 2026-02-07 — Phase 2~6 완료 상태 반영 (DDL 적용, CSV 적재 871+928, Gate 1 QA, Realtime 활성화), 대시보드 데이터 반영 완료, UI/UX 개선사항 반영 (히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)
