import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { ontologyLocations } from "@/lib/data/ontology-locations"
import type { Location } from "@/types/logistics"

function mapDbTypeToSiteType(type: string | null): Location["siteType"] {
  if (!type) return "OTHER"
  const normalized = type.toLowerCase()
  if (normalized.includes("port")) return "PORT"
  if (normalized.includes("warehouse") || normalized.includes("wh")) return "MOSB_WH"
  if (normalized.includes("berth")) return "BERTH"
  if (normalized.includes("site")) return "SITE"
  return "OTHER"
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, lat, lng, type")
      .order("name")

    if (error) throw error
    if (!data || data.length === 0) {
      console.warn("No locations found in DB, using ontology fallback (map/HVDC_Location_Master_Ontology)")
      return NextResponse.json(ontologyLocations)
    }

    const locations: Location[] = data
      .filter((row) => typeof row.lat === "number" && typeof row.lng === "number")
      .map((row) => ({
        location_id: row.id,
        name: row.name,
        siteType: mapDbTypeToSiteType(row.type),
        lat: row.lat,
        lon: row.lng,
      }))

    if (locations.length === 0) {
      console.warn("Locations missing coordinates, using ontology fallback")
      return NextResponse.json(ontologyLocations)
    }

    return NextResponse.json(locations)
  } catch (error) {
    console.warn("Error fetching locations, using ontology fallback (map/HVDC_Location_Master_Ontology)")
    return NextResponse.json(ontologyLocations)
  }
}
