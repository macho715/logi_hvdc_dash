/**
 * artboardData.ts
 *
 * Artboard-specific data types and mapping functions that transform
 * OverviewCockpitResponse into strongly-typed display shapes consumed
 * by the Mission Control artboard / dashboard canvas components.
 *
 * Field mapping notes are documented on each mapper.
 *
 * No hardcoded metric values — all numbers flow from the API payload.
 */

import type {
  OverviewCockpitResponse,
  OverviewAlert,
  OverviewLiveFeedItem,
  OverviewRouteSummaryItem,
} from '@/types/overview'

// ─── Artboard-specific display types ──────────────────────────────────────────

/**
 * A single KPI card for the top strip.
 * Maps to hero.metrics[] or hero.* scalar fields.
 */
export interface KpiCardData {
  /** Unique machine id (matches hero.metrics[n].id when applicable) */
  id: string
  /** Short uppercase display label, e.g. "TOTAL SHIPMENTS" */
  label: string
  /** Formatted string value ready for display, e.g. "8,680" or "—" */
  value: string
  /** Optional secondary label below the value */
  sublabel?: string
  /** Semantic tone drives colour treatment in the artboard card */
  tone: 'neutral' | 'warning' | 'critical'
  /** CSS hex accent used for the card's border/glow, kept at the type level
   *  so artboard themes can override per-card */
  accentHex?: string
}

/**
 * A site card representing one delivery destination (SHU / MIR / DAS).
 * Maps to siteReadiness[] where site === the site key.
 */
export interface SiteCardData {
  /** Site code */
  site: 'SHU' | 'MIR' | 'DAS'
  /** Hex accent colour for the card (design-spec fixed per site) */
  accentHex: string
  /** Total shipment cases assigned to this site — siteReadiness[n].total */
  total: number
  /** Cases that have physically arrived at the site — siteReadiness[n].arrived */
  arrived: number
  /** Readiness percentage 0–100 — siteReadiness[n].readinessPercent */
  readinessPercent: number
  /** Pre-arrival backlog — siteReadiness[n].preArrival */
  preArrival: number
  /** Formatted readiness string, e.g. "74.3%" */
  readinessLabel: string
}

/**
 * AGI-specific panel data (separate from the three main site cards because it
 * carries a risk percentage and a distinct design treatment).
 */
export interface AgiPanelData {
  /** Hex accent for the AGI panel (design-spec) */
  accentHex: string
  /** Readiness percentage 0–100 — siteReadiness where site==="AGI".readinessPercent */
  readinessPercent: number
  /** Total cases assigned to AGI */
  total: number
  /** Cases arrived at AGI */
  arrived: number
  /** Risk percentage alias (= 100 − readinessPercent) used by artboard gauges */
  riskPercent: number
  /** hero.agiRiskPercent — the pre-computed risk signal from the hero block */
  heroAgiRiskPercent: number
  /** Formatted readiness string */
  readinessLabel: string
  /** Semantic tone derived from readinessPercent thresholds */
  tone: 'neutral' | 'warning' | 'critical'
}

/**
 * One block inside the Mission Control right-panel.
 * Each block has a title, badge count, and a list of rows.
 */
export interface MissionBlockRow {
  id: string
  accent: string
  /** Primary text (alert title, route label, feed event title) */
  primary: string
  /** Secondary / sub-text (alert description, percent, relative time) */
  secondary?: string
  /** Whether this row has a locked/restricted action indicator */
  locked?: boolean
}

export interface MissionBlock {
  /** Block title shown in PanelHeader */
  title: string
  /** Badge count next to the title */
  count: number
  /** Badge / header accent hex */
  badgeHex: string
  /** Optional subtext on the right side of the header */
  subtext?: string
  /** Ordered rows to render inside this block */
  rows: MissionBlockRow[]
}

/**
 * A flow statistic entry derived from routeSummary[].
 */
