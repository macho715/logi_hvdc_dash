import type { CasesSummary } from '../../types/cases'
import { PIPELINE_STAGE_META, classifyStage } from './pipelineStage'
import { normalizeStorageType } from './storageType'
import { normalizeSite } from '../logistics/normalizers'
import { OVERVIEW_ROUTE_TYPES, getRouteTypeIdFromFlowCode } from '../overview/routeTypes'

export interface CasesSummarySourceRow {
  site: string | null
  flow_code: number | null
  status_current: string | null
  status_location: string | null
  sqm?: number | null
  source_vendor?: string | null
  storage_type?: string | null
}

export function createEmptyCasesSummary(): CasesSummary {
  return {
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
}

export function buildCasesSummary(rows: CasesSummarySourceRow[]): CasesSummary {
  const summary = createEmptyCasesSummary()
  summary.total = rows.length

  for (const row of rows) {
    const stage = classifyStage(row.status_current ?? null, row.status_location ?? null)
    const stageKey = PIPELINE_STAGE_META[stage].summaryKey
    summary.byStatus[stageKey]++

    const site = normalizeSite(row.site ?? null)
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
      const storageBucket = normalizeStorageType(row.storage_type ?? null)
      if (storageBucket) summary.bySiteStorageType[site][storageBucket]++
    }

    const fc = String(row.flow_code ?? 'null')
    summary.byFlowCode[fc] = (summary.byFlowCode[fc] ?? 0) + 1
    const routeTypeId = getRouteTypeIdFromFlowCode(typeof row.flow_code === 'number' ? row.flow_code : null)
    summary.byRouteType[routeTypeId] = (summary.byRouteType[routeTypeId] ?? 0) + 1

    const vendorKey = row.source_vendor ?? 'Unknown'
    summary.byVendor[vendorKey] = (summary.byVendor[vendorKey] ?? 0) + 1

    const sqm = typeof row.sqm === 'number' ? row.sqm : 0
    summary.totalSqm += sqm
    if (stage === 'warehouse' && row.status_location) {
      summary.bySqmByLocation[row.status_location] = (summary.bySqmByLocation[row.status_location] ?? 0) + sqm
    }
  }

  return summary
}
