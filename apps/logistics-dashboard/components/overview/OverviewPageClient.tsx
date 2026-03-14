'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { NewVoyageModal } from './NewVoyageModal'
import { OverviewToolbar } from './OverviewToolbar'
import { ProgramFilterBar } from '@/components/overview/ProgramFilterBar'
import { ChainRibbonStrip } from '@/components/overview/ChainRibbonStrip'
import { MissionControl } from '@/components/overview/MissionControl'
import { SiteDeliveryMatrix } from '@/components/overview/SiteDeliveryMatrix'
import { OpenRadarTable } from '@/components/overview/OpenRadarTable'
import { OpsSnapshot } from '@/components/overview/OpsSnapshot'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
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
  const { data, loading, error, worklist } = useOverviewData({ refreshKey })

  const handleNavigate = (intent: NavigationIntent) => {
    router.push(buildDashboardLink(intent))
  }

  return (
    <div className="flex h-full flex-col overflow-auto bg-[#071225] text-slate-100">
      {/* Row 1: Existing toolbar */}
      <OverviewToolbar
        onShipmentSelect={(sctShipNo) => setSelectedShipmentId(sctShipNo)}
        onNewVoyageClick={() => setShowNewVoyageModal(true)}
      />

      {/* Row 2: Program filter bar */}
      <ProgramFilterBar
        mode={dashMode}
        onModeChange={setDashMode}
        selectedSite={filterSite}
        onSiteChange={setFilterSite}
        updatedAt={data?.generatedAt ?? ''}
      />

      {/* Row 3: 8 KPI cards */}
      <KpiStripCards
        metrics={data?.hero.metrics ?? []}
        loading={loading}
        onNavigate={handleNavigate}
      />

      {/* Row 4: Chain ribbon */}
      <ChainRibbonStrip
        site={filterSite ?? undefined}
        onStageClick={(stage: PipelineStage) => setActivePipelineStage(stage)}
      />

      {/* Row 5: Map + Mission Control */}
      <div className="grid min-h-[480px] xl:grid-cols-[2fr_1fr]">
        <OverviewMap onNavigateIntent={handleNavigate} />
        <MissionControl
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

      {/* Row 6: Site delivery matrix */}
      <SiteDeliveryMatrix
        siteReadiness={data?.siteReadiness ?? []}
        loading={loading}
        onNavigate={handleNavigate}
      />

      {/* Row 7: Open radar + Ops snapshot */}
      <div className="grid xl:grid-cols-[7fr_5fr]">
        <OpenRadarTable
          worklist={worklist}
          data={data}
          loading={loading}
          onNavigate={handleNavigate}
        />
        <OpsSnapshot
          data={data}
          worklist={worklist}
          loading={loading}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Error bar */}
      {error ? (
        <div className="border-t border-red-500/20 bg-red-50 px-4 py-2 text-xs text-red-600" aria-live="polite">
          {t.overviewMap.refreshError} {error}
        </div>
      ) : null}

      {/* New voyage modal */}
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
