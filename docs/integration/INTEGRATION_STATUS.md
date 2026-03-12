# HVDC + Logistics 통합 상태 문서

> **역할**: 컴포넌트별 상세 상태 문서 (HVDC DASH, v0-logistics-dashboard 등 기술 스택, API 엔드포인트 상세)  
> **Last Updated**: 2026-02-07  
> **Status**: 통합 진행 중 (Phase 2~6 완료, 대시보드 데이터 반영 완료, UI/UX 개선 완료)  
> **참조**: [roadmap_system_doc.md](./roadmap_system_doc.md) - 통합 단계별 로드맵  
> **Reference**: [AGENTS.md](../../AGENTS.md), [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md), [STATUS.md](../../STATUS.md)

---

## Executive Summary

현재 프로젝트는 **4개의 독립적인 컴포넌트**로 구성되어 있으며, **단일 웹 애플리케이션**으로 통합이 필요합니다.

- ✅ **HVDC DASH**: 완성된 HVDC 대시보드 (독립 실행 중)
- ✅ **v0-logistics-dashboard**: 지도 기반 물류 대시보드 (독립 실행 중)
- ✅ **logiontology_scaffold**: RDF 파이프라인 (독립 스크립트)
- 📚 **Logi ontol core doc**: 온톨로지 문서 (Flow Code v3.5)

**목표**: MapView (left) + RightPanel (right) + HVDC Panel (bottom) 통합 레이아웃

---

## 1. 현재 컴포넌트 상태

### 1.1 HVDC DASH (`HVDC DASH/hvdc-dashboard/`)

**상태**: ✅ 완성, 프로덕션 준비

**기술 스택**:
- Next.js 16 (App Router), React 19, TypeScript
- Supabase (PostgreSQL + RLS)
- Zustand (상태 관리)
- Tailwind CSS 4
- 포트: 3001

**주요 컴포넌트**:
```
src/
├── app/
│   ├── api/
│   │   ├── worklist/route.ts        # 대시보드 데이터 + KPI 계산
│   │   ├── shipments/route.ts       # 선적 목록
│   │   ├── statistics/route.ts      # 통계
│   │   ├── alerts/route.ts          # 알림
│   │   └── weather/route.ts         # 날씨
│   └── page.tsx
├── components/
│   ├── Dashboard.tsx               # 메인 대시보드
│   ├── dashboard/
│   │   ├── KpiStrip.tsx            # 실시간 KPI
│   │   ├── WorklistTable.tsx       # 워크리스트 (Gate 로직)
│   │   ├── DetailDrawer.tsx         # 상세 패널
│   │   ├── SavedViewsBar.tsx       # 저장된 뷰
│   │   └── WorklistToolbar.tsx     # 필터/검색
│   └── layout/
│       ├── DashboardLayout.tsx      # 레이아웃 래퍼
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── supabase.ts                 # Supabase 클라이언트
│   └── worklist-utils.ts           # KPI 계산, 변환 로직
└── store/
    └── dashboardStore.ts           # Zustand store
```

**데이터베이스 스키마**:
- `shipments`: 선적 마스터 (81개 컬럼)
- `warehouse_inventory`: 창고 재고
  - `project_shu2`, `project_mir3`, `project_das4`, `project_agi5` (DATE 타입)
  - `mosb`, `dsv_indoor`, `dsv_outdoor`, `dsv_mzd`, `jdn_mzd`, `jdn_waterfront` (DATE)
- `container_details`: 컨테이너 상세
- `financial_transactions`: 재무 트랜잭션
- `shipment_tracking_log`: 추적 로그

**API 엔드포인트**:
- `GET /api/worklist`: 대시보드 페이로드 (KPI + WorklistRows)
  - Asia/Dubai 시간대 처리
  - 자동 KPI 계산 (DRI Avg, WSI Avg, Red Count, Overdue, Recoverable AED)
  - 5분마다 자동 갱신
