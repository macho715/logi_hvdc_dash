'use client'

import { useEffect } from 'react'
import { useStockStore } from '@/store/stockStore'
import { useT } from '@/hooks/useT'

export function DsvStockTable() {
  const { stock, total, isLoading, fetchStock } = useStockStore()
  const t = useT()
  const unitSuffix = t.cargo.totalCount === '총' ? '건' : ''

  useEffect(() => { fetchStock() }, [fetchStock])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex border-b border-hvdc-border-soft px-3 py-1 text-xs text-hvdc-text-muted">
        {t.cargo.totalCount} {total.toLocaleString()}{unitSuffix} ({t.cargo.dsvStock})
      </div>
      <table className="w-full border-collapse text-xs text-hvdc-text-primary">
        <thead className="sticky top-0 bg-hvdc-bg-panel">
          <tr className="border-b border-hvdc-border-soft text-hvdc-text-secondary">
            <th className="py-2 px-3 text-left w-10">No</th>
            <th className="py-2 px-3 text-left">SKU</th>
            <th className="py-2 px-3 text-left">Description</th>
            <th className="py-2 px-3 text-left">Location</th>
            <th className="py-2 px-3 text-left">Pallet ID</th>
            <th className="py-2 px-3 text-left w-10">Qty</th>
            <th className="py-2 px-3 text-left">{t.cargo.receivedDate}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} className="py-8 text-center text-hvdc-text-muted">Loading...</td></tr>}
          {!isLoading && stock.length === 0 && (
            <tr><td colSpan={7} className="py-8 text-center text-hvdc-text-muted">{t.cargo.noData}</td></tr>
          )}
          {stock.map(s => (
            <tr key={s.id} className="border-b border-hvdc-border-soft hover:bg-hvdc-surface-hover">
              <td className="py-1.5 px-3 text-hvdc-text-muted">{s.no}</td>
              <td className="py-1.5 px-3 font-mono">{s.sku}</td>
              <td className="py-1.5 px-3 truncate max-w-40">{s.description}</td>
              <td className="py-1.5 px-3">{s.location}</td>
              <td className="py-1.5 px-3">{s.pallet_id}</td>
              <td className="py-1.5 px-3">{s.qty}</td>
              <td className="py-1.5 px-3">{s.date_received}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
