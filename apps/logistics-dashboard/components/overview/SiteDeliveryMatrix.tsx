'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewSiteReadinessItem } from '@/types/overview'

// ─── Readiness thresholds ─────────────────────────────────────────
const READINESS_OK   = 85
const READINESS_WARN = 70
// ─────────────────────────────────────────────────────────────────

// ─── Site accent colors (replica exact values) ────────────────────
const SITE_ACCENT: Record<string, string> = {
  SHU: '#58E1C9',
  MIR: '#5C87FF',
  DAS: '#8A58FF',
  AGI: '#F5D36F',
}

// Per-site radial gradient background (replica exact values)
function siteGradientBg(site: string): string {
  if (site === 'SHU') return 'bg-[radial-gradient(120%_160%_at_0%_0%,rgba(55,198,171,.18),transparent_55%),linear-gradient(180deg,rgba(15,31,44,.95)_0%,rgba(11,21,34,.98)_100%)]'
  if (site === 'MIR') return 'bg-[radial-gradient(120%_160%_at_0%_0%,rgba(67,117,246,.2),transparent_55%),linear-gradient(180deg,rgba(17,26,52,.95)_0%,rgba(12,18,37,.98)_100%)]'
  if (site === 'DAS') return 'bg-[radial-gradient(120%_160%_at_0%_0%,rgba(138,88,255,.18),transparent_55%),linear-gradient(180deg,rgba(28,23,49,.95)_0%,rgba(16,14,32,.98)_100%)]'
  if (site === 'AGI') return 'bg-[radial-gradient(120%_160%_at_0%_0%,rgba(245,211,111,.18),transparent_55%),linear-gradient(180deg,rgba(35,29,14,.95)_0%,rgba(21,17,8,.98)_100%)]'
  return ''
}
// ────────────────────────────────────────────────────────────────

interface SiteDeliveryMatrixProps {
  siteReadiness: OverviewSiteReadinessItem[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

export function SiteDeliveryMatrix({ siteReadiness, loading, onNavigate }: SiteDeliveryMatrixProps) {
  const t = useT()

  return (
    <div className="rounded-[22px] border border-white/20 bg-[linear-gradient(180deg,rgba(10,16,30,.95),rgba(7,12,25,.98))] px-4 py-4 shadow-hvdc-panel">
      {/* Section header with gradient divider */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="whitespace-nowrap text-[18px] font-medium text-hvdc-text-soft">{t.siteMatrix.title}</h2>
        <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(84,110,186,0)_0%,rgba(84,110,186,.75)_16%,rgba(84,110,186,.18)_100%)]" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[260px] animate-pulse rounded-[22px] bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {siteReadiness.map((item) => {
            const accent = SITE_ACCENT[item.site] ?? '#7C89A8'

            return (
              <button
                key={item.site}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className={cn(
                  'rounded-[22px] border border-white/20 shadow-hvdc-panel overflow-hidden p-5 text-left cursor-pointer transition hover:brightness-110',
                  siteGradientBg(item.site),
                )}
              >
                {/* Top row: colored site label + icons */}
                <div className="flex items-start justify-between">
                  <span className="text-[34px] font-semibold tracking-[0.02em]" style={{ color: accent }}>
                    {item.site}
                  </span>
                  <span className="text-[11px] text-hvdc-text-muted mt-1">◭ ⌂</span>
                </div>
                <div className="text-[13px] text-hvdc-text-muted">Total Assinets</div>

                {/* Main value */}
                <div className="mt-1 text-[50px] font-semibold leading-none tracking-[-0.05em] text-white">
                  {item.total.toLocaleString()}
                </div>

                {/* Data rows */}
                <div className="mt-4 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-hvdc-text-muted">Assigned</span>
                    <span className="font-semibold text-white">{item.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hvdc-text-muted">Delivered</span>
                    <span className="font-medium text-white">{item.arrived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hvdc-text-muted">{(item.site === 'DAS' || item.site === 'AGI') ? t.siteMatrix.mosbPending : t.siteMatrix.pending}</span>
                    <span className="font-medium text-white">{item.preArrival.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hvdc-text-muted">Overdue</span>
                    <span className="font-medium text-white">{item.warehouse.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bottom progress bar (replica style) */}
                <div className="mt-4 h-[18px] overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, item.readinessPercent)}%`,
                      background: `linear-gradient(90deg, ${accent}40, ${accent}B3)`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-hvdc-text-muted">
                  <span>
                    {item.readinessPercent >= READINESS_OK ? '+' : ''}
                    {item.readinessPercent.toFixed(1)}%
                  </span>
                  <span>{(item.arrived / Math.max(item.total, 1) * 100).toFixed(0)}%</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
