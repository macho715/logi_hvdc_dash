'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/hooks/useT'
import { ui } from '@/lib/overview/ui'

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

  if (loading) return <div className="h-24 animate-pulse rounded bg-hvdc-surface-subtle" />

  return (
    <div className={`${ui.panelInner} p-3`}>
      <h4 className="mb-2 text-xs font-semibold text-hvdc-text-secondary">{t.pipeline.customsStatus} <span className="font-normal text-hvdc-text-muted">{t.pipeline.customsStatusDesc}</span></h4>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-hvdc-status-ok">{stats.cleared}</div>
          <div className="text-xs text-hvdc-text-muted">{t.pipeline.cleared}</div>
        </div>
        <div>
          <div className="text-lg font-bold text-hvdc-status-warn">{stats.in_progress}</div>
          <div className="text-xs text-hvdc-text-muted">{t.pipeline.inProgress}</div>
        </div>
        <div>
          <div className="text-lg font-bold text-hvdc-text-secondary">{stats.pending}</div>
          <div className="text-xs text-hvdc-text-muted">{t.pipeline.pending}</div>
        </div>
      </div>
    </div>
  )
}
