'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildDashboardLink, parseCargoQuery } from '@/lib/navigation/contracts'
import { getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { customsStatusClass, getRouteTypeBadgeClass, ui, voyageStageBadgeClass } from '@/lib/overview/ui'
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
          ? 'bg-hvdc-brand text-white shadow-hvdc-active'
          : 'bg-hvdc-surface-subtle text-hvdc-text-secondary hover:bg-hvdc-surface-hover hover:text-hvdc-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

function VoyageStageBadge({ stage, t }: { stage: VoyageStage | undefined | null; t: ReturnType<typeof useT> }) {
  if (!stage) return <span className="text-hvdc-text-muted">–</span>

  const VOYAGE_STAGE_META: Record<VoyageStage, { label: string; className: string }> = {
    'pre-departure': { label: t.cargo.badgePreDeparture, className: voyageStageBadgeClass('pre-departure') },
    'in-transit': { label: t.cargo.badgeInTransit, className: voyageStageBadgeClass('in-transit') },
    'port-customs': { label: t.cargo.badgePortCustoms, className: voyageStageBadgeClass('port-customs') },
    inland: { label: t.cargo.badgeInland, className: voyageStageBadgeClass('inland') },
    delivered: { label: t.cargo.badgeDelivered, className: voyageStageBadgeClass('delivered') },
  }

  const meta = VOYAGE_STAGE_META[stage]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.className}`}>
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
      <div className="flex flex-wrap gap-1.5 border-b border-hvdc-border-soft bg-hvdc-bg-panel px-3 py-2">
        <span className="mr-1 self-center text-xs text-hvdc-text-muted">{t.cargo.voyageStageLabel}</span>
        {VOYAGE_STAGE_OPTIONS.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            active={query.voyage_stage === option.value}
            onClick={() => replaceCargoQuery({ voyage_stage: query.voyage_stage === option.value ? undefined : option.value })}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-hvdc-border-soft bg-hvdc-bg-panel px-3 py-2">
        <span className="mr-1 self-center text-xs text-hvdc-text-muted">{t.cargo.nominatedSite}</span>
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
        <div className="flex items-center gap-0 border-b border-hvdc-border-soft bg-hvdc-bg-panel">
          <span className="shrink-0 px-3 py-2 text-xs text-hvdc-text-muted">{t.cargo.vendor}</span>
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

      <div className="flex gap-3 border-b border-hvdc-border-soft bg-hvdc-bg-panel p-2 text-xs">
        {(['cleared', 'in_progress', 'pending'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setCustomsStatus((current) => (current === status ? 'all' : status))}
            className={`rounded px-2 py-1 ${
              customsStatus === status ? 'bg-hvdc-brand text-white shadow-hvdc-active' : 'bg-hvdc-surface-subtle text-hvdc-text-secondary'
            }`}
          >
            {status === 'cleared' ? t.cargo.cleared : status === 'in_progress' ? t.cargo.inProgress : t.cargo.pending}
          </button>
        ))}
        <span className="ml-auto text-hvdc-text-muted">{t.cargo.totalCount} {total.toLocaleString()}{unitSuffix}</span>
      </div>

      <table className="w-full border-collapse text-xs text-hvdc-text-primary">
        <thead className="sticky top-0 z-10 bg-hvdc-bg-panel">
          <tr className="border-b border-hvdc-border-soft text-hvdc-text-secondary">
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
              <td colSpan={9} className="py-8 text-center text-hvdc-text-muted">Loading...</td>
            </tr>
          ) : null}
          {!loading && data.map((shipment) => (
            <tr key={shipment.id} className="border-b border-hvdc-border-soft hover:bg-hvdc-surface-hover">
              <td className="py-1.5 px-3 font-mono text-hvdc-text-primary">{shipment.sct_ship_no}</td>
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
                  <span className="text-hvdc-text-muted">–</span>
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
                      className="rounded bg-hvdc-surface-subtle px-1.5 py-0.5 text-xs text-hvdc-text-primary"
                    >
                      {site}
                    </button>
                  )) : <span className="text-hvdc-text-muted">–</span>}
                </div>
              </td>
              <td className="py-1.5 px-3">
                <span className={customsStatusClass(shipment.customs_status)}>
                  {shipment.customs_status === 'cleared' ? t.cargo.cleared : shipment.customs_status === 'in_progress' ? t.cargo.inProgress : t.cargo.pending}
                </span>
              </td>
            </tr>
          ))}
          {!loading && data.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-hvdc-text-muted">{t.cargo.noData}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="flex justify-center gap-2 border-t border-hvdc-border-soft p-2 text-xs">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          className="rounded bg-hvdc-surface-subtle px-2 py-1 text-hvdc-text-primary hover:bg-hvdc-surface-hover disabled:opacity-30"
        >
          {t.cargo.previous}
        </button>
        <span className="py-1 text-hvdc-text-muted">Page {page}</span>
        <button
          type="button"
          disabled={page * 50 >= total}
          onClick={() => setPage((current) => current + 1)}
          className="rounded bg-hvdc-surface-subtle px-2 py-1 text-hvdc-text-primary hover:bg-hvdc-surface-hover disabled:opacity-30"
        >
          {t.cargo.next}
        </button>
      </div>
    </div>
  )
}
