import type { OverviewRouteTypeId } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'
import type { VoyageStage } from '@/types/cases'

const siteChipBase =
  'inline-flex w-fit items-center rounded-full border px-3 py-1 text-[12px] font-semibold'

const badgeBase =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1'

export const chartColors = {
  axis: 'var(--color-hvdc-text-secondary)',
  muted: 'var(--color-hvdc-text-muted)',
  brand: 'var(--color-hvdc-brand)',
  brandHi: 'var(--color-hvdc-brand-hi)',
  brandLow: 'var(--color-hvdc-brand-low)',
  info: 'var(--color-hvdc-status-info)',
  ok: 'var(--color-hvdc-status-ok)',
  warn: 'var(--color-hvdc-status-warn)',
  risk: 'var(--color-hvdc-status-risk)',
  siteShu: 'var(--color-hvdc-site-shu)',
  siteMir: 'var(--color-hvdc-site-mir)',
  siteDas: 'var(--color-hvdc-site-das)',
  siteAgi: 'var(--color-hvdc-site-agi)',
  route: {
    'pre-arrival': 'var(--color-hvdc-text-muted)',
    'direct-to-site': 'var(--color-hvdc-status-info)',
    'via-warehouse': 'var(--color-hvdc-site-das)',
    'via-mosb': 'var(--color-hvdc-status-warn)',
    'via-warehouse-mosb': 'var(--color-hvdc-site-agi)',
    'review-required': 'var(--color-hvdc-text-secondary)',
  } satisfies Record<OverviewRouteTypeId, string>,
  vendorPalette: [
    'var(--color-hvdc-brand)',
    'var(--color-hvdc-site-shu)',
    'var(--color-hvdc-site-mir)',
  ] as const,
} as const

export const SITE_META = {
  SHU: {
    label: 'SHU',
    accentClass: 'text-hvdc-site-shu',
    chipClass: `${siteChipBase} border-hvdc-site-shu/20 bg-hvdc-site-shu/12 text-hvdc-site-shu`,
    riskColor: chartColors.siteShu,
  },
  MIR: {
    label: 'MIR',
    accentClass: 'text-hvdc-site-mir',
    chipClass: `${siteChipBase} border-hvdc-site-mir/20 bg-hvdc-site-mir/12 text-hvdc-site-mir`,
    riskColor: chartColors.siteMir,
  },
  DAS: {
    label: 'DAS',
    accentClass: 'text-hvdc-site-das',
    chipClass: `${siteChipBase} border-hvdc-site-das/20 bg-hvdc-site-das/18 text-hvdc-site-das`,
    riskColor: chartColors.siteDas,
  },
  AGI: {
    label: 'AGI',
    accentClass: 'text-hvdc-site-agi',
    chipClass: `${siteChipBase} border-hvdc-site-agi/20 bg-hvdc-site-agi/16 text-hvdc-site-agi`,
    riskColor: chartColors.siteAgi,
  },
} as const

export function getRouteTypeBadgeClass(routeTypeId?: OverviewRouteTypeId): string {
  switch (routeTypeId) {
    case 'pre-arrival':
      return 'border-hvdc-text-muted/30 bg-hvdc-text-muted/10 text-hvdc-text-secondary'
    case 'direct-to-site':
      return 'border-hvdc-status-info/30 bg-hvdc-status-info/10 text-hvdc-status-info'
    case 'via-warehouse':
      return 'border-hvdc-site-das/30 bg-hvdc-site-das/10 text-hvdc-site-das'
    case 'via-mosb':
      return 'border-hvdc-status-warn/30 bg-hvdc-status-warn/10 text-hvdc-status-warn'
    case 'via-warehouse-mosb':
      return 'border-hvdc-site-agi/30 bg-hvdc-site-agi/10 text-hvdc-site-agi'
    default:
      return 'border-hvdc-border-strong bg-hvdc-surface-subtle text-hvdc-text-secondary'
  }
}

