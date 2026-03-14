'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildDashboardLink, parseCargoQuery } from '@/lib/navigation/contracts'
import { WhStatusTable } from '@/components/cargo/WhStatusTable'
import { ShipmentsTable } from '@/components/cargo/ShipmentsTable'
import { DsvStockTable } from '@/components/cargo/DsvStockTable'
import { CargoDrawer } from '@/components/cargo/CargoDrawer'
import { useCasesStore } from '@/store/casesStore'
import { cn } from '@/lib/utils'
import { ui } from '@/lib/overview/ui'

type TabKey = 'wh' | 'shipments' | 'stock'

function getTabFromSearchParams(searchParams: Pick<URLSearchParams, 'get'>): TabKey | null {
  const tab = searchParams.get('tab')
  if (tab === 'wh' || tab === 'shipments' || tab === 'stock') {
    return tab
  }

  return null
}

export function CargoTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openDrawer } = useCasesStore()
  const [activeTab, setActiveTab] = useState<TabKey>('wh')
  const [hasHydratedTab, setHasHydratedTab] = useState(false)
  const [shipmentTotal, setShipmentTotal] = useState<number | null>(null)

  useEffect(() => {
    const tab = getTabFromSearchParams(searchParams)
    if (tab) {
      setActiveTab(tab)
    }
    setHasHydratedTab(true)
  }, [searchParams])

  useEffect(() => {
    const caseId = searchParams.get('caseId')
    if (caseId && activeTab === 'wh') {
      openDrawer(caseId)
    }
  }, [activeTab, openDrawer, searchParams])

  useEffect(() => {
    if (!hasHydratedTab) return
    if (getTabFromSearchParams(searchParams) === activeTab) return
    router.replace(
      buildDashboardLink({ page: 'cargo', params: { ...parseCargoQuery(searchParams), tab: activeTab } }),
      { scroll: false },
    )
  }, [activeTab, hasHydratedTab, router, searchParams])

  // Fetch shipment total from /api/shipments/stages
  useEffect(() => {
    fetch('/api/shipments/stages')
      .then(r => r.json())
      .then(data => { setShipmentTotal(data.total ?? null) })
      .catch(() => { /* leave as null */ })
  }, [])

  const tabs = [
    { key: 'wh' as TabKey,        label: 'WH STATUS',  countNode: <span className="ml-2 text-slate-500 font-normal">8,680</span> },
    {
      key: 'shipments' as TabKey,
      label: 'SHIPMENTS',
      countNode: (
        <span className="ml-2 text-slate-500 font-normal">
          {shipmentTotal !== null ? shipmentTotal.toLocaleString() : '…'}
        </span>
      ),
    },
    { key: 'stock' as TabKey,     label: 'DSV STOCK',  countNode: null },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-hvdc-border-soft bg-hvdc-bg-panel">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-5 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === t.key
                ? 'border-hvdc-brand text-hvdc-text-primary'
                : 'border-transparent text-hvdc-text-muted hover:text-hvdc-text-primary'
            )}
          >
            {t.label}
            {t.countNode}
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
