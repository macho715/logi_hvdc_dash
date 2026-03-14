import { TripsLayer } from "@deck.gl/geo-layers"
import type { Layer } from "@deck.gl/core"
import type { TripData } from "@/app/api/shipments/trips/route"

/**
 * TripsLayer — animates in-transit shipments from POL → POD.
 *
 * Animation design:
 * - `currentTime` cycles through a TIME_WINDOW of recent voyages
 * - Each cycle takes CYCLE_SECS real seconds (default 12s)
 * - Vessels animate along their route proportional to their ATD/ETA window
 *
 * Color encoding:
 *   Flow 1–2 (Port→Site or Port→WH→Site, no MOSB): cyan
 *   Flow 3–4 (MOSB required, DAS/AGI bound):        orange
 *   Unknown:                                         white
 */

/** 60-day time window for animation (seconds) */
export const TRIPS_TIME_WINDOW_SECS = 60 * 24 * 3600

/** Trail length: 4 days (how long the fading trail is) */
const TRAIL_SECS = 4 * 24 * 3600

/** How many seconds the full animation cycle takes (real time) */
export const CYCLE_SECS = 12

function tripColor(flowCode: number | null): [number, number, number, number] {
  if (flowCode === 3 || flowCode === 4) {
    return [249, 115, 22, 220]   // orange — MOSB-bound (DAS/AGI)
  }
  if (flowCode === 1 || flowCode === 2) {
    return [56, 189, 248, 200]   // sky blue — direct/warehouse land route
  }
  return [200, 200, 255, 160]    // light purple — unknown/mixed
}

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

/**
 * Compute the current animation time given a reference epoch and elapsed real ms.
 *
 * The animation loops through a TIME_WINDOW_SECS window starting from
 * `epochStartSecs`. One full loop completes every CYCLE_SECS real seconds.
 */
export function computeAnimTime(epochStartSecs: number, elapsedMs: number): number {
  const progress = (elapsedMs % (CYCLE_SECS * 1000)) / (CYCLE_SECS * 1000)
  return epochStartSecs + progress * TRIPS_TIME_WINDOW_SECS
}
