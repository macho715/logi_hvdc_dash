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
    <div className="flex h-12 items-center justify-between gap-4 border-b border-[var(--ops-border)] bg-[var(--ops-surface)] px-4">
      {/* LEFT: Title */}
      <span className="text-base font-bold text-[var(--ops-text-strong)]">
        {t.programBar.title}
      </span>

      {/* CENTER: Segmented control */}
      <div className="flex rounded-full bg-[var(--ops-canvas)] p-0.5 gap-0.5">
        <button
          type="button"
          onClick={() => onModeChange('program')}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-colors duration-100',
            mode === 'program'
              ? 'bg-[var(--ops-info)] text-white'
              : 'text-[var(--ops-text-muted)] hover:text-[var(--ops-text-strong)]',
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
              ? 'bg-[var(--ops-info)] text-white'
              : 'text-[var(--ops-text-muted)] hover:text-[var(--ops-text-strong)]',
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
              ? 'bg-[var(--ops-info)] text-white border-[var(--ops-info)]'
              : 'text-[var(--ops-text-muted)] border-[var(--ops-border)] hover:border-[var(--ops-info)]',
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
                ? 'bg-[var(--ops-info)] text-white border-[var(--ops-info)]'
                : 'text-[var(--ops-text-muted)] border-[var(--ops-border)] hover:border-[var(--ops-info)]',
            )}
          >
            {site}
          </button>
        ))}

        {/* Updated at timestamp */}
        <span className="text-[11px] text-[var(--ops-text-muted)] ml-2">
          Updated {updatedAt}
        </span>
      </div>
    </div>
  )
}
