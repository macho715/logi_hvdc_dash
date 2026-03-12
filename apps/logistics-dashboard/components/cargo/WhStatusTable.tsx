'use client'

import { useEffect } from 'react'
import { useCasesStore } from '@/store/casesStore'
import { cn } from '@/lib/utils'

const FLOW_BADGE_COLORS: Record<number, string> = {
  0: 'bg-gray-600', 1: 'bg-blue-600', 2: 'bg-green-600',
  3: 'bg-orange-600', 4: 'bg-red-600', 5: 'bg-purple-600',
}

export function WhStatusTable() {
  const { cases, fetchCases, isLoading, openDrawer } = useCasesStore()

  useEffect(() => { fetchCases() }, [fetchCases])

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs text-gray-300 border-collapse">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="text-gray-500 border-b border-gray-700">
            <th className="py-2 px-3 text-left w-12">#</th>
            <th className="py-2 px-3 text-left">Case No</th>
            <th className="py-2 px-3 text-left w-14">Site</th>
            <th className="py-2 px-3 text-left">현재위치</th>
            <th className="py-2 px-3 text-left w-16">FC</th>
            <th className="py-2 px-3 text-left w-16">SQM</th>
            <th className="py-2 px-3 text-left w-20">Status</th>
            <th className="py-2 px-3 text-left">벤더</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">Loading...</td></tr>
          )}
          {!isLoading && cases.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-600">데이터 없음</td></tr>
          )}
          {cases.map((c, i) => (
            <tr
              key={c.id}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
              onClick={() => openDrawer(c.id)}
            >
              <td className="py-1.5 px-3 text-gray-600">{i + 1}</td>
              <td className="py-1.5 px-3 font-mono">{c.case_no}</td>
              <td className="py-1.5 px-3">{c.site}</td>
              <td className="py-1.5 px-3 truncate max-w-32">{c.status_location}</td>
              <td className="py-1.5 px-3">
                <span className={cn('px-1.5 py-0.5 rounded text-white text-[10px]', FLOW_BADGE_COLORS[c.flow_code])}>
                  FC{c.flow_code}
                </span>
              </td>
              <td className="py-1.5 px-3">{c.sqm}</td>
              <td className="py-1.5 px-3">
                {c.status_current === 'site' ? '●' : c.status_current === 'warehouse' ? '△' : '○'}
              </td>
              <td className="py-1.5 px-3">{c.source_vendor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
