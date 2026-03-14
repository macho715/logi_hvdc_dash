import { ScatterplotLayer } from "@deck.gl/layers"
import type { Layer } from "@deck.gl/core"
import type { PoiLocation, PoiCategory } from "@/lib/map/poiTypes"

/**
 * Status Ring Layer
 *
 * Renders an outer ring around each POI node to visually encode node type and importance.
 * Replaces the previous hardcoded ArcLayer flow lines with a data-driven,
 * maintenance-free visualization.
 *
 * Color / size encoding:
 *   HVDC_SITE (green)  — final delivery destinations (SHU, MIR, DAS, AGI)
 *   YARD (orange)      — MOSB staging yard
 *   PORT (blue)        — seaport entry points
 *   WAREHOUSE (yellow) — inland storage (DSV, JDN, AAA)
 *   AIRPORT (blue dim) — air freight entry
 *   OFFICE (gray)      — support offices
 *
 * Phase 2-B: When `highlightStage` is set, only categories relevant to that
 * pipeline stage are highlighted; others are dimmed to 15% opacity.
 */

/** Maps pipeline stage keys to the POI categories that are "active" at that stage */
const STAGE_ACTIVE_CATEGORIES: Record<string, PoiCategory[]> = {
  "pre-arrival": [],                        // nothing specific — dim all
  "port":        ["PORT", "AIRPORT"],
  "warehouse":   ["WAREHOUSE"],
  "mosb":        ["YARD"],
  "site":        ["HVDC_SITE"],
}

function isHighlighted(category: PoiCategory, highlightStage: string | null): boolean {
  if (!highlightStage) return true  // no filter — all active
  const active = STAGE_ACTIVE_CATEGORIES[highlightStage]
  if (!active || active.length === 0) return false
  return active.includes(category)
}

function ringColor(
  category: PoiCategory,
  highlighted: boolean,
): [number, number, number, number] {
  const alpha = highlighted ? 1.0 : 0.15

  switch (category) {
    case "HVDC_SITE":
      return [34, 197, 94, Math.round(180 * alpha)]   // green — final sites
    case "YARD":
      return [249, 115, 22, Math.round(180 * alpha)]  // orange — MOSB
    case "PORT":
      return [59, 130, 246, Math.round(160 * alpha)]  // blue — ports
    case "WAREHOUSE":
      return [234, 179, 8, Math.round(160 * alpha)]   // yellow — warehouses
    case "AIRPORT":
      return [59, 130, 246, Math.round(100 * alpha)]  // blue dim — airport
    case "OFFICE":
      return [148, 163, 184, Math.round(80 * alpha)]  // gray — offices
    default:
      return [148, 163, 184, Math.round(80 * alpha)]
  }
}

/**
 * Radius in meters — sized so rings are clearly visible at zoom 8–9.
 * Larger rings for higher-importance nodes.
 */
function ringRadiusMeters(category: PoiCategory): number {
  switch (category) {
    case "HVDC_SITE":
      return 3500   // most prominent — final destinations
    case "YARD":
      return 3000   // MOSB
    case "PORT":
      return 2500
    case "WAREHOUSE":
      return 2000
    case "AIRPORT":
      return 1800
    default:
      return 1500
  }
}

function getPosition(d: PoiLocation): [number, number] {
  if (d.displayJitter) {
    return [d.longitude + d.displayJitter[0], d.latitude + d.displayJitter[1]]
  }
  return [d.longitude, d.latitude]
}

export function createStatusRingLayer(
  pois: ReadonlyArray<PoiLocation>,
  visible: boolean,
  highlightStage: string | null = null,
): Layer | null {
  if (!visible || pois.length === 0) return null

  return new ScatterplotLayer<PoiLocation>({
    id: "poi-status-rings",
    data: pois as PoiLocation[],
    pickable: false,
    visible,
    radiusUnits: "meters",
    getPosition,
    getRadius: (d) => ringRadiusMeters(d.category),
    getFillColor: [0, 0, 0, 0],           // transparent fill — outline only
    getLineColor: (d) => ringColor(d.category, isHighlighted(d.category, highlightStage)),
    lineWidthUnits: "pixels",
    getLineWidth: (d) => isHighlighted(d.category, highlightStage) ? 2.5 : 1,
    stroked: true,
    filled: false,
    updateTriggers: {
      getLineColor: [highlightStage],
      getLineWidth: [highlightStage],
      getRadius: [],
    },
  })
}
