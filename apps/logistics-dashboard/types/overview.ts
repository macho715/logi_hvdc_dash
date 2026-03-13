import type { Event, Location, LocationStatus, WorklistRow } from '@repo/shared'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import type { VoyageStage } from '@/types/cases'

export type OverviewRouteTypeId =
  | 'pre-arrival'
  | 'direct-to-site'
  | 'via-warehouse'
  | 'via-mosb'
  | 'via-warehouse-mosb'
  | 'review-required'

export type OverviewRouteAccent = 'slate' | 'sky' | 'amber' | 'orange' | 'rose' | 'zinc'

export type DashboardPage = 'pipeline' | 'sites' | 'cargo' | 'chain'
export type ChainFocus = 'origin' | 'port' | 'warehouse' | 'mosb' | 'site'
export type SitePageTab = 'summary' | 'pending' | 'vendor' | 'monthly' | 'route'

export interface OverviewRouteTypeConfig {
  id: OverviewRouteTypeId
  label: string
  description: string
  sortOrder: number
  flowCodes: number[]
  accent: OverviewRouteAccent
}

export interface OverviewDestinationConfig {
  id: string
  page: DashboardPage
  allowedParams: Array<
    | 'stage'
    | 'site'
    | 'vendor'
    | 'category'
    | 'route_type'
    | 'focus'
    | 'tab'
    | 'caseId'
    | 'voyage_stage'
  >
  defaults?: Record<string, string>
}

export interface PipelinePageQuery {
  stage?: PipelineStage
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  vendor?: 'Hitachi' | 'Siemens' | 'Other'
  category?: 'Elec' | 'Mech' | 'Inst.'
  route_type?: OverviewRouteTypeId
}

export interface SitesPageQuery {
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  tab?: SitePageTab
}

export interface CargoPageQuery {
  tab?: 'wh' | 'shipments' | 'stock'
  caseId?: string
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  vendor?: string
  voyage_stage?: VoyageStage
  route_type?: OverviewRouteTypeId
}

export interface ChainPageQuery {
  focus?: ChainFocus
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  route_type?: OverviewRouteTypeId
}

export type DashboardQueryMap = {
  pipeline: PipelinePageQuery
  sites: SitesPageQuery
  cargo: CargoPageQuery
  chain: ChainPageQuery
}

export type NavigationIntent =
  | { destinationId?: string; page: 'pipeline'; params?: PipelinePageQuery }
  | { destinationId?: string; page: 'sites'; params?: SitesPageQuery }
  | { destinationId?: string; page: 'cargo'; params?: CargoPageQuery }
  | { destinationId?: string; page: 'chain'; params?: ChainPageQuery }

export interface OverviewHeroMetric {
  id: string
  label: string
  value: string
  sublabel?: string
  tone?: 'neutral' | 'warning' | 'critical'
  navigationIntent?: NavigationIntent
}

export interface OverviewRouteSummaryItem {
  routeTypeId: OverviewRouteTypeId
  count: number
  percent: number
  navigationIntent: NavigationIntent
}

export interface OverviewPipelineItem {
  stage: PipelineStage
  count: number
  percent: number
  navigationIntent: NavigationIntent
}

export interface OverviewAlert {
  id: string
  alertTypeId: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  count: number
  navigationIntent: NavigationIntent
}

export interface OverviewSiteReadinessItem {
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  total: number
  arrived: number
  warehouse: number
  mosb: number
  preArrival: number
  readinessPercent: number
  navigationIntent: NavigationIntent
}

export interface OverviewWarehousePressureItem {
  location: string
  sqm: number
  cases: number
  navigationIntent: NavigationIntent
}

export interface OverviewLiveFeedItem {
  id: string
  title: string
  subtitle: string
  timestamp: string
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  routeTypeId?: OverviewRouteTypeId
  navigationIntent: NavigationIntent
}

export interface OverviewMapSnapshot {
  locations: Location[]
  statuses: LocationStatus[]
  events: Event[]
}

export interface OverviewCockpitResponse {
  schemaVersion: string
  generatedAt: string
  hero: {
    metrics: OverviewHeroMetric[]
    totalCases: number
    siteArrivedCount: number
    siteArrivedRate: number
    warehouseCases: number
    warehouseSqm: number
    mandatoryMosbMissingCount: number
    lastUpdatedAt: string
  }
  routeSummary: OverviewRouteSummaryItem[]
  pipeline: OverviewPipelineItem[]
  alerts: OverviewAlert[]
  siteReadiness: OverviewSiteReadinessItem[]
  warehousePressure: OverviewWarehousePressureItem[]
  liveFeed: OverviewLiveFeedItem[]
  worklist: {
    total: number
    highlightedIds: string[]
  }
  map: OverviewMapSnapshot
}

export interface OverviewRuntimeState {
  data: OverviewCockpitResponse | null
  loading: boolean
  error: string | null
  worklist: WorklistRow[]
}
