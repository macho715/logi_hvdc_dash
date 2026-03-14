'use client'

import { useCasesStore } from '@/store/casesStore'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useT } from '@/hooks/useT'
import { SiteTypeTag } from '@/components/sites/SiteTypeTag'
import { SITE_META, pressureFillClass, ui } from '@/lib/overview/ui'
import { cn } from '@/lib/utils'

type SiteKey = keyof typeof SITE_META

interface Props {
  selectedSite: SiteKey | null
  onSelect: (site: SiteKey) => void
}

export function SiteCards({ selectedSite, onSelect }: Props) {
  const { summary } = useCasesStore()
  const locale = useLogisticsStore((s) => s.locale)
  const t = useT()
  const sites = Object.keys(SITE_META) as SiteKey[]

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {sites.map(site => {
        const total = summary?.bySite[site] ?? 0
        const arrived = summary?.bySiteArrived[site] ?? 0
        const rate = total > 0 ? (arrived / total) * 100 : 0
        const isAlert = site === 'AGI' && rate < 50
        const isSelected = selectedSite === site

        return (
          <button
            key={site}
            onClick={() => onSelect(site)}
            className={cn(
              'rounded-[20px] border-2 p-5 text-left transition-all duration-150',
              isSelected
                ? 'border-hvdc-brand bg-hvdc-bg-inner shadow-hvdc-active'
                : 'border-hvdc-border-soft bg-hvdc-bg-panel hover:border-hvdc-border-strong',
              isAlert ? 'ring-1 ring-hvdc-status-risk/60' : ''
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-hvdc-text-primary">{site}</span>
              <SiteTypeTag site={site} />
            </div>
            <div className="mb-1 text-2xl font-bold text-hvdc-text-primary">
              {rate.toFixed(1)}%
              {isAlert && <span className="ml-2 text-sm text-hvdc-status-risk">⚠️</span>}
              {rate >= 99 && <span className="ml-2 text-sm text-hvdc-status-ok">✅</span>}
            </div>
            <div className={`${ui.progressTrack} mb-2`}>
              <div
                className={isAlert ? ui.progressFillRed : pressureFillClass(rate / 100)}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
            <div className="text-xs text-hvdc-text-secondary">
              {arrived.toLocaleString()} / {total.toLocaleString()}{locale === 'ko' ? '건' : ''}
            </div>
          </button>
        )
      })}
    </div>
  )
}
