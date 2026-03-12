'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import type { CasesFilter } from '@/types/cases'

const COLORS = ['#6b7280','#3b82f6','#22c55e','#f97316','#ef4444','#a855f7']

export function FlowCodeDonut() {
  const { summary, setFilter } = useCasesStore()
  if (!summary) return <div className="h-48 bg-gray-800 animate-pulse rounded" />

  const data = ['0','1','2','3','4','5'].map(fc => ({
    name: `FC${fc}`,
    value: summary.byFlowCode[fc] ?? 0,
    fc,
  })).filter(d => d.value > 0)

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">Flow Code 분포</h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={70}
            onClick={(entry: { fc: string }) => {
              const fc = parseInt(entry.fc, 10)
              setFilter('flow_code', fc as CasesFilter['flow_code'])
            }}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Legend iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
