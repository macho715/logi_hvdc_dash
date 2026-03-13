# Layout Documentation — HVDC Logistics Dashboard

> **Version:** 1.0.0 | **Last Updated:** 2026-03-13
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
8. [Responsive Breakpoints](#8-responsive-breakpoints)
9. [Navigation Flow](#9-navigation-flow)
10. [CSS Architecture](#10-css-architecture)

---

## 1. Layout Hierarchy

```mermaid
graph TD
    Root["app/layout.tsx<br/>RootLayout<br/>(html · body · dark class)"]
    Dashboard["app/(dashboard)/layout.tsx<br/>DashboardLayout<br/>(sidebar + main area)"]
    Overview["app/(dashboard)/overview/page.tsx<br/>Overview Page"]
    Cargo["app/(dashboard)/cargo/page.tsx<br/>Cargo Page"]
    Pipeline["app/(dashboard)/pipeline/page.tsx<br/>Pipeline Page"]
    Sites["app/(dashboard)/sites/page.tsx<br/>Sites Page"]
    Home["app/page.tsx<br/>redirect → /overview"]

    Root --> Dashboard
    Root --> Home
    Dashboard --> Overview
    Dashboard --> Cargo
    Dashboard --> Pipeline
    Dashboard --> Sites

    style Root fill:#1e293b,color:#e2e8f0
    style Dashboard fill:#0f172a,color:#e2e8f0
```

---

## 2. Root Layout

**File:** `app/layout.tsx`

```mermaid
graph TD
    subgraph HTML["<html lang='ko' className='dark'>"]
        subgraph Body["<body className='min-h-screen bg-background'>"]
            Font["Inter Font<br/>(next/font/google)"]
            Children["{children}"]
        end
    end
```

### Layout Properties

| Property | Value | Purpose |
|----------|-------|---------|
| `lang` | `"ko"` | Korean language (HVDC project) |
| `className` | `"dark"` | Forces dark theme globally |
| `font` | Inter (variable) | CSS variable `--font-inter` |
| `bg` | `bg-background` | Tailwind CSS variable → `hsl(var(--background))` |
| `minHeight` | `min-h-screen` | Full viewport height |
| Meta `title` | `"HVDC Logistics Dashboard"` | Browser tab title |
| Meta `description` | Project description | SEO |

### Font Configuration

```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
```

---

## 3. Dashboard Shell Layout

**File:** `app/(dashboard)/layout.tsx`

```mermaid
graph LR
    subgraph DashboardLayout["DashboardLayout — flex h-screen overflow-hidden"]
        Sidebar["Sidebar<br/>w-64 (expanded)<br/>w-16 (collapsed)<br/>flex-shrink-0"]
        subgraph Main["Main — flex-1 flex flex-col overflow-hidden"]
            Header["DashboardHeader<br/>h-14 border-b"]
            Content["<main> — flex-1 overflow-auto p-6<br/>{children}"]
        end
    end

    Sidebar -->|"navigation"| Main
```

### Sidebar Dimensions

```mermaid
graph LR
    subgraph Sidebar["Sidebar Component"]
        direction TB
        Logo["Logo / Brand<br/>h-14 border-b"]
        Nav["Navigation Items<br/>flex-1 overflow-y-auto"]
        Item1["📊 Overview"]
        Item2["📦 Cargo"]
        Item3["🔄 Pipeline"]
        Item4["📍 Sites"]
        Footer["Footer<br/>(version, settings)"]
    end

    Nav --> Item1
    Nav --> Item2
    Nav --> Item3
    Nav --> Item4
```

| State | Width | Behavior |
|-------|-------|----------|
| Expanded | `w-64` (256px) | Shows icon + label |
| Collapsed | `w-16` (64px) | Shows icon only |
| Mobile | `hidden` | Off-canvas (future) |

### Grid Layout Diagram

```
┌────────────────────────────────────────────────────────┐
│                    100vw × 100vh                       │
├──────────┬─────────────────────────────────────────────┤
│          │  DashboardHeader (h-14)                     │
│ Sidebar  ├─────────────────────────────────────────────┤
│ (w-64)   │                                             │
│          │  <main> — flex-1 overflow-auto p-6          │
│          │  {page content}                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

---

## 4. Overview Page Layout

**File:** `app/(dashboard)/overview/page.tsx`

```mermaid
graph TD
    subgraph OverviewPage["Overview Page — space-y-6"]
        KpiStrip["KPI Strip Cards<br/>grid grid-cols-4 gap-4<br/>h-24 each"]
        subgraph MainGrid["Main Content Grid — grid grid-cols-3 gap-4"]
            MapArea["Map Area<br/>col-span-2<br/>h-[calc(100vh-280px)]"]
            RightPanel["Right Panel<br/>col-span-1<br/>overflow-y-auto"]
        end
    end

    KpiStrip --> MainGrid
```

### KPI Strip Layout

```
┌──────────┬──────────┬──────────┬──────────┐
│  Total   │  현장    │  창고    │  Flow    │
│  Cases   │  도착    │  재고    │  Code    │
│  30      │  10      │  10      │  Dist.   │
│  📦      │  🏗️      │  🏭      │  📊      │
└──────────┴──────────┴──────────┴──────────┘
 col-span-1  col-span-1  col-span-1  col-span-1
         grid-cols-4 gap-4
```

### Main Content Layout

```
┌─────────────────────────────┬─────────────────┐
│                             │  Right Panel    │
│  Map (Deck.gl + Maplibre)   │                 │
│                             │  Live Feed      │
│  col-span-2                 │  ─────────────  │
│  h-[calc(100vh-280px)]      │  Alert Cards    │
│                             │  ─────────────  │
│                             │  Quick Stats    │
│                             │  col-span-1     │
└─────────────────────────────┴─────────────────┘
```

### KpiProvider Context Tree

```mermaid
graph TD
    KpiProvider["KpiProvider<br/>(fetches /api/cases/summary)"]
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
    end

    FilterBar --> ContentGrid
    Pipeline -->|"click stage"| SidePanel
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
        AgiAlert["AgiAlertBanner<br/>(conditional — AGI/DAS critical alerts)"]
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

## 8. Responsive Breakpoints

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
| Sidebar | hidden | w-16 | w-64 |
| Cargo Tables | scroll-x | scroll-x | full width |

---

## 9. Navigation Flow

```mermaid
flowchart TD
    Root["/"] -->|"redirect"| Overview["/overview"]

    Overview -->|"sidebar click"| Cargo["/cargo"]
    Overview -->|"sidebar click"| Pipeline["/pipeline"]
    Overview -->|"sidebar click"| Sites["/sites"]

    Cargo -->|"sidebar click"| Overview
    Cargo -->|"sidebar click"| Pipeline
    Cargo -->|"sidebar click"| Sites

    Pipeline -->|"sidebar click"| Overview
    Pipeline -->|"sidebar click"| Cargo
    Pipeline -->|"sidebar click"| Sites

    Sites -->|"sidebar click"| Overview
    Sites -->|"sidebar click"| Cargo
    Sites -->|"sidebar click"| Pipeline

    subgraph Breadcrumb["DashboardHeader Breadcrumbs"]
        BC1["/ Dashboard / Overview"]
        BC2["/ Dashboard / Cargo"]
        BC3["/ Dashboard / Pipeline"]
        BC4["/ Dashboard / Sites"]
    end

    Overview -.-> BC1
    Cargo -.-> BC2
    Pipeline -.-> BC3
    Sites -.-> BC4
```

### Active Route Indication

```typescript
// Sidebar uses usePathname() for active detection
const pathname = usePathname()
const isActive = pathname.startsWith(item.href)

// Applied classes:
// Active: "bg-accent text-accent-foreground font-medium"
// Inactive: "text-muted-foreground hover:bg-accent/50"
```

---

## 10. CSS Architecture

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
