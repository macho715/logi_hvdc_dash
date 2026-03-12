import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { ShipmentRow, ShipmentsResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor')
    const pod = searchParams.get('pod')
    const customs_status = searchParams.get('customs_status')
    const ship_mode = searchParams.get('ship_mode')
    const sct_ship_no = searchParams.get('sct_ship_no')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    let query = supabase
      .from('shipments')
      .select(
        `id, sct_ship_no, vendor,
         port_of_loading, port_of_discharge,
         etd, eta, delivery_date,
         ship_mode, bl_awb_no,
         duty_amount_aed, vat_amount_aed,
         customs_start_date, customs_close_date`,
        { count: 'exact' }
      )

    if (vendor && vendor !== 'all') query = query.eq('vendor', vendor)
    if (pod && pod !== 'all') query = query.eq('port_of_discharge', pod)
    if (ship_mode && ship_mode !== 'all') query = query.eq('ship_mode', ship_mode)
    if (sct_ship_no) query = query.eq('sct_ship_no', sct_ship_no)
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
      eta: string | null
      delivery_date: string | null
      ship_mode: string | null
      bl_awb_no: string | null
      duty_amount_aed: number | null
      vat_amount_aed: number | null
      customs_start_date: string | null
      customs_close_date: string | null
    }

    const rows: ShipmentRow[] = ((data ?? []) as ShipmentsDbRow[]).map(s => ({
      id: s.id,
      sct_ship_no: s.sct_ship_no ?? '',
      vendor: s.vendor ?? '',
      pol: s.port_of_loading ?? '',
      pod: s.port_of_discharge ?? '',
      etd: s.etd ?? null,
      atd: null,  // ATD column not in public.shipments schema; leave null
      eta: s.eta ?? null,
      ata: s.delivery_date ?? null,  // delivery_date serves as ATA
      // CIF value derived from duty + VAT (approximate) or null if both missing
      cif_value: s.duty_amount_aed != null || s.vat_amount_aed != null
        ? (Number(s.duty_amount_aed ?? 0) + Number(s.vat_amount_aed ?? 0))
        : null,
      customs_status: s.customs_close_date
        ? 'cleared'
        : s.customs_start_date
        ? 'in_progress'
        : 'pending',
      ship_mode: s.ship_mode ?? '',
      container_no: s.bl_awb_no ?? null,  // bl_awb_no is the closest available container reference
    }))

    return NextResponse.json({ data: rows, total: count ?? 0, page, pageSize } satisfies ShipmentsResponse)
  } catch (err) {
    console.error('GET /api/shipments error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies ShipmentsResponse)
  }
}
