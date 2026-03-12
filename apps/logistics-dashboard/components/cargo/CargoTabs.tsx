'use client'

import { useState } from 'react'
import { WhStatusTable } from '@/components/cargo/WhStatusTable'
import { ShipmentsTable } from '@/components/cargo/ShipmentsTable'
import { DsvStockTable } from '@/components/cargo/DsvStockTable'
import { CargoDrawer } from '@/components/cargo/CargoDrawer'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'wh',        label: 'WH STATUS',  count: '8,680' },
  { key: 'shipments', label: 'SHIPMENTS',  count: '874'   },
  { key: 'stock',     label: 'DSV STOCK',  count: '791'   },
] as const

type TabKey = typeof TABS[number]['key']

export function CargoTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('wh')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-5 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === t.key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {t.label}
            <span className="ml-2 text-gray-600 font-normal">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'wh'        && <WhStatusTable />}
        {activeTab === 'shipments' && <ShipmentsTable />}
        {activeTab === 'stock'     && <DsvStockTable />}
      </div>

      {/* Drawer (WH STATUS tab only) */}
      <CargoDrawer />
    </div>
  )
}
