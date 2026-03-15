/* eslint-disable @next/next/no-img-element */
/**
 * OverviewArtboard.tsx
 *
 * Artboard-based overview page — pixel-perfect 2048×1365 canvas scaled to
 * fit any viewport via CSS transform:scale(). Mirrors the reference 3000 design
 * exactly in layout / box / coordinate structure.
 *
 * Data contract (AGENTS.md):
 *   - ALL metric values come from useOverviewData() → OverviewCockpitResponse
 *   - Source: hvdc all status only (no Flow Code on Overview)
 *   - Voyage-centric language (patch555_overview.md)
 *
 * Navigation: every clickable element calls handleNavigate(NavigationIntent)
 * which uses buildDashboardLink() to route to /chain, /pipeline, /sites, /cargo.
 */
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import type {
  NavigationIntent,
  OverviewCockpitResponse,
  OverviewSiteReadinessItem,
  OverviewAlert,
  OverviewLiveFeedItem,
} from '@/types/overview'

// ─── Design constants ──────────────────────────────────────────────────────────

const DESIGN_W = 2048
const DESIGN_H = 1365

type Rect = { x: number; y: number; w: number; h: number }

// ─── KPI card definitions (patch555 §3 — voyage-centric, no Flow Code) ────────

interface KpiDef {
  id: string
  rect: Rect
  label: string
  /** Tailwind gradient class for the card background */
  bgClass: 'bg-hud-card' | 'bg-hud-card-hot' | 'bg-hud-card-warm'
  /** Click navigation intent */
  navIntent: NavigationIntent
}

const KPI_DEFS: KpiDef[] = [
  {
    id: 'total-shipments',
    rect: { x: 146, y: 135, w: 278, h: 127 },
    label: 'TOTAL SHIPMENTS',
    bgClass: 'bg-hud-card',
    navIntent: { page: 'pipeline' },
  },
  {
    id: 'final-delivered',
    rect: { x: 437, y: 135, w: 278, h: 127 },
    label: 'FINAL DELIVERED',
    bgClass: 'bg-hud-card',
    navIntent: { page: 'sites' },
  },
  {
    id: 'customs-active',
    rect: { x: 727, y: 135, w: 323, h: 127 },
    label: 'CUSTOMS ACTIVE',
    bgClass: 'bg-hud-card-hot',
    navIntent: { page: 'pipeline' },
  },
  {
    id: 'overdue-eta',
    rect: { x: 1063, y: 135, w: 323, h: 127 },
    label: 'OVERDUE ETA',
    bgClass: 'bg-hud-card-hot',
    navIntent: { page: 'pipeline' },
  },
  {
    id: 'wh-staging',
    rect: { x: 1398, y: 135, w: 318, h: 127 },
    label: 'WH STAGING',
    bgClass: 'bg-hud-card-warm',
    navIntent: { page: 'cargo', params: { tab: 'wh' } },
  },
  {
    id: 'mosb-pending',
    rect: { x: 1727, y: 135, w: 279, h: 127 },
    label: 'MOSB PENDING',
    bgClass: 'bg-hud-card-warm',
    navIntent: { page: 'sites' },
  },
]

// ─── Site card definitions (design-spec accent colours — fixed per site) ───────

interface SiteDef {
  site: 'SHU' | 'MIR' | 'DAS'
  rect: Rect
  accentHex: string
  /** Radial + linear gradient background for the card */
  bgGradient: string
}

const SITE_DEFS: SiteDef[] = [
  {
    site: 'SHU',
    rect: { x: 145, y: 864, w: 213, h: 291 },
    accentHex: '#58E1C9',
    bgGradient:
      'radial-gradient(120% 160% at 0% 0%, rgba(55,198,171,.18), transparent 55%), linear-gradient(180deg, rgba(15,31,44,.95) 0%, rgba(11,21,34,.98) 100%)',
  },
  {
    site: 'MIR',
    rect: { x: 374, y: 864, w: 213, h: 291 },
    accentHex: '#5C87FF',
    bgGradient:
      'radial-gradient(120% 160% at 0% 0%, rgba(67,117,246,.2), transparent 55%), linear-gradient(180deg, rgba(17,26,52,.95) 0%, rgba(12,18,37,.98) 100%)',
  },
  {
    site: 'DAS',
    rect: { x: 604, y: 864, w: 213, h: 291 },
    accentHex: '#8A58FF',
    bgGradient:
      'radial-gradient(120% 160% at 0% 0%, rgba(138,88,255,.18), transparent 55%), linear-gradient(180deg, rgba(28,23,49,.95) 0%, rgba(16,14,32,.98) 100%)',
  },
]

// ─── Stage funnel strip (patch555 §8 — Chain Funnel, not Flow Code) ───────────
// Values derived from data.pipeline[] by summing voyage stages into 6 buckets.

interface StageBucket {
  label: string
  x: number
  width: number
  /** PipelineStage ids that map to this funnel bucket */
  stageIds: string[]
}

