import { ArcLayer } from "@deck.gl/layers"
import type { Layer } from "@deck.gl/core"
import { getCountryCentroid } from "@/lib/map/countryCentroids"

/**
 * Origin Arc Layer — Phase 3-A (updated: region colors)
 *
 * Draws great-circle arcs from origin countries → UAE receiving hub (Khalifa Port).
 * Visible only when zoomed out (zoom ≤ 8) to give a global supply-chain overview.
 *
 * Visual encoding:
 *   Arc width  ∝ log(count)          — thicker = more cargo
 *   Source α   ∝ count / maxCount    — brighter = higher volume
 *   Source color: region-based       — EU=blue, Asia=green, ME=amber, Americas=rose
 *   Target color: blue-500  (#3B82F6) — "arriving at UAE hub"
 *   greatCircle: true                 — curves naturally over the globe
 *
 * Data source: /api/chain/summary → origins[{country, count}]
 */

export interface OriginEntry {
  country: string
  count: number
}

export type Region = "EU" | "Asia" | "ME" | "Americas" | "Unknown"

interface ArcDatum {
  sourcePosition: [number, number]
  targetPosition: [number, number]
  count: number
  country: string
  region: Region
}

/** Main UAE receiving hub for HVDC cargo — Khalifa Port (KPCT) */
const UAE_HUB: [number, number] = [54.64842, 24.8095]

/** Region base RGB colors — applied to BOTH source and target for full arc visibility */
export const REGION_COLORS: Record<Region, [number, number, number]> = {
  EU:       [56,  189, 248],   // sky-400  — Europe
  Asia:     [52,  211, 153],   // emerald-400 — East/SE/South Asia
  ME:       [251, 146,  60],   // orange-400 — Middle East & Africa
  Americas: [251, 113, 133],   // rose-400 — Americas
  Unknown:  [148, 163, 184],   // slate-400 — fallback
}

const EU_CODES      = new Set(["SE","FI","NO","DK","GB","NL","BE","FR","DE","AT","IT","ES","PT","CH","CZ","PL"])
const ASIA_CODES    = new Set(["KR","JP","CN","TW","IN","MY","SG","TH"])
const ME_CODES      = new Set(["TR","AE","SA","ZA"])
const AMERICAS_CODES = new Set(["US","CA","BR","CO","MX"])

function classifyRegion(countryCode: string): Region {
  const code = countryCode.toUpperCase()
  if (EU_CODES.has(code))       return "EU"
  if (ASIA_CODES.has(code))     return "Asia"
  if (ME_CODES.has(code))       return "ME"
  if (AMERICAS_CODES.has(code)) return "Americas"
  return "Unknown"
}

/**
 * Log-scaled pixel width so dominant origins stand out without drowning small ones.
 * Range: 1px (1 shipment) → 8px (maxCount shipments).
 */
function arcWidthPx(count: number, maxCount: number): number {
  if (maxCount <= 0) return 1
  const logRatio = Math.log(count + 1) / Math.log(maxCount + 1)
  return Math.max(1, Math.round(1 + 7 * logRatio))
}

/**
 * Region color with volume-based alpha.
 * Source end (origin): full brightness.
 * Target end (UAE): dimmed to 60% so convergence point is visually softer
 * while still showing the regional color throughout the arc.
 * Min alpha 80 (always visible), max 230 (dominant route).
 */
function arcColor(
  region: Region,
  count: number,
  maxCount: number,
  targetEnd = false,
): [number, number, number, number] {
  const [r, g, b] = REGION_COLORS[region]
  const t = maxCount > 0 ? count / maxCount : 0.5
  const alpha = Math.round(80 + t * 150)
  // Target (UAE) end is slightly dimmer to keep the hub from being too cluttered
  return [r, g, b, targetEnd ? Math.round(alpha * 0.6) : alpha]
}

export function createOriginArcLayer(
  origins: OriginEntry[],
  visible: boolean,
): Layer | null {
  if (!visible || origins.length === 0) return null

  const maxCount = Math.max(...origins.map((o) => o.count))

  const data: ArcDatum[] = origins
    .map((o) => {
      const src = getCountryCentroid(o.country)
      if (!src) return null
      return {
        sourcePosition: src,
        targetPosition: UAE_HUB,
        count: o.count,
        country: o.country,
        region: classifyRegion(o.country),
      }
    })
    .filter((d): d is ArcDatum => d !== null)

  if (data.length === 0) return null

  return new ArcLayer<ArcDatum>({
    id: "origin-country-arcs",
    data,
    pickable: true,
    visible,

    getSourcePosition: (d) => d.sourcePosition,
    getTargetPosition: (d) => d.targetPosition,

    getSourceColor: (d) => arcColor(d.region, d.count, maxCount, false),
    getTargetColor: (d) => arcColor(d.region, d.count, maxCount, true),

    getWidth: (d) => arcWidthPx(d.count, maxCount),
    widthUnits: "pixels",

    greatCircle: true,
    getHeight: 0.5,

    updateTriggers: {
      getSourceColor: [maxCount],
      getTargetColor: [maxCount],
      getWidth: [maxCount],
    },
  })
}
