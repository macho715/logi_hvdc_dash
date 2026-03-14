import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { resolvePolCoords, resolvePodCoords } from '@/lib/map/portCoordinates'

/** Single trip record for TripsLayer animation */
export interface TripData {
  id: string
  polCoords: [number, number]   // [lon, lat]
  podCoords: [number, number]   // [lon, lat]
  atdUnix: number               // unix seconds
  etaUnix: number               // unix seconds
  flowCode: number | null
  vendor: string | null
  msobCoords?: [number, number] // [lon, lat] — set for Flow 3/4 (MOSB-bound)
}

export interface TripsResponse {
  trips: TripData[]
}

/**
 * GET /api/shipments/trips
 *
 * Returns in-transit shipments with resolved POL/POD coordinates
 * for use with deck.gl TripsLayer. Only includes shipments where:
 *   - atd IS NOT NULL (departed)
 *   - ata IS NULL     (not yet arrived)
 *   - Both POL and POD can be resolved to coordinates
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('id, sct_ship_no, vendor, port_of_loading, port_of_discharge, atd, eta, flow_code')
      .not('atd', 'is', null)
      .is('ata', null)
      .order('atd', { ascending: false })
      .limit(200)  // cap for map performance

    if (error) {
      console.error('trips query error:', error)
      return NextResponse.json({ trips: [] } satisfies TripsResponse)
    }

    const trips: TripData[] = []

    for (const row of data ?? []) {
      const polCoords = resolvePolCoords(row.port_of_loading)
      const podCoords = resolvePodCoords(row.port_of_discharge)

      // Skip if we can't resolve coordinates for both ends
      if (!polCoords || !podCoords) continue

      const atdUnix = row.atd ? Math.floor(new Date(row.atd).getTime() / 1000) : null
      const etaUnix = row.eta ? Math.floor(new Date(row.eta).getTime() / 1000) : null

      if (!atdUnix || !etaUnix) continue
      if (etaUnix <= atdUnix) continue  // sanity check

      const flowCode = row.flow_code ?? null
      trips.push({
        id: row.id,
        polCoords,
        podCoords,
        atdUnix,
        etaUnix,
        flowCode,
        vendor: row.vendor ?? null,
        ...(flowCode === 3 || flowCode === 4
          ? { msobCoords: [54.535, 24.527] as [number, number] }
          : {}),
      })
    }

    return NextResponse.json({ trips } satisfies TripsResponse)
  } catch (err) {
    console.error('GET /api/shipments/trips error:', err)
    return NextResponse.json({ trips: [] } satisfies TripsResponse)
  }
}
