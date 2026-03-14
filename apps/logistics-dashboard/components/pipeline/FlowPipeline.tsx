'use client'

import { useEffect } from 'react'

import { useCasesStore } from '@/store/casesStore'
import type { PipelineStage } from '@/types/cases'
import { PIPELINE_STAGE_META } from '@/lib/cases/pipelineStage'
import { cn } from '@/lib/utils'
import { ui } from '@/lib/overview/ui'

const STAGES = Object.keys(PIPELINE_STAGE_META) as PipelineStage[]

interface FlowPipelineProps {
  activeStage?: PipelineStage | null
  onStageChange?: (stage: PipelineStage | null) => void
}

export function FlowPipeline({ activeStage: controlledStage, onStageChange }: FlowPipelineProps = {}) {
  const { summary, fetchSummary, activePipelineStage, setActivePipelineStage } = useCasesStore()

  useEffect(() => {
    if (!summary) {
      void fetchSummary()
    }
  }, [fetchSummary, summary])

  const total = summary?.total ?? 0
  const selectedStage = controlledStage ?? activePipelineStage

  return (
    <div className={`flex items-stretch gap-0 overflow-hidden ${ui.panel}`}>
      {STAGES.map((stage, i) => {
        const meta = PIPELINE_STAGE_META[stage]
        const count = summary?.byStatus[meta.summaryKey] ?? 0
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        const active = selectedStage === stage

        return (
          <div key={stage} className="flex items-center">
            {i > 0 && (
              <div className="select-none px-1 text-xl text-hvdc-text-muted">→</div>
            )}
            <button
              onClick={() =>
                (() => {
                  const nextStage = active ? null : stage
                  setActivePipelineStage(nextStage)
                  onStageChange?.(nextStage)
                })()
              }
              className={cn(
                'flex min-w-[140px] flex-col items-center px-6 py-4 transition-colors text-center',
                active
                  ? `${meta.activeClass} text-white`
                  : 'text-hvdc-text-primary hover:bg-hvdc-surface-hover'
              )}
            >
              <span className="text-2xl font-bold">{count.toLocaleString()}</span>
              <span className="mt-1 text-xs">{meta.label}</span>
              <span className="mt-1 text-[11px] text-hvdc-text-secondary">{meta.sublabel}</span>
              <span className="mt-0.5 text-xs text-hvdc-text-secondary">{pct}%</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
