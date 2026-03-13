import { z } from 'zod'
import destinationSource from '../../../../configs/overview.destinations.json'
import { PIPELINE_STAGE_META, PIPELINE_STAGES, type PipelineStage } from '@/lib/cases/pipelineStage'
import {
  ROUTE_TYPE_FALLBACK_ID,
  getRouteTypeConfig,
  isOverviewRouteTypeId,
} from '@/lib/overview/routeTypes'
import type {
  CargoPageQuery,
  ChainFocus,
  ChainPageQuery,
  DashboardPage,
  NavigationIntent,
  OverviewDestinationConfig,
  OverviewRouteTypeId,
  PipelinePageQuery,
  SitePageTab,
  SitesPageQuery,
} from '@/types/overview'

const destinationSchema = z.object({
  version: z.string(),
  destinations: z.array(
    z.object({
      id: z.string(),
      page: z.enum(['pipeline', 'sites', 'cargo', 'chain']),
      allowedParams: z.array(
        z.enum([
          'stage',
          'site',
          'vendor',
          'category',
          'route_type',
          'focus',
          'tab',
          'caseId',
          'voyage_stage',
        ]),
      ),
      defaults: z.record(z.string(), z.string()).optional(),
    }),
  ),
})

const parsedDestinations = destinationSchema.parse(destinationSource)
const destinationMap = new Map(
  parsedDestinations.destinations.map((destination) => [destination.id, destination] as const),
)

const SITE_VALUES = ['SHU', 'MIR', 'DAS', 'AGI'] as const
const CASE_VENDOR_VALUES = ['Hitachi', 'Siemens', 'Other'] as const
const CASE_CATEGORY_VALUES = ['Elec', 'Mech', 'Inst.'] as const
const CARGO_TAB_VALUES = ['wh', 'shipments', 'stock'] as const
const SITE_TAB_VALUES = ['summary', 'pending', 'vendor', 'monthly', 'route'] as const
const CHAIN_FOCUS_VALUES = ['origin', 'port', 'warehouse', 'mosb', 'site'] as const
const VOYAGE_STAGE_VALUES = [
  'pre-departure',
  'in-transit',
  'port-customs',
  'inland',
  'delivered',
] as const

type SearchParamsLike = { get: (key: string) => string | null }
type QueryInput = URLSearchParams | SearchParamsLike | Record<string, string | string[] | undefined>

function hasGetter(input: QueryInput): input is SearchParamsLike {
  return typeof (input as SearchParamsLike).get === 'function'
}

function getValue(input: QueryInput, key: string): string | undefined {
  if (hasGetter(input)) {
    const value = input.get(key)
    return value ?? undefined
  }

  const value = input[key]
  return Array.isArray(value) ? value[0] : value
}

function isEnumValue<T extends readonly string[]>(value: string | undefined, values: T): value is T[number] {
  return value != null && values.includes(value as T[number])
}

function parseRouteType(raw: string | undefined): OverviewRouteTypeId | undefined {
  if (!raw) return undefined
  if (isOverviewRouteTypeId(raw)) return raw
  console.warn(`[navigation] Unknown route_type "${raw}", falling back to ${ROUTE_TYPE_FALLBACK_ID}`)
  return ROUTE_TYPE_FALLBACK_ID
}

function toQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value)
    }
  }
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export function getOverviewDestinationConfig(destinationId?: string | null): OverviewDestinationConfig | null {
  if (!destinationId) return null
  const config = destinationMap.get(destinationId)
  if (!config) {
    console.warn(`[navigation] Unknown destination "${destinationId}"`)
    return null
  }
  return config
}

export function parsePipelineQuery(input: QueryInput): PipelinePageQuery {
  const stage = getValue(input, 'stage')
  const site = getValue(input, 'site')
  const vendor = getValue(input, 'vendor')
  const category = getValue(input, 'category')
  const routeType = parseRouteType(getValue(input, 'route_type'))

  return {
    ...(stage && PIPELINE_STAGES.some((entry) => entry.key === stage) ? { stage: stage as PipelineStage } : {}),
    ...(isEnumValue(site, SITE_VALUES) ? { site } : {}),
    ...(isEnumValue(vendor, CASE_VENDOR_VALUES) ? { vendor } : {}),
    ...(isEnumValue(category, CASE_CATEGORY_VALUES) ? { category } : {}),
    ...(routeType ? { route_type: routeType } : {}),
  }
}

export function parseSitesQuery(input: QueryInput): SitesPageQuery {
  const site = getValue(input, 'site')
  const tab = getValue(input, 'tab')
  return {
    ...(isEnumValue(site, SITE_VALUES) ? { site } : {}),
    ...(isEnumValue(tab, SITE_TAB_VALUES) ? { tab: tab as SitePageTab } : {}),
  }
}

export function parseCargoQuery(input: QueryInput): CargoPageQuery {
  const tab = getValue(input, 'tab')
  const caseId = getValue(input, 'caseId')
  const site = getValue(input, 'site')
  const vendor = getValue(input, 'vendor')
  const voyageStage = getValue(input, 'voyage_stage')
  const routeType = parseRouteType(getValue(input, 'route_type'))

  return {
    ...(isEnumValue(tab, CARGO_TAB_VALUES) ? { tab } : {}),
    ...(caseId ? { caseId } : {}),
    ...(isEnumValue(site, SITE_VALUES) ? { site } : {}),
    ...(vendor ? { vendor } : {}),
    ...(isEnumValue(voyageStage, VOYAGE_STAGE_VALUES) ? { voyage_stage: voyageStage } : {}),
    ...(routeType ? { route_type: routeType } : {}),
  }
}

