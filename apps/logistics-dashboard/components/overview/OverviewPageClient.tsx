'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewBottomPanel } from '@/components/overview/OverviewBottomPanel'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'
import { OverviewToolbar } from './OverviewToolbar'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { useLogisticsStore } from '@/store/logisticsStore'
import type { NavigationIntent } from '@/types/overview'

export function OverviewPageClient() {
  const router = useRouter()
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
          Overview 데이터를 새로고침하지 못했습니다: {error}
        </div>
      ) : null}
      {/* NewVoyageModal will be wired here in Task 12 */}
      {showNewVoyageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <p>신규 항차 모달 (구현 중)</p>
            <button onClick={() => setShowNewVoyageModal(false)} className="mt-4 text-sm text-gray-400">닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
