import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { CasesSummary } from '@/types/cases'

const EMPTY_SUMMARY: CasesSummary = {
  total: 0,
  byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0 },
  bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
  bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
  byFlowCode: {},
  byVendor: {},
  bySqmByLocation: {},
  totalSqm: 0,
}

export async function GET() {
  try {
    // Fetch all cases (only needed columns for aggregation)
    const { data, error } = await supabase
      .schema('case')
      .from('cases')
      .select('site, flow_code, status_current, status_location, sqm, source_vendor')

    if (error || !data) {
      console.error('cases/summary query error:', error)
      return NextResponse.json(EMPTY_SUMMARY)
    }

    const summary: CasesSummary = {
      total: data.length,
      byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0 },
      bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
      bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
      byFlowCode: {},
      byVendor: {},
      bySqmByLocation: {},
      totalSqm: 0,
    }

    for (const row of data) {
      // byStatus
      const st = row.status_current as string
      if (st === 'site') summary.byStatus.site++
      else if (st === 'warehouse') summary.byStatus.warehouse++
      else summary.byStatus['Pre Arrival']++

      // bySite
      const site = row.site as string
      if (site === 'SHU') summary.bySite.SHU++
      else if (site === 'MIR') summary.bySite.MIR++
      else if (site === 'DAS') summary.bySite.DAS++
      else if (site === 'AGI') summary.bySite.AGI++
      else summary.bySite.Unassigned++

      // bySiteArrived
      if (st === 'site') {
        if (site === 'SHU') summary.bySiteArrived.SHU++
        else if (site === 'MIR') summary.bySiteArrived.MIR++
        else if (site === 'DAS') summary.bySiteArrived.DAS++
        else if (site === 'AGI') summary.bySiteArrived.AGI++
      }

      // byFlowCode (string keys)
      const fc = String(row.flow_code ?? 'null')
      summary.byFlowCode[fc] = (summary.byFlowCode[fc] ?? 0) + 1

      // byVendor
      const v = row.source_vendor as string
      const vendorKey = v === 'Hitachi' || v === 'Siemens' ? v : 'Other'
      summary.byVendor[vendorKey] = (summary.byVendor[vendorKey] ?? 0) + 1

      // bySqmByLocation (only warehouse cases)
      const sqm = typeof row.sqm === 'number' ? row.sqm : 0
      summary.totalSqm += sqm
      if (st === 'warehouse' && row.status_location) {
        const loc = row.status_location as string
        summary.bySqmByLocation[loc] = (summary.bySqmByLocation[loc] ?? 0) + sqm
      }
    }

    return NextResponse.json(summary)
  } catch (err) {
    console.error('GET /api/cases/summary error:', err)
    return NextResponse.json(EMPTY_SUMMARY)
  }
}
