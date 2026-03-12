'use client'

import { useCasesStore } from '@/store/casesStore'

const FLOW_COLORS: Record<string, string> = {
  '0': '#6366f1', '1': '#3b82f6', '2': '#10b981',
  '3': '#f59e0b', '4': '#ef4444', '5': '#8b5cf6',
}

export function OverviewRightPanel() {
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-full bg-gray-900 animate-pulse rounded-lg" />

  const total = summary.total || 1
  const sites = ['SHU', 'MIR', 'DAS', 'AGI'] as const

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 h-full overflow-auto">
      {/* Flow Code Distribution */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Flow Code 분포
        </h3>
        <div className="space-y-2">
          {Object.entries(summary.byFlowCode)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([fc, count]) => (
              <div key={fc} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">FC{fc}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(count / total) * 100}%`,
                      backgroundColor: FLOW_COLORS[fc] ?? '#6b7280',
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Site Delivery Rates */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          현장별 납품률
        </h3>
        <div className="space-y-2">
          {sites.map(site => {
            const total_site = summary.bySite[site] || 0
            const arrived = summary.bySiteArrived[site] || 0
            const rate = total_site > 0 ? (arrived / total_site) * 100 : 0
            return (
              <div key={site} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8">{site}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {rate.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
