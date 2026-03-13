import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface ShipmentStages {
  pre_departure: number     // ATD is null (not yet departed)
  in_transit: number        // ATD not null, ATA is null
  port_customs: number      // ATA not null, customs_close_date is null
  inland: number            // customs_close_date not null, final_delivery_date is null
  delivered: number         // final_delivery_date is not null
  total: number
  // Nomination breakdown (doc_* = nominated delivery site, NOT documentation flags)
  nominated_shu: number
  nominated_das: number
  nominated_mir: number
  nominated_agi: number
  // Alert: AGI/DAS nominated but no MOSB transit (flow_code < 3)
  agi_das_no_mosb_alert: number
}

const EMPTY: ShipmentStages = {
  pre_departure: 0,
  in_transit: 0,
  port_customs: 0,
  inland: 0,
  delivered: 0,
  total: 0,
  nominated_shu: 0,
  nominated_das: 0,
  nominated_mir: 0,
  nominated_agi: 0,
  agi_das_no_mosb_alert: 0,
}

export async function GET() {
  try {
    // Query public.shipments view (joins status.shipments_status with flow/case rollup).
    // Note: view uses 'delivery_date' (not 'final_delivery_date') and customs_close_date is always NULL.
    // Voyage stage classification: pre-departure → in-transit → port-customs → delivered
    const PAGE = 1000
    const allRows: Array<{
      atd: string | null
      ata: string | null
      delivery_date: string | null
      doc_shu: boolean | null
      doc_das: boolean | null
      doc_mir: boolean | null
      doc_agi: boolean | null
      flow_code: number | null
    }> = []

    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('shipments')
        .select('atd, ata, delivery_date, doc_shu, doc_das, doc_mir, doc_agi, flow_code')
        .range(offset, offset + PAGE - 1)
        .order('id')

      if (error) throw error
      if (!data || data.length === 0) break
      allRows.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }

    const stages: ShipmentStages = {
      pre_departure:  allRows.filter(r => !r.atd).length,
      in_transit:     allRows.filter(r => r.atd && !r.ata).length,
      // customs_close_date is always NULL in the view → merge port/customs/inland into port_customs
      port_customs:   allRows.filter(r => r.ata && !r.delivery_date).length,
      inland:         0,  // not tracked separately — merged into port_customs above
      delivered:      allRows.filter(r => !!r.delivery_date).length,
      total:          allRows.length,
      nominated_shu:  allRows.filter(r => r.doc_shu).length,
      nominated_das:  allRows.filter(r => r.doc_das).length,
      nominated_mir:  allRows.filter(r => r.doc_mir).length,
      nominated_agi:  allRows.filter(r => r.doc_agi).length,
      agi_das_no_mosb_alert: allRows.filter(r =>
        (r.doc_agi || r.doc_das) && (r.flow_code == null || r.flow_code < 3)
      ).length,
    }

    return NextResponse.json(stages)
  } catch (err) {
    console.error('GET /api/shipments/stages error:', err)
    return NextResponse.json(EMPTY)
  }
}
