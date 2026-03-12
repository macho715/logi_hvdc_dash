# System Architecture

**Last Updated**: 2026-02-07  
**Reference**: [AGENTS.md](../AGENTS.md), [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md), [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md), [DASH_PLAN.md](../deployment/DASH_PLAN.md)

---

## Executive Summary

통합 대시보드는 **HVDC Dashboard**와 **Logistics Dashboard**를 단일 웹 애플리케이션으로 통합한 **Control Tower** 시스템입니다. Supabase를 SSOT로 사용하며, 실시간 KPI 대시보드와 지도 기반 물류 시각화를 제공합니다.

**핵심 아키텍처**: MapView (left) + RightPanel (right) + HVDC Panel (bottom)

**주요 성과** (2026-02-07):
- ✅ Realtime KPI Dashboard 구현 완료 (Supabase Realtime 기반)
- ✅ ETL 파이프라인 준비 완료 (Status/Case 레이어)
- ✅ Flow Code v3.5 통합 완료
- ✅ 통합 레이아웃 프로토타입 완료
- ✅ **맵 레이어 API 라우트 Supabase 전환 완료** (Mock → 실제 데이터 조회)
- ✅ **dash 패치 적용 완료** (POI 레이어, StageCardsStrip, GlobalSearch)
- ✅ **UI/UX 개선 완료** (2026-02-05~07): 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화

---

## 1. 시스템 개요

### 1.1 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Data Sources"
        JSON[HVDC JSON Files]
        Excel[Excel Exports]
        ERP[ERP System]
    end

    subgraph "ETL Pipeline"
        ETL4[status_etl.py<br/>Status SSOT Layer]
        ETL3[optionc_etl.py<br/>Option-C Case Layer]
        CSV[CSV Generation]
    end

    subgraph "Supabase (SSOT)"
        StatusSchema[status Schema<br/>shipments_status<br/>events_status]
        CaseSchema[case Schema<br/>locations<br/>shipments_case<br/>cases<br/>flows<br/>events_case]
        RLS[RLS Policies]
        Realtime[Realtime Channels]
    end

    subgraph "RDF Pipeline"
        TTL[JSON to TTL]
        Ontology[Ontology Store]
    end

    subgraph "Frontend Application"
        NextJS[Next.js 16 App]
        API[API Routes<br/>/api/worklist<br/>/api/locations<br/>/api/location-status<br/>/api/events]
        Store[Zustand Store]
        UI[UnifiedLayout<br/>MapView + RightPanel + HVDC Panel<br/>POI + StageCardsStrip + GlobalSearch]
    end

    JSON --> ETL4
    JSON --> ETL3
    Excel --> ETL4
    ERP -.-> Excel

    ETL4 --> CSV
    ETL3 --> CSV
    CSV --> StatusSchema
    CSV --> CaseSchema

    JSON --> TTL
    TTL --> Ontology

    StatusSchema --> Realtime
    CaseSchema --> Realtime
    RLS --> StatusSchema
    RLS --> CaseSchema

    Realtime --> NextJS
    StatusSchema --> API
    CaseSchema --> API
    API --> Store
    Store --> UI
