'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { buildDashboardLink, parseCargoQuery } from '@/lib/navigation/contracts'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import type { CaseRow, ShipmentRow } from '@/types/cases'

function TimelineItem({ label, date }: { label: string; date: string | null }) {
  return (
    <div className={`flex items-start gap-3 ${date ? 'text-hvdc-text-primary' : 'text-hvdc-text-muted'}`}>
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${date ? 'bg-hvdc-brand' : 'bg-hvdc-border-strong'}`} />
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-xs">{date ?? '–'}</div>
      </div>
    </div>
  )
}

export function CargoDrawer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDrawerOpen, selectedCaseId, cases, closeDrawer } = useCasesStore()
  const [fetchedCase, setFetchedCase] = useState<CaseRow | null>(null)
  const [shipment, setShipment] = useState<ShipmentRow | null>(null)
  const t = useT()

  const caseRow = cases.find(c => c.id === selectedCaseId) ?? fetchedCase ?? null

  useEffect(() => {
    if (!selectedCaseId) {
      setFetchedCase(null)
      return
    }

    const existing = cases.find((row) => row.id === selectedCaseId)
    if (existing) {
      setFetchedCase(null)
      return
    }

    fetch(`/api/cases?id=${encodeURIComponent(selectedCaseId)}&pageSize=1`)
      .then((res) => res.json())
      .then((json) => setFetchedCase((json.data as CaseRow[])?.[0] ?? null))
      .catch(() => setFetchedCase(null))
  }, [cases, selectedCaseId])

  useEffect(() => {
    if (!caseRow?.sct_ship_no) { setShipment(null); return }
    fetch(`/api/shipments?sct_ship_no=${encodeURIComponent(caseRow.sct_ship_no)}&pageSize=1`)
      .then(r => r.json())
      .then(j => setShipment((j.data as ShipmentRow[])?.[0] ?? null))
      .catch(() => setShipment(null))
  }, [caseRow?.sct_ship_no])

  if (!isDrawerOpen || !caseRow) return null

  const routeTypeId = caseRow.route_type ?? getRouteTypeIdFromFlowCode(caseRow.flow_code)

  const handleClose = () => {
    const current = parseCargoQuery(searchParams)
    router.replace(
      buildDashboardLink({ page: 'cargo', params: { ...current, tab: current.tab ?? 'wh' } }),
      { scroll: false },
    )
    closeDrawer()
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-hvdc-border-soft bg-hvdc-bg-panel shadow-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hvdc-border-soft px-4 py-3">
        <h2 className="text-sm font-semibold text-hvdc-text-primary">{caseRow.case_no}</h2>
        <button onClick={handleClose} className="text-hvdc-text-muted hover:text-hvdc-text-primary">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Basic info */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase text-hvdc-text-muted">{t.cargo.basicInfo}</h3>
          <dl className="space-y-1.5">
            {([
              [t.cargo.site, caseRow.site],
              [t.cargo.vendor, caseRow.source_vendor],
              [t.cargo.route, getRouteTypeLabel(routeTypeId)],
              [t.cargo.currentLocation, caseRow.status_location || caseRow.status_current],
              [t.cargo.storageType, caseRow.storage_type],
              ['SQM', caseRow.sqm ? `${caseRow.sqm} ㎡` : '–'],
            ] as [string, string | number | null | undefined][]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <dt className="text-hvdc-text-muted">{k}</dt>
                <dd className="max-w-[60%] break-words text-right text-hvdc-text-primary">{String(v ?? '–')}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Timeline */}
        {shipment && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-hvdc-text-muted">{t.cargo.logisticsTimeline}</h3>
            <div className="ml-1 space-y-2 border-l border-hvdc-border-soft pl-1">
              <TimelineItem label={t.cargo.etdLabel} date={shipment.etd} />
              <TimelineItem label={t.cargo.atdLabel} date={shipment.atd} />
              <TimelineItem label={t.cargo.etaLabel} date={shipment.eta} />
              <TimelineItem label={t.cargo.ataLabel} date={shipment.ata} />
              <TimelineItem label={t.cargo.siteArrival} date={caseRow.site_arrival_date} />
            </div>
          </section>
        )}

        {!caseRow.sct_ship_no && (
          <p className="text-xs text-hvdc-text-muted">{t.cargo.noShipmentNo}</p>
        )}
      </div>
    </div>
  )
}