const STAGE_BUCKETS: StageBucket[] = [
  { label: 'Shipping',   x: 170, width: 90,  stageIds: ['pre-arrival', 'in-transit'] },
  { label: 'Port / Air', x: 330, width: 90,  stageIds: ['arrived-port', 'port-clearance'] },
  { label: 'Customs',    x: 500, width: 90,  stageIds: ['customs-in-progress', 'customs-cleared'] },
  { label: 'Warehouse',  x: 680, width: 90,  stageIds: ['warehouse-staging'] },
  { label: 'MOSB',       x: 860, width: 80,  stageIds: ['mosb-staging'] },
  { label: 'Site',       x: 1030, width: 80, stageIds: ['at-site', 'delivered'] },
]

// ─── Bottom navigation tabs ────────────────────────────────────────────────────

interface TabDef {
  label: string
  x: number
  w: number
  intent: NavigationIntent
}

const BOTTOM_TABS: TabDef[] = [
  { label: 'LOGISTICS CHAIN', x: 145, w: 280, intent: { page: 'chain' } },
  { label: 'PIPELINE',        x: 430, w: 220, intent: { page: 'pipeline' } },
  { label: 'SITES',           x: 654, w: 206, intent: { page: 'sites' } },
  { label: 'CARGO',           x: 864, w: 230, intent: { page: 'cargo' } },
]

// ─── Data helpers ──────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString()
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return `${n.toFixed(1)}%`
}

/** Pull KPI display value from hero scalar fields + metrics[] fallback */
function kpiValue(data: OverviewCockpitResponse | null, id: string): string {
  if (!data) return '—'
  const { hero } = data
  // Try hero.metrics[] first (API may pre-format these)
  const m = hero.metrics.find((x) => x.id === id)
  if (m?.value) return m.value
  // Fall back to known scalar fields
  switch (id) {
    case 'total-shipments': return fmt(hero.totalCases)
    case 'final-delivered': return fmt(hero.siteArrivedCount)
    case 'customs-active':  return fmt(hero.openAnomalyCount)  // best available proxy
    case 'overdue-eta':     return fmt(hero.overdueEtaCount)
    case 'wh-staging':      return fmt(hero.warehouseCases)
    case 'mosb-pending':    return fmt(hero.mandatoryMosbMissingCount)
    default:                return '—'
  }
}

/** KPI sublabel text (patch555_overview_detail.md §6 — OVERVIEW_KPI_COPY) */
function kpiSublabel(data: OverviewCockpitResponse | null, id: string): string | undefined {
  const rate = data?.hero.siteArrivedRate
  switch (id) {
    case 'total-shipments': return 'All Vendors / All POD'
    case 'final-delivered':  return rate != null ? `${fmtPct(rate)} Delivered share` : 'Final delivery milestone reached'
    case 'customs-active':   return 'In Progress / Hold'
    case 'overdue-eta':      return 'ETA passed, not delivered'
    case 'wh-staging':       return 'Optional staging node only'
    case 'mosb-pending':     return 'Island routing watchlist'
    default:                 return undefined
  }
}

/** Sum pipeline stage counts for a given set of stage IDs */
function sumPipelineStages(
  pipeline: OverviewCockpitResponse['pipeline'],
  stageIds: string[],
): number {
  return pipeline
    .filter((p) => stageIds.includes(p.stage))
    .reduce((acc, p) => acc + p.count, 0)
}

// ─── Main component ────────────────────────────────────────────────────────────

export function OverviewArtboard() {
  const router = useRouter()
  const frameRef = React.useRef<HTMLDivElement>(null)
  const scale = useArtboardScale(frameRef, DESIGN_W, DESIGN_H)

  const { data } = useOverviewData()

  const handleNavigate = React.useCallback(
    (intent: NavigationIntent) => {
      router.push(buildDashboardLink(intent))
    },
    [router],
  )

  // Actual rendered height of the scaled artboard canvas
  const canvasHeight = Math.round(DESIGN_H * scale)

  return (
    <div className="w-full overflow-x-hidden bg-hud-shell text-hud-text">
      <div
        ref={frameRef}
        className="relative w-full"
        style={{ height: canvasHeight }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
        >
          <ArtboardBackground />
          <SidebarRail onNavigate={handleNavigate} />
          <TopBar />
          <KpiRow data={data} onNavigate={handleNavigate} />
          <MainMapPanel />
          <SectionHeader title="Site Delivery Matrix" rect={{ x: 145, y: 806, w: 1295, h: 40 }} />
          <SectionHeader title="Mission Control" rect={{ x: 1476, y: 806, w: 472, h: 40 }} withChevron />
          <HealthMatrix data={data} onNavigate={handleNavigate} />
          <MissionControlPanel data={data} onNavigate={handleNavigate} />
          <FlowSummary data={data} />
          <BottomTabs onNavigate={handleNavigate} />
        </div>
      </div>
    </div>
  )
}

// ─── ArtboardBackground ────────────────────────────────────────────────────────

function ArtboardBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-hud-shell" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
          backgroundSize: '70px 70px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,.55), transparent 75%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(53,110,255,.18),transparent_18%),radial-gradient(circle_at_76%_32%,rgba(255,118,92,.1),transparent_22%),radial-gradient(circle_at_88%_86%,rgba(53,110,255,.14),transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.22)_100%)]" />
    </>
  )
}

