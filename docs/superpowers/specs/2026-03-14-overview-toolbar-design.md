# Overview Toolbar Design Spec
Date: 2026-03-14
Revision: 3 (final)

## Summary

Add a top toolbar row to the Overview page containing:
1. **Shipment search bar** — fuzzy ID normalization, dropdown results, map highlight, right-panel detail
2. **Map layer toggles** — Origin Arc / Active Voyage / Heatmap on/off
3. **New voyage entry button** — opens modal, inserts into Supabase

---

## 1. Component Structure

```
OverviewPageClient
├── OverviewToolbar (NEW)          ← above KpiStripCards
│   ├── ShipmentSearchBar          ← search input + dropdown
│   ├── MapLayerToggles            ← 3 toggle buttons
│   └── NewVoyageButton            ← triggers NewVoyageModal
├── NewVoyageModal (NEW)           ← Dialog portal
├── KpiStripCards
├── OverviewMap                    ← reads layerOriginArcs / layerTrips / showHeatmap from store
├── OverviewRightPanel             ← receives selectedShipmentId + onClearSelection props
└── OverviewBottomPanel
```

### State ownership

| State | Location | Type | Default |
|-------|----------|------|---------|
| `layerOriginArcs` | `logisticsStore` | `boolean` | `true` |
| `layerTrips` | `logisticsStore` | `boolean` | `true` |
| `showHeatmap` | `logisticsStore` | `boolean` | `false` (unchanged) |
| `highlightedShipmentId` | `logisticsStore` | `string \| null` | `null` |
| `selectedShipmentId` | `OverviewPageClient` local | `string \| null` | `null` |
| `isNewVoyageOpen` | `OverviewPageClient` local | `boolean` | `false` |
| `refreshKey` | `OverviewPageClient` local | `number` | `0` |

**Naming (A1):** Store keys are `layerOriginArcs` / `layerTrips` to avoid shadowing the existing
local zoom-derived `showOriginArcs` variable in `OverviewMap.tsx`. The map computes:
```ts
const showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
```
Both the store toggle AND the zoom gate must be true.
The `MapLegend` call (`showArcs={showOriginArcs}`) already uses this derived boolean — no separate update needed.

**Heatmap:** `showHeatmap` stays `false` by default; toggle starts in OFF state.

---

## 2. Search — ID Normalization

Pure client-side function in `lib/search/normalizeShipmentId.ts`:

```ts
type NormalizedSearch =
  | { type: 'exact'; value: string }   // sct_ship_no exact match
  | { type: 'ilike'; value: string }   // partial match via ?q=

function normalizeShipmentId(raw: string): NormalizedSearch {
  const s = raw.trim().toLowerCase()

  // Full HVDC code: hvdc-adopt-sct-0001 → HVDC-ADOPT-SCT-0001
  // In the public.shipments view: sct_ship_no = hvdc_code (same value)
  if (s.startsWith('hvdc')) {
    return { type: 'exact', value: s.toUpperCase() }
  }

  // Short SCT code: sct0001 / sct001 / sct0123 / sct123
  // Extracts digits, zero-pads to 4, reconstructs full sct_ship_no value
  const sctMatch = s.match(/^sct(\d+)$/)
  if (sctMatch) {
    const padded = sctMatch[1].padStart(4, '0')
    return { type: 'exact', value: `HVDC-ADOPT-SCT-${padded}` }
  }

  // case12345 → strip prefix, use digits as ilike value
  const caseMatch = s.match(/^case(\d+)$/)
  if (caseMatch) {
    return { type: 'ilike', value: caseMatch[1] }
  }

  // Bare numerics (e.g. "0001") and all other inputs → ilike fallback
  return { type: 'ilike', value: s }
}
```

**B3 clarification:** `sct_ship_no` in `public.shipments` (the view) equals `hvdc_code` in
`status.shipments_status` (e.g., `HVDC-ADOPT-SCT-0001`). The existing API route uses
`GET /api/shipments?sct_ship_no={value}` with `.eq('sct_ship_no', value)`. The normalization
function builds the correct `sct_ship_no` string — no column ambiguity.

### Search behavior

- Debounce: 300ms, min 2 chars to trigger
- Max 5 dropdown results
- Card fields: `sct_ship_no`, `vendor`, `voyage_stage` (display mapped — see below), `ETA`
- `voyage_stage` display mapping:
  | Raw API value | Display label |
  |---------------|--------------|
  | `pre-departure` | 출발 전 |
  | `in-transit` | 운송 중 |
  | `port-customs` | 통관 중 |
  | `inland` | 내륙 운송 |
  | `delivered` | 납품 완료 |
- Each card has "상세 보기 →" link → navigates to `/shipments?sct_ship_no={id}`
- **On card body click (not the link):** sets `selectedShipmentId` + `highlightedShipmentId`; no navigation

### API calls

- `exact` type: `GET /api/shipments?sct_ship_no={value}&pageSize=5`
- `ilike` type: `GET /api/shipments?q={value}&pageSize=5`

