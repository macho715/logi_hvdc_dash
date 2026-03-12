'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ModeCount { name: string; value: number }

export function TransportModeBar() {
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

  if (loading) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-1">운송 모드 <span className="text-gray-600 font-normal">(BL 기준)</span></h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill="#f59e0b" radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
