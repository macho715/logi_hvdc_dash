'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { SITE_META, getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'

interface OverviewRightPanelProps {
  data: OverviewCockpitResponse | null
  loading?: boolean
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
    <div className="mb-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-300">{t.rightPanel.searchResult}</span>
        {onClear && (
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-200" aria-label={t.rightPanel.close}>×</button>
        )}
      </div>
      {loadingDetail && (
        <div className="text-xs text-gray-400">{t.rightPanel.loading}</div>
      )}
      {!loadingDetail && fetchError && (
        <div className="text-xs text-red-400">{t.rightPanel.fetchError}</div>
      )}
      {!loadingDetail && !fetchError && detail == null && (
        <div className="text-xs text-gray-400">{t.rightPanel.noResult}</div>
      )}
      {!loadingDetail && detail != null && (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">{detail.sct_ship_no}</div>
          <div className="text-xs text-gray-300">{detail.vendor}</div>
          <div className="text-xs text-gray-400">
            {t.rightPanel.stage}: {t.voyageStage[detail.voyage_stage as keyof typeof t.voyageStage] ?? detail.voyage_stage}
          </div>
          {detail.eta && (
            <div className="text-xs text-gray-400">ETA: {detail.eta}</div>
          )}
          {(detail.pol || detail.pod) && (
            <div className="text-xs text-gray-400">
              {detail.pol} → {detail.pod}
            </div>
          )}
          <a
            href={`/cargo?tab=shipments&sct_ship_no=${encodeURIComponent(detail.sct_ship_no)}`}
            className="mt-1 inline-block text-xs text-blue-400 hover:underline"
          >
            {t.rightPanel.viewDetail}
          </a>
        </div>
      )}
    </div>
  )
}

function severityClass(severity: 'critical' | 'warning' | 'info'): string {
  if (severity === 'critical') return 'border-red-500/30 bg-red-500/10'
  if (severity === 'warning') return 'border-amber-500/30 bg-amber-500/10'
  return 'border-blue-500/30 bg-blue-500/10'
}

export function OverviewRightPanel({
  data,
  loading = false,
  onNavigate,
  selectedShipmentId,
  onClearSelection,
}: OverviewRightPanelProps) {
  if (loading && !data) {
    return <div className="w-full border-l border-gray-800 bg-gray-950/60 xl:w-[360px]" />
  }

  if (!data) {
    return (
      <aside className="w-full border-l border-gray-800 bg-gray-950/60 p-4 xl:w-[360px]">
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-4 text-sm text-gray-500">
          Overview 데이터를 불러오지 못했습니다.
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-full border-l border-gray-800 bg-gray-950/60 p-4 xl:w-[360px]">
      <div className="flex h-full flex-col gap-4 overflow-auto">
        {selectedShipmentId != null && (
          <ShipmentDetailCard sctShipNo={selectedShipmentId} onClear={onClearSelection} />
        )}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">예외 보드</h2>
            <p className="text-xs text-gray-500">운영 우선순위가 높은 항목만 위쪽에 고정합니다.</p>
          </div>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.navigationIntent)}
                className={cn(
                  'w-full rounded-2xl border p-3 text-left transition-colors hover:border-white/10',
                  severityClass(alert.severity),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{alert.title}</div>
                    <div className="mt-1 text-xs text-gray-300">{alert.description}</div>
                  </div>
                  <div className="text-lg font-semibold text-white">{alert.count.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">운송 경로 요약</h2>
            <p className="text-xs text-gray-500">숫자 코드를 숨기고 경로 의미만 남겼습니다.</p>
          </div>
          <div className="space-y-2">
            {data.routeSummary.map((item) => (
              <button
                key={item.routeTypeId}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 p-3 text-left transition-colors hover:border-gray-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('rounded-full border px-2 py-1 text-xs', getRouteTypeBadgeClass(item.routeTypeId))}>
                    {getRouteTypeLabel(item.routeTypeId)}
                  </span>
                  <span className="text-sm font-semibold text-white">{item.count.toLocaleString()}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.max(item.percent, 2)}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-gray-500">{item.percent.toFixed(1)}%</div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">현장 준비도</h2>
            <p className="text-xs text-gray-500">현장 단위 도착률과 대기 잔량을 같이 보여줍니다.</p>
          </div>
          <div className="space-y-2">
            {data.siteReadiness.map((item) => (
              <button
                key={item.site}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 p-3 text-left transition-colors hover:border-gray-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn('rounded-full border px-2 py-1 text-xs', SITE_META[item.site].accentClass)}>
                    {item.site}
                  </span>
                  <span className="text-sm font-semibold text-white">{item.readinessPercent.toFixed(1)}%</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-gray-400">
                  <span>도착 {item.arrived}</span>
                  <span>창고 {item.warehouse}</span>
                  <span>MOSB {item.mosb}</span>
                  <span>대기 {item.preArrival}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-white">최근 활동</h2>
            <p className="text-xs text-gray-500">이벤트 기반 최근 변화를 Cargo로 바로 넘깁니다.</p>
          </div>
          <div className="space-y-2">
            {data.liveFeed.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.navigationIntent)}
                className="w-full rounded-2xl border border-gray-800 bg-gray-900/70 p-3 text-left transition-colors hover:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-gray-400">{item.subtitle}</div>
                  </div>
                  {item.routeTypeId ? (
                    <span className={cn('rounded-full border px-2 py-1 text-[11px]', getRouteTypeBadgeClass(item.routeTypeId))}>
                      {getRouteTypeLabel(item.routeTypeId)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  {formatDistanceToNowStrict(new Date(item.timestamp), { addSuffix: true, locale: ko })}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  )
}
