# HVDC Logistics Dashboard — 전면 재설계 스펙

**Date**: 2026-03-12
**Project**: LOGI-MASTER-DASH
**Scope**: 멀티 페이지 물류 흐름 대시보드 전면 재설계
**Status**: Design Approved

---

## 1. 목적

삼성 C&T UAE HVDC 프로젝트의 전체 물류 흐름(원산지 → 항구 → 창고 → MOSB → 4개 현장)을 단일 대시보드에서 추적한다.

### 핵심 요구사항

- 4개 현장(SHU·MIR·DAS·AGI), 주요 항구/부두, 창고 네트워크를 지리적으로 표현
- 8,680건 케이스의 Flow Code(0~5) 기반 물류 단계 시각화
- 874건 선적(BL) 통관·재무 추적
- 791건 DSV 창고 현재 재고 현황
- **데이터 소스**: 모든 데이터는 Supabase (SSOT) — 직접 Excel 읽기 없음

---

## 2. 데이터 소스 (Supabase)

### 2.1 기존 테이블/뷰

| 테이블/뷰 | 행 수 | 내용 |
|-----------|-------|------|
| `public.shipments` | 874 | HVDC STATUS.xlsx — BL 수준 선적 추적 |
| `case.cases` | 8,680 | HVDC WAREHOUSE STATUS WH STATUS — 케이스 추적 |
| `case.flows` | — | Flow Code 데이터 |
| `status.shipments_status` | — | 실시간 점유율/상태 갱신 (location 기준) |

### 2.2 신규 필요 테이블

| 테이블 | 행 수 | 내용 |
|--------|-------|------|
| `wh.stock_onhand` | 791 | STOCK ONHAND — DSV 창고 현재 재고 |

### 2.3 주요 컬럼 정의

#### `case.cases` (8,680행)

| 컬럼명 | 타입 | 설명 | 원본 Excel 컬럼 |
|--------|------|------|-----------------|
| `id` | uuid | PK | — |
| `case_no` | text | 케이스 번호 | Case No. |
| `site` | text | 목적지 현장 (SHU/MIR/DAS/AGI) | Site |
| `flow_code` | integer | Flow Code 0~5 | FLOW_CODE |
| `flow_description` | text | Flow 설명 | FLOW_DESCRIPTION |
| `status_current` | text | 현재 위치 단계 (`'site'` / `'warehouse'` / `'Pre Arrival'`) | Status_Current |
| `status_location` | text | 구체적 위치 | Status_Location |
| `final_location` | text | 최종 목적지 | Final_Location |
| `sqm` | numeric | 면적(㎡) | SQM |
| `source_vendor` | text | 공급사 (Hitachi/Siemens/기타) | Source_Vendor |
| `storage_type` | text | 보관 유형 | Storage type |
| `stack_status` | text | 스택 상태 | Stack_Status |
| `category` | text | 자재 분류 (Elec/Mech/Inst.) | Category |
| `sct_ship_no` | text | 선적 참조번호 (→ `public.shipments` 조인 키) | SCT SHIP NO |
| `site_arrival_date` | date | 현장 도착일 (월별 추이 차트용) | Site arrival date 관련 컬럼 |
| `created_at` | timestamptz | 생성일 | — |

> `site_arrival_date`가 원본 Excel에 존재하지 않을 경우 ETL 팀이 `ATA` 또는 `Site Arrival` 컬럼에서 파생하여 저장 (이번 스펙 외). `SiteDetail` 월별 추이 차트는 이 컬럼을 기준으로 그룹화한다.

#### `wh.stock_onhand` (791행, 신규)

| 컬럼명 | 타입 | 설명 | 원본 Excel 컬럼 |
|--------|------|------|-----------------|
| `id` | uuid | PK | — |
| `no` | integer | 순번 | NO |
| `sku` | text | SKU 코드 | SKU |
| `description` | text | 품목 설명 | DESCRIPTION |
| `location` | text | DSV 창고 위치 (M44-BULK07 등) | LOCATION |
| `pallet_id` | text | 팔레트 ID | PALLET ID |
| `qty` | integer | 수량 | QTY |
| `shipping_ref` | text | 선적 참조번호 | SHIPPING REF |
| `date_received` | date | 입고일 | DATE RECEIVE |

