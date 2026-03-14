'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useCasesStore } from '@/store/casesStore'
import { useT } from '@/hooks/useT'
import type { PipelineStage } from '@/lib/cases/pipelineStage'

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
  const t = useT()
  const setActivePipelineStage = useCasesStore((s) => s.setActivePipelineStage)

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

  const NODES: {
    labelKey: keyof typeof t.chainRibbon
    stageKey: keyof ChainSummaryStages | null
    color: string
  }[] = [
    { labelKey: 'origin',    stageKey: 'pre-arrival', color: 'bg-gray-50 border-gray-200' },
    { labelKey: 'portAir',   stageKey: 'port',        color: 'bg-sky-50 border-sky-200' },
    { labelKey: 'customs',   stageKey: 'port',        color: 'bg-blue-50 border-blue-200' },
    { labelKey: 'warehouse', stageKey: 'warehouse',   color: 'bg-amber-50 border-amber-200' },
    { labelKey: 'mosb',      stageKey: 'mosb',        color: 'bg-orange-50 border-orange-200' },
    { labelKey: 'site',      stageKey: 'site',        color: 'bg-green-50 border-green-200' },
  ]

  if (loading) {
    return (
      <div className="relative border-b border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-3">
        <div className="flex items-stretch justify-between gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-lg bg-gray-100 h-16" />
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
    <div className="relative border-b border-[var(--ops-border)] bg-[var(--ops-surface)] px-4 py-3">
      {/* Ribbon connecting line behind nodes */}
      <div className="absolute top-1/2 left-4 right-4 h-px bg-[var(--ops-border)] -z-0" />

      {/* Nodes wrapper */}
      <div className={cn('relative z-10 flex items-stretch justify-between gap-2 ribbon-trace')}>
        {NODES.map((node) => {
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
            <div
              key={node.labelKey}
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClick()
              }}
              className={cn(
                'flex-1 rounded-lg border p-2 text-center cursor-pointer transition-shadow duration-[140ms] hover:shadow-md',
                node.color,
              )}
            >
              {/* Stage label */}
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ops-text-muted)]">
                {t.chainRibbon[node.labelKey]}
              </div>
              {/* Count */}
              <div className="text-lg font-bold text-[var(--ops-text-strong)]">
                {displayCount}
              </div>
              {/* Share */}
              <div className="text-[10px] text-[var(--ops-text-muted)]">{share}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
