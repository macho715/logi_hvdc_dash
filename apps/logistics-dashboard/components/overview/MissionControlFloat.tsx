'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MissionControl } from '@/components/overview/MissionControl'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

interface MissionControlFloatProps {
  data: OverviewCockpitResponse | null
  loading: boolean
  worklist: WorklistRow[]
  onNavigate: (intent: NavigationIntent) => void
  selectedShipmentId: string | null
  onClearSelection: () => void
}

export function MissionControlFloat({
  data,
  loading,
  worklist,
  onNavigate,
  selectedShipmentId,
  onClearSelection,
}: MissionControlFloatProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'absolute right-4 top-4 z-20 rounded-2xl border border-white/[0.08] bg-[rgba(14,19,28,0.88)] shadow-[0_8px_32px_rgba(0,0,0,0.48)] backdrop-blur-md transition-all duration-200',
        collapsed ? 'w-44' : 'w-72',
      )}
    >
      {/* Float header */}
      <div className="flex h-9 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-hvdc-text-muted">
          Mission Control
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-md p-0.5 text-hvdc-text-muted transition-colors hover:text-hvdc-text-secondary"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
        </button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <MissionControl
            data={data}
            loading={loading}
            worklist={worklist}
            onNavigate={onNavigate}
            selectedShipmentId={selectedShipmentId}
            onClearSelection={onClearSelection}
          />
        </div>
      )}
    </div>
  )
}
