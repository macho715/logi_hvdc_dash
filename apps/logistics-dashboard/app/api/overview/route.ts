import { NextRequest, NextResponse } from 'next/server'
import type { DashboardPayload, Event, Location, LocationStatus, WorklistRow } from '@repo/shared'
import { PIPELINE_STAGES, PIPELINE_STAGE_META, type PipelineStage } from '@/lib/cases/pipelineStage'
import { buildCasesSummary, type CasesSummarySourceRow } from '@/lib/cases/summary'
import { buildMockLocationStatuses } from '@/lib/api'
import { ontologyLocations } from '@/lib/data/ontology-locations'
import { EVENTS_JOIN_SELECT, generateMockEvents, mapSupabaseEvents } from '@/lib/logistics/events'
import { OVERVIEW_ROUTE_TYPES, aggregateCountsByRouteType } from '@/lib/overview/routeTypes'
import { shipmentToWorklistRow, calculateKpis, getDubaiTimestamp, getDubaiToday, type ShipmentRow } from '@/lib/worklist-utils'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { CasesSummary } from '@/types/cases'
import type { OverviewAlert, OverviewCockpitResponse, OverviewLiveFeedItem, OverviewPipelineItem, OverviewRouteSummaryItem, OverviewSiteReadinessItem, OverviewWarehousePressureItem } from '@/types/overview'

type ShipmentStagesResponse = {
  agi_das_no_mosb_alert: number
  total: number
  delivered: number
}

const SCHEMA_VERSION = '2026-03-13'

/** Paginate any Supabase table */
async function fetchAllPages(table: string, cols: string): Promise<any[]> {
  const PAGE = 1000
  const all: any[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .range(offset, offset + PAGE - 1)
      .order('id')
    if (error) {
      console.warn(`[overview] fetchAllPages(${table}) error`, error)
      break
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all
}

function mapLocationType(type: string | null): Location['siteType'] {
  if (!type) return 'OTHER'
  const t = type.toLowerCase()
  if (t.includes('port')) return 'PORT'
  if (t.includes('warehouse') || t.includes('wh')) return 'MOSB_WH'
  if (t.includes('berth')) return 'BERTH'
  if (t.includes('site')) return 'SITE'
  return 'OTHER'
}

function mapStatusCode(status: string | null): LocationStatus['status_code'] {
  const s = (status ?? '').toUpperCase()
  if (s === 'WARNING' || s === 'WARN') return 'WARNING'
  if (s === 'CRITICAL' || s === 'CRIT') return 'CRITICAL'
  return 'OK'
}

function normalizeRate(value: number | string | null): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(n)) return 0
  return n > 1 ? n / 100 : n
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

export async function GET(_request: NextRequest) {
  try {
    const today = getDubaiToday()

    // ── 1. Parallel Supabase queries ────────────────────────────────────────
    const [casesResult, shipmentsResult, locationsResult, statusesResult, eventsResult] =
      await Promise.all([
        // v_cases: cases summary
        fetchAllPages(
          'v_cases',
          'site, flow_code, status_current, status_location, sqm, source_vendor, storage_type',
        ),
        // shipments: combined worklist + stages (ONE scan, not two)
        fetchAllPages(
          'shipments',
          'id, sct_ship_no, mr_number, commercial_invoice_no, invoice_date, vendor, main_description, port_of_loading, port_of_discharge, vessel_name, bl_awb_no, ship_mode, coe, etd, eta, atd, ata, do_collection_date, customs_start_date, customs_close_date, delivery_date, duty_amount_aed, vat_amount_aed, incoterms, flow_code, flow_code_original, flow_override_reason, final_location, doc_shu, doc_das, doc_mir, doc_agi',
        ),
        // locations
        supabase.from('locations').select('id, name, lat, lng, type').order('name'),
        // location_statuses
        supabase.from('location_statuses').select('location_id, status, occupancy_rate, updated_at').order('updated_at', { ascending: false }),
        // events
        supabase.from('events').select(EVENTS_JOIN_SELECT).order('ts', { ascending: false }).limit(1000),
      ])

    // ── 2. Build cases summary ──────────────────────────────────────────────
    const casesData = (casesResult ?? []) as CasesSummarySourceRow[]
    const summary = buildCasesSummary(casesData)

    // ── 3. Build worklist + stages from ONE shipments scan ──────────────────
    const shipmentsData = shipmentsResult ?? []
    const worklistRows = shipmentsData
      .map((s: any) => {
        try {
          return shipmentToWorklistRow(s as ShipmentRow, today)
        } catch {
          return null
        }
      })
      .filter((r: any): r is WorklistRow => r !== null)
    const kpis = calculateKpis(worklistRows, today)
    const worklist: DashboardPayload = { lastRefreshAt: getDubaiTimestamp(), kpis, rows: worklistRows }

    // Shipment stages from same data
    const shipmentStages: ShipmentStagesResponse = {
      agi_das_no_mosb_alert: shipmentsData.filter((r: any) =>
        (r.doc_agi || r.doc_das) && (r.flow_code == null || r.flow_code < 3),
      ).length,
      total: shipmentsData.length,
      delivered: shipmentsData.filter((r: any) => !!r.delivery_date).length,
    }

    // ── 4. Build locations ──────────────────────────────────────────────────
    const locData = locationsResult.data ?? []
    const locations: Location[] =
      locData.length > 0
        ? locData
            .filter((r: any) => typeof r.lat === 'number' && typeof r.lng === 'number')
            .map((r: any) => ({
              location_id: r.id,
              name: r.name,
              siteType: mapLocationType(r.type),
              lat: r.lat,
              lon: r.lng,
            }))
        : ontologyLocations
    if (locations.length === 0) ontologyLocations.forEach((l) => locations.push(l))

    // ── 5. Build location statuses ──────────────────────────────────────────
    const statusData = statusesResult.data ?? []
    const statuses: LocationStatus[] =
      statusData.length > 0
        ? statusData
            .filter((r: any) => typeof r.location_id === 'string' && r.location_id.length > 0)
            .map((r: any) => ({
              location_id: r.location_id,
              status_code: mapStatusCode(r.status),
              occupancy_rate: normalizeRate(r.occupancy_rate),
              last_updated: r.updated_at ?? new Date().toISOString(),
            }))
        : buildMockLocationStatuses(ontologyLocations)

    // ── 6. Build events ─────────────────────────────────────────────────────
    if (eventsResult.error) {
      console.warn('[overview] events query failed, using mock events', eventsResult.error)
    }
    const mappedEvents = mapSupabaseEvents(eventsResult.data ?? [])
    const events: Event[] =
      mappedEvents.length > 0
        ? mappedEvents
        : generateMockEvents()

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
