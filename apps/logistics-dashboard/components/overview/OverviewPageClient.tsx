'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { NewVoyageModal } from './NewVoyageModal'
import { OverviewToolbar } from './OverviewToolbar'
import { ProgramFilterBar } from '@/components/overview/ProgramFilterBar'
import { ChainRibbonStrip } from '@/components/overview/ChainRibbonStrip'
import { SiteDeliveryMatrix } from '@/components/overview/SiteDeliveryMatrix'
import { MissionControlFloat } from '@/components/overview/MissionControlFloat'
import { VoyageExceptionRadar } from '@/components/overview/VoyageExceptionRadar'
import { BottomCollapsePanel } from '@/components/overview/BottomCollapsePanel'
import Link from 'next/link'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import { ui } from '@/lib/overview/ui'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import type { NavigationIntent } from '@/types/overview'

export function OverviewPageClient() {
  const router = useRouter()
  const t = useT()
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [showNewVoyageModal, setShowNewVoyageModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dashMode, setDashMode] = useState<'program' | 'ops'>('program')
  const [filterSite, setFilterSite] = useState<'SHU' | 'MIR' | 'DAS' | 'AGI' | null>(null)
  const highlightedShipmentId = useLogisticsStore((s) => s.highlightedShipmentId)
  const setHighlightedShipmentId = useLogisticsStore((s) => s.setHighlightedShipmentId)
  const setActivePipelineStage = useCasesStore((s) => s.setActivePipelineStage)
  const { data, loading, error, worklist } = useOverviewData({ refreshKey, primeWorklist: true })

  const handleNavigate = (intent: NavigationIntent) => {
    router.push(buildDashboardLink(intent))
  }

  return (
    <div className={`flex h-full flex-col overflow-auto ${ui.pageShell}`}>
      <OverviewToolbar
        onShipmentSelect={(sctShipNo) => {
          setSelectedShipmentId(sctShipNo)
          setHighlightedShipmentId(sctShipNo)
        }}
        onNewVoyageClick={() => setShowNewVoyageModal(true)}
      />

      <ProgramFilterBar
        mode={dashMode}
        onModeChange={setDashMode}
        selectedSite={filterSite}
        onSiteChange={setFilterSite}
        updatedAt={data?.generatedAt ?? ''}
      />

      <KpiStripCards
        metrics={data?.hero.metrics ?? []}
        loading={loading}
        onNavigate={handleNavigate}
      />

      <ChainRibbonStrip
        site={filterSite ?? undefined}
        onStageClick={(stage: PipelineStage) => setActivePipelineStage(stage)}
      />

      <div className="relative min-h-[520px] xl:min-h-[600px]">
        <OverviewMap
          snapshot={data?.map ?? null}
          onNavigateIntent={handleNavigate}
          siteFilter={filterSite ?? undefined}
        />
        <MissionControlFloat
          data={data}
          loading={loading}
          worklist={worklist}
          onNavigate={handleNavigate}
          selectedShipmentId={highlightedShipmentId}
          onClearSelection={() => {
            setSelectedShipmentId(null)
            setHighlightedShipmentId(null)
          }}
        />
      </div>

      <BottomCollapsePanel
        siteReadiness={data?.siteReadiness ?? []}
        alerts={data?.alerts ?? []}
        loading={loading}
        onNavigate={handleNavigate}
        renderSiteMatrix={() => (
          <SiteDeliveryMatrix
            siteReadiness={data?.siteReadiness ?? []}
            loading={loading}
            onNavigate={handleNavigate}
          />
        )}
        renderVoyageRadar={() => (
          <VoyageExceptionRadar
            alerts={data?.alerts ?? []}
            loading={loading}
            onNavigate={handleNavigate}
          />
        )}
      />

      {/* Row 5 — Bottom Nav */}
      <nav className="flex flex-wrap items-center gap-2 border-t border-hvdc-border-soft px-4 py-3">
        {[
          { href: '/chain',    label: 'Logistics Chain' },
          { href: '/pipeline', label: 'Pipeline' },
          { href: '/sites',    label: 'Sites' },
          { href: '/cargo',    label: 'Cargo' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-hvdc-border-soft bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-hvdc-text-secondary transition-colors hover:bg-white/[0.06] hover:text-hvdc-text-primary"
          >
            {label}
          </Link>
        ))}
      </nav>

      {error ? (
        <div className="border-t border-red-500/20 bg-red-50 px-4 py-2 text-xs text-red-600" aria-live="polite">
          {t.overviewMap.refreshError} {error}
        </div>
      ) : null}

      <NewVoyageModal
        open={showNewVoyageModal}
        onClose={() => setShowNewVoyageModal(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          setShowNewVoyageModal(false)
        }}
      />
    </div>
  )
}
