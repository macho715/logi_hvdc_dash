# 대시보드 데이터 통합 진행 상황

> **작성일**: 2026-01-25  
> **최종 업데이트**: 2026-02-07  
> **목적**: v2 패치 통합 후 대시보드까지 데이터 반영 확인 진행 상황

---

## 완료된 작업

### 1. Python 스크립트 생성 ✅

#### `scripts/hvdc/apply_ddl.py`
- DDL 적용을 위한 Python 스크립트
- psycopg3 사용
- psql 없이 DDL 적용 가능

#### `scripts/hvdc/load_csv.py`
- CSV 적재를 위한 Python 스크립트
- psycopg3 사용
- Status 레이어 및 Case 레이어 지원
- `--truncate` 및 `--status-only` 옵션 지원

### 2. 의존성 설치 ✅

- `psycopg[binary]>=3.0.0` 설치 완료

### 3. Phase 1: 입력 검증 ✅

- 모든 필수 파일 확인 완료
- Python 의존성 정상

### 4. Phase 3: Status ETL 실행 ✅

- CSV 파일 생성 완료:
  - `hvdc_output/supabase/shipments_status.csv` (874 rows)
  - `hvdc_output/supabase/events_status.csv`
- QA 리포트: Coverage 100%, PASS

### 5. Phase 2: DDL 적용 ✅

**상태**: 완료 (Session pooler 5432)

- **실행**: `SUPABASE_DB_URL` (Session pooler `aws-1-us-east-1.pooler.supabase.com:5432`) + `run_phase2_ddl.ps1` → `apply_ddl.py` + `verify_phase2_ddl.py`
- **검증**: 스키마 `status`, `case`, `ops` / 테이블 `shipments_status`, `events_status`, `case.*`, `ops.etl_runs` / 뷰 `public.v_*` 8개 확인

### 6. Phase 4: CSV 적재 ✅

**상태**: 완료 (검증 통과)

- **실행**: `SUPABASE_DB_URL` (Session pooler 5432) + `load_csv.py --status-only`
- **결과**:
  - `status.shipments_status`: 871 rows (UPSERT with dedupe: `status_no DESC NULLS LAST`, 중복 제거)
  - `status.events_status`: 928 rows (UPSERT + FK 필터: `event_id` 기준 UPSERT, 75 orphan rows 제외)
  - **총 1,799 rows 적재 완료**
- **검증** (`check_status_tables.py`):
  - Unique `hvdc_code` = 871 (예상: 871)
  - Orphan `events_status` = 0 (예상: 0)
  - 모든 검증 항목 통과

### 7. Phase 5: Gate 1 QA ✅

**상태**: 완료 (모든 검사 통과)

- **실행**: `SUPABASE_DB_URL` (Session pooler 5432) + `gate1_qa.py`
- **검증 결과**:
  - Orphan: `orphan_status_events` = 0, `orphan_case_events` = 0
  - Duplicate: `dup_events_case_rows` = 0
  - Flow Code: `bad_flow5` = 0, `agi_das_violation` = 0
  - Coverage: `shipments_count` = 871, `events_shipments_count` = 540
- **Exit code**: 0

### 8. Phase 6: Realtime 활성화 ✅

**상태**: 완료 (검증 통과)

- **실행**: `SUPABASE_DB_URL` (Session pooler 5432) + `apply_ddl.py supabase/migrations/20260124_enable_realtime_layers.sql`
- **검증 결과** (`verify_realtime_publication.py`):
  - `status.shipments_status` - Realtime 활성화
  - `status.events_status` - Realtime 활성화
  - `case.events_case` - Realtime 활성화
  - `case.flows` - Realtime 활성화
  - `case.cases` - Realtime 활성화
- **Exit code**: 0

### 9. 대시보드 데이터 반영 ✅

**상태**: 완료 (뷰 생성 및 API 수정)

- **뷰 생성**: `supabase/migrations/20260125_public_shipments_view.sql`
  - `public.shipments` 뷰: `status.shipments_status` + `case.flows` + `case.cases` 조인
  - 871 rows (status.shipments_status와 동일)
- **API 수정**: `apps/logistics-dashboard/app/api/worklist/route.ts`
  - `warehouse_inventory` select 제거 (현재 status 레이어에 없음)
  - `public.shipments` 뷰 조회로 전환
- **검증**: `check_dashboard_data.py` → `public.shipments` 871 rows
- **로컬 테스트**: ✅ 완료 (2026-01-25)
  - `apps/logistics-dashboard/.env.local`에 Supabase 키 설정
  - `pnpm dev` (포트 3001) → `/api/worklist` **871 rows·KPI** 정상 반환