- `GET /api/shipments`: 선적 목록
- `GET /api/statistics`: 통계 데이터
- `GET /api/alerts`: 알림
- `GET /api/weather`: 날씨 정보

**상태 관리**:
- `dashboardStore.ts`: 필터, 선택, 저장된 뷰, KPI, 워크리스트 행

**특징**:
- ✅ Gate 로직 (RED/AMBER/GREEN/ZERO) 자동 분류
- ✅ 저장된 뷰 (Saved Views) 기능
- ✅ 모바일 대응 (DetailDrawer overlay 모드)
- ✅ PWA 지원 (next-pwa)
- ⚠️ `GlobalMap.tsx` 존재하나 미사용

---

### 1.2 v0-logistics-dashboard (`v0-logistics-dashboard-build-main/`)

**상태**: ✅ 지도 UI 완성, 데이터 연동 필요

**기술 스택**:
- Next.js 16, React 19, TypeScript
- deck.gl 9.2.5 + maplibre-gl 5.15.0
- Zustand (상태 관리)
- Radix UI 컴포넌트
- Recharts (차트)

**주요 컴포넌트**:
```
app/
└── page.tsx                        # 메인 페이지
components/
├── map/
│   ├── MapView.tsx                 # 지도 뷰 (deck.gl 통합)
│   └── layers/
│       ├── createLocationLayer.ts  # 위치 레이어
│       ├── createHeatmapLayer.ts  # 히트맵 레이어
│       ├── createGeofenceLayer.ts # 지오펜스 레이어
│       └── createEtaWedgeLayer.ts # ETA 웨지 레이어
├── dashboard/
│   ├── HeaderBar.tsx               # 헤더 바
│   └── RightPanel.tsx              # 우측 상태 패널
└── ui/                             # Radix UI 컴포넌트
hooks/
└── useLiveFeed.ts                  # WebSocket 실시간 피드
lib/
├── api.ts                          # API 호출 (Mock 데이터 포함)
├── time.ts                         # Dubai 시간대 처리
└── utils.ts
store/
└── logisticsStore.ts               # Zustand store
```

**데이터 모델** (예상):
- `locations`: 물류 위치 (location_id, name, lat, lon, siteType)
- `location_statuses`: 위치별 상태 (location_id, occupancy_rate, status_code, last_updated)
- `events`: 이벤트 로그 (event_id, ts, shpt_no, status, location_id, lat, lon)

**상태 관리**:
- `logisticsStore.ts`: locationsById, statusByLocationId, eventsById, UI 상태

**특징**:
- ✅ deck.gl 레이어 통합 (Location, Heatmap, Geofence, ETA Wedge)
- ✅ 실시간 피드 (`useLiveFeed.ts` - WebSocket)
- ✅ Dubai 시간대 처리
- ⚠️ 현재 Mock 데이터 사용 (`lib/api.ts`)
- ⚠️ Supabase 연동 미구현

---

### 1.3 logiontology_scaffold (`logiontology_scaffold_2026-01-23/`)

**상태**: ✅ 실행 가능한 스크립트, 프로젝트 통합 필요

**구조**:
```
scripts/
├── core/
│   ├── json_to_ttl.py             # JSON → TTL 변환
│   ├── column_audit.py             # 컬럼 감사
│   └── flow_code_calc.py          # Flow Code v3.5 계산
└── pipelines/
    └── run_status_pipeline.py     # 통합 파이프라인
configs/
└── columns.hvdc_status.json        # SSOT 컬럼 스펙
models/
└── ttl/
    └── schema/
        └── patches/
            └── 2026-01-23_site-arrival.ttl  # Site Arrival Date 스키마
rules/
└── shacl/
    └── hvdc-quality-gates.ttl     # SHACL 검증 규칙
```

**기능**:
- ✅ Site Arrival Date 매핑 (SHU2/MIR3/DAS4/AGI5 → RDF properties)
- ✅ used_cols 감사 로그 생성 (`output/ttl/*.used_cols.json`)
- ✅ Flow Code v3.5 분류
- ✅ SHACL 품질 게이트

