import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { getRouteTypeIdFromFlowCode, getRouteTypeIdsForFlowCodes, isOverviewRouteTypeId } from '@/lib/overview/routeTypes'
import type { ShipmentRow, ShipmentsResponse } from '@/types/cases'
import { normalizeShipMode } from '@/lib/logistics/normalizers'

// ── Voyage stage ─────────────────────────────────────────────────────────────

type VoyageStage = 'pre-departure' | 'in-transit' | 'port-customs' | 'inland' | 'delivered'

function deriveVoyageStage(row: {
  atd: string | null
  ata: string | null
  delivery_date: string | null
}): VoyageStage {
  if (!row.atd) return 'pre-departure'
  if (!row.ata) return 'in-transit'
  if (row.delivery_date) return 'delivered'
  return 'port-customs'  // port/customs/inland merged (customs_close_date not tracked in view)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor')
    const pod = searchParams.get('pod')
    const customs_status = searchParams.get('customs_status')
    const ship_mode = searchParams.get('ship_mode')
    const sct_ship_no = searchParams.get('sct_ship_no')
    const voyageStage = searchParams.get('voyage_stage') // 'pre-departure' | 'in-transit' | 'port-customs' | 'inland' | 'delivered'
    const nominatedSite = searchParams.get('site') ?? searchParams.get('nominated_site') // 'SHU' | 'MIR' | 'DAS' | 'AGI'
    const routeType = searchParams.get('route_type')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    let query = supabase
      .from('shipments')
      .select(
        `id, sct_ship_no, vendor,
         port_of_loading, port_of_discharge,
         etd, atd, eta, ata, delivery_date,
         ship_mode, bl_awb_no,
         duty_amount_aed, vat_amount_aed,
         customs_start_date, customs_close_date,
         flow_code, transit_days, customs_days, inland_days,
         doc_shu, doc_das, doc_mir, doc_agi`,
        { count: 'exact' }
      )

    if (vendor && vendor !== 'all') query = query.eq('vendor', vendor)
    if (pod && pod !== 'all') query = query.eq('port_of_discharge', pod)
    if (ship_mode && ship_mode !== 'all') query = query.eq('ship_mode', ship_mode)
    if (sct_ship_no) query = query.eq('sct_ship_no', sct_ship_no)
    if (routeType && routeType !== 'all') {
      if (routeType === 'review-required') {
        query = query.or('flow_code.eq.5,flow_code.is.null')
      } else if (isOverviewRouteTypeId(routeType)) {
        query = query.in('flow_code', getRouteTypeIdsForFlowCodes(routeType))
      }
    }
    // customs_status derived: cleared = customs_close_date not null, in_progress = start but no close
    if (customs_status === 'cleared') {
      query = query.not('customs_close_date', 'is', null)
    } else if (customs_status === 'in_progress') {
      query = query
        .not('customs_start_date', 'is', null)
        .is('customs_close_date', null)
    } else if (customs_status === 'pending') {
      query = query.is('customs_start_date', null)
    }

    // voyage_stage filter (customs_close_date always NULL in view → port-customs covers port+customs+inland)
    if (voyageStage === 'pre-departure') query = query.is('atd', null)
    else if (voyageStage === 'in-transit') query = query.not('atd', 'is', null).is('ata', null)
    else if (voyageStage === 'port-customs' || voyageStage === 'inland') query = query.not('ata', 'is', null).is('delivery_date', null)
    else if (voyageStage === 'delivered') query = query.not('delivery_date', 'is', null)

    // nominated_site filter (doc_* columns = nominated delivery site)
    if (nominatedSite === 'SHU') query = query.eq('doc_shu', true)
    else if (nominatedSite === 'MIR') query = query.eq('doc_mir', true)
    else if (nominatedSite === 'DAS') query = query.eq('doc_das', true)
    else if (nominatedSite === 'AGI') query = query.eq('doc_agi', true)

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1).order('sct_ship_no')

    const { data, error, count } = await query

    if (error) {
      console.error('shipments query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies ShipmentsResponse)
    }

    // Local type matching the selected columns from public.shipments
    interface ShipmentsDbRow {
      id: string
      sct_ship_no: string | null
      vendor: string | null
      port_of_loading: string | null
      port_of_discharge: string | null
      etd: string | null
      atd: string | null
      eta: string | null
      ata: string | null
      delivery_date: string | null
      ship_mode: string | null
      bl_awb_no: string | null
      duty_amount_aed: number | null
      vat_amount_aed: number | null
      customs_start_date: string | null
      customs_close_date: string | null
      flow_code: number | null
      transit_days: number | null
      customs_days: number | null
      inland_days: number | null
      doc_shu: boolean | null
      doc_das: boolean | null
      doc_mir: boolean | null
      doc_agi: boolean | null
    }

    const rows: ShipmentRow[] = ((data ?? []) as ShipmentsDbRow[]).map(s => ({
      id: s.id,
      sct_ship_no: s.sct_ship_no ?? '',
      vendor: s.vendor ?? '',
      pol: s.port_of_loading ?? '',
      pod: s.port_of_discharge ?? '',
      etd: s.etd ?? null,
      atd: s.atd ?? null,
      eta: s.eta ?? null,
      ata: s.ata ?? s.delivery_date ?? null,
      cif_value: s.duty_amount_aed != null || s.vat_amount_aed != null
        ? (Number(s.duty_amount_aed ?? 0) + Number(s.vat_amount_aed ?? 0))
        : null,
      customs_status: s.customs_close_date
        ? 'cleared'
        : s.customs_start_date
        ? 'in_progress'
        : 'pending',
      ship_mode: normalizeShipMode(s.ship_mode) ?? '',
      container_no: s.bl_awb_no ?? null,  // bl_awb_no is the closest available container reference
      voyage_stage: deriveVoyageStage({
        atd: s.atd,
        ata: s.ata,
        delivery_date: s.delivery_date,
      }),
      flow_code: s.flow_code ?? null,
      route_type: getRouteTypeIdFromFlowCode(s.flow_code),
      transit_days: s.transit_days ?? null,
      customs_days: s.customs_days ?? null,
      inland_days: s.inland_days ?? null,
      nominated_sites: [
        s.doc_shu && 'SHU',
        s.doc_das && 'DAS',
        s.doc_mir && 'MIR',
        s.doc_agi && 'AGI',
      ].filter(Boolean) as string[],
    }))

    return NextResponse.json({ data: rows, total: count ?? 0, page, pageSize } satisfies ShipmentsResponse)
  } catch (err) {
    console.error('GET /api/shipments error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies ShipmentsResponse)
  }
}
