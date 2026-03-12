'use client'

import { useEffect } from 'react'
import { useStockStore } from '@/store/stockStore'

export function DsvStockTable() {
  const { stock, total, isLoading, fetchStock } = useStockStore()

  useEffect(() => { fetchStock() }, [fetchStock])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex px-3 py-1 text-xs text-gray-600 border-b border-gray-800">
        총 {total.toLocaleString()}건 (DSV 창고 재고)
      </div>
      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left w-10">No</th>
            <th className="py-2 px-3 text-left">SKU</th>
            <th className="py-2 px-3 text-left">Description</th>
            <th className="py-2 px-3 text-left">Location</th>
            <th className="py-2 px-3 text-left">Pallet ID</th>
            <th className="py-2 px-3 text-left w-10">Qty</th>
            <th className="py-2 px-3 text-left">입고일</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} className="py-8 text-center text-gray-600">Loading...</td></tr>}
          {!isLoading && stock.length === 0 && (
            <tr><td colSpan={7} className="py-8 text-center text-gray-600">데이터 없음</td></tr>
          )}
          {stock.map(s => (
            <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-1.5 px-3 text-gray-600">{s.no}</td>
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
