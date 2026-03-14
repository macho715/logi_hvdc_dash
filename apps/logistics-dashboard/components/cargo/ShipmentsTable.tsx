'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildDashboardLink, parseCargoQuery } from '@/lib/navigation/contracts'
import { getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { getRouteTypeBadgeClass } from '@/lib/overview/ui'
import { useT } from '@/hooks/useT'
import type { ShipmentRow, VoyageStage } from '@/types/cases'
import type { OverviewRouteTypeId } from '@/types/overview'

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function VoyageStageBadge({ stage, t }: { stage: VoyageStage | undefined | null; t: ReturnType<typeof useT> }) {
  if (!stage) return <span className="text-gray-600">–</span>

  const VOYAGE_STAGE_META: Record<VoyageStage, { label: string; className: string }> = {
    'pre-departure': { label: t.cargo.badgePreDeparture, className: 'bg-gray-700 text-gray-300' },
    'in-transit': { label: t.cargo.badgeInTransit, className: 'bg-blue-900/60 text-blue-300' },
    'port-customs': { label: t.cargo.badgePortCustoms, className: 'bg-yellow-900/60 text-yellow-300' },
    inland: { label: t.cargo.badgeInland, className: 'bg-orange-900/60 text-orange-300' },
    delivered: { label: t.cargo.badgeDelivered, className: 'bg-green-900/60 text-green-400' },
  }

  const meta = VOYAGE_STAGE_META[stage]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

const SITE_OPTIONS = ['SHU', 'MIR', 'DAS', 'AGI'] as const

export function ShipmentsTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = parseCargoQuery(searchParams)
  const t = useT()
  const [data, setData] = useState<ShipmentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<{ vendor: string; count: number }[]>([])
  const [customsStatus, setCustomsStatus] = useState<'all' | 'cleared' | 'in_progress' | 'pending'>('all')

  const unitSuffix = t.cargo.totalCount === '총' ? '건' : ''

  const VOYAGE_STAGE_OPTIONS: { value: VoyageStage; label: string }[] = [
    { value: 'pre-departure', label: t.cargo.badgePreDeparture },
    { value: 'in-transit', label: t.cargo.badgeInTransit },
    { value: 'port-customs', label: t.cargo.badgePortCustoms },
    { value: 'inland', label: t.cargo.badgeInland },
    { value: 'delivered', label: t.cargo.badgeDelivered },
  ]

  useEffect(() => {
    fetch('/api/shipments/vendors')
      .then((response) => response.json())
      .then((json) => setVendors(json.vendors ?? []))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query.site, query.vendor, query.voyage_stage, query.route_type, customsStatus])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '50' })
    if (query.vendor) params.set('vendor', query.vendor)
    if (query.site) params.set('site', query.site)
    if (query.voyage_stage) params.set('voyage_stage', query.voyage_stage)
    if (query.route_type) params.set('route_type', query.route_type)
    if (customsStatus !== 'all') params.set('customs_status', customsStatus)

    fetch(`/api/shipments?${params.toString()}`)
      .then((response) => response.json())
      .then((json) => {
        setData((json.data as ShipmentRow[]) ?? [])
        setTotal(json.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [customsStatus, page, query.route_type, query.site, query.vendor, query.voyage_stage])

  const replaceCargoQuery = (patch: {
    site?: typeof query.site
    vendor?: string
    voyage_stage?: VoyageStage
    route_type?: OverviewRouteTypeId
  }) => {
    router.replace(
      buildDashboardLink({
        page: 'cargo',
        params: {
          ...query,
          ...patch,
          tab: query.tab ?? 'shipments',
        },
      }),
      { scroll: false },
    )
  }

  const selectedRouteTypeLabel = useMemo(
    () => (query.route_type ? getRouteTypeLabel(query.route_type) : null),
    [query.route_type],
  )

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 bg-gray-900/80 px-3 py-2">
        <span className="mr-1 self-center text-xs text-gray-500">{t.cargo.voyageStageLabel}</span>
        {VOYAGE_STAGE_OPTIONS.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            active={query.voyage_stage === option.value}
            onClick={() => replaceCargoQuery({ voyage_stage: query.voyage_stage === option.value ? undefined : option.value })}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 bg-gray-900/80 px-3 py-2">
        <span className="mr-1 self-center text-xs text-gray-500">{t.cargo.nominatedSite}</span>
        {SITE_OPTIONS.map((site) => (
          <FilterPill
            key={site}
            label={site}
            active={query.site === site}
            onClick={() => replaceCargoQuery({ site: query.site === site ? undefined : site })}
          />
        ))}
        {selectedRouteTypeLabel ? (
          <button
            type="button"
            onClick={() => replaceCargoQuery({ route_type: undefined })}
            className={`ml-auto rounded-full border px-2 py-1 text-[11px] ${getRouteTypeBadgeClass(query.route_type)}`}
          >
            {selectedRouteTypeLabel}
          </button>
        ) : null}
      </div>

      {vendors.length > 0 ? (
        <div className="flex items-center gap-0 border-b border-gray-800 bg-gray-900/80">
          <span className="shrink-0 px-3 py-2 text-xs text-gray-500">{t.cargo.vendor}</span>
          <div className="flex gap-1.5 overflow-x-auto py-2 pr-3" style={{ scrollbarWidth: 'thin' }}>
            <FilterPill
              label={t.cargo.all}
              active={!query.vendor}
              onClick={() => replaceCargoQuery({ vendor: undefined })}
            />
            {vendors.map(({ vendor, count }) => (
              <FilterPill
                key={vendor}
                label={`${vendor} (${count})`}
                active={query.vendor === vendor}
                onClick={() => replaceCargoQuery({ vendor: query.vendor === vendor ? undefined : vendor })}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-3 border-b border-gray-800 bg-gray-900 p-2 text-xs">
        {(['cleared', 'in_progress', 'pending'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setCustomsStatus((current) => (current === status ? 'all' : status))}
            className={`rounded px-2 py-1 ${
              customsStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {status === 'cleared' ? t.cargo.cleared : status === 'in_progress' ? t.cargo.inProgress : t.cargo.pending}
          </button>
        ))}
        <span className="ml-auto text-gray-600">{t.cargo.totalCount} {total.toLocaleString()}{unitSuffix}</span>
      </div>

      <table className="w-full border-collapse text-xs text-gray-300">
        <thead className="sticky top-0 z-10 bg-gray-900">
          <tr className="border-b border-gray-700 text-gray-500">
            <th className="whitespace-nowrap py-2 px-3 text-left">SCT SHIP NO</th>
            <th className="py-2 px-3 text-left">{t.cargo.vendor}</th>
            <th className="whitespace-nowrap py-2 px-3 text-left">POL→POD</th>
            <th className="py-2 px-3 text-left">ETD</th>
            <th className="py-2 px-3 text-left">ATA</th>
            <th className="py-2 px-3 text-left">{t.cargo.voyageStageLabel}</th>
            <th className="py-2 px-3 text-left">{t.cargo.route}</th>
            <th className="py-2 px-3 text-left">{t.cargo.nominatedSite}</th>
            <th className="py-2 px-3 text-left">{t.cargo.customs}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-gray-600">Loading...</td>
            </tr>
          ) : null}
          {!loading && data.map((shipment) => (
            <tr key={shipment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-1.5 px-3 font-mono text-gray-200">{shipment.sct_ship_no}</td>
              <td className="py-1.5 px-3">{shipment.vendor}</td>
              <td className="whitespace-nowrap py-1.5 px-3">{shipment.pol} → {shipment.pod}</td>
              <td className="py-1.5 px-3 tabular-nums">{shipment.etd ?? '–'}</td>
              <td className="py-1.5 px-3 tabular-nums">{shipment.ata ?? '–'}</td>
              <td className="py-1.5 px-3"><VoyageStageBadge stage={shipment.voyage_stage} t={t} /></td>
              <td className="py-1.5 px-3">
                {shipment.route_type ? (
                  <span className={`rounded-full border px-2 py-1 text-[11px] ${getRouteTypeBadgeClass(shipment.route_type)}`}>
                    {getRouteTypeLabel(shipment.route_type)}
                  </span>
                ) : (
                  <span className="text-gray-600">–</span>
                )}
              </td>
              <td className="py-1.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {shipment.nominated_sites.length > 0 ? shipment.nominated_sites.map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() =>
                        replaceCargoQuery({
                          site: site === 'SHU' || site === 'MIR' || site === 'DAS' || site === 'AGI' ? site : undefined,
                        })
                      }
                      className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-300"
                    >
                      {site}
                    </button>
                  )) : <span className="text-gray-600">–</span>}
                </div>
              </td>
              <td className="py-1.5 px-3">
                <span className={
                  shipment.customs_status === 'cleared'
                    ? 'text-green-400'
                    : shipment.customs_status === 'in_progress'
                    ? 'text-yellow-400'
                    : 'text-gray-500'
                }>
                  {shipment.customs_status === 'cleared' ? t.cargo.cleared : shipment.customs_status === 'in_progress' ? t.cargo.inProgress : t.cargo.pending}
                </span>
              </td>
            </tr>
          ))}
          {!loading && data.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-gray-600">{t.cargo.noData}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="flex justify-center gap-2 border-t border-gray-800 p-2 text-xs">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          className="rounded bg-gray-800 px-2 py-1 hover:bg-gray-700 disabled:opacity-30"
        >
          {t.cargo.previous}
        </button>
        <span className="py-1 text-gray-500">Page {page}</span>
        <button
          type="button"
          disabled={page * 50 >= total}
          onClick={() => setPage((current) => current + 1)}
          className="rounded bg-gray-800 px-2 py-1 hover:bg-gray-700 disabled:opacity-30"
        >
          {t.cargo.next}
        </button>
      </div>
    </div>
  )
}
