export type PipelineStage = 'pre-arrival' | 'port' | 'warehouse' | 'mosb' | 'site'

export type PipelineStatusKey = 'Pre Arrival' | 'port' | 'warehouse' | 'mosb' | 'site'

export const SITE_LOCATIONS = ['SHU', 'MIR', 'DAS', 'AGI'] as const
export const MOSB_LOCATIONS = ['MOSB', 'ADNOC L&S Yard'] as const
export const WH_LOCATIONS = [
  'DSV Indoor',
  'DSV Outdoor',
  'DSV Al Markaz',
  'JDN MZD',
  'AAA Storage',
  'Hauler DG',
  'ZENER',
  'Hauler Indoor',
  'DSV MZP',
] as const
export const PORT_LOCATIONS = ['Khalifa Port', 'Mina Zayed', 'Jebel Ali', 'AUH Airport'] as const

const SITE_LOCATION_SET = new Set<string>(SITE_LOCATIONS)
const MOSB_LOCATION_SET = new Set<string>(MOSB_LOCATIONS)
const WH_LOCATION_SET = new Set<string>(WH_LOCATIONS)
const PORT_LOCATION_SET = new Set<string>(PORT_LOCATIONS)

export const PIPELINE_STAGE_META: Record<
  PipelineStage,
  {
    key: PipelineStage
    label: string
    sublabel: string
    summaryKey: PipelineStatusKey
    textClass: string
    activeClass: string
  }
> = {
  'pre-arrival': {
    key: 'pre-arrival',
    label: '선적 전',
    sublabel: '원산지/해상 운송 중',
    summaryKey: 'Pre Arrival',
    textClass: 'text-slate-300',
    activeClass: 'bg-slate-600',
  },
  port: {
    key: 'port',
    label: '항구/통관',
    sublabel: 'Khalifa·MZD·JAFZ·AUH',
    summaryKey: 'port',
    textClass: 'text-sky-300',
    activeClass: 'bg-sky-600',
  },
  warehouse: {
    key: 'warehouse',
    label: '창고',
    sublabel: 'DSV·JDN·AAA·ZENER',
    summaryKey: 'warehouse',
    textClass: 'text-amber-300',
    activeClass: 'bg-amber-600',
  },
  mosb: {
    key: 'mosb',
    label: 'MOSB',
    sublabel: 'DAS·AGI 경유 필수',
    summaryKey: 'mosb',
    textClass: 'text-orange-300',
    activeClass: 'bg-orange-600',
  },
  site: {
    key: 'site',
    label: '현장 도착',
    sublabel: 'SHU·MIR / DAS·AGI',
    summaryKey: 'site',
    textClass: 'text-emerald-300',
    activeClass: 'bg-emerald-600',
  },
} as const

export const PIPELINE_STAGES = Object.values(PIPELINE_STAGE_META)

export function classifyStage(
  statusCurrent: string | null | undefined,
  statusLocation: string | null | undefined,
): PipelineStage {
  const loc = statusLocation?.trim() ?? ''
  const st = statusCurrent?.trim() ?? ''

  if (SITE_LOCATION_SET.has(loc) || st === 'site') return 'site'
  if (MOSB_LOCATION_SET.has(loc)) return 'mosb'
  if (WH_LOCATION_SET.has(loc) || st === 'warehouse') return 'warehouse'
  if (PORT_LOCATION_SET.has(loc)) return 'port'
  return 'pre-arrival'
}
