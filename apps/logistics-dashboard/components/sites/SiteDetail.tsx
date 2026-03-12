'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { CaseRow } from '@/types/cases'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'
type Tab = 'summary' | 'flow' | 'monthly' | 'pending' | 'vendor'

interface Props { site: SiteKey }

export function SiteDetail({ site }: Props) {
  const [tab, setTab] = useState<Tab>('summary')
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/cases?site=${site}&pageSize=500`)
      .then(r => r.json())
      .then(j => { setCases(j.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [site])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: '요약' },
    { key: 'flow',    label: 'Flow' },
    { key: 'monthly', label: '월별 추이' },
    { key: 'pending', label: '대기 화물' },
    { key: 'vendor',  label: '벤더' },
  ]

  const arrived = cases.filter(c => c.status_current === 'site').length
  const total = cases.length
  const rate = total > 0 ? (arrived / total) * 100 : 0

  // Flow Code distribution
  const flowDist = [0,1,2,3,4,5].map(fc => ({
    name: `FC${fc}`,
    value: cases.filter(c => c.flow_code === fc).length,
  }))

  // Monthly trend (by site_arrival_date)
  const monthlyMap: Record<string, number> = {}
  cases.filter(c => c.site_arrival_date).forEach(c => {
    const month = c.site_arrival_date!.slice(0, 7)  // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] ?? 0) + 1
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))

  // Pending cases
  const pendingCases = cases.filter(c => c.status_current !== 'site').slice(0, 50)

  // Vendor dist
  const vendorMap: Record<string, number> = {}
  cases.forEach(c => {
    const v = c.source_vendor || 'Other'
    vendorMap[v] = (vendorMap[v] ?? 0) + 1
  })
  const vendorData = Object.entries(vendorMap).map(([name, value]) => ({ name, value }))

  return (
    <div className="flex-1 flex flex-col bg-gray-900 mx-4 mb-4 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t.key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {loading && <div className="text-gray-500 text-sm">Loading...</div>}

        {!loading && tab === 'summary' && (
          <div>
            <div className="text-3xl font-bold text-white mb-2">{rate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">{arrived.toLocaleString()} / {total.toLocaleString()}건 도착</div>
            <div className="mt-4 w-full bg-gray-700 rounded-full h-3">
              <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
          </div>
        )}

        {!loading && tab === 'flow' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flowDist.filter(d => d.value > 0)}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!loading && tab === 'monthly' && (
          monthlyData.length > 0
            ? <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            : <div className="text-gray-500 text-sm">site_arrival_date 데이터 없음</div>
        )}

        {!loading && tab === 'pending' && (
          <div className="overflow-auto">
            <table className="w-full text-xs text-gray-300">
              <thead><tr className="text-gray-500 border-b border-gray-700">
                <th className="py-1 text-left">Case No</th>
                <th className="py-1 text-left">현재위치</th>
                <th className="py-1 text-left">FC</th>
                <th className="py-1 text-left">벤더</th>
              </tr></thead>
              <tbody>
                {pendingCases.map(c => (
                  <tr key={c.id} className="border-b border-gray-800">
                    <td className="py-1">{c.case_no}</td>
                    <td className="py-1">{c.status_location}</td>
                    <td className="py-1">FC{c.flow_code}</td>
                    <td className="py-1">{c.source_vendor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === 'vendor' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vendorData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="value" fill="#6366f1" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
