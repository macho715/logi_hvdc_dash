'use client'

import { useEffect, useState } from 'react'
import type { ShipmentRow } from '@/types/cases'

export function ShipmentsTable() {
  const [data, setData] = useState<ShipmentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    vendor: 'all', pod: 'all', customs_status: 'all', ship_mode: 'all',
  })

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '50' })
    Object.entries(filter).forEach(([k, v]) => { if (v !== 'all') params.set(k, v) })
    fetch(`/api/shipments?${params}`)
      .then(r => r.json())
      .then(j => { setData(j.data ?? []); setTotal(j.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filter])

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Simple filter row */}
      <div className="flex gap-3 p-2 bg-gray-900 border-b border-gray-800 text-xs">
        {(['cleared','in_progress','pending'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, customs_status: f.customs_status === s ? 'all' : s }))}
            className={`px-2 py-1 rounded ${filter.customs_status === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            {s === 'cleared' ? '통관완료' : s === 'in_progress' ? '진행중' : '대기'}
          </button>
        ))}
        <span className="ml-auto text-gray-600">총 {total.toLocaleString()}건</span>
      </div>

      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left">SCT SHIP NO</th>
            <th className="py-2 px-3 text-left">벤더</th>
            <th className="py-2 px-3 text-left">POL→POD</th>
            <th className="py-2 px-3 text-left">ETD</th>
            <th className="py-2 px-3 text-left">ETA</th>
            <th className="py-2 px-3 text-left">통관</th>
            <th className="py-2 px-3 text-left">모드</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7} className="py-8 text-center text-gray-600">Loading...</td></tr>}
          {!loading && data.map(s => (
            <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-1.5 px-3 font-mono">{s.sct_ship_no}</td>
              <td className="py-1.5 px-3">{s.vendor}</td>
              <td className="py-1.5 px-3">{s.pol} → {s.pod}</td>
              <td className="py-1.5 px-3">{s.etd ?? '–'}</td>
              <td className="py-1.5 px-3">{s.eta ?? '–'}</td>
              <td className="py-1.5 px-3">
                <span className={s.customs_status === 'cleared' ? 'text-green-400' : s.customs_status === 'in_progress' ? 'text-yellow-400' : 'text-gray-500'}>
                  {s.customs_status === 'cleared' ? '완료' : s.customs_status === 'in_progress' ? '진행중' : '대기'}
                </span>
              </td>
              <td className="py-1.5 px-3">{s.ship_mode}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex gap-2 p-2 border-t border-gray-800 justify-center text-xs">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          className="px-2 py-1 bg-gray-800 rounded disabled:opacity-30">이전</button>
        <span className="text-gray-500 py-1">Page {page}</span>
        <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}
          className="px-2 py-1 bg-gray-800 rounded disabled:opacity-30">다음</button>
      </div>
    </div>
  )
}
