import { TripsLayer } from "@deck.gl/geo-layers"
import type { Layer } from "@deck.gl/core"
import type { NetworkTrip } from "@/lib/map/networkGraph"

/**
 * TripsLayer — subdued voyage motion over the semantic network.
 *
 * Color is semantic, not Flow Code:
 * - global supply line
 * - direct customs-to-site
 * - via warehouse
 * - via MOSB
 * - via warehouse + MOSB
 */

/** 60-day time window for animation (seconds) */
export const TRIPS_TIME_WINDOW_SECS = 60 * 24 * 3600

/** Trail length: 4 days (how long the fading trail is) */
const TRAIL_SECS = 4 * 24 * 3600

/** How many seconds the full animation cycle takes (real time) */
export const CYCLE_SECS = 12

const GLOBAL_TRIP_PROFILE = {
  alphaMultiplier: 1,
  dimmedMultiplier: 0.4,
  widthMinPixels: 3,
  widthMaxPixels: 3,
  trailSecs: TRAIL_SECS,
} as const

const UAE_OPS_TRIP_PROFILE = {
  alphaMultiplier: 0.4,
  dimmedMultiplier: 0.16,
  widthMinPixels: 1.25,
  widthMaxPixels: 1.25,
  trailSecs: Math.floor(TRAIL_SECS * 0.35),
} as const

function getTripProfile(mode: "global" | "uae-ops") {
  return mode === "uae-ops" ? UAE_OPS_TRIP_PROFILE : GLOBAL_TRIP_PROFILE
}

function tripColor(kind: NetworkTrip["kind"]): [number, number, number, number] {
  switch (kind) {
    case "global":
      return [94, 140, 255, 120]
    case "direct-site":
      return [120, 170, 255, 132]
    case "via-warehouse":
      return [47, 107, 255, 138]
    case "via-mosb":
      return [46, 212, 122, 145]
    case "via-warehouse-mosb":
      return [139, 108, 255, 150]
    default:
      return [200, 200, 255, 110]
  }
}

function getGlobalTripColor(
  trip: NetworkTrip,
  hasHighlight: boolean,
  highlightId?: string | null,
): [number, number, number, number] {
  if (hasHighlight) {
    if (trip.shipmentId === highlightId || trip.id === highlightId) {
      return [255, 255, 255, 220]
    }
    const base = tripColor(trip.kind)
    return [
      base[0],
      base[1],
      base[2],
      Math.floor(base[3] * GLOBAL_TRIP_PROFILE.dimmedMultiplier),
    ] as [number, number, number, number]
  }

  const base = tripColor(trip.kind)
  return [
    base[0],
    base[1],
    base[2],
    Math.floor(base[3] * GLOBAL_TRIP_PROFILE.alphaMultiplier),
  ] as [number, number, number, number]
}

function getUaeOpsTripColor(
  trip: NetworkTrip,
  hasHighlight: boolean,
  highlightId?: string | null,
): [number, number, number, number] {
  if (hasHighlight) {
    if (trip.shipmentId === highlightId || trip.id === highlightId) {
      return [255, 255, 255, 220]
    }
    const base = tripColor(trip.kind)
    return [
      base[0],
      base[1],
      base[2],
      Math.floor(base[3] * UAE_OPS_TRIP_PROFILE.dimmedMultiplier),
    ] as [number, number, number, number]
  }

  const base = tripColor(trip.kind)
  return [
    base[0],
    base[1],
    base[2],
    Math.floor(base[3] * UAE_OPS_TRIP_PROFILE.alphaMultiplier),
  ] as [number, number, number, number]
}

export function createTripsLayer(
  trips: NetworkTrip[],
  currentTime: number,
  visible: boolean,
  highlightId?: string | null,
  mode: "global" | "uae-ops" = "global",
): Layer | null {
  if (!visible || trips.length === 0) return null

  const hasHighlight = highlightId != null
  const profile = getTripProfile(mode)

  return new TripsLayer<NetworkTrip>({
    id: "active-voyages",
    data: trips,
    pickable: true,
    visible,

    getPath: (trip) => trip.path,
    getTimestamps: (trip) => trip.timestamps,
    getColor: (trip) =>
      mode === "uae-ops"
        ? getUaeOpsTripColor(trip, hasHighlight, highlightId)
        : getGlobalTripColor(trip, hasHighlight, highlightId),

    currentTime,
    trailLength: profile.trailSecs,
    widthMinPixels: profile.widthMinPixels,
    widthMaxPixels: profile.widthMaxPixels,
    jointRounded: true,
    capRounded: true,

    updateTriggers: {
      getColor: [highlightId, mode],
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
