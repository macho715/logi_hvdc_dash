'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FlowChain } from '@/components/chain/FlowChain'
import { PageContextBanner } from '@/components/navigation/PageContextBanner'
import { FlowCodeDonut } from '@/components/pipeline/FlowCodeDonut'
import { FlowPipeline } from '@/components/pipeline/FlowPipeline'
import { PipelineTableWrapper } from '@/components/pipeline/PipelineTableWrapper'
import { VendorBar } from '@/components/pipeline/VendorBar'
import { TransportModeBar } from '@/components/pipeline/TransportModeBar'
import { CustomsStatusCard } from '@/components/pipeline/CustomsStatusCard'
import { WarehouseSqmBar } from '@/components/pipeline/WarehouseSqmBar'
import { buildDashboardLink, getPageContextChips, parsePipelineQuery } from '@/lib/navigation/contracts'
import { ui } from '@/lib/overview/ui'
import { useCasesStore } from '@/store/casesStore'
import type { PipelineTableFilters } from '@/components/pipeline/PipelineCasesTable'
import type { OverviewRouteTypeId } from '@/types/overview'

const DEFAULT_FILTERS: PipelineTableFilters = {
  site: 'all',
  vendor: 'all',
  category: 'all',
}

export function PipelinePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = parsePipelineQuery(searchParams)
  const setActivePipelineStage = useCasesStore((state) => state.setActivePipelineStage)

  useEffect(() => {
    setActivePipelineStage(query.stage ?? null)
  }, [query.stage, setActivePipelineStage])

  const filters: PipelineTableFilters = {
    site: query.site ?? DEFAULT_FILTERS.site,
    vendor: query.vendor ?? DEFAULT_FILTERS.vendor,
    category: query.category ?? DEFAULT_FILTERS.category,
  }

  const replaceQuery = (patch: {
    stage?: typeof query.stage
    site?: typeof query.site
    vendor?: typeof query.vendor
    category?: typeof query.category
    route_type?: OverviewRouteTypeId
  }) => {
    router.replace(
      buildDashboardLink({
        page: 'pipeline',
        params: {
          ...query,
          ...patch,
        },
      }),
      { scroll: false },
    )
  }

  const handleFilterChange = <K extends keyof PipelineTableFilters>(key: K, value: PipelineTableFilters[K]) => {
    replaceQuery({
      [key]: value === 'all' ? undefined : value,
    } as {
      stage?: typeof query.stage
      site?: typeof query.site
      vendor?: typeof query.vendor
      category?: typeof query.category
      route_type?: OverviewRouteTypeId
    })
  }

  return (
    <div className={`flex h-full flex-col ${ui.pageShell}`}>
      <div className={`${ui.pageContent} ${ui.pageStack}`}>
        <PageContextBanner
          title="Pipeline Context"
          description="Overview에서 넘어온 단계/현장/경로 조건을 URL 기준으로 복원합니다."
          chips={getPageContextChips('pipeline', query)}
        />
        <FlowChain compact />
        <FlowPipeline
          activeStage={query.stage ?? null}
          onStageChange={(stage) => replaceQuery({ stage: stage ?? undefined })}
        />
        <PipelineTableWrapper
          stage={query.stage ?? null}
          routeType={query.route_type}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => replaceQuery({ site: undefined, vendor: undefined, category: undefined })}
        />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <FlowCodeDonut
            selectedRouteType={query.route_type}
            onRouteTypeSelect={(routeType) => replaceQuery({ route_type: routeType })}
          />
          <VendorBar />
          <TransportModeBar />
          <CustomsStatusCard />
          <WarehouseSqmBar />
        </div>
      </div>
    </div>
  )
}
