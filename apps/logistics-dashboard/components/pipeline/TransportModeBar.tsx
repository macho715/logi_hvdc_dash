'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useT } from '@/hooks/useT'
import { chartColors, ui } from '@/lib/overview/ui'

interface ModeCount { name: string; value: number }

export function TransportModeBar() {
  const t = useT()
  const [data, setData] = useState<ModeCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shipments?pageSize=1000')
      .then(r => r.json())
      .then(json => {
        const counts: Record<string, number> = {}
        for (const row of json.data ?? []) {
          const mode = (row.ship_mode as string | null) || 'Unknown'
          counts[mode] = (counts[mode] ?? 0) + 1
        }
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-32 animate-pulse rounded bg-hvdc-surface-subtle" />

  return (
    <div className={`${ui.panelInner} p-3`}>
      <h4 className="mb-1 text-xs font-semibold text-hvdc-text-secondary">{t.pipeline.transportMode} <span className="font-normal text-hvdc-text-muted">{t.pipeline.transportModeDesc}</span></h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartColors.axis }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill={chartColors.warn} radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
