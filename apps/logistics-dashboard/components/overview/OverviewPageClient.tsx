'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewBottomPanel } from '@/components/overview/OverviewBottomPanel'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'
import { NewVoyageModal } from './NewVoyageModal'
import { OverviewToolbar } from './OverviewToolbar'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useT } from '@/hooks/useT'
import type { NavigationIntent } from '@/types/overview'

export function OverviewPageClient() {
  const router = useRouter()
  const t = useT()
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [showNewVoyageModal, setShowNewVoyageModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const setHighlightedShipmentId = useLogisticsStore((s) => s.setHighlightedShipmentId)
  const { data, loading, error, worklist } = useOverviewData({ refreshKey })

  const handleNavigate = (intent: NavigationIntent) => {
    router.push(buildDashboardLink(intent))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <OverviewToolbar
        onShipmentSelect={(sctShipNo) => setSelectedShipmentId(sctShipNo)}
        onNewVoyageClick={() => setShowNewVoyageModal(true)}
      />
      <KpiStripCards metrics={data?.hero.metrics ?? []} loading={loading} onNavigate={handleNavigate} />
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="min-h-[360px] flex-1">
          <OverviewMap onNavigateIntent={handleNavigate} />
        </div>
        <OverviewRightPanel
          data={data}
          loading={loading}
          onNavigate={handleNavigate}
          selectedShipmentId={selectedShipmentId}
          onClearSelection={() => {
            setSelectedShipmentId(null)
            setHighlightedShipmentId(null)
          }}
        />
      </div>
      <OverviewBottomPanel data={data} loading={loading} worklist={worklist} onNavigate={handleNavigate} />
      {error ? (
        <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200" aria-live="polite">
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
