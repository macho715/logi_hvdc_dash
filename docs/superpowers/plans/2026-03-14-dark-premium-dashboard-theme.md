# Dark Premium Dashboard Theme Consolidation Plan

## Intent

- Keep the current Overview 7-row structure intact.
- Consolidate the dashboard onto one dark premium visual system across `overview`, `chain`, `pipeline`, `sites`, and `cargo`.
- Treat [patch_overview_design1.md](/C:/Users/jichu/Downloads/LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ/patch_overview_design1.md), [darkpremium.md](/C:/Users/jichu/Downloads/LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ/apps/logistics-dashboard/darkpremium.md), and [darkpremium_overview.md](/C:/Users/jichu/Downloads/LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ/apps/logistics-dashboard/darkpremium_overview.md) as design inputs, not runtime SSOT.

## Runtime SSOT

- `apps/logistics-dashboard/app/globals.css`
  - owns hvdc semantic color, border, radius, and shadow tokens
  - owns MapLibre dark premium control overrides
- `apps/logistics-dashboard/lib/overview/ui.ts`
  - owns reusable recipe classes and theme helper functions
  - components should consume semantic recipes instead of inline hex values

## Scope

### Included

- Overview shell and active overview subcomponents
- Chain, Pipeline, Sites, and Cargo page shells
- Chips, badges, tables, cards, filter bars, progress bars, chart colors, and drawer/modal shells
- App docs under `apps/logistics-dashboard/docs`
- User-visible changelog entry

### Excluded

- API contracts, navigation contracts, route parsing, and Supabase data flow
- Overview layout structure changes
- Map basemap provider changes

## Implementation Rules

1. No component-level direct hex in the target patch scope.
2. Use semantic theme tokens from `globals.css` or recipe helpers from `lib/overview/ui.ts`.
3. Keep the existing interaction model:
   - Overview remains 7-row
   - existing URL hydration and deep-link behavior stays intact
   - existing realtime ownership stays with `KpiProvider`
4. If a new status color or badge is needed, add it once in `ui.ts` and reuse it.

## Verification

- `pnpm --filter @repo/logistics-dashboard typecheck`
- grep target surfaces for remaining direct hex usage
- grep docs for stale `light-ops`, `data-theme="light-ops"`, and `tailwind.config.ts` references
- verify `/overview`, `/chain`, `/pipeline`, `/sites`, `/cargo` keep dark premium consistency without layout regressions
