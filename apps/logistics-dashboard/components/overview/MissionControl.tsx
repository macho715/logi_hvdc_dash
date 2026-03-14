'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { SITE_META, getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

interface MissionControlProps {
  data: OverviewCockpitResponse | null
  loading?: boolean
  worklist: WorklistRow[]
  onNavigate: (intent: NavigationIntent) => void
  selectedShipmentId?: string | null
  onClearSelection?: () => void
}

interface ShipmentDetailRow {
  sct_ship_no: string
  vendor: string
  voyage_stage: string
  eta: string | null
  pol: string | null
  pod: string | null
}

function ShipmentDetailCard({ sctShipNo, onClear }: { sctShipNo: string; onClear?: () => void }) {
  const t = useT()
  const [detail, setDetail] = useState<ShipmentDetailRow | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    setLoadingDetail(true)
    setFetchError(false)
    fetch(`/api/shipments?sct_ship_no=${encodeURIComponent(sctShipNo)}&pageSize=1`)
      .then((r) => r.json())
      .then((j: { data: ShipmentDetailRow[] }) => {
        setDetail(j.data[0] ?? null)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoadingDetail(false))
  }, [sctShipNo])

  return (
    <div className="rounded-xl border border-[var(--ops-info)] bg-blue-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--ops-info)]">{t.rightPanel.searchResult}</span>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-[var(--ops-text-muted)] hover:text-[var(--ops-text-strong)]"
            aria-label={t.rightPanel.close}
          >
            ×
          </button>
        )}
      </div>
      {loadingDetail && (
        <div className="text-xs text-[var(--ops-text-muted)]">{t.rightPanel.loading}</div>
      )}
      {!loadingDetail && fetchError && (
        <div className="text-xs text-[var(--ops-risk)]">{t.rightPanel.fetchError}</div>
      )}
      {!loadingDetail && !fetchError && detail == null && (
        <div className="text-xs text-[var(--ops-text-muted)]">{t.rightPanel.noResult}</div>
      )}
      {!loadingDetail && detail != null && (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--ops-text-strong)]">{detail.sct_ship_no}</div>
          <div className="text-xs text-[var(--ops-text-muted)]">{detail.vendor}</div>
          <div className="text-xs text-[var(--ops-text-muted)]">
            {t.rightPanel.stage}: {t.voyageStage[detail.voyage_stage as keyof typeof t.voyageStage] ?? detail.voyage_stage}
          </div>
          {detail.eta && (
            <div className="text-xs text-[var(--ops-text-muted)]">ETA: {detail.eta}</div>
          )}
          {(detail.pol || detail.pod) && (
            <div className="text-xs text-[var(--ops-text-muted)]">
              {detail.pol} → {detail.pod}
            </div>
          )}
          <a
            href={`/cargo?tab=shipments&sct_ship_no=${encodeURIComponent(detail.sct_ship_no)}`}
            className="mt-1 inline-block text-xs text-[var(--ops-info)] hover:underline"
          >
            {t.rightPanel.viewDetail}
          </a>
        </div>
      )}
    </div>
  )
}

function severityClass(severity: 'critical' | 'warning' | 'info'): string {
  if (severity === 'critical') return 'border-l-[var(--ops-risk)] bg-red-50'
  if (severity === 'warning') return 'border-l-[var(--ops-warn)] bg-amber-50'
  return 'border-l-[var(--ops-info)] bg-blue-50'
}

export function MissionControl({
  data,
  loading = false,
  worklist: _worklist,
  onNavigate,
  selectedShipmentId,
  onClearSelection,
}: MissionControlProps) {
  const t = useT()

  if (loading && !data) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-[var(--ops-surface)] border-l border-[var(--ops-border)] p-4 gap-4 space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-5 w-28 rounded bg-gray-200 mt-4" />
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="h-12 rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-[var(--ops-surface)] border-l border-[var(--ops-border)] p-4">
        <p className="text-sm text-[var(--ops-text-muted)]">{t.rightPanel.loadError}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--ops-surface)] border-l border-[var(--ops-border)] p-4 gap-4 space-y-4">
      {/* Shipment Detail Card */}
      {selectedShipmentId != null && (
        <ShipmentDetailCard sctShipNo={selectedShipmentId} onClear={onClearSelection} />
      )}

      {/* Alerts — Critical */}
      <section className="space-y-2">
        <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)]">
          {t.missionControl.critical}
        </h2>
        {data.alerts.length === 0 ? (
          <p className="text-xs text-[var(--ops-text-muted)]">{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.navigationIntent)}
                className={cn(
                  'w-full rounded-xl border-l-4 p-3 text-left transition-shadow duration-[140ms] hover:shadow-sm',
                  severityClass(alert.severity),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--ops-text-strong)] truncate">
                      {alert.title}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--ops-text-muted)] line-clamp-2">
                      {alert.description}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[var(--ops-text-strong)] shrink-0">
                    {alert.count.toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Route Summary — Action Queue */}
      <section className="space-y-2">
        <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)]">
          {t.missionControl.actionQueue}
        </h2>
        {data.routeSummary.length === 0 ? (
          <p className="text-xs text-[var(--ops-text-muted)]">{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.routeSummary.map((item) => (
              <button
                key={item.routeTypeId}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 text-left transition-shadow duration-[140ms] hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      getRouteTypeBadgeClass(item.routeTypeId),
                    )}
                  >
                    {getRouteTypeLabel(item.routeTypeId)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ops-text-muted)]">
                      {item.percent.toFixed(1)}%
                    </span>
                    <span className="text-sm font-semibold text-[var(--ops-text-strong)]">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--ops-border)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--ops-info)]"
                    style={{ width: `${Math.max(item.percent, 2)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Site Readiness — AGI / DAS Blockers */}
      <section className="space-y-2">
        <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)]">
          {t.missionControl.agiDasBlockers}
        </h2>
        {data.siteReadiness.length === 0 ? (
          <p className="text-xs text-[var(--ops-text-muted)]">{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.siteReadiness.map((item) => (
              <button
                key={item.site}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 text-left transition-shadow duration-[140ms] hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold',
                      SITE_META[item.site].chipClass,
                    )}
                  >
                    {item.site}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ops-text-strong)]">
                    {item.readinessPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-[var(--ops-text-muted)]">
                  <span>{t.rightPanel.arrived} {item.arrived}</span>
                  <span>{t.rightPanel.warehouse} {item.warehouse}</span>
                  <span>MOSB {item.mosb}</span>
                  <span>{t.common.pending} {item.preArrival}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Live Feed — Next 72h */}
      <section className="space-y-2">
        <h2 className="text-[16px] font-semibold text-[var(--ops-text-strong)]">
          {t.missionControl.next72h}
        </h2>
        {data.liveFeed.length === 0 ? (
          <p className="text-xs text-[var(--ops-text-muted)]">{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.liveFeed.slice(-4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-3 text-left transition-shadow duration-[140ms] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--ops-text-strong)] truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="mt-0.5 text-xs text-[var(--ops-text-muted)] truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  {item.routeTypeId && (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] shrink-0',
                        getRouteTypeBadgeClass(item.routeTypeId),
                      )}
                    >
                      {getRouteTypeLabel(item.routeTypeId)}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--ops-text-muted)]">
                  {formatDistanceToNowStrict(new Date(item.timestamp), { addSuffix: true, locale: ko })}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