#### `status.shipments_status` (Realtime)

이 테이블은 `public.locations`의 location 단위로 점유율/상태를 실시간 갱신한다.
`useOpsStore.locationStatusesById` (keyed by `location_id`)를 통해 소비된다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `location_id` | text | FK → public.locations.location_id |
| `status_code` | text | OK/WARNING/CRITICAL |
| `occupancy_rate` | numeric | 창고 점유율 (0.0~1.0) |
| `last_updated` | timestamptz | 마지막 갱신 시각 |

> `KpiProvider.tsx`는 `useKpiRealtime({ enabled: true })` 훅을 호출하여 Supabase Realtime 채널을 구독하고, 수신된 이벤트를 `useOpsStore`에 반영한다. `useKpiRealtime` 훅 자체(`hooks/useKpiRealtime.ts`)는 그대로 유지하며 삭제하지 않는다.

### 2.4 API Routes (Next.js)

| 경로 | 메서드 | Query Parameters | 설명 |
|------|--------|-----------------|------|
| `/api/cases` | GET | `site`, `flow_code`, `status_current` (반복 가능, 예: `?status_current=warehouse&status_current=Pre+Arrival`), `vendor`, `category`, `location`, `page`, `pageSize` | WH STATUS 케이스 목록 (location 필터는 Cargo 탭에서만 사용) |
| `/api/cases/summary` | GET | — | KPI 집계 |
| `/api/shipments` | GET | `vendor`, `pod`, `customs_status`, `ship_mode`, `sct_ship_no`, `page`, `pageSize` | HVDC STATUS BL 목록 |
| `/api/stock` | GET | `location`, `sku`, `page`, `pageSize` | DSV STOCK ONHAND 목록 |
| `/api/locations` | GET | — | 기존 유지 |
| `/api/location-status` | GET | — | 기존 유지 |
| `/api/events` | GET | — | 기존 유지 |

### 2.5 API 응답 TypeScript 인터페이스

```ts
// GET /api/cases
interface CaseRow {
  id: string
  case_no: string
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  flow_code: 0 | 1 | 2 | 3 | 4 | 5
  flow_description: string
  status_current: 'site' | 'warehouse' | 'Pre Arrival'
  status_location: string
  final_location: string
  sqm: number
  source_vendor: 'Hitachi' | 'Siemens' | string
  storage_type: string
  stack_status: string
  category: string
  site_arrival_date: string | null  // ISO date
}
interface CasesResponse {
  data: CaseRow[]
  total: number
  page: number
  pageSize: number
}

// GET /api/cases/summary
interface CasesSummary {
  total: number                         // 8,680
  byStatus: {
    site: number                        // 6,622
    warehouse: number                   // 1,999
    'Pre Arrival': number               // 59
  }
  bySite: {                             // site 미확정 6건은 'Unassigned' 버킷
    SHU: number                         // 2,414
    MIR: number                         // 2,149
    DAS: number                         // 2,187
    AGI: number                         // 1,924
    Unassigned: number                  // 6
  }
  bySiteArrived: {
    SHU: number                         // 2,410
    MIR: number                         // 1,895
    DAS: number                         // 2,074
    AGI: number                         // 243
  }
  byFlowCode: Record<string, number>    // { "0": 59, "1": ..., "5": ... } — 키는 string
  byVendor: Record<string, number>      // { Hitachi: 7031, Siemens: 1576, Other: 73 }
  bySqmByLocation: Record<string, number>  // { "DSV Outdoor": 846, "DSV Indoor": 412, "MOSB": 304, ... }
  totalSqm: number                      // 41,757
}

// GET /api/shipments
interface ShipmentRow {
  id: string
  sct_ship_no: string
  vendor: string
  pol: string             // Port of Loading
  pod: string             // Port of Discharge
  etd: string | null      // ISO date
  atd: string | null      // ISO date
  eta: string | null      // ISO date
  ata: string | null      // ISO date
  cif_value: number | null
  customs_status: 'cleared' | 'in_progress' | 'pending'
  ship_mode: 'Container' | 'Air' | 'Bulk' | 'LCL' | string
  container_no: string | null
}
interface ShipmentsResponse {
  data: ShipmentRow[]
  total: number
  page: number
  pageSize: number
}

// GET /api/stock
interface StockRow {
  id: string
  no: number
  sku: string
  description: string
  location: string
  pallet_id: string
  qty: number
  shipping_ref: string
  date_received: string  // ISO date
}
interface StockResponse {
  data: StockRow[]
  total: number
  page: number
  pageSize: number
}

// Filter types
interface CasesFilter {
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI' | 'all'
  flow_code: 0 | 1 | 2 | 3 | 4 | 5 | 'all'
  // 단일값 또는 배열 — 배열은 OR 조건으로 해석 (예: ['warehouse', 'Pre Arrival'])
  status_current: CaseRow['status_current'] | CaseRow['status_current'][] | 'all'
  vendor: 'Hitachi' | 'Siemens' | 'Other' | 'all'
  category: 'Elec' | 'Mech' | 'Inst.' | 'all'
  location: string | 'all'   // Cargo 탭에서만 사용; PipelineFilterBar에는 미노출
  // 날짜 필터 없음: case.cases는 ETD 컬럼 없음. 날짜 필터는 이번 스펙 외.
}

interface StockFilter {
  location: string | 'all'
  sku: string | 'all'
}
```

