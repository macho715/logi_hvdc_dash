import { KpiStripCards } from '@/components/overview/KpiStripCards'
import { OverviewMap } from '@/components/overview/OverviewMap'
import { OverviewRightPanel } from '@/components/overview/OverviewRightPanel'

export default function OverviewPage() {
  return (
    <div className="flex flex-col h-full">
      <KpiStripCards />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1">
          <OverviewMap />
        </div>
        <OverviewRightPanel />
      </div>
    </div>
  )
}
