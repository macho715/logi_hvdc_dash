'use client'

import { cn } from '@/lib/utils'
import type { OverviewHeroMetric, NavigationIntent } from '@/types/overview'

// ─── Design constants (edit this block only for visual changes) ──
const KPI_CARD_COUNT  = 6
const KPI_GRID_COLS   = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'
const KPI_LABEL_CLASS = 'text-[12px] font-medium tracking-[0.18em] text-hvdc-text-muted uppercase'
const KPI_VALUE_CLASS = 'mt-1 text-[26px] font-semibold leading-[30px] tracking-[-0.05em] text-white'
const KPI_PULSE_POS   = 'absolute right-3 top-3 size-1.5 rounded-full animate-pulse'
// ─────────────────────────────────────────────────────────────────

// ─── 표시할 KPI ID 순서 (변경 시 이 배열만 수정) ─────────────────
const KPI_DISPLAY_IDS = [
  'total-shipments',
  'final-delivered',
  'open-anomaly',
  'overdue-eta',
  'mosb-pending',
  'agi-risk',
] as const

// 라벨 오버라이드 (API 라벨 → 레퍼런스 라벨)
const KPI_LABEL_OVERRIDE: Partial<Record<string, string>> = {
  'final-delivered': 'FINAL DELIVERED',
  'open-anomaly':    'CUSTOMS ACTIVE',
  'agi-risk':        'MOSB PENDING',
  'mosb-pending':    'WH STAGING',
}
// ────────────────────────────────────────────────────────────────

interface KpiStripCardsProps {
  metrics: OverviewHeroMetric[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
  siteReadiness?: Array<{ site: string; readinessPercent: number }>
}

// Sublabel text color per card theme (spec-color.md §KPI Cards)
function sublabelColor(id: string): string {
  if (id === 'open-anomaly') return 'text-[#F4C7B8]'       // Open Radar — pink meta
  if (id === 'overdue-eta')  return 'text-hvdc-brand-red'   // Overdue ETA — red meta
  if (id === 'mosb-pending') return 'text-hvdc-brand-amber' // MOSB — amber meta
  return 'text-hvdc-text-muted'
}

// Card background theme based on metric ID (replica cool/hot/warm)
function cardThemeClass(id: string): string {
  if (id === 'open-anomaly' || id === 'overdue-eta') return 'bg-hvdc-card-hot'
  if (id === 'mosb-pending') return 'bg-hvdc-card-warm'
  return 'bg-hvdc-card'
}

// Status indicator dot color per card
function dotColor(id: string): string {
  if (id === 'open-anomaly') return 'bg-hvdc-status-risk'
  if (id === 'overdue-eta')  return 'bg-hvdc-brand-orange'
  if (id === 'mosb-pending') return 'bg-hvdc-brand-amber'
  return ''
}

export function KpiStripCards({ metrics, loading = false, onNavigate, siteReadiness }: KpiStripCardsProps) {
  if (loading && metrics.length === 0) {
    return (
      <div className={`grid ${KPI_GRID_COLS} gap-2`} aria-live="polite">
        {Array.from({ length: KPI_CARD_COUNT }).map((_, index) => (
          <div key={index} className="h-[110px] animate-pulse rounded-[22px] bg-hvdc-surface-subtle" />
        ))}
      </div>
    )
  }

  const displayMetrics = KPI_DISPLAY_IDS
    .map(id => metrics.find(m => m.id === id))
    .filter((m): m is OverviewHeroMetric => m != null)
    .map(m => ({ ...m, label: KPI_LABEL_OVERRIDE[m.id] ?? m.label }))

  return (
    <section className={`grid ${KPI_GRID_COLS} gap-2`} aria-label="Overview KPI rail" aria-live="polite">
      {displayMetrics.map((metric) => {
        const dot = dotColor(metric.id)
        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => metric.navigationIntent && onNavigate(metric.navigationIntent)}
            className={cn(
              'relative px-6 py-3 text-left rounded-[22px] border border-white/20 shadow-hvdc-panel cursor-pointer transition hover:brightness-110 backdrop-blur-[18px] overflow-hidden',
              cardThemeClass(metric.id),
            )}
          >
            {/* Radial decorative overlay (레플리카 §5.1) */}
            <div className="pointer-events-none absolute inset-0 opacity-55 bg-[radial-gradient(circle_at_22%_28%,rgba(87,126,255,.2),transparent_34%),radial-gradient(circle_at_74%_40%,rgba(255,115,91,.16),transparent_28%),radial-gradient(circle_at_48%_78%,rgba(255,255,255,.045),transparent_16%)]" />
            {dot && (
              <span
                className={cn(KPI_PULSE_POS, dot)}
                style={
                  metric.id === 'overdue-eta'  ? { boxShadow: '0 0 12px rgba(255,145,87,.45)' } :
                  metric.id === 'open-anomaly' ? { boxShadow: '0 0 0 1px rgba(245,195,102,.24), 0 0 26px rgba(245,195,102,.18)' } :
                  undefined
                }
                aria-hidden="true"
              />
            )}
            <div className={KPI_LABEL_CLASS}>{metric.label}</div>
            <div className={KPI_VALUE_CLASS}>{metric.value}</div>
            {metric.sublabel ? (
              <div className={cn('mt-1.5 text-[11px]', sublabelColor(metric.id))}>{metric.sublabel}</div>
            ) : null}
            {/* AGI READINESS — per-site readiness mini grid */}
            {metric.id === 'agi-risk' && siteReadiness && siteReadiness.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-hvdc-text-muted">
                {siteReadiness.slice(0, 4).map(s => (
                  <span key={s.site}>
                    {s.site}{' '}
                    <span className={
                      s.readinessPercent >= 85 ? 'text-[#F7DF8F]' :
                      s.readinessPercent >= 70 ? 'text-hvdc-brand-amber' :
                      'text-hvdc-status-risk'
                    }>
                      {s.readinessPercent.toFixed(1)}%
                    </span>
                  </span>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </section>
  )
}