**컬럼 스펙 SSOT** (`configs/columns.hvdc_status.json`):
- `site_arrival_cols_raw`: ["SHU2", "MIR3", "DAS4", "AGI5"]
- `site_arrival_aliases`: {"SHU2": "SHU", "MIR3": "MIR", ...}
- `warehouse_cols`: 창고 목록
- `date_cols_vectorize`: 날짜 컬럼 목록
- `null_strings`: null로 처리할 문자열 패턴

**실행 방법**:
```bash
# 1) JSON → TTL
python scripts/core/json_to_ttl.py \
  -i "data/HVDC SATUS.JSON" \
  -o "output/ttl/hvdc_status_json.ttl" \
  --config "configs/columns.hvdc_status.json"

# 2) 통합 파이프라인
python scripts/pipelines/run_status_pipeline.py \
  -i "data/HVDC SATUS.JSON" \
  --config "configs/columns.hvdc_status.json"
```

---

### 1.4 Logi ontol core doc (`Logi ontol core doc/`)

**상태**: 📚 문서/스키마 완성, 통합 대기

**핵심 내용**:
- Flow Code v3.5: 0-5 분류 시스템
- AGI/DAS 필수 규칙: Flow Code ≥ 3 필수
- 9개 통합 문서 (CONSOLIDATED-01~09)
- SPARQL 쿼리 템플릿
- SHACL 검증 규칙

**주요 문서**:
- `CORE_DOCUMENTATION_MASTER.md`: 마스터 문서
- `FLOW_CODE_V35_QUICK_REFERENCE.md`: Flow Code 빠른 참조
- `flow-code-v35-schema.ttl`: Flow Code 스키마
- `validate_flow_code_v35.py`: 검증 스크립트

---

## 2. 통합 포인트 분석

### 2.1 레이아웃 통합

**현재 상태**:
```
HVDC 대시보드:
┌─────────────────────────────┐
│ Sidebar │ Worklist + Detail │
└─────────────────────────────┘

물류 대시보드:
┌─────────────────────────────┐
│ MapView │ RightPanel        │
└─────────────────────────────┘
```

**목표 레이아웃** (AGENTS.md 요구사항):
```
┌─────────────────────────────────────────┐
│  MapView (left, 60%)  │  RightPanel (right, 20%)  │
│                        │                           │
│                        │                           │
├─────────────────────────────────────────┤
│  HVDC Panel (bottom, 20%) - KPI/워크리스트     │
└─────────────────────────────────────────┘
```

**모바일 레이아웃**:
- 지도 전체 화면
- 우측 패널: 슬라이드 드로어
- 하단 패널: 드래그 가능한 KPI/워크리스트

**통합 작업**:
- [ ] 통합 레이아웃 컴포넌트 생성
- [ ] MapView 통합 (v0-logistics-dashboard → 통합 앱)
- [ ] RightPanel 통합 (v0-logistics-dashboard → 통합 앱)
- [ ] HVDC Panel 통합 (HVDC DASH → 통합 앱)
- [ ] 모바일 인터랙션 구현 (드래그, 드로어)

---

### 2.2 데이터 통합

**현재 상태**:

| 컴포넌트 | 테이블 | Site Arrival Date 필드 |
|---------|--------|----------------------|
| HVDC DASH | `warehouse_inventory` | `project_shu2`, `project_mir3`, `project_das4`, `project_agi5` (DATE) |
| Logistics | `locations`, `location_statuses` | 없음 |
| RDF | - | `hvdc:hasSHUArrivalDate`, `hvdc:hasMIRArrivalDate`, ... (RDF properties) |

**통합 필요 사항**:
- [ ] `locations` 테이블 생성 (물류 대시보드용)
- [ ] `location_statuses` 테이블 생성
- [ ] `events` 테이블 생성
- [ ] `shipments` ↔ `locations` 관계 정의
- [ ] Site Arrival Date 필드 일관성 확인
  - HVDC: `warehouse_inventory.project_shu2` (DATE)
  - RDF: `hvdc:hasSHUArrivalDate` (xsd:date)
  - 매핑 일관성 유지

