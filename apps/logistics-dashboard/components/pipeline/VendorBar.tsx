'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import { chartColors, ui } from '@/lib/overview/ui'

export function VendorBar() {
  const t = useT()
  const { summary } = useCasesStore()
  if (!summary) return <div className="h-32 animate-pulse rounded bg-hvdc-surface-subtle" />

  const data = Object.entries(summary.byVendor).map(([name, value]) => ({ name, value }))

  return (
    <div className={`${ui.panelInner} p-3`}>
      <h4 className="mb-2 text-xs font-semibold text-hvdc-text-secondary">{t.pipeline.byVendor}</h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartColors.axis }} width={60} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" fill={chartColors.brand} radius={[0,3,3,0]}>
            {data.map((_, i) => <Cell key={i} fill={chartColors.vendorPalette[i % chartColors.vendorPalette.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