---

## 3. 레이아웃 아키텍처

### 3.1 기존 구조 → 신규 구조 마이그레이션

#### 현재 구조 (변경 전)

```
app/page.tsx
components/UnifiedLayout.tsx
  ├── components/map/MapView.tsx
  ├── components/hvdc/DetailDrawer.tsx
  ├── components/dashboard/RightPanel.tsx
  ├── components/hvdc/StageCardsStrip.tsx
  ├── components/hvdc/KpiStrip.tsx          # useKpiRealtime 호출
  └── components/hvdc/WorklistTable.tsx
components/dashboard/HeaderBar.tsx
components/hvdc/ConnectionStatusBadge.tsx
components/search/GlobalSearch.tsx
```

#### 마이그레이션 규칙

| 기존 컴포넌트 | 처리 방법 |
|---------------|-----------|
| `app/page.tsx` | `redirect('/overview')`로 교체 |
| `components/UnifiedLayout.tsx` | 삭제 — `(dashboard)/layout.tsx`로 대체 |
| `components/map/MapView.tsx` | `components/overview/OverviewMap.tsx`로 이동 + 확장; 원본 삭제 |
| `components/dashboard/RightPanel.tsx` | `components/overview/OverviewRightPanel.tsx`로 교체 (내용 변경); 원본 삭제 |
| `components/hvdc/StageCardsStrip.tsx` | `components/pipeline/FlowPipeline.tsx`로 흡수 후 삭제 |
| `components/hvdc/KpiStrip.tsx` | `hooks/useKpiRealtime.ts` 유지; UI만 삭제. `KpiProvider.tsx`가 `useKpiRealtime` 호출 담당 |
| `components/hvdc/WorklistTable.tsx` | `components/cargo/WhStatusTable.tsx`로 마이그레이션 후 삭제 |
| `components/hvdc/DetailDrawer.tsx` | `components/cargo/CargoDrawer.tsx`로 대체 후 삭제 |
| `components/hvdc/ConnectionStatusBadge.tsx` | `components/layout/DashboardHeader.tsx` 내부로 통합 후 삭제 |
| `components/dashboard/HeaderBar.tsx` | `components/layout/DashboardHeader.tsx`로 대체 후 삭제 |
| `components/search/GlobalSearch.tsx` | `components/layout/DashboardHeader.tsx` 내부로 통합 후 삭제 |
| `hooks/useKpiRealtime.ts` | 유지 (삭제하지 않음) |

### 3.2 전체 파일 구조

