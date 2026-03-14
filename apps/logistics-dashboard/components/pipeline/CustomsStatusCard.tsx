'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/hooks/useT'

interface CustomsStats { cleared: number; in_progress: number; pending: number }

export function CustomsStatusCard() {
  const t = useT()
  const [stats, setStats] = useState<CustomsStats>({ cleared: 0, in_progress: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/shipments?customs_status=cleared&pageSize=1').then(r => r.json()),
      fetch('/api/shipments?customs_status=in_progress&pageSize=1').then(r => r.json()),
      fetch('/api/shipments?customs_status=pending&pageSize=1').then(r => r.json()),
    ]).then(([c, ip, p]) => {
      setStats({ cleared: (c.total as number) ?? 0, in_progress: (ip.total as number) ?? 0, pending: (p.total as number) ?? 0 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-24 bg-gray-800 animate-pulse rounded" />

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">{t.pipeline.customsStatus} <span className="text-gray-600 font-normal">{t.pipeline.customsStatusDesc}</span></h4>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-green-400">{stats.cleared}</div>
          <div className="text-xs text-gray-500">{t.pipeline.cleared}</div>
        </div>
        <div>
          <div className="text-lg font-bold text-yellow-400">{stats.in_progress}</div>
          <div className="text-xs text-gray-500">{t.pipeline.inProgress}</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-400">{stats.pending}</div>
          <div className="text-xs text-gray-500">{t.pipeline.pending}</div>
        </div>
      </div>
    </div>
  )
}
