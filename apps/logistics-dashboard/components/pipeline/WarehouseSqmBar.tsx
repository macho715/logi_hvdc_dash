'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import { chartColors, ui } from '@/lib/overview/ui'

export function WarehouseSqmBar() {
  const t = useT()
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 animate-pulse rounded bg-hvdc-surface-subtle" />

  const data = Object.entries(summary.bySqmByLocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.replace('DSV ', ''), value: Math.round(value) }))

  return (
    <div className={`${ui.panelInner} p-3`}>
      <h4 className="mb-2 text-xs font-semibold text-hvdc-text-secondary">{t.pipeline.warehouseSqm}</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: chartColors.axis }} width={65} />
          <Tooltip formatter={(v: number) => `${v.toLocaleString()} ㎡`} />
          <Bar dataKey="value" fill={chartColors.siteMir} radius={[0,3,3,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
