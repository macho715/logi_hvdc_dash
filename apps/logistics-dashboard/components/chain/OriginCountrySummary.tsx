'use client'

import type { OriginSummaryRow } from '@/types/chain'

export function OriginCountrySummary({ origins }: { origins: OriginSummaryRow[] }) {
  const topOrigins = origins.slice(0, 8)
  const max = topOrigins[0]?.count ?? 1

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">원산지 집계</h3>
        <span className="text-xs text-gray-500">POL 기준 상위 국가</span>
      </div>

      <div className="space-y-2">
        {topOrigins.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-500">
            원산지 데이터가 없습니다.
          </div>
        )}
        {topOrigins.map((origin) => (
          <div key={origin.country} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-300">{origin.country}</span>
              <span className="text-gray-500">{origin.count.toLocaleString()}건</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800">
              <div
                className="h-2 rounded-full bg-cyan-500"
                style={{ width: `${(origin.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