export function gateClass(gate: WorklistRow['gate']): string {
  if (gate === 'ZERO' || gate === 'RED') return 'text-hvdc-status-risk'
  if (gate === 'AMBER') return 'text-hvdc-status-warn'
  return 'text-hvdc-status-ok'
}

export function gateClassLight(gate: WorklistRow['gate']): string {
  if (gate === 'ZERO' || gate === 'RED') {
    return `${badgeBase} bg-hvdc-status-risk/10 text-hvdc-status-risk ring-hvdc-status-risk/18`
  }
  if (gate === 'AMBER') {
    return `${badgeBase} bg-hvdc-status-warn/12 text-hvdc-status-warn ring-hvdc-status-warn/20`
  }
  return `${badgeBase} bg-hvdc-status-ok/12 text-hvdc-status-ok ring-hvdc-status-ok/20`
}

export function readinessBadgeClass(readinessPercent: number): string {
  if (readinessPercent < 50) return `${badgeBase} bg-hvdc-status-risk/12 text-hvdc-status-risk ring-hvdc-status-risk/20`
  if (readinessPercent < 80) return `${badgeBase} bg-hvdc-status-warn/12 text-hvdc-status-warn ring-hvdc-status-warn/20`
  return `${badgeBase} bg-hvdc-status-ok/12 text-hvdc-status-ok ring-hvdc-status-ok/20`
}

export function severitySurfaceClass(severity: 'critical' | 'warning' | 'info'): string {
  if (severity === 'critical') return 'border-l-hvdc-status-risk bg-hvdc-status-risk/10'
  if (severity === 'warning') return 'border-l-hvdc-status-warn bg-hvdc-status-warn/10'
  return 'border-l-hvdc-status-info bg-hvdc-status-info/10'
}

export function pressureFillClass(ratio: number): string {
  if (ratio > 0.8) return ui.progressFillRed
  if (ratio > 0.5) return ui.progressFillAmber
  return ui.progressFillEmerald
}

export function voyageStageBadgeClass(stage?: VoyageStage | null): string {
  switch (stage) {
    case 'pre-departure':
      return 'bg-hvdc-surface-subtle text-hvdc-text-secondary ring-hvdc-border-soft/60'
    case 'in-transit':
      return 'bg-hvdc-status-info/12 text-hvdc-status-info ring-hvdc-status-info/20'
    case 'port-customs':
      return 'bg-hvdc-status-warn/12 text-hvdc-status-warn ring-hvdc-status-warn/20'
    case 'inland':
      return 'bg-hvdc-site-das/12 text-hvdc-site-das ring-hvdc-site-das/20'
    case 'delivered':
      return 'bg-hvdc-status-ok/12 text-hvdc-status-ok ring-hvdc-status-ok/20'
    default:
      return 'bg-hvdc-surface-subtle text-hvdc-text-muted ring-hvdc-border-soft/60'
  }
}

export function customsStatusClass(status?: string | null): string {
  if (status === 'cleared') return 'text-hvdc-status-ok'
  if (status === 'in_progress') return 'text-hvdc-status-warn'
  return 'text-hvdc-text-muted'
}

export function siteKindBadgeClass(kind: 'land' | 'island' | 'unknown'): string {
  if (kind === 'land') return 'border-hvdc-site-shu/30 bg-hvdc-site-shu/10 text-hvdc-site-shu'
  if (kind === 'island') return 'border-hvdc-status-info/30 bg-hvdc-status-info/10 text-hvdc-status-info'
  return 'border-hvdc-border-soft bg-hvdc-surface-subtle text-hvdc-text-muted'
}

export function caseStatusDotClass(status?: string | null): string {
  if (status === 'site') return 'text-hvdc-status-ok'
  if (status === 'warehouse') return 'text-hvdc-status-warn'
  return 'text-hvdc-text-secondary'
}

