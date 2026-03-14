'use client'

import { useCasesStore } from '@/store/casesStore'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useT } from '@/hooks/useT'
import { SiteTypeTag } from '@/components/sites/SiteTypeTag'
import { SITE_META } from '@/lib/overview/ui'
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
                ? 'border-[#2563EB] bg-[#0D1A35] shadow-[0_0_0_1px_rgba(37,99,235,.25),0_12px_30px_rgba(0,0,0,.24)]'
                : 'border-white/8 bg-[#0B1730] hover:border-white/15',
              isAlert ? 'ring-1 ring-red-500/60' : ''
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white text-lg">{site}</span>
              <SiteTypeTag site={site} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {rate.toFixed(1)}%
              {isAlert && <span className="text-red-400 text-sm ml-2">⚠️</span>}
              {rate >= 99 && <span className="text-green-400 text-sm ml-2">✅</span>}
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.min(rate, 100)}%`,
                  backgroundColor: isAlert ? '#ef4444' : '#3b82f6',
                }}
              />
            </div>
            <div className="text-xs text-slate-400">
              {arrived.toLocaleString()} / {total.toLocaleString()}{locale === 'ko' ? '건' : ''}
            </div>
          </button>
        )
      })}
    </div>
  )
}
