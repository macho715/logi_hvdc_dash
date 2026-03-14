'use client'

import { cn } from '@/lib/utils'
import { SITE_META, readinessBadgeClass, ui } from '@/lib/overview/ui'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewSiteReadinessItem } from '@/types/overview'

interface SiteDeliveryMatrixProps {
  siteReadiness: OverviewSiteReadinessItem[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

export function SiteDeliveryMatrix({ siteReadiness, loading, onNavigate }: SiteDeliveryMatrixProps) {
  const t = useT()

  return (
    <div className="border-t border-hvdc-border-soft bg-hvdc-bg-page px-4 py-4">
      <h2 className={`${ui.sectionTitle} mb-3`}>
        {t.siteMatrix.title}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`${ui.panelInner} animate-pulse p-4`}
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
                className={`${ui.panel} ${ui.hoverCard} cursor-pointer p-6 text-left`}
              >
                {/* Site chip */}
                <span className={siteMeta.chipClass}>
                  {item.site}
                </span>

                {/* Hero metric: Assigned */}
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-hvdc-text-secondary">
                    {t.siteMatrix.assigned}
                  </div>
                  <div className="mt-1 text-[34px] leading-none font-bold tracking-[-0.02em] text-hvdc-text-primary">
                    {item.total.toLocaleString()}
                  </div>
                </div>

                {/* Data grid */}
                <div className="mt-4 space-y-2.5">
                  {/* Delivered */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {t.siteMatrix.delivered}
                    </span>
                    <span className="text-sm font-semibold text-hvdc-text-primary">
                      {item.arrived.toLocaleString()}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {t.siteMatrix.pending}
                    </span>
                    <span className="text-sm font-semibold text-hvdc-text-primary">
                      {item.preArrival.toLocaleString()}
                    </span>
                  </div>

                  {/* MOSB Pending */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {t.siteMatrix.mosbPending}
                    </span>
                    <span className="text-sm font-semibold text-hvdc-text-primary">
                      {item.mosb.toLocaleString()}
                    </span>
                  </div>

                  {/* Overdue (v1 placeholder) */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {t.siteMatrix.overdue}
                    </span>
                    <span className="text-sm font-semibold text-hvdc-text-primary">
                      —
                    </span>
                  </div>

                  {/* Risk */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {t.siteMatrix.risk}
                    </span>
                    <span className={readinessBadgeClass(item.readinessPercent)}>
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
