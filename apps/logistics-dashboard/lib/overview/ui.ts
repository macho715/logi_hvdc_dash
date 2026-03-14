import type { OverviewRouteTypeId } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

export const SITE_META = {
  SHU: {
    label: 'SHU',
    accentClass: 'border-teal-500/30 bg-teal-500/10 text-teal-200',
    chipClass: 'inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-[12px] font-semibold text-emerald-300',
    riskColor: '#16A34A',
  },
  MIR: {
    label: 'MIR',
    accentClass: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    chipClass: 'inline-flex w-fit items-center rounded-full border border-violet-400/20 bg-violet-500/12 px-3 py-1 text-[12px] font-semibold text-violet-300',
    riskColor: '#2563EB',
  },
  DAS: {
    label: 'DAS',
    accentClass: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
    chipClass: 'inline-flex w-fit items-center rounded-full border border-orange-400/20 bg-orange-500/12 px-3 py-1 text-[12px] font-semibold text-orange-300',
    riskColor: '#D97706',
  },
  AGI: {
    label: 'AGI',
    accentClass: 'border-red-500/30 bg-red-500/10 text-red-200',
    chipClass: 'inline-flex w-fit items-center rounded-full border border-red-400/20 bg-red-500/12 px-3 py-1 text-[12px] font-semibold text-red-300',
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
    return 'inline-flex items-center rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/20'
  if (gate === 'AMBER')
    return 'inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20'
  return 'inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20'
}

export const ui = {
  panel:
    'rounded-[24px] border border-white/8 bg-[#0B1730] shadow-[0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28)]',
  panelSoft:
    'rounded-[24px] border border-white/8 bg-[#0D1A35]',
  panelInner:
    'rounded-[18px] border border-white/8 bg-[#0A1428]',
  sectionTitle:
    'text-[15px] md:text-[16px] font-semibold tracking-[-0.01em] text-white',
  label:
    'text-[12px] font-medium text-slate-400',
  value:
    'text-[15px] font-semibold text-slate-100',
  metric:
    'text-[34px] leading-none font-bold tracking-[-0.03em] text-white',
  chip:
    'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-semibold text-slate-300',
  chipActive:
    'inline-flex items-center rounded-full bg-[#2563EB] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,.28)]',
  badgeOk:
    'inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20',
  badgeWarn:
    'inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20',
  badgeRisk:
    'inline-flex items-center rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/20',
  badgeInfo:
    'inline-flex items-center rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-400/20',
  row:
    'rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-colors duration-150 hover:bg-white/[0.04]',
  progressTrack:
    'h-2.5 overflow-hidden rounded-full bg-white/10',
  progressFillBlue:
    'h-full rounded-full bg-[#3B82F6]',
  progressFillEmerald:
    'h-full rounded-full bg-emerald-500',
  progressFillAmber:
    'h-full rounded-full bg-amber-500',
  progressFillRed:
    'h-full rounded-full bg-red-500',
  hoverCard:
    'transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]',
} as const

export const uiTokens = ui
