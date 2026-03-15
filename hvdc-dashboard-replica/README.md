# HVDC Dashboard Replica Pack

## Files
- `tailwind.config.ts`
- `app/overview/OverviewPage.tsx`
- `app/overview/layout-spec.md`
- `public/assets/hvdc-map-main.png`
- `public/assets/hvdc-map-mini.png`

## Use
1. Copy `tailwind.config.ts` into your project root.
2. Copy `OverviewPage.tsx` to your route or component folder.
3. Copy `public/assets/*` into your app `public/assets` folder.
4. Render:

```tsx
import OverviewPage from '@/app/overview/OverviewPage';

export default function Page() {
  return <OverviewPage />;
}
```

## Notes
- Artboard is fixed at `2048 x 1365`, then scaled by `ResizeObserver`.
- The two map assets were extracted from the provided screenshot to keep visual parity.
- Replace the static data arrays with API data without changing layout geometry.