export const ui = {
  pageShell: 'bg-hvdc-bg-page text-hvdc-text-primary',
  topbar: 'border-b border-hvdc-border-soft bg-hvdc-bg-topbar/90 backdrop-blur-md',
  pageContent: 'p-4',
  pageStack: 'space-y-4',
  panel: 'rounded-hvdc-panel border border-hvdc-border-soft bg-hvdc-bg-panel shadow-hvdc-panel',
  panelSoft: 'rounded-hvdc-panel border border-hvdc-border-soft bg-hvdc-bg-soft shadow-hvdc-card',
  panelInner: 'rounded-hvdc-card border border-hvdc-border-soft bg-hvdc-bg-inner shadow-hvdc-card',
  contextBanner: 'rounded-2xl border border-hvdc-border-soft bg-hvdc-bg-soft/80 px-4 py-3',
  sectionTitle: 'text-[15px] md:text-[16px] font-semibold tracking-[-0.01em] text-hvdc-text-primary',
  label: 'text-[12px] font-medium text-hvdc-text-secondary',
  value: 'text-[15px] font-semibold text-hvdc-text-primary',
  metric: 'text-[34px] leading-none font-bold tracking-[-0.03em] text-hvdc-text-primary',
  metricSm: 'text-[16px] font-semibold text-hvdc-text-primary',
  chip:
    'inline-flex items-center rounded-full border border-hvdc-border-soft bg-hvdc-surface-subtle px-3 py-1 text-[12px] font-semibold text-hvdc-text-secondary',
  chipActive:
    'inline-flex items-center rounded-full bg-hvdc-brand px-3 py-1 text-[12px] font-semibold text-white shadow-hvdc-active',
  badgeOk: `${badgeBase} bg-hvdc-status-ok/12 text-hvdc-status-ok ring-hvdc-status-ok/20`,
  badgeWarn: `${badgeBase} bg-hvdc-status-warn/12 text-hvdc-status-warn ring-hvdc-status-warn/20`,
  badgeRisk: `${badgeBase} bg-hvdc-status-risk/10 text-hvdc-status-risk ring-hvdc-status-risk/18`,
  badgeInfo: `${badgeBase} bg-hvdc-status-info/12 text-hvdc-status-info ring-hvdc-status-info/20`,
  row:
    'rounded-xl border border-hvdc-border-soft bg-hvdc-surface-subtle px-4 py-3 transition-colors duration-150 hover:bg-hvdc-surface-hover',
  rowSelected:
    'rounded-xl border border-hvdc-brand/40 bg-hvdc-surface-selected ring-1 ring-hvdc-brand/20',
  tableHead: 'text-[12px] font-semibold text-hvdc-text-secondary',
  tableCell: 'text-[13px] font-medium text-hvdc-text-primary',
  progressTrack: 'h-2.5 overflow-hidden rounded-full bg-white/10',
  progressFillBlue: 'h-full rounded-full bg-hvdc-brand-hi',
  progressFillEmerald: 'h-full rounded-full bg-hvdc-status-ok',
  progressFillAmber: 'h-full rounded-full bg-hvdc-status-warn',
  progressFillRed: 'h-full rounded-full bg-hvdc-status-danger',
  hoverCard:
    'transition-all duration-150 hover:-translate-y-[1px] hover:shadow-hvdc-card',
  filterBar: 'border border-hvdc-border-soft bg-hvdc-bg-soft',
  textHint: 'text-[12px] text-hvdc-text-muted',
  emptyState: 'py-8 text-center text-sm text-hvdc-text-muted',
  input:
    'w-full rounded-lg border border-hvdc-border-soft bg-hvdc-bg-inner px-3 py-1.5 text-sm text-hvdc-text-primary placeholder-hvdc-text-muted focus:border-hvdc-brand focus:outline-none',
  select:
    'rounded-lg border border-hvdc-border-soft bg-hvdc-bg-inner px-3 py-1.5 text-sm text-hvdc-text-primary focus:border-hvdc-brand focus:outline-none',
} as const

export const uiTokens = ui