Add to `/app/api/shipments/route.ts`:
```ts
const q = searchParams.get('q')
if (q) query = query.ilike('sct_ship_no', `%${q}%`)
```

### Map highlight (M1 — new createTripsLayer signature)

`highlightedShipmentId: string | null` added to `logisticsStore`.

`createTripsLayer` new signature:
```ts
function createTripsLayer(
  trips: TripData[],
  currentTime: number,
  visible: boolean,       // = layerTrips from store (no zoom gate — trips visible at all zooms)
  highlightId?: string | null
): Layer | null
```
`visible` in `OverviewMap` becomes `layerTrips` (replaces the current incorrect `showPoiLayer` arg).
- If `highlightId` matches `trip.id`: color `[255, 255, 255, 220]`
- Other trips when any highlight is active: original color with `alpha * 0.3`
- No highlight active: all trips use original colors

### OverviewRightPanel detail

Updated props (M2):
```ts
interface OverviewRightPanelProps {
  data: OverviewCockpitResponse | null
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
  selectedShipmentId?: string | null       // NEW
  onClearSelection?: () => void            // NEW — called when × button clicked
}
```

When `selectedShipmentId` is set:
- Panel fetches `GET /api/shipments?sct_ship_no={id}&pageSize=1`
- **Loading state (m3):** renders a shimmer placeholder card (3 rows of rounded skeleton divs, matching existing skeleton pattern in the codebase)
- **Loaded:** renders compact detail card above existing content: `sct_ship_no | vendor | pol → pod | voyage_stage label | ETA | Flow {flow_code}`
- **Error:** renders "상세 정보를 불러오지 못했습니다" in card area
- Card has `×` button → calls `onClearSelection()` → parent clears `selectedShipmentId` and `highlightedShipmentId`

---

## 3. Map Layer Toggles

| Label | Store key | Default | Icon |
|-------|-----------|---------|------|
| Origin Arc | `layerOriginArcs` | ON (`true`) | 🌐 |
| Active Voyage | `layerTrips` | ON (`true`) | 🚢 |
| Heatmap | `showHeatmap` | OFF (`false`) | 🔥 |

OverviewMap logic:
```ts
const showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
const showTrips = layerTrips                    // no zoom gate
// showHeatmap: already read from store, no change
```

---

## 4. New Voyage Modal

### Form fields (2-column grid)

| Column A | Column B |
|----------|----------|
| HVDC Code * | Vendor * |
| POL * | POD * |
| Ship Mode * (SEA / AIR / LAND dropdown) | Incoterms (EXW / FOB / CIF / DAP dropdown) |
| ETD (date input) | ATD (date input) |
| ETA (date input) | ATA (date input) |
| Vessel | B/L · AWB No. |
| MR No. (`status_no` bigint) | Transit Days (integer) |
| Customs Days (integer) | Inland Days (integer) |
| Description / 비고 (textarea, 500 chars max, 3 rows, full-width) | — |
| 납품 사이트: ☑ SHU  ☑ DAS  ☑ MIR  ☑ AGI (full-width row) | — |

**Label mapping (m4):** Form label "MR No." maps to `status.shipments_status.status_no BIGINT`.
Display consistently as "MR No." in form label, validation messages, and error text.

`*` = required. Register button disabled until all required fields filled.

### Validation (client-side)

- Required: `hvdc_code`, `vendor`, `pol`, `pod`, `ship_mode`
- `etd ≤ eta` if both provided
- `atd ≤ ata` if both provided
- `transit_days / customs_days / inland_days`: integer ≥ 0 if provided
- `description`: max 500 characters (character counter shown)

### POST /api/shipments/new

**Request body:**
```ts
interface NewVoyagePayload {
  hvdc_code: string
  vendor: string
  pol: string
  pod: string
  ship_mode: string
  incoterms?: string
  etd?: string             // ISO date YYYY-MM-DD
  atd?: string
  eta?: string
  ata?: string
  vessel?: string
  bl_awb?: string
  status_no?: number       // MR No. → status.shipments_status.status_no
  transit_days?: number
  customs_days?: number
  inland_days?: number
  doc_shu: boolean
  doc_das: boolean
  doc_mir: boolean
  doc_agi: boolean
  description?: string     // stored in raw JSONB
}
```

**Insert (B2 — correct schema syntax):**
```ts
await supabaseAdmin
  .schema('status')
  .from('shipments_status')
  .insert({
    hvdc_code: payload.hvdc_code,
    vendor: payload.vendor,
    pol: payload.pol,
    pod: payload.pod,
    ship_mode: payload.ship_mode,
    incoterms: payload.incoterms ?? null,
    etd: payload.etd ?? null,
    atd: payload.atd ?? null,
    eta: payload.eta ?? null,
    ata: payload.ata ?? null,
    vessel: payload.vessel ?? null,
    bl_awb: payload.bl_awb ?? null,
    status_no: payload.status_no ?? null,
    transit_days: payload.transit_days ?? null,
    customs_days: payload.customs_days ?? null,
    inland_days: payload.inland_days ?? null,
    doc_shu: payload.doc_shu,
    doc_das: payload.doc_das,
    doc_mir: payload.doc_mir,
    doc_agi: payload.doc_agi,
    raw: { description: payload.description ?? '' },  // M4: new rows only → safe overwrite
  })
```

