'use client'

import { useEffect } from 'react'
import { useCasesStore } from '@/store/casesStore'

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

export function KpiStripCards() {
  const { summary, fetchSummary, isSummaryLoading } = useCasesStore()

  useEffect(() => { fetchSummary() }, [fetchSummary])

  if (isSummaryLoading || !summary) {
    return (
      <div className="grid grid-cols-4 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  const siteRate = summary.total > 0
    ? ((summary.byStatus.site / summary.total) * 100).toFixed(1)
    : '0.0'
  const whRate = summary.total > 0
    ? ((summary.byStatus.warehouse / summary.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      <KpiCard
        label="총 케이스"
        value={summary.total.toLocaleString()}
      />
      <KpiCard
        label="현장 도착"
        value={summary.byStatus.site.toLocaleString()}
        sub={`${siteRate}%`}
      />
      <KpiCard
        label="창고 재고"
        value={summary.byStatus.warehouse.toLocaleString()}
        sub={`${whRate}%`}
      />
      <KpiCard
        label="SQM 합계"
        value={summary.totalSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        sub="㎡"
      />
    </div>
  )
}
