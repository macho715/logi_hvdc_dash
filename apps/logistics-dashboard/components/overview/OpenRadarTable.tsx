'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { gateClassLight, SITE_META, getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

type RadarFilter = 'all' | 'critical' | 'amber' | 'overdue'

interface OpenRadarTableProps {
  worklist: WorklistRow[]
  data: OverviewCockpitResponse | null
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

export function OpenRadarTable({ worklist, data, loading, onNavigate }: OpenRadarTableProps) {
  const t = useT()
  const [activeFilter, setActiveFilter] = useState<RadarFilter>('all')

  const filters: { key: RadarFilter; label: string }[] = [
    { key: 'all', label: t.openRadar.filterAll },
    { key: 'critical', label: t.openRadar.filterCritical },
    { key: 'amber', label: t.openRadar.filterAmber },
    { key: 'overdue', label: t.openRadar.filterOverdue },
  ]

  const highlightedIds = data?.worklist.highlightedIds ?? []
  const highlightedIdSet = new Set(highlightedIds)

  const now = new Date()
  const filtered = worklist
    .filter((row) => {
      if (activeFilter === 'critical') return row.gate === 'RED' || row.gate === 'ZERO'
      if (activeFilter === 'amber') return row.gate === 'AMBER'
      if (activeFilter === 'overdue') return !!row.dueAt && new Date(row.dueAt) < now
      return true
    })
    .sort((a, b) => {
      const aHighlighted = highlightedIdSet.has(a.id)
      const bHighlighted = highlightedIdSet.has(b.id)
      if (aHighlighted && bHighlighted) {
        return highlightedIds.indexOf(a.id) - highlightedIds.indexOf(b.id)
      }
      if (aHighlighted) return -1
      if (bHighlighted) return 1
      // Sort by gate severity: ZERO/RED > AMBER > GREEN
      const gateSeverity = (gate: WorklistRow['gate']) => {
        if (gate === 'ZERO' || gate === 'RED') return 0
        if (gate === 'AMBER') return 1
        return 2
      }
      return gateSeverity(a.gate) - gateSeverity(b.gate)
    })
    .slice(0, 50)

  if (loading && !data) {
    return (
      <div className="border-t border-white/8 bg-[#071225] px-4 py-4">
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-white/8 bg-[#071225] px-4 py-4">
      <h2 className="text-[16px] font-semibold text-white">
        {t.openRadar.title}
      </h2>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-2 mb-3">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={cn(
              'px-3 py-1 rounded-full text-[12px] font-semibold transition-colors duration-100',
              activeFilter === key
                ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                : 'border border-white/8 bg-white/5 text-slate-400 hover:border-[#2563EB]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[540px] space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/8 bg-white/[0.02] py-6 text-center text-sm text-slate-400">
            {t.openRadar.noItems}
          </div>
        ) : (
          filtered.map((row) => {
            const routeTypeId =
              typeof row.flowCode === 'number'
                ? getRouteTypeIdFromFlowCode(row.flowCode)
                : undefined

            const siteMeta =
              row.finalLocation && row.finalLocation in SITE_META
                ? SITE_META[row.finalLocation as keyof typeof SITE_META]
                : null

            return (
              <button
                key={row.id}
                type="button"
                onClick={() =>
                  onNavigate({
                    destinationId: 'open-radar-item',
                    page: 'cargo',
                    params: { tab: 'wh', caseId: row.id },
                  })
                }
                className={cn(
                  'w-full flex items-start gap-3 rounded-xl px-4 py-3.5 cursor-pointer transition-colors duration-150 text-left',
                  highlightedIdSet.has(row.id)
                    ? 'border border-[#3B82F6]/40 bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/20'
                    : 'border border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                {/* Left: title + subtitle */}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-white truncate">
                    {row.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {row.subtitle ?? row.currentLocation ?? t.bottomPanel.noLocation}
                  </div>
                </div>

                {/* Right: chips */}
                <div className="flex flex-wrap items-center gap-1 justify-end shrink-0">
                  {siteMeta ? (
                    <span className={siteMeta.chipClass}>
                      {row.finalLocation}
                    </span>
                  ) : null}

                  {routeTypeId ? (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11px]',
                        getRouteTypeBadgeClass(routeTypeId),
                      )}
                    >
                      {getRouteTypeLabel(routeTypeId)}
                    </span>
                  ) : null}

                  <span className={gateClassLight(row.gate)}>
                    {row.gate}
                  </span>

                  {row.dueAt ? (
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {t.bottomPanel.dueAt} {row.dueAt}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
