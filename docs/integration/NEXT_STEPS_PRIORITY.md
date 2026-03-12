# 다음 단계 우선순위 및 실행 계획

**작성일**: 2026-01-25
**최종 업데이트**: 2026-02-07
**현재 상태**: Phase 2~6·대시보드 데이터 반영·로컬 테스트 완료 ✅, UI/UX 개선 완료 (2026-02-05~07) ✅

---

## 현재 상태 요약

### 완료된 작업 ✅

1. ✅ 중첩 구조 삭제 (`logi-cockpit-docs/logi-cockpit-docs/`)
2. ✅ Monorepo 스캐폴딩 스크립트 준비 (`scripts/migrate-to-monorepo.ps1`)
3. ✅ Monorepo 구조 이관 완료
   - `apps/hvdc-dashboard/`
   - `apps/logistics-dashboard/`
   - `packages/ui-components/`, `packages/shared/`
   - `scripts/`, `configs/`, `supabase/migrations/`
4. ✅ 통합 UI 레이아웃 프로토타입 (`packages/ui-components/src/UnifiedLayout.tsx`)
5. ✅ 통합 스키마 설계 (`.cursor/skills/supabase-unified-schema/assets/schema_v2_unified.sql`)
6. ✅ 루트 설정 파일 생성 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)
7. ✅ `/api/worklist` 엔드포인트 구현 및 타입/빌드 검증 (STATUS.md 기준)
8. ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
   - `useSupabaseRealtime`, `useKpiRealtime`, `useInitialDataLoad`, `useBatchUpdates` 훅 구현
   - `ConnectionStatusBadge` UI 컴포넌트 구현
   - Realtime 마이그레이션 스크립트 생성 (`supabase/migrations/20260124_enable_realtime.sql`)
   - 폴백 폴링 메커니즘 구현
   - 루트 `package.json`의 `packageManager` 필드 제거 (Turborepo 호환성)
9. ✅ **Phase 2~6·대시보드 데이터 반영 완료** (2026-01-25)
   - DDL 적용, CSV 적재 (871+928), Gate 1 QA, Realtime 활성화
   - `public.shipments` 뷰 생성, Worklist API 연동, 로컬 테스트 871 rows·KPI 확인
10. ✅ **UI/UX 개선 완료** (2026-02-05~2026-02-07)
    - 히트맵 강도 범례 추가 (낮음~매우 높음)
    - 줌 기반 레이어 가시성 구현 (히트맵/상태/POI 레이어 동적 표시)
    - RightPanel 탭 UI (Status/Occupancy/Distribution)
    - 타이포그래피 개선 (text-sm 기준, 가독성 향상)
    - KPI 요약 스트립 헤더 고정 및 레이아웃 간격 조정
    - HVDC 워크리스트 간소화 (핵심 컬럼만 표시, 상세는 DetailDrawer)

### 대기 중인 작업 ⏳

1. ✅ **dash 패치 적용 완료** (맵 POI·StageCardsStrip·GlobalSearch) (2026-01-25)
   - 맵 POI 레이어 (11개 고정 POI, reakmapping SSOT) ✅
   - StageCardsStrip (HVDC Panel 내 KpiStrip 상단 3카드, 라우팅 연동) ✅
   - GlobalSearch (locations·worklist 검색) ✅
   - 참조: [docs/DASH_PLAN.md](../deployment/DASH_PLAN.md), [dash/reakmapping.md](../dash/reakmapping.md), [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md)
2. ⏳ 통합 Store 설계 (`OpsStore`)
   - Map ↔ Worklist ↔ Detail 동기화
   - `selected_case_id`, `selected_location_id`, 필터/UI 상태 통합
3. ⏳ RLS/Realtime/성능 게이트 검증
   - RLS 정책 테스트
   - Realtime 성능 테스트 (p95 < 3s 검증)
   - plan.md 상 남은 테스트 (Validation, User Flows 등)
4. ⏳ (선택) Realtime 구독 최적화: `status.shipments_status` 테이블 구독 전환

---

## 우선순위별 실행 계획

### Priority 0: dash 패치 적용 ✅ 완료 (2026-01-25)

**완료 상태**:
- ✅ 맵 POI 레이어 (11개 고정 POI, reakmapping SSOT) 적용 완료
- ✅ StageCardsStrip (HVDC Panel 내 KpiStrip 상단 3카드, 라우팅 연동) 적용 완료
- ✅ GlobalSearch (locations·worklist 검색) 적용 완료

**참조**: [docs/DASH_PLAN.md](../deployment/DASH_PLAN.md) - 상세 작업 계획

---

### Priority 1: Flow Code v3.5 마이그레이션 (CRITICAL)

**이유**:
- Flow Code는 AGI/DAS 규칙 및 전체 KPI/리스크 평가의 핵심 축
- 데이터 모델이 확정되어야 UI/Store/검증(Validation/SHACL)을 안정적으로 설계 가능

