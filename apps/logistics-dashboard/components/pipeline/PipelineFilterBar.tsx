'use client'

import type { CasesFilter } from '@/types/cases'
import type { PipelineTableFilters } from '@/components/pipeline/PipelineCasesTable'
import { useT } from '@/hooks/useT'

type SelectProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-400 whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#0A1428] text-slate-200 text-xs rounded px-2 py-1 border border-white/8 focus:outline-none focus:border-[#2563EB]"
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
    <div className="flex items-center gap-4 flex-wrap bg-[#0D1A35] px-4 py-2 border-b border-white/8">
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
        className="text-xs text-slate-500 hover:text-slate-300 ml-auto"
      >
        {t.pipeline.reset}
      </button>
    </div>
  )
}
