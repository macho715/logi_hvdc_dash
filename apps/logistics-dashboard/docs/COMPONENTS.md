# Logistics Dashboard Components

Last updated: 2026-03-15

## Purpose

This document describes the active component model for `apps/logistics-dashboard`.
It follows the current production code, not historical mockups or experiment notes.

Implementation source of truth:

- `app/globals.css`
- `lib/overview/ui.ts`
- `lib/navigation/contracts.ts`
- `components/*`
- `hooks/*`
- `app/api/*`

Reference-only design notes:

- `patch_overview_design1.md`
- `patch_overview_design.md`
- `darkpremium.md`
- `darkpremium_overview.md`

## Dashboard Shell

Global shell files:

- `app/(dashboard)/layout.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/DashboardHeader.tsx`
- `components/layout/KpiProvider.tsx`

Shell contract:

- `Sidebar` stays mounted on all dashboard pages
- `DashboardHeader` stays mounted on all dashboard pages
- `KpiProvider` is the only dashboard-level KPI realtime owner
- pages render inside one shared dark premium shell

## Active Page Components

### Overview

Route:

- `/overview`

Entry component:

- `components/overview/OverviewPageClient.tsx`

Map First + Bottom Collapse layout order:

1. `OverviewToolbar` + `ProgramFilterBar`
2. `KpiStripCards` (slim)
3. `ChainRibbonStrip` (slim, relabeled: Origin / Port-Air / Customs / Warehouse / MOSB / Site)
4. `OverviewMap` (full-width, 520–680px) + `MissionControlFloat` (absolute overlay, top-right)
5. `BottomCollapsePanel` (default: closed) — tabs: Site Matrix | Voyage Radar
6. Bottom nav — Logistics Chain / Pipeline / Sites / Cargo

Key children and roles:

- `OverviewToolbar`
  - shipment search
  - map layer toggles
  - language toggle
  - new voyage action
- `MapLayerToggles`
  - toggles origin arcs, voyage trips, and heatmap
- `OverviewMap`
  - renders maplibre + deck.gl overlay
  - reads locations, statuses, and events from shared ops state
  - shows `HeatmapLegend` only when heatmap is enabled and within zoom threshold
  - root container has `position: relative` for the floating MC overlay
- `MissionControlFloat`
  - wraps `MissionControl` in a `position: absolute top-4 right-4 z-20` card
  - frosted-glass overlay (`backdrop-blur-md`)
  - collapsible via chevron toggle
  - width: 72 (expanded) / 44 (collapsed) in rem-based Tailwind units
- `BottomCollapsePanel`
  - tab bar always visible (h-12)
  - tabs: `site-matrix` and `voyage-radar`
  - default state: closed (`activeTab = null`)
  - clicking an active tab closes the panel
  - accepts `renderSiteMatrix` and `renderVoyageRadar` render props
- `SiteDeliveryMatrix` (rendered via `BottomCollapsePanel` render prop)
  - 4 equal-width site cards (`xl:grid-cols-4`)
  - AGI uses gold gradient
  - MOSB Pending label applies to both DAS and AGI
- `VoyageExceptionRadar` (rendered via `BottomCollapsePanel` render prop)
  - voyage-grain alert panel (replaces `OpenRadarTable`)
  - consumes `OverviewAlert[]` — not `WorklistRow[]`
  - filter tabs: All / Critical / Warning / Overdue

Overview data ownership:

- `hooks/useOverviewData.ts` fetches `/api/overview`
- `useOverviewData()` writes `map.locations`, `map.statuses`, and `map.events` into shared ops actions
- worklist priming uses `useInitialDataLoad()` only when shared worklist state is empty

Preserved but inactive files:

- `OverviewRightPanel.tsx`
- `OverviewBottomPanel.tsx`
- `OpenRadarTable.tsx` (replaced by `VoyageExceptionRadar`)
- `OpsSnapshot.tsx` (moved into `BottomCollapsePanel`)

These files are not part of the active overview contract.

### Pipeline

Route:

- `/pipeline`

Entry files:

- `app/(dashboard)/pipeline/page.tsx`
- `app/(dashboard)/pipeline/PipelinePageClient.tsx`

Main surfaces:

- `PageContextBanner`
- `FlowChain`
- `FlowPipeline`
- `PipelineTableWrapper`
- `FlowCodeDonut`
- `VendorBar`
- `TransportModeBar`
- `CustomsStatusCard`
- `WarehouseSqmBar`

Contract:

- `page.tsx` stays server-rendered
- `PipelinePageClient.tsx` owns `useSearchParams()`
- page state is restored with `parsePipelineQuery()`
- overview drilldowns arrive with plain-language `route_type`

### Sites

Route:

- `/sites`

Entry files:

- `app/(dashboard)/sites/page.tsx`
- `app/(dashboard)/sites/SitesPageClient.tsx`

Main surfaces:

- `AgiAlertBanner`
- `PageContextBanner`
- `SiteCards`
- `SiteDetail`

Contract:

