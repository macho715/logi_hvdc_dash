# System Architecture — HVDC Logistics Dashboard

> **Version:** 1.0.0 | **Last Updated:** 2026-03-13
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

## 1. Architecture Overview

```mermaid
graph TB
    subgraph Client["🌐 Browser Client"]
        NextApp["Next.js 16 App Router<br/>(React 19 SSR+CSR)"]
        Zustand["Zustand Store<br/>(Normalized State)"]
        DeckGL["Deck.gl + Maplibre<br/>(Map Visualization)"]
        Recharts["Recharts<br/>(Charts)"]
    end

    subgraph BFF["⚡ Next.js BFF Layer (Edge/Node)"]
        APIRoutes["API Routes<br/>/api/cases<br/>/api/cases/summary<br/>/api/stock<br/>/api/shipments"]
        Middleware["Middleware<br/>(Auth check, CORS)"]
    end

    subgraph Supabase["🗄️ Supabase Platform"]
        PostgREST["PostgREST<br/>(REST API)"]
        Realtime["Supabase Realtime<br/>(WebSocket)"]
        subgraph PG["PostgreSQL 15"]
            PublicSchema["public schema<br/>v_cases · v_flows<br/>v_shipments_status<br/>v_stock_onhand"]
            CaseSchema["case schema<br/>cases · flows"]
            StatusSchema["status schema<br/>shipments_status"]
            WhSchema["wh schema<br/>stock_onhand"]
        end
        Storage["Supabase Storage<br/>(Document files)"]
        Auth["Supabase Auth<br/>(Future)"]
    end

    subgraph External["🌍 External Services"]
        MapTiles["MapTiles CDN<br/>(Protomaps / OpenStreetMap)"]
        HVDC_API["HVDC ERP<br/>(Future integration)"]
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

    style Client fill:#1e293b,color:#f8fafc
    style BFF fill:#0f172a,color:#f8fafc
    style Supabase fill:#1a2a1a,color:#f8fafc
    style External fill:#1a1a2e,color:#f8fafc
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
        Pages["Pages<br/>overview · cargo<br/>pipeline · sites"]
        Layouts["Layouts<br/>RootLayout · DashboardLayout"]
        Components["Components<br/>KPI · Map · Tables<br/>Charts · Drawers"]
    end

    subgraph L2["Layer 2: Application Logic"]
        direction LR
        Hooks["Custom Hooks<br/>useRealtime · useKPI<br/>useLiveFeed · useBatch"]
        Store["Zustand Store<br/>state · actions<br/>selectors"]
        Context["React Context<br/>KpiProvider"]
    end

    subgraph L3["Layer 3: BFF / API"]
        direction LR
        RouteHandlers["Route Handlers<br/>/api/cases · /api/stock<br/>/api/shipments"]
        Transform["Data Transform<br/>aggregation · pagination<br/>filtering"]
    end

    subgraph L4["Layer 4: Data Access"]
        direction LR
        SupabaseClient["Supabase Client<br/>lib/supabase.ts"]
        MockFallback["Mock Fallback<br/>lib/api.ts"]
    end

    subgraph L5["Layer 5: Infrastructure"]
        direction LR
        DB["Supabase PostgreSQL<br/>multi-schema"]
        Realtime["Supabase Realtime<br/>WebSocket"]
        CDN["Edge CDN<br/>static assets"]
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
    BFF->>Supabase: SELECT * FROM v_cases
    Supabase->>DB: query public.v_cases → case.cases
    DB-->>Supabase: 30 rows
    Supabase-->>BFF: JSON response
    BFF->>BFF: Aggregate KPI data
    BFF-->>Browser: { totalCases: 30, bySite: {...}, ... }
    deactivate BFF

    Browser->>Browser: Zustand store.setKpi(data)
    Browser->>Browser: KPI cards render with real data
```

### 4.2 Realtime Update Flow

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

### 4.3 Filter / Search Flow

```mermaid
flowchart LR
    User["User Input<br/>(filter/search)"] --> Debounce["300ms Debounce"]
    Debounce --> URLParams["Update URL Params<br/>(useRouter.push)"]
    URLParams --> APIFetch["fetch('/api/cases?<br/>site=AGI&flow_code=3')"]
    APIFetch --> SupabaseQuery["Supabase Query<br/>.eq() / .in() / .ilike()"]
    SupabaseQuery --> Transform["Transform + Paginate"]
    Transform --> StoreUpdate["Store Update"]
    StoreUpdate --> Rerender["Table/Grid Re-render"]
```