```
apps/logistics-dashboard/
├── app/
│   ├── layout.tsx                    # 기존 루트 레이아웃 (유지)
│   ├── page.tsx                      # redirect('/overview')로 교체
│   └── (dashboard)/
│       ├── layout.tsx                # NEW: Sidebar + DashboardHeader 래퍼 + KpiProvider
│       ├── overview/
│       │   └── page.tsx              # 🗺️ Page 1: 지도 개요
│       ├── pipeline/
│       │   └── page.tsx              # 🔄 Page 2: 물류 파이프라인
│       ├── sites/
│       │   └── page.tsx              # 🏗️ Page 3: 현장 현황
│       └── cargo/
│           └── page.tsx              # 📋 Page 4: 화물 목록
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # NEW: 접이식 사이드바
│   │   ├── DashboardHeader.tsx       # NEW: 글로벌 헤더 (GlobalSearch + ConnectionStatusBadge 통합)
│   │   └── KpiProvider.tsx           # NEW: useKpiRealtime 구독 (UI 없음, layout에 배치)
│   ├── overview/
│   │   ├── OverviewMap.tsx           # 지도 (기존 MapView 확장)
│   │   ├── OverviewRightPanel.tsx    # Flow Code 분포 + 현장 달성률
│   │   └── KpiStripCards.tsx         # 상단 4개 KPI 카드
│   ├── pipeline/
│   │   ├── FlowPipeline.tsx          # 파이프라인 스테이지 바
│   │   ├── PipelineFilterBar.tsx     # 상단 필터 (site/vendor/category/date — location 미노출)
│   │   ├── FlowCodeDonut.tsx         # Flow Code 도넛 차트
│   │   ├── VendorBar.tsx             # 벤더별 바 차트
│   │   ├── TransportModeBar.tsx      # 운송모드 바 차트 (BL 기준)
│   │   ├── CustomsStatusCard.tsx     # 통관 현황 카드 (BL 기준)
│   │   └── WarehouseSqmBar.tsx       # 창고 SQM 바 차트
│   ├── sites/
│   │   ├── SiteCards.tsx             # 4개 현장 요약 카드
│   │   ├── SiteDetail.tsx            # 선택 현장 상세 (탭)
│   │   └── AgiAlertBanner.tsx        # AGI 경보 배너
│   └── cargo/
│       ├── CargoTabs.tsx             # WH STATUS / SHIPMENTS / DSV STOCK 탭
│       ├── WhStatusTable.tsx         # WH STATUS 테이블
│       ├── ShipmentsTable.tsx        # SHIPMENTS 테이블
│       ├── DsvStockTable.tsx         # DSV STOCK 테이블
│       └── CargoDrawer.tsx           # WH STATUS 행 클릭 상세 드로어
```

### 3.3 사이드바 네비게이션

```tsx
// 접이식 사이드바 (expanded: 220px / collapsed: 56px)
const NAV_ITEMS = [
  { icon: Map,        label: "Overview",  href: "/overview"  },
  { icon: ArrowRight, label: "Pipeline",  href: "/pipeline"  },
  { icon: Building2,  label: "Sites",     href: "/sites"     },
  { icon: Package,    label: "Cargo",     href: "/cargo"     },
]
```

### 3.4 Zustand Store 확장 계획

#### 기존 Store (유지)

- **`useOpsStore`** (`@repo/shared`): `locationsById`, `locationStatusesById`, `isLoading` — 현행 유지
- **`useLogisticsStore`** (로컬 `store/logisticsStore.ts`): 지도 UI 상태 — 현행 유지
- **`hooks/useKpiRealtime.ts`**: 삭제하지 않음. `KpiProvider.tsx`가 이 훅을 호출하여 `useOpsStore` 업데이트

#### 신규 Store (추가)