**작업 내용**:

1. 마이그레이션 SQL 파일 생성
   - 대상: `supabase/migrations/20260123_add_flow_code_v35.sql` (파일명은 예시, STATUS.md와 정합성 필요)
   - 포함 내용:
     - `shipments` 테이블에 Flow Code 관련 컬럼 추가
       - `flow_code`
       - `flow_code_original`
       - `flow_override_reason`
       - (필요 시) `final_location` 등
     - AGI/DAS 제약조건
       - 예: `CHECK (site IN ('AGI','DAS') → flow_code >= 3)`
     - 계산/검증용 함수 및 뷰 (분포 확인, 위반 건수 확인 등)

2. 마이그레이션 적용 및 검증
   - Supabase SQL 실행 또는 CLI 적용
   - `scripts/migrations/validate_flow_code_migration.py`로 검증:
     - 모든 `shipments`에 Flow Code 계산 여부
     - AGI/DAS 규칙 위반 여부
     - 업그레이드된 케이스(0/1/2→3) 통계

3. 문서/가이드 정리
   - `docs/migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md`에:
     - 전/후 스키마
     - 실행 순서
     - 롤백 전략
     - 검증 체크리스트

**예상 시간**: 0.5–1일 (설계 완료 기준, 구현+검증 포함)

---

### Priority 2: 통합 Store 설계 (`OpsStore`) (HIGH)

**이유**:
- STATUS.md Done 정의에 있는 핵심 사용자 플로우:
  - **Map 선택 → Worklist 필터 + Detail 열림**
  - **Worklist 선택 → Map 하이라이트 + Detail 열림**
- 이 모든 것은 **단일 Store(OpsStore)** 없이 구현하면 동기화/회귀 리스크가 큼

**작업 내용**:

1. 인터페이스 설계 (`packages/shared/src/store/opsStore.ts`)
   ```ts
   export interface OpsStore {
     // Logistics
     locations: Record<string, Location>;
     locationStatuses: Record<string, LocationStatus>;
     events: Record<string, Event>;

     // HVDC
     worklistRows: WorklistRow[];
     kpis: KPIs;
     filters: DashboardFilters;

     // UI
     selectedLocationId?: string;
     selectedCaseId?: string;
     bottomOpen: boolean;
     rightOpen: boolean;
     liveEnabled: boolean;

     // Actions
     selectLocation(id: string): void;      // → HVDC 필터링
     selectWorklistRow(id: string): void;   // → Map 하이라이트
     setFilters(partial: Partial<DashboardFilters>): void;
     toggleBottom(open?: boolean): void;
     toggleRight(open?: boolean): void;
   }
   ```

2. 구현 및 통합
   - Zustand 기반 구현 (`createOpsStore`)
   - `UnifiedLayout.tsx`에서 `OpsStore`를 주입
   - 기존 `logisticsStore`, `dashboardStore`의 상태/액션을 점진적으로 OpsStore로 이관

3. 핵심 플로우 테스트 설계 (plan.md 연계)
   - e2e:
     - `test_location_selection_flow`
     - `test_worklist_detail_drawer`
   - UI:
     - `test_mapview_left_layout` (이미 완료)
     - `test_layout_resize` (미완료)

**예상 시간**: 1–2일 (인터페이스 설계 + 1차 통합 기준)

---

### Priority 3: RLS / Realtime / 성능 게이트 검증 (MEDIUM)

**이유**:
- AGENTS.md + STATUS.md가 정의한 **Gate 3 (성능)**, **RLS 보안**, **Realtime 품질**은 프로젝트 성공의 필수 조건
- Realtime 구현은 완료되었으나, 검증 및 성능 테스트는 아직 필요

**작업 내용**:

1. RLS 검증
   - `schema_v2_unified.sql` 기준으로 모든 공개 테이블에 RLS ON 여부 확인
   - 익명(anon) vs 서비스 롤 권한 분리 테스트
   - plan.md의 `test_rls_policies_enforced`, `test_service_role_not_in_client` 구현/실행

2. Realtime 및 성능 테스트
   - ✅ Realtime 구현 완료 (2026-01-24): `useSupabaseRealtime`, `useKpiRealtime` 훅 구현
   - ⏭️ `realtime-perf-testing` 스킬 기반으로 k6 스크립트 실행
   - ⏭️ plan.md Realtime & Performance 섹션의 테스트들을 구현/실행:
     - `test_realtime_subscription`
     - `test_realtime_updates_merged`
     - `test_no_duplicate_updates`
     - `test_worklist_load_time` (avg < 1s)
     - `test_status_panel_refresh_time`
     - `test_p95_response_time` (p95 < 3s 목표)

