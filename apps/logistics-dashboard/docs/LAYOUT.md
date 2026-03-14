# Layout Documentation — HVDC Logistics Dashboard

> **Version:** 1.3.0 | **Last Updated:** 2026-03-14
> **Framework:** Next.js 16 App Router | **Theme:** Dark (forced)

---

## Table of Contents

1. [Layout Hierarchy](#1-layout-hierarchy)
2. [Root Layout](#2-root-layout)
3. [Dashboard Shell Layout](#3-dashboard-shell-layout)
4. [Overview Page Layout](#4-overview-page-layout)
5. [Cargo Page Layout](#5-cargo-page-layout)
6. [Pipeline Page Layout](#6-pipeline-page-layout)
7. [Sites Page Layout](#7-sites-page-layout)
8. [Chain Page Layout](#8-chain-page-layout)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Navigation Flow](#10-navigation-flow)
11. [CSS Architecture](#11-css-architecture)

---

## 0. Overview Cockpit Update

- `/overview` keeps the integrated invariant: `상단 KPI rail + 좌측 MapView + 우측 RightPanel + 하단 HVDC panel`
- Every clickable overview card or map target now navigates to `/pipeline`, `/sites`, `/cargo`, or `/chain`
- Destination pages restore state from URL and show plain-language context chips
- Overview page data is now sourced from `GET /api/overview` and hydrated through page-local `useOverviewData()`
- Public route labels come from `configs/overview.route-types.json`; destination contracts come from `configs/overview.destinations.json`

## 1. Layout Hierarchy

```mermaid
graph TD
    Root["app/layout.tsx<br/>RootLayout<br/>(html · body · dark class<br/>suppressHydrationWarning)"]
    Dashboard["app/(dashboard)/layout.tsx<br/>DashboardLayout<br/>(sidebar + main area)"]
    Overview["app/(dashboard)/overview/page.tsx<br/>Overview Page"]
    Cargo["app/(dashboard)/cargo/page.tsx<br/>Cargo Page"]
    Pipeline["app/(dashboard)/pipeline/page.tsx<br/>Pipeline Page"]
    Sites["app/(dashboard)/sites/page.tsx<br/>Sites Page"]
    Chain["app/(dashboard)/chain/page.tsx<br/>Chain Page"]
    Home["app/page.tsx<br/>redirect → /overview"]

    Root --> Dashboard
    Root --> Home
    Dashboard --> Overview
    Dashboard --> Cargo
    Dashboard --> Pipeline
    Dashboard --> Sites
    Dashboard --> Chain

    style Root fill:#1e293b,color:#e2e8f0
    style Dashboard fill:#0f172a,color:#e2e8f0
```

---

## 2. Root Layout

**File:** `app/layout.tsx`

```mermaid
graph TD
    subgraph HTML["<html lang='en' className='dark text-foreground font-sans' suppressHydrationWarning>"]
        subgraph Body["<body className='font-sans antialiased' suppressHydrationWarning>"]
            Font["Geist + Geist_Mono<br/>(next/font/google)"]
            Children["{children}"]
            Analytics["Vercel Analytics<br/>(production only)"]
        end
    end
```

### Layout Properties

| Property | Value | Purpose |
|----------|-------|---------|
| `lang` | `"en"` | Language attribute |
| `className` | `"dark text-foreground font-sans"` | Forces dark theme + base typography |
| `suppressHydrationWarning` (html) | `true` | Suppress hydration mismatch on `<html>` |
| `suppressHydrationWarning` (body) | `true` | Suppress hydration mismatch on `<body>` |
| `font` | Geist, Geist_Mono | CSS variable `--font-geist` / `--font-geist-mono` |
| Meta `title` | `"MOSB Logistics Dashboard"` | Browser tab title |
| Meta `description` | Real-time logistics monitoring | SEO |
| `themeColor` | `"#0a0a0a"` | Mobile browser chrome color |

### Font Configuration

```typescript
const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })
```

### Hydration Warning Suppression

`suppressHydrationWarning` is applied to both the `<html>` and `<body>` elements. This is required because browser extensions (notably Kapture and similar DevTools extensions) inject attributes into the DOM before React hydration completes, causing React to detect a mismatch between server-rendered HTML and the client DOM. The prop tells React to skip the mismatch check for these top-level elements only.

**Why this is safe here:** The attributes injected by extensions (e.g., `data-*` attributes) do not affect rendering or logic — they are purely extension-internal metadata. Suppressing the warning at this level does not mask genuine application hydration bugs.

**Scope:** `suppressHydrationWarning` only suppresses warnings one level deep — it does not disable hydration checking for the entire subtree. Application components deeper in the tree are still fully hydration-checked.

---

## 3. Dashboard Shell Layout

**File:** `app/(dashboard)/layout.tsx`

```mermaid
graph LR
    subgraph DashboardLayout["DashboardLayout — flex h-screen bg-gray-950 text-gray-100 overflow-hidden"]
        Sidebar["Sidebar<br/>w-48 (expanded)<br/>w-14 (collapsed)<br/>flex-shrink-0"]
        subgraph Main["Main — flex flex-col flex-1 overflow-hidden"]
            KpiProvider["KpiProvider<br/>(Supabase Realtime subscription)"]
            Header["DashboardHeader<br/>h-14 border-b"]
            Content["<main> — flex-1 overflow-auto<br/>{children}"]
        end
    end

    Sidebar -->|"navigation"| Main
```

### Sidebar Dimensions

```mermaid
graph LR
    subgraph Sidebar["Sidebar Component"]
        direction TB
        Logo["Logo / Brand<br/>border-b"]
        Nav["Navigation Items<br/>flex-1 py-2"]
        Item1["🗺️ Overview"]
        Item2["⛓️ 물류 체인"]
        Item3["🔄 Pipeline"]
        Item4["🏗️ Sites"]
        Item5["📦 Cargo"]
    end

    Nav --> Item1
    Nav --> Item2
    Nav --> Item3
    Nav --> Item4
    Nav --> Item5
```

| State | Width | Behavior |
|-------|-------|----------|
| Expanded | `w-48` (192px) | Shows icon + label |
| Collapsed | `w-14` (56px) | Shows icon only |
| Mobile | `hidden` | Off-canvas (future) |

### Grid Layout Diagram

```
┌────────────────────────────────────────────────────────┐
│                    100vw × 100vh                       │
├──────────┬─────────────────────────────────────────────┤
│          │  KpiProvider (invisible, Realtime hook)     │
│          ├─────────────────────────────────────────────┤
│ Sidebar  │  DashboardHeader (h-14)                     │
│ (w-48)   ├─────────────────────────────────────────────┤
│          │                                             │
│          │  <main> — flex-1 overflow-auto              │
│          │  {page content}                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

---

## 4. Overview Page Layout

**File:** `app/(dashboard)/overview/OverviewPageClient.tsx`

> Layout type changed from grid-based to **flex column** in v1.3.0 to support
> a fixed bottom panel and proper viewport-filling behaviour without overflow.
> v1.3.0 also adds `OverviewToolbar` as the first child above `KpiStripCards`.

```
OverviewPageClient (flex col, h-full, overflow-hidden)
├── OverviewToolbar        ← NEW (v1.3.0): ~44px, search + toggles + button
├── KpiStripCards          ← ~80px KPI rail (5 cards)
├── Middle section (flex-1, min-h-0)
│   ├── OverviewMap        ← left, flex-1, min-h-[360px]
│   └── OverviewRightPanel ← right, xl:w-[360px], overflow-y-auto
│       └── ShipmentDetailCard ← NEW (v1.3.0): shown when shipment selected
└── OverviewBottomPanel    ← ~240px, worklist + pipeline strip
```

```mermaid
graph TD
    OPC["OverviewPageClient\nflex col · h-full · overflow-hidden"]
    OT["OverviewToolbar\n~44px · border-b"]
    KSC["KpiStripCards\n~80px · 5 KPI cards"]
    MID["Middle Section\nflex-1 · min-h-0 · flex row"]
    MAP["OverviewMap\nflex-1 · min-h-360px"]
    ORP["OverviewRightPanel\nw-80 · overflow-y-auto"]
    SDC["ShipmentDetailCard\n(when selected)"]
    OBP["OverviewBottomPanel\n~240px · pipeline + worklist"]

    OPC --> OT
    OPC --> KSC
    OPC --> MID
    MID --> MAP
    MID --> ORP
    ORP --> SDC
    OPC --> OBP
```

The older mermaid diagram (pre-v1.3.0):

```mermaid
graph TD
    subgraph OverviewPageClient["OverviewPageClient — flex h-full flex-col overflow-hidden"]
        KpiStrip["KpiStripCards<br/>5 cards · ~138px fixed height"]
        subgraph Middle["Middle Section — flex min-h-0 flex-1<br/>flex-col xl:flex-row"]
            MapArea["OverviewMap<br/>min-h-[360px] flex-1"]
            RightPanel["OverviewRightPanel<br/>xl:w-[360px] overflow-y-auto"]
        end
        BottomPanel["OverviewBottomPanel<br/>~240px fixed height"]
    end

    KpiStrip --> Middle
    Middle --> BottomPanel
```

### OverviewToolbar Layout (v1.3.0)

**File:** `components/overview/OverviewToolbar.tsx`

The toolbar sits between the `DashboardHeader` and `KpiStripCards`, using `flex items-center justify-between` with a `border-b border-gray-800` separator and approximately **44px** height.

```
┌──────────────────────────────────────────────────────────┐
│  [ShipmentSearchBar w-72]  [🌐 Arc][🚢 항차][🔥 Heat]  [신규 항차 ▸] │
│  ← left ──────────────── center ──────────────── right →  │
└──────────────────────────────────────────────────────────┘
                  ~44px · border-b · flex items-center justify-between
```

| Zone | Component | Layout class | Notes |
|------|-----------|-------------|-------|
| Left | `ShipmentSearchBar` | `w-72 relative` | Dropdown positioned `absolute top-full z-50` |
| Center | `MapLayerToggles` | `flex gap-2` | Pill buttons |
| Right | 신규 항차 button | — | Blue (`bg-blue-600`), opens `NewVoyageModal` |

**ShipmentSearchBar dropdown z-index:** The input wrapper uses `position: relative` and the results dropdown uses `z-50` to float above the map and KPI strip without being clipped.

**MapLayerToggles pill states:**

```
Active:   bg-blue-600/80  text-white
Inactive: bg-gray-800     text-gray-400
```

Each pill directly toggles a boolean field in `logisticsStore` — no prop threading required.

---

### KPI Strip Layout

5개 카드, `flex` 행, 고정 높이 ~138px (패딩 포함).

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Total   │  현장    │  창고    │  Flow    │  긴급    │
│  Cases   │  도착    │  재고    │  Code    │  알람    │
│  30      │  10      │  10      │  Dist.   │   2      │
└──────────┴──────────┴──────────┴──────────┴──────────┘
                  flex row · 5 cards · ~138px
```

### Middle Section Layout

`flex-1` + `min-h-0` 조합으로 KPI strip과 bottom panel 사이의 남은 공간을 채운다.
`xl` 미만: 세로 적층 / `xl` 이상: 가로 배치.

```
┌─────────────────────────────────────┬───────────────────┐
│                                     │  OverviewRight    │
│  OverviewMap                        │  Panel            │
│  (Deck.gl + MapLibre)               │  xl:w-[360px]     │
│                                     │                   │
│  min-h-[360px]                      │  4개 섹션:        │
│  flex-1 (남은 가로 공간 차지)       │  • 예외 보드      │
│                                     │  • 운송 경로 요약 │
│                                     │  • 현장 준비도    │
│                                     │  • 최근 활동      │
│                                     │  overflow-y-auto  │
└─────────────────────────────────────┴───────────────────┘
```

### Bottom Panel Layout

`border-t border-gray-800 bg-gray-950/60 p-4`, 총 높이 ~240px.

```
┌─────────────────────────────────────┬──────────────────┐
│  Pipeline Stages                    │  Priority        │
│                                     │  Worklist        │
│  [FC0] [FC1] [FC2] [FC3] [FC4]      │                  │
│  md:grid-cols-5 버튼 행             │  max-h-[160px]   │
│                                     │  overflow-y-auto │
│  xl:grid-cols-[1.5fr_1fr]           │                  │
└─────────────────────────────────────┴──────────────────┘
                      ~240px
```

내부 구조:
- 컨테이너: `grid gap-4 xl:grid-cols-[1.5fr_1fr]`
- 왼쪽: Pipeline 단계 버튼 5개 (`md:grid-cols-5`)
- 오른쪽: Priority Worklist (`max-h-[160px] overflow-y-auto`)

### Height Budget (viewport ~739px 기준, v1.3.0)

| Zone | Height | Notes |
|------|--------|-------|
| OverviewToolbar | ~44px | 고정 (v1.3.0 신규) |
| KPI Strip | ~80px | 고정 |
| Bottom Panel | ~240px | 고정 (pipeline + worklist max-h-[160px]) |
| Middle (flex-1) | ~375px | 739 − 44 − 80 − 240 |
| Map min-h | 360px | min-h-[360px] 충족 ✓ |
| Right Panel content | ~343px | 375px − 32px(padding), overflow-y-auto |

### KpiProvider Context Tree

```mermaid
graph TD
    KpiProvider["KpiProvider<br/>(useKpiRealtime → public.shipments<br/>fallback: /api/cases/summary every 30s)"]
    KpiContext["KpiContext<br/>(React Context)"]
    Strip["KpiStripCards<br/>(useContext)"]
    RightPanel["OverviewRightPanel<br/>(useContext)"]
    Map["OverviewMap<br/>(useContext for heatmap)"]

    KpiProvider --> KpiContext
    KpiContext --> Strip
    KpiContext --> RightPanel
    KpiContext --> Map
```

---

## 5. Cargo Page Layout

**File:** `app/(dashboard)/cargo/page.tsx`

```mermaid
graph TD
    subgraph CargoPage["Cargo Page — space-y-4"]
        PageHeader["Page Header<br/>title + filter bar"]
        CargoTabs["CargoTabs<br/>(Shadcn Tabs component)"]
        subgraph TabContent["Tab Content"]
            Tab1["Shipments Tab<br/>ShipmentsTable<br/>(sortable, paginated)"]
            Tab2["WH Status Tab<br/>WhStatusTable<br/>(location grid)"]
            Tab3["DSV Stock Tab<br/>DsvStockTable<br/>(SKU list)"]
        end
        CargoDrawer["CargoDrawer<br/>(slide-over, conditional render)"]
    end

    CargoTabs --> Tab1
    CargoTabs --> Tab2
    CargoTabs --> Tab3
```

### Cargo Page Grid

```
┌────────────────────────────────────────────────────────┐
│  Page Header + Filter Bar                              │
├────────────────────────────────────────────────────────┤
│  [Shipments] [WH Status] [DSV Stock]  ← Tabs           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Active Tab Content (full width)                       │
│  • Sortable columns                                    │
│  • Pagination controls                                 │
│  • Row click → CargoDrawer opens from right            │
│                                                        │
└────────────────────────────────────────────────────────┘

                                     ┌──────────────┐
                                     │ CargoDrawer  │
                                     │ (w-96 slide) │
                                     │              │
                                     └──────────────┘
```

---

## 6. Pipeline Page Layout

**File:** `app/(dashboard)/pipeline/page.tsx`

```mermaid
graph TD
    subgraph PipelinePage["Pipeline Page — space-y-4"]
        FilterBar["Filter Bar<br/>(site, date range, vendor)"]
        subgraph ContentGrid["Content Grid — grid grid-cols-3 gap-4"]
            Pipeline["FlowPipeline<br/>col-span-2<br/>(horizontal flow stages)"]
            subgraph SidePanel["Side Panel col-span-1"]
                Donut["FlowCodeDonut<br/>(Recharts donut chart)"]
                Customs["CustomsStatusCard"]
            end
        end
        TableWrapper["PipelineTableWrapper<br/>(reads activePipelineStage from casesStore)<br/>→ PipelineFilterBar + PipelineCasesTable"]
    end

    FilterBar --> ContentGrid
    Pipeline -->|"click stage → sets casesStore.activePipelineStage"| TableWrapper
```

### Flow Pipeline Visual

```
Flow Code Progression:
┌──────┬──────┬──────┬──────┬──────┬──────┐
│  FC0 │  FC1 │  FC2 │  FC3 │  FC4 │  FC5 │
│      │      │      │      │      │      │
│ Pre  │Order │ Port │Customs│  WH  │ Site │
│Arrive│ Conf │ Disp │Clear │Stock │Deliv │
│  3   │  5   │  8   │  6   │  4   │  4   │
└──────┴──────┴──────┴──────┴──────┴──────┘
  ←────────── Flow direction ──────────→
```

---

## 7. Sites Page Layout

**File:** `app/(dashboard)/sites/page.tsx`

```mermaid
graph TD
    subgraph SitesPage["Sites Page — space-y-4"]
        AgiAlert["AgiAlertBanner<br/>(conditional — AGI arrival rate < 50%<br/>shows stage breakdown: 창고 N건 · MOSB N건 · 선적 전 N건)"]
        subgraph SiteGrid["Site Cards Grid — grid grid-cols-2 gap-4 lg:grid-cols-3"]
            AGI["AGI Card"]
            DAS["DAS Card"]
            MIR["MIR Card"]
            SHU["SHU Card"]
            MOSB["MOSB Card"]
        end
        SiteDetail["SiteDetail<br/>(expandable panel)"]
    end

    AgiAlert --> SiteGrid
    SiteGrid -->|"click card"| SiteDetail
```

### Site Card Layout

```
┌─────────────────────────────┐
│  AGI — Abu Dhabi Grid (ADWEA)│
│  ●●●●●○ Flow Stage Progress │
├─────────────────────────────┤
│  Cases: 8    Pending: 2     │
│  SQM: 450    In Transit: 3  │
├─────────────────────────────┤
│  ▓▓▓▓▓▓▓░░░  67% complete  │
└─────────────────────────────┘
```

---

## 8. Chain Page Layout

**File:** `app/(dashboard)/chain/page.tsx`

Route: `/chain` — 전체 물류 체인 시각화 (FlowChain + OriginCountrySummary)

```mermaid
graph TD
    subgraph ChainPage["Chain Page — h-full overflow-auto p-4"]
        FlowChain["FlowChain (compact=false)"]
        subgraph FlowChainContent["FlowChain internals"]
            OriginSummary["OriginCountrySummary<br/>(top — bar chart of origin countries)"]
            NodeSection["전체 물류 체인 section<br/>(5-node pipeline grid + MOSB badge)"]
            NodeGrid["ChainNode × 5<br/>원산지 → 항구 → 창고 → MOSB → 현장"]
            DetailsGrid["Details grid (3 cols)<br/>원산지·항구 현황 | 육상 현장 | 해상 현장"]
            CasesTable["PipelineCasesTable<br/>(bottom — stage-filtered case rows)"]
        end
    end

    FlowChain --> OriginSummary
    FlowChain --> NodeSection
    NodeSection --> NodeGrid
    NodeSection --> DetailsGrid
    FlowChain --> CasesTable
    NodeGrid -->|"click → setSelectedStage"| CasesTable
```

### Chain Page Visual Structure

```
┌────────────────────────────────────────────────────────┐
│  OriginCountrySummary                                  │
│  원산지 집계 — POL 기준 상위 국가 (bar chart)            │
├────────────────────────────────────────────────────────┤
│  전체 물류 체인                      [MOSB 경유 N건]   │
│  ┌────────┬──────┬──────┬──────┬──────┐               │
│  │ Pre-   │ Port │  WH  │ MOSB │ Site │  ← clickable  │
│  │arrival │      │      │      │      │    ChainNodes  │
│  └────────┴──────┴──────┴──────┴──────┘               │
│                                                        │
│  ┌──────────────────┬────────────┬──────────────────┐  │
│  │ 원산지 / 항구 현황│  육상 현장  │    해상 현장     │  │
│  │ Top 5 + 항구목록  │  SHU / MIR │   DAS / AGI      │  │
│  └──────────────────┴────────────┴──────────────────┘  │
├────────────────────────────────────────────────────────┤
│  PipelineCasesTable                                    │
│  (rows for selected stage — max-h-360px scrollable)    │
└────────────────────────────────────────────────────────┘
```

**Data flow:** `FlowChain` fetches `GET /api/chain/summary` on mount. Clicking a `ChainNode` sets `selectedStage` (local state), which is passed as the `stage` prop to `PipelineCasesTable`. The table independently fetches `/api/cases?stage=<stage>`.

---

## 9. Responsive Breakpoints

```mermaid
graph LR
    subgraph Breakpoints["Tailwind CSS Breakpoints"]
        SM["sm: 640px<br/>(mobile landscape)"]
        MD["md: 768px<br/>(tablet)"]
        LG["lg: 1024px<br/>(desktop)"]
        XL["xl: 1280px<br/>(wide)"]
        XXL["2xl: 1536px<br/>(ultrawide)"]
    end

    subgraph Behavior["Layout Behavior per Breakpoint"]
        B1["< md:<br/>Sidebar hidden<br/>Single column"]
        B2["md - lg:<br/>Sidebar collapsed<br/>2-column overview"]
        B3["lg+:<br/>Sidebar expanded<br/>3-column overview<br/>Full KPI strip"]
    end

    SM --> B1
    MD --> B2
    LG --> B3
    XL --> B3
    XXL --> B3
```

### Grid Responsiveness

| Component | Mobile (<md) | Tablet (md-lg) | Desktop (lg+) |
|-----------|-------------|----------------|---------------|
| KPI Strip | 2 cols | 4 cols | 4 cols |
| Overview Main | 1 col | 2 cols | 3 cols |
| Site Cards | 1 col | 2 cols | 3 cols |
| Chain Details | 1 col | 2 cols | 3 cols |
| Sidebar | hidden | w-14 | w-48 |
| Cargo Tables | scroll-x | scroll-x | full width |

---

## 10. Navigation Flow

```mermaid
flowchart TD
    Root["/"] -->|"redirect"| Overview["/overview"]

    Overview -->|"sidebar click"| Chain["/chain"]
    Overview -->|"sidebar click"| Cargo["/cargo"]
    Overview -->|"sidebar click"| Pipeline["/pipeline"]
    Overview -->|"sidebar click"| Sites["/sites"]

    Chain -->|"sidebar click"| Overview
    Chain -->|"sidebar click"| Cargo
    Chain -->|"sidebar click"| Pipeline
    Chain -->|"sidebar click"| Sites

    Cargo -->|"sidebar click"| Overview
    Cargo -->|"sidebar click"| Chain
    Cargo -->|"sidebar click"| Pipeline
    Cargo -->|"sidebar click"| Sites

    Pipeline -->|"sidebar click"| Overview
    Pipeline -->|"sidebar click"| Chain
    Pipeline -->|"sidebar click"| Cargo
    Pipeline -->|"sidebar click"| Sites

    Sites -->|"sidebar click"| Overview
    Sites -->|"sidebar click"| Chain
    Sites -->|"sidebar click"| Cargo
    Sites -->|"sidebar click"| Pipeline

    subgraph Breadcrumb["DashboardHeader Breadcrumbs"]
        BC1["/ Dashboard / Overview"]
        BC2["/ Dashboard / Chain"]
        BC3["/ Dashboard / Cargo"]
        BC4["/ Dashboard / Pipeline"]
        BC5["/ Dashboard / Sites"]
    end

    Overview -.-> BC1
    Chain -.-> BC2
    Cargo -.-> BC3
    Pipeline -.-> BC4
    Sites -.-> BC5
```

### Active Route Indication

```typescript
// Sidebar uses usePathname() for active detection
const pathname = usePathname()
const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

// Applied classes:
// Active:   "bg-blue-600 text-white"
// Inactive: "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
```

---

## 11. CSS Architecture

```mermaid
graph TD
    subgraph CSSLayers["CSS Architecture"]
        GlobalCSS["globals.css<br/>(CSS custom properties)"]
        TailwindBase["Tailwind Base Layer<br/>(@layer base)"]
        TailwindComponents["Tailwind Components<br/>(@layer components)"]
        TailwindUtilities["Tailwind Utilities<br/>(inline className)"]
        ShadcnTokens["Shadcn CSS Variables<br/>(--background, --foreground, etc.)"]
    end

    GlobalCSS --> TailwindBase
    TailwindBase --> TailwindComponents
    TailwindComponents --> TailwindUtilities
    ShadcnTokens --> TailwindBase
```

### CSS Custom Properties (Dark Theme)

```css
/* globals.css — dark theme tokens */
:root {
  --background: 222.2 84% 4.9%;      /* deep navy */
  --foreground: 210 40% 98%;          /* near-white */
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
  --radius: 0.5rem;
}
```

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `p-4` | 16px | Card internal padding |
| `p-6` | 24px | Page content padding |
| `gap-4` | 16px | Grid/flex gap |
| `space-y-4` | 16px | Vertical stack spacing |
| `space-y-6` | 24px | Section spacing |
| `h-14` | 56px | Header height |
| `h-24` | 96px | KPI card height |

### Z-Index Layers

```mermaid
graph BT
    Base["z-0: Page content"]
    Map["z-10: Map layers"]
    MapControls["z-20: Map controls/legend"]
    Sidebar["z-30: Sidebar (mobile overlay)"]
    Drawer["z-40: CargoDrawer slide-over"]
    Header["z-50: Dashboard header"]
    Modal["z-60: Modals/dialogs"]
    Tooltip["z-70: Tooltips"]
```