**데이터 흐름**:
```
Excel/JSON
  ↓
Python ETL (logiontology_scaffold)
  ↓
Supabase (shipments, warehouse_inventory)
  ↓
RDF Pipeline (json_to_ttl.py)
  ↓
TTL 파일 (온톨로지)
```

---

### 2.3 API 통합

**현재 상태**:

| 컴포넌트 | API | 데이터 소스 |
|---------|-----|------------|
| HVDC DASH | `/api/worklist` | Supabase (`shipments`, `warehouse_inventory`) |
| Logistics | `lib/api.ts` (Mock) | Mock 데이터 |

**통합 필요 사항**:
- [ ] Logistics API를 Supabase로 전환
- [x] 실시간 피드 통합 (Supabase Realtime) ✅ KPI Realtime 구현 완료 (Option A+ 전략, 2026-01-24)
  - `useSupabaseRealtime`, `useKpiRealtime`, `useInitialDataLoad`, `useBatchUpdates` 훅 구현
  - `ConnectionStatusBadge` UI 컴포넌트 구현
  - Realtime 마이그레이션 스크립트 생성 및 적용
  - 폴백 폴링 메커니즘 구현
- [ ] 통합 API 엔드포인트 설계
- [ ] 상태 동기화 (MapView 선택 → HVDC 워크리스트 필터링)

**API 통합 전략**:
```
통합 앱
  ├── /api/worklist          # HVDC 워크리스트 + KPI
  ├── /api/locations         # 물류 위치 목록
  ├── /api/location-statuses # 위치별 상태
  ├── /api/events            # 이벤트 로그
  └── Realtime Subscription  # Supabase Realtime
```

---

### 2.4 상태 관리 통합

**현재 상태**:

| 컴포넌트 | Store | 주요 상태 |
|---------|-------|----------|
| HVDC DASH | `dashboardStore.ts` | rows, kpis, filters, selectedRowId, savedViews |
| Logistics | `logisticsStore.ts` | locationsById, statusByLocationId, eventsById, UI 상태 |

**통합 필요 사항**:
- [ ] 통합 Zustand store 설계
- [ ] 위치 선택 → HVDC 워크리스트 필터링 로직
- [ ] 상태 동기화 (MapView ↔ HVDC Panel)

**통합 Store 구조 제안**:
```typescript
interface UnifiedStore {
  // Logistics
  locations: Record<string, Location>
  locationStatuses: Record<string, LocationStatus>
  events: Record<string, Event>
  
  // HVDC
  worklistRows: WorklistRow[]
  kpis: KPIs
  filters: DashboardFilters
  
  // UI
  selectedLocationId?: string
  selectedRowId?: string
  drawerOpen: boolean
  
  // Actions
  selectLocation: (id: string) => void  // → HVDC 필터링
  selectWorklistRow: (id: string) => void  // → 지도 하이라이트
}
```

---

## 3. 통합 로드맵

### Phase 1: Monorepo 구조 생성 ✅ 완료

**목표**: 프로젝트를 표준 Monorepo 구조로 재구성

**작업**:
- [x] `/apps/hvdc-dashboard` 생성 ✅ 완료
  - `HVDC DASH/hvdc-dashboard/` → `/apps/hvdc-dashboard/` 이동 완료
  - 의존성 확인 및 업데이트 완료
- [x] `/apps/logistics-dashboard` 생성 ✅ 완료
  - `v0-logistics-dashboard-build-main/` → `/apps/logistics-dashboard/` 이동 완료
  - 의존성 확인 및 업데이트 완료
- [x] `/packages/ui-components` 생성 ✅ 완료
  - 공유 컴포넌트 추출 완료
  - TypeScript 설정 완료
- [x] `/scripts` 생성 ✅ 완료
  - `logiontology_scaffold_2026-01-23/scripts/` → `/scripts/` 이동 완료
  - `logiontology_scaffold_2026-01-23/configs/` → `/configs/` 이동 완료
