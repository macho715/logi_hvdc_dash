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
  if (gate === 'ZERO' || gate === 'RED') return 'text-red-600 font-semibold'
  if (gate === 'AMBER') return 'text-amber-600 font-semibold'
  return 'text-emerald-600'
}
