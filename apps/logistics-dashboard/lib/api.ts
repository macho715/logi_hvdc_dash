import type { Location, LocationStatus, Event, StatusCode } from "@/types/logistics"
import { ontologyLocations } from "@/lib/data/ontology-locations"
import { POI_LOCATIONS } from "@/lib/map/poiLocations"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

const COORD_JITTER_DEGREES = 0.002

const SITE_TYPE_BY_POI_CATEGORY: Record<string, Location["siteType"]> = {
  HVDC_SITE: "SITE",
  PORT: "PORT",
  BERTH: "BERTH",
  WAREHOUSE: "MOSB_WH",
  YARD: "MOSB_WH",
  OFFICE: "OTHER",
  AIRPORT: "OTHER",
}

const EXCLUDED_STATUS_LOCATION_IDS = new Set(["loc-mosb-sct-office", "mosb-sct-office"])

function isExcludedStatusLocation(location_id: string): boolean {
  const normalized = location_id.trim().toLowerCase()
  return EXCLUDED_STATUS_LOCATION_IDS.has(normalized)
}

function getFallbackLocations(): Location[] {
  if (ontologyLocations.length > 0) {
    return ontologyLocations
  }

  return POI_LOCATIONS.map((poi) => ({
    location_id: poi.id,
    name: poi.name,
    siteType: SITE_TYPE_BY_POI_CATEGORY[poi.category] ?? "OTHER",
    lat: poi.latitude,
    lon: poi.longitude,
  }))
}

const statusCodeCycle: StatusCode[] = ["OK", "WARNING", "OK", "CRITICAL"]

function buildMockLocationStatuses(locations: Location[]): LocationStatus[] {
  const now = new Date().toISOString()

  if (locations.length === 0) return []

  return locations
    .filter((location) => !isExcludedStatusLocation(location.location_id))
    .map((location, index) => ({
      location_id: location.location_id,
      occupancy_rate: Number((0.35 + ((index * 0.17) % 0.55)).toFixed(2)),
      status_code: statusCodeCycle[index % statusCodeCycle.length],
      last_updated: now,
    }))
}

const fallbackLocations = getFallbackLocations()
const mockStatuses = buildMockLocationStatuses(fallbackLocations)

// Generate mock events (uses ontology locations when available)
function generateMockEvents(): Event[] {
  const events: Event[] = []
  const statuses = ["PICKUP", "IN_TRANSIT", "DELIVERED", "DELAYED", "HOLD"]
  const locs = fallbackLocations

  if (locs.length === 0) {
    return events
  }

  for (let i = 0; i < 50; i++) {
    const location = locs[Math.floor(Math.random() * locs.length)]
    const hoursAgo = Math.random() * 48
    const ts = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    events.push({
      event_id: `evt-${i}`,
      ts,
      shpt_no: `SHPT-${1000 + i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location_id: location.location_id,
      lat: location.lat + (Math.random() - 0.5) * COORD_JITTER_DEGREES,
      lon: location.lon + (Math.random() - 0.5) * COORD_JITTER_DEGREES,
      remark: Math.random() > 0.7 ? "Sample remark" : undefined,
    })
  }

  return events
}

export async function fetchLocations(): Promise<Location[]> {
  try {
    const res = await fetch(`${API_BASE}/api/locations`)
    if (!res.ok) throw new Error("Failed to fetch locations")
    return await res.json()
  } catch {
    console.warn("Using ontology locations fallback (map/HVDC_Location_Master_Ontology)")
    return ontologyLocations
  }
}

export async function fetchLocationStatuses(): Promise<LocationStatus[]> {
  try {
    const res = await fetch(`${API_BASE}/api/location-status`)
    if (!res.ok) throw new Error("Failed to fetch location statuses")
    return await res.json()
  } catch {
    console.warn("Using mock location statuses data")
    return mockStatuses
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE}/api/events`)
    if (!res.ok) throw new Error("Failed to fetch events")
    return await res.json()
  } catch {
    console.warn("Using mock events data")
    return generateMockEvents()
  }
}

export { buildMockLocationStatuses, fallbackLocations as mockLocations, mockStatuses }
