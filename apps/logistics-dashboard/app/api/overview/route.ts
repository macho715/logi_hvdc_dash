import { NextRequest, NextResponse } from 'next/server'
import type { DashboardPayload, Event, Location, LocationStatus, WorklistRow } from '@repo/shared'
import { PIPELINE_STAGES, type PipelineStage } from '@/lib/cases/pipelineStage'
import { buildMockLocationStatuses } from '@/lib/api'
import { ontologyLocations } from '@/lib/data/ontology-locations'
import { OVERVIEW_ROUTE_TYPES, aggregateCountsByRouteType } from '@/lib/overview/routeTypes'
import { getDubaiTimestamp } from '@/lib/worklist-utils'
import type { CasesSummary } from '@/types/cases'
import type { OverviewAlert, OverviewCockpitResponse, OverviewLiveFeedItem, OverviewPipelineItem, OverviewRouteSummaryItem, OverviewSiteReadinessItem, OverviewWarehousePressureItem } from '@/types/overview'

type ShipmentStagesResponse = {
  agi_das_no_mosb_alert: number
  total: number
  delivered: number
}

const SCHEMA_VERSION = '2026-03-13'

const EMPTY_SUMMARY: CasesSummary = {
  total: 0,
  byStatus: { site: 0, warehouse: 0, 'Pre Arrival': 0, port: 0, mosb: 0 },
  bySite: { SHU: 0, MIR: 0, DAS: 0, AGI: 0, Unassigned: 0 },
  bySiteArrived: { SHU: 0, MIR: 0, DAS: 0, AGI: 0 },
  bySiteStorageType: {},
  byRouteType: OVERVIEW_ROUTE_TYPES.reduce((acc, routeType) => {
    acc[routeType.id] = 0
    return acc
  }, {} as CasesSummary['byRouteType']),
  byFlowCode: {},
  byVendor: {},
  bySqmByLocation: {},
  totalSqm: 0,
}

const EMPTY_WORKLIST: DashboardPayload = {
  lastRefreshAt: getDubaiTimestamp(),
  kpis: {
    driAvg: 0,
    wsiAvg: 0,
    redCount: 0,
    overdueCount: 0,
    recoverableAED: 0,
    zeroStops: 0,
  },
  rows: [],
}

function getBaseUrl(request: NextRequest): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

