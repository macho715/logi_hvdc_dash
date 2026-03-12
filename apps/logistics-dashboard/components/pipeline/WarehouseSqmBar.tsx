'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'

export function WarehouseSqmBar() {
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  const data = Object.entries(summary.bySqmByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.replace('DSV ', ''), value: Math.round(value) }))

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">창고 SQM</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={65} />
          <Tooltip formatter={(v: number) => `${v.toLocaleString()} ㎡`} />
          <Bar dataKey="value" fill="#6366f1" radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
