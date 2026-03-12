import type { Location, LocationStatus, Event } from "@/types/logistics"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

// Mock data for fallback
const mockLocations: Location[] = [
  { location_id: "site-1", name: "SITE Alpha", siteType: "SITE", lat: 24.4539, lon: 54.3773 },
  { location_id: "site-2", name: "SITE Bravo", siteType: "SITE", lat: 24.4839, lon: 54.3573 },
  { location_id: "site-3", name: "SITE Charlie", siteType: "SITE", lat: 24.4239, lon: 54.4073 },
  { location_id: "site-4", name: "SITE Delta", siteType: "SITE", lat: 24.4639, lon: 54.4273 },
  { location_id: "mosb-wh", name: "MOSB Warehouse", siteType: "MOSB_WH", lat: 24.5039, lon: 54.3173 },
  { location_id: "port-1", name: "Khalifa Port", siteType: "PORT", lat: 24.8029, lon: 54.6453 },
  { location_id: "berth-1", name: "Berth A1", siteType: "BERTH", lat: 24.7929, lon: 54.6353 },
  { location_id: "extra-1", name: "Staging Area", siteType: "OTHER", lat: 24.4139, lon: 54.3373 },
]

const mockStatuses: LocationStatus[] = [
  { location_id: "site-1", occupancy_rate: 0.75, status_code: "OK", last_updated: new Date().toISOString() },
  { location_id: "site-2", occupancy_rate: 0.92, status_code: "WARNING", last_updated: new Date().toISOString() },
  { location_id: "site-3", occupancy_rate: 0.45, status_code: "OK", last_updated: new Date().toISOString() },
  { location_id: "site-4", occupancy_rate: 0.98, status_code: "CRITICAL", last_updated: new Date().toISOString() },
  { location_id: "mosb-wh", occupancy_rate: 0.6, status_code: "OK", last_updated: new Date().toISOString() },
  { location_id: "port-1", occupancy_rate: 0.85, status_code: "WARNING", last_updated: new Date().toISOString() },
  { location_id: "berth-1", occupancy_rate: 0.3, status_code: "OK", last_updated: new Date().toISOString() },
  { location_id: "extra-1", occupancy_rate: 0.55, status_code: "OK", last_updated: new Date().toISOString() },
]

// Generate mock events
function generateMockEvents(): Event[] {
  const events: Event[] = []
  const statuses = ["PICKUP", "IN_TRANSIT", "DELIVERED", "DELAYED", "HOLD"]

  for (let i = 0; i < 50; i++) {
    const location = mockLocations[Math.floor(Math.random() * mockLocations.length)]
    const hoursAgo = Math.random() * 48
    const ts = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    events.push({
      event_id: `evt-${i}`,
      ts,
      shpt_no: `SHPT-${1000 + i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location_id: location.location_id,
      lat: location.lat + (Math.random() - 0.5) * 0.05,
      lon: location.lon + (Math.random() - 0.5) * 0.05,
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
    console.warn("Using mock locations data")
    return mockLocations
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

export { mockLocations, mockStatuses }
