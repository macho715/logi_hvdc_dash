'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { parseCargoQuery } from '@/lib/navigation/contracts'
import { useCasesStore } from '@/store/casesStore'
import { cn } from '@/lib/utils'

export function WhStatusTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { cases, fetchCases, setFilter, isLoading, openDrawer } = useCasesStore()

  useEffect(() => {
    const query = parseCargoQuery(searchParams)
    setFilter('site', query.site ?? 'all')
    setFilter('vendor', (query.vendor ?? 'all') as 'Hitachi' | 'Siemens' | 'Other' | 'all')
    setFilter('route_type', query.route_type ?? 'all')
  }, [searchParams, setFilter])

  useEffect(() => { void fetchCases() }, [fetchCases, searchParams])

  const openCase = (caseId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'wh')
    params.set('caseId', caseId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    openDrawer(caseId)
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left w-12">#</th>
            <th className="py-2 px-3 text-left">Case No</th>
            <th className="py-2 px-3 text-left w-14">Site</th>
            <th className="py-2 px-3 text-left">현재위치</th>
            <th className="py-2 px-3 text-left w-40">운송 경로</th>
            <th className="py-2 px-3 text-left w-16">SQM</th>
            <th className="py-2 px-3 text-left w-20">Status</th>
            <th className="py-2 px-3 text-left">벤더</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">Loading...</td></tr>
          )}
          {!isLoading && cases.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">데이터 없음</td></tr>
          )}
          {cases.map((c, i) => (
            <tr
              key={c.id}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
              onClick={() => openCase(c.id)}
            >
              <td className="py-1.5 px-3 text-gray-600">{i + 1}</td>
              <td className="py-1.5 px-3 font-mono">{c.case_no}</td>
              <td className="py-1.5 px-3">{c.site}</td>
              <td className="py-1.5 px-3 truncate max-w-32">{c.status_location}</td>
              <td className="py-1.5 px-3">
                <span className={cn('rounded-full border px-2 py-1 text-[10px]', getRouteTypeBadgeClass(c.route_type ?? getRouteTypeIdFromFlowCode(c.flow_code)))}>
                  {getRouteTypeLabel(c.route_type ?? getRouteTypeIdFromFlowCode(c.flow_code))}
                </span>
              </td>
              <td className="py-1.5 px-3">{c.sqm}</td>
              <td className="py-1.5 px-3">
                {c.status_current === 'site' ? '●' : c.status_current === 'warehouse' ? '△' : '○'}
              </td>
              <td className="py-1.5 px-3">{c.source_vendor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
