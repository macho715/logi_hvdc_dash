'use client'

import { cn } from '@/lib/utils'
import type { OverviewHeroMetric, NavigationIntent } from '@/types/overview'

interface KpiStripCardsProps {
  metrics: OverviewHeroMetric[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function toneClass(tone?: OverviewHeroMetric['tone']): string {
  if (tone === 'critical') return 'border-t-2 border-t-[var(--ops-risk)] border border-[var(--ops-border)]'
  if (tone === 'warning') return 'border-t-2 border-t-[var(--ops-warn)] border border-[var(--ops-border)]'
  return 'border border-[var(--ops-border)]'
}

export function KpiStripCards({ metrics, loading = false, onNavigate }: KpiStripCardsProps) {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 px-4 py-3 lg:grid-cols-4 xl:grid-cols-8" aria-live="polite">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-[var(--ops-canvas)]" />
        ))}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-2 px-4 py-3 lg:grid-cols-4 xl:grid-cols-8 border-b border-[var(--ops-border)]" aria-label="Overview KPI rail" aria-live="polite">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          type="button"
          onClick={() => metric.navigationIntent && onNavigate(metric.navigationIntent)}
          className={cn(
            'rounded-xl bg-[var(--ops-surface)] px-4 py-3 text-left transition-shadow duration-[140ms] hover:shadow-md',
            toneClass(metric.tone),
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ops-text-muted)]">{metric.label}</div>
          <div className="mt-1 text-[35px] font-bold leading-none text-[var(--ops-text-strong)]">{metric.value}</div>
          {metric.sublabel ? (
            <div className="mt-1 text-[11px] text-[var(--ops-text-muted)]">{metric.sublabel}</div>
          ) : null}
        </button>
      ))}
    </section>
  )
}
