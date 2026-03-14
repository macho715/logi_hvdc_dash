/**
 * @deprecated Replaced by OpsSnapshot + OpenRadarTable in Overview 2.0.
 * This file is preserved for reference. Do not use in new pages.
 * @see components/overview/OpsSnapshot.tsx
 * @see components/overview/OpenRadarTable.tsx
 */
'use client'

import { PIPELINE_STAGE_META } from '@/lib/cases/pipelineStage'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass, SITE_META } from '@/lib/overview/ui'
import { cn } from '@/lib/utils'
import type { WorklistRow } from '@repo/shared'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import { useT } from '@/hooks/useT'

interface OverviewBottomPanelProps {
  data: OverviewCockpitResponse | null
  worklist: WorklistRow[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function gateClass(gate: WorklistRow['gate']): string {
  if (gate === 'ZERO' || gate === 'RED') return 'text-red-300'
  if (gate === 'AMBER') return 'text-amber-300'
  return 'text-emerald-300'
}

function buildWorklistIntent(row: WorklistRow): NavigationIntent {
  return {
    destinationId: 'worklist-item',
    page: 'cargo',
    params: {
      tab: 'wh',
      caseId: row.id,
      ...(row.finalLocation === 'SHU' || row.finalLocation === 'MIR' || row.finalLocation === 'DAS' || row.finalLocation === 'AGI'
        ? { site: row.finalLocation }
        : {}),
      ...(typeof row.flowCode === 'number'
        ? { route_type: getRouteTypeIdFromFlowCode(row.flowCode) }
        : {}),
    },
  }
}

export function OverviewBottomPanel({
  data,
  worklist,
  loading = false,
  onNavigate,
}: OverviewBottomPanelProps) {
  const t = useT()

  if (loading && !data) {
    return <div className="border-t border-gray-800 bg-gray-950/60 p-4" />
  }

  const highlightedIds = new Set(data?.worklist.highlightedIds ?? [])
  const highlightedRows = worklist
    .filter((row) => highlightedIds.has(row.id))
    .sort((left, right) => {
      const leftIndex = data?.worklist.highlightedIds.indexOf(left.id) ?? 0
      const rightIndex = data?.worklist.highlightedIds.indexOf(right.id) ?? 0
      return leftIndex - rightIndex
    })

  return (
    <section className="border-t border-gray-800 bg-gray-950/60 p-4">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{t.bottomPanel.stagePipeline}</h2>
            <p className="text-xs text-gray-500">{t.bottomPanel.stagePipelineDesc}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {data?.pipeline.map((item) => (
              <button
                key={item.stage}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="rounded-2xl border border-gray-800 bg-gray-900/70 p-3 text-left transition-colors hover:border-gray-700"
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{PIPELINE_STAGE_META[item.stage].label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{item.count.toLocaleString()}</div>
                <div className="mt-1 text-xs text-gray-400">{item.percent.toFixed(1)}%</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{t.bottomPanel.priorityWorklist}</h2>
            <p className="text-xs text-gray-500">{t.bottomPanel.priorityWorklistDesc}</p>
          </div>
          <div className="max-h-[160px] overflow-y-auto space-y-2">
            {highlightedRows.map((row) => {
              const routeTypeId = typeof row.flowCode === 'number'
                ? getRouteTypeIdFromFlowCode(row.flowCode)
                : undefined
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onNavigate(buildWorklistIntent(row))}
                  className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 p-3 text-left transition-colors hover:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{row.title}</div>
                      <div className="mt-1 text-xs text-gray-400">{row.subtitle ?? row.currentLocation ?? t.bottomPanel.noLocation}</div>
                    </div>
                    <div className={cn('text-xs font-semibold', gateClass(row.gate))}>{row.gate}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {row.finalLocation && row.finalLocation in SITE_META ? (
                      <span className={cn('rounded-full border px-2 py-1', SITE_META[row.finalLocation as keyof typeof SITE_META].accentClass)}>
                        {row.finalLocation}
                      </span>
                    ) : null}
                    {routeTypeId ? (
                      <span className={cn('rounded-full border px-2 py-1', getRouteTypeBadgeClass(routeTypeId))}>
                        {getRouteTypeLabel(routeTypeId)}
                      </span>
                    ) : null}
                    {row.dueAt ? (
                      <span className="rounded-full border border-gray-700 px-2 py-1 text-gray-400">
                        {t.bottomPanel.dueAt} {row.dueAt}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
            {!loading && highlightedRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">
                {t.bottomPanel.noWorklist}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
