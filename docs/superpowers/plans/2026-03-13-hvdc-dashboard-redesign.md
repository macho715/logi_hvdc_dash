# HVDC Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page `UnifiedLayout` dashboard with a 4-page multi-page logistics flow dashboard (Overview / Pipeline / Sites / Cargo) backed by Supabase data.

**Architecture:** Next.js App Router route group `(dashboard)` provides shared sidebar layout across 4 pages. New Zustand stores (`useCasesStore`, `useStockStore`) serve data from 3 new API routes. Existing `useOpsStore` and `useLogisticsStore` remain untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand 5, Supabase JS, Recharts, MapLibre GL 5 + deck.gl 9, pnpm workspace monorepo.

**Verification:** No test runner installed — use `pnpm typecheck` (tsc --noEmit) after each task. Visual verification via `pnpm dev` (port 3001).

**Spec:** `docs/superpowers/specs/2026-03-12-hvdc-dashboard-redesign.md`

---

## Chunk 1: Foundation — Types + API Routes

### Task 1: TypeScript Type Definitions

**Files:**
- Create: `apps/logistics-dashboard/types/cases.ts`

- [ ] **Step 1: Create type file**

```typescript
// apps/logistics-dashboard/types/cases.ts

export interface CaseRow {
  id: string
  case_no: string
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  flow_code: 0 | 1 | 2 | 3 | 4 | 5
  flow_description: string
  status_current: 'site' | 'warehouse' | 'Pre Arrival'
  status_location: string
  final_location: string
  sqm: number
  source_vendor: 'Hitachi' | 'Siemens' | string
  storage_type: string
  stack_status: string
  category: string
  sct_ship_no: string | null
  site_arrival_date: string | null  // ISO date
}

export interface CasesResponse {
  data: CaseRow[]
  total: number
  page: number
  pageSize: number
}

export interface CasesSummary {
  total: number
  byStatus: {
    site: number
    warehouse: number
    'Pre Arrival': number
  }
  bySite: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
    Unassigned: number
  }
  bySiteArrived: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
  }
  byFlowCode: Record<string, number>       // keys: "0"–"5"
  byVendor: Record<string, number>          // { Hitachi: n, Siemens: n, Other: n }
  bySqmByLocation: Record<string, number>  // { "DSV Outdoor": 846, ... }
  totalSqm: number
}

export interface ShipmentRow {
  id: string
  sct_ship_no: string
  vendor: string
  pol: string
  pod: string
  etd: string | null
  atd: string | null
  eta: string | null
  ata: string | null
  cif_value: number | null
  customs_status: 'cleared' | 'in_progress' | 'pending'
  ship_mode: 'Container' | 'Air' | 'Bulk' | 'LCL' | string
  container_no: string | null
}

export interface ShipmentsResponse {
  data: ShipmentRow[]
  total: number
  page: number
  pageSize: number
}

export interface StockRow {
  id: string
  no: number
  sku: string
  description: string
  location: string
  pallet_id: string
  qty: number
  shipping_ref: string
  date_received: string  // ISO date
}

export interface StockResponse {
  data: StockRow[]
  total: number
  page: number
  pageSize: number
}

export interface CasesFilter {
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI' | 'all'
  flow_code: 0 | 1 | 2 | 3 | 4 | 5 | 'all'
  status_current: CaseRow['status_current'] | CaseRow['status_current'][] | 'all'
  vendor: 'Hitachi' | 'Siemens' | 'Other' | 'all'
  category: 'Elec' | 'Mech' | 'Inst.' | 'all'
  location: string | 'all'
}

export const DEFAULT_CASES_FILTER: CasesFilter = {
  site: 'all',
  flow_code: 'all',
  status_current: 'all',
  vendor: 'all',
  category: 'all',
  location: 'all',
}

export interface StockFilter {
  location: string | 'all'
  sku: string | 'all'
}

export const DEFAULT_STOCK_FILTER: StockFilter = {
  location: 'all',
  sku: 'all',
}

// Pipeline stage ↔ status_current mapping
export type PipelineStage = 'pre-arrival' | 'warehouse' | 'site'

export const STAGE_TO_STATUS: Record<PipelineStage, CaseRow['status_current']> = {
  'pre-arrival': 'Pre Arrival',
  'warehouse': 'warehouse',
  'site': 'site',
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd apps/logistics-dashboard
pnpm typecheck
```

