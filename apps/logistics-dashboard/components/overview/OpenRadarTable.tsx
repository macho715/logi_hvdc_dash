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
      <div className="border-t border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-4">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-4">
      <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)]">
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
              'px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-100',
              activeFilter === key
                ? 'bg-[var(--ops-info)] text-white border-[var(--ops-info)]'
                : 'text-[var(--ops-text-muted)] border-[var(--ops-border)] hover:border-[var(--ops-info)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[380px] space-y-1">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--ops-border)] bg-[var(--ops-canvas)] py-6 text-center text-sm text-[var(--ops-text-muted)]">
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
                className="w-full flex items-start gap-3 rounded-lg border border-[var(--ops-border)] bg-[var(--ops-surface)] px-3 py-2 cursor-pointer hover:shadow-sm transition-shadow duration-[140ms] text-left"
              >
                {/* Left: title + subtitle */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--ops-text-strong)] truncate">
                    {row.title}
                  </div>
                  <div className="text-[11px] text-[var(--ops-text-muted)] truncate">
                    {row.subtitle ?? row.currentLocation ?? t.bottomPanel.noLocation}
                  </div>
                </div>

                {/* Right: chips */}
                <div className="flex flex-wrap items-center gap-1 justify-end shrink-0">
                  {siteMeta ? (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        siteMeta.chipClass,
                      )}
                    >
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

                  <span className={cn('text-[11px]', gateClassLight(row.gate))}>
                    {row.gate}
                  </span>

                  {row.dueAt ? (
                    <span className="text-[11px] text-[var(--ops-text-muted)] whitespace-nowrap">
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