```

### 1.2 아키텍처 원칙

1. **Supabase as SSOT**: 모든 운영 데이터의 단일 저장소
2. **RDF 파이프라인 유지**: HVDC JSON → RDF(Turtle) 변환 보존
3. **정규화된 테이블**: 프론트엔드 친화적 접근을 위한 Supabase 테이블
4. **통합 UX**: 데스크톱 + 모바일(PWA) 최적화
5. **접근성**: WCAG 2.2 AA 준수
6. **Realtime First**: Supabase Realtime 기반 실시간 업데이트 (폴백 폴링)

### 1.3 기술 스택

**Frontend**:
- Next.js 16.1.1 (App Router)
- React 19.2.3, TypeScript 5.9.3
- Zustand 5.0.9 (상태 관리)
- Tailwind CSS 4

**Maps**:
- maplibre-gl 5.15.0
- deck.gl 9.2.5

**Backend**:
- Supabase (PostgreSQL 15 + RLS + Auth + Realtime + Edge Functions)

**ETL**:
- Python 3.13
- pandas, numpy

**Testing**:
- jest + testing-library

**Deployment**:
- Vercel

---

## 2. 데이터 플로우 아키텍처

### 2.1 전체 데이터 플로우

```mermaid
flowchart LR
    subgraph "Source Data"
        A[HVDC all status.json]
        B[hvdc_warehouse_status.json]
        C[HVDC_STATUS.json]
    end

    subgraph "ETL Processing"
        D[status_etl.py<br/>Status SSOT ETL]
        E[optionc_etl.py<br/>Case Layer ETL]
        F[Flow Code v3.5<br/>Calculation]
    end

    subgraph "Output Generation"
        G[CSV Files<br/>shipments_status<br/>events_status]
        H[CSV Files<br/>locations<br/>shipments_case<br/>cases<br/>flows<br/>events_case]
        I[TTL Files<br/>RDF Ontology]
    end

    subgraph "Supabase Storage"
        J[(Status Schema)]
        K[(Case Schema)]
    end

    subgraph "Frontend Consumption"
        L[Realtime Subscriptions]
        M[API Routes]
        N[Dashboard UI]
    end

    A --> D
    B --> D
    A --> E
    B --> E
    C --> E

    D --> F
    E --> F
    F --> G
    F --> H
    D --> I

    G --> J
    H --> K

    J --> L
    K --> L
    J --> M
    K --> M

    L --> N
    M --> N
```

### 2.2 ETL 파이프라인 상세

```mermaid
graph TD
    subgraph "Phase 1: Preparation"
        P1[Input File Validation]
        P2[ETL Script Check]
        P3[Supabase Environment]
    end

    subgraph "Phase 2: DDL Application"
        DDL[Schema Migration<br/>status + case schemas]
        RLS_POL[RLS Policies]
        IDX[Indexes Creation]
    end

    subgraph "Phase 3: ETL Execution"
        ETL4_RUN[status_etl.py Execution<br/>Status SSOT Layer]
        ETL3_RUN[optionc_etl.py Execution<br/>Case Layer]
        CSV_GEN[CSV Generation]
        QA_REPORT[QA Report Generation]
    end

    subgraph "Phase 4: CSV Loading"
        LOAD_STATUS[Load Status Schema<br/>shipments_status to events_status]
        LOAD_CASE[Load Case Schema<br/>locations to shipments_case to cases to flows to events_case]
    end

    subgraph "Phase 5: Gate 1 QA"
        ORPHAN[Orphan Check]
        DUP[Duplicate Check]
        FLOW[Flow Code Validation]
        COV[Coverage Check]
    end

    subgraph "Phase 6: Realtime Activation"
        REALTIME[Realtime Publication<br/>5 Tables Enabled]
        VERIFY[Verification<br/>Publication Status]
    end

    subgraph "Phase 7: Dashboard Integration"
        VIEWS[Create Views<br/>public.shipments]
        API[API Routes<br/>/api/worklist]
        TEST[Local Testing<br/>871 rows·KPI]
    end

    P1 --> DDL
    P2 --> DDL
    P3 --> DDL
    DDL --> RLS_POL
    RLS_POL --> IDX
    IDX --> ETL4_RUN
    ETL4_RUN --> ETL3_RUN
    ETL3_RUN --> CSV_GEN
    CSV_GEN --> QA_REPORT
    QA_REPORT --> LOAD_STATUS
    LOAD_STATUS --> LOAD_CASE
    LOAD_CASE --> ORPHAN
    ORPHAN --> DUP
    DUP --> FLOW
    FLOW --> COV
    COV --> REALTIME
    REALTIME --> VERIFY
    VERIFY --> VIEWS
    VIEWS --> API
    API --> TEST