// ─── SidebarRail ───────────────────────────────────────────────────────────────
// Left navigation rail — replaces decorative dots with real page links.

const RAIL_NAV: { intent: NavigationIntent; label: string; icon: React.ReactNode }[] = [
  { intent: { page: 'chain' },    label: 'Chain',    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="18" x2="15" y2="18"/></svg> },
  { intent: { page: 'pipeline' }, label: 'Pipeline', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> },
  { intent: { page: 'sites' },    label: 'Sites',    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="9" height="14"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><rect x="13" y="7" width="9" height="14"/><line x1="2" y1="7" x2="22" y2="7"/></svg> },
  { intent: { page: 'cargo' },    label: 'Cargo',    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
]

function SidebarRail({ onNavigate }: { onNavigate: (intent: NavigationIntent) => void }) {
  return (
    <Box
      rect={{ x: 0, y: 0, w: 110, h: DESIGN_H }}
      className="border-r border-white/5 bg-[linear-gradient(180deg,rgba(9,15,30,.95),rgba(5,10,24,.98))]"
    >
      {/* Right border gradient line */}
      <div className="absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,rgba(59,86,165,.14),rgba(59,86,165,0))]" />

      {/* HVDC logo / Overview active pill */}
      <div className="absolute left-[8px] top-[28px] h-[68px] w-[94px] rounded-[18px] border border-[#2F76FF]/45 bg-[linear-gradient(180deg,rgba(47,118,255,.95),rgba(36,94,216,.95))] shadow-glow-blue">
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <MapIcon className="h-6 w-6 text-white" />
          <span className="text-[10px] font-semibold text-white/90">Overview</span>
        </div>
      </div>

      {/* Page navigation links — Link ensures reliable Next.js routing */}
      {RAIL_NAV.map(({ intent, label, icon }, i) => (
        <Link
          key={label}
          href={buildDashboardLink(intent)}
          className="absolute left-[8px] flex w-[94px] flex-col items-center gap-1 rounded-[14px] border border-transparent py-3 text-[#7C89A8] no-underline transition-colors duration-150 hover:border-white/10 hover:bg-white/5 hover:text-white"
          style={{ top: `${130 + i * 80}px` }}
          title={label}
        >
          {icon}
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </Box>
  )
}

// MapIcon for Overview active state
function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  )
}

// ─── TopBar ────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <>
      {/* Page title */}
      <div className="absolute left-[138px] top-[29px] text-[26px] font-semibold tracking-[0.06em] text-white">
        HVDC CONTROL TOWER
      </div>

      {/* Search bar — patch555 §2: voyage-centric search terms */}
      <div className="absolute left-[145px] top-[84px] h-[50px] w-[865px] rounded-[18px] border border-[#1E2A48] bg-[linear-gradient(180deg,rgba(14,21,40,.96),rgba(11,16,31,.98))] shadow-panel">
        <div className="absolute left-[18px] top-1/2 -translate-y-1/2">
          <SearchIcon className="h-5 w-5 text-[#2F76FF]" />
        </div>
        <div className="absolute left-[48px] top-1/2 -translate-y-1/2 text-hud-sm text-hud-textMuted">
          Search HVDC / Vendor / POL / POD / Site...
        </div>
      </div>

      {/* Filter chips — patch555 §2: voyage mode toggles */}
      <Chip x={1030} y={88} w={115} label="Origin Arc" active icon={<Dot color="#6EB2FF" size={10} />} />
      <Chip x={1162} y={88} w={113} label="Voyage" icon={<ShipIcon className="h-4 w-4 text-[#CFD8F4]" />} />
      <Chip x={1292} y={88} w={128} label="Next 72h" active icon={<ThumbIcon className="h-4 w-4 text-[#FFD39A]" />} />
      <Chip x={1438} y={88} w={112} label="Heatmap" icon={<Dot color="#FF8B45" size={10} />} />

      {/* Last updated timestamp (from API) */}
      <div className="absolute left-[1768px] top-[34px] text-hud-xs text-hud-textMuted">
        Updated: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* Language toggle */}
      <div className="absolute left-[1881px] top-[26px] flex h-[40px] w-[123px] items-center justify-between rounded-full border border-white/6 bg-[linear-gradient(180deg,rgba(12,18,34,.96),rgba(8,13,26,.98))] px-3 shadow-panel">
        <span className="inline-flex h-[30px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(47,118,255,.92),rgba(56,125,255,.8))] text-hud-xs font-semibold text-white shadow-glow-blue">
          ENG
        </span>
        <span className="text-hud-xs font-medium text-hud-textMuted">한국어</span>
      </div>
    </>
  )
}

