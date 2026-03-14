import type { OverviewRouteTypeId } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

export const SITE_META = {
  SHU: {
    label: 'SHU',
    accentClass: 'border-teal-500/30 bg-teal-500/10 text-teal-200',
    chipClass: 'bg-teal-50 text-teal-700 border border-teal-300',
    riskColor: '#16A34A',
  },
  MIR: {
    label: 'MIR',
    accentClass: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    chipClass: 'bg-violet-50 text-violet-700 border border-violet-300',
    riskColor: '#2563EB',
  },
  DAS: {
    label: 'DAS',
    accentClass: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
    chipClass: 'bg-orange-50 text-orange-700 border border-orange-300',
    riskColor: '#D97706',
  },
  AGI: {
    label: 'AGI',
    accentClass: 'border-red-500/30 bg-red-500/10 text-red-200',
    chipClass: 'bg-red-50 text-red-700 border border-red-300',
    riskColor: '#DC2626',
  },
} as const

export function getRouteTypeBadgeClass(routeTypeId?: OverviewRouteTypeId): string {
  switch (routeTypeId) {
    case 'pre-arrival':
      return 'border-slate-500/30 bg-slate-500/10 text-slate-200'
    case 'direct-to-site':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-200'
    case 'via-warehouse':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    case 'via-mosb':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-200'
    case 'via-warehouse-mosb':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-200'
    default:
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-200'
  }
}

export function gateClass(gate: WorklistRow['gate']): string {
  if (gate === 'ZERO' || gate === 'RED') return 'text-red-300'
  if (gate === 'AMBER') return 'text-amber-300'
  return 'text-emerald-300'
}

export function gateClassLight(gate: WorklistRow['gate']): string {
  if (gate === 'ZERO' || gate === 'RED')
    return 'inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200'
  if (gate === 'AMBER')
    return 'inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200'
  return 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200'
}

export const uiTokens = {
  panel:
    'rounded-2xl border border-[var(--ops-border)] bg-[var(--ops-surface)] shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.05)]',
  panelSubtle:
    'rounded-2xl border border-[var(--ops-border)] bg-[#F8FAFC]',
  hoverCard:
    'transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(15,23,42,.06)]',
  hoverRow:
    'transition-colors duration-150 hover:bg-slate-50',
} as const
