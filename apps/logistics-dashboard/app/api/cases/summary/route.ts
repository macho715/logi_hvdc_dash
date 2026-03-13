import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { OVERVIEW_ROUTE_TYPES, getRouteTypeIdFromFlowCode } from '@/lib/overview/routeTypes'
import type { CasesSummary } from '@/types/cases'
import { classifyStage, PIPELINE_STAGE_META } from '@/lib/cases/pipelineStage'
import { normalizeStorageType } from '@/lib/cases/storageType'
import { normalizeSite } from '@/lib/logistics/normalizers'

const EMPTY_SUMMARY: CasesSummary = {
  total: 0,
  byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0, port: 0, mosb: 0 },
  bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
  bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
  bySiteStorageType: {},
  byRouteType: OVERVIEW_ROUTE_TYPES.reduce((acc, routeType) => {
    acc[routeType.id] = 0
    return acc
  }, {} as CasesSummary['byRouteType']),
  byFlowCode: {},
  byVendor: {},
  bySqmByLocation: {},
  totalSqm: 0,
}

/** Fetch all rows from v_cases using pagination (PostgREST db-max-rows=1000 per page). */
async function fetchAllCases() {
  const PAGE = 1000
  const cols = 'site, flow_code, status_current, status_location, sqm, source_vendor, storage_type'
  const allRows: Array<Record<string, unknown>> = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('v_cases')
      .select(cols)
      .range(offset, offset + PAGE - 1)
      .order('id')

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  return allRows
}

export async function GET() {
  try {
    const data = await fetchAllCases()

    const summary: CasesSummary = {
      total: data.length,
      byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0, port: 0, mosb: 0 },
      bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
      bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
      bySiteStorageType: {},
      byRouteType: OVERVIEW_ROUTE_TYPES.reduce((acc, routeType) => {
        acc[routeType.id] = 0
        return acc
      }, {} as CasesSummary['byRouteType']),
      byFlowCode: {},
      byVendor: {},
      bySqmByLocation: {},
      totalSqm: 0,
    }

    for (const row of data) {
      const status_current = row.status_current as string | null
      const status_location = row.status_location as string | null
      const stage = classifyStage(status_current ?? null, status_location ?? null)
      const stageKey = PIPELINE_STAGE_META[stage].summaryKey
      summary.byStatus[stageKey]++

      const site = normalizeSite((row.site as string) ?? null)
      if (site === 'SHU') summary.bySite.SHU++
      else if (site === 'MIR') summary.bySite.MIR++
      else if (site === 'DAS') summary.bySite.DAS++
      else if (site === 'AGI') summary.bySite.AGI++
      else summary.bySite.Unassigned++

      if (stage === 'site' && site) {
        if (site === 'SHU') summary.bySiteArrived.SHU++
        else if (site === 'MIR') summary.bySiteArrived.MIR++
        else if (site === 'DAS') summary.bySiteArrived.DAS++
        else if (site === 'AGI') summary.bySiteArrived.AGI++
      }

      if (site) {
        if (!summary.bySiteStorageType[site]) {
          summary.bySiteStorageType[site] = { Indoor: 0, Outdoor: 0, 'Outdoor Cov': 0 }
        }
        const storageBucket = normalizeStorageType((row.storage_type as string) ?? null)
        if (storageBucket) {
          summary.bySiteStorageType[site][storageBucket]++
        }
      }

      const fc = String(row.flow_code ?? 'null')
      summary.byFlowCode[fc] = (summary.byFlowCode[fc] ?? 0) + 1
      const routeTypeId = getRouteTypeIdFromFlowCode(
        typeof row.flow_code === 'number' ? row.flow_code : null,
      )
      summary.byRouteType[routeTypeId] = (summary.byRouteType[routeTypeId] ?? 0) + 1

      const v = row.source_vendor as string
      const vendorKey = v === 'Hitachi' || v === 'Siemens' ? v : 'Other'
      summary.byVendor[vendorKey] = (summary.byVendor[vendorKey] ?? 0) + 1

      const sqm = typeof row.sqm === 'number' ? row.sqm : 0
      summary.totalSqm += sqm
      if (stage === 'warehouse' && status_location) {
        summary.bySqmByLocation[status_location] = (summary.bySqmByLocation[status_location] ?? 0) + sqm
      }
    }

    return NextResponse.json(summary)
  } catch (err) {
    console.error('GET /api/cases/summary error:', err)
    return NextResponse.json(EMPTY_SUMMARY)
  }
}
