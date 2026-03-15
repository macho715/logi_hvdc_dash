'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useCasesStore } from '@/store/casesStore'
import { ui } from '@/lib/overview/ui'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import { useT } from '@/hooks/useT'

type SiteKey = 'SHU' | 'MIR' | 'DAS' | 'AGI'

interface ChainSummaryStages {
  'pre-arrival': number
  port: number
  warehouse: number
  mosb: number
  site: number
}

interface ChainSummaryData {
  origins: { country: string; count: number }[]
  ports: { name: string; count: number }[]
  stages: ChainSummaryStages
  sites: { land: { SHU: number; MIR: number }; island: { DAS: number; AGI: number } }
  mosbTransit: number
}

interface ChainRibbonStripProps {
  site?: SiteKey
  onStageClick?: (stage: PipelineStage) => void
}

export function ChainRibbonStrip({ site, onStageClick }: ChainRibbonStripProps) {
  const setActivePipelineStage = useCasesStore((s) => s.setActivePipelineStage)
  const t = useT()

  const NODES: { label: string; stageKey: keyof ChainSummaryStages | null; color: string }[] = [
    { label: t.chainRibbon.origin,    stageKey: 'pre-arrival', color: 'bg-white/[0.03] border-hvdc-border-soft border-l-2 border-l-white/20' },
    { label: t.chainRibbon.portAir,   stageKey: 'port',        color: 'bg-hvdc-status-info/8 border-hvdc-status-info/15 border-l-2 border-l-hvdc-status-info/50' },
    { label: t.chainRibbon.customs,   stageKey: 'port',        color: 'bg-hvdc-brand/8 border-hvdc-brand/15 border-l-2 border-l-hvdc-brand/50' },
    { label: t.chainRibbon.warehouse, stageKey: 'warehouse',   color: 'bg-hvdc-brand-amber/8 border-hvdc-brand-amber/15 border-l-2 border-l-hvdc-brand-amber/50' },
    { label: t.chainRibbon.mosb,      stageKey: 'mosb',        color: 'bg-hvdc-brand-cyan/8 border-hvdc-brand-cyan/15 border-l-2 border-l-hvdc-brand-cyan/50' },
    { label: t.chainRibbon.site,      stageKey: 'site',        color: 'bg-hvdc-status-ok/8 border-hvdc-status-ok/15 border-l-2 border-l-hvdc-status-ok/50' },
  ]

  const [data, setData] = useState<ChainSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const url = `/api/chain/summary${site ? `?site=${site}` : ''}`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ChainSummaryData>
      })
      .then((json) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [site])

  if (loading) {
    return (
      <div className="rounded-hvdc-xl border border-hvdc-border-soft bg-hvdc-panel shadow-hvdc-card px-4 py-3">
        <div className="flex items-stretch justify-between gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 flex-1 animate-pulse rounded-hvdc-lg bg-hvdc-surface-subtle" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return null
  }

  const stages = data?.stages ?? null
  const totalCount = stages
    ? stages['pre-arrival'] + stages.port + stages.warehouse + stages.mosb + stages.site
    : 0

  return (
    <div className="rounded-hvdc-xl border border-hvdc-border-soft bg-hvdc-panel shadow-hvdc-card px-4 py-3">
      {/* Nodes wrapper */}
      <div className={cn('relative z-10 flex items-stretch justify-between gap-0.5 ribbon-trace')}>
        {NODES.map((node, idx) => {
          const count =
            node.stageKey !== null && stages !== null ? stages[node.stageKey] : null
          const share =
            count !== null && totalCount > 0
              ? `${((count / totalCount) * 100).toFixed(0)}%`
              : '—'
          const displayCount = count !== null ? count : '—'

          const handleClick = () => {
            if (node.stageKey !== null) {
              setActivePipelineStage(node.stageKey as PipelineStage)
              onStageClick?.(node.stageKey as PipelineStage)
            }
          }

          return (
            <React.Fragment key={node.label}>
              {idx > 0 && (
                <span className="shrink-0 self-center text-[10px] text-hvdc-text-muted">›</span>
              )}
              <div
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleClick()
                }}
                className={cn(
                  'flex-1 rounded-hvdc-lg border p-2 text-center cursor-pointer transition-all duration-150 hover:scale-[1.02] hover:shadow-hvdc-card',
                  node.color,
                )}
              >
                <div className="text-[10px] font-bold uppercase tracking-hvdc-label text-hvdc-text-muted">
                  {node.label}
                </div>
                <div className="my-1 text-[20px] font-semibold leading-none tracking-[-0.02em] text-hvdc-text-primary">
                  {displayCount}
                </div>
                <div className="text-[10px] text-hvdc-text-muted">{share}</div>
                {count !== null && totalCount > 0 && (
                  <div className="mt-1.5 h-0.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-current opacity-50"
                      style={{ width: `${(count / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