// ─── KpiRow ────────────────────────────────────────────────────────────────────

function KpiRow({
  data,
  onNavigate,
}: {
  data: OverviewCockpitResponse | null
  onNavigate: (i: NavigationIntent) => void
}) {
  return (
    <>
      {KPI_DEFS.map((def) => (
        <KpiCard
          key={def.id}
          def={def}
          value={kpiValue(data, def.id)}
          sublabel={kpiSublabel(data, def.id)}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

function KpiCard({
  def,
  value,
  sublabel,
  onNavigate,
}: {
  def: KpiDef
  value: string
  sublabel?: string
  onNavigate: (i: NavigationIntent) => void
}) {
  return (
    <div className="absolute overflow-hidden" style={{ left: def.rect.x, top: def.rect.y, width: def.rect.w, height: def.rect.h }}>
      <Link
        href={buildDashboardLink(def.navIntent)}
        className={`absolute inset-0 block rounded-[22px] border border-white/6 ${def.bgClass} shadow-panel backdrop-blur-hud no-underline`}
      >
        <div
          className="absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              'radial-gradient(circle at 22% 28%, rgba(87,126,255,.2), transparent 34%), radial-gradient(circle at 74% 40%, rgba(255,115,91,.16), transparent 28%), radial-gradient(circle at 48% 78%, rgba(255,255,255,.045), transparent 16%)',
          }}
        />
        <div className="relative h-full px-6 py-5">
          <div className="text-[12px] font-medium tracking-[0.18em] text-hud-textMuted">{def.label}</div>
          <div className="mt-4 text-hud-xl font-semibold tracking-[-0.05em] text-white">{value}</div>
          {sublabel && (
            <div className="mt-1.5 text-hud-xs text-hud-textMuted">{sublabel}</div>
          )}
        </div>
      </Link>
    </div>
  )
}

// ─── MainMapPanel ──────────────────────────────────────────────────────────────

function MainMapPanel() {
  return (
    <Box
      rect={{ x: 132, y: 293, w: 1872, h: 493 }}
      className="overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(10,16,30,.6),rgba(7,12,25,.4))]"
    >
      <MapLegendRail />
      <div className="absolute left-[418px] top-[0px] h-full w-[1454px] overflow-hidden rounded-[0_24px_24px_0]">
        <img
          src="/assets/hvdc-map-main.png"
          alt="HVDC voyage network map"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,21,.04),rgba(8,12,21,.18))]" />
      </div>
    </Box>
  )
}

function MapLegendRail() {
  return (
    <Box
      rect={{ x: 0, y: 0, w: 418, h: 493 }}
      className="border-r border-white/5 bg-[linear-gradient(180deg,rgba(11,17,31,.96),rgba(8,13,25,.98))]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(150%_150%_at_0%_0%,rgba(70,113,250,.14),transparent_55%)]" />
      <div className="absolute left-[24px] top-[22px] h-[380px] w-[321px] rounded-[20px] border border-[#24314E] bg-[linear-gradient(180deg,rgba(18,27,49,.88),rgba(12,19,34,.9))] p-[18px] shadow-panel">

        {/* Legend header — patch555 §4 */}
        <div className="mb-4 text-hud-2xs uppercase tracking-[0.18em] text-hud-textMuted">
          MODE · Voyage Network
        </div>

        {/* Node legend — patch555 §4 */}
        <div className="space-y-3 text-hud-sm text-hud-textSoft">
          <LegendItem color="#6EB2FF"  title="Origin Region"  subtitle="Blue halo" bulb />
          <LegendItem color="#5C87FF"  title="POD / Airport"  subtitle="Entry node" />
          <LegendItem color="#35D6FF"  title="Customs"        subtitle="Clearance node" />
          <LegendItem color="#F5D36F"  title="Warehouse"      subtitle="Optional staging" square />
          <LegendItem color="#FF9157"  title="MOSB Yard"      subtitle="DAS / AGI path" square />
          <LegendItem color="#58E1C9"  title="HVDC Sites"     subtitle="SHU MIR DAS AGI" bulb />
        </div>

        {/* Route legend — patch555 §4 */}
        <div className="mt-4 rounded-[14px] border border-white/5 bg-[linear-gradient(180deg,rgba(14,21,38,.9),rgba(10,15,28,.96))] px-4 py-3">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-hud-textMuted">Route Rules</div>
          <div className="space-y-1.5 text-hud-2xs text-hud-textSoft">
            <div>Global: Origin → POL → POD → Site</div>
            <div>UAE: Port → Customs → WH? → MOSB? → Site</div>
            <div className="mt-2 text-hud-textMuted">WH is optional staging</div>
            <div className="text-hud-textMuted">DAS / AGI require MOSB path</div>
          </div>
        </div>
      </div>
    </Box>
  )
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  rect,
  withChevron = false,
}: {
  title: string
  rect: Rect
  withChevron?: boolean
}) {
  return (
    <Box rect={rect}>
      <div className="absolute left-0 top-0 text-[18px] font-medium text-hud-textSoft">{title}</div>
      <div className="absolute left-[220px] top-[20px] h-px w-[calc(100%-236px)] bg-[linear-gradient(90deg,rgba(77,100,166,.65),rgba(77,100,166,.12),rgba(77,100,166,0))]" />
      {withChevron && (
        <div className="absolute right-[0px] top-[2px] flex items-center gap-3 text-hud-textMuted">
          <span className="text-lg">◐</span>
          <span>»</span>
        </div>
      )}
    </Box>
  )
}