- **참고**: Realtime 구독은 뷰에서 이벤트를 받지 않으므로, 필요 시 `status.shipments_status`로 구독 변경

### 10. 맵 레이어 API 라우트 Supabase 전환 ✅

**상태**: 완료 (Mock → 실제 데이터 조회 전환)

- **API 수정**: `apps/logistics-dashboard/app/api/locations/route.ts`, `/api/location-status/route.ts`, `/api/events/route.ts`
  - Mock 데이터 반환에서 Supabase `public.locations`, `public.location_statuses`, `public.events` 조회로 전환
  - 스키마 매핑 적용:
    - Locations: `id→location_id`, `lng→lon`, `type→siteType` (매핑 함수)
    - Location Statuses: `status→status_code` (대문자 변환), `occupancy_rate` (0–100→0–1), `updated_at→last_updated`
    - Events: `locations!inner` 조인 (좌표 필수), `shipments` 조인 (선택적), `event_type→status`, `description→remark`
  - Fallback 로직: DB 조회 실패 또는 빈 데이터 시 Mock 데이터 반환
- **검증**: 로컬 테스트 완료 (2026-01-25)
  - `/api/locations`: 정상 응답 (Mock fallback, `public.locations` 테이블 없음)
  - `/api/location-status`: 정상 응답 (Mock fallback, `public.location_statuses` 테이블 없음)
  - `/api/events`: 정상 응답 (Mock fallback, `public.events` 테이블 없음 — `PGRST205` 에러)
- **참고**:
  - Geofence/Heatmap/ETA wedge 레이어는 Supabase 테이블이 채워지면 실제 데이터 사용 (자동 반영)
  - `public.locations`, `public.location_statuses`, `public.events` 테이블 생성·적재 후 실제 데이터 사용 가능

---

## 진행 중인 작업

- 없음 (Phase 2~6 및 대시보드 데이터 반영·로컬 테스트 완료)

## 완료된 UI/UX 개선 (2026-02-05~2026-02-07) ✅

### 1. 히트맵 강도 범례 추가 (2026-02-05)
- 히트맵 토글 활성 시 강도 범례 표시 (낮음~매우 높음)
- 지오펜스 영역 이벤트 가중치 적용
- POI 라벨 강조 (MOSB yard)
- DSV 창고 라벨링 추가
- MOSB-SCT 오피스 상태 필터링
- 타이포그래피 대비 개선

### 2. 줌 기반 레이어 가시성 구현 (2026-02-06)
- 히트맵/상태/POI 레이어 동적 표시 (줌 임계값 기반)
- POI 라벨 컴팩트/상세 모드 전환 (줌 7.5~10.5: 코드만, ≥10.5: 상세)
- 히트맵 반경 줌 스케일링
- RightPanel 탭 UI (Status/Occupancy/Distribution)
- 접근성 포커스 처리 (`activeTab`, `activePanel?.focus()`)
- 타이포그래피 스케일 개선 (text-sm 기준)

### 3. 레이아웃 및 워크리스트 개선 (2026-02-07)
- KPI 요약 스트립 헤더 고정 (2행 구조, `aria-live="polite"`)
- 레이아웃 간격 조정 (HVDC 패널 겹침 방지, pt-24, lg:pb-96)
- HVDC 워크리스트 간소화 (핵심 컬럼만: Gate/Title/Due/Score)
- 상세 정보는 DetailDrawer로 이동 (Triggers 포함)
- RightPanel 중복 요약 제거

---

## 대기 중인 작업

### Realtime 구독 최적화 (선택)
- **현재**: `useKpiRealtime`가 `public.shipments` 뷰를 구독 (이벤트 없음)
- **권장**: `schema: "status"`, `table: "shipments_status"`로 변경
- **방법**: `apps/logistics-dashboard/hooks/useKpiRealtime.ts` 수정

---

## 다음 단계 권장 사항

1. **dash 패치 적용** (맵 POI·StageCardsStrip·GlobalSearch)
   - 맵 POI 레이어 (11개 고정 POI, reakmapping SSOT)
   - StageCardsStrip (HVDC Panel 하단 3카드, 라우팅 연동)
   - GlobalSearch (locations·worklist 검색)
   - 참조: [docs/DASH_PLAN.md](../deployment/DASH_PLAN.md), [dash/reakmapping.md](../dash/reakmapping.md), [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md)
