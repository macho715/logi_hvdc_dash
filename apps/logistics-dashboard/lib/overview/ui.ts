import type { OverviewRouteTypeId } from '@/types/overview'

export const SITE_META = {
  SHU: {
    label: 'SHU',
    accentClass: 'border-teal-500/30 bg-teal-500/10 text-teal-200',
  },
  MIR: {
    label: 'MIR',
    accentClass: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  },
  DAS: {
    label: 'DAS',
    accentClass: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  },
  AGI: {
    label: 'AGI',
    accentClass: 'border-red-500/30 bg-red-500/10 text-red-200',
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
