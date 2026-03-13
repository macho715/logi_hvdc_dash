'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { OVERVIEW_ROUTE_TYPES, getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { useCasesStore } from '@/store/casesStore'
import { SiteTypeTag } from '@/components/sites/SiteTypeTag'
import type { CaseRow } from '@/types/cases'
import type { SitePageTab } from '@/types/overview'
import { cn } from '@/lib/utils'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'

interface Props {
  site: SiteKey
  tab: SitePageTab
  onTabChange: (tab: SitePageTab) => void
}

export function SiteDetail({ site, tab, onTabChange }: Props) {
  const router = useRouter()
  const summary = useCasesStore((state) => state.summary)
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/cases?site=${site}&pageSize=5000`)
      .then((response) => response.json())
      .then((json) => {
        setCases((json.data as CaseRow[]) ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [site])

  const tabs: { key: SitePageTab; label: string }[] = [
    { key: 'summary', label: '요약' },
    { key: 'route', label: '운송 경로' },
    { key: 'monthly', label: '월별 추이' },
    { key: 'pending', label: '대기 화물' },
    { key: 'vendor', label: '벤더' },
  ]

  const arrived = cases.filter((row) => row.status_current === 'site').length
  const total = cases.length
  const rate = total > 0 ? (arrived / total) * 100 : 0

  const routeData = useMemo(
    () =>
      OVERVIEW_ROUTE_TYPES.map((routeType) => ({
        name: routeType.label,
        value: cases.filter((row) => (row.route_type ?? getRouteTypeIdFromFlowCode(row.flow_code)) === routeType.id).length,
        routeTypeId: routeType.id,
      })).filter((entry) => entry.value > 0),
    [cases],
  )

  const monthlyMap: Record<string, number> = {}
  cases.filter((row) => row.site_arrival_date).forEach((row) => {
    const month = row.site_arrival_date!.slice(0, 7)
    monthlyMap[month] = (monthlyMap[month] ?? 0) + 1
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => ({ name, value }))

  const pendingCases = cases.filter((row) => row.status_current !== 'site').slice(0, 50)
  const storageBreakdown = summary?.bySiteStorageType[site] ?? { Indoor: 0, Outdoor: 0, 'Outdoor Cov': 0 }

  const vendorMap: Record<string, number> = {}
  cases.forEach((row) => {
    const vendor = row.source_vendor || 'Other'
    vendorMap[vendor] = (vendorMap[vendor] ?? 0) + 1
  })
  const vendorData = Object.entries(vendorMap).map(([name, value]) => ({ name, value }))

  return (
    <div className="mx-4 mb-4 flex flex-1 flex-col overflow-hidden rounded-lg bg-gray-900">
      <div className="flex border-b border-gray-800">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            onClick={() => onTabChange(entry.key)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === entry.key
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? <div className="text-sm text-gray-500">Loading...</div> : null}

        {!loading && tab === 'summary' ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-3xl font-bold text-white">{rate.toFixed(1)}%</div>
                <SiteTypeTag site={site} />
              </div>
              <div className="text-sm text-gray-400">
                {arrived.toLocaleString()} / {total.toLocaleString()}건 도착
              </div>
              <div className="mt-4 h-3 w-full rounded-full bg-gray-700">
                <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.min(rate, 100)}%` }} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(storageBreakdown).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="mt-1 text-xl font-semibold text-white">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && tab === 'route' ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={routeData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} interval={0} angle={-15} height={70} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2">
              {routeData.map((entry) => (
                <span
                  key={entry.routeTypeId}
                  className={cn('rounded-full border px-2 py-1 text-xs', getRouteTypeBadgeClass(entry.routeTypeId))}
                >
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && tab === 'monthly' ? (
          monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">site_arrival_date 데이터 없음</div>
          )
        ) : null}

        {!loading && tab === 'pending' ? (
          <div className="overflow-auto">
            <table className="w-full text-xs text-gray-300">
              <thead>
                <tr className="border-b border-gray-700 text-gray-500">
                  <th className="py-1 text-left">Case No</th>
                  <th className="py-1 text-left">현재 위치</th>
                  <th className="py-1 text-left">운송 경로</th>
                  <th className="py-1 text-left">벤더</th>
                </tr>
              </thead>
              <tbody>
                {pendingCases.map((row) => {
                  const routeTypeId = row.route_type ?? getRouteTypeIdFromFlowCode(row.flow_code)
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-gray-800 transition-colors hover:bg-gray-800/70"
                      onClick={() =>
                        router.push(
                          buildDashboardLink({
                            destinationId: 'worklist-item',
                            page: 'cargo',
                            params: {
                              tab: 'wh',
                              caseId: row.id,
                              site,
                              route_type: routeTypeId,
                            },
                          }),
                        )
                      }
                    >
                      <td className="py-1">{row.case_no}</td>
                      <td className="py-1">{row.status_location}</td>
                      <td className="py-1">
                        <span className={cn('rounded-full border px-2 py-1 text-[11px]', getRouteTypeBadgeClass(routeTypeId))}>
                          {getRouteTypeLabel(routeTypeId)}
                        </span>
                      </td>
                      <td className="py-1">{row.source_vendor}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && tab === 'vendor' ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendorData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  )
}