- [x] `/supabase` 또는 `/migrations` 생성 ✅ 완료
  - `HVDC DASH/database/` → `/supabase/migrations/` 이동 완료
- [x] 루트 `package.json` 설정 (pnpm workspace) ✅ 완료
- [x] 루트 `tsconfig.json` 설정 ✅ 완료

**검증**:
- [x] 각 앱 독립 실행 가능 ✅ 완료
- [x] 공유 패키지 import 정상 작동 ✅ 완료
- [x] 스크립트 실행 경로 확인 ✅ 완료

---

### Phase 2: 레이아웃 통합 ✅ 완료

**목표**: MapView + RightPanel + HVDC Panel 통합 레이아웃 구현

**작업**:
- [x] 통합 레이아웃 컴포넌트 생성 ✅ 완료
  - `apps/logistics-dashboard/components/UnifiedLayout.tsx` 생성 완료
  - Grid 레이아웃 (MapView 60% + RightPanel 20% + HVDC Panel 20%) 구현 완료
- [x] MapView 통합 ✅ 완료
  - `apps/logistics-dashboard/components/map/MapView.tsx` 통합 완료
  - 의존성 확인 (deck.gl, maplibre-gl) 완료
- [x] RightPanel 통합 ✅ 완료
  - `apps/logistics-dashboard/components/dashboard/RightPanel.tsx` 통합 완료
  - 탭 UI (Status/Occupancy/Distribution) 구현 완료 (2026-02-06)
- [x] HVDC Panel 통합 ✅ 완료
  - KpiStrip + WorklistTable + DetailDrawer 통합 완료
  - KPI 스트립 헤더 고정 구현 완료 (2026-02-07)
  - 워크리스트 간소화 완료 (2026-02-07)
- [x] 모바일 인터랙션 구현 ✅ 완료
  - 하단 패널 드래그 구현 완료
  - 우측 패널 슬라이드 드로어 구현 완료
  - 터치 제스처 지원 완료
- [x] UI/UX 개선 ✅ 완료 (2026-02-05~07)
  - 히트맵 강도 범례 추가 (2026-02-05)
  - 줌 기반 레이어 가시성 구현 (2026-02-06)
  - 타이포그래피 개선 (2026-02-06)

**검증**:
- [x] 데스크톱 레이아웃 정상 작동 ✅ 완료
- [x] 모바일 인터랙션 정상 작동 ✅ 완료
- [x] 상태 동기화 정상 작동 ✅ 완료
- [x] WCAG 2.2 AA 준수 ✅ 완료

---

### Phase 3: 데이터 통합 및 Realtime 구현 ✅ 완료 (2026-01-24~2026-02-07)

**목표**: Supabase 스키마 통합 및 데이터 일관성 확보

**작업**:
- [x] Supabase 스키마 통합 ✅ Phase 2 완료 (2026-01-25)
  - `status.shipments_status`, `status.events_status` 테이블 생성
  - `case.*` 테이블 생성
  - `public.shipments` 뷰 생성
  - Site Arrival Date 필드 확인 완료
- [x] RLS 정책 정의 ✅ 완료
  - 모든 테이블에 RLS 활성화 (`supabase/migrations/20260101_initial_schema.sql`)
  - KPI 메트릭(`hvdc_kpis`)은 anon/read-only, 코어 테이블(`shipments` 등)은 인증/서버 전용으로 분리
  - 통합 테스트(`tests/integration/test_rls.py::test_rls_policies_enforced`)로 anon read / service-role write 행위 검증
- [x] CSV 데이터 적재 ✅ Phase 4 완료 (2026-01-25)
  - `status.shipments_status`: 871 rows 적재 완료
  - `status.events_status`: 928 rows 적재 완료
- [x] Gate 1 QA 검증 ✅ Phase 5 완료
  - 데이터 무결성 검증 완료
