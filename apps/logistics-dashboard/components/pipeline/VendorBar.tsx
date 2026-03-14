'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'

export function VendorBar() {
  const t = useT()
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 bg-gray-800 animate-pulse rounded" />

  const data = Object.entries(summary.byVendor).map(([name, value]) => ({ name, value }))

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">{t.pipeline.byVendor}</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill="#3b82f6" radius={[0,3,3,0]}>
            {data.map((_, i) => <Cell key={i} fill={(['#3b82f6','#10b981','#6b7280'] as const)[i % 3]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