// ─── HealthMatrix ──────────────────────────────────────────────────────────────

function HealthMatrix({
  data,
  onNavigate,
}: {
  data: OverviewCockpitResponse | null
  onNavigate: (i: NavigationIntent) => void
}) {
  return (
    <>
      {/* SHU / MIR / DAS site cards */}
      {SITE_DEFS.map((def) => {
        const row = data?.siteReadiness.find((s) => s.site === def.site)
        return (
          <SiteCard
            key={def.site}
            def={def}
            row={row ?? null}
            onNavigate={onNavigate}
          />
        )
      })}

      {/* AGI OFFSHORE FOCUS large panel — patch555 §6-4 */}
      <AgiPanel data={data} onNavigate={onNavigate} />
    </>
  )
}

function SiteCard({
  def,
  row,
  onNavigate,
}: {
  def: SiteDef
  row: OverviewSiteReadinessItem | null
  onNavigate: (i: NavigationIntent) => void
}) {
  const assigned  = fmt(row?.total)
  const delivered = fmt(row?.arrived)
  const pending   = fmt(row?.preArrival)
  // DAS shows MOSB pending, others show warehouse
  const mosbCount = row?.mosb ?? 0
  const whCount   = row?.warehouse ?? 0
  const showMosb  = def.site === 'DAS'
  const thirdStat = showMosb ? fmt(mosbCount) : fmt(whCount)
  const thirdLabel = showMosb ? 'MOSB Pending' : 'Warehouse'

  const readinessPct = row?.readinessPercent ?? 0
  const readinessLabel = `${readinessPct.toFixed(1)}%`

  const navIntent: NavigationIntent = {
    page: 'sites',
    params: { site: def.site },
  }

  return (
    <div className="absolute" style={{ left: def.rect.x, top: def.rect.y, width: def.rect.w, height: def.rect.h }}>
    <Link
      href={buildDashboardLink(navIntent)}
      className="absolute inset-0 block overflow-hidden rounded-[22px] border border-white/6 shadow-panel no-underline"
      style={{ backgroundImage: def.bgGradient }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0))]" />
      <div className="relative h-full px-5 py-4">
        {/* Site label */}
        <div className="text-[34px] font-semibold tracking-[0.02em]" style={{ color: def.accentHex }}>
          {def.site}
        </div>

        {/* Assigned count (big) */}
        <div className="mt-1 flex items-end gap-2">
          <div className="text-[42px] font-semibold leading-none tracking-[-0.05em] text-white">{assigned}</div>
          <div className="mb-1 text-hud-xs text-hud-textMuted">Assigned</div>
        </div>

        {/* Stats rows — patch555 §6 */}
        <div className="mt-4 space-y-2 text-hud-sm">
          <div className="flex items-center justify-between">
            <span className="text-hud-textMuted">Delivered</span>
            <span className="font-semibold text-white">{delivered}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-hud-textMuted">{thirdLabel}</span>
            <span className="font-medium text-white">{thirdStat}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-hud-textMuted">Pending</span>
            <span className="font-medium text-white">{pending}</span>
          </div>
        </div>

        {/* Readiness progress bar */}
        <div className="absolute bottom-[16px] left-[14px] right-[14px] h-[16px] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.08))]">
          <div
            className="relative h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(readinessPct, 100)}%`,
              background: `linear-gradient(90deg, ${def.accentHex}40, ${def.accentHex}B3)`,
            }}
          >
            <div
              className="absolute left-[8px] top-1/2 -translate-y-1/2 text-[10px] font-semibold"
              style={{ color: def.accentHex }}
            >
              {readinessLabel}
            </div>
          </div>
        </div>
      </div>
    </Link>
    </div>
  )
}

