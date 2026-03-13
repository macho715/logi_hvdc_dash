'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { buildDashboardLink } from '@/lib/navigation/contracts'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import type { CasesFilter, CaseRow } from '@/types/cases'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import type { OverviewRouteTypeId } from '@/types/overview'
import { normalizeStorageType } from '@/lib/cases/storageType'
import { cn } from '@/lib/utils'

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
  title = '선택 단계 케이스',
}: Props) {
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
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/70 p-6 text-sm text-gray-400">
        파이프라인 단계를 선택하면 해당 케이스가 여기에 표시됩니다.
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/80">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500">행 클릭 시 Cargo drawer로 이동합니다.</p>
        </div>
        <span className="text-xs text-gray-500">{rows.length.toLocaleString()} rows</span>
      </div>

      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-xs text-gray-300">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="px-3 py-2 text-left">Case No</th>
              <th className="px-3 py-2 text-left">Site</th>
              <th className="px-3 py-2 text-left">현재 위치</th>
              <th className="px-3 py-2 text-left">운송 경로</th>
              <th className="px-3 py-2 text-left">Storage</th>
              <th className="px-3 py-2 text-left">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-600">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-600">
                  일치하는 케이스가 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-gray-800/80 transition-colors hover:bg-gray-800/70"
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
                <td className="px-3 py-2 font-mono text-gray-200">{row.case_no}</td>
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
