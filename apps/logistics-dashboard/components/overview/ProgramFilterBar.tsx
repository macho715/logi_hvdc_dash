'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'
type DashMode = 'program' | 'ops'

interface ProgramFilterBarProps {
  mode: DashMode
  onModeChange: (mode: DashMode) => void
  updatedAt: string
  selectedSite: SiteKey | null
  onSiteChange: (site: SiteKey | null) => void
}

const SITES: SiteKey[] = ['SHU', 'MIR', 'DAS', 'AGI']

export function ProgramFilterBar({
  mode,
  onModeChange,
  updatedAt,
  selectedSite,
  onSiteChange,
}: ProgramFilterBarProps) {
  const t = useT()

  return (
    <div className="flex h-12 items-center justify-between gap-4 border-b border-white/8 bg-[#0B1730] px-4">
      {/* LEFT: Title */}
      <span className="text-base font-bold text-white">
        {t.programBar.title}
      </span>

      {/* CENTER: Segmented control */}
      <div className="flex rounded-full bg-white/5 p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => onModeChange('program')}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-100',
            mode === 'program'
              ? 'bg-[#2563EB] text-white'
              : 'text-slate-400 hover:text-white',
          )}
        >
          {t.programBar.modeProgram}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('ops')}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-100',
            mode === 'ops'
              ? 'bg-[#2563EB] text-white'
              : 'text-slate-400 hover:text-white',
          )}
        >
          {t.programBar.modeOps}
        </button>
      </div>

      {/* RIGHT: Site filters + updatedAt */}
      <div className="flex items-center gap-1">
        {/* All button */}
        <button
          type="button"
          onClick={() => onSiteChange(null)}
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors duration-100',
            selectedSite === null
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'text-slate-400 border-white/8 hover:border-[#2563EB]',
          )}
        >
          {t.programBar.filterAll}
        </button>

        {/* Individual site buttons */}
        {SITES.map((site) => (
          <button
            key={site}
            type="button"
            onClick={() => onSiteChange(site)}
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors duration-100',
              selectedSite === site
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'text-slate-400 border-white/8 hover:border-[#2563EB]',
            )}
          >
            {site}
          </button>
        ))}

        {/* Updated at timestamp */}
        <span className="text-[11px] text-slate-400 ml-2">
          Updated {updatedAt}
        </span>
      </div>
    </div>
  )
}