async function fetchJson<T>(request: NextRequest, path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${getBaseUrl(request)}${path}`, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    if (!response.ok) {
      console.warn(`[api/overview] Failed to fetch ${path}: ${response.status}`)
      return fallback
    }
    return (await response.json()) as T
  } catch (error) {
    console.warn(`[api/overview] Failed to fetch ${path}`, error)
    return fallback
  }
}

function getFreshnessMinutes(statuses: LocationStatus[], events: Event[]): number {
  const timestamps = [
    ...statuses.map((status) => status.last_updated),
    ...events.map((event) => event.ts),
  ]
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))

  if (timestamps.length === 0) return 0

  const latestTimestamp = Math.max(...timestamps)
  return Math.max(0, Math.round((Date.now() - latestTimestamp) / 60000))
}

function sortWorklistByPriority(rows: WorklistRow[]): WorklistRow[] {
  const gateWeight = {
    ZERO: 0,
    RED: 1,
    AMBER: 2,
    GREEN: 3,
  } as const

  return [...rows].sort((left, right) => {
    const gateDelta = gateWeight[left.gate] - gateWeight[right.gate]
    if (gateDelta !== 0) return gateDelta
    const leftDue = left.dueAt ?? '9999-12-31'
    const rightDue = right.dueAt ?? '9999-12-31'
    return leftDue.localeCompare(rightDue)
  })
}

function toPercent(count: number, total: number): number {
  if (total <= 0) return 0
  return Number(((count / total) * 100).toFixed(1))
}

function buildPipeline(summary: CasesSummary): OverviewPipelineItem[] {
  return PIPELINE_STAGES.map((stageMeta) => {
    const count = summary.byStatus[stageMeta.summaryKey] ?? 0
    return {
      stage: stageMeta.key,
      count,
      percent: toPercent(count, summary.total),
      navigationIntent: {
        destinationId: 'pipeline-stage',
        page: 'pipeline',
        params: { stage: stageMeta.key },
      },
    }
  })
}

function buildRouteSummary(summary: CasesSummary): OverviewRouteSummaryItem[] {
  const routeCounts = Object.keys(summary.byRouteType).length > 0
    ? summary.byRouteType
    : aggregateCountsByRouteType(summary.byFlowCode)

  return OVERVIEW_ROUTE_TYPES.map((routeType) => ({
    routeTypeId: routeType.id,
    count: routeCounts[routeType.id] ?? 0,
    percent: toPercent(routeCounts[routeType.id] ?? 0, summary.total),
    navigationIntent: {
      destinationId: 'route-summary',
      page: 'chain',
      params: {
        focus: routeType.id === 'pre-arrival'
          ? 'origin'
          : routeType.id === 'direct-to-site'
          ? 'site'
          : routeType.id === 'via-mosb' || routeType.id === 'via-warehouse-mosb'
          ? 'mosb'
          : routeType.id === 'via-warehouse'
          ? 'warehouse'
          : 'port',
        route_type: routeType.id,
      },
    },
  }))
}

function buildSiteReadiness(summary: CasesSummary): OverviewSiteReadinessItem[] {
  const sites = ['SHU', 'MIR', 'DAS', 'AGI'] as const
  return sites.map((site) => {
    const total = summary.bySite[site] ?? 0
    const arrived = summary.bySiteArrived[site] ?? 0
    return {
      site,
      total,
      arrived,
      warehouse: 0,
      mosb: 0,
      preArrival: Math.max(0, total - arrived),
      readinessPercent: toPercent(arrived, total),
      navigationIntent: {
        destinationId: 'site-readiness',
        page: 'sites',
        params: { site, tab: 'summary' },
      },
    }
  })
}

function buildWarehousePressure(summary: CasesSummary): OverviewWarehousePressureItem[] {
  return Object.entries(summary.bySqmByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, sqm]) => ({
      location,
      sqm: Math.round(sqm),
      cases: 0,
      navigationIntent: {
        destinationId: 'hero-warehouse-pressure',
        page: 'pipeline',
        params: { stage: 'warehouse' },
      },
    }))
}

function buildLiveFeed(events: Event[]): OverviewLiveFeedItem[] {
  return [...events]
    .sort((left, right) => new Date(right.ts).getTime() - new Date(left.ts).getTime())
    .slice(0, 6)
    .map((event) => ({
      id: event.event_id,
      title: event.event_type ?? event.status,
      subtitle: [event.location_id, event.shpt_no].filter(Boolean).join(' · '),
      timestamp: event.ts,
      site: undefined,
      routeTypeId: undefined,
      navigationIntent: {
        destinationId: 'live-feed-item',
        page: 'cargo',
        params: { tab: 'shipments' },
      },
    }))
}

function buildAlerts(
  shipmentStages: ShipmentStagesResponse,
  siteReadiness: OverviewSiteReadinessItem[],
  freshnessMinutes: number,
  warehousePressure: OverviewWarehousePressureItem[],
): OverviewAlert[] {
  const alerts: OverviewAlert[] = []

  if (shipmentStages.agi_das_no_mosb_alert > 0) {
    alerts.push({
      id: 'mandatory-mosb-missing',
      alertTypeId: 'mandatory-mosb-missing',
      severity: 'critical',
      title: '필수 MOSB 경유 누락',
      description: 'DAS/AGI 대상 운송 중 MOSB 경유가 필요한 건이 확인되었습니다.',
      count: shipmentStages.agi_das_no_mosb_alert,
      navigationIntent: {
        destinationId: 'alert-mosb',
        page: 'chain',
        params: { focus: 'mosb' },
      },
    })
  }

  const agiReadiness = siteReadiness.find((item) => item.site === 'AGI')
  if (agiReadiness && agiReadiness.total > 0 && agiReadiness.readinessPercent < 80) {
    alerts.push({
      id: 'agi-readiness-low',
      alertTypeId: 'agi-readiness-low',
      severity: agiReadiness.readinessPercent < 50 ? 'critical' : 'warning',
      title: 'AGI 납품률 저조',
      description: 'AGI 현장 도착률이 목표 수준보다 낮습니다.',
      count: agiReadiness.arrived,
      navigationIntent: {
        destinationId: 'alert-site',
        page: 'sites',
        params: { site: 'AGI', tab: 'summary' },
      },
    })
  }

  if (freshnessMinutes > 60) {
    alerts.push({
      id: 'data-stale',
      alertTypeId: 'data-stale',
      severity: freshnessMinutes > 180 ? 'critical' : 'warning',
      title: '데이터 갱신 지연',
      description: `최근 운영 데이터 갱신이 ${freshnessMinutes}분 지연되었습니다.`,
      count: freshnessMinutes,
      navigationIntent: {
        destinationId: 'hero-freshness',
        page: 'cargo',
        params: { tab: 'shipments' },
      },
    })
  }

  const topWarehouse = warehousePressure[0]
  if (topWarehouse) {
    alerts.push({
      id: 'warehouse-pressure',
      alertTypeId: 'warehouse-pressure',
      severity: topWarehouse.sqm > 0 ? 'warning' : 'info',
      title: '창고 적체 상위 구역',
      description: `${topWarehouse.location} 구역에 창고 재고가 집중되어 있습니다.`,
      count: topWarehouse.cases,
      navigationIntent: topWarehouse.navigationIntent,
    })
  }

  return alerts
}

export async function GET(request: NextRequest) {
  try {
    const [summary, worklist, locations, statuses, events, shipmentStages] = await Promise.all([
      fetchJson<CasesSummary>(request, '/api/cases/summary', EMPTY_SUMMARY),
      fetchJson<DashboardPayload>(request, '/api/worklist', EMPTY_WORKLIST),
      fetchJson<Location[]>(request, '/api/locations', ontologyLocations),
      fetchJson<LocationStatus[]>(request, '/api/location-status', buildMockLocationStatuses(ontologyLocations)),
      fetchJson<Event[]>(request, '/api/events', []),
      fetchJson<ShipmentStagesResponse>(request, '/api/shipments/stages', { agi_das_no_mosb_alert: 0, total: 0, delivered: 0 }),
    ])

    const pipeline = buildPipeline(summary)
    const routeSummary = buildRouteSummary(summary)
    const siteReadiness = buildSiteReadiness(summary)
    const agiReadiness = siteReadiness.find((item) => item.site === 'AGI')
    const warehousePressure = buildWarehousePressure(summary)
    const freshnessMinutes = getFreshnessMinutes(statuses, events)
    const alerts = buildAlerts(shipmentStages, siteReadiness, freshnessMinutes, warehousePressure)
    const liveFeed = buildLiveFeed(events)
    const prioritizedWorklist = sortWorklistByPriority(worklist.rows)
    const warehouseSqm = Object.values(summary.bySqmByLocation).reduce((sum, sqm) => sum + sqm, 0)

    const openAnomalyCount = Math.max(0, summary.total - (summary.byStatus.site ?? 0))
    const agiRiskPercent = agiReadiness?.readinessPercent ?? 0

    const payload: OverviewCockpitResponse = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: getDubaiTimestamp(),
      hero: {
        metrics: [
          {
            id: 'total-shipments',
            label: 'Total Shipments',
            value: shipmentStages.total.toLocaleString(),
            navigationIntent: {
              destinationId: 'hero-total-shipments',
              page: 'cargo',
              params: { tab: 'shipments' },
            },
          },
          {
            id: 'final-delivered',
            label: 'Final Delivered',
            value: shipmentStages.delivered.toLocaleString(),
            navigationIntent: {
              destinationId: 'hero-final-delivered',
              page: 'pipeline',
              params: { stage: 'site' },
            },
          },
          {
            id: 'open-anomaly',
            label: 'Open / Anomaly',
            value: openAnomalyCount.toLocaleString(),
            tone: openAnomalyCount > 0 ? 'warning' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-open-anomaly',
              page: 'pipeline',
              params: {},
            },
          },
          {
            id: 'overdue-eta',
            label: 'Overdue ETA',
            value: worklist.kpis.overdueCount.toLocaleString(),
            tone: worklist.kpis.overdueCount > 0 ? 'critical' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-overdue-eta',
              page: 'cargo',
              params: { tab: 'shipments' },
            },
          },
          {
            id: 'critical-pod',
            label: 'Critical POD',
            value: shipmentStages.agi_das_no_mosb_alert.toLocaleString(),
            tone: shipmentStages.agi_das_no_mosb_alert > 0 ? 'warning' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-mandatory-mosb-missing',
              page: 'chain',
              params: { focus: 'mosb' },
            },
          },
          {
            id: 'critical-mode',
            label: 'Critical Mode',
            value: worklist.kpis.redCount.toLocaleString(),
            tone: worklist.kpis.redCount > 0 ? 'warning' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-critical-mode',
              page: 'pipeline',
              params: {},
            },
          },
          {
            id: 'agi-risk',
            label: 'AGI Risk',
            value: `${agiRiskPercent.toFixed(1)}%`,
            tone: agiRiskPercent < 50 ? 'critical' : agiRiskPercent < 80 ? 'warning' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-agi-risk',
              page: 'sites',
              params: { site: 'AGI', tab: 'summary' },
            },
          },
          {
            id: 'data-freshness',
            label: 'Data Freshness',
            value: freshnessMinutes > 0 ? `${freshnessMinutes}분` : '정상',
            sublabel: worklist.lastRefreshAt,
            tone: freshnessMinutes > 60 ? 'warning' : 'neutral',
            navigationIntent: {
              destinationId: 'hero-freshness',
              page: 'cargo',
              params: { tab: 'shipments' },
            },
          },
        ],
        totalCases: summary.total,
        siteArrivedCount: summary.byStatus.site,
        siteArrivedRate: toPercent(summary.byStatus.site, summary.total),
        warehouseCases: summary.byStatus.warehouse,
        warehouseSqm,
        mandatoryMosbMissingCount: shipmentStages.agi_das_no_mosb_alert,
        openAnomalyCount,
        overdueEtaCount: worklist.kpis.overdueCount,
        dataFreshnessMinutes: freshnessMinutes,
        agiRiskPercent,
        criticalPodValueAed: 0,
        criticalModeLabel: 'SEA',
        lastUpdatedAt: worklist.lastRefreshAt,
      },
      routeSummary,
      pipeline,
      alerts,
      siteReadiness,
      warehousePressure,
      liveFeed,
      worklist: {
        total: worklist.rows.length,
        highlightedIds: prioritizedWorklist.slice(0, 5).map((row) => row.id),
      },
      map: {
        locations,
        statuses,
        events,
      },
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('GET /api/overview error:', error)
    return NextResponse.json({
      schemaVersion: SCHEMA_VERSION,
      generatedAt: getDubaiTimestamp(),
      hero: {
        metrics: [],
        totalCases: 0,
        siteArrivedCount: 0,
        siteArrivedRate: 0,
        warehouseCases: 0,
        warehouseSqm: 0,
        mandatoryMosbMissingCount: 0,
        openAnomalyCount: 0,
        overdueEtaCount: 0,
        dataFreshnessMinutes: 0,
        agiRiskPercent: 0,
        criticalPodValueAed: 0,
        criticalModeLabel: 'SEA',
        lastUpdatedAt: getDubaiTimestamp(),
      },
      routeSummary: [],
      pipeline: [],
      alerts: [],
      siteReadiness: [],
      warehousePressure: [],
      liveFeed: [],
      worklist: { total: 0, highlightedIds: [] },
      map: { locations: ontologyLocations, statuses: buildMockLocationStatuses(ontologyLocations), events: [] },
    } satisfies OverviewCockpitResponse)
  }
}
