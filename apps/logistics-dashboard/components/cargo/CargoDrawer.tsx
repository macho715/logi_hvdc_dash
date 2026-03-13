'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { getRouteTypeIdFromFlowCode, getRouteTypeLabel } from '@/lib/overview/routeTypes'
import { buildDashboardLink, parseCargoQuery } from '@/lib/navigation/contracts'
import { useCasesStore } from '@/store/casesStore'
import type { CaseRow, ShipmentRow } from '@/types/cases'

function TimelineItem({ label, date }: { label: string; date: string | null }) {
  return (
    <div className={`flex gap-3 items-start ${date ? 'text-gray-200' : 'text-gray-600'}`}>
      <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${date ? 'bg-blue-500' : 'bg-gray-700'}`} />
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
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-700 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">{caseRow.case_no}</h2>
        <button onClick={handleClose} className="text-gray-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Basic info */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">기본정보</h3>
          <dl className="space-y-1.5">
            {([
              ['현장', caseRow.site],
              ['벤더', caseRow.source_vendor],
              ['운송 경로', getRouteTypeLabel(routeTypeId)],
              ['현재위치', caseRow.status_location || caseRow.status_current],
              ['보관유형', caseRow.storage_type],
              ['SQM', caseRow.sqm ? `${caseRow.sqm} ㎡` : '–'],
            ] as [string, string | number | null | undefined][]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <dt className="text-gray-500">{k}</dt>
                <dd className="text-gray-200 text-right max-w-[60%] break-words">{String(v ?? '–')}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Timeline */}
        {shipment && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">물류 타임라인</h3>
            <div className="space-y-2 pl-1 border-l border-gray-700 ml-1">
              <TimelineItem label="ETD (출발예정)" date={shipment.etd} />
              <TimelineItem label="ATD (실제출발)" date={shipment.atd} />
              <TimelineItem label="ETA (도착예정)" date={shipment.eta} />
              <TimelineItem label="ATA (실제도착)" date={shipment.ata} />
              <TimelineItem label="현장 도착" date={caseRow.site_arrival_date} />
            </div>
          </section>
        )}

        {!caseRow.sct_ship_no && (
          <p className="text-xs text-gray-600">선적번호 없음 — 타임라인 불가</p>
        )}
      </div>
    </div>
  )
}
