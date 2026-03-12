'use client'

import { useCasesStore } from '@/store/casesStore'
import type { PipelineStage } from '@/types/cases'
import { cn } from '@/lib/utils'

const STAGES: { key: PipelineStage; label: string; statusKey: 'Pre Arrival' | 'warehouse' | 'site' }[] = [
  { key: 'pre-arrival', label: 'Pre-Arrival',   statusKey: 'Pre Arrival' },
  { key: 'warehouse',  label: '창고/MOSB',       statusKey: 'warehouse'  },
  { key: 'site',       label: '현장 도착',        statusKey: 'site'       },
]

export function FlowPipeline() {
  const { summary, activePipelineStage, setActivePipelineStage } = useCasesStore()

  const total = summary?.total ?? 0

  return (
    <div className="flex items-stretch gap-0 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {STAGES.map((stage, i) => {
        const count = summary?.byStatus[stage.statusKey] ?? 0
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        const active = activePipelineStage === stage.key

        return (
          <div key={stage.key} className="flex items-center">
            {i > 0 && (
              <div className="text-gray-600 text-xl px-1 select-none">→</div>
            )}
            <button
              onClick={() =>
                setActivePipelineStage(active ? null : stage.key)
              }
              className={cn(
                'flex flex-col items-center px-8 py-4 transition-colors text-center',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <span className="text-2xl font-bold">{count.toLocaleString()}</span>
              <span className="text-xs mt-1">{stage.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{pct}%</span>
              {/* MOSB sub-count for warehouse stage */}
              {stage.key === 'warehouse' && summary && (
                <span className="text-xs text-orange-400 mt-1">
                  MOSB {(summary.bySqmByLocation['MOSB'] ?? 0) > 0 ? '~304' : '–'}건 포함
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
