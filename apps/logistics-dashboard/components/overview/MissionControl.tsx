'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { SITE_META, getRouteTypeBadgeClass, severitySurfaceClass, ui } from '@/lib/overview/ui'
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
    <div className={`${ui.panelInner} border-hvdc-brand/40 bg-hvdc-brand/10 p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-hvdc-brand">{t.rightPanel.searchResult}</span>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-hvdc-text-secondary hover:text-hvdc-text-primary"
            aria-label={t.rightPanel.close}
          >
            ×
          </button>
        )}
      </div>
      {loadingDetail && (
        <div className="text-xs text-hvdc-text-secondary">{t.rightPanel.loading}</div>
      )}
      {!loadingDetail && fetchError && (
        <div className="text-xs text-hvdc-status-risk">{t.rightPanel.fetchError}</div>
      )}
      {!loadingDetail && !fetchError && detail == null && (
        <div className="text-xs text-hvdc-text-secondary">{t.rightPanel.noResult}</div>
      )}
      {!loadingDetail && detail != null && (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-hvdc-text-primary">{detail.sct_ship_no}</div>
          <div className="text-xs text-hvdc-text-secondary">{detail.vendor}</div>
          <div className="text-xs text-hvdc-text-secondary">
            {t.rightPanel.stage}: {t.voyageStage[detail.voyage_stage as keyof typeof t.voyageStage] ?? detail.voyage_stage}
          </div>
          {detail.eta && (
            <div className="text-xs text-hvdc-text-secondary">ETA: {detail.eta}</div>
          )}
          {(detail.pol || detail.pod) && (
            <div className="text-xs text-hvdc-text-secondary">
              {detail.pol} → {detail.pod}
            </div>
          )}
          <a
            href={`/cargo?tab=shipments&sct_ship_no=${encodeURIComponent(detail.sct_ship_no)}`}
            className="mt-1 inline-block text-xs text-hvdc-brand hover:text-hvdc-brand-hi hover:underline"
          >
            {t.rightPanel.viewDetail}
          </a>
        </div>
      )}
    </div>
  )
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
      <div className={`flex h-full flex-col gap-4 space-y-4 overflow-y-auto border-l border-hvdc-border-soft p-4 ${ui.panelSoft}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-5 w-28 rounded bg-white/10 mt-4" />
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`flex h-full flex-col overflow-y-auto border-l border-hvdc-border-soft p-4 ${ui.panelSoft}`}>
        <p className="text-sm text-hvdc-text-secondary">{t.rightPanel.loadError}</p>
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col gap-4 space-y-4 overflow-y-auto border-l border-hvdc-border-soft p-4 ${ui.panelSoft}`}>
      {/* Shipment Detail Card */}
      {selectedShipmentId != null && (
        <ShipmentDetailCard sctShipNo={selectedShipmentId} onClear={onClearSelection} />
      )}

      {/* Alerts — Critical */}
      <section className="space-y-2">
        <h2 className={ui.sectionTitle}>
          {t.missionControl.critical}
        </h2>
        {data.alerts.length === 0 ? (
          <p className={ui.textHint}>{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.navigationIntent)}
                className={cn(
                  `${ui.row} w-full border-l-4 p-3 text-left hover:shadow-hvdc-card`,
                  severitySurfaceClass(alert.severity),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-hvdc-text-primary">
                      {alert.title}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-hvdc-text-secondary">
                      {alert.description}
                    </div>
                  </div>
                  <div className="shrink-0 text-lg font-bold text-hvdc-text-primary">
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
        <h2 className={ui.sectionTitle}>
          {t.missionControl.actionQueue}
        </h2>
        {data.routeSummary.length === 0 ? (
          <p className={ui.textHint}>{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.routeSummary.map((item) => (
              <button
                key={item.routeTypeId}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className={`${ui.row} w-full p-3 text-left hover:shadow-hvdc-card`}
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
                    <span className="text-[11px] text-hvdc-text-secondary">
                      {item.percent.toFixed(1)}%
                    </span>
                    <span className="text-sm font-semibold text-hvdc-text-primary">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={ui.progressTrack}>
                  <div
                    className={ui.progressFillBlue}
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
        <h2 className={ui.sectionTitle}>
          {t.missionControl.agiDasBlockers}
        </h2>
        {data.siteReadiness.length === 0 ? (
          <p className={ui.textHint}>{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.siteReadiness.map((item) => (
              <button
                key={item.site}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className={`${ui.row} w-full p-3 text-left hover:shadow-hvdc-card`}
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
                  <span className="text-sm font-semibold text-hvdc-text-primary">
                    {item.readinessPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-hvdc-text-secondary">
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
        <h2 className={ui.sectionTitle}>
          {t.missionControl.next72h}
        </h2>
        {data.liveFeed.length === 0 ? (
          <p className={ui.textHint}>{t.missionControl.noItems}</p>
        ) : (
          <div className="space-y-2">
            {data.liveFeed.slice(-4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className={`${ui.row} w-full p-3 text-left hover:shadow-hvdc-card`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-hvdc-text-primary">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="mt-0.5 truncate text-xs text-hvdc-text-secondary">
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
                <div className="mt-1.5 text-[11px] text-hvdc-text-secondary">
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