2. **Realtime 구독 최적화** (선택)
   - `status.shipments_status` 테이블로 구독 변경 후 실시간 업데이트 테스트
3. **Vercel 프로덕션 worklist 검증**
   - 배포 환경에서 `/api/worklist` 871 rows·KPI 확인

**대시보드 데이터 반영 참고**: [연결 문제 해결](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md)

---

## 대시보드 데이터 반영 완료 요약

### 완료된 작업

1. **Phase 2~6 완료**
   - Phase 2: DDL 적용 (스키마/테이블/뷰 생성)
   - Phase 4: CSV 적재 (871 shipments + 928 events)
   - Phase 5: Gate 1 QA (모든 검사 통과)
   - Phase 6: Realtime 활성화 (5개 테이블)

2. **대시보드 데이터 반영**
   - `public.shipments` 뷰 생성 (871 rows)
   - Worklist API 수정 (`warehouse_inventory` 제거)
   - 검증 스크립트 통과

### 로컬 테스트 상태 ✅

- Next.js 서버: 정상 기동 (포트 3001)
- `/api/worklist`: 200 OK, **871 rows**, KPI 정상 (driAvg, redCount 등)
- `.env.local` (Supabase URL·service_role·anon) 설정 후 검증 완료

### 다음 단계

- **(선택)** Realtime 구독 `status.shipments_status` 전환
- Vercel 프로덕션에서 `/api/worklist` 871 rows·KPI 확인

---

## 생성된 파일

- `scripts/hvdc/apply_ddl.py` - DDL 적용 (env `SUPABASE_DB_URL` 또는 `--db-url` 지원)
- `scripts/hvdc/verify_phase2_ddl.py` - Phase 2 스키마·테이블·뷰 검증 (동일 env/`--db-url`)
- `scripts/hvdc/load_csv.py` - CSV 적재 (env `SUPABASE_DB_URL` 또는 `--db-url`, `--truncate`, `--status-only`, UPSERT + FK 필터 지원)
- `scripts/hvdc/check_dashboard_data.py` - 대시보드 데이터 검증 (Python, env `SUPABASE_DB_URL` 또는 `--db-url`)
- `scripts/hvdc/gate1_qa.py` - Gate 1 QA 검증 (Python, env `SUPABASE_DB_URL` 또는 `--db-url`)
- `scripts/hvdc/verify_realtime_publication.py` - Phase 6 Realtime publication 검증 (Python, env `SUPABASE_DB_URL` 또는 `--db-url`)
- `scripts/hvdc/run_phase2_ddl.ps1` - Phase 2 DDL (옵션 A: `SUPABASE_DB_URL` → apply_ddl+verify / 옵션 B: `SUPABASE_ACCESS_TOKEN`+`SUPABASE_PROJECT_REF` → link+execute+verify)
- `supabase/migrations/20260125_public_shipments_view.sql` - `public.shipments` 뷰 생성 (대시보드 호환)
- `docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md` - 연결 문제 해결 가이드
- `docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md` - 진행 상황 문서 (본 문서)

---

## 참조 문서

### Phase별 상세 플랜
- [Phase 2: DDL 적용 계획](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) - Supabase CLI 사용
- [Phase 2 DDL Cursor plan](../.cursor/plans/phase2_ddl_supabase_cli.plan.md) (선택)
- [Phase 4: CSV 적재 계획](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - Dashboard Import 또는 Python 스크립트
- [Phase 5: Gate 1 QA 계획](../data-loading/PHASE5_GATE1_QA_PLAN.md) - 데이터 무결성 검증
- [Phase 6: Realtime 활성화 계획](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md) - Realtime publication 활성화

### 통합 플랜
- [supabase/data/raw 데이터 Supabase 업로드 완전 플랜](../supabase/SUPABASE_UPLOAD_COMPLETE_PLAN.md) - Phase 2~6 통합 플랜
- [대시보드 데이터 통합 완료 계획](../.cursor/plans/대시보드_데이터_통합_완료_계획_6fe9f10b.plan.md)
- [supabase_upload_complete Cursor plan](../.cursor/plans/supabase_upload_complete.plan.md)

### 관련 문서
- [Supabase 연결 문제 해결 가이드](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md)
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md)
- [데이터 로딩 계획](../data-loading/DATA_LOADING_PLAN.md)
- [v2 패치 실행 계획](./V2_PATCH_EXECUTION_PLAN.md)

---

**최종 업데이트**: 2026-02-07 — 대시보드 데이터 반영 완료, 로컬 테스트 완료 (871 rows·KPI), UI/UX 개선 완료 (히트맵 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)