```ts
// useCasesStore — case.cases 기반 데이터
interface CasesStoreState {
  cases: CaseRow[]
  summary: CasesSummary | null
  filters: CasesFilter
  // Pipeline 스테이지 클릭 상태 ('pre-arrival' = status_current 'Pre Arrival', 'warehouse' = 'warehouse', 'site' = 'site')
  activePipelineStage: 'pre-arrival' | 'warehouse' | 'site' | null
  // Cargo 드로어 상태
  selectedCaseId: string | null
  isDrawerOpen: boolean
  isLoading: boolean
  fetchCases: () => Promise<void>
  fetchSummary: () => Promise<void>
  setFilter: <K extends keyof CasesFilter>(key: K, value: CasesFilter[K]) => void
  resetFilters: () => void
  setActivePipelineStage: (stage: CasesStoreState['activePipelineStage']) => void
  openDrawer: (caseId: string) => void
  closeDrawer: () => void
}

// activePipelineStage ↔ status_current 매핑
const STAGE_TO_STATUS: Record<NonNullable<CasesStoreState['activePipelineStage']>, CaseRow['status_current']> = {
  'pre-arrival': 'Pre Arrival',
  'warehouse': 'warehouse',
  'site': 'site',
}

// useStockStore — wh.stock_onhand 기반 데이터
interface StockStoreState {
  stock: StockRow[]
  total: number
  filters: StockFilter
  isLoading: boolean
  fetchStock: (params?: Partial<StockFilter & { page?: number }>) => Promise<void>
  setFilter: <K extends keyof StockFilter>(key: K, value: StockFilter[K]) => void
  resetFilters: () => void
}
```

---

## 4. 페이지별 상세 스펙

### 4.1 Page 1 — 🗺️ Overview (지도 개요)

**목적**: UAE 전체 물류 노드를 지리적으로 표현 + 글로벌 KPI

#### KPI 스트립 (상단 4개 카드, KpiStripCards)

| 카드 | 값 | 데이터 소스 |
|------|-----|------------|
| 총 케이스 | 8,680 | `CasesSummary.total` |
| 현장 도착 | 6,622 (76.3%) | `CasesSummary.byStatus.site` |
| 창고 재고 | 1,999 (23.0%) | `CasesSummary.byStatus.warehouse` |
| SQM 합계 | 41,757 ㎡ | `CasesSummary.totalSqm` |

> **수치 검증**: 6,622 + 1,999 + 59 = 8,680 ✓

#### 지도 노드 (MapLibre GL + deck.gl)

| 타입 | 색상 | 노드 |
|------|------|------|
| 🔵 항구/공항 | Blue | Khalifa Port, Mina Zayed, Jebel Ali, AUH Airport |
| 🟡 창고 | Yellow | DSV Indoor, DSV Outdoor, DSV Al Markaz, JDN MZD, AAA Storage, Hauler DG |
| 🟠 MOSB | Orange | MOSB Yard (ADNOC L&S) |
| 🟢 현장 | Green | SHU (Mirfa), MIR (Mirfa), DAS (Das Island), AGI (Al Ghallan) |

#### 흐름선 (deck.gl ArcLayer)
- Flow Code별 색상: 0=회색, 1=파랑, 2=초록, 3=주황, 4=빨강, 5=보라
- 두께: 케이스 수 비례 (케이스 수가 많을수록 굵음)

#### 우측 패널 (OverviewRightPanel)
- Flow Code 분포: 수평 바 차트 (`CasesSummary.byFlowCode`; 키는 string `"0"`~`"5"`로 접근)
- 현장별 달성률: 가로 프로그레스 바 (`bySiteArrived[site] / bySite[site]` — Unassigned 버킷 제외)

---

### 4.2 Page 2 — 🔄 물류 파이프라인

**목적**: 화물이 각 단계에 몇 건이 있는지 한눈에 파악

#### 파이프라인 단계 수치 정의

파이프라인은 `case.cases.status_current` 기준 **케이스 8,680건**의 현재 위치를 나타낸다. 3개 단계는 상호 배타적이다.