function AgiPanel({
  data,
  onNavigate,
}: {
  data: OverviewCockpitResponse | null
  onNavigate: (i: NavigationIntent) => void
}) {
  const agiRow = data?.siteReadiness.find((s) => s.site === 'AGI') ?? null
  const assigned  = fmt(agiRow?.total)
  const delivered = fmt(agiRow?.arrived)
  const mosbPending = fmt(agiRow?.mosb)
  const readinessPct = agiRow?.readinessPercent ?? 0

  return (
    <div className="absolute" style={{ left: 834, top: 864, width: 606, height: 291 }}>
    <Link
      href={buildDashboardLink({ page: 'sites', params: { site: 'AGI' } })}
      className="absolute inset-0 block overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,21,39,.96),rgba(10,14,28,.98))] shadow-panel no-underline"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_150%_at_10%_0%,rgba(255,193,94,.14),transparent_55%),radial-gradient(80%_110%_at_100%_100%,rgba(45,118,255,.12),transparent_50%)]" />

      {/* Title — patch555 §6-4: AGI OFFSHORE FOCUS */}
      <div className="absolute left-[26px] top-[20px] max-w-[290px] text-[24px] font-semibold leading-tight tracking-[0.02em] text-[#F5D36F]">
        AGI OFFSHORE FOCUS
      </div>

      {/* Main value: Assigned (big number) */}
      <div className="absolute left-[26px] top-[62px] text-[52px] font-semibold leading-none text-white">
        {assigned}
      </div>
      <div className="absolute left-[26px] top-[120px] text-hud-sm text-hud-textMuted">Assigned</div>

      {/* Secondary stats — patch555 §6-4 */}
      <div className="absolute left-[26px] top-[148px] flex items-center gap-4 text-hud-sm">
        <span className="text-white">{delivered}</span>
        <span className="text-hud-textMuted">Delivered</span>
        <span className="text-hud-amber">{mosbPending}</span>
        <span className="text-hud-textMuted">MOSB Pending</span>
      </div>

      {/* Readiness bar */}
      <div className="absolute left-[26px] top-[186px] w-[180px]">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
          Readiness {fmtPct(readinessPct)}
        </div>
        <div className="h-[8px] w-full rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#FFCC69,#F5A948)] shadow-glow-amber transition-all duration-700"
            style={{ width: `${Math.min(readinessPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Mini map inset */}
      <div className="absolute inset-y-[22px] right-[20px] w-[260px] overflow-hidden rounded-[16px]">
        <img
          src="/assets/hvdc-map-mini.png"
          alt="AGI offshore site mini map"
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,22,.02),rgba(8,11,22,.24))]" />
      </div>
    </Link>
    </div>
  )
}

// ─── MissionControlPanel ───────────────────────────────────────────────────────

const MISSION_RECTS: Rect[] = [
  { x: 1476, y: 866,  w: 472, h: 138 },
  { x: 1476, y: 1018, w: 472, h: 145 },
  { x: 1476, y: 1178, w: 472, h: 144 },
]

const MISSION_BADGE_COLORS = ['#FF9C4D', '#F5C366', '#F5C366']
const MISSION_ROW_ACCENT   = ['#FF9C4D', '#F5C366', '#FF7D52']

function MissionControlPanel({
  data,
  onNavigate,
}: {
  data: OverviewCockpitResponse | null
  onNavigate: (i: NavigationIntent) => void
}) {
  // ── Block 1: Critical Alerts — patch555 §7-1
  const critical = data?.alerts.filter((a) => a.severity === 'critical') ?? []
  // ── Block 2: Action Queue — patch555 §7-2
  const warning  = data?.alerts.filter((a) => a.severity !== 'critical') ?? []
  // ── Block 3: Next 72 Hours — patch555 §7-3
  const feed     = data?.liveFeed.slice(-3) ?? []

  return (
    <>
      {/* Block 1 */}
      <MissionPanel
        rect={MISSION_RECTS[0]}
        title="Critical Alerts"
        badge={critical.length}
        badgeHex={MISSION_BADGE_COLORS[0]}
        rows={critical.slice(0, 2).map((a) => ({
          id: a.id,
          accent: MISSION_ROW_ACCENT[0],
          primary: a.title,
          secondary: a.description,
          navIntent: a.navigationIntent,
        }))}
        onNavigate={onNavigate}
      />

      {/* Block 2 */}
      <MissionPanel
        rect={MISSION_RECTS[1]}
        title="Action Queue"
        badge={warning.length}
        badgeHex={MISSION_BADGE_COLORS[1]}
        rows={warning.slice(0, 2).map((a) => ({
          id: a.id,
          accent: MISSION_ROW_ACCENT[1],
          primary: a.title,
          secondary: a.description,
          navIntent: a.navigationIntent,
        }))}
        onNavigate={onNavigate}
      />

      {/* Block 3 */}
      <MissionPanel
        rect={MISSION_RECTS[2]}
        title="Next 72 Hours"
        badge={feed.length}
        badgeHex={MISSION_BADGE_COLORS[2]}
        subtext="Incoming"
        rows={feed.map((item: OverviewLiveFeedItem) => ({
          id: item.id,
          accent: MISSION_ROW_ACCENT[2],
          primary: item.title,
          secondary: item.subtitle || item.timestamp,
          navIntent: item.navigationIntent,
        }))}
        onNavigate={onNavigate}
      />
    </>
  )
}

function MissionPanel({
  rect,
  title,
  badge,
  badgeHex,
  subtext,
  rows,
  onNavigate,
}: {
  rect: Rect
  title: string
  badge: number
  badgeHex: string
  subtext?: string
  rows: Array<{ id: string; accent: string; primary: string; secondary?: string; navIntent: NavigationIntent }>
  onNavigate: (i: NavigationIntent) => void
}) {
  return (
    <Box
      rect={rect}
      className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(12,18,34,.95),rgba(8,13,26,.98))] px-5 py-4 shadow-panel"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="text-[16px] font-medium text-white">{title}</div>
        {badge > 0 && (
          <span
            className="inline-flex min-w-[28px] items-center justify-center rounded-full bg-white/6 px-2 py-0.5 text-hud-xs font-semibold"
            style={{ color: badgeHex }}
          >
            {badge}
          </span>
        )}
        {subtext && (
          <span className="ml-auto text-hud-2xs text-hud-textMuted">{subtext}</span>
        )}
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onNavigate(row.navIntent)}
            className="flex w-full min-h-[48px] items-start gap-3 rounded-[14px] border border-white/5 bg-[linear-gradient(180deg,rgba(17,23,42,.9),rgba(10,14,28,.95))] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div className="mt-0.5 h-[36px] w-[3px] flex-shrink-0 rounded-full" style={{ backgroundColor: row.accent }} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-white truncate">{row.primary}</div>
              {row.secondary && (
                <div className="mt-0.5 text-hud-xs text-hud-textMuted truncate">{row.secondary}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </Box>
  )
}

// ─── FlowSummary — Chain Funnel Strip (patch555 §8) ───────────────────────────

function FlowSummary({ data }: { data: OverviewCockpitResponse | null }) {
  // Sum pipeline stage counts into 6 funnel buckets
  const pipeline = data?.pipeline ?? []

  return (
    <Box
      rect={{ x: 145, y: 1168, w: 1295, h: 101 }}
      className="overflow-hidden rounded-[18px] border border-white/5 bg-[linear-gradient(180deg,rgba(11,17,31,.88),rgba(8,12,25,.95))] px-6 py-4"
    >
      {/* Glowing spline curve */}
      <svg viewBox="0 0 1295 95" className="absolute inset-0 h-full w-full pointer-events-none">
        <defs>
          <linearGradient id="flowLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="#F8D870" />
            <stop offset="20%"  stopColor="#70EAD4" />
            <stop offset="45%"  stopColor="#35D6FF" />
            <stop offset="70%"  stopColor="#7EA2FF" />
            <stop offset="100%" stopColor="#58E1C9" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M115 58 C170 54, 230 55, 275 55 S 380 45, 420 44 S 520 35, 565 36 S 640 55, 680 54 S 780 50, 820 50 S 950 58, 1000 58 S 1120 56, 1180 57"
          fill="none"
          stroke="url(#flowLine)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.9"
        />
        {/* Stage node dots */}
        {[115, 275, 420, 565, 820, 1000].map((cx, i) => (
          <circle
            key={cx}
            cx={cx}
            cy={i % 2 === 0 ? 56 : 43}
            r="8"
            fill="#171D30"
            stroke={['#F8D870', '#70EAD4', '#35D6FF', '#8A58FF', '#7EA2FF', '#58E1C9'][i]}
            strokeWidth="4"
          />
        ))}
      </svg>

      {/* Stage labels and counts */}
      <div className="absolute inset-x-0 top-[8px]">
        {STAGE_BUCKETS.map((bucket) => {
          const count = sumPipelineStages(pipeline, bucket.stageIds)
          return (
            <div
              key={bucket.label}
              className="absolute text-center"
              style={{ left: bucket.x, width: bucket.width }}
            >
              <div className="text-[20px] font-semibold tracking-[-0.03em] text-white">
                {count > 0 ? count.toLocaleString() : '—'}
              </div>
              <div className="mt-0.5 text-hud-2xs text-hud-textMuted">{bucket.label}</div>
            </div>
          )
        })}
      </div>
    </Box>
  )
}

// ─── BottomTabs ────────────────────────────────────────────────────────────────

function BottomTabs({ onNavigate: _onNavigate }: { onNavigate: (i: NavigationIntent) => void }) {
  return (
    <>
      {BOTTOM_TABS.map((tab, index) => (
        <div
          key={tab.label}
          className="absolute"
          style={{ left: tab.x, top: 1275, width: tab.w, height: 55 }}
        >
          <Link
            href={buildDashboardLink(tab.intent)}
            className={`flex h-full w-full items-center justify-center gap-3 rounded-full border no-underline text-hud-md font-medium tracking-[0.02em] text-hud-textSoft transition-colors ${
              index === 0
                ? 'border-white/8 bg-[linear-gradient(180deg,rgba(17,24,46,.96),rgba(10,16,31,.98))] shadow-panel'
                : 'border-white/6 bg-[linear-gradient(180deg,rgba(14,20,37,.82),rgba(10,14,27,.94))] hover:border-white/10'
            }`}
          >
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${index === 0 ? 'bg-[#26345A]' : 'bg-transparent'}`}>
              {tab.label === 'PIPELINE' ? <PipeIcon className="h-4 w-4 text-hud-textMuted" /> : null}
              {tab.label === 'SITES'    ? <ArrowRightIcon className="h-4 w-4 text-hud-textMuted" /> : null}
              {tab.label === 'CARGO'    ? <CubeIcon className="h-4 w-4 text-hud-textMuted" /> : null}
            </span>
            {tab.label}
            <span className="text-hud-textMuted">›</span>
          </Link>
        </div>
      ))}
    </>
  )
}

