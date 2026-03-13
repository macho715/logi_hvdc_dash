'use client'

import type { OverviewRouteTypeId } from '@/types/overview'
import type { PipelineStage } from '@/types/cases'
import { PipelineCasesTable, type PipelineTableFilters } from '@/components/pipeline/PipelineCasesTable'
import { PipelineFilterBar } from '@/components/pipeline/PipelineFilterBar'

interface PipelineTableWrapperProps {
  stage: PipelineStage | null
  filters: PipelineTableFilters
  routeType?: OverviewRouteTypeId
  onFilterChange: <K extends keyof PipelineTableFilters>(key: K, value: PipelineTableFilters[K]) => void
  onResetFilters: () => void
}

export function PipelineTableWrapper({
  stage,
  filters,
  routeType,
  onFilterChange,
  onResetFilters,
}: PipelineTableWrapperProps) {
  return (
    <div className="space-y-4">
      <PipelineFilterBar
        filters={filters}
        setFilter={onFilterChange}
        resetFilters={onResetFilters}
      />
      <PipelineCasesTable stage={stage} filters={filters} routeType={routeType} />
    </div>
  )
}