3. Foundry/Ontology 통합 게이트
   - plan.md의 Supabase ↔ Foundry/Ontology Integration, Validation & Quality Gates 섹션 테스트들 단계적 구현
   - SHACL, OCR Gate(MeanConf/TableAcc/NumericIntegrity), ZERO fail-safe 검증 코드 추가

**예상 시간**: 2–3일 (테스트/튜닝 포함, 병렬 가능)

---

## 권장 실행 순서

### Step 1: Flow Code v3.5 마이그레이션 (Priority 1)

```bash
# 1) 마이그레이션 SQL 작성 (예: supabase/migrations/20260123_add_flow_code_v35.sql)
# 2) Supabase에 적용
# 3) 검증 스크립트 실행
python scripts/migrations/validate_flow_code_migration.py
```

검증 포인트:

- 모든 `shipments` 행에 `flow_code` 값 존재
- AGI/DAS 규칙 위반 0건 또는 명시된 예외만 존재
- Flow Code 분포/업그레이드 케이스 통계가 기대 범위 내

---

### Step 2: 통합 Store 설계 및 UnifiedLayout 연동 (Priority 2)

```ts
// packages/shared/src/store/opsStore.ts
// 1) 인터페이스 정의
// 2) Zustand store 구현
// 3) UnifiedLayout.tsx에서 사용
```

검증 포인트:

- Map 선택 → Worklist 필터 + Detail 열림
- Worklist 선택 → Map 하이라이트 + Detail 열림
- 상태가 새로고침/탭 전환 후에도 일관성 유지

---

### Step 3: RLS/Realtime/성능 게이트 (Priority 3)

```bash
# Realtime/성능 테스트 예시
python -m pytest tests/integration/test_realtime.py -v
python -m pytest tests/performance/test_performance.py -v
k6 run scripts/k6_api_smoke.js
```

검증 포인트:

- avg < 1s, p95 < 3s (핵심 플로우)
- 중복 업데이트 없음, Realtime merge/debounce 정상
- anon/service_role 경계가 RLS 정책대로 동작

---

## 실행 체크리스트

### Flow Code 마이그레이션 전

- [ ] `supabase/migrations` 디렉토리 존재 (`20260101_initial_schema.sql` 확인)
- [ ] Supabase 접근 권한/환경 변수 설정 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] 백업/롤백 전략 정의

### Flow Code 마이그레이션 후

- [ ] SQL 마이그레이션 성공 로그 확인
- [ ] 검증 스크립트 통과
- [ ] STATUS.md 및 관련 문서(ARCHITECTURE, ROADMAP 등)에 Flow Code 필드 반영 여부 확인

### 통합 Store 설계 전/후

- [ ] `packages/shared` 디렉토리 및 타입/유틸 존재
- [ ] UnifiedLayout에서 기존 store 참조 위치 파악
- [ ] 새 OpsStore로 전환 후 e2e 플로우 통과

### RLS/Realtime/성능 검증 후

- [ ] plan.md의 Realtime & Performance, Validation, Supabase↔Foundry 테스트 케이스 구현
- [ ] Gate 1/2/3 기준(AGENTS.md, STATUS.md) 만족 여부 기록

---

## 다음 즉시 실행 작업

1. ✅ Monorepo 구조 이관 및 1차 통합 설계 완료
2. ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
3. ✅ Phase 2~6·대시보드 데이터 반영 완료 (2026-01-25)
4. ✅ dash 패치 적용 완료 (2026-01-25) - 맵 POI·StageCardsStrip·GlobalSearch 통합
5. ✅ UI/UX 개선 완료 (2026-02-05~07) - 히트맵, 줌 기반 레이어, RightPanel 탭, 타이포그래피, KPI 스트립, 워크리스트 간소화
6. ⏭️ **Flow Code v3.5 마이그레이션 SQL 작성 및 적용 (Priority 1)**
7. ⏭️ OpsStore 설계 및 UnifiedLayout 연동 (Priority 2)
8. ⏭️ RLS/Realtime/성능/Foundry 통합 테스트 구현 (Priority 3)

---

## 참조 문서

- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [INTEGRATION_ROADMAP.md](../integration/INTEGRATION_ROADMAP.md) - 통합 로드맵
- [MIGRATION_CHECKLIST.md](../migrations/MIGRATION_CHECKLIST.md) - 이관 체크리스트
- [DASH_PLAN.md](../deployment/DASH_PLAN.md) - dash 패치 적용 계획 (맵 POI·StageCardsStrip·GlobalSearch)
- [dash/reakmapping.md](../dash/reakmapping.md) - 맵 POI 좌표·레이어 SSOT
- [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) - dash 패치 통합 절차
- [migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md](./migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md) - Flow Code 마이그레이션 가이드 (작성 대상)

---

**문서 버전**: 1.3
**최종 업데이트**: 2026-02-07 — UI/UX 개선사항 반영 (히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)
