'use client'

import { cn } from '@/lib/utils'
import { SITE_META } from '@/lib/overview/ui'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewSiteReadinessItem } from '@/types/overview'

interface SiteDeliveryMatrixProps {
  siteReadiness: OverviewSiteReadinessItem[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function riskBadgeClass(readinessPercent: number): string {
  if (readinessPercent < 50) {
    return 'rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-500/12 text-red-300 ring-1 ring-red-400/20'
  }
  if (readinessPercent < 80) {
    return 'rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20'
  }
  return 'rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20'
}

export function SiteDeliveryMatrix({ siteReadiness, loading, onNavigate }: SiteDeliveryMatrixProps) {
  const t = useT()

  return (
    <div className="border-t border-white/8 bg-[#071225] px-4 py-4">
      <h2 className="text-[16px] font-semibold text-white mb-3">
        {t.siteMatrix.title}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/8 bg-white/5 p-4 animate-pulse"
            >
              <div className="h-6 w-16 rounded-full bg-white/10" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 w-20 rounded bg-white/5" />
                    <div className="h-3 w-10 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {siteReadiness.map((item) => {
            const siteMeta = SITE_META[item.site]
            return (
              <button
                key={item.site}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="rounded-[20px] border border-white/8 bg-[#0B1730] p-6 text-left cursor-pointer shadow-[0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28)] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]"
              >
                {/* Site chip */}
                <span className={siteMeta.chipClass}>
                  {item.site}
                </span>

                {/* Hero metric: Assigned */}
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {t.siteMatrix.assigned}
                  </div>
                  <div className="mt-1 text-[34px] leading-none font-bold tracking-[-0.02em] text-white">
                    {item.total.toLocaleString()}
                  </div>
                </div>

                {/* Data grid */}
                <div className="mt-4 space-y-2.5">
                  {/* Delivered */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.siteMatrix.delivered}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {item.arrived.toLocaleString()}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.siteMatrix.pending}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {item.preArrival.toLocaleString()}
                    </span>
                  </div>

                  {/* MOSB Pending */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.siteMatrix.mosbPending}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {item.mosb.toLocaleString()}
                    </span>
                  </div>

                  {/* Overdue (v1 placeholder) */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.siteMatrix.overdue}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      —
                    </span>
                  </div>

                  {/* Risk */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {t.siteMatrix.risk}
                    </span>
                    <span className={riskBadgeClass(item.readinessPercent)}>
                      {item.readinessPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