- `site` and `tab` are URL-driven
- overview site drilldowns land here
- overview-linked UI should prefer `route_type` or stage language over raw Flow Code wording

### Cargo

Route:

- `/cargo`

Entry files:

- `app/(dashboard)/cargo/page.tsx`
- `app/(dashboard)/cargo/CargoPageClient.tsx`

Main surfaces:

- `PageContextBanner`
- `CargoTabs`
- `WhStatusTable`
- `ShipmentsTable`
- `CargoDrawer`

Tabs:

- `wh`
- `shipments`
- `stock`

Contract:

- tab state is URL-driven
- overview deep links can pass `caseId`, `site`, `vendor`, `voyage_stage`, and `route_type`
- direct tab links must hydrate correctly on first load

### Chain

Route:

- `/chain`

Entry files:

- `app/(dashboard)/chain/page.tsx`
- `app/(dashboard)/chain/ChainPageClient.tsx`

Main surfaces:

- `PageContextBanner`
- `FlowChain`

Contract:

- `focus`, `site`, and `route_type` are URL-restored
- overview route summary and infrastructure clicks land here

## Shared Interaction Components

### ChainRibbonStrip

File:

- `components/overview/ChainRibbonStrip.tsx`

Purpose:

- render voyage stage chain with slim height
- labels use `t.chainRibbon.*` i18n keys: Origin / Port-Air / Customs / Warehouse / MOSB / Site
- FC0–FC5 labels removed from user-facing output (internal stage keys still used)

### VoyageExceptionRadar

File:

- `components/overview/VoyageExceptionRadar.tsx`

Purpose:

- display voyage-grain exception alerts
- consumes `OverviewAlert[]` from `/api/overview`
- filter tabs: All / Critical / Warning / Overdue
- grain: shipment/voyage — not case/worklist

### MissionControlFloat

File:

- `components/overview/MissionControlFloat.tsx`

Purpose:

- position `MissionControl` as a floating card inside the map container
- wraps existing `MissionControl` without rewriting internals
- collapsible state managed by local `useState`

### BottomCollapsePanel

File:

- `components/overview/BottomCollapsePanel.tsx`

Purpose:

- host Site Matrix and Voyage Radar in a tabbed collapse panel
- closed by default — reduces viewport consumption of detail panels
- accepts render props (`renderSiteMatrix`, `renderVoyageRadar`) for lazy rendering

### PageContextBanner

File:

- `components/navigation/PageContextBanner.tsx`

Purpose:

- render chips derived from URL-restored context
- make overview-originated navigation visible
- provide an `aria-live="polite"` summary of active context

### NewVoyageModal

File:

- `components/overview/NewVoyageModal.tsx`

Purpose:

- create a shipment or voyage record from overview
- refresh overview data after success

## Theme and Recipe Layer

### Theme SSOT

Source:

- `app/globals.css`

Defines semantic tokens for:

- page backgrounds
- panel surfaces
- borders
- text hierarchy
- brand accents
- site accents
- status accents
- shadows
- radii

Rule:

- direct hex usage belongs only in token definition files
- component classes should use semantic theme classes, not raw color literals

### Recipe Layer

Source:

- `lib/overview/ui.ts`

Provides reusable recipes for:

- page shells
- panels
- cards
- chips
- badges
- rows
- progress bars
- table surfaces
- input surfaces

Key helpers:

- `SITE_META`
- `getRouteTypeBadgeClass()`
- `gateClassLight()`
- `readinessBadgeClass()`
- `voyageStageBadgeClass()`
- `severitySurfaceClass()`

## Navigation Contract Components

Navigation source of truth:

- `lib/navigation/contracts.ts`
- `configs/overview.destinations.json`
- `configs/overview.route-types.json`

Used by:

- overview cards
- overview map clicks
- page context chips
- pipeline, sites, cargo, and chain URL restoration

Public query vocabulary:

- `route_type`
- `stage`
- `site`
- `focus`
- `tab`
- `caseId`
- `vendor`
- `category`
- `voyage_stage`

Rule:

- user-facing surfaces must use plain-language route labels
- internal `flow_code` can remain in adapters and row models, but it is not the overview-linked UI vocabulary

## Data-Integration Components

### KpiProvider

File:

- `components/layout/KpiProvider.tsx`

Purpose:

- mount `useKpiRealtime()` once for the dashboard
- keep realtime ownership out of page components

### useOverviewData

File:

- `hooks/useOverviewData.ts`

Purpose:

- fetch `GET /api/overview`
- poll every 30 seconds while the document is visible
- refetch on window focus
- write map payload into shared ops actions

### Shared Event Helper

Files:

- `lib/logistics/events.ts`
- `app/api/events/route.ts`
- `app/api/overview/route.ts`

Purpose:

- keep the event join select, row mapping, and mock fallback logic in one place
- ensure `/api/events` and `/api/overview` produce compatible event payloads
- keep overview heatmap input aligned with the standalone events API

## Documentation Rule

When the active component contract changes, update at minimum:

- this file
- `LAYOUT.md`
- `SYSTEM-ARCHITECTURE.md`
- `DEPLOYMENT.md`