// ─── Primitive components ──────────────────────────────────────────────────────

function Box({
  rect,
  className,
  style,
  children,
  onClick,
}: {
  rect: Rect
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={`absolute ${className ?? ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  )
}

function Chip({
  x, y, w, label, active = false, icon,
}: {
  x: number; y: number; w: number; label: string; active?: boolean; icon?: React.ReactNode
}) {
  return (
    <Box
      rect={{ x, y, w, h: 38 }}
      className={`rounded-full border px-4 ${
        active
          ? 'border-[#2F76FF]/40 bg-[linear-gradient(180deg,rgba(47,118,255,.92),rgba(35,95,218,.84))] shadow-glow-blue'
          : 'border-white/6 bg-[linear-gradient(180deg,rgba(18,23,39,.92),rgba(11,16,29,.95))]'
      }`}
    >
      <div className="flex h-full items-center justify-center gap-2 text-hud-xs font-medium text-white">
        {icon}
        <span className={active ? 'text-white' : 'text-hud-textSoft'}>{label}</span>
        {!active && <span className="text-hud-textMuted">▼</span>}
      </div>
    </Box>
  )
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="grid h-[26px] w-[26px] place-items-center rounded-full border border-white/10 bg-transparent text-hud-textMuted">
      {icon}
    </div>
  )
}

function LegendItem({
  color, title, subtitle, bulb = false, hollow = false, square = false, small = false,
}: {
  color: string; title: string; subtitle: string; bulb?: boolean; hollow?: boolean; square?: boolean; small?: boolean
}) {
  const size = small ? 10 : 12
  const shared = { width: size, height: size }
  return (
    <div className="flex items-center gap-3">
      {square ? (
        <span className="inline-block rounded-sm" style={{ ...shared, backgroundColor: color }} />
      ) : hollow ? (
        <span className="inline-block rounded-full border" style={{ ...shared, borderColor: color }} />
      ) : bulb ? (
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{ ...shared, backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        </span>
      ) : (
        <span className="inline-block rounded-full" style={{ ...shared, backgroundColor: color }} />
      )}
      <span className="font-medium text-white">{title}</span>
      {subtitle && <span className="text-hud-textMuted">- {subtitle}</span>}
    </div>
  )
}

// ─── useArtboardScale ──────────────────────────────────────────────────────────

function useArtboardScale(
  ref: React.RefObject<HTMLDivElement | null>,
  designWidth: number,
  _designHeight: number,
) {
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      // Width-first: fill the viewport width, allow vertical scroll for the rest
      setScale(node.clientWidth / designWidth)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [designWidth, ref])

  return scale
}

// ─── Inline SVG icon set (no external dependency) ─────────────────────────────

function SearchIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.3" />
      <path d="M16.2 16.2L20 20" strokeLinecap="round" />
    </svg>
  )
}
function MiniWindowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="4.5" width="14" height="15" rx="2.5" />
      <path d="M8 8.5h8" />
    </svg>
  )
}
function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M9.5 14.5l1.2-4.2 4.2-1.2-1.2 4.2-4.2 1.2z" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.4-1.6 1.9-2.4 2.7-.5.5-.6.9-.6 1.3" />
      <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function CubeIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.8l7 4v8.4l-7 4-7-4V7.8l7-4z" />
      <path d="M12 12l7-4M12 12L5 8M12 12v8.2" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7.5h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" />
    </svg>
  )
}
function ShipIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 14.8l2.2 3h11.6l2.2-3-8-7-8 7z" />
      <path d="M6.5 18.2c1 .9 2 .9 3 0 1 .9 2 .9 3 0 1 .9 2 .9 3 0 1 .9 2 .9 3 0" strokeLinecap="round" />
    </svg>
  )
}
function ThumbIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M9.8 10.2V6.6c0-1.9 1-3.6 2.7-4.5l.8-.4.9 1.6-.8.4c-.8.4-1.3 1.3-1.3 2.2v4.3h6.1c1.4 0 2.4 1.3 2.1 2.6l-1.5 6.4a2.4 2.4 0 0 1-2.3 1.9H9.4a2.4 2.4 0 0 1-2.4-2.4V10.2h2.8zM3 10.6h2.5v10.2H3z" />
    </svg>
  )
}
function PipeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h8a4 4 0 0 0 4-4V4" />
      <path d="M4 8v8" />
      <path d="M16 4h4v4" />
    </svg>
  )
}
function ArrowRightIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}
