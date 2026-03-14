# Overview Toolbar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top toolbar to the Overview page with a shipment search bar (fuzzy ID matching), three map layer toggles, and a new voyage entry modal that inserts into Supabase.

**Architecture:** New `OverviewToolbar` row sits above `KpiStripCards` in `OverviewPageClient`. Zustand `logisticsStore` gains three new booleans (`layerOriginArcs`, `layerTrips`, `highlightedShipmentId`). Search normalizes user input to exact or ilike queries against the existing `GET /api/shipments` route. New voyage POST hits `POST /api/shipments/new` which inserts directly into `status.shipments_status` via `supabaseAdmin`.

**Tech Stack:** Next.js 14 App Router, React, TypeScript strict, Tailwind CSS, Zustand, Supabase JS v2, Vitest

---

## Chunk 1: Foundation — Store, Types, Normalization, API

### Task 1: Extend LogisticsState types

**Files:**
- Modify: `apps/logistics-dashboard/types/logistics.ts`

- [ ] **Step 1: Open and read the file**

  Confirm it has `LogisticsState` interface with `showGeofence`, `showHeatmap`, `showEtaWedge`, and their toggle actions.

- [ ] **Step 2: Add three new fields + setters to the interface**

  In `types/logistics.ts`, inside `LogisticsState`, add after the existing UI state fields (`showEtaWedge`):

  ```ts
  // Map layer visibility toggles (user-controlled)
  layerOriginArcs: boolean
  layerTrips: boolean
  // Highlight a specific shipment trip on the map (null = none)
  highlightedShipmentId: string | null
  ```

  And inside the Actions section, add after `toggleEtaWedge`:

  ```ts
  toggleLayerOriginArcs: () => void
  toggleLayerTrips: () => void
  setHighlightedShipmentId: (id: string | null) => void
  ```

- [ ] **Step 3: Run typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

  Expected: errors only in `logisticsStore.ts` (not yet updated) — that is fine.

---

### Task 2: Implement new store fields

**Files:**
- Modify: `apps/logistics-dashboard/store/logisticsStore.ts`

- [ ] **Step 1: Add the three new state entries**

  In `logisticsStore.ts`, inside the `create<LogisticsState>((set, get) => ({` block, add after `showEtaWedge: false,`:

  ```ts
  // Map layer toggles (default ON for arcs and trips)
  layerOriginArcs: true,
  layerTrips: true,
  highlightedShipmentId: null,
  ```

- [ ] **Step 2: Add the three new action implementations**

  After `toggleEtaWedge: () => set((state) => ({ showEtaWedge: !state.showEtaWedge })),` add:

  ```ts
  toggleLayerOriginArcs: () => set((state) => ({ layerOriginArcs: !state.layerOriginArcs })),
  toggleLayerTrips: () => set((state) => ({ layerTrips: !state.layerTrips })),
  setHighlightedShipmentId: (id) => set({ highlightedShipmentId: id }),
  ```

