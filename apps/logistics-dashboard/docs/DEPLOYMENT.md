# Logistics Dashboard Deployment

Last updated: 2026-03-15

## Runtime Summary

Application:

- `apps/logistics-dashboard`

Current stack:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Vitest
- Supabase JS 2
- Vercel

Package manager:

- `pnpm`

Scripts:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
```

## Environments

### Local development

Typical run:

```bash
cd apps/logistics-dashboard
pnpm dev
```

Production-like smoke run:

```bash
cd apps/logistics-dashboard
pnpm build
pnpm start --port 3005
```

### Vercel preview

Use preview for:

- URL restoration checks
- overview navigation checks
- Supabase environment verification
- overview map and heatmap checks

### Vercel production

Use production for:

- public runtime
- real Supabase data
- final regression verification

## Required Environment Variables

Public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`

Rules:

- never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code
- `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE=false` for real-data environments
- if credentials are missing or placeholder mode is forced, the app creates placeholder clients and some routes return fallback payloads

## Deployment-Sensitive Rules

### Suspense split for URL-driven pages

Pages that use `useSearchParams()` must keep the current split:

- `page.tsx` stays a server component
- `*PageClient.tsx` owns `useSearchParams()`
- `page.tsx` wraps the client component in `Suspense`

Applies to:

- `/pipeline`
- `/sites`
- `/cargo`
- `/chain`

### Theme SSOT

Do not introduce `tailwind.config.ts` as a second theme source of truth.

Active style SSOT:

- `app/globals.css`
- `lib/overview/ui.ts`

### Navigation SSOT

Overview-originated links must use:

- `lib/navigation/contracts.ts`
- `configs/overview.destinations.json`
- `configs/overview.route-types.json`

Do not hardcode per-card route strings when `NavigationIntent` already covers the destination contract.

## Supabase Deployment Checks

Before preview or production promotion, confirm:

1. `NEXT_PUBLIC_SUPABASE_URL` points to the intended project
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
3. `SUPABASE_SERVICE_ROLE_KEY` is set on the server runtime
4. `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE=false`

Minimum API smoke checks:

- `GET /api/overview`
- `GET /api/cases/summary`
- `GET /api/locations`
- `GET /api/location-status`
- `GET /api/events`

Healthy signal:

- real environments return non-zero operational data
- `/api/overview` and `/api/events` both return a non-empty event payload when live or fallback events are expected
- no `placeholder.supabase.co` websocket errors

Failure signal:

- overview KPI rail all zeros
- `map.events` is empty while `/api/events` is not
- browser console shows `placeholder.supabase.co`
- realtime channel errors persist

## Recommended Verification After Deploy

### Route checks

- `/overview`
- `/pipeline`
- `/sites`
- `/cargo`
- `/chain`

### Behavior checks

- overview KPI rail renders
- overview map renders
- heatmap toggle shows the heatmap legend and visible density layer
- clicking overview content opens the expected target page
- page context chips match URL state
- `cargo?tab=shipments` stays on the shipments tab
- browser refresh preserves page state on URL-driven pages

### API checks

- `GET /api/overview`
- `GET /api/cases/summary`
- `GET /api/events`
- `GET /api/shipments`
- `GET /api/chain/summary`

## Known Failure Modes

### Static generation fails

Typical cause:

- `useSearchParams()` moved into `page.tsx` without a `Suspense` boundary

Fix:

- move URL logic back into `*PageClient.tsx`
- wrap the client subtree in `Suspense`

### Overview shows all zeros

Typical cause:

- placeholder Supabase client is active
- environment variables are missing or misconfigured

Fix:

- correct Vercel environment variables
- redeploy with `NEXT_PUBLIC_FORCE_PLACEHOLDER_SUPABASE=false`

### Heatmap toggle does nothing

Typical causes:

- overview map receives `map.events=[]`
- `/api/overview` and `/api/events` drifted to different event query logic
- current zoom is above the heatmap visibility threshold

Fix:

- keep shared event mapping in `lib/logistics/events.ts`
- verify `/api/overview.map.events.length > 0`
- zoom out below the heatmap cutoff if the layer is intentionally hidden at high zoom

### Realtime works locally but not on Vercel

Typical cause:

- invalid public credentials
- placeholder websocket endpoint

Fix:

- verify public Supabase env vars
- redeploy after updating the environment

## Security Notes

- browser code must use the anon key only
- server routes may use `supabaseAdmin`
- do not log raw secrets
- do not weaken RLS to make deploy checks pass

## Release Checklist

Before promotion:

1. `pnpm typecheck`
2. `pnpm build`
3. Verify overview and all four target pages
4. Verify real Supabase data is present
5. Verify overview heatmap input and `/api/events` are both healthy
6. Verify no placeholder websocket errors
7. Update `CHANGELOG.md` for user-visible behavior changes
