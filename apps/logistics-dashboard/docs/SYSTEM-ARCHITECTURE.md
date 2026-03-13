# System Architecture — HVDC Logistics Dashboard

> **Version:** 1.2.0 | **Last Updated:** 2026-03-13
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Supabase · Deck.gl · Zustand

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Application Layers](#3-application-layers)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [API Architecture](#5-api-architecture)
6. [State Management](#6-state-management)
7. [Realtime Architecture](#7-realtime-architecture)
8. [Database Architecture](#8-database-architecture)
9. [Frontend Rendering Strategy](#9-frontend-rendering-strategy)
10. [Security Architecture](#10-security-architecture)
11. [Performance Architecture](#11-performance-architecture)
12. [Deployment Architecture](#12-deployment-architecture)

---

## 0. Overview Cockpit Architecture Update

- New BFF endpoint: `GET /api/overview`
  - Aggregates `/api/cases/summary`, `/api/worklist`, `/api/events`, `/api/locations`, `/api/location-status`, `/api/shipments/stages`
- New client hook: `useOverviewData()`
  - Page-local fetch only, visible-only 30s polling, focus refetch
  - Hydrates `@repo/shared` `useOpsStore` for map/events/status reuse
- `KpiProvider` remains the single global realtime owner; overview does not add a second global subscription
- Public overview vocabulary is config-driven:
  - `configs/overview.route-types.json`
  - `configs/overview.destinations.json`
- Cross-page navigation is URL-first through `lib/navigation/contracts.ts`
  - `flow_code` remains an internal compatibility field only

## 1. Architecture Overview

```mermaid
graph TB
    subgraph Client["Browser Client"]
        NextApp["Next.js 16 App Router<br/>(React 19 SSR+CSR)"]
        Zustand["Zustand Store<br/>(Normalized State)"]
        DeckGL["Deck.gl + Maplibre<br/>(Map Visualization)"]
        Recharts["Recharts<br/>(Charts)"]
    end

    subgraph BFF["Next.js BFF Layer (Edge/Node)"]
        APIRoutes["API Routes<br/>/api/cases<br/>/api/cases/summary<br/>/api/stock<br/>/api/shipments<br/>/api/chain/summary"]
        Middleware["Middleware<br/>(Auth check, CORS)"]
    end

    subgraph Supabase["Supabase Platform"]
        PostgREST["PostgREST<br/>(REST API)"]
        Realtime["Supabase Realtime<br/>(WebSocket)"]
        subgraph PG["PostgreSQL 15"]
            PublicSchema["public schema<br/>v_cases (10,694) · v_flows (7,564)<br/>v_shipments_status (890)<br/>v_stock_onhand · shipments"]
            CaseSchema["case schema<br/>cases · flows"]
            StatusSchema["status schema<br/>shipments_status"]
            WhSchema["wh schema<br/>stock_onhand"]
        end
        Storage["Supabase Storage<br/>(Document files)"]
        Auth["Supabase Auth<br/>(Future)"]
    end

    subgraph External["External Services"]
        MapTiles["MapTiles CDN<br/>(Protomaps / OpenStreetMap)"]
        HVDC_API["HVDC ERP<br/>(Future integration)"]
    end

    subgraph ETL["Data Pipeline"]
        Excel["Excel Files (.xlsx)"]
        ImportScript["scripts/import-excel.mjs<br/>(Excel → Supabase ETL)"]
    end

    NextApp -->|"HTTP fetch()"| APIRoutes
    NextApp -->|"WebSocket"| Realtime
    APIRoutes -->|"supabase-js REST"| PostgREST
    PostgREST --> PublicSchema
    PublicSchema --> CaseSchema
    PublicSchema --> StatusSchema
    PublicSchema --> WhSchema
    NextApp --> Zustand
    NextApp --> DeckGL
    DeckGL --> MapTiles
    NextApp --> Recharts
    Middleware --> APIRoutes
    Excel --> ImportScript
    ImportScript -->|"RPC batch insert"| PG

    style Client fill:#1e293b,color:#f8fafc
    style BFF fill:#0f172a,color:#f8fafc
    style Supabase fill:#1a2a1a,color:#f8fafc
    style External fill:#1a1a2e,color:#f8fafc
    style ETL fill:#2a1a1a,color:#f8fafc
```

---

## 2. Technology Stack

```mermaid
mindmap
  root((HVDC Dashboard))
    Frontend
      Next.js 16.3
        App Router
        Server Components
        Server Actions
      React 19.2
        Concurrent Features
        Suspense
        use() hook
      TypeScript 5.4
        Strict mode
        Path aliases
    UI
      Tailwind CSS 3.4
        Dark theme
        CSS variables
      Shadcn UI
        Radix primitives
        Accessible components
      Deck.gl 9
        WebGL 2.0 layers
        GPU acceleration
      Maplibre GL 3
        Vector tiles
        Custom styles
      Recharts 2
        SVG charts
        Responsive
    Data
      Supabase
        PostgreSQL 15
        PostgREST v12
        Realtime v2
      Zustand 4
        Normalized store
        Immer middleware
        Devtools
    Build
      Turbopack
        Fast refresh
        Module federation
      ESLint 9
      Prettier 3
```

### Version Matrix

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.3.x | Framework & BFF |
| `react` | 19.2.0 | UI runtime |
| `typescript` | 5.4.x | Type safety |
| `@supabase/supabase-js` | 2.x | DB client |
| `@deck.gl/react` | 9.x | Map layers |
| `maplibre-gl` | 3.x | Map renderer |
| `recharts` | 2.x | Charts |
| `zustand` | 4.x | State management |
| `tailwindcss` | 3.4.x | Styling |
| `@radix-ui/*` | latest | UI primitives |

---

## 3. Application Layers

```mermaid
graph TB
    subgraph L1["Layer 1: Presentation (React Components)"]
        direction LR
        Pages["Pages (5개)\noverview · cargo\npipeline · sites · chain"]
        Layouts["Layouts\nRootLayout · DashboardLayout"]
        Components["Components\nKPI · Map · Tables\nCharts · Drawers · Chain"]
    end

    subgraph L2["Layer 2: Application Logic"]
        direction LR
        Hooks["Custom Hooks\nuseRealtime · useKPI\nuseLiveFeed · useBatch"]
        Store["Zustand Store\nstate · actions\nselectors"]
        Context["React Context\nKpiProvider"]
    end

    subgraph L3["Layer 3: BFF / API"]
        direction LR
        RouteHandlers["Route Handlers\n/api/cases · /api/stock\n/api/shipments · /api/chain/summary"]
        Transform["Data Transform\naggregation · pagination\nfiltering · pagination loop"]
    end

    subgraph L4["Layer 4: Data Access"]
        direction LR
        SupabaseClient["Supabase Client\nlib/supabase.ts\n(supabase + supabaseAdmin)"]
        MockFallback["Mock Fallback\nlib/api.ts"]
    end

    subgraph L5["Layer 5: Infrastructure"]
        direction LR
        DB["Supabase PostgreSQL\nmulti-schema\n10,694 cases / 890 shipments"]
        Realtime["Supabase Realtime\nWebSocket"]
        CDN["Edge CDN\nstatic assets"]
        ETL["ETL Pipeline\nscripts/import-excel.mjs"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L2 -->|"direct WebSocket"| Realtime
```

---

## 4. Data Flow Architecture

### 4.1 Initial Page Load

```mermaid
sequenceDiagram
    participant Browser
    participant NextServer as Next.js Server
    participant BFF as API Routes (BFF)
    participant Supabase as Supabase PostgREST
    participant DB as PostgreSQL Views

    Browser->>NextServer: GET /overview
    activate NextServer
    NextServer->>NextServer: Server Component render
    NextServer-->>Browser: HTML shell (SSR)
    deactivate NextServer

    Browser->>Browser: Hydrate React
    Browser->>BFF: fetch('/api/cases/summary')
    activate BFF
    BFF->>Supabase: SELECT cols FROM v_cases RANGE 0-999
    Supabase->>DB: query public.v_cases → case.cases
    DB-->>Supabase: 1,000 rows (page 1 of ~11)
    Supabase-->>BFF: JSON response
    Note over BFF: 페이지 루프 반복<br/>(db-max-rows=1000 우회)<br/>총 10,694 rows 수집
    BFF->>BFF: Aggregate KPI data
    BFF-->>Browser: { total: 10694, bySite: {...}, ... }
    deactivate BFF

    Browser->>Browser: Zustand store.setKpi(data)
    Browser->>Browser: KPI cards render with real data
```

### 4.2 Pagination Loop (db-max-rows=1000 우회)

```mermaid
flowchart TD
    Start["fetchAllCases() 시작\noffset = 0, PAGE = 1000"]
    Query["supabase.from('v_cases')\n.select(cols)\n.range(offset, offset + 999)\n.order('id')"]
    Check{"data.length > 0?"}
    AppendRows["allRows.push(...data)"]
    LastPage{"data.length < 1000?"}
    NextPage["offset += 1000"]
    Return["return allRows\n(총 10,694 rows)"]

    Start --> Query
    Query --> Check
    Check -->|"No (빈 결과)"| Return
    Check -->|"Yes"| AppendRows
    AppendRows --> LastPage
    LastPage -->|"Yes (마지막 페이지)"| Return
    LastPage -->|"No"| NextPage
    NextPage --> Query
```

> `/api/cases/summary` 와 `/api/chain/summary` 양쪽에서 이 패턴을 사용한다.

### 4.3 Realtime Update Flow

```mermaid
sequenceDiagram
    participant DB as Supabase DB
    participant Realtime as Realtime Engine
    participant Hook as useSupabaseRealtime
    participant Store as Zustand Store
    participant UI as React Components

    DB->>Realtime: Row INSERT/UPDATE on v_cases
    Realtime->>Hook: WebSocket message
    activate Hook
    Hook->>Hook: Parse change event
    Hook->>Store: store.dispatch(updateCase(payload))
    deactivate Hook
    activate Store
    Store->>Store: Recalculate KPI selectors
    Store-->>UI: Zustand subscription trigger
    deactivate Store
    UI->>UI: Re-render affected components
    Note over UI: Only changed components<br/>re-render (React 19 concurrent)
```

### 4.4 Filter / Search Flow

```mermaid
flowchart LR
    User["User Input\n(filter/search)"] --> Debounce["300ms Debounce"]
    Debounce --> URLParams["Update URL Params\n(useRouter.push)"]
    URLParams --> APIFetch["fetch('/api/cases?\nsite=AGI&flow_code=3')"]
    APIFetch --> SupabaseQuery["Supabase Query\n.eq() / .in() / .ilike()"]
    SupabaseQuery --> Transform["Transform + Paginate"]
    Transform --> StoreUpdate["Store Update"]
    StoreUpdate --> Rerender["Table/Grid Re-render"]
```

---

## 5. API Architecture

```mermaid
graph LR
    subgraph Routes["API Route Handlers"]
        R1["/api/cases\nGET · paginated list"]
        R2["/api/cases/summary\nGET · KPI aggregation\n(전체 10,694 rows)"]
        R3["/api/stock\nGET · warehouse stock"]
        R4["/api/shipments\nGET · shipment list\n(public.shipments VIEW)"]
        R5["/api/chain/summary\nGET · 전체 물류 체인 집계"]
        R6["/api/events\nGET · activity events"]
        R7["/api/locations\nGET · location list"]
        R8["/api/location-status\nGET · per-location KPI"]
        R9["/api/worklist\nGET · work items"]
        R10["/api/shipments/origin-summary\nGET · 출발지 국가별 집계"
        R11["/api/shipments/vendors
GET · 고유 벤더 목록 + 건수 (42개)"]
        R12["/api/shipments/stages
GET · 항차 단계별 집계"]]
    end

    subgraph QueryParams["Query Parameters"]
        QP1["site: AGI|DAS|MIR|SHU|MOSB"]
        QP2["flow_code: 0|1|2|3|4|5"]
        QP3["status_current: site|warehouse|..."]
        QP4["vendor: string"]
        QP5["page: number (default 1)"]
        QP6["pageSize: number (default 50)"]
        QP7["stage: PipelineStage"]
    end

    subgraph SupabaseViews["Supabase Views"]
        V1["public.v_cases"]
        V2["public.v_flows"]
        V3["public.v_shipments_status"]
        V4["public.v_stock_onhand"]
        V5["public.shipments (complex JOIN)"]
    end

    R1 --> V1
    R2 --> V1
    R3 --> V4
    R4 --> V5
    R5 --> V1
    R5 --> V5
    R6 --> V1
    R7 --> V1
    R8 --> V1
    R9 --> V1
    R10 --> V5
    R11 --> V5
    R12 --> V5

    QueryParams -.->|"filter params"| R1
    QueryParams -.->|"filter params"| R4
```

### 페이지네이션 전략

| API | 전략 | 이유 |
|-----|------|------|
| `/api/cases` | 서버 페이지네이션 (`page` + `pageSize`) | 사용자가 페이지를 탐색하는 목록 UI |
| `/api/cases?stage=X` | 클라이언트 필터링 (최대 20,000 rows 로드 후 필터) | stage는 DB 컬럼 아니므로 PostgREST 필터 불가 |
| `/api/cases/summary` | **전체 로드** (pagination loop) | KPI 집계에 전체 10,694 rows 필요 |
| `/api/chain/summary` | **전체 로드** (pagination loop) | 체인 집계에 전체 rows 필요 |
| `/api/shipments` | 서버 페이지네이션 | 890 rows — 단순 페이징으로 충분 |
| `/api/shipments/vendors` | **전체 로드** (pagination loop) | 벤더 distinct + 건수 집계에 전체 rows 필요 |
| `/api/shipments/stages` | **전체 로드** (pagination loop) | 항차 단계 집계에 전체 rows 필요 |

### Response Schemas

```mermaid
classDiagram
    class CasesSummaryResponse {
        +total: number
        +byStatus: Record~string, number~
        +bySite: Record~string, number~
        +bySiteArrived: Record~string, number~
        +bySiteStorageType: Record~string, StorageCounts~
        +byFlowCode: Record~string, number~
        +byVendor: Record~string, number~
        +bySqmByLocation: Record~string, number~
        +totalSqm: number
    }

    class CasesResponse {
        +data: CaseRow[]
        +total: number
        +page: number
        +pageSize: number
    }

    class CaseRow {
        +id: string
        +case_no: string
        +site: string
        +flow_code: number
        +flow_description: string
        +status_current: string
        +status_location: string
        +final_location: string
        +sqm: number
        +source_vendor: string
        +storage_type: string
        +stack_status: string
        +category: string
        +sct_ship_no: string
        +site_arrival_date: string
    }

    class ShipmentsResponse {
        +data: ShipmentRow[]
        +total: number
        +page: number
        +pageSize: number
    }

    class ChainSummaryResponse {
        +origins: Array~country, count~
        +ports: Array~name, count~
        +stages: Record~PipelineStage, number~
        +sites: SiteCounts
        +mosbTransit: number
    }

    class VendorsResponse {
        +vendors: Array~vendor: string, count: number~
    }

    class ShipmentStagesResponse {
        +pre_departure: number
        +in_transit: number
        +port_customs: number
        +delivered: number
        +total: number
        +nominated_shu: number
        +nominated_das: number
        +nominated_mir: number
        +nominated_agi: number
        +agi_das_no_mosb_alert: number
    }

    CasesResponse "1" --> "many" CaseRow
    ShipmentsResponse "1" --> "many" ShipmentRow
```

---

## 6. State Management

```mermaid
graph TD
    subgraph ZustandStore["Zustand Store — logisticsStore.ts"]
        subgraph State["State Slices"]
            KPI["kpi: KPIData"]
            Cases["cases: Map~string, CaseRow~"]
            Stock["stock: Map~string, StockRow~"]
            Shipments["shipments: ShipmentRow[]"]
            LiveFeed["liveFeed: ActivityEvent[]"]
            Filters["filters: FilterState"]
            UI["ui: UIState<br/>(loading, error, selectedId)"]
        end

        subgraph Actions["Actions"]
            A1["setKpi(data)"]
            A2["upsertCase(row)"]
            A3["removeCase(id)"]
            A4["setStock(rows)"]
            A5["setFilters(partial)"]
            A6["setLoading(key, bool)"]
            A7["pushLiveFeedEvent(event)"]
        end

        subgraph Selectors["Derived Selectors"]
            S1["selectTotalCases()"]
            S2["selectCasesByStatus(status)"]
            S3["selectCasesBySite(site)"]
            S4["selectFlowDistribution()"]
            S5["selectTopVendors(n)"]
        end
    end

    Components["React Components"] -->|"useStore(selector)"| Selectors
    Hooks["Custom Hooks"] -->|"getState().action()"| Actions
    Actions --> State
    State --> Selectors
    Selectors -->|"shallow equality check"| Components
```

### Store Normalization Pattern

```mermaid
graph LR
    subgraph Before["Array Pattern (slow updates)"]
        Arr["cases: CaseRow[]\nO(n) find by ID\nO(n) updates"]
    end

    subgraph After["Map Pattern (fast updates)"]
        Map["cases: Map~id, CaseRow~\nO(1) find by ID\nO(1) updates"]
        Order["orderedIds: string[]\n(for display order)"]
    end

    Before -.->|"migration"| After
```

---

## 7. Realtime Architecture

```mermaid
stateDiagram-v2
    [*] --> DISCONNECTED

    DISCONNECTED --> CONNECTING: Component mount
    CONNECTING --> CONNECTED: WebSocket open
    CONNECTING --> ERROR: Connection failed

    CONNECTED --> SUBSCRIBING: Subscribe to channels
    SUBSCRIBING --> LISTENING: Subscription confirmed

    LISTENING --> RECONNECTING: Connection lost
    RECONNECTING --> CONNECTING: Exponential backoff<br/>(1s → 2s → 4s → 8s → max 30s)

    LISTENING --> DISCONNECTED: Component unmount

    ERROR --> POLLING: Max retries exceeded
    POLLING --> CONNECTING: Periodic retry (60s)

    note right of LISTENING
        Channels:
        - public:v_cases
        - public:v_stock_onhand
        - public:v_shipments_status
    end note

    note right of POLLING
        Fallback: poll /api/cases/summary
        every 30 seconds
    end note
```

### Multi-Tab Synchronization

```mermaid
sequenceDiagram
    participant Tab1 as Tab 1 (Primary)
    participant BC as BroadcastChannel
    participant Tab2 as Tab 2 (Secondary)
    participant Tab3 as Tab 3 (Secondary)

    Tab1->>BC: postMessage({type: 'STATE_UPDATE', kpi: {...}})
    BC->>Tab2: message event
    BC->>Tab3: message event
    Tab2->>Tab2: store.setKpi() [no re-fetch]
    Tab3->>Tab3: store.setKpi() [no re-fetch]

    Note over Tab1,BC: Only Tab 1 maintains WS connection
    Note over Tab2,Tab3: Secondary tabs consume broadcast
```

---

## 8. Database Architecture

```mermaid
erDiagram
    CASE_CASES {
        uuid id PK
        text case_no
        text hvdc_code
        text sct_ship_no
        text site
        text status_current
        text status_location
        text final_location
        int flow_code
        text flow_description
        text category
        decimal sqm
        numeric cbm
        text source_vendor
        text storage_type
        text stack_status
        date site_arrival_date
        timestamptz created_at
    }

    CASE_FLOWS {
        uuid id PK
        text case_no
        text hvdc_code
        text sct_ship_no
        int flow_code
        text flow_description
        timestamptz created_at
    }

    STATUS_SHIPMENTS_STATUS {
        uuid id PK
        text hvdc_code
        text status_no
        text vendor
        text pol
        text pod
        text vessel
        text bl_awb
        text ship_mode
        date etd
        date eta
        date atd
        date ata
        text incoterms
        date final_delivery_date
        int transit_days
        int customs_days
        int inland_days
        bool doc_shu
        bool doc_das
        bool doc_mir
        bool doc_agi
        timestamptz created_at
    }

    WH_STOCK_ONHAND {
        uuid id PK
        text sku
        text description
        text location
        int qty
        text pallet_id
        date date_received
        timestamptz created_at
    }

    CASE_CASES ||--o{ CASE_FLOWS : "case_no / hvdc_code"
    CASE_CASES ||--o{ STATUS_SHIPMENTS_STATUS : "hvdc_code"
```

### Schema Isolation & View Layer

```mermaid
graph TB
    subgraph PG["PostgreSQL 15"]
        subgraph PublicSchema["public schema (PostgREST exposed)"]
            VC["VIEW v_cases\n(10,694 rows)"]
            VF["VIEW v_flows\n(7,564 rows)"]
            VS["VIEW v_shipments_status\n(890 rows)"]
            VW["VIEW v_stock_onhand"]
            VM["VIEW shipments\n(complex LEFT JOIN)"]
        end

        subgraph CaseSchema["case schema (isolated)"]
            TC["TABLE cases"]
            TF["TABLE flows"]
        end

        subgraph StatusSchema["status schema (isolated)"]
            TS["TABLE shipments_status"]
        end

        subgraph WhSchema["wh schema (isolated)"]
            TW["TABLE stock_onhand"]
        end
    end

    subgraph PostgREST["PostgREST API"]
        PR["Exposes only\npublic schema"]
    end

    PR --> VC
    PR --> VF
    PR --> VS
    PR --> VW
    PR --> VM

    VC -->|"SELECT *"| TC
    VF -->|"SELECT *"| TF
    VS -->|"SELECT *"| TS
    VW -->|"SELECT *"| TW
    VM -->|"LEFT JOIN"| TS
    VM -->|"LEFT JOIN"| TF
    VM -->|"LEFT JOIN"| TC

    style PublicSchema fill:#1a3a1a
    style CaseSchema fill:#1a1a3a
    style StatusSchema fill:#3a1a1a
    style WhSchema fill:#3a2a1a
```

---

## 9. Frontend Rendering Strategy

```mermaid
flowchart TD
    Route["Route Request"] --> RSC{{"Server Component?"}}

    RSC -->|"Yes (default)"| Server["Server Component Render<br/>• No JS bundle impact<br/>• Direct DB access possible<br/>• SEO-friendly HTML"]

    RSC -->|"'use client'"| Client["Client Component Render<br/>• Hydration required<br/>• useState/useEffect OK<br/>• Browser APIs available"]

    Server -->|"async data fetch"| Supabase["Supabase Query\n(server-side)"]
    Server -->|"pass as props"| Client

    Client -->|"dynamic data"| APIFetch["fetch('/api/...')"]
    Client -->|"realtime"| WebSocket["Supabase Realtime WS"]

    subgraph Strategy["Rendering Decisions"]
        S1["Layout.tsx → Server\n(navigation, shell)"]
        S2["KpiStripCards → Client\n(realtime updates)"]
        S3["OverviewMap → Client\n(WebGL, browser APIs)"]
        S4["Tables → Client\n(sort, filter, pagination)"]
        S5["Static text → Server\n(SEO, performance)"]
        S6["FlowChain → Client\n(interactive chain viz)"]
    end
```

### 5개 페이지 구조

| 페이지 | 경로 | 주요 기능 |
|--------|------|-----------|
| Overview | `/overview` | KPI strip · OverviewMap · 실시간 피드 |
| Pipeline | `/pipeline` | FlowPipeline · PipelineFilterBar · PipelineCasesTable |
| Sites | `/sites` | SiteCards · SiteDetail · AgiAlertBanner |
| Cargo | `/cargo` | CargoTabs · WhStatusTable · CargoDrawer |
| Chain | `/chain` | 전체 물류 체인 시각화 · OriginCountrySummary · FlowChain |

---

## 10. Security Architecture

```mermaid
graph TD
    subgraph PublicAccess["Public (Anon Key)"]
        AnonKey["NEXT_PUBLIC_SUPABASE_ANON_KEY\n(browser-safe, read-only)"]
    end

    subgraph ServerAccess["Server-only (Service Role)"]
        ServiceKey["SUPABASE_SERVICE_ROLE_KEY\n(never exposed to browser)\nUsed only in API routes"]
    end

    subgraph RLS["Row Level Security Policies"]
        P1["v_cases: SELECT ONLY\nfor anon + authenticated"]
        P2["v_flows: SELECT ONLY\nfor anon + authenticated"]
        P3["v_shipments_status: SELECT ONLY\nfor anon + authenticated"]
        P4["v_stock_onhand: SELECT ONLY\nfor anon + authenticated"]
        P5["shipments: SELECT ONLY\nfor anon + authenticated"]
    end

    subgraph EnvVars[".env.local (Never Committed)"]
        E1["NEXT_PUBLIC_SUPABASE_URL"]
        E2["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
        E3["SUPABASE_SERVICE_ROLE_KEY"]
    end

    AnonKey --> P1
    AnonKey --> P2
    AnonKey --> P3
    AnonKey --> P4
    ServiceKey --> P1
    ServiceKey --> P2
    ServiceKey --> P3
    ServiceKey --> P4

    EnvVars --> AnonKey
    EnvVars --> ServiceKey
```

> **패턴:** 모든 Next.js API Route는 `supabaseAdmin` (service_role 클라이언트)를 사용한다. 브라우저 클라이언트는 `supabase` (anon 클라이언트)를 사용한다.

---

## 11. Performance Architecture

```mermaid
graph LR
    subgraph Optimizations["Performance Optimizations"]
        direction TB
        O1["Turbopack\nFast dev builds\nModule dedup"]
        O2["React.memo()\nStable selector refs\nShallow equality"]
        O3["Zustand normalized\nMap-based O(1) lookup\nSelective subscriptions"]
        O4["Debounced updates\nuseBatchUpdates\n300ms debounce"]
        O5["Deck.gl GPU\nWebGL 2.0 layers\nInstance rendering"]
        O6["WS dedup\nBroadcastChannel\nSingle WS per origin"]
        O7["SWR-like cache\nstaleTime: 30s\nAPI response cache"]
        O8["Pagination loop\ndb-max-rows 우회\n1,000 rows/req × ~11회"]
    end

    subgraph Metrics["Target Metrics"]
        M1["LCP < 2.5s"]
        M2["FID < 100ms"]
        M3["CLS < 0.1"]
        M4["WS latency < 200ms"]
    end

    Optimizations --> Metrics
```

---

## 12. Deployment Architecture

```mermaid
graph TB
    subgraph Local["Local Development"]
        Dev["next dev (Turbopack)\nlocalhost:3001"]
        LocalDB["Supabase Cloud\n(shared dev project)"]
    end

    subgraph CI["CI/CD (GitHub Actions)"]
        Lint["ESLint + TypeScript check"]
        Test["Vitest unit tests"]
        Build["next build"]
    end

    subgraph Prod["Production"]
        Vercel["Vercel\n(Edge Network)"]
        SupabaseProd["Supabase Production\nrkfffveonaskewwzghex\n10,694 cases / 890 shipments"]
    end

    Local --> CI
    CI -->|"on merge to main"| Prod
    Prod --> SupabaseProd

    subgraph EnvProd["Production Env Vars"]
        PV1["NEXT_PUBLIC_SUPABASE_URL"]
        PV2["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
        PV3["SUPABASE_SERVICE_ROLE_KEY"]
    end

    EnvProd --> Vercel
```

### Directory Structure

```
apps/logistics-dashboard/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (dark theme, Inter font)
│   ├── page.tsx                 # Redirects → /overview
│   ├── globals.css              # Global CSS + CSS variables
│   ├── (dashboard)/             # Route group (shared layout)
│   │   ├── layout.tsx           # Dashboard shell (sidebar + main)
│   │   ├── overview/page.tsx    # KPI + Map + Feed
│   │   ├── cargo/page.tsx       # Shipments + Stock
│   │   ├── pipeline/page.tsx    # Flow pipeline
│   │   ├── sites/page.tsx       # Site status
│   │   └── chain/page.tsx       # 전체 물류 체인 시각화 (신규)
│   └── api/                     # BFF Route Handlers
│       ├── cases/route.ts       # 케이스 목록 (페이지네이션)
│       ├── cases/summary/route.ts  # KPI 집계 (전체 10,694 rows)
│       ├── stock/route.ts
│       ├── shipments/route.ts   # 선적 목록 (public.shipments VIEW)
│       ├── shipments/origin-summary/route.ts
│       ├── chain/summary/route.ts  # 물류 체인 집계 (신규)
│       ├── events/route.ts
│       ├── locations/route.ts
│       ├── location-status/route.ts
│       └── worklist/route.ts
├── components/                   # React Components
│   ├── layout/                  # Shell components (Sidebar, DashboardHeader)
│   ├── overview/                # Overview page (OverviewMap, OverviewRightPanel)
│   ├── map/                     # Deck.gl map components (PoiLocationsLayer)
│   ├── cargo/                   # Cargo (CargoDrawer, CargoTabs, WhStatusTable)
│   ├── pipeline/                # Pipeline (FlowPipeline, PipelineFilterBar,
│   │                            #           PipelineCasesTable, PipelineTableWrapper)
│   ├── sites/                   # Sites (SiteCards, SiteDetail,
│   │                            #        AgiAlertBanner, SiteTypeTag)
│   ├── chain/                   # Chain page components (신규)
│   │                            #   FlowChain, OriginCountrySummary
│   └── ui/                      # Shadcn base components
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities & clients
│   ├── supabase.ts              # Supabase client (supabase + supabaseAdmin)
│   ├── api.ts                   # Fetch + mock fallback
│   ├── utils.ts                 # cn() utility
│   ├── time.ts                  # Dubai timezone
│   ├── cases/                   # Cases domain logic
│   │   ├── pipelineStage.ts     # classifyStage(), PipelineStage type
│   │   └── storageType.ts       # normalizeStorageType()
│   ├── logistics/               # Logistics domain logic
│   │   └── normalizers.ts       # normalizeSite(), extractOriginCountry(), etc.
│   ├── data/                    # Static data
│   ├── map/                     # Map data (poiLocations.ts, flowLines.ts)
│   ├── hvdc/                    # HVDC domain logic
│   └── search/                  # Search index
├── scripts/
│   └── import-excel.mjs         # Excel → Supabase ETL (신규)
├── store/
│   └── logisticsStore.ts        # Zustand store
├── types/
│   ├── logistics.ts             # KPIData, LogisticsState
│   ├── cases.ts                 # CaseRow, StockRow, ShipmentRow, etc.
│   └── chain.ts                 # ChainSummary (신규)
├── public/                       # Static assets
├── supabase/
│   └── migrations/              # SQL 마이그레이션 파일
│       ├── 20260127_api_views.sql        # v_cases, v_flows, shipments 뷰
│       └── 20260313_add_shipment_columns.sql  # analytics 컬럼 + RPC 함수
├── .env.local                   # Environment variables (not committed)
├── next.config.ts               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
├── recreate-tables.mjs          # 개발전용 테이블 재생성
├── package.json
├── CHANGELOG.md
└── README.md
```

### 신규 컴포넌트 목록 (최근 추가)

| 컴포넌트 | 위치 | 용도 |
|----------|------|------|
| `SiteTypeTag` | `components/sites/SiteTypeTag.tsx` | 사이트 유형 태그 (온쇼어/오프쇼어) |
| `FlowChain` | `components/chain/` | 전체 물류 체인 시각화 |
| `OriginCountrySummary` | `components/chain/` | 출발지 국가별 요약 |
| `PipelineCasesTable` | `components/pipeline/PipelineCasesTable.tsx` | 파이프라인 케이스 테이블 |
| `PipelineTableWrapper` | `components/pipeline/PipelineTableWrapper.tsx` | 파이프라인 테이블 컨테이너 |