| 스테이지 | UI 레이블 | `status_current` 값 | 건수 | 비율 |
|----------|-----------|---------------------|------|------|
| `'pre-arrival'` | Pre-Arrival | `'Pre Arrival'` | 59 | 0.7% |
| `'warehouse'` | 창고/MOSB | `'warehouse'` | 1,999 | 23.0% |
| `'site'` | 현장 도착 | `'site'` | 6,622 | 76.3% |
| — | **합계** | — | **8,680** | **100%** |

> 59 + 1,999 + 6,622 = 8,680 ✓
>
> MOSB 304건은 `status_current = 'warehouse'`인 1,999건의 하위 집합 (Flow Code 3 or 4).
> 파이프라인 바에서 "창고/MOSB" 스테이지 내 MOSB 비율을 세분화하여 표시.
>
> `Port/통관 870`은 BL 기준 (SHIPMENTS 테이블)이며 파이프라인 합산에 포함하지 않음.
>
> 벤더: Hitachi 7,031 / Siemens 1,576 / Other 73 = 8,680 ✓

UI 표현:

```
[Pre-Arrival] ──→ [창고/MOSB] ──→ [현장 도착]
     59              1,999            6,622
    0.7%             23.0%            76.3%
                 └── (MOSB: 304)
```

#### 상단 필터바 (PipelineFilterBar)

노출 필터 (3개):
- 사이트 (SHU/DAS/MIR/AGI/전체)
- 벤더 (Hitachi/Siemens/Other/전체)
- 카테고리 (Elec/Mech/Inst./전체)

`CasesFilter.location` 및 날짜 범위 필터는 PipelineFilterBar에 미노출.
(`case.cases`에 ETD 컬럼 없음; 날짜 필터는 이번 스펙 외)

모든 필터 변경은 `useCasesStore.setFilter`로 처리하며, `/api/cases` 호출 시 query parameter로 전달된다.

#### 파이프라인 스테이지 바 (FlowPipeline)

- 스테이지 클릭 → `useCasesStore.setActivePipelineStage(stage)` 호출
- `activePipelineStage`는 `STAGE_TO_STATUS` 매핑을 통해 `status_current` 필터로 변환되어 하단 차트에 연동
- 이미 선택된 스테이지 클릭 → `setActivePipelineStage(null)` (선택 해제)

#### 하단 5개 정보 패널

| 패널 | 컴포넌트 | 데이터 소스 | 내용 |
|------|----------|------------|------|
| Flow Code 도넛 | `FlowCodeDonut` | `CasesSummary.byFlowCode` (string 키) | Flow 0~5 분포, 클릭 시 `flow_code` 필터 적용 |
| 벤더별 바 | `VendorBar` | `CasesSummary.byVendor` | Hitachi 7,031 / Siemens 1,576 / Other 73 |
| 운송모드 바 | `TransportModeBar` | `public.shipments.ship_mode` via `/api/shipments` (BL 기준, 874건) | Container 616 / Air 202 / Bulk 46 / LCL 10 — 레이블에 "BL 기준" 명시 |
| 통관 현황 | `CustomsStatusCard` | `public.shipments.customs_status` (BL 기준) | 완료(`cleared`) 870 / 진행중(`in_progress`) 4; `pending` 0 — 레이블에 "BL 기준" 명시 |
| 창고 SQM | `WarehouseSqmBar` | `CasesSummary.bySqmByLocation` | DSV Outdoor 846㎡ / DSV Indoor 412㎡ / MOSB 304㎡ / 기타 |

---

### 4.3 Page 3 — 🏗️ 현장 현황

**목적**: 4개 현장 납품 달성률 + 미납 화물 추적

#### 상단 4개 현장 요약 카드 (SiteCards)

| 현장 | 유형 | 총 할당 | 도착 | 달성률 |
|------|------|---------|------|--------|
| SHU | 육상 | 2,414 | 2,410 | 99.8% ✅ |
| MIR | 육상 | 2,149 | 1,895 | 88.2% |
| DAS | 해상 섬 | 2,187 | 2,074 | 94.8% |
| AGI | 해상 섬 | 1,924 | 243 | 12.6% ⚠️ |