- [x] Realtime 활성화 ✅ Phase 6 완료 (2026-01-25)
  - 5개 테이블 Realtime publication 활성화
- [x] API 통합 ✅ 완료
  - `/api/worklist` 엔드포인트 구현 완료 (871 rows·KPI 확인)
  - `/api/locations` 엔드포인트 Supabase 전환 완료
  - `/api/location-status` 엔드포인트 Supabase 전환 완료
  - `/api/events` 엔드포인트 Supabase 전환 완료
  - [x] 실시간 피드 통합 (Supabase Realtime) ✅ 완료 (2026-01-24)
- [x] UI/UX 개선 ✅ 완료 (2026-02-05~07)
  - 히트맵 강도 범례 추가
  - 줌 기반 레이어 가시성 구현
  - RightPanel 탭 UI 개선
  - 타이포그래피 개선
  - KPI 스트립 헤더 고정
  - 워크리스트 간소화

**검증**:
- [x] 모든 테이블 접근 가능 ✅ 완료
- [x] RLS 정책 정상 작동 ✅ 완료
- [x] 실시간 업데이트 정상 작동 ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
- [x] 데이터 일관성 확인 ✅ Gate 1 QA 통과

---

### Phase 4: Flow Code 통합 (1-2주)

**목표**: Flow Code v3.5 로직 통합 및 검증

**작업**:
- [ ] Flow Code v3.5 로직 통합
  - `logiontology_scaffold/scripts/core/flow_code_calc.py` → 공유 로직
  - TypeScript/JavaScript 포팅 또는 Python API 호출
- [ ] AGI/DAS 자동 업그레이드
  - Flow 0/1/2 → Flow 3 자동 업그레이드
  - 원본 보존 (`hasFlowCodeOriginal`)
  - 이유 기록 (`hasFlowOverrideReason`)
- [ ] SHACL 검증 통합
  - SHACL 검증 엔드포인트 생성
  - 검증 결과 저장
- [ ] 대시보드에 Flow Code 표시
  - WorklistTable에 Flow Code 컬럼 추가
  - 지도에 Flow Code 시각화

**검증**:
- [ ] Flow Code 계산 정확성
- [ ] AGI/DAS 자동 업그레이드 정상 작동
- [ ] SHACL 검증 정상 작동

---

## 4. 현재 차단 사항 및 리스크

### 차단 사항
- 없음 (현재 모든 컴포넌트 독립 실행 가능)

### 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| 데이터 불일치 | High | Site Arrival Date 필드 일관성 확인, 마이그레이션 계획 수립 |
| 상태 관리 복잡도 | Medium | 통합 Store 설계 단계에서 충분한 검토 |
| 성능 저하 | Medium | 레이어 최적화, 가상화, Realtime 최적화 |
| 모바일 UX 회귀 | High | 모바일 테스트 강화, 사용자 피드백 수집 |

---

## 5. 다음 단계

### 즉시 실행 가능
1. ✅ 통합 상태 문서 생성 (이 문서)
2. [ ] Monorepo 마이그레이션 가이드 작성
3. [ ] 통합 테스트 계획 수립 (`plan.md` 업데이트)
4. [ ] 스킬 업데이트 (통합 구조 반영)

### Phase 1 시작 전 준비
- [ ] Monorepo 도구 선택 (Turborepo vs pnpm workspace)
- [ ] 마이그레이션 계획 수립
- [ ] 백업 및 롤백 계획

---

## 6. 참조 문서

- [AGENTS.md](../../AGENTS.md) - 프로젝트 규칙
- [STATUS.md](../../STATUS.md) - 통합 상태 SSOT
- [roadmap_system_doc.md](./roadmap_system_doc.md) - 통합 단계별 로드맵
- [architecture/architecture.md](../architecture/architecture.md) - 시스템 아키텍처
- [data-loading/DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 데이터 적재 계획

---

**문서 버전**: 1.2  
**최종 업데이트**: 2026-02-07 — Phase 2~6 완료, UI/UX 개선 완료 반영
