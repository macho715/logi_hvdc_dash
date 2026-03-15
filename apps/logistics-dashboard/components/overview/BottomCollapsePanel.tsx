'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { NavigationIntent, OverviewAlert, OverviewSiteReadinessItem } from '@/types/overview'

type PanelTab = 'site-matrix' | 'voyage-radar' | null

interface BottomCollapsePanelProps {
  siteReadiness: OverviewSiteReadinessItem[]
  alerts: OverviewAlert[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
  renderSiteMatrix: () => React.ReactNode
  renderVoyageRadar: () => React.ReactNode
}

const TAB_LABELS: Record<Exclude<PanelTab, null>, string> = {
  'site-matrix':  'Site Matrix',
  'voyage-radar': 'Voyage Radar',
}

export function BottomCollapsePanel({
  siteReadiness,
  alerts,
  loading,
  onNavigate,
  renderSiteMatrix,
  renderVoyageRadar,
}: BottomCollapsePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>(null)

  const isOpen = activeTab !== null

  const handleTabClick = (tab: Exclude<PanelTab, null>) => {
    setActiveTab((prev) => (prev === tab ? null : tab))
  }

  return (
    <div className="border-t border-hvdc-border-soft">
      {/* Tab bar — always visible, 48px tall */}
      <div className="flex h-12 items-center gap-1 px-4">
        {(Object.keys(TAB_LABELS) as Exclude<PanelTab, null>[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
              activeTab === tab
                ? 'bg-hvdc-brand/15 text-hvdc-brand'
                : 'text-hvdc-text-muted hover:text-hvdc-text-secondary',
            )}
          >
            {TAB_LABELS[tab]}
            {activeTab === tab ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        ))}
      </div>

      {/* Collapsible content panel */}
      {isOpen && (
        <div className="overflow-auto px-4 pb-4 pt-2" style={{ minHeight: 220, maxHeight: 320 }}>
          {activeTab === 'site-matrix' && renderSiteMatrix()}
          {activeTab === 'voyage-radar' && renderVoyageRadar()}
        </div>
      )}
    </div>
  )
}