> 총 할당: 2,414 + 2,149 + 2,187 + 1,924 = 8,674; Unassigned 6건 별도 (`bySite.Unassigned`)
>
> 전체 도착: 2,410 + 1,895 + 2,074 + 243 = 6,622 ✓

SiteCards는 `CasesSummary.bySite`와 `CasesSummary.bySiteArrived`를 소비한다.
`bySite.Unassigned` 버킷은 SiteCards UI에 표시하지 않는다.

#### AGI 경보 배너 (AgiAlertBanner)

- **표시 조건**: `(bySiteArrived.AGI / bySite.AGI) < 0.5` — 매 페이지 로드 시 재계산
- **내용**: 미납 건수 (bySite.AGI − bySiteArrived.AGI), MOSB 대기, 창고 대기, Pre-Arrival 건수
- **위치**: Page 3 상단 (SiteCards 위)
- **해제(dismiss) 동작**:
  - 닫기(×) → `sessionStorage.setItem('agi_alert_dismissed', 'true')`
  - 같은 탭 세션 내 재표시 없음 (탭 닫으면 초기화)
  - 달성률 ≥ 50% 도달 시 자동 숨김 (dismiss 여부 무관)

#### 현장 상세 (SiteDetail — 탭 전환)

| 탭 | 내용 | 데이터 소스 |
|----|------|------------|
| 요약 | 달성률 게이지 | `bySite`, `bySiteArrived` |
| Flow 분포 | Flow Code 분포 바 차트 | `/api/cases?site={선택현장}` |
| 월별 추이 | 월별 입고 추이 (BarChart, recharts) | `/api/cases?site=...` — `site_arrival_date` 기준 그룹화 |
| 대기 화물 | 미납 케이스 테이블 (`status_current ≠ 'site'`) | `/api/cases?site=...&status_current=warehouse&status_current=Pre+Arrival` (다중값 OR 조건) |
| 벤더 분포 | 벤더별 분포 | `/api/cases?site=...` |

---

### 4.4 Page 4 — 📋 화물 목록

**목적**: 3개 데이터셋 통합 검색/조회/드릴다운

#### 탭 구성 (CargoTabs)

**[WH STATUS] — 8,680건** (`WhStatusTable`)
- 데이터: `useCasesStore.cases` (모든 `CasesFilter` 필드 지원, `location` 포함)
- 컬럼: No / Case No / Site / 현재위치 / Flow Code (배지) / SQM / Status / 벤더
- Flow Code 배지 색상: 0=회색, 1=파랑, 2=초록, 3=주황, 4=빨강, 5=보라
- Status 아이콘: ○ Pre-Arrival / △ 이동중 / ● 완료
- **행 클릭**: `useCasesStore.openDrawer(case.id)` 호출 → `CargoDrawer` 표시

**[SHIPMENTS] — 874건** (`ShipmentsTable`)
- 데이터: `/api/shipments` 직접 fetch
- 필터 상태: `ShipmentsTable` 내부 `useState` 로 관리 (별도 Zustand store 없음)
  ```ts
  // ShipmentsTable 내부 로컬 상태
  const [filter, setFilter] = useState<{
    vendor: string; pod: string; customs_status: string; ship_mode: string; page: number
  }>({ vendor: 'all', pod: 'all', customs_status: 'all', ship_mode: 'all', page: 1 })
  ```
- 컬럼: SCT SHIP NO / 벤더 / POL→POD / ETD/ATD / ETA/ATA / CIF VALUE / 통관상태 / 컨테이너
- 행 클릭 없음 (이번 스펙 외)

**[DSV STOCK] — 791건** (`DsvStockTable`)
- 데이터: `useStockStore.stock` (필터: location, sku)
- 컬럼: NO / SKU / Description / Location (M44-xxx) / Pallet ID / Shipping Ref / Date Received
- 행 클릭 없음 (이번 스펙 외)

#### 공통 기능
- 전체 텍스트 검색 (각 탭별 독립 검색)
- 다중 필터 (Active Filter 칩 표시)
- CSV 내보내기
- 50건씩 페이지네이션

#### 상세 드로어 (CargoDrawer — WH STATUS 행 클릭 시만 표시)

