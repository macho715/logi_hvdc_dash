# Logistics Dashboard Layout

Last updated: 2026-03-15

## Layout Invariants

The dashboard uses one shared dark premium shell.

Global shell:

- left `Sidebar`
- top `DashboardHeader`
- page body inside `main`

Theme source of truth:

- `app/globals.css`
- `lib/overview/ui.ts`

No active page should depend on:

- `data-theme="light-ops"`
- a separate `tailwind.config.ts` theme SSOT

## Overview Layout

Route:

- `/overview`

The active overview uses the Map First + Bottom Collapse layout.

### Row order

1. `OverviewToolbar` + `ProgramFilterBar` (header / filter bar)
2. `KpiStripCards` (slim KPI strip — 96–110px)
3. `ChainRibbonStrip` (slim stage chain — 72–88px)
4. `OverviewMap` with `MissionControlFloat` as absolute overlay (dominant map — 520–680px)
5. `BottomCollapsePanel` — tabbed collapse containing `SiteDeliveryMatrix` and `VoyageExceptionRadar` (closed by default — 40–56px; open — 220–320px)
6. Bottom nav — links to Logistics Chain / Pipeline / Sites / Cargo

### Intent

- map occupies 55–65% of viewport height and is the dominant surface
- KPI and stage chain rows are kept slim (visible without scrolling at 1440px)
- Mission Control is a floating card (absolute top-right inside the map container) — collapsible
- Site Matrix and Voyage Radar are hidden by default in the bottom collapse panel
- bottom nav provides drilldown entry points

### Map layout contract

`OverviewMap` is the main visual anchor.

It includes:

- maplibre base map
- deck.gl layers for locations, status rings, trips, origin arcs, geofence, ETA wedge, and heatmap
- `MapLegend`
- `HeatmapLegend` when the heatmap is active and within zoom threshold

The map container uses `position: relative`. `MissionControlFloat` is rendered as `position: absolute top-4 right-4 z-20` inside this container.

The heatmap layer is visible only when:

- the toolbar heatmap toggle is on
- current zoom is below the heatmap cutoff
- `/api/overview` provides a non-empty `map.events` array

### Interaction model

- KPI cards can navigate to target pages
- map clicks navigate to `sites` or `chain`
- alerts and worklist items navigate to `sites`, `cargo`, `pipeline`, or `chain`
- shipment search and quick actions live in `OverviewToolbar`

### Data contract

Overview renders from `/api/overview` through `useOverviewData()`.

The page uses:

- hero metrics
- route summary
- pipeline summary
- site readiness
- warehouse pressure
- alerts
- live feed
- worklist summary
- map payload

## Deep-Link Target Layouts

### Pipeline

Route:

- `/pipeline`

Visual order:

1. `PageContextBanner`
2. `FlowChain`
3. `FlowPipeline`
4. `PipelineTableWrapper`
5. supporting chart row

Supporting chart row:

- `FlowCodeDonut`
- `VendorBar`
- `TransportModeBar`
- `CustomsStatusCard`
- `WarehouseSqmBar`

### Sites

Route:

- `/sites`

Visual order:

1. `AgiAlertBanner`
2. `PageContextBanner`
3. `SiteCards`
4. `SiteDetail`

### Cargo

Route:

- `/cargo`

Visual order:

1. `PageContextBanner`
2. `CargoTabs`

Tab surfaces:

- warehouse status
- shipments
- stock

### Chain

Route:

- `/chain`

Visual order:

1. `PageContextBanner`
2. `FlowChain`

## URL-Restored State

The following pages restore state from the URL:

- `/pipeline`
- `/sites`
- `/cargo`
- `/chain`

Pattern:

- `page.tsx` is a server component
- `*PageClient.tsx` is the client component
- `page.tsx` wraps the client subtree in `Suspense`

Reason:

- `useSearchParams()` must stay in a Suspense-aware client subtree

## Theme Tokens

The app uses semantic dark premium tokens.

Backgrounds:

- `hvdc-bg-page`
- `hvdc-bg-topbar`
- `hvdc-bg-panel`
- `hvdc-bg-soft`
- `hvdc-bg-inner`

Text:

- `hvdc-text-primary`
- `hvdc-text-secondary`
- `hvdc-text-muted`

Borders:

- `hvdc-border-soft`
- `hvdc-border-strong`

Brand:

- `hvdc-brand`
- `hvdc-brand-hi`
- `hvdc-brand-low`

Sites:

- `hvdc-site-shu`
- `hvdc-site-mir`
- `hvdc-site-das`
- `hvdc-site-agi`

Status:

- `hvdc-status-ok`
- `hvdc-status-warn`
- `hvdc-status-risk`
- `hvdc-status-info`
- `hvdc-status-danger`

## Recipe Layer

Reusable surface recipes live in `lib/overview/ui.ts`.

Key recipes:

- `ui.pageShell`
- `ui.topbar`
- `ui.panel`
- `ui.panelSoft`
- `ui.panelInner`
- `ui.contextBanner`
- `ui.chip`
- `ui.chipActive`
- `ui.badgeOk`
- `ui.badgeWarn`
- `ui.badgeRisk`
- `ui.badgeInfo`
- `ui.row`
- `ui.rowSelected`
- `ui.progressTrack`

Rule:

- extend shared recipes before creating new page-local styling systems

## Accessibility Notes

Baseline expectations:

- keyboard reachable controls
- visible focus
- `ESC` closes drawers and modals
- context banners expose state changes politely
- map remains visually prominent without trapping focus

## Preserved but Inactive Layout Files

These files still exist but are not part of the active layout:

- `OverviewRightPanel.tsx`
- `OverviewBottomPanel.tsx`

The active overview uses:

- `MissionControlFloat` (floating overlay) instead of a fixed right panel
- `BottomCollapsePanel` (default-closed) instead of always-visible bottom rows
- `VoyageExceptionRadar` (voyage-grain) instead of `OpenRadarTable` (worklist-grain)
