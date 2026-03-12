'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useCasesStore } from '@/store/casesStore'

const DISMISS_KEY = 'agi_alert_dismissed'

export function AgiAlertBanner() {
  const { summary } = useCasesStore()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
    }
  }, [])

  if (!summary) return null

  const total = summary.bySite.AGI ?? 0
  const arrived = summary.bySiteArrived.AGI ?? 0
  const rate = total > 0 ? arrived / total : 0

  if (rate >= 0.5 || dismissed) return null

  const pending = total - arrived

  return (
    <div className="bg-red-900/80 border border-red-700 rounded-lg mx-4 mt-3 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-red-200">AGI 납품 경보</span>
        <span className="text-red-300 ml-2">
          달성률 {(rate * 100).toFixed(1)}% — 미납 {pending.toLocaleString()}건
          (창고 {summary.byStatus.warehouse.toLocaleString()}건 포함)
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