```

---

## 3. 레이어 아키텍처

### 3.1 프론트엔드 레이어

```mermaid
graph TB
    subgraph "Presentation Layer"
        MapView[MapView Component<br/>deck.gl + maplibre-gl]
        RightPanel[RightPanel Component<br/>Location Status]
        HVDCPanel[HVDC Panel Component<br/>KPI + Worklist + DetailDrawer]
    end

    subgraph "State Management Layer"
        UnifiedStore[UnifiedStore Zustand<br/>Location Selection<br/>Worklist Filtering<br/>KPI State]
    end

    subgraph "API Layer"
        WorklistAPI[/api/worklist<br/>Dashboard Payload]
        LocationsAPI[/api/locations<br/>Supabase public.locations]
        LocationStatusAPI[/api/location-status<br/>Supabase public.location_statuses]
        EventsAPI[/api/events<br/>Supabase public.events<br/>with joins]
    end

    subgraph "Data Layer"
        SupabaseClient[Supabase Client<br/>Postgres RLS<br/>Realtime Subscriptions]
    end

    MapView --> UnifiedStore
    RightPanel --> UnifiedStore
    HVDCPanel --> UnifiedStore

    UnifiedStore --> WorklistAPI
    UnifiedStore --> LocationsAPI
    UnifiedStore --> LocationStatusAPI
    UnifiedStore --> EventsAPI

    WorklistAPI --> SupabaseClient
    LocationsAPI --> SupabaseClient
    LocationStatusAPI --> SupabaseClient
    EventsAPI --> SupabaseClient
```

### 3.2 백엔드 레이어

```mermaid
graph TB
    subgraph "Supabase (SSOT)"
        Postgres[(PostgreSQL 15<br/>Normalized Tables)]
        RLS_Policies[RLS Policies<br/>Security]
        Realtime_Ch[Realtime Channels<br/>Filtered Subscriptions]
        Edge_Func[Edge Functions<br/>Serverless Logic]
    end

    subgraph "ETL Pipeline"
        ETL_Scripts[Python ETL Scripts<br/>status_etl.py + optionc_etl.py]
        FlowCode[Flow Code v3.5<br/>Calculator]
        ColumnAudit[Column Audit<br/>Used Columns Log]
    end

    subgraph "RDF Pipeline"
        JSON2TTL[json_to_ttl.py<br/>JSON to TTL]
        OntologyStore[(Ontology Store<br/>RDF/Turtle)]
    end

    subgraph "Data Sources"
        JSONFiles[HVDC JSON Files]
        ExcelFiles[Excel/CSV]
        Foundry[Foundry/Ontology]
    end

    JSONFiles --> ETL_Scripts
    ExcelFiles --> ETL_Scripts
    ETL_Scripts --> FlowCode
    FlowCode --> ColumnAudit
    ColumnAudit --> Postgres

    JSONFiles --> JSON2TTL
    JSON2TTL --> OntologyStore

    Postgres --> RLS_Policies
    Postgres --> Realtime_Ch
    Postgres --> Edge_Func

    Foundry -.-> OntologyStore