**M4 (raw overwrite):** Rows inserted through this modal are always new (PK constraint enforced).
`raw` is initialized to `{ description: "..." }`. No upstream system populates `raw` for new rows.
This is safe — confirmed that `raw` for existing rows from upstream imports may have other keys,
but modal-inserted rows are net-new and have no prior `raw` value.

**Server responses:**

| Case | HTTP | Body |
|------|------|------|
| Success | `200` | `{ ok: true, hvdc_code: string }` |
| Duplicate PK (Postgres `23505`) | `409` | `{ error: 'duplicate_hvdc_code' }` |
| Validation (missing required field) | `400` | `{ error: string }` |
| Other server error | `500` | `{ error: 'internal_error' }` |

**On 200:**
- Close modal
- Increment `refreshKey` in `OverviewPageClient` (M3 — triggers `useOverviewData` re-fetch; hook receives `refreshKey` as dependency and re-runs on change)
- Toast: "항차 등록 완료: {hvdc_code}"

**On 409:** Keep modal open, show inline error below HVDC Code field: "이미 존재하는 HVDC Code입니다"

**On 400/500/network:** Keep modal open, toast: "등록 실패: {error message}"

### useOverviewData refresh mechanism (M3)

`OverviewPageClient` holds `const [refreshKey, setRefreshKey] = useState(0)`.
Passed to `useOverviewData(refreshKey)`. On POST success: `setRefreshKey(k => k + 1)`.

The hook adds a **separate** `useEffect` specifically for external refresh triggers
(to avoid interfering with the existing `useEffectEvent`-based polling pattern):
```ts
// In useOverviewData:
export function useOverviewData(refreshKey = 0) {
  // ... existing polling useEffect unchanged ...

  // External refresh trigger (e.g. after new voyage POST)
  useEffect(() => {
    void loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  return { data, loading, error, worklist }
}
```
When `refreshKey` is 0 on initial mount, this effect fires once (same as the existing initial fetch).
Subsequent increments trigger an additional re-fetch without disrupting the polling interval.

---

## 5. Files

### New files
| File | Purpose |
|------|---------|
| `components/overview/OverviewToolbar.tsx` | Toolbar container |
| `components/overview/ShipmentSearchBar.tsx` | Search input + dropdown |
| `components/overview/MapLayerToggles.tsx` | 3 toggle buttons |
| `components/overview/NewVoyageModal.tsx` | Full form modal |
| `lib/search/normalizeShipmentId.ts` | ID normalization pure fn |
| `app/api/shipments/new/route.ts` | POST endpoint |

### Modified files
| File | Change |
|------|--------|
| `types/logistics.ts` (B1) | Add `layerOriginArcs: boolean`, `layerTrips: boolean`, `highlightedShipmentId: string \| null` + setter types |
| `store/logisticsStore.ts` | Add 3 new state fields + setters matching updated `LogisticsState` |
| `hooks/useOverviewData.ts` | Accept `refreshKey?: number` param; add to `useEffect` deps |
| `components/overview/OverviewPageClient.tsx` | Add `OverviewToolbar`, `NewVoyageModal`, `selectedShipmentId`, `refreshKey` state |
| `components/overview/OverviewMap.tsx` | Read `layerOriginArcs`, `layerTrips`, `highlightedShipmentId` from store; fix `createTripsLayer` call site: replace current `showPoiLayer` arg with `layerTrips`; compute `showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax` |
| `components/overview/OverviewRightPanel.tsx` | Add `selectedShipmentId?`, `onClearSelection?` props; add detail card |
| `components/map/layers/createTripsLayer.ts` | Add `highlightId?` param; apply highlight color logic |
| `app/api/shipments/route.ts` | Add `q` ilike param |

---

## 6. Error Handling

| Scenario | Behavior |
|----------|---------|
| Search API error | Dropdown: "검색 실패, 다시 시도하세요" |
| No search results | Dropdown: "결과 없음" |
| Right panel detail loading | Shimmer skeleton (3 rows) |
| Right panel detail error | "상세 정보를 불러오지 못했습니다" inline |
| POST 409 duplicate | Inline field error under HVDC Code, modal open |
| POST 500 / network | Toast error, modal open |

---

## 7. Non-goals (YAGNI)

- No URL search state
- No search result pagination (max 5)
- No image upload in voyage form
- No edit existing voyage (insert only)
- No real-time subscription on new voyages
- No dedicated `case_no` API endpoint (falls to ilike)
- No pre-flight uniqueness check before POST
