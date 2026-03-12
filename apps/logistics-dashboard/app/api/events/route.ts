import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { ontologyLocations } from "@/lib/data/ontology-locations"
import { POI_LOCATIONS } from "@/lib/map/poiLocations"
import type { Event } from "@/types/logistics"

const COORD_JITTER_DEGREES = 0.002

const SITE_TYPE_BY_POI_CATEGORY = {
  HVDC_SITE: "SITE",
  PORT: "PORT",
  BERTH: "BERTH",
  WAREHOUSE: "MOSB_WH",
  YARD: "MOSB_WH",
  OFFICE: "OTHER",
  AIRPORT: "OTHER",
} as const

type LocationJoin = { id?: string; lat: number; lng: number }
type ShipmentJoin = { sct_ship_no?: string | null }

function getObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function getLocationJoin(value: unknown): LocationJoin | null {
  const obj = Array.isArray(value) ? getObject(value[0]) : getObject(value)
  if (!obj) return null
  const lat = typeof obj.lat === "number" ? obj.lat : null
  const lng = typeof obj.lng === "number" ? obj.lng : null
  if (lat === null || lng === null) return null
  const id = typeof obj.id === "string" ? obj.id : undefined
  return { id, lat, lng }
}

function getShipmentJoin(value: unknown): ShipmentJoin | null {
  const obj = Array.isArray(value) ? getObject(value[0]) : getObject(value)
  if (!obj) return null
  const sct_ship_no = typeof obj.sct_ship_no === "string" ? obj.sct_ship_no : null
  return { sct_ship_no }
}

function generateMockEvents(): Event[] {
  const events: Event[] = []
  const statuses = ["PICKUP", "IN_TRANSIT", "DELIVERED", "DELAYED", "HOLD"]
  const mockLocations =
    ontologyLocations.length > 0
      ? ontologyLocations
      : POI_LOCATIONS.map((poi) => ({
          location_id: poi.id,
          name: poi.name,
          siteType: SITE_TYPE_BY_POI_CATEGORY[poi.category] ?? "OTHER",
          lat: poi.latitude,
          lon: poi.longitude,
        }))

  if (mockLocations.length === 0) {
    return events
  }

  for (let i = 0; i < 50; i += 1) {
    const location = mockLocations[Math.floor(Math.random() * mockLocations.length)]
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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        location_id,
        shipment_id,
        event_type,
        description,
        metadata,
        ts,
        locations!inner (
          id,
          lat,
          lng
        ),
        shipments (
          id,
          sct_ship_no
        )
      `,
      )
      .order("ts", { ascending: false })
      .limit(1000)

    if (error) throw error
    if (!data || data.length === 0) {
      console.warn("No events found in DB, using mock data")
      return NextResponse.json(generateMockEvents())
    }

    const events = data
      .map((row): Event | null => {
        const record = getObject(row)
        if (!record) return null
        const location = getLocationJoin(record.locations)
        if (!location) return null
        const ts = typeof record.ts === "string" ? record.ts : null
        if (!ts) return null
        const event_id = typeof record.id === "string" ? record.id : null
        if (!event_id) return null
        const event_type = typeof record.event_type === "string" ? record.event_type : undefined
        const description = typeof record.description === "string" ? record.description : undefined
        const location_id =
          typeof record.location_id === "string" ? record.location_id : location.id ?? ""
        const shipment = getShipmentJoin(record.shipments)
        const metadata = record.metadata
        const event_date_dubai =
          metadata && typeof metadata === "object" && !Array.isArray(metadata)
            ? typeof (metadata as { event_date_dubai?: unknown }).event_date_dubai === "string"
              ? ((metadata as { event_date_dubai: string }).event_date_dubai as string)
              : undefined
            : undefined

        const event: Event = {
          event_id,
          ts,
          shpt_no: shipment?.sct_ship_no ?? "",
          status: event_type ?? "UNKNOWN",
          location_id,
          lat: location.lat,
          lon: location.lng,
          ...(description && { remark: description }),
          ...(event_type && { event_type }),
          ...(event_date_dubai && { event_date_dubai }),
        }
        return event
      })
      .filter((event): event is Event => event !== null)

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    console.warn("Using mock data as fallback")
    return NextResponse.json(generateMockEvents())
  }
}