드로어 열림: `useCasesStore.isDrawerOpen === true` 시 표시; 닫기: `closeDrawer()` 호출.

데이터:
1. **케이스 기본정보**: `cases.find(c => c.id === selectedCaseId)` — 이미 로드된 `CaseRow`
2. **선적 타임라인**: `CaseRow.sct_ship_no`를 조인 키로 `/api/shipments?sct_ship_no={value}` 호출 → `ShipmentRow`의 ETD/ATD/ETA/ATA 사용.
   드로어 열릴 때 `sct_ship_no`가 있으면 `/api/shipments` 호출, 없으면 타임라인 섹션 미표시.

표시 내용:
- 케이스 기본정보: Site, Vendor, Flow Code, Storage Type, SQM (`CaseRow`에서)
- 물류 타임라인: ETD → ATD → ETA → ATA → 현장도착 (`ShipmentRow`에서; 각 날짜 null이면 해당 단계 회색 처리)
- 치수/중량 정보: `case.cases`에 해당 컬럼 없으면 이 섹션 미표시 (ETL 팀 결정 사항)

---

## 5. 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 16.1.1 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| 지도 | MapLibre GL 5 + deck.gl 9 (기존 유지) |
| 차트 | Recharts (기존 유지) |
| 상태관리 | Zustand (기존 `useOpsStore`/`useLogisticsStore` 유지 + 신규 `useCasesStore`/`useStockStore` 추가) |
| 데이터 | Supabase (PostgreSQL + Realtime) |
| 패키지 | pnpm workspace (Monorepo) |

---

## 6. 데이터 흐름

```
Supabase
  ├── case.cases         → /api/cases          → useCasesStore → WhStatusTable, CargoDrawer
  │                      → /api/cases/summary  → useCasesStore → KpiStripCards, OverviewRightPanel,
  │                                                               SiteCards, VendorBar, WarehouseSqmBar
  ├── public.shipments   → /api/shipments       → ShipmentsTable, TransportModeBar, CustomsStatusCard
  ├── wh.stock_onhand    → /api/stock           → useStockStore → DsvStockTable
  ├── public.locations   → /api/locations       → useOpsStore → OverviewMap 노드
  └── status.*           → Realtime 구독        → useKpiRealtime → useOpsStore 업데이트
                                                   (KpiProvider.tsx에서 구독 초기화)
```

---

## 7. 구현 순서 (우선순위)

1. **기존 구조 해체** — 마이그레이션 테이블 기준: `UnifiedLayout.tsx` 삭제, `app/page.tsx` redirect, 컴포넌트 이동/삭제
2. **사이드바 레이아웃** — `(dashboard)/layout.tsx` + `Sidebar.tsx` + `DashboardHeader.tsx` + `KpiProvider.tsx`
3. **API Routes 신규** — `/api/cases`, `/api/cases/summary` (bySqmByLocation 포함), `/api/stock`
4. **Zustand 신규 슬라이스** — `useCasesStore` (drawer 상태 포함), `useStockStore`
5. **Page 1 Overview** — `OverviewMap` + `KpiStripCards` + `OverviewRightPanel`
6. **Page 2 Pipeline** — `FlowPipeline` + `PipelineFilterBar` + 5개 하단 패널
7. **Page 3 Sites** — `SiteCards` + `SiteDetail` + `AgiAlertBanner`
8. **Page 4 Cargo** — `CargoTabs` + 3개 테이블 + `CargoDrawer`

---

## 8. 제외 범위 (이번 스펙 외)

- Excel 직접 파싱 (Supabase ETL은 별도 스크립트)
- `case.cases` 치수/중량 컬럼 및 `site_arrival_date` 추가 (ETL 팀 결정)
- SHIPMENTS / DSV STOCK 행 클릭 드로어 (향후 확장)
- 사용자 인증/권한 변경
- 모바일 반응형 (데스크톱 우선)
- i18n (영어/한국어 혼용 현행 유지)
- Supabase DDL 마이그레이션 스크립트 (ETL 팀 담당)
