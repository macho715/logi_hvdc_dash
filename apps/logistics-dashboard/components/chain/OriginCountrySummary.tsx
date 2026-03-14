'use client'

import type { OriginSummaryRow } from '@/types/chain'
import { useT } from '@/hooks/useT'
import { chartColors, ui } from '@/lib/overview/ui'

export function OriginCountrySummary({ origins }: { origins: OriginSummaryRow[] }) {
  const t = useT()
  const topOrigins = origins.slice(0, 8)
  const max = topOrigins[0]?.count ?? 1

  return (
    <section className={`${ui.panel} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-hvdc-text-primary">{t.chain.originSummaryTitle}</h3>
        <span className="text-xs text-hvdc-text-muted">{t.chain.originSummaryDesc}</span>
      </div>

      <div className="space-y-2">
        {topOrigins.length === 0 && (
          <div className="rounded-lg border border-dashed border-hvdc-border-soft px-3 py-4 text-sm text-hvdc-text-muted">
            {t.chain.noOriginData}
          </div>
        )}
        {topOrigins.map((origin) => (
          <div key={origin.country} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-hvdc-text-primary">{origin.country}</span>
              <span className="text-hvdc-text-muted">{origin.count.toLocaleString()}{t.chain.caseCount === 'cases' ? ` ${t.chain.caseCount}` : t.chain.caseCount}</span>
            </div>
            <div className={ui.progressTrack}>
              <div
                className={ui.progressFillBlue}
                style={{ width: `${(origin.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
