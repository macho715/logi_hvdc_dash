'use client'

import { cn } from '@/lib/utils'
import type { OverviewHeroMetric, NavigationIntent } from '@/types/overview'

interface KpiStripCardsProps {
  metrics: OverviewHeroMetric[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function toneClass(tone?: OverviewHeroMetric['tone']): string {
  if (tone === 'critical') return 'border-red-500/30 bg-red-500/10'
  if (tone === 'warning') return 'border-amber-500/30 bg-amber-500/10'
  return 'border-gray-800 bg-gray-900/80'
}

export function KpiStripCards({ metrics, loading = false, onNavigate }: KpiStripCardsProps) {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-5" aria-live="polite">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-900/80" />
        ))}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-5" aria-label="Overview KPI rail" aria-live="polite">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          type="button"
          onClick={() => metric.navigationIntent && onNavigate(metric.navigationIntent)}
          className={cn(
            'rounded-2xl border px-4 py-3 text-left transition-colors hover:border-blue-400/40 hover:bg-gray-900',
            toneClass(metric.tone),
          )}
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{metric.label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{metric.value}</div>
          {metric.sublabel ? (
            <div className="mt-1 text-xs text-gray-400">{metric.sublabel}</div>
          ) : null}
        </button>
      ))}
    </section>
  )
}
