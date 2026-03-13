# Component Documentation — HVDC Logistics Dashboard

> **Version:** 1.0.0 | **Last Updated:** 2026-03-13
> **Component Count:** 37 custom components + Shadcn UI base

---

## Table of Contents

1. [Component Tree](#1-component-tree)
2. [Layout Components](#2-layout-components)
3. [Overview Components](#3-overview-components)
4. [Map Components](#4-map-components)
5. [Cargo Components](#5-cargo-components)
6. [Pipeline Components](#6-pipeline-components)
7. [Sites Components](#7-sites-components)
8. [UI Base Components (Shadcn)](#8-ui-base-components-shadcn)
9. [Custom Hooks](#9-custom-hooks)
10. [Component Communication Patterns](#10-component-communication-patterns)

---

## 1. Component Tree

```mermaid
graph TD
    App["App Root"]

    subgraph Layout["🏗️ Layout"]
        Sidebar["Sidebar"]
        DashboardHeader["DashboardHeader"]
        KpiProvider["KpiProvider"]
    end

    subgraph Overview["📊 Overview"]
        KpiStripCards["KpiStripCards"]
        OverviewMap["OverviewMap"]
        OverviewRightPanel["OverviewRightPanel"]
    end

    subgraph MapComponents["🗺️ Map"]
        HvdcPoiLayers["HvdcPoiLayers"]
        HeatmapLegend["HeatmapLegend"]
        Layers["layers/*"]
    end

    subgraph Cargo["📦 Cargo"]
        CargoTabs["CargoTabs"]
        ShipmentsTable["ShipmentsTable"]
        WhStatusTable["WhStatusTable"]
        DsvStockTable["DsvStockTable"]
        CargoDrawer["CargoDrawer"]
    end

    subgraph Pipeline["🔄 Pipeline"]
        FlowPipeline["FlowPipeline"]
        FlowCodeDonut["FlowCodeDonut"]
        CustomsStatusCard["CustomsStatusCard"]
    end

    subgraph Sites["📍 Sites"]
        SiteCards["SiteCards"]
        SiteDetail["SiteDetail"]
        AgiAlertBanner["AgiAlertBanner"]
    end

    subgraph UI["🎨 UI (Shadcn)"]
        Button["Button"]
        Card["Card"]
        Badge["Badge"]
        Input["Input"]
        Label["Label"]
        Select["Select"]
        Skeleton["Skeleton"]
        Switch["Switch"]
    end

    App --> Layout
    App --> Overview
    App --> Cargo
    App --> Pipeline
    App --> Sites
    Overview --> MapComponents
    App --> UI
```

---

## 2. Layout Components

### 2.1 Sidebar

**File:** `components/layout/Sidebar.tsx`

```mermaid
graph TD
    subgraph Sidebar["Sidebar Component"]
        Logo["Logo Section<br/>HVDC brand + version"]
        NavList["Navigation List<br/>ul > NavItem × 4"]
        Separator["Separator"]
        Footer["Footer<br/>version badge, settings icon"]
    end

    subgraph NavItem["NavItem (internal)"]
        Icon["Lucide icon"]
        Label["Text label (hidden when collapsed)"]
        ActiveIndicator["Active dot / background"]
    end

    NavList --> NavItem
```

**Props:**

```typescript
// No external props — reads route from usePathname()
// Internal state: isCollapsed (useState)
```

**Navigation Items:**

| Route | Icon | Label |
|-------|------|-------|
| `/overview` | `LayoutDashboard` | Overview |
| `/cargo` | `Package` | Cargo |
| `/pipeline` | `GitBranch` | Pipeline |
| `/sites` | `MapPin` | Sites |

**Behavior:**
- Toggle collapse: `Cmd+B` keyboard shortcut
- Active state: `pathname.startsWith(item.href)`
- Tooltip on collapsed: Shows full label on hover

---

### 2.2 DashboardHeader

**File:** `components/layout/DashboardHeader.tsx`

```mermaid
graph LR
    subgraph Header["DashboardHeader — h-14 border-b flex items-center px-6"]
        Left["Left: Page Title + Breadcrumb"]
        Center["Center: Search Bar (CommandK)"]
        Right["Right: Last Updated + Refresh Button"]
    end
```

**Props:**

```typescript
interface DashboardHeaderProps {
  title: string
  lastUpdated?: Date
  onRefresh?: () => void
}
```

**Features:**
- Breadcrumb: auto-generated from route path
- Last updated: formatted with `lib/time.ts` → Dubai timezone
- Search: triggers Command Palette (Cmd+K)

---

### 2.3 KpiProvider

**File:** `components/layout/KpiProvider.tsx`

```mermaid
sequenceDiagram
    participant Mount as Component Mount
    participant Fetch as fetch('/api/cases/summary')
    participant Context as KpiContext
    participant Children as Child Components

    Mount->>Fetch: useEffect on mount
    Fetch-->>Context: setKpiData(response)
    Context-->>Children: value = { kpiData, loading, error, refresh }
    Children->>Children: useKpiContext() → render KPIs

    Note over Fetch,Context: Re-fetches every 30s<br/>(fallback when WS unavailable)
```

**Context Shape:**

```typescript
interface KpiContextValue {
  kpiData: CasesSummary | null
  loading: boolean
  error: string | null
  refresh: () => void
  lastUpdated: Date | null
}
```

---

## 3. Overview Components

### 3.1 KpiStripCards

**File:** `components/overview/KpiStripCards.tsx`

```mermaid
graph LR
    subgraph Strip["KpiStripCards — grid grid-cols-4 gap-4"]
        Card1["Card 1<br/>📦 전체 케이스<br/>Total Cases<br/>30"]
        Card2["Card 2<br/>🏗️ 현장 도착<br/>Site Arrival<br/>10 (33.3%)"]
        Card3["Card 3<br/>🏭 창고 재고<br/>Warehouse Stock<br/>10 (33.3%)"]
        Card4["Card 4<br/>📊 Flow Code<br/>Distribution<br/>mini chart"]
    end
```

**KPI Card Structure:**

```mermaid
graph TD
    subgraph KpiCard["Individual KPI Card"]
        Header["Card Header<br/>icon + title"]
        Value["Primary Value<br/>(large number)"]
        SubValue["Sub-value<br/>(% or secondary metric)"]
        Trend["Trend indicator<br/>(↑↓ with color)"]
        Skeleton["Skeleton loader<br/>(while loading)"]
    end
```

**Props:**

```typescript
interface KpiCardProps {
  title: string
  titleKo: string        // Korean label
  value: number
  subValue?: string      // e.g. "33.3%"
  icon: LucideIcon
  color: 'blue' | 'green' | 'yellow' | 'purple'
  loading?: boolean
}
```

**Data Source:** `KpiContext` → `/api/cases/summary`

---

### 3.2 OverviewMap

**File:** `components/overview/OverviewMap.tsx`

```mermaid
graph TD
    subgraph OverviewMap["OverviewMap"]
        DeckGL["DeckGL Component<br/>(react wrapper)"]
        MapLibre["MaplibreMap<br/>(base map)"]
        subgraph Layers["Deck.gl Layers"]
            ScatterLayer["ScatterplotLayer<br/>(case locations)"]
            HeatLayer["HeatmapLayer<br/>(cargo density)"]
            IconLayer["IconLayer<br/>(HVDC POIs)"]
        end
        HvdcPoi["HvdcPoiLayers<br/>(site icons)"]
        Legend["HeatmapLegend<br/>(bottom-left)"]
        Controls["Map Controls<br/>(zoom, reset)"]
    end

    DeckGL --> MapLibre
    DeckGL --> Layers
    DeckGL --> HvdcPoi
    DeckGL --> Legend
    DeckGL --> Controls
```

**Map Configuration:**

```typescript
const INITIAL_VIEW_STATE = {
  longitude: 54.37,   // UAE center
  latitude: 24.45,
  zoom: 7,
  pitch: 30,
  bearing: 0,
}

const MAP_STYLE = 'https://tiles.protomaps.com/...'  // Dark tiles
```

**POI Sites (UAE):**

| Site | Code | Coordinates | Type |
|------|------|-------------|------|
| Abu Dhabi Grid | AGI | 24.45°N, 54.37°E | Site |
| Dubai Airport Site | DAS | 25.25°N, 55.36°E | Site |
| Mirfa Power Plant | MIR | 23.92°N, 52.78°E | Site |
| Shuweihat Plant | SHU | 24.13°N, 51.87°E | Site |
| Musaffah MOSB | MOSB | 24.33°N, 54.46°E | Hub |

---

### 3.3 OverviewRightPanel

**File:** `components/overview/OverviewRightPanel.tsx`

```mermaid
graph TD
    subgraph Panel["OverviewRightPanel — flex flex-col gap-4 overflow-y-auto"]
        Feed["Live Activity Feed<br/>(useLiveFeed hook)"]
        Alerts["Alert Cards<br/>(critical status)"]
        QuickStats["Quick Stats<br/>(top vendors, locations)"]
    end

    subgraph FeedItem["Feed Item"]
        Timestamp["time (Gulf TZ)"]
        Icon["status icon"]
        Description["event description"]
        Badge["flow code badge"]
    end

    Feed --> FeedItem
```

---

## 4. Map Components

### 4.1 HvdcPoiLayers

**File:** `components/map/HvdcPoiLayers.tsx`

```mermaid
graph LR
    subgraph HVDC_POI["HvdcPoiLayers"]
        IconData["hvdcPoiLocations[]<br/>(lib/map/hvdcPoiLocations.ts)"]
        DeckIconLayer["deck.gl IconLayer<br/>• custom SVG icons<br/>• tooltip on hover<br/>• click handler"]
        TextLayer["deck.gl TextLayer<br/>(site code labels)"]
    end

    IconData --> DeckIconLayer
    IconData --> TextLayer
```

### 4.2 HeatmapLegend

**File:** `components/map/HeatmapLegend.tsx`

Shows color scale for cargo density heatmap (blue → red gradient).

### 4.3 Map Layers

**Directory:** `components/map/layers/`

| Layer File | Deck.gl Layer | Data |
|------------|---------------|------|
| `ScatterLayer` | `ScatterplotLayer` | Case locations with status colors |
| `HeatLayer` | `HeatmapLayer` | Cargo density by location |
| `IconLayer` | `IconLayer` | HVDC site icons |

---

## 5. Cargo Components

### 5.1 CargoTabs

**File:** `components/cargo/CargoTabs.tsx`

```mermaid
graph TD
    subgraph CargoTabs["CargoTabs (Shadcn Tabs)"]
        TabsList["TabsList"]
        T1["TabsTrigger: Shipments"]
        T2["TabsTrigger: WH Status"]
        T3["TabsTrigger: DSV Stock"]
        TC1["TabsContent → ShipmentsTable"]
        TC2["TabsContent → WhStatusTable"]
        TC3["TabsContent → DsvStockTable"]
    end

    TabsList --> T1
    TabsList --> T2
    TabsList --> T3
    T1 --> TC1
    T2 --> TC2
    T3 --> TC3
```

---

### 5.2 ShipmentsTable

**File:** `components/cargo/ShipmentsTable.tsx`

```mermaid
graph TD
    subgraph Table["ShipmentsTable"]
        Toolbar["Toolbar<br/>(search, filter, export)"]
        Header["Table Header<br/>(sortable columns)"]
        Body["Table Body<br/>(paginated rows)"]
        Footer["Pagination Controls<br/>(prev/next, page size)"]
    end

    subgraph Columns["Table Columns"]
        C1["Shipment # (sortable)"]
        C2["Vendor (filterable)"]
        C3["Origin Port"]
        C4["ETA (sortable)"]
        C5["Status (badge)"]
        C6["B/L Number"]
    end

    Header --> Columns
```

**Props:**

```typescript
interface ShipmentsTableProps {
  onRowClick?: (shipment: ShipmentRow) => void
}
```

**Data Source:** `/api/shipments` (paginated)

---

### 5.3 WhStatusTable

**File:** `components/cargo/WhStatusTable.tsx`

Grid showing warehouse status per location with stock levels and utilization bars.

### 5.4 DsvStockTable

**File:** `components/cargo/DsvStockTable.tsx`

Paginated SKU-level stock table with quantity, unit, and location columns.

### 5.5 CargoDrawer

**File:** `components/cargo/CargoDrawer.tsx`

```mermaid
graph LR
    subgraph Drawer["CargoDrawer (Sheet component)"]
        Trigger["Row Click Trigger"]
        Sheet["Sheet (Radix Sheet)<br/>side='right' w-96"]
        Content["Detail Content<br/>• Shipment header<br/>• Timeline events<br/>• Document links<br/>• Related cases"]
    end

    Trigger --> Sheet
    Sheet --> Content
```

---

## 6. Pipeline Components

### 6.1 FlowPipeline

**File:** `components/pipeline/FlowPipeline.tsx`

```mermaid
graph LR
    subgraph Pipeline["FlowPipeline — horizontal scroll"]
        FC0["FC0<br/>Pre Arrival<br/>3 cases"]
        FC1["FC1<br/>Order Confirm<br/>5 cases"]
        FC2["FC2<br/>Port Dispatch<br/>8 cases"]
        FC3["FC3<br/>Customs Clear<br/>6 cases"]
        FC4["FC4<br/>WH Stock<br/>4 cases"]
        FC5["FC5<br/>Site Delivery<br/>4 cases"]
    end

    FC0 -->|"→"| FC1
    FC1 -->|"→"| FC2
    FC2 -->|"→"| FC3
    FC3 -->|"→"| FC4
    FC4 -->|"→"| FC5
```

**Flow Code Definitions:**

| Code | Stage | Status Meaning |
|------|-------|----------------|
| 0 | Pre Arrival | Not yet arrived in region |
| 1 | Order Confirmed | PO confirmed, awaiting shipment |
| 2 | Port Dispatch | Departed origin port |
| 3 | Customs Clearance | In UAE customs (MOIAT/FANR) |
| 4 | Warehouse Stock | At MOSB/DAS warehouse |
| 5 | Site Delivery | Delivered to project site |

---

### 6.2 FlowCodeDonut

**File:** `components/pipeline/FlowCodeDonut.tsx`

```mermaid
graph TD
    subgraph Donut["FlowCodeDonut (Recharts)"]
        PieChart["PieChart<br/>RadialBar variant"]
        Legend["Custom Legend<br/>(FC0-FC5 with counts)"]
        Center["Center label<br/>(total cases)"]
    end

    PieChart --> Legend
    PieChart --> Center
```

**Data:** Recharts `PieChart` with `Cell` per flow code, color-coded by stage progress.

### 6.3 CustomsStatusCard

**File:** `components/pipeline/CustomsStatusCard.tsx`

Shows UAE customs clearance status: MOIAT permits, FANR approvals, DOT transport permits.

---

## 7. Sites Components

### 7.1 SiteCards

**File:** `components/sites/SiteCards.tsx`

```mermaid
graph TD
    subgraph SiteCards["SiteCards — grid"]
        Card["SiteCard (per site)"]
        subgraph SiteCard["Individual SiteCard"]
            SiteHeader["Site code + full name"]
            ProgressBar["Flow stage progress bar"]
            Stats["Cases / SQM / Pending"]
            StatusBadge["Status badge"]
        end
    end

    Card --> SiteCard
```

**Props:**

```typescript
interface SiteCardProps {
  siteCode: 'AGI' | 'DAS' | 'MIR' | 'SHU' | 'MOSB'
  siteName: string
  caseCount: number
  arrivedCount: number
  pendingCount: number
  sqm: number
  flowDistribution: Record<number, number>
  onClick: (site: string) => void
}
```

### 7.2 SiteDetail

**File:** `components/sites/SiteDetail.tsx`

Expandable detail panel showing full case list for a selected site.

### 7.3 AgiAlertBanner

**File:** `components/sites/AgiAlertBanner.tsx`

```mermaid
graph TD
    subgraph Banner["AgiAlertBanner"]
        Condition{"AGI or DAS<br/>has critical alerts?"}
        Alert["Alert banner<br/>(amber/red background)<br/>dismissible"]
        Hidden["(hidden)"]
    end

    Condition -->|"yes"| Alert
    Condition -->|"no"| Hidden
```

Displays when AGI or DAS sites have Flow Code ≥ 3 items overdue (FANR/MOIAT regulation compliance).

---

## 8. UI Base Components (Shadcn)

**Directory:** `components/ui/`

```mermaid
graph TD
    subgraph Shadcn["Shadcn UI Components"]
        Button["Button<br/>variants: default|outline|ghost|destructive<br/>sizes: sm|default|lg|icon"]
        Card["Card<br/>Card · CardHeader · CardTitle<br/>CardDescription · CardContent · CardFooter"]
        Badge["Badge<br/>variants: default|secondary|outline|destructive"]
        Input["Input<br/>controlled text input"]
        Label["Label<br/>htmlFor association"]
        Select["Select<br/>Select · SelectTrigger · SelectContent<br/>SelectItem · SelectValue"]
        Skeleton["Skeleton<br/>loading placeholder animation"]
        Switch["Switch<br/>toggle boolean"]
    end
```

### Button Variants

```typescript
// Usage
<Button variant="outline" size="sm">Filter</Button>
<Button variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
```

### Card Anatomy

```typescript
<Card>
  <CardHeader>
    <CardTitle>KPI Title</CardTitle>
    <CardDescription>subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">30</p>
  </CardContent>
  <CardFooter>
    <p className="text-muted-foreground text-sm">+5 this week</p>
  </CardFooter>
</Card>
```

### Badge Color Mapping

| Status | Variant | Color |
|--------|---------|-------|
| `site` | `default` | Blue |
| `warehouse` | `secondary` | Purple |
| `Pre Arrival` | `outline` | Gray |
| `customs` | `destructive` | Amber |
| Flow Code 5 | `default` | Green |

---

## 9. Custom Hooks

```mermaid
graph TD
    subgraph Hooks["Custom Hooks — hooks/"]
        H1["useSupabaseRealtime<br/>WebSocket subscription<br/>with auto-reconnect"]
        H2["useKpiRealtime<br/>KPI-specific realtime<br/>= useSupabaseRealtime + KPI transform"]
        H3["useKpiRealtimeWithFallback<br/>= useKpiRealtime + polling fallback"]
        H4["useLiveFeed<br/>Activity event stream<br/>(last 50 events)"]
        H5["useInitialDataLoad<br/>Parallel Promise.all() fetch<br/>on component mount"]
        H6["useBatchUpdates<br/>Debounce rapid updates<br/>(300ms window)"]
        H7["useMultiTabSync<br/>BroadcastChannel<br/>cross-tab KPI sync"]
    end

    H1 --> H2
    H2 --> H3
```

### useSupabaseRealtime

```typescript
function useSupabaseRealtime<T>(options: {
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: RealtimePayload<T>) => void
  onError?: (error: Error) => void
}): {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  reconnectCount: number
}
```

**Reconnection Strategy:**
```
Attempt 1: 1s delay
Attempt 2: 2s delay
Attempt 3: 4s delay
Attempt 4: 8s delay
Attempt 5: 16s delay
Attempt 6+: 30s delay (max)
```

### useInitialDataLoad

```typescript
function useInitialDataLoad(): {
  cases: CaseRow[]
  summary: CasesSummary | null
  stock: StockRow[]
  loading: boolean
  error: string | null
}

// Internally uses:
// Promise.all([
//   fetch('/api/cases/summary'),
//   fetch('/api/cases'),
//   fetch('/api/stock'),
// ])
```

### useBatchUpdates

```typescript
function useBatchUpdates<T>(
  items: T[],
  delay: number = 300
): T[]

// Prevents UI thrashing during rapid realtime updates
// Buffers updates and applies them in a single render cycle
```

---

## 10. Component Communication Patterns

### Pattern 1: Context Provider (KPI data)

```mermaid
graph TD
    KpiProvider["KpiProvider (app/(dashboard)/layout)"]
    KpiContext["React.createContext()"]
    KpiStrip["KpiStripCards"]
    RightPanel["OverviewRightPanel"]
    Map["OverviewMap"]

    KpiProvider -->|"provides"| KpiContext
    KpiContext -->|"useContext()"| KpiStrip
    KpiContext -->|"useContext()"| RightPanel
    KpiContext -->|"useContext()"| Map
```

### Pattern 2: Zustand Store (global state)

```mermaid
graph LR
    Realtime["useSupabaseRealtime<br/>(hook)"]
    Store["logisticsStore<br/>(Zustand)"]
    Components["Components<br/>(useStore)"]

    Realtime -->|"store.upsertCase()"| Store
    Store -->|"selector subscription"| Components
    Note["Only components that<br/>subscribed to changed<br/>slice re-render"]
    Store -.-> Note
```

### Pattern 3: Prop Drilling (local state)

```mermaid
graph TD
    CargoPage["CargoPage (page.tsx)"]
    CargoTabs["CargoTabs<br/>(selectedRow, onRowClick)"]
    ShipmentsTable["ShipmentsTable<br/>(onRowClick prop)"]
    CargoDrawer["CargoDrawer<br/>(open, selectedRow)"]

    CargoPage -->|"selectedRow state"| CargoTabs
    CargoTabs -->|"onRowClick"| ShipmentsTable
    ShipmentsTable -->|"triggers setSelectedRow"| CargoPage
    CargoPage -->|"selectedRow prop"| CargoDrawer
```

### Pattern 4: URL State (filters)

```mermaid
graph LR
    FilterBar["Filter Controls<br/>(UI input)"]
    URL["URL Params<br/>?site=AGI&flow_code=3"]
    APIRoute["API Route<br/>reads searchParams"]
    Table["Data Table<br/>(re-renders on URL change)"]

    FilterBar -->|"router.push()"| URL
    URL -->|"useSearchParams()"| APIRoute
    APIRoute -->|"filtered response"| Table
```

### Pattern 5: Event Bridge (cross-page)

```mermaid
sequenceDiagram
    participant Map as OverviewMap
    participant Store as Zustand Store
    participant Pipeline as PipelinePage

    Map->>Store: store.setSelectedSite('AGI')
    Note over Store: selectedSite = 'AGI'
    Pipeline->>Store: useStore(s => s.selectedSite)
    Store-->>Pipeline: 'AGI'
    Pipeline->>Pipeline: filter pipeline by site
```

---

## Component Design Principles

```mermaid
mindmap
  root((Component Design))
    Composition
      Small focused components
      Compound component pattern
      Render prop where needed
    Performance
      React.memo for pure display
      useCallback for handlers
      useMemo for derived data
      Skeleton placeholders
    Accessibility
      Shadcn Radix primitives
      ARIA labels on icons
      Keyboard navigation
      Focus management
    Type Safety
      Props strictly typed
      No 'any' in components
      Discriminated unions
      Generic components
    Error Handling
      Error boundaries per section
      Graceful degradation
      Mock fallback data
      Toast notifications
```
