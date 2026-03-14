import { NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { EVENTS_JOIN_SELECT, generateMockEvents, mapSupabaseEvents } from "@/lib/logistics/events"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(EVENTS_JOIN_SELECT)
      .order("ts", { ascending: false })
      .limit(1000)

    if (error) throw error
    if (!data || data.length === 0) {
      console.warn("No events found in DB, using mock data")
      return NextResponse.json(generateMockEvents())
    }

    const events = mapSupabaseEvents(data)

    if (events.length === 0) {
      console.warn("Events query returned rows but none were mappable, using mock data")
      return NextResponse.json(generateMockEvents())
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    console.warn("Using mock data as fallback")
    return NextResponse.json(generateMockEvents())
  }
}
