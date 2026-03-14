'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { gateClassLight, SITE_META, getRouteTypeBadgeClass, ui } from '@/lib/overview/ui'
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
      <div className="border-t border-hvdc-border-soft bg-hvdc-bg-page px-4 py-4">
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
    <div className="border-t border-hvdc-border-soft bg-hvdc-bg-page px-4 py-4">
      <h2 className={ui.sectionTitle}>
        {t.openRadar.title}
      </h2>

      {/* Filter tabs */}
      <div className="mt-2 mb-5 flex gap-2.5">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={cn(
              'rounded-full px-3 py-1 text-[12px] font-semibold transition-colors duration-100',
              activeFilter === key
                ? 'border border-hvdc-brand bg-hvdc-brand text-white shadow-hvdc-active'
                : 'border border-hvdc-border-soft bg-hvdc-surface-subtle text-hvdc-text-secondary hover:border-hvdc-brand',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[540px] space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hvdc-border-soft bg-hvdc-surface-subtle py-6 text-center text-sm text-hvdc-text-secondary">
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
                  'flex w-full cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-150',
                  highlightedIdSet.has(row.id)
                    ? `${ui.rowSelected} border-hvdc-brand/40 bg-hvdc-brand/10 ring-hvdc-brand/20`
                    : ui.row
                )}
              >
                {/* Left: title + subtitle */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-hvdc-text-primary">
                    {row.title}
                  </div>
                  <div className="truncate text-[11px] text-hvdc-text-secondary">
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
                    <span className="whitespace-nowrap text-[11px] text-hvdc-text-secondary">
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