export function parseChainQuery(input: QueryInput): ChainPageQuery {
  const focus = getValue(input, 'focus')
  const site = getValue(input, 'site')
  const routeType = parseRouteType(getValue(input, 'route_type'))
  return {
    ...(isEnumValue(focus, CHAIN_FOCUS_VALUES) ? { focus: focus as ChainFocus } : {}),
    ...(isEnumValue(site, SITE_VALUES) ? { site } : {}),
    ...(routeType ? { route_type: routeType } : {}),
  }
}

export function serializePipelineQuery(query: PipelinePageQuery): Record<string, string | undefined> {
  return {
    stage: query.stage,
    site: query.site,
    vendor: query.vendor,
    category: query.category,
    route_type: query.route_type ? getRouteTypeConfig(query.route_type).id : undefined,
  }
}

export function serializeSitesQuery(query: SitesPageQuery): Record<string, string | undefined> {
  return {
    site: query.site,
    tab: query.tab,
  }
}

export function serializeCargoQuery(query: CargoPageQuery): Record<string, string | undefined> {
  return {
    tab: query.tab,
    caseId: query.caseId,
    site: query.site,
    vendor: query.vendor,
    voyage_stage: query.voyage_stage,
    route_type: query.route_type ? getRouteTypeConfig(query.route_type).id : undefined,
  }
}

export function serializeChainQuery(query: ChainPageQuery): Record<string, string | undefined> {
  return {
    focus: query.focus,
    site: query.site,
    route_type: query.route_type ? getRouteTypeConfig(query.route_type).id : undefined,
  }
}

function serializeByPage(intent: NavigationIntent): Record<string, string | undefined> {
  switch (intent.page) {
    case 'pipeline':
      return serializePipelineQuery(intent.params ?? {})
    case 'sites':
      return serializeSitesQuery(intent.params ?? {})
    case 'cargo':
      return serializeCargoQuery(intent.params ?? {})
    case 'chain':
      return serializeChainQuery(intent.params ?? {})
  }
}

function getAllowedParams(
  page: DashboardPage,
  destinationId?: string,
): { allowedParams: string[]; defaults: Record<string, string> } {
  const config = getOverviewDestinationConfig(destinationId)
  if (!config) {
    switch (page) {
      case 'pipeline':
        return { allowedParams: ['stage', 'site', 'vendor', 'category', 'route_type'], defaults: {} }
      case 'sites':
        return { allowedParams: ['site', 'tab'], defaults: {} }
      case 'cargo':
        return { allowedParams: ['tab', 'caseId', 'site', 'vendor', 'voyage_stage', 'route_type'], defaults: {} }
      case 'chain':
        return { allowedParams: ['focus', 'site', 'route_type'], defaults: {} }
    }
  }

  if (config.page !== page) {
    console.warn(`[navigation] Destination "${destinationId}" expected page "${config.page}" but received "${page}"`)
  }

  return {
    allowedParams: config.allowedParams,
    defaults: config.defaults ?? {},
  }
}

export function buildDashboardLink(intent: NavigationIntent): string {
  const basePath = `/${intent.page}`
  const serialized = serializeByPage(intent)
  const { allowedParams, defaults } = getAllowedParams(intent.page, intent.destinationId)
  const filtered = Object.entries(serialized).reduce<Record<string, string | undefined>>(
    (acc, [key, value]) => {
      if (!value) return acc
      if (allowedParams.length > 0 && !allowedParams.includes(key)) {
        console.warn(`[navigation] Param "${key}" is not allowed for destination "${intent.destinationId}"`)
        return acc
      }
      acc[key] = value
      return acc
    },
    { ...defaults },
  )

  return `${basePath}${toQueryString(filtered)}`
}

export function getPageContextChips(
  page: DashboardPage,
  query: PipelinePageQuery | SitesPageQuery | CargoPageQuery | ChainPageQuery,
): string[] {
  const chips: string[] = []

  if ('route_type' in query && query.route_type) {
    chips.push(getRouteTypeConfig(query.route_type).label)
  }
  if ('stage' in query && query.stage) {
    chips.push(`단계: ${PIPELINE_STAGE_META[query.stage].label}`)
  }
  if ('site' in query && query.site) {
    chips.push(`현장: ${query.site}`)
  }
  if ('focus' in query && query.focus) {
    const focusLabel = {
      origin: '원산지',
      port: '항만/통관',
      warehouse: '창고',
      mosb: 'MOSB',
      site: '현장',
    }[query.focus]
    chips.push(`포커스: ${focusLabel}`)
  }
  if ('voyage_stage' in query && query.voyage_stage) {
    const voyageLabel = {
      'pre-departure': '출항 전',
      'in-transit': '항해 중',
      'port-customs': '항만/통관',
      inland: '내륙/창고',
      delivered: '납품 완료',
    }[query.voyage_stage]
    chips.push(`항차: ${voyageLabel}`)
  }
  if ('vendor' in query && query.vendor) {
    chips.push(`벤더: ${query.vendor}`)
  }
  if ('category' in query && query.category) {
    chips.push(`카테고리: ${query.category}`)
  }
  if (page === 'cargo' && 'caseId' in query && query.caseId) {
    chips.push(`케이스: ${query.caseId}`)
  }

  return chips
}
