'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/hooks/useT'

import { buildDashboardLink } from '@/lib/navigation/contracts'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import type { CasesFilter, CaseRow } from '@/types/cases'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import type { OverviewRouteTypeId } from '@/types/overview'
import { normalizeStorageType } from '@/lib/cases/storageType'
import { cn } from '@/lib/utils'
import { ui } from '@/lib/overview/ui'

export type PipelineTableFilters = Pick<CasesFilter, 'site' | 'vendor' | 'category'>

const DEFAULT_FILTERS: PipelineTableFilters = {
  site: 'all',
  vendor: 'all',
  category: 'all',
}

interface Props {
  stage: PipelineStage | null
  filters?: PipelineTableFilters
  routeType?: OverviewRouteTypeId
  title?: string
}

export function PipelineCasesTable({
  stage,
  filters = DEFAULT_FILTERS,
  routeType,
  title,
}: Props) {
  const t = useT()
  const displayTitle = title ?? t.pipeline.stageCases
  const router = useRouter()
  const [rows, setRows] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    if (!stage) return null
    const params = new URLSearchParams()
    params.set('stage', stage)
    params.set('pageSize', '200')
    if (filters.site !== 'all') params.set('site', filters.site)
    if (filters.vendor !== 'all') params.set('vendor', filters.vendor)
    if (filters.category !== 'all') params.set('category', filters.category)
    if (routeType) params.set('route_type', routeType)
    return `/api/cases?${params.toString()}`
  }, [filters.category, filters.site, filters.vendor, routeType, stage])

  useEffect(() => {
    if (!query) {
      setRows([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(query)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        setRows((json.data as CaseRow[]) ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (!stage) {
    return (
      <div className="rounded-xl border border-dashed border-hvdc-border-soft bg-hvdc-surface-subtle p-6 text-sm text-hvdc-text-secondary">
        {t.pipeline.selectStageHint}
      </div>
    )
  }

  return (
    <section className={ui.panel}>
      <div className="flex items-center justify-between border-b border-hvdc-border-soft px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-hvdc-text-primary">{displayTitle}</h3>
          <p className="text-xs text-hvdc-text-muted">{t.pipeline.rowClickHint}</p>
        </div>
        <span className="text-xs text-hvdc-text-muted">{rows.length.toLocaleString()} rows</span>
      </div>

      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-xs text-hvdc-text-primary">
          <thead className="sticky top-0 bg-hvdc-bg-panel">
            <tr className="border-b border-hvdc-border-soft text-hvdc-text-secondary">
              <th className="px-3 py-2 text-left">Case No</th>
              <th className="px-3 py-2 text-left">Site</th>
              <th className="px-3 py-2 text-left">{t.pipeline.currentLocation}</th>
              <th className="px-3 py-2 text-left">{t.pipeline.route}</th>
              <th className="px-3 py-2 text-left">Storage</th>
              <th className="px-3 py-2 text-left">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-hvdc-text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-hvdc-text-muted">
                  {t.pipeline.noMatchingCases}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-hvdc-border-soft transition-colors hover:bg-hvdc-surface-hover"
                onClick={() =>
                  router.push(
                    buildDashboardLink({
                      destinationId: 'worklist-item',
                      page: 'cargo',
                      params: {
                        tab: 'wh',
                        caseId: row.id,
                        ...(row.site ? { site: row.site } : {}),
                        route_type: row.route_type ?? getRouteTypeIdFromFlowCode(row.flow_code),
                      },
                    }),
                  )
                }
              >
                <td className="px-3 py-2 font-mono text-hvdc-text-primary">{row.case_no}</td>
                <td className="px-3 py-2">{row.site ?? '–'}</td>
                <td className="px-3 py-2">{row.status_location ?? row.status_current}</td>
                <td className="px-3 py-2">
                  <span className={cn('rounded-full border px-2 py-1 text-[10px] font-semibold', getRouteTypeBadgeClass(row.route_type ?? getRouteTypeIdFromFlowCode(row.flow_code)))}>
                    {getRouteTypeLabel(row.route_type ?? getRouteTypeIdFromFlowCode(row.flow_code))}
                  </span>
                </td>
                <td className="px-3 py-2">{normalizeStorageType(row.storage_type) ?? '–'}</td>
                <td className="px-3 py-2">{row.source_vendor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