- [ ] **Step 3: Run typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

  Expected: 0 errors in these two files.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/logistics-dashboard/types/logistics.ts apps/logistics-dashboard/store/logisticsStore.ts
  git commit -m "feat(store): add layerOriginArcs, layerTrips, highlightedShipmentId to logisticsStore"
  ```

---

### Task 3: Create normalizeShipmentId utility + tests

**Files:**
- Create: `apps/logistics-dashboard/lib/search/normalizeShipmentId.ts`
- Create: `apps/logistics-dashboard/lib/search/__tests__/normalizeShipmentId.test.ts`

- [ ] **Step 1: Write the failing test first**

  Create `apps/logistics-dashboard/lib/search/__tests__/normalizeShipmentId.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest'
  import { normalizeShipmentId } from '../normalizeShipmentId'

  describe('normalizeShipmentId', () => {
    // All ilike searches target the sct_ship_no column via ?q= param
    // Constraint: SCT codes with >4 digits (e.g. sct10000) fall to ilike — 4-digit format is the system standard

    it('passes full HVDC- code (with hyphen) through as uppercase exact match', () => {
      expect(normalizeShipmentId('hvdc-adopt-sct-0001')).toEqual({
        type: 'exact',
        value: 'HVDC-ADOPT-SCT-0001',
      })
      expect(normalizeShipmentId('HVDC-ADOPT-SCT-0042')).toEqual({
        type: 'exact',
        value: 'HVDC-ADOPT-SCT-0042',
      })
    })

    it('falls to ilike for "hvdc" without a hyphen (not a valid HVDC code)', () => {
      // "hvdc" alone or "hvdcfoo" is not a valid code — treat as free-text ilike
      expect(normalizeShipmentId('hvdc')).toEqual({ type: 'ilike', value: 'hvdc' })
      expect(normalizeShipmentId('hvdcfoo')).toEqual({ type: 'ilike', value: 'hvdcfoo' })
    })

    it('expands sct short codes with zero-padding to 4 digits', () => {
      expect(normalizeShipmentId('sct0001')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
      expect(normalizeShipmentId('sct001')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
      expect(normalizeShipmentId('sct1')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
      expect(normalizeShipmentId('sct0123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
      expect(normalizeShipmentId('sct123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
      expect(normalizeShipmentId('SCT0123')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0123' })
    })

    it('falls to ilike for sct codes with >4 digits (out of standard range)', () => {
      // 5+ digit SCT codes are non-standard; let the DB partial-match handle them
      expect(normalizeShipmentId('sct10000')).toEqual({ type: 'ilike', value: 'sct10000' })
    })

    it('strips case prefix and returns ilike on sct_ship_no column for case numbers', () => {
      // e.g. case12345 → ilike %12345% against sct_ship_no
      expect(normalizeShipmentId('case12345')).toEqual({ type: 'ilike', value: '12345' })
      expect(normalizeShipmentId('CASE001')).toEqual({ type: 'ilike', value: '001' })
    })

    it('uses ilike for bare numerics and free text (all against sct_ship_no)', () => {
      expect(normalizeShipmentId('0001')).toEqual({ type: 'ilike', value: '0001' })
      expect(normalizeShipmentId('POSCO')).toEqual({ type: 'ilike', value: 'posco' })
    })

    it('trims whitespace', () => {
      expect(normalizeShipmentId('  sct0001  ')).toEqual({ type: 'exact', value: 'HVDC-ADOPT-SCT-0001' })
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd apps/logistics-dashboard && pnpm vitest run lib/search/__tests__/normalizeShipmentId.test.ts 2>&1 | tail -15
  ```

  Expected: FAIL — "Cannot find module '../normalizeShipmentId'"

- [ ] **Step 3: Implement the function**

  Create `apps/logistics-dashboard/lib/search/normalizeShipmentId.ts`:

  ```ts
  /**
   * Normalized shipment search query.
   * - exact: use GET /api/shipments?sct_ship_no={value} (exact match)
   * - ilike: use GET /api/shipments?q={value} (partial ilike match)
   */
  export type NormalizedSearch =
    | { type: 'exact'; value: string }
    | { type: 'ilike'; value: string }

  /**
   * Normalizes a raw user search string into a structured search query.
   *
   * Supported input formats (case-insensitive):
   *   hvdc-adopt-sct-0001  → exact HVDC-ADOPT-SCT-0001
   *   sct0001 / sct001     → exact HVDC-ADOPT-SCT-0001
   *   sct0123 / sct123     → exact HVDC-ADOPT-SCT-0123
   *   case12345            → ilike %12345%
   *   0001 / free text     → ilike %0001%
   */
  export function normalizeShipmentId(raw: string): NormalizedSearch {
    const s = raw.trim().toLowerCase()

    // Full HVDC code: must start with "hvdc-" (hyphen required) to be a valid HVDC code
    // e.g. "hvdc-adopt-sct-0001" → exact match against sct_ship_no
    // bare "hvdc" or "hvdcfoo" without hyphen falls through to ilike
    if (s.startsWith('hvdc-')) {
      return { type: 'exact', value: s.toUpperCase() }
    }

    // Short SCT code: sct followed by 1–4 digits only → zero-pad to 4 digits
    // 5+ digit SCT codes are non-standard and fall to ilike fallback
    const sctMatch = s.match(/^sct(\d{1,4})$/)
    if (sctMatch) {
      const padded = sctMatch[1].padStart(4, '0')
      return { type: 'exact', value: `HVDC-ADOPT-SCT-${padded}` }
    }

    // Case number: strip "case" prefix, use bare digits as ilike value against sct_ship_no
    const caseMatch = s.match(/^case(\d+)$/)
    if (caseMatch) {
      return { type: 'ilike', value: caseMatch[1] }
    }

    // Bare numerics, vendor names, 5+ digit sct codes, and all other inputs
    // → partial ilike match against sct_ship_no
    return { type: 'ilike', value: s }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  cd apps/logistics-dashboard && pnpm vitest run lib/search/__tests__/normalizeShipmentId.test.ts
  ```

  Expected: all tests PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/logistics-dashboard/lib/search/
  git commit -m "feat(search): add normalizeShipmentId utility with tests"
  ```

---

### Task 4: Add ilike `q` param to shipments API

**Files:**
- Modify: `apps/logistics-dashboard/app/api/shipments/route.ts`

- [ ] **Step 1: Add the `q` query param handler**

  In `app/api/shipments/route.ts`, after the `const sct_ship_no = searchParams.get('sct_ship_no')` line (around line 29), add:

  ```ts
  const q = searchParams.get('q')  // ilike partial match against sct_ship_no
  ```

  Then after the `if (sct_ship_no) query = query.eq('sct_ship_no', sct_ship_no)` line (around line 53), add:

  ```ts
  // else if — mutually exclusive with sct_ship_no exact match (prevents AND-chaining conflict)
  // ilike searches sct_ship_no column only; no multi-column search needed per spec
  else if (q) query = query.ilike('sct_ship_no', `%${q}%`)
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -20
  ```

  Expected: 0 new errors.

- [ ] **Step 3: Manual smoke test**

  Start dev server if not running: `pnpm dev` from the monorepo root.
  Open browser: `http://localhost:3000/api/shipments?q=sct&pageSize=3`
  Expected: JSON with `data` array (even if empty — no crash).

- [ ] **Step 4: Commit**

  ```bash
  git add apps/logistics-dashboard/app/api/shipments/route.ts
  git commit -m "feat(api): add ilike q param to GET /api/shipments"
  ```

---

### Task 5: Add highlightId to createTripsLayer + fix visible arg

**Files:**
- Modify: `apps/logistics-dashboard/components/map/layers/createTripsLayer.ts`
- Modify: `apps/logistics-dashboard/components/overview/OverviewMap.tsx`

**Pre-check — TripData.id:** `TripData` in `app/api/shipments/trips/route.ts` has `id: string`
(UUID from `row.id`). `highlightId` is compared to `d.id` in `getColor`. Confirmed correct.

**Note on createOriginArcLayer:** It already receives `showOriginArcs` boolean as its `visible` arg.
No change to `createOriginArcLayer` itself — only how `showOriginArcs` is computed in `OverviewMap`
changes (adds `layerOriginArcs &&` prefix to the existing zoom-gate expression).

- [ ] **Step 1: Update createTripsLayer signature**

  In `createTripsLayer.ts`, change the function signature and body:

  ```ts
  export function createTripsLayer(
    trips: TripData[],
    currentTime: number,
    visible: boolean,
    highlightId?: string | null,
  ): Layer | null {
    if (!visible || trips.length === 0) return null

    const hasHighlight = highlightId != null

    return new TripsLayer<TripData>({
      id: "active-voyages",
      data: trips,
      pickable: true,
      visible,

      getPath: (d) =>
        d.msobCoords
          ? [d.polCoords, d.podCoords, d.msobCoords]
          : [d.polCoords, d.podCoords],
      getTimestamps: (d) => {
        if (d.msobCoords) {
          const msobTime = d.atdUnix + 0.8 * (d.etaUnix - d.atdUnix)
          return [d.atdUnix, msobTime, d.etaUnix]
        }
        return [d.atdUnix, d.etaUnix]
      },
      getColor: (d) => {
        if (hasHighlight) {
          if (d.id === highlightId) {
            return [255, 255, 255, 220]  // bright white for highlighted trip
          }
          const base = tripColor(d.flowCode)
          return [base[0], base[1], base[2], Math.floor(base[3] * 0.3)] as [number, number, number, number]
        }
        return tripColor(d.flowCode)
      },

      currentTime,
      trailLength: TRAIL_SECS,
      widthMinPixels: 2,
      widthMaxPixels: 4,
      jointRounded: true,
      capRounded: true,

      updateTriggers: {
        getColor: [highlightId],
      },
    })
  }
  ```

- [ ] **Step 2: Fix the createTripsLayer call site in OverviewMap.tsx**

  In `OverviewMap.tsx`, read the new store fields (around line 174–178, after the existing store selectors):

  ```ts
  const layerTrips = useLogisticsStore((state) => state.layerTrips)
  const layerOriginArcs = useLogisticsStore((state) => state.layerOriginArcs)
  const highlightedShipmentId = useLogisticsStore((state) => state.highlightedShipmentId)
  ```

  Update `showOriginArcs` computation (line 214):
  ```ts
  // Was: const showOriginArcs = zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
  const showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
  ```

  Update the `createTripsLayer` call site (line 402):
  ```ts
  // Was: createTripsLayer(tripsData, animTime, showPoiLayer),
  createTripsLayer(tripsData, animTime, layerTrips, highlightedShipmentId),
  ```

  Add the new store dependencies to the layers `useEffect` dependency array (after `showOriginArcs`):
  ```ts
  layerTrips,
  layerOriginArcs,
  highlightedShipmentId,
  ```

- [ ] **Step 3: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

  Expected: 0 new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/logistics-dashboard/components/map/layers/createTripsLayer.ts \
          apps/logistics-dashboard/components/overview/OverviewMap.tsx
  git commit -m "feat(map): add highlightId to createTripsLayer, fix trips visibility to use layerTrips store"
  ```

---

## Chunk 2: Search UI — Toolbar, Search Bar, Toggles, Right Panel

> **Chunk 2 Prerequisites (completed in Chunk 1):**
> - `logisticsStore` already has `layerOriginArcs`, `layerTrips`, `highlightedShipmentId`, `toggleLayerOriginArcs`, `toggleLayerTrips`, `setHighlightedShipmentId` (Tasks 1–2)
> - `GET /api/shipments?q=` ilike param already added (Task 4)
> - `status.shipments_status.status_no` is the correct column name (not `mr_number` — the VIEW aliases it as `mr_number` but the underlying table column is `status_no`)

### Task 6: Create MapLayerToggles component

**Files:**
- Create: `apps/logistics-dashboard/components/overview/MapLayerToggles.tsx`

- [ ] **Step 1: Create the component**

  ```tsx
  'use client'

  import { useLogisticsStore } from '@/store/logisticsStore'
  import { cn } from '@/lib/utils'

  interface ToggleButtonProps {
    label: string
    icon: string
    active: boolean
    onToggle: () => void
  }

  function ToggleButton({ label, icon, active, onToggle }: ToggleButtonProps) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={active ? `${label} 숨기기` : `${label} 표시`}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          active
            ? 'bg-blue-600/80 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200',
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>
    )
  }

  export function MapLayerToggles() {
    const layerOriginArcs = useLogisticsStore((s) => s.layerOriginArcs)
    const layerTrips = useLogisticsStore((s) => s.layerTrips)
    const showHeatmap = useLogisticsStore((s) => s.showHeatmap)
    const toggleLayerOriginArcs = useLogisticsStore((s) => s.toggleLayerOriginArcs)
    const toggleLayerTrips = useLogisticsStore((s) => s.toggleLayerTrips)
    const toggleHeatmap = useLogisticsStore((s) => s.toggleHeatmap)

    return (
      <div className="flex items-center gap-2">
        <ToggleButton label="Origin Arc" icon="🌐" active={layerOriginArcs} onToggle={toggleLayerOriginArcs} />
        <ToggleButton label="항차" icon="🚢" active={layerTrips} onToggle={toggleLayerTrips} />
        <ToggleButton label="Heatmap" icon="🔥" active={showHeatmap} onToggle={toggleHeatmap} />
      </div>
    )
  }
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -20
  ```

  Expected: 0 errors.

---

### Task 7: Create ShipmentSearchBar component

**Files:**
- Create: `apps/logistics-dashboard/components/overview/ShipmentSearchBar.tsx`

**Dependencies (from Chunk 1):**
- `normalizeShipmentId` from `@/lib/search/normalizeShipmentId` — signature: `(raw: string) => { type: 'exact' | 'ilike'; value: string }`
- `logisticsStore.setHighlightedShipmentId(id: string | null)` — set in Chunk 1 Task 2

**Prop interface:** `onSelect: (sctShipNo: string) => void` — called with the `sct_ship_no` string of the selected result. `OverviewToolbar` wires this to `onShipmentSelect` prop.

**Dropdown results:** API returns `{ data: ShipmentRow[] }`. Each result card reads `ShipmentRow.id` (UUID, for highlight), `sct_ship_no`, `vendor`, `voyage_stage`, `eta`.

**Null vs undefined:** `selectedShipmentId` in the parent uses `string | null`. The panel checks `selectedShipmentId != null` (covers both `null` and `undefined`).

**GET /api/shipments precondition:** This endpoint already exists. Chunks use it read-only — no changes needed before Task 9.

- [ ] **Step 1: Create the component**

  ```tsx
  'use client'

  import { useState, useRef, useEffect, useCallback } from 'react'
  import { useLogisticsStore } from '@/store/logisticsStore'
  import { normalizeShipmentId } from '@/lib/search/normalizeShipmentId'
  import type { ShipmentRow } from '@/types/cases'

  const VOYAGE_STAGE_LABELS: Record<string, string> = {
    'pre-departure': '출발 전',
    'in-transit': '운송 중',
    'port-customs': '통관 중',
    'inland': '내륙 운송',
    'delivered': '납품 완료',
  }

  interface SearchResult {
    sct_ship_no: string
    vendor: string
    voyage_stage: string
    eta: string | null
    id: string
  }

  interface Props {
    onSelect: (id: string) => void
  }

  export function ShipmentSearchBar({ onSelect }: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [open, setOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const setHighlightedShipmentId = useLogisticsStore((s) => s.setHighlightedShipmentId)

    // Caller mapping: NormalizedSearch → API query params
    // exact  → ?sct_ship_no={value}   (uses existing .eq filter in route)
    // ilike  → ?q={value}             (uses new else-if .ilike filter in route)
    // The two params are mutually exclusive by normalizeShipmentId design
    const doSearch = useCallback(async (raw: string) => {
      const normalized = normalizeShipmentId(raw)
      const params = new URLSearchParams({ pageSize: '5' })
      if (normalized.type === 'exact') {
        params.set('sct_ship_no', normalized.value)
      } else {
        params.set('q', normalized.value)
      }

      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/shipments?${params}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json() as { data: ShipmentRow[] }
        setResults(
          json.data.map((r) => ({
            id: r.id,
            sct_ship_no: r.sct_ship_no,
            vendor: r.vendor,
            voyage_stage: r.voyage_stage,
            eta: r.eta,
          }))
        )
        setOpen(true)
      } catch {
        setError(true)
        setResults([])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setQuery(val)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (val.trim().length < 2) {
        setOpen(false)
        setResults([])
        return
      }
      debounceRef.current = setTimeout(() => doSearch(val), 300)
    }

    const handleSelect = (result: SearchResult) => {
      setQuery(result.sct_ship_no)
      setOpen(false)
      setHighlightedShipmentId(result.id)
      onSelect(result.sct_ship_no)
    }

    const handleClear = () => {
      setQuery('')
      setOpen(false)
      setResults([])
      setHighlightedShipmentId(null)
    }

    // Close dropdown when clicking outside
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
      <div ref={containerRef} className="relative w-72">
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="SCT0001 · hvdc-adopt-sct-0001 · case123"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 py-1.5 pl-9 pr-8 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 text-gray-400 hover:text-gray-200"
              aria-label="검색 초기화"
            >
              ×
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
            {loading && (
              <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
            )}
            {!loading && error && (
              <div className="px-4 py-3 text-sm text-red-400">검색 실패, 다시 시도하세요</div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400">결과 없음</div>
            )}
            {!loading && results.map((r) => (
              <div
                key={r.id}
                className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-800"
                onMouseDown={() => handleSelect(r)}
              >
                <div>
                  <div className="text-sm font-medium text-gray-100">{r.sct_ship_no}</div>
                  <div className="text-xs text-gray-400">
                    {r.vendor} · {VOYAGE_STAGE_LABELS[r.voyage_stage] ?? r.voyage_stage}
                    {r.eta ? ` · ETA ${r.eta}` : ''}
                  </div>
                </div>
                <a
                  href={`/shipments?sct_ship_no=${encodeURIComponent(r.sct_ship_no)}`}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="ml-2 shrink-0 text-xs text-blue-400 hover:underline"
                >
                  상세 보기 →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

  If `ShipmentRow` doesn't have a `voyage_stage` field exposed in the right type, check `types/cases.ts`. Fix import path if needed.

---

### Task 8: Create OverviewToolbar (with NewVoyageButton placeholder)

**Files:**
- Create: `apps/logistics-dashboard/components/overview/OverviewToolbar.tsx`

- [ ] **Step 1: Create the component**

  ```tsx
  'use client'

  import { MapLayerToggles } from './MapLayerToggles'
  import { ShipmentSearchBar } from './ShipmentSearchBar'

  interface OverviewToolbarProps {
    onShipmentSelect: (sctShipNo: string) => void
    onNewVoyageClick: () => void
  }

  export function OverviewToolbar({ onShipmentSelect, onNewVoyageClick }: OverviewToolbarProps) {
    return (
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-4 py-2">
        {/* Left: search */}
        <ShipmentSearchBar onSelect={onShipmentSelect} />

        {/* Center: map layer toggles */}
        <MapLayerToggles />

        {/* Right: new voyage button */}
        <button
          type="button"
          onClick={onNewVoyageClick}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <span>＋</span>
          <span>신규 항차</span>
        </button>
      </div>
    )
  }
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -20
  ```

- [ ] **Step 3: Commit chunk 2 so far**

  ```bash
  git add apps/logistics-dashboard/components/overview/MapLayerToggles.tsx \
          apps/logistics-dashboard/components/overview/ShipmentSearchBar.tsx \
          apps/logistics-dashboard/components/overview/OverviewToolbar.tsx
  git commit -m "feat(ui): add MapLayerToggles, ShipmentSearchBar, OverviewToolbar components"
  ```

---

### Task 9: Add selected shipment detail to OverviewRightPanel

**Files:**
- Modify: `apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx`

- [ ] **Step 1: Add props and a detail card sub-component**

  At the top of the file, add import:
  ```ts
  import { useState, useEffect } from 'react'
  import type { ShipmentRow } from '@/types/cases'
  ```

  Update the props interface:
  ```ts
  interface OverviewRightPanelProps {
    data: OverviewCockpitResponse | null
    loading?: boolean
    onNavigate: (intent: NavigationIntent) => void
    selectedShipmentId?: string | null       // sct_ship_no to show detail for
    onClearSelection?: () => void
  }
  ```

  Add a sub-component above `OverviewRightPanel`:
  ```tsx
  const VOYAGE_STAGE_LABELS: Record<string, string> = {
    'pre-departure': '출발 전',
    'in-transit': '운송 중',
    'port-customs': '통관 중',
    'inland': '내륙 운송',
    'delivered': '납품 완료',
  }

  function ShipmentDetailCard({ sctShipNo, onClear }: { sctShipNo: string; onClear?: () => void }) {
    const [detail, setDetail] = useState<ShipmentRow | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(true)
    const [fetchError, setFetchError] = useState(false)

    useEffect(() => {
      setLoadingDetail(true)
      setFetchError(false)
      fetch(`/api/shipments?sct_ship_no=${encodeURIComponent(sctShipNo)}&pageSize=1`)
        .then((r) => r.json())
        .then((j: { data: ShipmentRow[] }) => {
          setDetail(j.data[0] ?? null)
        })
        .catch(() => setFetchError(true))
        .finally(() => setLoadingDetail(false))
    }, [sctShipNo])

    return (
      <div className="mb-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-300">검색 결과</span>
          {onClear && (
            <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-200" aria-label="닫기">×</button>
          )}
        </div>
        {loadingDetail && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-gray-700" />
            ))}
          </div>
        )}
        {!loadingDetail && fetchError && (
          <p className="text-xs text-red-400">상세 정보를 불러오지 못했습니다</p>
        )}
        {!loadingDetail && !fetchError && detail && (
          <div className="space-y-1 text-xs">
            <div className="font-mono text-sm text-gray-100">{detail.sct_ship_no}</div>
            <div className="text-gray-400">{detail.vendor}</div>
            <div className="text-gray-400">{detail.pol} → {detail.pod}</div>
            <div className="flex gap-3 text-gray-400">
              <span>{VOYAGE_STAGE_LABELS[detail.voyage_stage] ?? detail.voyage_stage}</span>
              {detail.eta && <span>ETA {detail.eta}</span>}
              {detail.flow_code != null && <span>Flow {detail.flow_code}</span>}
            </div>
          </div>
        )}
        {!loadingDetail && !fetchError && !detail && (
          <p className="text-xs text-gray-400">해당 항차를 찾지 못했습니다</p>
        )}
      </div>
    )
  }
  ```

  Update the function signature:
  ```ts
  export function OverviewRightPanel({
    data,
    loading = false,
    onNavigate,
    selectedShipmentId,
    onClearSelection,
  }: OverviewRightPanelProps) {
  ```

  Inside the main return JSX of `OverviewRightPanel` (in the `<aside>` element, before the existing content), add:
  ```tsx
  {selectedShipmentId && (
    <ShipmentDetailCard sctShipNo={selectedShipmentId} onClear={onClearSelection} />
  )}
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx
  git commit -m "feat(ui): add selected shipment detail card to OverviewRightPanel"
  ```

---

### Task 10: Wire OverviewToolbar into OverviewPageClient

**Files:**
- Modify: `apps/logistics-dashboard/hooks/useOverviewData.ts`  ← FIRST (hook before call-site)
- Modify: `apps/logistics-dashboard/components/overview/OverviewPageClient.tsx`

**NewVoyageButton:** Already implemented as an inline `<button>` inside `OverviewToolbar.tsx` — no separate component file needed.

**selectedShipmentId null-check:** `OverviewRightPanel` uses `selectedShipmentId != null` (handles both `null` and `undefined` safely).

**useOverviewData existing effects:** The two existing `useEffect` blocks (initial load + polling) remain unchanged. The new refresh effect is added as a THIRD `useEffect` that only fires when `refreshKey` increments above 0.

- [ ] **Step 1: Update useOverviewData FIRST (avoid TS error at call site)**

  In `hooks/useOverviewData.ts`, update the function signature:

  ```ts
  // Line 10 — was: export function useOverviewData(): OverviewRuntimeState {
  export function useOverviewData(refreshKey = 0): OverviewRuntimeState {
  ```

  After the existing two `useEffect` blocks (before the `return` statement), add a THIRD effect:
  ```ts
  // External refresh trigger — fires when refreshKey increments (e.g. after new voyage POST)
  // Guard: skip on refreshKey=0 (initial render already handled by first useEffect above)
  useEffect(() => {
    if (refreshKey === 0) return
    void loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])
  ```

  Run typecheck: `cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -20`
  Expected: 0 errors.

- [ ] **Step 2: Update OverviewPageClient**

  Replace the current `OverviewPageClient.tsx` content with:

  ```tsx
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { KpiStripCards } from '@/components/overview/KpiStripCards'
  import { OverviewBottomPanel } from '@/components/overview/OverviewBottomPanel'
  import { OverviewMap } from '@/components/overview/OverviewMap'
  import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'
  import { OverviewToolbar } from '@/components/overview/OverviewToolbar'
  import { useOverviewData } from '@/hooks/useOverviewData'
  import { useLogisticsStore } from '@/store/logisticsStore'
  import { buildDashboardLink } from '@/lib/navigation/contracts'
  import type { NavigationIntent } from '@/types/overview'

  export function OverviewPageClient() {
    const router = useRouter()
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
    const [isNewVoyageOpen, setIsNewVoyageOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const setHighlightedShipmentId = useLogisticsStore((s) => s.setHighlightedShipmentId)

    const { data, loading, error, worklist } = useOverviewData(refreshKey)

    const handleNavigate = (intent: NavigationIntent) => {
      router.push(buildDashboardLink(intent))
    }

    const handleShipmentSelect = (sctShipNo: string) => {
      setSelectedShipmentId(sctShipNo)
      // highlightedShipmentId is set directly from ShipmentSearchBar via store
    }

    const handleClearSelection = () => {
      setSelectedShipmentId(null)
      setHighlightedShipmentId(null)
    }

    return (
      <div className="flex h-full flex-col overflow-hidden">
        <OverviewToolbar
          onShipmentSelect={handleShipmentSelect}
          onNewVoyageClick={() => setIsNewVoyageOpen(true)}
        />
        <KpiStripCards metrics={data?.hero.metrics ?? []} loading={loading} onNavigate={handleNavigate} />
        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <div className="min-h-[360px] flex-1">
            <OverviewMap onNavigateIntent={handleNavigate} />
          </div>
          <OverviewRightPanel
            data={data}
            loading={loading}
            onNavigate={handleNavigate}
            selectedShipmentId={selectedShipmentId}
            onClearSelection={handleClearSelection}
          />
        </div>
        <OverviewBottomPanel data={data} loading={loading} worklist={worklist} onNavigate={handleNavigate} />
        {error ? (
          <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200" aria-live="polite">
            Overview 데이터를 새로고침하지 못했습니다: {error}
          </div>
        ) : null}
        {/* NewVoyageModal will be added in Chunk 3 */}
        {isNewVoyageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 text-white">
              <p className="text-sm text-gray-400">신규 항차 모달 — 곧 추가됩니다</p>
              <button
                onClick={() => setIsNewVoyageOpen(false)}
                className="mt-4 rounded-lg bg-gray-700 px-4 py-2 text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

  Expected: 0 errors.

- [ ] **Step 4: Visual verification**

  Open `http://localhost:3000` in browser.
  Expected:
  - Toolbar row visible above KPI cards with search input, 3 toggle buttons, "＋ 신규 항차" button
  - Toggling "Origin Arc" hides/shows the global arc layer
  - Toggling "항차" hides/shows the animated trip paths
  - Toggling "Heatmap" shows/hides the event heatmap
  - Typing "sct001" in search shows dropdown with matching result(s)
  - Clicking a result shows detail card in right panel

- [ ] **Step 5: Commit**

  ```bash
  git add apps/logistics-dashboard/components/overview/OverviewPageClient.tsx \
          apps/logistics-dashboard/hooks/useOverviewData.ts
  git commit -m "feat(overview): wire OverviewToolbar, search selection, map toggles into OverviewPageClient"
  ```

---

## Chunk 3: New Voyage Modal + Supabase INSERT

> **Chunk 3 Prerequisites (completed in Chunks 1–2):**
> - `useOverviewData(refreshKey)` signature updated in Chunk 2 Task 10
> - `status.shipments_status.status_no BIGINT` is the correct column — the `public.shipments` VIEW aliases it as `mr_number` but the underlying table column name is `status_no`
> - `supabaseAdmin.schema('status').from('shipments_status').insert(...)` — correct Supabase JS v2 syntax

### Task 11: Create POST /api/shipments/new endpoint

**Files:**
- Create: `apps/logistics-dashboard/app/api/shipments/new/route.ts`

- [ ] **Step 1: Create the API route**

  ```ts
  import { NextRequest, NextResponse } from 'next/server'
  import { supabaseAdmin } from '@/lib/supabase'

  export interface NewVoyagePayload {
    hvdc_code: string
    vendor: string
    pol: string
    pod: string
    ship_mode: string
    incoterms?: string
    etd?: string
    atd?: string
    eta?: string
    ata?: string
    vessel?: string
    bl_awb?: string
    status_no?: number
    transit_days?: number
    customs_days?: number
    inland_days?: number
    doc_shu: boolean
    doc_das: boolean
    doc_mir: boolean
    doc_agi: boolean
    description?: string
  }

  export async function POST(req: NextRequest) {
    try {
      const body = (await req.json()) as NewVoyagePayload

      // Server-side required field validation
      if (!body.hvdc_code?.trim() || !body.vendor?.trim() || !body.pol?.trim() || !body.pod?.trim() || !body.ship_mode?.trim()) {
        return NextResponse.json({ error: 'required fields missing: hvdc_code, vendor, pol, pod, ship_mode' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .schema('status')
        .from('shipments_status')
        .insert({
          hvdc_code: body.hvdc_code.trim().toUpperCase(),
          vendor: body.vendor.trim(),
          pol: body.pol.trim(),
          pod: body.pod.trim(),
          ship_mode: body.ship_mode.trim(),
          incoterms: body.incoterms?.trim() ?? null,
          etd: body.etd ?? null,
          atd: body.atd ?? null,
          eta: body.eta ?? null,
          ata: body.ata ?? null,
          vessel: body.vessel?.trim() ?? null,
          bl_awb: body.bl_awb?.trim() ?? null,
          status_no: body.status_no ?? null,
          transit_days: body.transit_days ?? null,
          customs_days: body.customs_days ?? null,
          inland_days: body.inland_days ?? null,
          doc_shu: body.doc_shu ?? false,
          doc_das: body.doc_das ?? false,
          doc_mir: body.doc_mir ?? false,
          doc_agi: body.doc_agi ?? false,
          raw: { description: body.description?.trim() ?? '' },
        })

      if (error) {
        // Postgres unique violation = duplicate hvdc_code
        if (error.code === '23505') {
          return NextResponse.json({ error: 'duplicate_hvdc_code' }, { status: 409 })
        }
        console.error('POST /api/shipments/new insert error:', error)
        return NextResponse.json({ error: 'internal_error' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, hvdc_code: body.hvdc_code.trim().toUpperCase() })
    } catch (err) {
      console.error('POST /api/shipments/new error:', err)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -20
  ```

  If `supabaseAdmin.schema` causes a TypeScript error, check the Supabase client version. Alternative: use the second argument to `from` — `supabaseAdmin.from('shipments_status', { schema: 'status' })`. Use whichever the installed version supports.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/logistics-dashboard/app/api/shipments/new/
  git commit -m "feat(api): add POST /api/shipments/new — inserts into status.shipments_status"
  ```

---

### Task 12: Create NewVoyageModal component

**Files:**
- Create: `apps/logistics-dashboard/components/overview/NewVoyageModal.tsx`

- [ ] **Step 1: Create the modal**

  ```tsx
  'use client'

  import { useState, useRef, useEffect } from 'react'
  import { cn } from '@/lib/utils'

  interface FormState {
    hvdc_code: string
    vendor: string
    pol: string
    pod: string
    ship_mode: string
    incoterms: string
    etd: string
    atd: string
    eta: string
    ata: string
    vessel: string
    bl_awb: string
    status_no: string
    transit_days: string
    customs_days: string
    inland_days: string
    description: string
    doc_shu: boolean
    doc_das: boolean
    doc_mir: boolean
    doc_agi: boolean
  }

  const EMPTY_FORM: FormState = {
    hvdc_code: '', vendor: '', pol: '', pod: '', ship_mode: '', incoterms: '',
    etd: '', atd: '', eta: '', ata: '', vessel: '', bl_awb: '',
    status_no: '', transit_days: '', customs_days: '', inland_days: '',
    description: '', doc_shu: false, doc_das: false, doc_mir: false, doc_agi: false,
  }

  interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
  }

  function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400">
          {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        {children}
      </div>
    )
  }

  const inputCls = "rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none"
  const selectCls = cn(inputCls, "cursor-pointer")

  export function NewVoyageModal({ open, onClose, onSuccess }: Props) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [hvdcError, setHvdcError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (open) {
        setForm(EMPTY_FORM)
        setHvdcError(null)
        setTimeout(() => firstInputRef.current?.focus(), 50)
      }
    }, [open])

    const set = (field: keyof FormState) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setForm((f) => ({ ...f, [field]: val }))
      if (field === 'hvdc_code') setHvdcError(null)
    }

    const canSubmit = !!form.hvdc_code.trim() && !!form.vendor.trim() && !!form.pol.trim() && !!form.pod.trim() && !!form.ship_mode

    const dateError = (() => {
      if (form.etd && form.eta && form.etd > form.eta) return 'ETD는 ETA보다 이전이어야 합니다'
      if (form.atd && form.ata && form.atd > form.ata) return 'ATD는 ATA보다 이전이어야 합니다'
      return null
    })()

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit || dateError) return
      setSubmitting(true)
      try {
        const res = await fetch('/api/shipments/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hvdc_code: form.hvdc_code.trim().toUpperCase(),
            vendor: form.vendor.trim(),
            pol: form.pol.trim(),
            pod: form.pod.trim(),
            ship_mode: form.ship_mode,
            incoterms: form.incoterms || undefined,
            etd: form.etd || undefined,
            atd: form.atd || undefined,
            eta: form.eta || undefined,
            ata: form.ata || undefined,
            vessel: form.vessel || undefined,
            bl_awb: form.bl_awb || undefined,
            status_no: form.status_no ? Number(form.status_no) : undefined,
            transit_days: form.transit_days ? Number(form.transit_days) : undefined,
            customs_days: form.customs_days ? Number(form.customs_days) : undefined,
            inland_days: form.inland_days ? Number(form.inland_days) : undefined,
            doc_shu: form.doc_shu,
            doc_das: form.doc_das,
            doc_mir: form.doc_mir,
            doc_agi: form.doc_agi,
            description: form.description || undefined,
          }),
        })

        const data = await res.json() as { ok?: boolean; hvdc_code?: string; error?: string }

        if (res.status === 409) {
          setHvdcError('이미 존재하는 HVDC Code입니다')
          return
        }

        if (!res.ok) {
          setToast(`등록 실패: ${data.error ?? '알 수 없는 오류'}`)
          return
        }

        setToast(`항차 등록 완료: ${data.hvdc_code}`)
        onSuccess()
        onClose()
      } catch {
        setToast('등록 실패: 네트워크 오류')
      } finally {
        setSubmitting(false)
        setTimeout(() => setToast(null), 4000)
      }
    }

    if (!open) return null

    return (
      <>
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-gray-800 px-4 py-3 text-sm text-white shadow-xl">
            {toast}
          </div>
        )}

        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="신규 항차 등록"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-100">신규 항차 등록</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-200" aria-label="닫기">✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Row 1 */}
                <Field label="HVDC Code" required>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.hvdc_code}
                    onChange={set('hvdc_code')}
                    placeholder="HVDC-ADOPT-SCT-0001"
                    className={cn(inputCls, hvdcError && 'border-red-500')}
                  />
                  {hvdcError && <p className="text-xs text-red-400">{hvdcError}</p>}
                </Field>
                <Field label="Vendor" required>
                  <input type="text" value={form.vendor} onChange={set('vendor')} placeholder="PRYSMIAN" className={inputCls} />
                </Field>

                {/* Row 2 */}
                <Field label="POL (출발항)" required>
                  <input type="text" value={form.pol} onChange={set('pol')} placeholder="KRPUS" className={inputCls} />
                </Field>
                <Field label="POD (도착항)" required>
                  <input type="text" value={form.pod} onChange={set('pod')} placeholder="Khalifa Port" className={inputCls} />
                </Field>

                {/* Row 3 */}
                <Field label="Ship Mode" required>
                  <select value={form.ship_mode} onChange={set('ship_mode')} className={selectCls}>
                    <option value="">선택</option>
                    <option value="SEA">SEA</option>
                    <option value="AIR">AIR</option>
                    <option value="LAND">LAND</option>
                  </select>
                </Field>
                <Field label="Incoterms">
                  <select value={form.incoterms} onChange={set('incoterms')} className={selectCls}>
                    <option value="">선택</option>
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="DAP">DAP</option>
                  </select>
                </Field>

                {/* Row 4 */}
                <Field label="ETD">
                  <input type="date" value={form.etd} onChange={set('etd')} className={inputCls} />
                </Field>
                <Field label="ATD">
                  <input type="date" value={form.atd} onChange={set('atd')} className={inputCls} />
                </Field>

                {/* Row 5 */}
                <Field label="ETA">
                  <input type="date" value={form.eta} onChange={set('eta')} className={inputCls} />
                </Field>
                <Field label="ATA">
                  <input type="date" value={form.ata} onChange={set('ata')} className={inputCls} />
                </Field>

                {/* Row 6 */}
                <Field label="Vessel">
                  <input type="text" value={form.vessel} onChange={set('vessel')} placeholder="MSC LUNA" className={inputCls} />
                </Field>
                <Field label="B/L · AWB No.">
                  <input type="text" value={form.bl_awb} onChange={set('bl_awb')} className={inputCls} />
                </Field>

                {/* Row 7 */}
                <Field label="MR No.">
                  <input type="number" min={0} value={form.status_no} onChange={set('status_no')} className={inputCls} />
                </Field>
                <Field label="Transit Days">
                  <input type="number" min={0} value={form.transit_days} onChange={set('transit_days')} className={inputCls} />
                </Field>

                {/* Row 8 */}
                <Field label="Customs Days">
                  <input type="number" min={0} value={form.customs_days} onChange={set('customs_days')} className={inputCls} />
                </Field>
                <Field label="Inland Days">
                  <input type="number" min={0} value={form.inland_days} onChange={set('inland_days')} className={inputCls} />
                </Field>

                {/* Description — full width */}
                <div className="col-span-2">
                  <Field label="Description / 비고">
                    <textarea
                      value={form.description}
                      onChange={set('description')}
                      rows={3}
                      maxLength={500}
                      placeholder="특이사항, 메모..."
                      className={cn(inputCls, 'resize-none')}
                    />
                    <p className="text-right text-xs text-gray-500">{form.description.length}/500</p>
                  </Field>
                </div>

                {/* Site checkboxes — full width */}
                <div className="col-span-2">
                  <p className="mb-2 text-xs font-medium text-gray-400">납품 사이트</p>
                  <div className="flex gap-6">
                    {(['SHU', 'DAS', 'MIR', 'AGI'] as const).map((site) => {
                      const key = `doc_${site.toLowerCase()}` as keyof FormState
                      return (
                        <label key={site} className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={form[key] as boolean}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-800 accent-blue-500"
                          />
                          {site}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Date validation error */}
              {dateError && (
                <p className="mt-3 text-sm text-red-400">{dateError}</p>
              )}

              {/* Footer buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || !!dateError || submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    )
  }
  ```

- [ ] **Step 2: Typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1 | head -30
  ```

---

### Task 13: Wire NewVoyageModal into OverviewPageClient

**Files:**
- Modify: `apps/logistics-dashboard/components/overview/OverviewPageClient.tsx`

- [ ] **Step 1: Replace the placeholder modal with NewVoyageModal**

  Add import at top:
  ```ts
  import { NewVoyageModal } from '@/components/overview/NewVoyageModal'
  ```

  Replace the placeholder `{isNewVoyageOpen && ...}` block with:
  ```tsx
  <NewVoyageModal
    open={isNewVoyageOpen}
    onClose={() => setIsNewVoyageOpen(false)}
    onSuccess={() => setRefreshKey((k) => k + 1)}
  />
  ```

- [ ] **Step 2: Full typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit 2>&1
  ```

  Expected: 0 errors.

- [ ] **Step 3: Run all tests**

  ```bash
  cd apps/logistics-dashboard && pnpm vitest run
  ```

  Expected: all tests pass (existing tests unaffected).

- [ ] **Step 4: End-to-end visual verification**

  In browser at `http://localhost:3000`:

  1. **Search:** Type `sct0001` → dropdown shows results → click result → detail card appears in right panel → map trip highlights white
  2. **Toggles:** Toggle 🌐 Origin Arc → arcs disappear (zoom out to ≤ 8 first); Toggle 🚢 항차 → animated paths disappear; Toggle 🔥 Heatmap → heatmap appears
  3. **New Voyage:** Click ＋ 신규 항차 → modal opens with all fields → fill required fields (HVDC Code, Vendor, POL, POD, Ship Mode) → click 등록 → toast confirms → modal closes

- [ ] **Step 5: Final commit**

  ```bash
  git add apps/logistics-dashboard/components/overview/NewVoyageModal.tsx \
          apps/logistics-dashboard/components/overview/OverviewPageClient.tsx \
          apps/logistics-dashboard/app/api/shipments/new/
  git commit -m "feat(overview): complete new voyage modal with Supabase insert"
  ```

---

## Final: TypeScript Strict Check

- [ ] **Full monorepo typecheck**

  ```bash
  cd apps/logistics-dashboard && pnpm tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Run all tests**

  ```bash
  cd apps/logistics-dashboard && pnpm vitest run
  ```

  Expected: all tests pass.

---

## File Summary

| File | Action |
|------|--------|
| `types/logistics.ts` | +3 fields +3 action types |
| `store/logisticsStore.ts` | +3 state entries +3 actions |
| `lib/search/normalizeShipmentId.ts` | NEW — pure ID normalization |
| `lib/search/__tests__/normalizeShipmentId.test.ts` | NEW — Vitest tests |
| `app/api/shipments/route.ts` | +`q` ilike param |
| `app/api/shipments/new/route.ts` | NEW — POST endpoint |
| `components/map/layers/createTripsLayer.ts` | +`highlightId` param, highlight logic |
| `components/overview/OverviewMap.tsx` | read new store keys, fix `layerOriginArcs`/`layerTrips` |
| `components/overview/MapLayerToggles.tsx` | NEW — 3 toggle buttons |
| `components/overview/ShipmentSearchBar.tsx` | NEW — search input + dropdown |
| `components/overview/OverviewToolbar.tsx` | NEW — toolbar container |
| `components/overview/OverviewRightPanel.tsx` | +`selectedShipmentId` prop, detail card |
| `components/overview/NewVoyageModal.tsx` | NEW — full form modal |
| `components/overview/OverviewPageClient.tsx` | wire toolbar + modal + refreshKey |
| `hooks/useOverviewData.ts` | +`refreshKey` param, +refresh `useEffect` |
