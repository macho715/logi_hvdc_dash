'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useCasesStore } from '@/store/casesStore'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useT } from '@/hooks/useT'
import type { CaseRow } from '@/types/cases'
import { classifyStage } from '@/lib/cases/pipelineStage'

const DISMISS_KEY = 'agi_alert_dismissed'

export function AgiAlertBanner() {
  const { summary } = useCasesStore()
  const locale = useLogisticsStore((s) => s.locale)
  const t = useT()
  const [dismissed, setDismissed] = useState(false)
  const [agiCases, setAgiCases] = useState<CaseRow[]>([])

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  useEffect(() => {
    fetch('/api/cases?site=AGI&pageSize=5000')
      .then((res) => res.json())
      .then((json) => setAgiCases((json.data as CaseRow[]) ?? []))
      .catch(() => setAgiCases([]))
  }, [])

  if (!summary) return null

  const total = summary.bySite.AGI ?? 0
  const arrived = summary.bySiteArrived.AGI ?? 0
  const rate = total > 0 ? arrived / total : 0

  if (rate >= 0.5 || dismissed) return null

  const pending = total - arrived
  const stageCounts = agiCases.reduce(
    (acc, row) => {
      const stage = classifyStage(row.status_current ?? null, row.status_location ?? null)
      if (stage === 'warehouse') acc.warehouse++
      if (stage === 'mosb') acc.mosb++
      if (stage === 'pre-arrival') acc.preArrival++
      return acc
    },
    { warehouse: 0, mosb: 0, preArrival: 0 }
  )

  return (
    <div className="bg-red-900/80 border border-red-700 rounded-lg mx-4 mt-3 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-red-200">{t.sites.agiAlertTitle}</span>
        <span className="text-red-300 ml-2">
          {locale === 'ko'
            ? `달성률 ${(rate * 100).toFixed(1)}% — 미납 ${pending.toLocaleString()}건`
            : `Rate ${(rate * 100).toFixed(1)}% — Pending ${pending.toLocaleString()}`}
          {' '}
          ({locale === 'ko'
            ? `창고 ${stageCounts.warehouse.toLocaleString()} · MOSB ${stageCounts.mosb.toLocaleString()} · 선적 전 ${stageCounts.preArrival.toLocaleString()}`
            : `WH ${stageCounts.warehouse.toLocaleString()} · MOSB ${stageCounts.mosb.toLocaleString()} · Pre-shipment ${stageCounts.preArrival.toLocaleString()}`})
        </span>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, 'true')
          setDismissed(true)
        }}
        className="text-red-400 hover:text-red-200"
        aria-label="Close alert"
      >
        <X size={16} />
      </button>
    </div>
  )
}
