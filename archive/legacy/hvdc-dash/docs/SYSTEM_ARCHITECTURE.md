# HVDC Logistics Dashboard - System Architecture

## 1. Executive Summary

The **HVDC Logistics Dashboard** is a mission-critical "Control Tower" application designed for Samsung C&T's HVDC Lightning Project. It provides real-time visibility into international logistics, integrating data from ERP systems (Excel exports) into a centralized, interactive web interface.

The system is built on a **Jamstack** architecture, leveraging **Next.js 16** for a responsive frontend, **Supabase** for a scalable serverless backend/database, and **Python** for robust data processing pipelines.

---

## 2. High-Level Architecture (Context View)

This diagram illustrates the macro-level data flow from raw Excel inputs to the end-user dashboard.

```mermaid
graph LR
    subgraph Data Sources
        Excel[HVDC STATUS.xlsx]
        ERP[ERP System]
    end

    subgraph Data Pipeline
        PythonScript[Python ETL Script]
        Pandas[Pandas Transformation]
        SupabaseClient[Supabase Client]
    end

    subgraph Backend Services
        SupabaseDB[(Supabase PostgreSQL)]
        Auth[Supabase Auth]
        API[PostgREST API]
    end

    subgraph Frontend Application
        NextJS[Next.js 16 App]
        Zustand[Zustand Store]
        UI[Modern Dashboard UI]
    end

    Excel --> PythonScript
    ERP -.-> Excel
    PythonScript --> Pandas
    Pandas --> SupabaseClient
    SupabaseClient --> SupabaseDB

    SupabaseDB <--> API
    API <--> NextJS
    NextJS <--> UI
    UI --> Zustand
```

---

## 3. Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16** | App Router, Server Components, React 19. |
| **Language** | **TypeScript** | Strict type safety for all components and stores. |
| **Styling** | **Tailwind CSS 4** | Utility-first CSS, configured for dark/light modes. |
| **State Management** | **Zustand** | Lightweight client-side state (Filters, Selection). |
| **Backend & DB** | **Supabase** | PostgreSQL 15, Auto-generated APIs, RLS Security. |
| **API Routes** | **Next.js API** | `/api/worklist` for dashboard data aggregation. |
| **Map Engine** | **Leaflet / SVG** | Hybrid approach for global route visualization. |
| **ETL & Migration** | **Python 3.10+** | Pandas for data cleaning, normalization, and upsert logic. |

---

## 4. Frontend Architecture (Logical View)

The frontend is structured around the **App Router** pattern, separating layout/shell concerns from business logic.

### 4.1 Component Hierarchy

```mermaid
graph TD
    RootLayout[layout.tsx] --> Providers[Providers Context]
    Providers --> DashboardLayout[DashboardLayout.tsx]

    DashboardLayout --> Sidebar[Sidebar.tsx]
    DashboardLayout --> Header[Header.tsx]
    DashboardLayout --> MainArea[Main Content]

    MainArea --> DashboardPage[Dashboard.tsx]

    DashboardPage --> API[API: /api/worklist]
    DashboardPage --> KPI[KpiStrip.tsx]

    DashboardPage --> ContentSplit[Grid Layout]
    ContentSplit --> WorklistSection[Worklist Area]
    ContentSplit --> DetailSection[Detail Drawer]

    WorklistSection --> SavedViews[SavedViewsBar.tsx]
    WorklistSection --> Toolbar[WorklistToolbar.tsx]
    WorklistSection --> Table[WorklistTable.tsx]

    DetailSection --> Tabs[Overview / Timeline / Docs]

    API --> Utils[worklist-utils.ts]
    Utils --> SupabaseDB[(Supabase DB)]
```

### 4.2 State Management (Zustand Store)

We use `zustand` to manage **Dashboard State** to avoid prop drilling and ensure instant UI feedback.

*   **Store**: `useDashboardStore`
*   **Slices**:
    *   `rows`: The raw shipment data array.
    *   `filters`: Active filter criteria (Gate, Search Query, Due Date).
    *   `savedViews`: Persisted user-defined views (JSON objects of filters).
    *   `selection`: ID of the currently selected shipment (controls Drawer).
    *   `ui`: Draw open/close state, active tab.

