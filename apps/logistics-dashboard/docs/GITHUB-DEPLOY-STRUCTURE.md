# GitHub and Deploy Structure

Last updated: 2026-03-15

## Scope

This document explains the repository structure and deployment-critical files for `apps/logistics-dashboard`.
It tracks the active runtime only.

## Repository Placement

```text
/
|- apps/
|  \- logistics-dashboard/
|- configs/
|- docs/
|- packages/
```

Important neighbors:

- `configs/overview.route-types.json`
- `configs/overview.destinations.json`
- `packages/shared`

## App Structure

```text
apps/logistics-dashboard/
|- app/
|  |- (dashboard)/
|  |  |- layout.tsx
|  |  |- overview/page.tsx
|  |  |- pipeline/
|  |  |  |- page.tsx
|  |  |  \- PipelinePageClient.tsx
|  |  |- sites/
|  |  |  |- page.tsx
|  |  |  \- SitesPageClient.tsx
|  |  |- cargo/
|  |  |  |- page.tsx
|  |  |  \- CargoPageClient.tsx
|  |  \- chain/
|  |     |- page.tsx
|  |     \- ChainPageClient.tsx
|  \- api/
|     |- overview/route.ts
|     |- cases/route.ts
|     |- cases/summary/route.ts
|     |- shipments/*
|     |- stock/route.ts
|     |- locations/route.ts
|     |- location-status/route.ts
|     |- events/route.ts
|     \- chain/summary/route.ts
|- components/
|  |- layout/
|  |- navigation/
|  |- overview/
|  |- pipeline/
|  |- sites/
|  |- cargo/
|  \- chain/
|- hooks/
|- lib/
|  |- overview/
|  |- navigation/
|  |- logistics/
|  \- cases/
|- store/
|- docs/
|- package.json
|- vitest.config.ts
```

## Deployment-Critical Files

### Shell and routing

- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/overview/page.tsx`
- `app/(dashboard)/pipeline/page.tsx`
- `app/(dashboard)/sites/page.tsx`
- `app/(dashboard)/cargo/page.tsx`
- `app/(dashboard)/chain/page.tsx`

### Page-client split

These files carry URL restoration logic and must remain client-side:

- `app/(dashboard)/pipeline/PipelinePageClient.tsx`
- `app/(dashboard)/sites/SitesPageClient.tsx`
- `app/(dashboard)/cargo/CargoPageClient.tsx`
- `app/(dashboard)/chain/ChainPageClient.tsx`

### Theme and layout SSOT

- `app/globals.css`
- `lib/overview/ui.ts`

### Navigation SSOT

- `lib/navigation/contracts.ts`
- `configs/overview.destinations.json`
- `configs/overview.route-types.json`

### Data integration SSOT

- `lib/supabase.ts`
- `hooks/useOverviewData.ts`
- `hooks/useKpiRealtime.ts`
- `components/layout/KpiProvider.tsx`
- `lib/cases/summary.ts`
- `lib/logistics/events.ts`
- `app/api/overview/route.ts`
- `app/api/cases/summary/route.ts`
- `app/api/events/route.ts`

## GitHub-to-Vercel Flow

Typical flow:

1. Change code and docs in this repository
2. Push branch to GitHub
3. Vercel creates a preview deployment
4. Verify preview routes, Supabase connectivity, and overview map behavior
5. Merge to the production branch
6. Re-verify production API and page health

## Configuration Ownership

### Stored in Git

- page structure
- API route code
- theme recipes
- navigation config
- test files
- docs

### Stored in Vercel only

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE`

## Active Route Map

- `/overview`
  - 7-row cockpit
  - map-first operational entry point
- `/pipeline`
  - 5-stage pipeline analysis
- `/sites`
  - 4-site readiness and detail views
- `/cargo`
  - warehouse, shipment, and stock tabs
- `/chain`
  - logistics-chain visualization

## Navigation Contract Map

Overview drilldowns target:

- stage and KPI drilldowns -> `/pipeline`
- site readiness and site alerts -> `/sites`
- worklist and shipment activity -> `/cargo`
- route summary and infrastructure focus -> `/chain`

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

## Files That Must Stay in Sync

When route taxonomy changes:

- `configs/overview.route-types.json`
- `lib/overview/routeTypes.ts`
- `lib/navigation/contracts.ts`
- docs that mention public route labels

When event mapping changes:

- `lib/logistics/events.ts`
- `app/api/events/route.ts`
- `app/api/overview/route.ts`
- deployment and architecture docs

When overview aggregation changes:

- `app/api/overview/route.ts`
- `app/api/cases/summary/route.ts`
- `lib/cases/summary.ts`
- relevant docs

## Preserved but Non-Contract Files

These overview files still exist, but they are not part of the active layout:

- `components/overview/OverviewRightPanel.tsx`
- `components/overview/OverviewBottomPanel.tsx`

Keep docs aligned to the active 7-row overview contract, not these preserved files.