---

## 5. API Architecture

```mermaid
graph LR
    subgraph Routes["API Route Handlers"]
        R1["/api/cases<br/>GET · paginated list"]
        R2["/api/cases/summary<br/>GET · KPI aggregation"]
        R3["/api/stock<br/>GET · warehouse stock"]
        R4["/api/shipments<br/>GET · shipment list"]
        R5["/api/events<br/>GET · activity events"]
        R6["/api/locations<br/>GET · location list"]
        R7["/api/location-status<br/>GET · per-location KPI"]
        R8["/api/worklist<br/>GET · work items"]
    end

    subgraph QueryParams["Query Parameters"]
        QP1["site: AGI|DAS|MIR|SHU|MOSB"]
        QP2["flow_code: 0|1|2|3|4|5"]
        QP3["status_current: site|warehouse|..."]
        QP4["vendor: string"]
        QP5["page: number (default 0)"]
        QP6["limit: number (default 50)"]
    end

    subgraph SupabaseViews["Supabase Views"]
        V1["public.v_cases"]
        V2["public.v_flows"]
        V3["public.v_shipments_status"]
        V4["public.v_stock_onhand"]
    end

    R1 --> V1
    R2 --> V1
    R3 --> V4
    R4 --> V3
    R5 --> V1
    R6 --> V1
    R7 --> V1
    R8 --> V1

    QueryParams -.->|"filter params"| R1
    QueryParams -.->|"filter params"| R3
```

### Response Schemas

```mermaid
classDiagram
    class CasesSummaryResponse {
        +totalCases: number
        +byStatus: Record~string, number~
        +bySite: Record~string, number~
        +bySiteArrived: Record~string, number~
        +byFlowCode: Record~number, number~
        +byVendor: Record~string, number~
        +bySqmByLocation: Record~string, number~
        +totalSqm: number
    }

    class CasesResponse {
        +data: CaseRow[]
        +count: number
        +page: number
        +limit: number
        +hasMore: boolean
    }

    class CaseRow {
        +id: string
        +case_number: string
        +vendor: string
        +site: string
        +status_current: string
        +flow_code: number
        +category: string
        +sqm: number
        +created_at: string
        +updated_at: string
    }

    class StockResponse {
        +data: StockRow[]
        +count: number
    }

    class StockRow {
        +id: string
        +sku: string
        +location: string
        +quantity: number
        +unit: string
        +last_updated: string
    }

    CasesResponse "1" --> "many" CaseRow
    StockResponse "1" --> "many" StockRow
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
    subgraph Before["❌ Array Pattern (slow updates)"]
        Arr["cases: CaseRow[]<br/>O(n) find by ID<br/>O(n) updates"]
    end

    subgraph After["✅ Map Pattern (fast updates)"]
        Map["cases: Map~id, CaseRow~<br/>O(1) find by ID<br/>O(1) updates"]
        Order["orderedIds: string[]<br/>(for display order)"]
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
        text case_number
        text vendor
        text site
        text status_current
        int flow_code
        text category
        decimal sqm
        text location
        timestamptz created_at
        timestamptz updated_at
    }

    CASE_FLOWS {
        uuid id PK
        uuid case_id FK
        int flow_code
        text stage
        text status
        timestamptz stage_at
        text notes
    }

    STATUS_SHIPMENTS_STATUS {
        uuid id PK
        text shipment_number
        text vendor
        text origin_port
        text dest_port
        text status
        text bl_number
        text container_number
        timestamptz eta
        timestamptz ata
        timestamptz created_at
    }

    WH_STOCK_ONHAND {
        uuid id PK
        text sku
        text description
        text location
        decimal quantity
        text unit
        text category
        timestamptz last_updated
    }

    CASE_CASES ||--o{ CASE_FLOWS : "has flows"
```

### Schema Isolation & View Layer

```mermaid
graph TB
    subgraph PG["PostgreSQL 15"]
        subgraph PublicSchema["public schema (PostgREST exposed)"]
            VC["VIEW v_cases"]
            VF["VIEW v_flows"]
            VS["VIEW v_shipments_status"]
            VW["VIEW v_stock_onhand"]
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
        PR["Exposes only<br/>public schema"]
    end

    PR --> VC
    PR --> VF
    PR --> VS
    PR --> VW

    VC -->|"SELECT *"| TC
    VF -->|"SELECT *"| TF
    VS -->|"SELECT *"| TS
    VW -->|"SELECT *"| TW

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

    Server -->|"async data fetch"| Supabase["Supabase Query<br/>(server-side)"]
    Server -->|"pass as props"| Client

    Client -->|"dynamic data"| APIFetch["fetch('/api/...')"]
    Client -->|"realtime"| WebSocket["Supabase Realtime WS"]

    subgraph Strategy["Rendering Decisions"]
        S1["Layout.tsx → Server<br/>(navigation, shell)"]
        S2["KpiStripCards → Client<br/>(realtime updates)"]
        S3["OverviewMap → Client<br/>(WebGL, browser APIs)"]
        S4["Tables → Client<br/>(sort, filter, pagination)"]
        S5["Static text → Server<br/>(SEO, performance)"]
    end
```

