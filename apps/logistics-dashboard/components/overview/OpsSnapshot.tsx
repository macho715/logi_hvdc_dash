'use client'

import { cn } from '@/lib/utils'
import { gateClassLight, SITE_META, getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { PIPELINE_STAGE_META } from '@/lib/cases/pipelineStage'
import { useT } from '@/hooks/useT'
import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

interface OpsSnapshotProps {
  data: OverviewCockpitResponse | null
  worklist: WorklistRow[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--ops-surface)] border border-[var(--ops-border)] p-3">
      <h3 className="text-[13px] font-semibold text-[var(--ops-text-strong)] mb-2">{title}</h3>
      {children}
    </div>
  )
}

export function OpsSnapshot({ data, worklist, loading, onNavigate }: OpsSnapshotProps) {
  const t = useT()

  if (loading && !data) {
    return (
      <div className="bg-[var(--ops-surface-warm)] border-t border-[var(--ops-border)] px-4 py-4">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 h-36 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // ── WH Pressure ────────────────────────────────────────────────────────────
  const whItems = data?.warehousePressure ?? []
  const topWhItems = whItems.slice(0, 3)
  const maxSqm = topWhItems.reduce((acc, item) => Math.max(acc, item.sqm), 1)

  // ── Worklist ────────────────────────────────────────────────────────────────
  const highlightedIds = data?.worklist.highlightedIds ?? []
  const highlightedIdSet = new Set(highlightedIds)
  const priorityWorklist = worklist
    .filter((row) => highlightedIdSet.has(row.id))
    .sort((a, b) => highlightedIds.indexOf(a.id) - highlightedIds.indexOf(b.id))
    .slice(0, 5)

  // ── Alerts ──────────────────────────────────────────────────────────────────
  const topAlerts = (data?.alerts ?? []).slice(0, 3)

  // ── Live Feed ───────────────────────────────────────────────────────────────
  const recentFeed = (data?.liveFeed ?? []).slice(-4).reverse()

  return (
    <div className="bg-[var(--ops-surface-warm)] border-t border-[var(--ops-border)] px-4 py-4">
      <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)] mb-4">
        {t.opsSnapshot.title}
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Subsection 1: WH Pressure */}
        <SectionCard title={t.opsSnapshot.whPressure}>
          {topWhItems.length === 0 ? (
            <p className="text-[12px] text-[var(--ops-text-muted)]">{t.common.noData}</p>
          ) : (
            <div className="space-y-2">
              {topWhItems.map((item) => (
                <button
                  key={item.location}
                  type="button"
                  onClick={() => onNavigate(item.navigationIntent)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] text-[var(--ops-text-strong)] font-medium">
                      {item.location}
                    </span>
                    <span className="text-[11px] text-[var(--ops-text-muted)]">
                      {item.sqm.toLocaleString()} sqm
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--ops-border)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--ops-warn)]"
                      style={{ width: `${Math.min(100, (item.sqm / maxSqm) * 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Subsection 2: Worklist */}
        <SectionCard title={t.opsSnapshot.worklist}>
          {priorityWorklist.length === 0 ? (
            <p className="text-[12px] text-[var(--ops-text-muted)]">{t.bottomPanel.noWorklist}</p>
          ) : (
            <div className="max-h-[160px] overflow-y-auto space-y-1">
              {priorityWorklist.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    onNavigate({
                      destinationId: 'ops-snapshot-worklist-item',
                      page: 'cargo',
                      params: { tab: 'wh', caseId: row.id },
                    })
                  }
                  className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--ops-canvas)] transition-colors text-left"
                >
                  <span className="text-[12px] text-[var(--ops-text-strong)] truncate flex-1">
                    {row.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
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
              ))}
            </div>
          )}
        </SectionCard>

        {/* Subsection 3: Exceptions */}
        <SectionCard title={t.opsSnapshot.exceptions}>
          {topAlerts.length === 0 ? (
            <p className="text-[12px] text-[var(--ops-text-muted)]">{t.common.noData}</p>
          ) : (
            <div className="space-y-2">
              {topAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => onNavigate(alert.navigationIntent)}
                  className={cn(
                    'w-full text-left border-l-2 pl-2',
                    alert.severity === 'critical' && 'border-l-[var(--ops-risk)]',
                    alert.severity === 'warning' && 'border-l-[var(--ops-warn)]',
                    alert.severity === 'info' && 'border-l-[var(--ops-info)]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--ops-text-strong)] font-medium truncate">
                      {alert.title}
                    </span>
                    {alert.count > 0 ? (
                      <span className="text-[11px] text-[var(--ops-text-muted)] shrink-0">
                        {alert.count}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Subsection 4: Recent Feed */}
        <SectionCard title={t.opsSnapshot.recentFeed}>
          {recentFeed.length === 0 ? (
            <p className="text-[12px] text-[var(--ops-text-muted)]">{t.common.noData}</p>
          ) : (
            <div className="space-y-2">
              {recentFeed.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.navigationIntent)}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                >
                  <div className="text-sm text-[var(--ops-text-strong)] truncate">{item.title}</div>
                  <div className="text-[11px] text-[var(--ops-text-muted)]">
                    {formatDistanceToNowStrict(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
