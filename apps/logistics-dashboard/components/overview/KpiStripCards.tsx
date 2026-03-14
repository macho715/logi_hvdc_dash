'use client'

import { cn } from '@/lib/utils'
import type { OverviewHeroMetric, NavigationIntent } from '@/types/overview'
import { ui } from '@/lib/overview/ui'

interface KpiStripCardsProps {
  metrics: OverviewHeroMetric[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function toneClass(tone?: OverviewHeroMetric['tone']): string {
  if (tone === 'critical') return 'border-t-2 border-t-red-500 border border-white/8'
  if (tone === 'warning') return 'border-t-2 border-t-amber-500 border border-white/8'
  return 'border border-white/8'
}

export function KpiStripCards({ metrics, loading = false, onNavigate }: KpiStripCardsProps) {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 px-4 py-3 lg:grid-cols-4 xl:grid-cols-8" aria-live="polite">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-hvdc-surface-subtle" />
        ))}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-2 border-b border-hvdc-border-soft px-4 py-3 lg:grid-cols-4 xl:grid-cols-8" aria-label="Overview KPI rail" aria-live="polite">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          type="button"
          onClick={() => metric.navigationIntent && onNavigate(metric.navigationIntent)}
          className={cn(
            `px-4 py-3 text-left ${ui.panel} ${ui.hoverCard}`,
            toneClass(metric.tone),
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-hvdc-text-secondary">{metric.label}</div>
          <div className="mt-1 text-[35px] font-bold leading-none text-hvdc-text-primary">{metric.value}</div>
          {metric.sublabel ? (
            <div className="mt-1 text-[11px] text-hvdc-text-secondary">{metric.sublabel}</div>
          ) : null}
        </button>
      ))}
    </section>
  )
}