---

## 10. Security Architecture

```mermaid
graph TD
    subgraph PublicAccess["Public (Anon Key)"]
        AnonKey["NEXT_PUBLIC_SUPABASE_ANON_KEY<br/>(browser-safe, read-only)"]
    end

    subgraph ServerAccess["Server-only (Service Role)"]
        ServiceKey["SUPABASE_SERVICE_ROLE_KEY<br/>(never exposed to browser)<br/>Used only in API routes"]
    end

    subgraph RLS["Row Level Security Policies"]
        P1["v_cases: SELECT ONLY<br/>for anon + authenticated"]
        P2["v_flows: SELECT ONLY<br/>for anon + authenticated"]
        P3["v_shipments_status: SELECT ONLY<br/>for anon + authenticated"]
        P4["v_stock_onhand: SELECT ONLY<br/>for anon + authenticated"]
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

---

## 11. Performance Architecture

```mermaid
graph LR
    subgraph Optimizations["Performance Optimizations"]
        direction TB
        O1["🗜️ Turbopack<br/>Fast dev builds<br/>Module dedup"]
        O2["🧠 React.memo()<br/>Stable selector refs<br/>Shallow equality"]
        O3["📦 Zustand normalized<br/>Map-based O(1) lookup<br/>Selective subscriptions"]
        O4["🔄 Debounced updates<br/>useBatchUpdates<br/>300ms debounce"]
        O5["🗺️ Deck.gl GPU<br/>WebGL 2.0 layers<br/>Instance rendering"]
        O6["📡 WS dedup<br/>BroadcastChannel<br/>Single WS per origin"]
        O7["💾 SWR-like cache<br/>staleTime: 30s<br/>API response cache"]
        O8["🖼️ Image optimization<br/>next/image<br/>WebP conversion"]
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
    subgraph Local["💻 Local Development"]
        Dev["next dev (Turbopack)<br/>localhost:3001"]
        LocalDB["Supabase Cloud<br/>(shared dev project)"]
    end

    subgraph CI["🔄 CI/CD (GitHub Actions)"]
        Lint["ESLint + TypeScript check"]
        Test["Vitest unit tests"]
        Build["next build"]
    end

    subgraph Prod["🚀 Production"]
        Vercel["Vercel<br/>(Edge Network)"]
        SupabaseProd["Supabase Production<br/>rkfffveonaskewwzghex"]
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
│   │   └── sites/page.tsx       # Site status
│   └── api/                     # BFF Route Handlers
│       ├── cases/route.ts
│       ├── cases/summary/route.ts
│       ├── stock/route.ts
│       ├── shipments/route.ts
│       ├── events/route.ts
│       ├── locations/route.ts
│       ├── location-status/route.ts
│       └── worklist/route.ts
├── components/                   # React Components
│   ├── layout/                  # Shell components
│   ├── overview/                # Overview page components
│   ├── map/                     # Deck.gl map components
│   ├── cargo/                   # Cargo page components
│   ├── pipeline/                # Pipeline page components
│   ├── sites/                   # Sites page components
│   └── ui/                      # Shadcn base components
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities & clients
│   ├── supabase.ts              # Supabase client
│   ├── api.ts                   # Fetch + mock fallback
│   ├── utils.ts                 # cn() utility
│   ├── time.ts                  # Dubai timezone
│   ├── data/                    # Static data
│   ├── map/                     # Map data
│   ├── hvdc/                    # HVDC domain logic
│   └── search/                  # Search index
├── store/
│   └── logisticsStore.ts        # Zustand store
├── types/
│   ├── logistics.ts             # KPIData, LogisticsState
│   └── cases.ts                 # CaseRow, StockRow, etc.
├── public/                       # Static assets
├── .env.local                   # Environment variables (not committed)
├── next.config.ts               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config
├── package.json
├── CHANGELOG.md
└── README.md
```
