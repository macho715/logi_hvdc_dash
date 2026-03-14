'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { parseCargoQuery } from '@/lib/navigation/contracts'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

export function WhStatusTable() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { cases, fetchCases, setFilter, isLoading, openDrawer } = useCasesStore()
  const t = useT()

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
        <thead className="sticky top-0 bg-[#0B1730]">
          <tr className="text-slate-400 border-b border-white/8">
            <th className="py-2 px-3 text-left w-12">#</th>
            <th className="py-2 px-3 text-left">Case No</th>
            <th className="py-2 px-3 text-left w-14">Site</th>
            <th className="py-2 px-3 text-left">{t.cargo.currentLocation}</th>
            <th className="py-2 px-3 text-left w-40">{t.cargo.route}</th>
            <th className="py-2 px-3 text-left w-16">SQM</th>
            <th className="py-2 px-3 text-left w-20">Status</th>
            <th className="py-2 px-3 text-left">{t.cargo.vendor}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={8} className="py-8 text-center text-slate-500">Loading...</td></tr>
          )}
          {!isLoading && cases.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-slate-500">{t.cargo.noData}</td></tr>
          )}
          {cases.map((c, i) => (
            <tr
              key={c.id}
              className="border-b border-white/6 hover:bg-white/[0.03] cursor-pointer"
              onClick={() => openCase(c.id)}
            >
              <td className="py-1.5 px-3 text-slate-500">{i + 1}</td>
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
