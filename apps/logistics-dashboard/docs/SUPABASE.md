# Logistics Dashboard and Supabase

Last updated: 2026-03-15

## Role of Supabase

Supabase is the operational data source for this app.

The dashboard reads data through:

- browser-side anon client: `supabase`
- server-side admin client: `supabaseAdmin`

Source of truth:

- `lib/supabase.ts`

## Environment Variables

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE`

Behavior:

- if browser credentials exist and placeholder mode is off, the browser client uses the real project
- if server credentials exist and placeholder mode is off, API routes use the real project
- otherwise the app creates placeholder clients and routes may return fallback payloads

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client
- placeholder mode is for controlled fallback and parity testing only

## Tables and Views Used by the App

Primary read sources:

- `v_cases`
- `shipments`
- `shipments_status`
- `v_stock_onhand`
- `locations`
- `location_statuses`
- `events`

Most screens consume these through Next API routes, not by direct browser queries.

## API Routes Backed by Supabase

### Cases

- `GET /api/cases`
- `GET /api/cases/summary`

Primary source:

- `v_cases`

Shared summary helper:

- `lib/cases/summary.ts`

### Shipments

- `GET /api/shipments`
- `GET /api/shipments/stages`
- `GET /api/shipments/trips`
- `GET /api/shipments/vendors`
- `POST /api/shipments/new`

Primary source:

- `shipments`
- `shipments_status`

### Stock

- `GET /api/stock`

Primary source:

- `v_stock_onhand`

### Map and status

- `GET /api/locations`
- `GET /api/location-status`
- `GET /api/events`

Primary source:

- `locations`
- `location_statuses`
- `events`

Shared event mapping helper:

- `lib/logistics/events.ts`

That helper owns:

- the Supabase joined-event select string
- row mapping into dashboard `Event`
- mock fallback event generation

### Overview BFF

- `GET /api/overview`

This route aggregates:

- case summary
- shipment-stage compliance signals
- location payload
- location-status payload
- event payload for live feed and heatmap
- worklist-compatible shipment semantics

The response includes:

- `schemaVersion`
- `generatedAt`
- `hero`
- `pipeline`
- `routeSummary`
- `siteReadiness`
- `warehousePressure`
- `alerts`
- `liveFeed`
- `worklist`
- `map`

## Event and Heatmap Data Path

The overview map heatmap depends on `map.events` returned by `/api/overview`.

Required consistency rule:

- `/api/overview` and `/api/events` must use the same event join and fallback logic

Current implementation:

- `app/api/events/route.ts` and `app/api/overview/route.ts` both reuse `lib/logistics/events.ts`
- if live events are unavailable or unmappable, the helper can generate mock events
- overview heatmap visibility still depends on UI toggle and zoom threshold, but its input data must not silently diverge from `/api/events`

## Route Labels vs Internal Flow Codes

User-facing navigation uses `route_type`, not numeric Flow Code labels.

Route taxonomy source of truth:

- `configs/overview.route-types.json`
- `lib/overview/routeTypes.ts`

Public route types:

- `pre-arrival`
- `direct-to-site`
- `via-warehouse`
- `via-mosb`
- `via-warehouse-mosb`
- `review-required`

Internal compatibility behavior:

- `flow_code` may still exist in tables and row models
- adapters convert `flow_code` to `route_type`
- overview-linked UI surfaces should prefer plain-language route labels

## Realtime Ownership

Global realtime owner:

- `components/layout/KpiProvider.tsx`

Hook:

- `hooks/useKpiRealtime.ts`

Rule:

- keep the dashboard-level KPI realtime subscription in the shared layout
- do not create a second overview-specific global realtime owner

## Overview Data Loading

Hook:

- `hooks/useOverviewData.ts`

Behavior:

- fetches `/api/overview`
- polls every 30 seconds only while the document is visible
- refetches on window focus
- primes shared worklist data via `useInitialDataLoad()` only when needed
- writes locations, statuses, and events into shared ops actions

## Failure and Fallback Behavior

### Placeholder mode

If credentials are missing or placeholder mode is forced:

- browser client uses `https://placeholder.supabase.co`
- server client uses placeholder credentials
- API routes may return zero-state or mock-compatible payloads

Typical signal:

- overview KPI values show zero
- browser console shows placeholder websocket errors

### Event-specific regression signal

If heatmap is broken, check:

- `GET /api/events`
- `GET /api/overview`

Bad signal:

- `/api/events` returns rows but `/api/overview.map.events` is empty

Good signal:

- both routes return live or fallback events consistently

## Security Rules

- browser code must use the anon key only
- server routes may use the service role key
- do not weaken RLS for convenience
- do not log secrets

## Documentation Rules

When Supabase usage changes, update:

- this file
- `SYSTEM-ARCHITECTURE.md`
- `DEPLOYMENT.md`

When event mapping changes, also update:

- `app/api/events/route.ts`
- `app/api/overview/route.ts`
- `lib/logistics/events.ts`
- docs that mention heatmap or live feed behavior
