'use client'

import type { CasesFilter } from '@/types/cases'
import type { PipelineTableFilters } from '@/components/pipeline/PipelineCasesTable'
import { useT } from '@/hooks/useT'
import { ui } from '@/lib/overview/ui'

type SelectProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="whitespace-nowrap text-xs text-hvdc-text-secondary">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${ui.select} px-2 py-1 text-xs`}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

interface Props {
  filters: PipelineTableFilters
  setFilter: <K extends keyof PipelineTableFilters>(key: K, value: PipelineTableFilters[K]) => void
  resetFilters: () => void
}

export function PipelineFilterBar({ filters, setFilter, resetFilters }: Props) {
  const t = useT()
  return (
    <div className={`flex flex-wrap items-center gap-4 border-b border-hvdc-border-soft px-4 py-2 ${ui.panelInner}`}>
      <FilterSelect
        label={t.pipeline.siteFilter}
        value={String(filters.site)}
        onChange={v => setFilter('site', v as CasesFilter['site'])}
        options={[
          { value: 'all', label: t.pipeline.all },
          { value: 'SHU', label: 'SHU' },
          { value: 'MIR', label: 'MIR' },
          { value: 'DAS', label: 'DAS' },
          { value: 'AGI', label: 'AGI' },
        ]}
      />
      <FilterSelect
        label={t.pipeline.vendorFilter}
        value={String(filters.vendor)}
        onChange={v => setFilter('vendor', v as CasesFilter['vendor'])}
        options={[
          { value: 'all', label: t.pipeline.all },
          { value: 'Hitachi', label: 'Hitachi' },
          { value: 'Siemens', label: 'Siemens' },
          { value: 'Other', label: 'Other' },
        ]}
      />
      <FilterSelect
        label={t.pipeline.categoryFilter}
        value={String(filters.category)}
        onChange={v => setFilter('category', v as CasesFilter['category'])}
        options={[
          { value: 'all', label: t.pipeline.all },
          { value: 'Elec', label: 'Elec' },
          { value: 'Mech', label: 'Mech' },
          { value: 'Inst.', label: 'Inst.' },
        ]}
      />
      <button
        onClick={resetFilters}
        className="ml-auto text-xs text-hvdc-text-muted hover:text-hvdc-text-primary"
      >
        {t.pipeline.reset}
      </button>
    </div>
  )
}