export interface FlowStat {
  /** Route type id — routeSummary[n].routeTypeId */
  routeTypeId: string
  /** Human-readable label (derived from routeTypeId) */
  label: string
  /** Raw count — routeSummary[n].count */
  count: number
  /** Percentage 0–100 — routeSummary[n].percent */
  percent: number
  /** Formatted "count (percent%)" string for display */
  displayText: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safe number formatter with em-dash fallback for zero/null. */
function fmtCount(value: number | null | undefined, fallback = '—'): string {
  if (value == null || isNaN(value)) return fallback
  return value.toLocaleString()
}

/** Format a readiness/risk percentage to one decimal place. */
function fmtPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

/** Derive a tone from a readiness percentage (higher = better readiness). */
function readinessTone(pct: number): 'neutral' | 'warning' | 'critical' {
  if (pct < 50) return 'critical'
  if (pct < 80) return 'warning'
  return 'neutral'
}

/**
 * Convert a route type id slug into a short display label.
 * Falls back to the raw id if it doesn't match known slugs.
 */
function routeTypeLabel(id: string): string {
  const map: Record<string, string> = {
    'pre-arrival': 'Pre-Arrival',
    'direct-to-site': 'Direct to Site',
    'via-warehouse': 'Via Warehouse',
    'via-mosb': 'Via MOSB',
    'via-warehouse-mosb': 'Via WH + MOSB',
    'review-required': 'Review Required',
  }
  return map[id] ?? id
}

// ─── mapKpiCards ──────────────────────────────────────────────────────────────

/**
 * Map OverviewCockpitResponse → 6 KPI strip cards.
 *
 * Card layout (left → right):
 *  1. TOTAL SHIPMENTS   ← hero.metrics[id='total-shipments'].value
 *                           (= shipmentStages.total, i.e. total shipments in DB)
 *  2. DELIVERED TO SITE ← hero.metrics[id='final-delivered'].value
 *                           (= shipmentStages.delivered, delivery_date present)
 *  3. OPEN RADAR        ← hero.openAnomalyCount
 *                           (= total − site-arrived, cases not yet at site)
 *  4. OVERDUE ETA       ← hero.overdueEtaCount
 *                           (= worklist rows where dueAt < today)
 *  5. MOSB PENDING      ← hero.mandatoryMosbMissingCount
 *                           (= AGI/DAS shipments with flow_code < 3)
 *  6. AGI READINESS     ← siteReadiness[AGI].readinessPercent as "%"
 *                           (= arrived / total for AGI site)
 */
export function mapKpiCards(data: OverviewCockpitResponse | null): KpiCardData[] {
  if (!data) {
    const empty = (id: string, label: string): KpiCardData => ({
      id,
      label,
      value: '—',
      tone: 'neutral',
    })
    return [
      empty('total-shipments', 'TOTAL SHIPMENTS'),
      empty('final-delivered', 'DELIVERED TO SITE'),
      empty('open-radar', 'OPEN RADAR'),
      empty('overdue-eta', 'OVERDUE ETA'),
      empty('mosb-pending', 'MOSB PENDING'),
      empty('agi-readiness', 'AGI READINESS'),
    ]
  }

  const hero = data.hero

  /**
   * Helper: pull a pre-formatted value from hero.metrics by id.
   * Falls back to a numeric field mapped manually if metrics are absent.
   */
  const metricValue = (id: string): string => {
    const m = hero.metrics.find((metric) => metric.id === id)
    return m?.value ?? '—'
  }

  const metricTone = (id: string): 'neutral' | 'warning' | 'critical' => {
    const m = hero.metrics.find((metric) => metric.id === id)
    return (m?.tone as 'neutral' | 'warning' | 'critical') ?? 'neutral'
  }

  /** AGI readiness from siteReadiness array (more precise than hero scalar) */
  const agiSite = data.siteReadiness.find((s) => s.site === 'AGI')
  const agiReadinessPct = agiSite?.readinessPercent ?? hero.agiRiskPercent

  return [
    {
      /** hero.metrics[id='total-shipments'].value — total shipment rows in DB */
      id: 'total-shipments',
      label: 'TOTAL SHIPMENTS',
      value: metricValue('total-shipments') || fmtCount(hero.totalCases),
      tone: 'neutral',
    },
    {
      /** hero.metrics[id='final-delivered'].value — shipments with delivery_date */
      id: 'final-delivered',
      label: 'DELIVERED TO SITE',
      value: metricValue('final-delivered') || fmtCount(hero.siteArrivedCount),
      tone: 'neutral',
    },
    {
      /** hero.openAnomalyCount — total minus site-arrived cases */
      id: 'open-radar',
      label: 'OPEN RADAR',
      value: fmtCount(hero.openAnomalyCount),
      tone: hero.openAnomalyCount > 0 ? 'warning' : 'neutral',
    },
    {
      /** hero.overdueEtaCount — worklist rows past their dueAt date */
      id: 'overdue-eta',
      label: 'OVERDUE ETA',
      value: metricValue('overdue-eta') || fmtCount(hero.overdueEtaCount),
      tone: metricTone('overdue-eta'),
    },
    {
      /** hero.mandatoryMosbMissingCount — AGI/DAS shipments with flow_code < 3 */
      id: 'mosb-pending',
      label: 'MOSB PENDING',
      value: metricValue('mosb-pending') || fmtCount(hero.mandatoryMosbMissingCount),
      sublabel: hero.mandatoryMosbMissingCount > 0 ? 'Important' : undefined,
      tone: metricTone('mosb-pending'),
    },
    {
      /** siteReadiness[AGI].readinessPercent — arrived/total for AGI destination */
      id: 'agi-readiness',
      label: 'AGI READINESS',
      value: fmtPercent(agiReadinessPct),
      tone: readinessTone(agiReadinessPct),
    },
  ]
}

// ─── mapSiteCards ─────────────────────────────────────────────────────────────

/**
 * Map OverviewCockpitResponse → 3 site cards (SHU, MIR, DAS).
 *
 * Source: data.siteReadiness[] filtered to site ∈ {SHU, MIR, DAS}.
 *
 * Accent colours are design-spec constants:
 *   SHU = #58E1C9  (teal)
 *   MIR = #5C87FF  (blue)
 *   DAS = #8A58FF  (violet)
 */
export function mapSiteCards(data: OverviewCockpitResponse | null): SiteCardData[] {
  const SITE_CONFIG: Array<{ site: 'SHU' | 'MIR' | 'DAS'; accentHex: string }> = [
    { site: 'SHU', accentHex: '#58E1C9' },
    { site: 'MIR', accentHex: '#5C87FF' },
    { site: 'DAS', accentHex: '#8A58FF' },
  ]

  return SITE_CONFIG.map(({ site, accentHex }) => {
    /** siteReadiness[n] where n.site === site */
    const row = data?.siteReadiness.find((s) => s.site === site)

    return {
      site,
      accentHex,
      /** siteReadiness[n].total — total cases assigned to this site */
      total: row?.total ?? 0,
      /** siteReadiness[n].arrived — cases physically at the site */
      arrived: row?.arrived ?? 0,
      /** siteReadiness[n].readinessPercent — arrived/total * 100 */
      readinessPercent: row?.readinessPercent ?? 0,
      /** siteReadiness[n].preArrival — total − arrived */
      preArrival: row?.preArrival ?? 0,
      readinessLabel: fmtPercent(row?.readinessPercent ?? 0),
    }
  })
}

// ─── mapAgiPanel ──────────────────────────────────────────────────────────────

/**
 * Map OverviewCockpitResponse → AGI panel data.
 *
 * Source fields:
 *   - siteReadiness[] where site === 'AGI'  (readinessPercent, total, arrived)
 *   - hero.agiRiskPercent                   (pre-computed risk signal)
 *
 * Accent: #F5D36F (golden amber, design-spec)
 */
export function mapAgiPanel(data: OverviewCockpitResponse | null): AgiPanelData {
  /** siteReadiness entry for AGI */
  const agiRow = data?.siteReadiness.find((s) => s.site === 'AGI')

  const readinessPct = agiRow?.readinessPercent ?? 0
  /** hero.agiRiskPercent — API-computed risk signal (may differ slightly) */
  const heroRisk = data?.hero.agiRiskPercent ?? 0

  return {
    accentHex: '#F5D36F',
    readinessPercent: readinessPct,
    total: agiRow?.total ?? 0,
    arrived: agiRow?.arrived ?? 0,
    /** Complement of readiness — what fraction has NOT arrived */
    riskPercent: Math.max(0, 100 - readinessPct),
    heroAgiRiskPercent: heroRisk,
    readinessLabel: fmtPercent(readinessPct),
    tone: readinessTone(readinessPct),
  }
}

// ─── mapMissionBlocks ─────────────────────────────────────────────────────────

/**
 * Map OverviewCockpitResponse → 3 Mission Control blocks.
 *
 * Block 1 — Critical Alerts
 *   Source: data.alerts[] where severity === 'critical'
 *   Accent: #FF9C4D (orange-red)
 *
 * Block 2 — Action Queue
 *   Source: data.alerts[] where severity !== 'critical';
 *           falls back to data.routeSummary[] when no warning alerts exist
 *   Accent: #F5C366 (amber)
 *
 * Block 3 — Next 72 Hours
 *   Source: data.liveFeed[] (last 3 items, most-recent-last from API)
 *   Accent: #FF7D52 (coral)
 */
export function mapMissionBlocks(data: OverviewCockpitResponse | null): MissionBlock[] {
  if (!data) {
    return [
      { title: 'Critical Alerts', count: 0, badgeHex: '#FF9C4D', rows: [] },
      { title: 'Action Queue',    count: 0, badgeHex: '#F5C366', rows: [] },
      { title: 'Next 72 Hours',   count: 0, badgeHex: '#F5C366', subtext: 'Incoming', rows: [] },
    ]
  }

  /** alerts where severity === 'critical' — e.g. mandatory-mosb-missing, agi-readiness-low */
  const criticalAlerts: OverviewAlert[] = data.alerts.filter((a) => a.severity === 'critical')

  /** alerts where severity is 'warning' or 'info' */
  const warningAlerts: OverviewAlert[] = data.alerts.filter((a) => a.severity !== 'critical')

  /** live feed items — liveFeed is already sorted descending by ts, take last 3 */
  const liveFeed: OverviewLiveFeedItem[] = data.liveFeed.slice(-3)

  // ── Block 1: Critical Alerts ────────────────────────────────────────────────
  const criticalBlock: MissionBlock = {
    title: 'Critical Alerts',
    count: criticalAlerts.length,
    badgeHex: '#FF9C4D',
    rows: criticalAlerts.slice(0, 2).map((alert) => ({
      id: alert.id,
      accent: '#FF9C4D',
      /** alert.title — e.g. "필수 MOSB 경유 누락" */
      primary: alert.title,
      /** alert.description — detailed explanation */
      secondary: alert.description,
      locked: false,
    })),
  }

  // ── Block 2: Action Queue ───────────────────────────────────────────────────
  /** Use warning alerts when available; fall back to route summary items */
  const actionRows: MissionBlockRow[] =
    warningAlerts.length > 0
      ? warningAlerts.slice(0, 2).map((alert) => ({
          id: alert.id,
          accent: '#F5C366',
          /** alert.title — e.g. "창고 적체 상위 구역" */
          primary: alert.title,
          secondary: alert.description,
        }))
      : data.routeSummary.slice(0, 2).map((item: OverviewRouteSummaryItem) => ({
          id: item.routeTypeId,
          accent: '#F5C366',
          /** routeSummary[n].routeTypeId + count — e.g. "Via Warehouse · 142" */
          primary: `${routeTypeLabel(item.routeTypeId)} · ${item.count.toLocaleString()}`,
          /** routeSummary[n].percent */
          secondary: `${item.percent.toFixed(1)}%`,
        }))

  const actionBlock: MissionBlock = {
    title: 'Action Queue',
    /** badge count: warning alerts when present, else route summary length */
    count: warningAlerts.length > 0 ? warningAlerts.length : data.routeSummary.length,
    badgeHex: '#F5C366',
    rows: actionRows,
  }

  // ── Block 3: Next 72 Hours ──────────────────────────────────────────────────
  const feedBlock: MissionBlock = {
    title: 'Next 72 Hours',
    /** liveFeed.length — number of recent operational events */
    count: liveFeed.length,
    badgeHex: '#F5C366',
    subtext: 'Incoming',
    rows: liveFeed.map((item: OverviewLiveFeedItem) => ({
      id: item.id,
      accent: '#FF7D52',
      /** liveFeed[n].title — event_type or status from the events table */
      primary: item.title,
      /** liveFeed[n].subtitle — "location_id · shpt_no" concatenation */
      secondary: item.subtitle || item.timestamp,
    })),
  }

  return [criticalBlock, actionBlock, feedBlock]
}

// ─── mapFlowStats ─────────────────────────────────────────────────────────────

/**
 * Map OverviewCockpitResponse → flow statistics array.
 *
 * Source: data.routeSummary[] — one entry per OverviewRouteTypeId.
 * Sorted by count descending so the most-populated route appears first.
 *
 * Each FlowStat carries:
 *   - routeTypeId   ← routeSummary[n].routeTypeId
 *   - count         ← routeSummary[n].count
 *   - percent       ← routeSummary[n].percent
 *   - displayText   ← formatted "count (percent%)"
 */
export function mapFlowStats(data: OverviewCockpitResponse | null): FlowStat[] {
  if (!data || data.routeSummary.length === 0) return []

  return [...data.routeSummary]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      /** routeSummary[n].routeTypeId */
      routeTypeId: item.routeTypeId,
      label: routeTypeLabel(item.routeTypeId),
      /** routeSummary[n].count */
      count: item.count,
      /** routeSummary[n].percent */
      percent: item.percent,
      displayText: `${item.count.toLocaleString()} (${item.percent.toFixed(1)}%)`,
    }))
}
