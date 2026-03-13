'use client'

import { useRouter } from 'next/navigation'
import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewBottomPanel } from '@/components/overview/OverviewBottomPanel'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'
import { useOverviewData } from '@/hooks/useOverviewData'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import type { NavigationIntent } from '@/types/overview'

export function OverviewPageClient() {
  const router = useRouter()
  const { data, loading, error, worklist } = useOverviewData()

  const handleNavigate = (intent: NavigationIntent) => {
    router.push(buildDashboardLink(intent))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <KpiStripCards metrics={data?.hero.metrics ?? []} loading={loading} onNavigate={handleNavigate} />
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="min-h-[360px] flex-1">
          <OverviewMap onNavigateIntent={handleNavigate} />
        </div>
        <OverviewRightPanel data={data} loading={loading} onNavigate={handleNavigate} />
      </div>
      <OverviewBottomPanel data={data} loading={loading} worklist={worklist} onNavigate={handleNavigate} />
      {error ? (
        <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200" aria-live="polite">
          Overview 데이터를 새로고침하지 못했습니다: {error}
        </div>
      ) : null}
    </div>
  )
}
