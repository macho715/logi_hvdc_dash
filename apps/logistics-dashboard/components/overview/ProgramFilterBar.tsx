'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { ui } from '@/lib/overview/ui'

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
    <div className={`flex h-12 items-center justify-between gap-4 border-b border-hvdc-border-soft bg-hvdc-bg-panel px-4`}>
      {/* LEFT: Title */}
      <span className="text-base font-bold text-hvdc-text-primary">
        {t.programBar.title}
      </span>

      {/* CENTER: Segmented control */}
      <div className="flex gap-0.5 rounded-full bg-hvdc-surface-subtle p-0.5">
        <button
          type="button"
          onClick={() => onModeChange('program')}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-100',
            mode === 'program'
              ? 'bg-hvdc-brand text-white shadow-hvdc-active'
              : 'text-hvdc-text-secondary hover:text-hvdc-text-primary',
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
              ? 'bg-hvdc-brand text-white shadow-hvdc-active'
              : 'text-hvdc-text-secondary hover:text-hvdc-text-primary',
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
              ? 'border-hvdc-brand bg-hvdc-brand text-white shadow-hvdc-active'
              : 'border-hvdc-border-soft text-hvdc-text-secondary hover:border-hvdc-brand',
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
                ? 'border-hvdc-brand bg-hvdc-brand text-white shadow-hvdc-active'
                : 'border-hvdc-border-soft text-hvdc-text-secondary hover:border-hvdc-brand',
            )}
          >
            {site}
          </button>
        ))}

        {/* Updated at timestamp */}
        <span className="ml-2 text-[11px] text-hvdc-text-secondary">
          Updated {updatedAt}
        </span>
      </div>
    </div>
  )
}