Expected: 0 errors (types file is standalone, no imports).

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/types/cases.ts
git commit -m "feat: add TypeScript type definitions for cases, shipments, stock"
```

---

### Task 2: `/api/cases` Route

**Files:**
- Create: `apps/logistics-dashboard/app/api/cases/route.ts`

This route queries `case.cases` table with optional filters and pagination.

- [ ] **Step 1: Create route file**

```typescript
// apps/logistics-dashboard/app/api/cases/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { CaseRow, CasesResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site')
    const flow_code = searchParams.get('flow_code')
    const vendor = searchParams.get('vendor')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)
    // status_current supports repeating params: ?status_current=warehouse&status_current=Pre+Arrival
    const status_current_values = searchParams.getAll('status_current')

    let query = supabase
      .schema('case')
      .from('cases')
      .select(
        `id, case_no, site, flow_code, flow_description,
         status_current, status_location, final_location,
         sqm, source_vendor, storage_type, stack_status,
         category, sct_ship_no, site_arrival_date`,
        { count: 'exact' }
      )

    if (site && site !== 'all') query = query.eq('site', site)
    if (flow_code && flow_code !== 'all') query = query.eq('flow_code', parseInt(flow_code, 10))
    if (vendor && vendor !== 'all') {
      if (vendor === 'Other') {
        query = query.not('source_vendor', 'in', '(Hitachi,Siemens)')
      } else {
        query = query.eq('source_vendor', vendor)
      }
    }
    if (category && category !== 'all') query = query.eq('category', category)
    if (location && location !== 'all') query = query.eq('status_location', location)
    if (status_current_values.length === 1 && status_current_values[0] !== 'all') {
      query = query.eq('status_current', status_current_values[0])
    } else if (status_current_values.length > 1) {
      query = query.in('status_current', status_current_values)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('case_no')

    const { data, error, count } = await query

    if (error) {
      console.error('cases query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies CasesResponse)
    }

    return NextResponse.json({
      data: (data ?? []) as CaseRow[],
      total: count ?? 0,
      page,
      pageSize,
    } satisfies CasesResponse)
  } catch (err) {
    console.error('GET /api/cases error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies CasesResponse)
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Test manually in dev**

Start dev server (`pnpm dev`) and navigate to:
`http://localhost:3001/api/cases?pageSize=5`

Expected: JSON with `{ data: [...], total: N, page: 1, pageSize: 5 }`.
If Supabase not connected: `{ data: [], total: 0, page: 1, pageSize: 5 }` (graceful fallback).

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/api/cases/route.ts
git commit -m "feat: add GET /api/cases route with filtering and pagination"
```

---

### Task 3: `/api/cases/summary` Route

**Files:**
- Create: `apps/logistics-dashboard/app/api/cases/summary/route.ts`

This route computes all KPI aggregations from `case.cases` in one call.

- [ ] **Step 1: Create route file**

```typescript
// apps/logistics-dashboard/app/api/cases/summary/route.ts

import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { CasesSummary } from '@/types/cases'

const EMPTY_SUMMARY: CasesSummary = {
  total: 0,
  byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0 },
  bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
  bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
  byFlowCode: {},
  byVendor: {},
  bySqmByLocation: {},
  totalSqm: 0,
}

export async function GET() {
  try {
    // Fetch all cases (only needed columns for aggregation)
    const { data, error } = await supabase
      .schema('case')
      .from('cases')
      .select('site, flow_code, status_current, status_location, sqm, source_vendor')

    if (error || !data) {
      console.error('cases/summary query error:', error)
      return NextResponse.json(EMPTY_SUMMARY)
    }

    const summary: CasesSummary = {
      total: data.length,
      byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0 },
      bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
      bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
      byFlowCode: {},
      byVendor: {},
      bySqmByLocation: {},
      totalSqm: 0,
    }

    for (const row of data) {
      // byStatus
      const st = row.status_current as string
      if (st === 'site') summary.byStatus.site++
      else if (st === 'warehouse') summary.byStatus.warehouse++
      else summary.byStatus['Pre Arrival']++

      // bySite
      const site = row.site as string
      if (site === 'SHU') summary.bySite.SHU++
      else if (site === 'MIR') summary.bySite.MIR++
      else if (site === 'DAS') summary.bySite.DAS++
      else if (site === 'AGI') summary.bySite.AGI++
      else summary.bySite.Unassigned++

      // bySiteArrived
      if (st === 'site') {
        if (site === 'SHU') summary.bySiteArrived.SHU++
        else if (site === 'MIR') summary.bySiteArrived.MIR++
        else if (site === 'DAS') summary.bySiteArrived.DAS++
        else if (site === 'AGI') summary.bySiteArrived.AGI++
      }

      // byFlowCode (string keys)
      const fc = String(row.flow_code ?? 'null')
      summary.byFlowCode[fc] = (summary.byFlowCode[fc] ?? 0) + 1

      // byVendor
      const v = row.source_vendor as string
      const vendorKey = v === 'Hitachi' || v === 'Siemens' ? v : 'Other'
      summary.byVendor[vendorKey] = (summary.byVendor[vendorKey] ?? 0) + 1

      // bySqmByLocation (only warehouse cases)
      const sqm = typeof row.sqm === 'number' ? row.sqm : 0
      summary.totalSqm += sqm
      if (st === 'warehouse' && row.status_location) {
        const loc = row.status_location as string
        summary.bySqmByLocation[loc] = (summary.bySqmByLocation[loc] ?? 0) + sqm
      }
    }

    return NextResponse.json(summary)
  } catch (err) {
    console.error('GET /api/cases/summary error:', err)
    return NextResponse.json(EMPTY_SUMMARY)
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Test manually**

`http://localhost:3001/api/cases/summary`

Expected: JSON matching `CasesSummary` shape. Verify `total` = `byStatus.site + byStatus.warehouse + byStatus['Pre Arrival']`.

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/api/cases/summary/route.ts
git commit -m "feat: add GET /api/cases/summary aggregation route"
```

---

### Task 4: `/api/shipments` Route

**Files:**
- Create: `apps/logistics-dashboard/app/api/shipments/route.ts`

> **Note:** The existing `public.shipments` table is already queried by `/api/worklist`. This new endpoint exposes the same table with different column selection and simpler response shape.

- [ ] **Step 1: Create route file**

```typescript
// apps/logistics-dashboard/app/api/shipments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { ShipmentRow, ShipmentsResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor')
    const pod = searchParams.get('pod')
    const customs_status = searchParams.get('customs_status')
    const ship_mode = searchParams.get('ship_mode')
    const sct_ship_no = searchParams.get('sct_ship_no')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    let query = supabase
      .from('shipments')
      .select(
        `id, sct_ship_no, vendor,
         port_of_loading, port_of_discharge,
         etd, eta, delivery_date,
         ship_mode, bl_awb_no,
         duty_amount_aed, vat_amount_aed,
         customs_start_date, customs_close_date`,
        { count: 'exact' }
      )

    if (vendor && vendor !== 'all') query = query.eq('vendor', vendor)
    if (pod && pod !== 'all') query = query.eq('port_of_discharge', pod)
    if (ship_mode && ship_mode !== 'all') query = query.eq('ship_mode', ship_mode)
    if (sct_ship_no) query = query.eq('sct_ship_no', sct_ship_no)
    // customs_status derived: cleared = customs_close_date not null, in_progress = start but no close
    if (customs_status === 'cleared') {
      query = query.not('customs_close_date', 'is', null)
    } else if (customs_status === 'in_progress') {
      query = query
        .not('customs_start_date', 'is', null)
        .is('customs_close_date', null)
    } else if (customs_status === 'pending') {
      query = query.is('customs_start_date', null)
    }

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1).order('sct_ship_no')

    const { data, error, count } = await query

    if (error) {
      console.error('shipments query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies ShipmentsResponse)
    }

    // Local type matching the selected columns from public.shipments
    interface ShipmentsDbRow {
      id: string
      sct_ship_no: string | null
      vendor: string | null
      port_of_loading: string | null
      port_of_discharge: string | null
      etd: string | null
      eta: string | null
      delivery_date: string | null
      ship_mode: string | null
      bl_awb_no: string | null
      duty_amount_aed: number | null
      vat_amount_aed: number | null
      customs_start_date: string | null
      customs_close_date: string | null
    }

    const rows: ShipmentRow[] = ((data ?? []) as ShipmentsDbRow[]).map(s => ({
      id: s.id,
      sct_ship_no: s.sct_ship_no ?? '',
      vendor: s.vendor ?? '',
      pol: s.port_of_loading ?? '',
      pod: s.port_of_discharge ?? '',
      etd: s.etd ?? null,
      atd: null,  // ATD column not in public.shipments schema; leave null
      eta: s.eta ?? null,
      ata: s.delivery_date ?? null,  // delivery_date serves as ATA
      // CIF value derived from duty + VAT (approximate) or null if both missing
      cif_value: s.duty_amount_aed != null || s.vat_amount_aed != null
        ? (Number(s.duty_amount_aed ?? 0) + Number(s.vat_amount_aed ?? 0))
        : null,
      customs_status: s.customs_close_date
        ? 'cleared'
        : s.customs_start_date
        ? 'in_progress'
        : 'pending',
      ship_mode: s.ship_mode ?? '',
      container_no: s.bl_awb_no ?? null,  // bl_awb_no is the closest available container reference
    }))

    return NextResponse.json({ data: rows, total: count ?? 0, page, pageSize } satisfies ShipmentsResponse)
  } catch (err) {
    console.error('GET /api/shipments error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies ShipmentsResponse)
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Test manually**

`http://localhost:3001/api/shipments?pageSize=5`

Expected: `{ data: [...], total: 874, page: 1, pageSize: 5 }`

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/api/shipments/route.ts
git commit -m "feat: add GET /api/shipments route"
```

---

### Task 5: `/api/stock` Route

**Files:**
- Create: `apps/logistics-dashboard/app/api/stock/route.ts`

- [ ] **Step 1: Create route file**

```typescript
// apps/logistics-dashboard/app/api/stock/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { StockRow, StockResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const sku = searchParams.get('sku')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    let query = supabase
      .schema('wh')
      .from('stock_onhand')
      .select(
        'id, no, sku, description, location, pallet_id, qty, shipping_ref, date_received',
        { count: 'exact' }
      )

    if (location && location !== 'all') query = query.eq('location', location)
    if (sku && sku !== 'all') query = query.ilike('sku', `%${sku}%`)

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1).order('no')

    const { data, error, count } = await query

    if (error) {
      console.error('stock_onhand query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies StockResponse)
    }

    return NextResponse.json({
      data: (data ?? []) as StockRow[],
      total: count ?? 0,
      page,
      pageSize,
    } satisfies StockResponse)
  } catch (err) {
    console.error('GET /api/stock error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies StockResponse)
  }
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Test manually**

`http://localhost:3001/api/stock?pageSize=5`

Expected: `{ data: [...], total: 791, page: 1, pageSize: 5 }` or empty fallback.

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/api/stock/route.ts
git commit -m "feat: add GET /api/stock route for DSV warehouse inventory"
```

---

## Chunk 2: Zustand Stores + Layout Shell + Migration

### Task 6: `useCasesStore`

**Files:**
- Create: `apps/logistics-dashboard/store/casesStore.ts`

- [ ] **Step 1: Create store**

```typescript
// apps/logistics-dashboard/store/casesStore.ts

import { create } from 'zustand'
import type { CaseRow, CasesFilter, CasesSummary, PipelineStage } from '@/types/cases'
import { DEFAULT_CASES_FILTER } from '@/types/cases'
// STAGE_TO_STATUS is a runtime const — import as value, not type
import { STAGE_TO_STATUS } from '@/types/cases'

interface CasesStore {
  cases: CaseRow[]
  summary: CasesSummary | null
  filters: CasesFilter
  activePipelineStage: PipelineStage | null
  selectedCaseId: string | null
  isDrawerOpen: boolean
  isLoading: boolean
  isSummaryLoading: boolean

  fetchCases: () => Promise<void>
  fetchSummary: () => Promise<void>
  setFilter: <K extends keyof CasesFilter>(key: K, value: CasesFilter[K]) => void
  resetFilters: () => void
  setActivePipelineStage: (stage: PipelineStage | null) => void
  openDrawer: (caseId: string) => void
  closeDrawer: () => void
}

function buildCasesUrl(filters: CasesFilter, page = 1, pageSize = 50): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (filters.site !== 'all') params.set('site', filters.site)
  if (filters.flow_code !== 'all') params.set('flow_code', String(filters.flow_code))
  if (filters.vendor !== 'all') params.set('vendor', filters.vendor)
  if (filters.category !== 'all') params.set('category', filters.category)
  if (filters.location !== 'all') params.set('location', filters.location)
  if (filters.status_current !== 'all') {
    const sc = filters.status_current
    if (Array.isArray(sc)) {
      sc.forEach(v => params.append('status_current', v))
    } else {
      params.set('status_current', sc)
    }
  }
  return `/api/cases?${params.toString()}`
}

export const useCasesStore = create<CasesStore>((set, get) => ({
  cases: [],
  summary: null,
  filters: DEFAULT_CASES_FILTER,
  activePipelineStage: null,
  selectedCaseId: null,
  isDrawerOpen: false,
  isLoading: false,
  isSummaryLoading: false,

  fetchCases: async () => {
    set({ isLoading: true })
    try {
      const url = buildCasesUrl(get().filters)
      const res = await fetch(url)
      const json = await res.json()
      set({ cases: json.data ?? [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchSummary: async () => {
    set({ isSummaryLoading: true })
    try {
      const res = await fetch('/api/cases/summary')
      const json = await res.json()
      set({ summary: json, isSummaryLoading: false })
    } catch {
      set({ isSummaryLoading: false })
    }
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value } }))
  },

  resetFilters: () => set({ filters: DEFAULT_CASES_FILTER }),

  setActivePipelineStage: (stage) => set({ activePipelineStage: stage }),

  openDrawer: (caseId) => set({ selectedCaseId: caseId, isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedCaseId: null }),
}))
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/store/casesStore.ts
git commit -m "feat: add useCasesStore with filter, pagination, and drawer state"
```

---

### Task 7: `useStockStore`

**Files:**
- Create: `apps/logistics-dashboard/store/stockStore.ts`

- [ ] **Step 1: Create store**

```typescript
// apps/logistics-dashboard/store/stockStore.ts

import { create } from 'zustand'
import type { StockRow, StockFilter } from '@/types/cases'
import { DEFAULT_STOCK_FILTER } from '@/types/cases'

interface StockStore {
  stock: StockRow[]
  total: number
  filters: StockFilter
  isLoading: boolean

  fetchStock: (params?: Partial<StockFilter & { page?: number }>) => Promise<void>
  setFilter: <K extends keyof StockFilter>(key: K, value: StockFilter[K]) => void
  resetFilters: () => void
}

export const useStockStore = create<StockStore>((set, get) => ({
  stock: [],
  total: 0,
  filters: DEFAULT_STOCK_FILTER,
  isLoading: false,

  fetchStock: async (params = {}) => {
    set({ isLoading: true })
    try {
      const filters = { ...get().filters, ...params }
      const urlParams = new URLSearchParams()
      if (filters.location !== 'all') urlParams.set('location', filters.location)
      if (filters.sku !== 'all') urlParams.set('sku', filters.sku)
      urlParams.set('page', String(params.page ?? 1))
      urlParams.set('pageSize', '50')

      const res = await fetch(`/api/stock?${urlParams.toString()}`)
      const json = await res.json()
      set({ stock: json.data ?? [], total: json.total ?? 0, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setFilter: (key, value) => {
    set(state => ({ filters: { ...state.filters, [key]: value } }))
  },

  resetFilters: () => set({ filters: DEFAULT_STOCK_FILTER }),
}))
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/store/stockStore.ts
git commit -m "feat: add useStockStore for DSV inventory state management"
```

---

### Task 8: KpiProvider

**Files:**
- Create: `apps/logistics-dashboard/components/layout/KpiProvider.tsx`

This component wraps `useKpiRealtime` (which already exists) so all dashboard pages share the subscription without needing `KpiStrip`.

- [ ] **Step 1: Create provider**

```tsx
// apps/logistics-dashboard/components/layout/KpiProvider.tsx
'use client'

import { useKpiRealtime } from '@/hooks/useKpiRealtime'

/** Mount inside (dashboard)/layout.tsx to keep Realtime subscription alive across pages */
export function KpiProvider() {
  useKpiRealtime({ enabled: true })
  return null
}
```

- [ ] **Step 2: Verify useKpiRealtime accepts `{ enabled: boolean }`**

Check `apps/logistics-dashboard/hooks/useKpiRealtime.ts` for its parameter signature. If it takes no args, change the call to just `useKpiRealtime()`.

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/components/layout/KpiProvider.tsx
git commit -m "feat: add KpiProvider to host Realtime subscription in layout"
```

---

### Task 9: Sidebar

**Files:**
- Create: `apps/logistics-dashboard/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create sidebar**

```tsx
// apps/logistics-dashboard/components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, ArrowRightLeft, Building2, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: Map,           label: 'Overview',  href: '/overview'  },
  { icon: ArrowRightLeft, label: 'Pipeline', href: '/pipeline'  },
  { icon: Building2,     label: 'Sites',     href: '/sites'     },
  { icon: Package,       label: 'Cargo',     href: '/cargo'     },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gray-900 text-white transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo / collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-700">
        {!collapsed && (
          <span className="text-sm font-semibold text-gray-100 truncate">HVDC Logistics</span>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 mx-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/layout/Sidebar.tsx
git commit -m "feat: add collapsible Sidebar navigation component"
```

---

### Task 10: DashboardHeader

**Files:**
- Create: `apps/logistics-dashboard/components/layout/DashboardHeader.tsx`

Absorbs `ConnectionStatusBadge` and `GlobalSearch`.

- [ ] **Step 1: Check `ConnectionStatusBadge` and `GlobalSearch` signatures**

Read the following files to understand props:
- `apps/logistics-dashboard/components/hvdc/ConnectionStatusBadge.tsx`
- `apps/logistics-dashboard/components/search/GlobalSearch.tsx`

- [ ] **Step 2: Create header**

```tsx
// apps/logistics-dashboard/components/layout/DashboardHeader.tsx
'use client'

import { ConnectionStatusBadge } from '@/components/hvdc/ConnectionStatusBadge'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export function DashboardHeader() {
  return (
    <header className="h-12 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-700 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono">HVDC LOGI</span>
      </div>
      <div className="flex items-center gap-3">
        <GlobalSearch />
        <ConnectionStatusBadge />
      </div>
    </header>
  )
}
```

> If `GlobalSearch` or `ConnectionStatusBadge` require props, pass them appropriately based on what you read in step 1.

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/components/layout/DashboardHeader.tsx
git commit -m "feat: add DashboardHeader with GlobalSearch and ConnectionStatusBadge"
```

---

### Task 11: Dashboard Route Group Layout

**Files:**
- Create: `apps/logistics-dashboard/app/(dashboard)/layout.tsx`
- Create: `apps/logistics-dashboard/app/(dashboard)/overview/page.tsx` (placeholder)
- Create: `apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx` (placeholder)
- Create: `apps/logistics-dashboard/app/(dashboard)/sites/page.tsx` (placeholder)
- Create: `apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx` (placeholder)
- Modify: `apps/logistics-dashboard/app/page.tsx`

- [ ] **Step 1: Create (dashboard)/layout.tsx**

```tsx
// apps/logistics-dashboard/app/(dashboard)/layout.tsx
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { KpiProvider } from '@/components/layout/KpiProvider'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardHeader />
        <KpiProvider />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create placeholder pages**

```tsx
// apps/logistics-dashboard/app/(dashboard)/overview/page.tsx
export default function OverviewPage() {
  return <div className="p-6 text-white">Overview — coming soon</div>
}
```

```tsx
// apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx
export default function PipelinePage() {
  return <div className="p-6 text-white">Pipeline — coming soon</div>
}
```

```tsx
// apps/logistics-dashboard/app/(dashboard)/sites/page.tsx
export default function SitesPage() {
  return <div className="p-6 text-white">Sites — coming soon</div>
}
```

```tsx
// apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx
export default function CargoPage() {
  return <div className="p-6 text-white">Cargo — coming soon</div>
}
```

- [ ] **Step 3: Update app/page.tsx to redirect**

```tsx
// apps/logistics-dashboard/app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/overview')
}
```

- [ ] **Step 4: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 5: Verify dev server**

`pnpm dev` — Navigate to `http://localhost:3001`. Should redirect to `/overview` and show the sidebar + "Overview — coming soon".

- [ ] **Step 6: Commit**

```bash
git add apps/logistics-dashboard/app/(dashboard)/
git add apps/logistics-dashboard/app/page.tsx
git commit -m "feat: add (dashboard) route group with sidebar layout and placeholder pages"
```

---

### Task 12: Old Component Teardown

Remove deprecated components per migration table. Do this AFTER confirming the dev server shows the new layout correctly.

**Files to delete:**
- `apps/logistics-dashboard/components/UnifiedLayout.tsx`
- `apps/logistics-dashboard/components/hvdc/KpiStrip.tsx` (UI; hook kept)
- `apps/logistics-dashboard/components/hvdc/StageCardsStrip.tsx`
- `apps/logistics-dashboard/components/hvdc/WorklistTable.tsx`
- `apps/logistics-dashboard/components/hvdc/DetailDrawer.tsx`
- `apps/logistics-dashboard/components/dashboard/RightPanel.tsx`
- `apps/logistics-dashboard/components/dashboard/HeaderBar.tsx`
- `apps/logistics-dashboard/components/search/GlobalSearch.tsx` ← **deferred to Task 27 Step 5** (requires DashboardHeader to be updated first)
- `apps/logistics-dashboard/components/hvdc/ConnectionStatusBadge.tsx` ← **deferred to Task 27 Step 5** (requires DashboardHeader to be updated first)

> **Do NOT delete:**
> - `apps/logistics-dashboard/hooks/useKpiRealtime.ts` (kept; used by KpiProvider)
> - `apps/logistics-dashboard/components/map/MapView.tsx` (kept until OverviewMap is ready in Task 14)

- [ ] **Step 1: Remove files** (7 files — GlobalSearch and ConnectionStatusBadge are handled later in Task 27 Step 5)

```bash
cd apps/logistics-dashboard
rm components/UnifiedLayout.tsx
rm components/hvdc/KpiStrip.tsx
rm components/hvdc/StageCardsStrip.tsx
rm components/hvdc/WorklistTable.tsx
rm components/hvdc/DetailDrawer.tsx
rm components/dashboard/RightPanel.tsx
rm components/dashboard/HeaderBar.tsx
```

- [ ] **Step 2: Fix any broken imports**

```bash
pnpm typecheck
```

Fix each error by removing the import referencing deleted files. If any page still imports from these files, update the import to the new path or remove it.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "refactor: remove deprecated UnifiedLayout and legacy components"
```

---

## Chunk 3: Page 1 — Overview

### Task 13: KpiStripCards

**Files:**
- Create: `apps/logistics-dashboard/components/overview/KpiStripCards.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/overview/KpiStripCards.tsx
'use client'

import { useEffect } from 'react'
import { useCasesStore } from '@/store/casesStore'

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

export function KpiStripCards() {
  const { summary, fetchSummary, isSummaryLoading } = useCasesStore()

  useEffect(() => { fetchSummary() }, [fetchSummary])

  if (isSummaryLoading || !summary) {
    return (
      <div className="grid grid-cols-4 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  const siteRate = summary.total > 0
    ? ((summary.byStatus.site / summary.total) * 100).toFixed(1)
    : '0.0'
  const whRate = summary.total > 0
    ? ((summary.byStatus.warehouse / summary.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      <KpiCard
        label="총 케이스"
        value={summary.total.toLocaleString()}
      />
      <KpiCard
        label="현장 도착"
        value={summary.byStatus.site.toLocaleString()}
        sub={`${siteRate}%`}
      />
      <KpiCard
        label="창고 재고"
        value={summary.byStatus.warehouse.toLocaleString()}
        sub={`${whRate}%`}
      />
      <KpiCard
        label="SQM 합계"
        value={summary.totalSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        sub="㎡"
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/overview/KpiStripCards.tsx
git commit -m "feat: add KpiStripCards component for overview page"
```

---

### Task 14: OverviewMap

**Files:**
- Create: `apps/logistics-dashboard/components/overview/OverviewMap.tsx`

Copy the existing `MapView.tsx` as a starting base and adapt it. The existing map already renders POI nodes. Extend it to add Flow Code arc layers from the `bySite` summary.

- [ ] **Step 1: Copy MapView as base**

```bash
cp apps/logistics-dashboard/components/map/MapView.tsx \
   apps/logistics-dashboard/components/overview/OverviewMap.tsx
```

- [ ] **Step 2: Rename the component export**

In `OverviewMap.tsx`, change the function name and export to a **named export**:

```typescript
// Before (whatever the existing export is — default or named MapView):
export default function MapView(...) { ... }
// OR: export function MapView(...) { ... }

// After — must be a named export (Task 16 imports { OverviewMap }):
export function OverviewMap(...) { ... }
```

Remove any `export default` statement that previously exported `MapView`. If there are other named exports in the file, leave them unchanged.

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

Fix any import issues (the component likely imports from `@/lib/map/` — those paths remain valid).

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/components/overview/OverviewMap.tsx
git commit -m "feat: add OverviewMap based on existing MapView"
```

---

### Task 15: OverviewRightPanel

**Files:**
- Create: `apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx`

Shows Flow Code distribution (horizontal bar) and site delivery rates (progress bars).

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx
'use client'

import { useCasesStore } from '@/store/casesStore'

const FLOW_CODE_COLORS: Record<string, string> = {
  '0': '#6b7280', '1': '#3b82f6', '2': '#22c55e',
  '3': '#f97316', '4': '#ef4444', '5': '#a855f7',
}

const SITE_LABELS: Record<string, string> = {
  SHU: 'SHU (Mirfa Onshore)',
  MIR: 'MIR (Mirfa)',
  DAS: 'DAS (Das Island)',
  AGI: 'AGI (Al Ghallan)',
}

export function OverviewRightPanel() {
  const { summary } = useCasesStore()

  if (!summary) {
    return <div className="w-72 bg-gray-900 p-4 text-gray-500 text-sm">Loading...</div>
  }

  const flowCodes = ['0', '1', '2', '3', '4', '5']
  const maxFlow = Math.max(...flowCodes.map(fc => summary.byFlowCode[fc] ?? 0), 1)

  const sites = ['SHU', 'MIR', 'DAS', 'AGI'] as const

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto">
      {/* Flow Code distribution */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Flow Code 분포</h3>
        <div className="space-y-2">
          {flowCodes.map(fc => {
            const count = summary.byFlowCode[fc] ?? 0
            const pct = Math.round((count / maxFlow) * 100)
            return (
              <div key={fc} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">FC{fc}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: FLOW_CODE_COLORS[fc] }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{count.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Site delivery rates */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">현장 달성률</h3>
        <div className="space-y-3">
          {sites.map(site => {
            const total = summary.bySite[site] ?? 0
            const arrived = summary.bySiteArrived[site] ?? 0
            const rate = total > 0 ? (arrived / total) * 100 : 0
            const isAlert = site === 'AGI' && rate < 50
            return (
              <div key={site}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isAlert ? 'text-red-400 font-semibold' : 'text-gray-300'}>
                    {SITE_LABELS[site]}
                  </span>
                  <span className={isAlert ? 'text-red-400' : 'text-gray-400'}>
                    {rate.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${rate}%`,
                      backgroundColor: isAlert ? '#ef4444' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx
git commit -m "feat: add OverviewRightPanel with Flow Code distribution and site delivery rates"
```

---

### Task 16: Wire Overview Page

**Files:**
- Modify: `apps/logistics-dashboard/app/(dashboard)/overview/page.tsx`

- [ ] **Step 1: Update page**

```tsx
// apps/logistics-dashboard/app/(dashboard)/overview/page.tsx
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'

export default function OverviewPage() {
  return (
    <div className="flex flex-col h-full">
      <KpiStripCards />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1">
          <OverviewMap />
        </div>
        <OverviewRightPanel />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Visual check**

`http://localhost:3001/overview` — should show:
- Top row: 4 KPI cards
- Center: map
- Right panel: Flow Code bars + site delivery progress bars

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/(dashboard)/overview/page.tsx
git commit -m "feat: complete Overview page with map, KPI cards, and right panel"
```

---

## Chunk 4: Page 2 — Pipeline

### Task 17: FlowPipeline (Stage Bar)

**Files:**
- Create: `apps/logistics-dashboard/components/pipeline/FlowPipeline.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/pipeline/FlowPipeline.tsx
'use client'

import { useCasesStore } from '@/store/casesStore'
import type { PipelineStage } from '@/types/cases'
import { cn } from '@/lib/utils'

const STAGES: { key: PipelineStage; label: string; statusKey: 'Pre Arrival' | 'warehouse' | 'site' }[] = [
  { key: 'pre-arrival', label: 'Pre-Arrival',   statusKey: 'Pre Arrival' },
  { key: 'warehouse',  label: '창고/MOSB',       statusKey: 'warehouse'  },
  { key: 'site',       label: '현장 도착',        statusKey: 'site'       },
]

export function FlowPipeline() {
  const { summary, activePipelineStage, setActivePipelineStage } = useCasesStore()

  const total = summary?.total ?? 0

  return (
    <div className="flex items-stretch gap-0 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {STAGES.map((stage, i) => {
        const count = summary?.byStatus[stage.statusKey] ?? 0
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        const active = activePipelineStage === stage.key

        return (
          <div key={stage.key} className="flex items-center">
            {i > 0 && (
              <div className="text-gray-600 text-xl px-1 select-none">→</div>
            )}
            <button
              onClick={() =>
                setActivePipelineStage(active ? null : stage.key)
              }
              className={cn(
                'flex flex-col items-center px-8 py-4 transition-colors text-center',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <span className="text-2xl font-bold">{count.toLocaleString()}</span>
              <span className="text-xs mt-1">{stage.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{pct}%</span>
              {/* MOSB sub-count for warehouse stage */}
              {stage.key === 'warehouse' && summary && (
                <span className="text-xs text-orange-400 mt-1">
                  MOSB {(summary.bySqmByLocation['MOSB'] ?? 0) > 0 ? '~304' : '–'}건 포함
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/pipeline/FlowPipeline.tsx
git commit -m "feat: add FlowPipeline stage bar with click-to-filter"
```

---

### Task 18: PipelineFilterBar

**Files:**
- Create: `apps/logistics-dashboard/components/pipeline/PipelineFilterBar.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/pipeline/PipelineFilterBar.tsx
'use client'

import { useCasesStore } from '@/store/casesStore'
import type { CasesFilter } from '@/types/cases'

type SelectProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400 whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function PipelineFilterBar() {
  const { filters, setFilter, resetFilters } = useCasesStore()

  return (
    <div className="flex items-center gap-4 flex-wrap bg-gray-900 px-4 py-2 border-b border-gray-800">
      <FilterSelect
        label="사이트"
        value={String(filters.site)}
        onChange={v => setFilter('site', v as CasesFilter['site'])}
        options={[
          { value: 'all', label: '전체' },
          { value: 'SHU', label: 'SHU' },
          { value: 'MIR', label: 'MIR' },
          { value: 'DAS', label: 'DAS' },
          { value: 'AGI', label: 'AGI' },
        ]}
      />
      <FilterSelect
        label="벤더"
        value={String(filters.vendor)}
        onChange={v => setFilter('vendor', v as CasesFilter['vendor'])}
        options={[
          { value: 'all', label: '전체' },
          { value: 'Hitachi', label: 'Hitachi' },
          { value: 'Siemens', label: 'Siemens' },
          { value: 'Other', label: 'Other' },
        ]}
      />
      <FilterSelect
        label="카테고리"
        value={String(filters.category)}
        onChange={v => setFilter('category', v as CasesFilter['category'])}
        options={[
          { value: 'all', label: '전체' },
          { value: 'Elec', label: 'Elec' },
          { value: 'Mech', label: 'Mech' },
          { value: 'Inst.', label: 'Inst.' },
        ]}
      />
      <button
        onClick={resetFilters}
        className="text-xs text-gray-500 hover:text-gray-300 ml-auto"
      >
        초기화
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/pipeline/PipelineFilterBar.tsx
git commit -m "feat: add PipelineFilterBar with site/vendor/category filters"
```

---

### Task 19: Pipeline Chart Panels (5 panels)

**Files:**
- Create: `apps/logistics-dashboard/components/pipeline/FlowCodeDonut.tsx`
- Create: `apps/logistics-dashboard/components/pipeline/VendorBar.tsx`
- Create: `apps/logistics-dashboard/components/pipeline/TransportModeBar.tsx`
- Create: `apps/logistics-dashboard/components/pipeline/CustomsStatusCard.tsx`
- Create: `apps/logistics-dashboard/components/pipeline/WarehouseSqmBar.tsx`

All 5 panels use Recharts. Create them in one commit.

- [ ] **Step 1: Create FlowCodeDonut.tsx**

```tsx
// apps/logistics-dashboard/components/pipeline/FlowCodeDonut.tsx
'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import type { CasesFilter } from '@/types/cases'

const COLORS = ['#6b7280','#3b82f6','#22c55e','#f97316','#ef4444','#a855f7']

export function FlowCodeDonut() {
  const { summary, setFilter } = useCasesStore()
  if (!summary) return <div className="h-48 bg-gray-800 animate-pulse rounded" />

  const data = ['0','1','2','3','4','5'].map(fc => ({
    name: `FC${fc}`,
    value: summary.byFlowCode[fc] ?? 0,
    fc,
  })).filter(d => d.value > 0)

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">Flow Code 분포</h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={70}
            onClick={(entry: any) => {
              const fc = parseInt(entry.fc, 10)
              setFilter('flow_code', fc as CasesFilter['flow_code'])
            }}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Legend iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Create VendorBar.tsx**

```tsx
// apps/logistics-dashboard/components/pipeline/VendorBar.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCasesStore } from '@/store/casesStore'

export function VendorBar() {
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  const data = Object.entries(summary.byVendor).map(([name, value]) => ({ name, value }))

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">벤더별</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill="#3b82f6" radius={[0,3,3,0]}>
            {data.map((_, i) => <Cell key={i} fill={['#3b82f6','#10b981','#6b7280'][i % 3]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create TransportModeBar.tsx**

```tsx
// apps/logistics-dashboard/components/pipeline/TransportModeBar.tsx
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ModeCount { name: string; value: number }

export function TransportModeBar() {
  const [data, setData] = useState<ModeCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shipments?pageSize=1000')
      .then(r => r.json())
      .then(json => {
        const counts: Record<string, number> = {}
        for (const row of json.data ?? []) {
          const mode = row.ship_mode || 'Unknown'
          counts[mode] = (counts[mode] ?? 0) + 1
        }
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-1">운송 모드 <span className="text-gray-600 font-normal">(BL 기준)</span></h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill="#f59e0b" radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Create CustomsStatusCard.tsx**

```tsx
// apps/logistics-dashboard/components/pipeline/CustomsStatusCard.tsx
'use client'

import { useEffect, useState } from 'react'

interface CustomsStats { cleared: number; in_progress: number; pending: number }

export function CustomsStatusCard() {
  const [stats, setStats] = useState<CustomsStats>({ cleared: 0, in_progress: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/shipments?customs_status=cleared&pageSize=1').then(r => r.json()),
      fetch('/api/shipments?customs_status=in_progress&pageSize=1').then(r => r.json()),
      fetch('/api/shipments?customs_status=pending&pageSize=1').then(r => r.json()),
    ]).then(([c, ip, p]) => {
      setStats({ cleared: c.total ?? 0, in_progress: ip.total ?? 0, pending: p.total ?? 0 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-24 bg-gray-800 animate-pulse rounded" />

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">통관 현황 <span className="text-gray-600 font-normal">(BL 기준)</span></h4>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-green-400">{stats.cleared}</div>
          <div className="text-xs text-gray-500">완료</div>
        </div>
        <div>
          <div className="text-lg font-bold text-yellow-400">{stats.in_progress}</div>
          <div className="text-xs text-gray-500">진행중</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-400">{stats.pending}</div>
          <div className="text-xs text-gray-500">대기</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create WarehouseSqmBar.tsx**

```tsx
// apps/logistics-dashboard/components/pipeline/WarehouseSqmBar.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'

export function WarehouseSqmBar() {
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  const data = Object.entries(summary.bySqmByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.replace('DSV ', ''), value: Math.round(value) }))

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">창고 SQM</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={65} />
          <Tooltip formatter={(v: number) => `${v.toLocaleString()} ㎡`} />
          <Bar dataKey="value" fill="#6366f1" radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 6: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add apps/logistics-dashboard/components/pipeline/
git commit -m "feat: add 5 pipeline chart panels (FlowCodeDonut, VendorBar, TransportModeBar, CustomsStatusCard, WarehouseSqmBar)"
```

---

### Task 20: Wire Pipeline Page

**Files:**
- Modify: `apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx`

- [ ] **Step 1: Update page**

```tsx
// apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx
import { PipelineFilterBar } from '@/components/pipeline/PipelineFilterBar'
import { FlowPipeline } from '@/components/pipeline/FlowPipeline'
import { FlowCodeDonut } from '@/components/pipeline/FlowCodeDonut'
import { VendorBar } from '@/components/pipeline/VendorBar'
import { TransportModeBar } from '@/components/pipeline/TransportModeBar'
import { CustomsStatusCard } from '@/components/pipeline/CustomsStatusCard'
import { WarehouseSqmBar } from '@/components/pipeline/WarehouseSqmBar'

export default function PipelinePage() {
  return (
    <div className="flex flex-col h-full">
      <PipelineFilterBar />
      <div className="p-4 space-y-4">
        <FlowPipeline />
        <div className="grid grid-cols-5 gap-3">
          <FlowCodeDonut />
          <VendorBar />
          <TransportModeBar />
          <CustomsStatusCard />
          <WarehouseSqmBar />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Visual check**

`http://localhost:3001/pipeline` — should show filter bar, stage pipeline, and 5 chart panels.

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx
git commit -m "feat: complete Pipeline page"
```

---

## Chunk 5: Pages 3 & 4 — Sites + Cargo

### Task 21: AgiAlertBanner

**Files:**
- Create: `apps/logistics-dashboard/components/sites/AgiAlertBanner.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/sites/AgiAlertBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useCasesStore } from '@/store/casesStore'

const DISMISS_KEY = 'agi_alert_dismissed'

export function AgiAlertBanner() {
  const { summary } = useCasesStore()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
    }
  }, [])

  if (!summary) return null

  const total = summary.bySite.AGI ?? 0
  const arrived = summary.bySiteArrived.AGI ?? 0
  const rate = total > 0 ? arrived / total : 0

  if (rate >= 0.5 || dismissed) return null

  const pending = total - arrived

  return (
    <div className="bg-red-900/80 border border-red-700 rounded-lg mx-4 mt-3 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-red-200">AGI 납품 경보</span>
        <span className="text-red-300 ml-2">
          달성률 {(rate * 100).toFixed(1)}% — 미납 {pending.toLocaleString()}건
          (창고 {summary.byStatus.warehouse.toLocaleString()}건 포함)
        </span>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, 'true')
          setDismissed(true)
        }}
        className="text-red-400 hover:text-red-200"
        aria-label="Close alert"
      >
        <X size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/sites/AgiAlertBanner.tsx
git commit -m "feat: add AgiAlertBanner with sessionStorage dismiss"
```

---

### Task 22: SiteCards

**Files:**
- Create: `apps/logistics-dashboard/components/sites/SiteCards.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/sites/SiteCards.tsx
'use client'

import { useCasesStore } from '@/store/casesStore'
import { cn } from '@/lib/utils'

const SITE_META = {
  SHU: { label: 'SHU', type: '육상' },
  MIR: { label: 'MIR', type: '육상' },
  DAS: { label: 'DAS', type: '해상 섬' },
  AGI: { label: 'AGI', type: '해상 섬' },
} as const

type SiteKey = keyof typeof SITE_META

interface Props {
  selectedSite: SiteKey | null
  onSelect: (site: SiteKey) => void
}

export function SiteCards({ selectedSite, onSelect }: Props) {
  const { summary } = useCasesStore()
  const sites = Object.keys(SITE_META) as SiteKey[]

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {sites.map(site => {
        const total = summary?.bySite[site] ?? 0
        const arrived = summary?.bySiteArrived[site] ?? 0
        const rate = total > 0 ? (arrived / total) * 100 : 0
        const isAlert = site === 'AGI' && rate < 50
        const isSelected = selectedSite === site

        return (
          <button
            key={site}
            onClick={() => onSelect(site)}
            className={cn(
              'bg-gray-800 rounded-lg p-4 text-left transition-all border-2',
              isSelected ? 'border-blue-500' : 'border-transparent hover:border-gray-600',
              isAlert ? 'ring-1 ring-red-500' : ''
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white text-lg">{site}</span>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                {SITE_META[site].type}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {rate.toFixed(1)}%
              {isAlert && <span className="text-red-400 text-sm ml-2">⚠️</span>}
              {rate >= 99 && <span className="text-green-400 text-sm ml-2">✅</span>}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.min(rate, 100)}%`,
                  backgroundColor: isAlert ? '#ef4444' : '#3b82f6',
                }}
              />
            </div>
            <div className="text-xs text-gray-400">
              {arrived.toLocaleString()} / {total.toLocaleString()}건
            </div>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/sites/SiteCards.tsx
git commit -m "feat: add SiteCards with delivery rate progress and AGI alert indicator"
```

---

### Task 23: SiteDetail

**Files:**
- Create: `apps/logistics-dashboard/components/sites/SiteDetail.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/sites/SiteDetail.tsx
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { CaseRow } from '@/types/cases'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'
type Tab = 'summary' | 'flow' | 'monthly' | 'pending' | 'vendor'

interface Props { site: SiteKey }

export function SiteDetail({ site }: Props) {
  const [tab, setTab] = useState<Tab>('summary')
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/cases?site=${site}&pageSize=500`)
      .then(r => r.json())
      .then(j => { setCases(j.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [site])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: '요약' },
    { key: 'flow',    label: 'Flow' },
    { key: 'monthly', label: '월별 추이' },
    { key: 'pending', label: '대기 화물' },
    { key: 'vendor',  label: '벤더' },
  ]

  const arrived = cases.filter(c => c.status_current === 'site').length
  const total = cases.length
  const rate = total > 0 ? (arrived / total) * 100 : 0

  // Flow Code distribution
  const flowDist = [0,1,2,3,4,5].map(fc => ({
    name: `FC${fc}`,
    value: cases.filter(c => c.flow_code === fc).length,
  }))

  // Monthly trend (by site_arrival_date)
  const monthlyMap: Record<string, number> = {}
  cases.filter(c => c.site_arrival_date).forEach(c => {
    const month = c.site_arrival_date!.slice(0, 7)  // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] ?? 0) + 1
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))

  // Pending cases
  const pendingCases = cases.filter(c => c.status_current !== 'site').slice(0, 50)

  // Vendor dist
  const vendorMap: Record<string, number> = {}
  cases.forEach(c => {
    const v = c.source_vendor || 'Other'
    vendorMap[v] = (vendorMap[v] ?? 0) + 1
  })
  const vendorData = Object.entries(vendorMap).map(([name, value]) => ({ name, value }))

  return (
    <div className="flex-1 flex flex-col bg-gray-900 mx-4 mb-4 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t.key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {loading && <div className="text-gray-500 text-sm">Loading...</div>}

        {!loading && tab === 'summary' && (
          <div>
            <div className="text-3xl font-bold text-white mb-2">{rate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">{arrived.toLocaleString()} / {total.toLocaleString()}건 도착</div>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
              <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
          </div>
        )}

        {!loading && tab === 'flow' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flowDist.filter(d => d.value > 0)}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!loading && tab === 'monthly' && (
          monthlyData.length > 0
            ? <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            : <div className="text-gray-500 text-sm">site_arrival_date 데이터 없음</div>
        )}

        {!loading && tab === 'pending' && (
          <div className="overflow-auto">
            <table className="w-full text-xs text-gray-300">
              <thead><tr className="text-gray-500 border-b border-gray-700">
                <th className="py-1 text-left">Case No</th>
                <th className="py-1 text-left">현재위치</th>
                <th className="py-1 text-left">FC</th>
                <th className="py-1 text-left">벤더</th>
              </tr></thead>
              <tbody>
                {pendingCases.map(c => (
                  <tr key={c.id} className="border-b border-gray-800">
                    <td className="py-1">{c.case_no}</td>
                    <td className="py-1">{c.status_location}</td>
                    <td className="py-1">FC{c.flow_code}</td>
                    <td className="py-1">{c.source_vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === 'vendor' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendorData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill="#6366f1" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/sites/SiteDetail.tsx
git commit -m "feat: add SiteDetail with 5-tab view (summary, flow, monthly, pending, vendor)"
```

---

### Task 24: Wire Sites Page

**Files:**
- Modify: `apps/logistics-dashboard/app/(dashboard)/sites/page.tsx`

- [ ] **Step 1: Update page**

```tsx
// apps/logistics-dashboard/app/(dashboard)/sites/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useCasesStore } from '@/store/casesStore'
import { AgiAlertBanner } from '@/components/sites/AgiAlertBanner'
import { SiteCards } from '@/components/sites/SiteCards'
import { SiteDetail } from '@/components/sites/SiteDetail'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'

export default function SitesPage() {
  const { fetchSummary } = useCasesStore()
  const [selectedSite, setSelectedSite] = useState<SiteKey>('AGI')

  useEffect(() => { fetchSummary() }, [fetchSummary])

  return (
    <div className="flex flex-col h-full">
      <AgiAlertBanner />
      <SiteCards selectedSite={selectedSite} onSelect={setSelectedSite} />
      <SiteDetail site={selectedSite} />
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Visual check**

`http://localhost:3001/sites` — should show AGI alert banner (if < 50%), 4 site cards, and detail tabs for selected site.

- [ ] **Step 4: Commit**

```bash
git add apps/logistics-dashboard/app/(dashboard)/sites/page.tsx
git commit -m "feat: complete Sites page with AGI alert, site cards, and detail tabs"
```

---

### Task 25: CargoDrawer

**Files:**
- Create: `apps/logistics-dashboard/components/cargo/CargoDrawer.tsx`

- [ ] **Step 1: Create component**

```tsx
// apps/logistics-dashboard/components/cargo/CargoDrawer.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useCasesStore } from '@/store/casesStore'
import type { ShipmentRow } from '@/types/cases'

const FLOW_LABELS: Record<number, string> = {
  0: 'Pre-Arrival', 1: 'Port→Site', 2: 'Port→WH→Site',
  3: 'Port→MOSB→Site', 4: 'Port→WH→MOSB→Site', 5: 'Mixed',
}

function TimelineItem({ label, date }: { label: string; date: string | null }) {
  return (
    <div className={`flex gap-3 items-start ${date ? 'text-gray-200' : 'text-gray-600'}`}>
      <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${date ? 'bg-blue-500' : 'bg-gray-700'}`} />
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-xs">{date ?? '–'}</div>
      </div>
    </div>
  )
}

export function CargoDrawer() {
  const { isDrawerOpen, selectedCaseId, cases, closeDrawer } = useCasesStore()
  const [shipment, setShipment] = useState<ShipmentRow | null>(null)

  const caseRow = cases.find(c => c.id === selectedCaseId) ?? null

  useEffect(() => {
    if (!caseRow?.sct_ship_no) { setShipment(null); return }
    fetch(`/api/shipments?sct_ship_no=${encodeURIComponent(caseRow.sct_ship_no)}&pageSize=1`)
      .then(r => r.json())
      .then(j => setShipment(j.data?.[0] ?? null))
      .catch(() => setShipment(null))
  }, [caseRow?.sct_ship_no])

  if (!isDrawerOpen || !caseRow) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">{caseRow.case_no}</h2>
        <button onClick={closeDrawer} className="text-gray-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Basic info */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">기본정보</h3>
          <dl className="space-y-1.5">
            {[
              ['현장', caseRow.site],
              ['벤더', caseRow.source_vendor],
              ['Flow Code', `FC${caseRow.flow_code} — ${FLOW_LABELS[caseRow.flow_code] ?? ''}`],
              ['현재위치', caseRow.status_location || caseRow.status_current],
              ['보관유형', caseRow.storage_type],
              ['SQM', caseRow.sqm ? `${caseRow.sqm} ㎡` : '–'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-gray-200 text-right max-w-[60%] break-words">{v || '–'}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Timeline */}
        {shipment && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">물류 타임라인</h3>
            <div className="space-y-2 pl-1 border-l border-gray-700 ml-1">
              <TimelineItem label="ETD (출발예정)" date={shipment.etd} />
              <TimelineItem label="ATD (실제출발)" date={shipment.atd} />
              <TimelineItem label="ETA (도착예정)" date={shipment.eta} />
              <TimelineItem label="ATA (실제도착)" date={shipment.ata} />
              <TimelineItem label="현장 도착" date={caseRow.site_arrival_date} />
            </div>
          </section>
        )}

        {!caseRow.sct_ship_no && (
          <p className="text-xs text-gray-600">선적번호 없음 — 타임라인 불가</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/logistics-dashboard/components/cargo/CargoDrawer.tsx
git commit -m "feat: add CargoDrawer with case details and shipment timeline"
```

---

### Task 26: Cargo Tables (3 tables)

**Files:**
- Create: `apps/logistics-dashboard/components/cargo/WhStatusTable.tsx`
- Create: `apps/logistics-dashboard/components/cargo/ShipmentsTable.tsx`
- Create: `apps/logistics-dashboard/components/cargo/DsvStockTable.tsx`

- [ ] **Step 1: Create WhStatusTable.tsx**

```tsx
// apps/logistics-dashboard/components/cargo/WhStatusTable.tsx
'use client'

import { useEffect } from 'react'
import { useCasesStore } from '@/store/casesStore'
import { cn } from '@/lib/utils'

const FLOW_BADGE_COLORS: Record<number, string> = {
  0: 'bg-gray-600', 1: 'bg-blue-600', 2: 'bg-green-600',
  3: 'bg-orange-600', 4: 'bg-red-600', 5: 'bg-purple-600',
}

export function WhStatusTable() {
  const { cases, fetchCases, isLoading, openDrawer } = useCasesStore()

  useEffect(() => { fetchCases() }, [fetchCases])

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left w-12">#</th>
            <th className="py-2 px-3 text-left">Case No</th>
            <th className="py-2 px-3 text-left w-14">Site</th>
            <th className="py-2 px-3 text-left">현재위치</th>
            <th className="py-2 px-3 text-left w-16">FC</th>
            <th className="py-2 px-3 text-left w-16">SQM</th>
            <th className="py-2 px-3 text-left w-20">Status</th>
            <th className="py-2 px-3 text-left">벤더</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">Loading...</td></tr>
          )}
          {!isLoading && cases.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">데이터 없음</td></tr>
          )}
          {cases.map((c, i) => (
            <tr
              key={c.id}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
              onClick={() => openDrawer(c.id)}
            >
              <td className="py-1.5 px-3 text-gray-600">{i + 1}</td>
              <td className="py-1.5 px-3 font-mono">{c.case_no}</td>
              <td className="py-1.5 px-3">{c.site}</td>
              <td className="py-1.5 px-3 truncate max-w-32">{c.status_location}</td>
              <td className="py-1.5 px-3">
                <span className={cn('px-1.5 py-0.5 rounded text-white text-[10px]', FLOW_BADGE_COLORS[c.flow_code])}>
                  FC{c.flow_code}
                </span>
              </td>
              <td className="py-1.5 px-3">{c.sqm}</td>
              <td className="py-1.5 px-3">
                {c.status_current === 'site' ? '●' : c.status_current === 'warehouse' ? '△' : '○'}
              </td>
              <td className="py-1.5 px-3">{c.source_vendor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create ShipmentsTable.tsx**

```tsx
// apps/logistics-dashboard/components/cargo/ShipmentsTable.tsx
'use client'

import { useEffect, useState } from 'react'
import type { ShipmentRow } from '@/types/cases'

export function ShipmentsTable() {
  const [data, setData] = useState<ShipmentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    vendor: 'all', pod: 'all', customs_status: 'all', ship_mode: 'all',
  })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '50' })
    Object.entries(filter).forEach(([k, v]) => { if (v !== 'all') params.set(k, v) })
    fetch(`/api/shipments?${params}`)
      .then(r => r.json())
      .then(j => { setData(j.data ?? []); setTotal(j.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filter])

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Simple filter row */}
      <div className="flex gap-3 p-2 bg-gray-900 border-b border-gray-800 text-xs">
        {(['cleared','in_progress','pending'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, customs_status: f.customs_status === s ? 'all' : s }))}
            className={`px-2 py-1 rounded ${filter.customs_status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            {s === 'cleared' ? '통관완료' : s === 'in_progress' ? '진행중' : '대기'}
          </button>
        ))}
        <span className="ml-auto text-gray-600">총 {total.toLocaleString()}건</span>
      </div>

      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left">SCT SHIP NO</th>
            <th className="py-2 px-3 text-left">벤더</th>
            <th className="py-2 px-3 text-left">POL→POD</th>
            <th className="py-2 px-3 text-left">ETD</th>
            <th className="py-2 px-3 text-left">ETA</th>
            <th className="py-2 px-3 text-left">통관</th>
            <th className="py-2 px-3 text-left">모드</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-600">Loading...</td></tr>}
          {!loading && data.map(s => (
            <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-1.5 px-3 font-mono">{s.sct_ship_no}</td>
              <td className="py-1.5 px-3">{s.vendor}</td>
              <td className="py-1.5 px-3">{s.pol} → {s.pod}</td>
              <td className="py-1.5 px-3">{s.etd ?? '–'}</td>
              <td className="py-1.5 px-3">{s.eta ?? '–'}</td>
              <td className="py-1.5 px-3">
                <span className={s.customs_status === 'cleared' ? 'text-green-400' : s.customs_status === 'in_progress' ? 'text-yellow-400' : 'text-gray-500'}>
                  {s.customs_status === 'cleared' ? '완료' : s.customs_status === 'in_progress' ? '진행중' : '대기'}
                </span>
              </td>
              <td className="py-1.5 px-3">{s.ship_mode}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex gap-2 p-2 border-t border-gray-800 justify-center text-xs">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          className="px-2 py-1 bg-gray-800 rounded disabled:opacity-30">이전</button>
        <span className="text-gray-500 py-1">Page {page}</span>
        <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}
          className="px-2 py-1 bg-gray-800 rounded disabled:opacity-30">다음</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create DsvStockTable.tsx**

```tsx
// apps/logistics-dashboard/components/cargo/DsvStockTable.tsx
'use client'

import { useEffect } from 'react'
import { useStockStore } from '@/store/stockStore'

export function DsvStockTable() {
  const { stock, total, isLoading, fetchStock } = useStockStore()

  useEffect(() => { fetchStock() }, [fetchStock])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex px-3 py-1 text-xs text-gray-600 border-b border-gray-800">
        총 {total.toLocaleString()}건 (DSV 창고 재고)
      </div>
      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left w-10">No</th>
            <th className="py-2 px-3 text-left">SKU</th>
            <th className="py-2 px-3 text-left">Description</th>
            <th className="py-2 px-3 text-left">Location</th>
            <th className="py-2 px-3 text-left">Pallet ID</th>
            <th className="py-2 px-3 text-left w-10">Qty</th>
            <th className="py-2 px-3 text-left">입고일</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} className="py-8 text-center text-gray-600">Loading...</td></tr>}
          {!isLoading && stock.length === 0 && (
            <tr><td colSpan={7} className="py-8 text-center text-gray-600">데이터 없음</td></tr>
          )}
          {stock.map(s => (
            <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-1.5 px-3 text-gray-600">{s.no}</td>
              <td className="py-1.5 px-3 font-mono">{s.sku}</td>
              <td className="py-1.5 px-3 truncate max-w-40">{s.description}</td>
              <td className="py-1.5 px-3">{s.location}</td>
              <td className="py-1.5 px-3">{s.pallet_id}</td>
              <td className="py-1.5 px-3">{s.qty}</td>
              <td className="py-1.5 px-3">{s.date_received}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/logistics-dashboard/components/cargo/WhStatusTable.tsx
git add apps/logistics-dashboard/components/cargo/ShipmentsTable.tsx
git add apps/logistics-dashboard/components/cargo/DsvStockTable.tsx
git commit -m "feat: add three cargo tables (WhStatus, Shipments, DsvStock)"
```

---

### Task 27: CargoTabs + Wire Cargo Page

**Files:**
- Create: `apps/logistics-dashboard/components/cargo/CargoTabs.tsx`
- Modify: `apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx`

- [ ] **Step 1: Create CargoTabs.tsx**

```tsx
// apps/logistics-dashboard/components/cargo/CargoTabs.tsx
'use client'

import { useState } from 'react'
import { WhStatusTable } from '@/components/cargo/WhStatusTable'
import { ShipmentsTable } from '@/components/cargo/ShipmentsTable'
import { DsvStockTable } from '@/components/cargo/DsvStockTable'
import { CargoDrawer } from '@/components/cargo/CargoDrawer'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'wh',        label: 'WH STATUS',  count: '8,680' },
  { key: 'shipments', label: 'SHIPMENTS',  count: '874'   },
  { key: 'stock',     label: 'DSV STOCK',  count: '791'   },
] as const

type TabKey = typeof TABS[number]['key']

export function CargoTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('wh')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-5 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === t.key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {t.label}
            <span className="ml-2 text-gray-600 font-normal">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'wh'        && <WhStatusTable />}
        {activeTab === 'shipments' && <ShipmentsTable />}
        {activeTab === 'stock'     && <DsvStockTable />}
      </div>

      {/* Drawer (WH STATUS tab only) */}
      <CargoDrawer />
    </div>
  )
}
```

- [ ] **Step 2: Update cargo page**

```tsx
// apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx
import { CargoTabs } from '@/components/cargo/CargoTabs'

export default function CargoPage() {
  return (
    <div className="h-full">
      <CargoTabs />
    </div>
  )
}
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 4: Visual check**

`http://localhost:3001/cargo` — should show 3-tab table with WH STATUS active. Click a row → drawer opens with case info. Click × → closes.

- [ ] **Step 5: Update DashboardHeader to remove legacy component imports**

Before deleting `GlobalSearch.tsx` and `ConnectionStatusBadge.tsx`, open `DashboardHeader.tsx` and remove any imports referencing them. Replace with inline equivalents or remove the feature entirely.

```bash
# Open and edit DashboardHeader.tsx
# Find and remove lines like:
#   import { GlobalSearch } from '@/components/search/GlobalSearch'
#   import { ConnectionStatusBadge } from '@/components/hvdc/ConnectionStatusBadge'
# Remove the corresponding JSX usage (<GlobalSearch />, <ConnectionStatusBadge />) as well.
```

Verify the header still renders correctly:
```bash
pnpm typecheck
```

- [ ] **Step 6: Delete remaining legacy components**

Now that DashboardHeader no longer imports them, delete the last legacy files:
```bash
cd apps/logistics-dashboard
rm components/search/GlobalSearch.tsx
rm components/hvdc/ConnectionStatusBadge.tsx
rm components/map/MapView.tsx  # now replaced by OverviewMap
```

Run `pnpm typecheck` and fix any remaining import errors.

- [ ] **Step 7: Final commit**

```bash
git add apps/logistics-dashboard/components/cargo/CargoTabs.tsx
git add apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx
git add -u  # pick up deletions and DashboardHeader change
git commit -m "feat: complete Cargo page with 3-tab tables, drawer, and legacy cleanup"
```

---

## Post-Implementation Checklist

- [ ] `pnpm typecheck` passes with 0 errors across the monorepo
- [ ] `http://localhost:3001` redirects to `/overview`
- [ ] All 4 pages are navigable via the sidebar
- [ ] KPI cards show real numbers from Supabase (or zeros if not connected)
- [ ] Pipeline stage click filters the donut chart
- [ ] AGI alert banner appears on Sites page (with dismiss × working)
- [ ] Cargo page drawer opens on WH STATUS row click
- [ ] No references to deleted files remain in the codebase