---

## 5. Backend & Database Architecture

The backend relies on Supabase, which provides a production-ready PostgreSQL database and auto-generated RESTful APIs.

### 5.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    SHIPMENTS {
        uuid id PK
        string sct_ship_no UK "Reference No"
        string gate "RED / GREEN"
        string vendor
        date eta
        date due_at
        jsonb coordinates "Inferred Port Coords"
    }

    CONTAINER_DETAILS {
        uuid id PK
        uuid shipment_id FK
        int qty_20dc
        int qty_40hq
        string type
    }

    WAREHOUSE_INVENTORY {
        uuid id PK
        uuid shipment_id FK
        date stored_at_mosb
        date stored_at_dsv
        int quantity
    }

    SHIPMENTS ||--o{ CONTAINER_DETAILS : "has"
    SHIPMENTS ||--o{ WAREHOUSE_INVENTORY : "stores"
```

### 5.2 Security Policies (RLS)
Row Level Security is enabled to protect sensitive logistics data.
*   **Anon (Public)**: Read-only access to non-sensitive dashboard stats (optional).
*   **Authenticated**: Full Read/Write access for authorized logistics operations teams.
*   **Service Role**: Used by Python ETL script for bulk `UPSERT` operations.

---

## 6. Data Pipeline (ETL Process)

The Python script (`scripts/hvdc_migration_script.py`) is the bridge between the legacy Excel workflow and the modern digital system.

### 6.1 ETL Flow Sequence

```mermaid
sequenceDiagram
    participant Excel as Excel File
    participant Script as Python Script
    participant Pandas as Pandas Lib
    participant DB as Supabase DB

    Note over Script: Start Migration
    Script->>Excel: Read .xlsx file
    Excel-->>Pandas: Load DataFrame

    loop For Each Row
        Pandas->>Pandas: Normalize Date Formats
        Pandas->>Pandas: Calculate 'Gate' Status
        Pandas->>Pandas: Infer 'Location' from dates

        Pandas->>Script: Return Cleaned Dict
        Script->>DB: UPSERT (on conflict sct_ship_no)
        DB-->>Script: Return New UUID

        Script->>DB: INSERT Container Details
        Script->>DB: INSERT Warehouse Data
    end

    Script->>Script: Generate Summary Report
```

---

## 7. API Architecture

### 7.1 Worklist API Endpoint

The `/api/worklist` endpoint provides aggregated dashboard data:

```typescript
GET /api/worklist
Response: {
  lastRefreshAt: string,  // Asia/Dubai timezone timestamp
  kpis: {
    driAvg: number,
    wsiAvg: number,
    redCount: number,
    overdueCount: number,
    recoverableAED: number,
    zeroStops: number
  },
  rows: WorklistRow[]
}
```

**Key Features**:
- Fetches shipments from Supabase with warehouse inventory join
- Converts DB rows to WorklistRow format using `worklist-utils.ts`
- Calculates KPIs using `calculateKpis()` function
- Uses Asia/Dubai timezone for all date comparisons
- Provides fallback data on errors to ensure UI stability

### 7.2 Timezone Handling

All date operations use **Asia/Dubai** timezone for consistency:
- `getDubaiToday()`: Returns today's date in YYYY-MM-DD format
- `getDubaiTimestamp()`: Returns current timestamp in YYYY-MM-DD HH:mm format
- Date comparisons in filters and KPI calculations use Dubai timezone

---

## 8. Deployment Strategy

*   **Development**: Local Node.js server (Port `3001`) proxying to remote Supabase.
*   **Production** (Planned):
    *   **Frontend**: Vercel (recommended for Next.js) or Docker Container on AWS ECS.
    *   **Database**: Managed Supabase instance (Cloud).
    *   **CI/CD**: GitHub Actions to trigger build on `main` branch push.

---
© 2026 Samsung C&T HVDC Project Team