```

---

## 4. 데이터 모델

### 4.1 Supabase 스키마 구조

```mermaid
erDiagram
    status_shipments_status ||--o{ status_events_status : "has events"
    case_locations ||--o{ case_shipments_case : "located at"
    case_shipments_case ||--o{ case_cases : "has cases"
    case_cases ||--o{ case_flows : "has flows"
    case_cases ||--o{ case_events_case : "has events"

    status_shipments_status {
        string hvdc_code PK
        date project_shu2
        date project_mir3
        date project_das4
        date project_agi5
        int flow_code
        jsonb raw_data
    }

    status_events_status {
        string hvdc_code FK
        string event_type
        timestamp event_time_iso
        string location_id
    }

    case_locations {
        string location_id PK
        string location_name
        float latitude
        float longitude
    }

    case_shipments_case {
        string hvdc_code PK
        string case_no PK
        string location_id FK
        date case_start_date
    }

    case_cases {
        string hvdc_code PK
        string case_no PK
        int flow_code
        string flow_code_original
        string flow_override_reason
    }

    case_flows {
        string hvdc_code PK
        string case_no PK
        int flow_sequence
        string flow_type
    }

    case_events_case {
        string hvdc_code PK
        string case_no PK
        string event_type
        timestamp event_time_iso
        string location_id FK
    }
```

### 4.2 데이터 레이어 구조

**Status SSOT Layer** (`status` schema):
- `status.shipments_status`: Status 전량 기준 선적 마스터
- `status.events_status`: Status 레이어 이벤트

**Option-C Case Layer** (`case` schema):
- `case.locations`: 물류 위치 마스터
- `case.shipments_case`: 케이스 단위 선적
- `case.cases`: 케이스 마스터 (Flow Code 포함)
- `case.flows`: 케이스 흐름
- `case.events_case`: 케이스 이벤트

**Core Tables** (`public` schema):
- `locations`: 물류 위치 (포트, 창고, 현장)
  - 컬럼: `id` (UUID), `name`, `lat`, `lng`, `type`
  - API 매핑: `id→location_id`, `lng→lon`, `type→siteType`
- `location_statuses`: 위치별 실시간 상태
  - 컬럼: `location_id` (UUID FK), `status` (text), `occupancy_rate` (0-100), `updated_at`
  - API 매핑: `status→status_code` (대문자), `occupancy_rate` (0-100→0-1), `updated_at→last_updated`
- `events`: 이벤트 로그
  - 컬럼: `id` (UUID), `location_id` (UUID FK), `shipment_id` (UUID FK), `event_type`, `description`, `metadata`, `ts`
  - API 조인: `locations!inner` (좌표 필수), `shipments` (선택적)
  - API 매핑: `event_type→status`, `description→remark`, `shipments.sct_ship_no→shpt_no`
- `hvdc_kpis`: HVDC KPI 메트릭
- `hvdc_worklist`: HVDC 워크리스트
- `logs`: 시스템 로그 (pipeline/audit)

### 4.3 RDF 온톨로지

**Namespace**: `http://samsung.com/project-logistics#`

**Core Properties**:
- `hvdc:hasSiteArrivalDate` (generic)
- `hvdc:hasSHUArrivalDate`, `hvdc:hasMIRArrivalDate`, `hvdc:hasDASArrivalDate`, `hvdc:hasAGIArrivalDate` (site-specific)
- `hvdc:hasSiteArrival` (derived boolean)
- `hvdc:hasFlowCode` (0-5)
- `hvdc:hasFinalLocation`

**Event Model**:
- `hvdc:StockEvent` (이벤트 클래스)
- `hvdc:hasInboundEvent`, `hvdc:hasOutboundEvent`
- `hvdc:hasEventDate`, `hvdc:hasLocationAtEvent`

---

## 5. 컴포넌트 아키텍처

### 5.1 통합 레이아웃 구조

```mermaid
graph TB
    subgraph "UnifiedLayout"
        subgraph "HeaderBar 96px fixed top-0"
            HeaderTop[Top Row<br/>GlobalSearch + Navigation]
            HeaderBottom[Bottom Row<br/>KPI Summary Strip<br/>aria-live='polite']
        end
        
        subgraph "Main Content Area pt-24"
            MapView[MapView<br/>flex-1<br/>deck.gl + maplibre-gl<br/>Zoom-based Layer Visibility]
            RightPanel[RightPanel<br/>w-80 320px<br/>Desktop only<br/>Tab UI: Status/Occupancy/Distribution]
        end
        
        subgraph "HVDC Panel fixed bottom-0 260px"
            StageCards[StageCardsStrip<br/>3 Cards]
            KpiStrip[KpiStrip<br/>Real-time KPIs]
            WorklistTable[WorklistTable<br/>Simplified: Gate/Title/Due/Score]
        end
        
        DetailDrawer[DetailDrawer<br/>fixed top-24 right-80<br/>bottom-80 w-96<br/>Triggers Section]
    end

    HeaderTop --> MapView
    HeaderTop --> RightPanel
    HeaderBottom --> MapView
    MapView --> StageCards
    RightPanel --> KpiStrip
    StageCards --> KpiStrip
    KpiStrip --> WorklistTable
    WorklistTable --> DetailDrawer
```

### 5.2 컴포넌트 계층 구조

```mermaid
graph TD
    UnifiedLayout[UnifiedLayout.tsx]
    
    UnifiedLayout --> HeaderBar[HeaderBar]
    UnifiedLayout --> MapView[MapView Component]
    UnifiedLayout --> RightPanel[RightPanel Component]
    UnifiedLayout --> HVDCPanel[HVDC Panel Component]
    
    MapView --> LocationLayer[Location Layer<br/>deck.gl ScatterplotLayer<br/>줌 ≥9.5 표시]
    MapView --> HeatmapLayer[Heatmap Layer<br/>deck.gl HeatmapLayer<br/>줌 <9.5 표시, 강도 범례<br/>Zoom-based Radius Scaling]
    MapView --> HeatmapLegend[HeatmapLegend<br/>Intensity Scale<br/>낮음~매우 높음]
    MapView --> GeofenceLayer[Geofence Layer<br/>deck.gl PathLayer<br/>Toggle-based]
    MapView --> ETAWedgeLayer[ETA Wedge Layer<br/>deck.gl ArcLayer]
    MapView --> PoiLayer[POI Layer<br/>deck.gl ScatterplotLayer + TextLayer<br/>11개 고정 POI, reakmapping SSOT<br/>줌 ≥7.5 표시, 컴팩트/상세 라벨]
    
    RightPanel --> TabUI[Tab UI<br/>Status/Occupancy/Distribution]
    TabUI --> LocationStatus[Location Status Card]
    TabUI --> EventList[Event List]
    TabUI --> OccupancyChart[Occupancy Rate Chart]
    
    HVDCPanel --> StageCardsStrip[StageCardsStrip<br/>3카드, 라우팅 연동]
    HVDCPanel --> KpiStrip[KpiStrip Component<br/>헤더 고정, KPI 요약 스트립]
    HVDCPanel --> WorklistTable[WorklistTable Component<br/>간소화: Gate/Title/Due/Score만]
    HVDCPanel --> DetailDrawer[DetailDrawer Component<br/>상세 정보 + Triggers]
    
    HeaderBar --> HeaderTop[Top Row<br/>GlobalSearch + Navigation]
    HeaderBar --> HeaderBottom[Bottom Row<br/>KPI Summary Strip<br/>aria-live='polite']
    HeaderTop --> GlobalSearch[GlobalSearch<br/>locations·worklist 검색]
    
    KpiStrip --> KpiCard1[Total Shipments]
    KpiStrip --> KpiCard2[In Transit]
    KpiStrip --> KpiCard3[At Site]
    KpiStrip --> KpiCard4[Delivered]
    
    WorklistTable --> WorklistRow[WorklistRow Component]
    WorklistTable --> FilterBar[FilterBar Component]
    WorklistTable --> SearchBar[SearchBar Component]
```

### 5.3 상태 관리 구조

**UnifiedStore (Zustand)**:
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
  
  // UI State
  selectedLocationId?: string
  selectedRowId?: string
  drawerOpen: boolean
  
  // Realtime State
  connectionStatus: 'live' | 'polling' | 'offline'
  lastUpdateTime?: Date
  
  // Actions
  selectLocation: (id: string) => void  // → HVDC 필터링
  selectWorklistRow: (id: string) => void  // → 지도 하이라이트
  updateKpis: (kpis: KPIs) => void  // Realtime 업데이트
}
```

---

## 6. Realtime 아키텍처

### 6.1 Realtime KPI Dashboard 구조

```mermaid
sequenceDiagram
    participant DB as Supabase DB
    participant RT as Realtime Channel
    participant Hook as useKpiRealtime
    participant Store as UnifiedStore
    participant UI as KpiStrip

    DB->>RT: INSERT/UPDATE shipments
    RT->>Hook: Change Event
    Hook->>Hook: Batch Updates (300-500ms)
    Hook->>Hook: Recalculate KPIs
    Hook->>Store: updateKpis(newKPIs)
    Store->>UI: Re-render with new KPIs
    UI->>UI: Performance Monitoring
```

### 6.2 Realtime 훅 구조

```mermaid
graph TB
    subgraph "Realtime Hooks"
        useSupabaseRealtime[useSupabaseRealtime<br/>Generic Realtime Hook]
        useKpiRealtime[useKpiRealtime<br/>KPI-specific Hook]
        useBatchUpdates[useBatchUpdates<br/>Debounce Hook]
    end

    subgraph "Features"
        ChannelMgmt[Channel Management<br/>Create/Subscribe/Cleanup]
        ErrorHandling[Error Handling<br/>Reconnection with Backoff]
        Batching[Batching<br/>300-500ms Desktop<br/>1s Mobile]
        PerfMonitor[Performance Monitoring<br/>commit_timestamp to render]
        Fallback[Fallback Polling<br/>60s interval]
    end

    useSupabaseRealtime --> ChannelMgmt
    useSupabaseRealtime --> ErrorHandling
    useKpiRealtime --> useSupabaseRealtime
    useKpiRealtime --> useBatchUpdates
    useBatchUpdates --> Batching
    useKpiRealtime --> PerfMonitor
    useKpiRealtime --> Fallback
```

### 6.3 Realtime 채널 구조

**Channels**:
- `public.shipments`: 선적 업데이트 (KPI 재계산 트리거)
- `status.shipments_status`: Status 레이어 업데이트
- `status.events_status`: Status 이벤트 스트림
- `case.shipments_case`: Case 레이어 선적 업데이트
- `case.events_case`: Case 이벤트 스트림
- `case.cases`: 케이스 업데이트 (Flow Code 변경)

**Optimization**:
- Filtered channels (필요한 데이터만 구독)
- Minimal payload (최소 페이로드)
- Merge/debounce (중복 제거)
- UI virtualization (대용량 리스트 가상화)
- Visibility change handling (모바일 최적화)

---

## 7. API 아키텍처

### 7.1 REST API (Next.js API Routes)

**HVDC APIs**:
- `GET /api/worklist`: 대시보드 페이로드 (KPI + WorklistRows)
- `GET /api/shipments`: 선적 목록
- `GET /api/statistics`: 통계 데이터
- `GET /api/alerts`: 알림
- `GET /api/weather`: 날씨 정보

**Logistics APIs**:
- `GET /api/locations`: 물류 위치 목록
  - **데이터 소스**: Supabase `public.locations` (Fallback: Mock 데이터)
  - **스키마 매핑**: `id→location_id`, `lng→lon`, `type→siteType` (매핑 함수)
  - **필터**: 좌표가 있는 행만 반환
- `GET /api/location-status`: 위치별 상태
  - **데이터 소스**: Supabase `public.location_statuses` (Fallback: Mock 데이터)
  - **스키마 매핑**: `status→status_code` (대문자 변환), `occupancy_rate` (0-100→0-1), `updated_at→last_updated`
- `GET /api/events`: 이벤트 로그
  - **데이터 소스**: Supabase `public.events` with `locations!inner` + `shipments` joins (Fallback: Mock 데이터)
  - **스키마 매핑**: `event_type→status`, `description→remark`, `shipments.sct_ship_no→shpt_no`
  - **필터**: 유효한 좌표가 있는 이벤트만 반환

### 7.2 API 데이터 플로우

```mermaid
graph LR
    Client[Client Request]
    APIRoute[Next.js API Route]
    SupabaseClient[Supabase Client]
    Postgres[(PostgreSQL)]
    RLS[RLS Policies]
    
    Client --> APIRoute
    APIRoute --> SupabaseClient
    SupabaseClient --> RLS
    RLS --> Postgres
    Postgres --> RLS
    RLS --> SupabaseClient
    SupabaseClient --> APIRoute
    APIRoute --> Client
```

---

## 8. 보안 아키텍처

### 8.1 인증/인가

- **Client**: anon key + RLS policies
- **Server/Edge**: service role key (절대 클라이언트 노출 금지)

### 8.2 Row Level Security (RLS)

**원칙**:
- 모든 테이블에 RLS 활성화 필수
- 명시적 정책 정의
- RLS 정책은 제품 계약으로 취급 (약화 금지)

**RLS 정책 구조**:
```mermaid
graph TB
    User[Authenticated User]
    Anon[Anonymous User]
    
    User --> RLS_Policy1[RLS Policy: SELECT<br/>status.shipments_status]
    User --> RLS_Policy2[RLS Policy: SELECT<br/>case.cases]
    
    Anon --> RLS_Policy3[RLS Policy: SELECT<br/>public.locations<br/>Read-only]
    
    RLS_Policy1 --> Table1[(status.shipments_status)]
    RLS_Policy2 --> Table2[(case.cases)]
    RLS_Policy3 --> Table3[(public.locations)]
```

### 8.3 데이터 보호

- 환경 변수로만 비밀값 관리
- 로그에서 비밀값 제거
- 문서 무결성: doc_hash + 엄격한 접근 제어
- 불변 감사 로그 (who/when/why)

---

## 9. 성능 아키텍처

### 9.1 성능 목표 (Gate 3)

- 평균 응답 시간 < 1s
- p95 < 3s (워크리스트 로드, 상태 패널 새로고침)
- Realtime latency p95 < 3s
- Sync lag p95 ≤ 300s

### 9.2 최적화 전략

**Frontend**:
- Skeleton loading (점진적 로딩)
- Virtualization (대용량 리스트)
- Realtime merge/debounce (중복 제거)
- React.useTransition (비긴급 업데이트)

**Backend**:
- Cursor-based pagination (updated_at, event_ts)
- Indexes on cursor fields
- Realtime filtered channels
- Batch updates (300-500ms desktop, 1s mobile)

**Integration**:
- Sync lag p95 ≤ 300s
- Validation latency p95 < 5s

---

## 10. 통합 패턴

### 10.1 Supabase ↔ Foundry/Ontology

```mermaid
graph TB
    subgraph "Integration Patterns"
        PatternA[Pattern A: DB Pull<br/>Bulk/Backfill]
        PatternB[Pattern B: API Pull<br/>Policy-heavy]
        PatternC[Pattern C: CDC<br/>Logical Replication]
        PatternD[Pattern D: Webhook Push<br/>Trigger-only]
    end

    subgraph "Supabase"
        Postgres[(PostgreSQL)]
        DataAPI[Data APIs]
        Webhook[Database Webhooks]
    end

    subgraph "Foundry/Ontology"
        FoundryDB[(Foundry DB)]
        OntologyStore[(Ontology Store)]
    end

    PatternA --> Postgres
    PatternB --> DataAPI
    PatternC --> Postgres
    PatternD --> Webhook

    Postgres --> FoundryDB
    DataAPI --> OntologyStore
    Webhook --> FoundryDB
```

**패턴 A: DB Pull** (bulk/backfill)
- Postgres 직접 연결
- 읽기 전용 DB role
- Cursor-based incremental loads

**패턴 B: API Pull** (policy-heavy)
- Supabase Data APIs / REST
- RLS-aware
- Signed JWT + RLS policies

**패턴 C: CDC** (ops-mature)
- Logical Replication
- Outbox table (stable change envelopes)
- Idempotent + checkpointed

**패턴 D: Webhook Push** (trigger-only)
- Database Webhooks
- Thin webhook, fat pull
- Retry/backoff + dead-letter

**권장**: (A)+(D) 또는 (B)+(D)

---

## 11. 검증 아키텍처

### 11.1 Gate 1 QA 검증

```mermaid
graph TB
    subgraph "Gate 1 QA Checks"
        OrphanCheck[Orphan Check<br/>orphan_count = 0]
        DuplicateCheck[Duplicate Check<br/>No duplicates]
        FlowCodeCheck[Flow Code Validation<br/>0-5 range + AGI/DAS ≥ 3]
        CoverageCheck[Coverage Check<br/>100% coverage]
    end

    subgraph "Data Sources"
        StatusData[(status schema)]
        CaseData[(case schema)]
    end

    StatusData --> OrphanCheck
    CaseData --> OrphanCheck
    StatusData --> DuplicateCheck
    CaseData --> DuplicateCheck
    CaseData --> FlowCodeCheck
    StatusData --> CoverageCheck
    CaseData --> CoverageCheck

    OrphanCheck --> Gate1Result[Gate 1 Result]
    DuplicateCheck --> Gate1Result
    FlowCodeCheck --> Gate1Result
    CoverageCheck --> Gate1Result
```

### 11.2 SHACL 검증

**규칙**:
- Flow Code ∈ [0..5] + domain routing rules
- Invoice math integrity (EA×Rate = Amount, ΣLine = InvoiceTotal)
- Site Arrival Date datatype (xsd:date)
- Boolean-date consistency
- AGI/DAS Flow ≥ 3 constraint
- Chronology (ETD ≤ ATD ≤ ATA)

### 11.3 OCR 게이트

**임계값**:
- MeanConf ≥ 0.92
- TableAcc ≥ 0.98
- NumericIntegrity = 1.00

**Fail-safe**: 게이트 실패 시 ZERO 모드 (downstream automation 중지 + 티켓)

---

## 12. 배포 아키텍처

### 12.1 배포 환경

- **Platform**: Vercel
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Supabase Dashboard

### 12.2 CI/CD 파이프라인

```mermaid
graph LR
    Commit[Git Commit]
    PreCommit[Pre-commit Hooks<br/>lint + typecheck]
    GitHubActions[GitHub Actions<br/>Test + Build]
    VercelDeploy[Vercel Deploy<br/>Auto Deploy]
    
    Commit --> PreCommit
    PreCommit --> GitHubActions
    GitHubActions --> VercelDeploy
```

---

## 13. 참조 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 규칙
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 통합 상태
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 🆕 Supabase 데이터 적재 작업 계획
- [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md) - 🆕 Realtime KPI Dashboard 구현
- [DASHBOARD_LAYOUT.md](../architecture/DASHBOARD_LAYOUT.md) - 🆕 통합 대시보드 레이아웃 사양
- [ETL_GUIDE.md](./ETL_GUIDE.md) - 🆕 ETL 스크립트 가이드
- [plan.md](../plan.md) - TDD 테스트 계획

---

**문서 버전**: 2.2  
**최종 업데이트**: 2026-02-07  
**주요 변경사항**:
- Realtime KPI Dashboard 구현 완료 반영
- Data Loading & ETL 파이프라인 추가
- Status/Case 레이어 구조 반영
- **맵 레이어 API 라우트 Supabase 전환 완료** (Mock → 실제 데이터 조회, 스키마 매핑, Fallback 로직)
- **dash 패치 적용 완료** (POI 레이어, StageCardsStrip, GlobalSearch)
- **UI/UX 개선 완료** (2026-02-05~07): 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화
- 머메이드 다이어그램 추가 (시스템 아키텍처, 데이터 플로우, ETL 파이프라인, 컴포넌트 구조, Realtime 아키텍처)
