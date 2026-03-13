'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChainSummary } from '@/types/chain'
import type { OverviewRouteTypeId, ChainFocus } from '@/types/overview'
import type { PipelineStage } from '@/lib/cases/pipelineStage'
import { PIPELINE_STAGE_META } from '@/lib/cases/pipelineStage'
import { PipelineCasesTable } from '@/components/pipeline/PipelineCasesTable'
import { OriginCountrySummary } from '@/components/chain/OriginCountrySummary'
import { SITE_META } from '@/lib/overview/ui'
import { cn } from '@/lib/utils'

interface ShipmentStages {
  pre_departure: number
  in_transit: number
  port_customs: number
  inland: number
  delivered: number
  total: number
  nominated_shu: number
  nominated_das: number
  nominated_mir: number
  nominated_agi: number
  agi_das_no_mosb_alert: number
}

const EMPTY_VOYAGE_STAGES: ShipmentStages = {
  pre_departure: 0,
  in_transit: 0,
  port_customs: 0,
  inland: 0,
  delivered: 0,
  total: 0,
  nominated_shu: 0,
  nominated_das: 0,
  nominated_mir: 0,
  nominated_agi: 0,
  agi_das_no_mosb_alert: 0,
}

const EMPTY_SUMMARY: ChainSummary = {
  origins: [],
  ports: [],
  stages: {
    'pre-arrival': 0,
    port: 0,
    warehouse: 0,
    mosb: 0,
    site: 0,
  },
  sites: {
    land: { SHU: 0, MIR: 0 },
    island: { DAS: 0, AGI: 0 },
  },
  mosbTransit: 0,
}

function getStageForFocus(focus?: ChainFocus): PipelineStage {
  switch (focus) {
    case 'origin':
      return 'pre-arrival'
    case 'port':
      return 'port'
    case 'warehouse':
      return 'warehouse'
    case 'mosb':
      return 'mosb'
    case 'site':
      return 'site'
    default:
      return 'pre-arrival'
  }
}

function getFocusForStage(stage: PipelineStage): ChainFocus {
  switch (stage) {
    case 'pre-arrival':
      return 'origin'
    case 'port':
      return 'port'
    case 'warehouse':
      return 'warehouse'
    case 'mosb':
      return 'mosb'
    case 'site':
      return 'site'
  }
}

function ChainNode({
  title,
  subtitle,
  count,
  voyageCount,
  active = false,
  accentClass,
  onClick,
  children,
}: {
  title: string
  subtitle: string
  count: number
  voyageCount?: number
  active?: boolean
  accentClass?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border px-4 py-4 text-left transition-colors',
        active
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-800 bg-gray-900/80 hover:border-gray-700 hover:bg-gray-900',
      )}
    >
      <div className={cn('text-xs font-semibold uppercase tracking-wide text-gray-500', accentClass)}>{title}</div>
      <div className="mt-2 text-2xl font-bold text-white">{count.toLocaleString()}</div>
      <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>
      {voyageCount !== undefined ? (
        <div className="mt-1.5 text-xs font-medium text-blue-400">항차 {voyageCount.toLocaleString()}건</div>
      ) : null}
      {children}
    </button>
  )
}

interface FlowChainProps {
  compact?: boolean
  focus?: ChainFocus
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  routeType?: OverviewRouteTypeId
  onFocusChange?: (focus: ChainFocus) => void
  onSiteChange?: (site: 'SHU' | 'MIR' | 'DAS' | 'AGI') => void
}

export function FlowChain({
  compact = false,
  focus,
  site,
  routeType,
  onFocusChange,
  onSiteChange,
}: FlowChainProps) {
  const [summary, setSummary] = useState<ChainSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<PipelineStage>(getStageForFocus(focus))
  const [voyageStages, setVoyageStages] = useState<ShipmentStages>(EMPTY_VOYAGE_STAGES)
  const [voyageLoading, setVoyageLoading] = useState(true)

  useEffect(() => {
    setSelectedStage(getStageForFocus(focus))
  }, [focus])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (site) params.set('site', site)
    if (routeType) params.set('route_type', routeType)

    fetch(`/api/chain/summary${params.toString() ? `?${params.toString()}` : ''}`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setSummary((json as ChainSummary) ?? EMPTY_SUMMARY)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSummary(EMPTY_SUMMARY)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [routeType, site])

  useEffect(() => {
    let cancelled = false
    setVoyageLoading(true)

    fetch('/api/shipments/stages')
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return
        setVoyageStages((json as ShipmentStages) ?? EMPTY_VOYAGE_STAGES)
        setVoyageLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setVoyageStages(EMPTY_VOYAGE_STAGES)
        setVoyageLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const stageCards = useMemo(
    () =>
      (Object.keys(PIPELINE_STAGE_META) as PipelineStage[]).map((stage) => ({
        stage,
        label: PIPELINE_STAGE_META[stage].label,
        subtitle: PIPELINE_STAGE_META[stage].sublabel,
        count: summary.stages[stage] ?? 0,
      })),
    [summary.stages],
  )

  const changeStage = (stage: PipelineStage) => {
    setSelectedStage(stage)
    onFocusChange?.(getFocusForStage(stage))
  }

  return (
    <div className="space-y-4">
      {!compact ? <OriginCountrySummary origins={summary.origins} /> : null}

      <section className="rounded-2xl border border-gray-800 bg-[radial-gradient(circle_at_top,#1e3a8a22,transparent_45%),rgba(15,23,42,0.88)] p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">전체 물류 체인</h2>
            <p className="text-sm text-gray-400">
              원산지 → 항만/통관 → 창고 → MOSB → 현장 흐름을 단계별로 압축 표시합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
              MOSB 경유 경로 {summary.mosbTransit.toLocaleString()}건
            </div>
            {!voyageLoading && voyageStages.agi_das_no_mosb_alert > 0 ? (
              <div className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                필수 MOSB 경유 누락 {voyageStages.agi_das_no_mosb_alert.toLocaleString()}건
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-800/70" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              {stageCards.map((card) => (
                <ChainNode
                  key={card.stage}
                  title={card.label}
                  subtitle={`케이스 ${card.count.toLocaleString()}건`}
                  count={card.count}
                  active={selectedStage === card.stage}
                  onClick={() => changeStage(card.stage)}
                />
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
              <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
                <div className="mb-3 text-sm font-semibold text-white">원산지 / 항만 현황</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-3">
                    <div className="mb-2 text-xs text-gray-500">원산지 Top 5</div>
                    <div className="space-y-1 text-sm text-gray-300">
                      {summary.origins.slice(0, 5).map((origin) => (
                        <div key={origin.country} className="flex items-center justify-between">
                          <span>{origin.country}</span>
                          <span className="text-gray-500">{origin.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-3">
                    <div className="mb-2 text-xs text-gray-500">항만 / 공항</div>
                    <div className="space-y-1 text-sm text-gray-300">
                      {summary.ports.map((port) => (
                        <div key={port.name} className="flex items-center justify-between">
                          <span>{port.name}</span>
                          <span className="text-gray-500">{port.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
                <div className="mb-3 text-sm font-semibold text-white">육상 현장</div>
                <div className="space-y-2">
                  {(['SHU', 'MIR'] as const).map((siteKey) => (
                    <ChainNode
                      key={siteKey}
                      title={siteKey}
                      subtitle={`케이스 ${summary.sites.land[siteKey].toLocaleString()}건`}
                      count={summary.sites.land[siteKey]}
                      voyageCount={siteKey === 'SHU' ? voyageStages.nominated_shu : voyageStages.nominated_mir}
                      active={site === siteKey || selectedStage === 'site'}
                      accentClass={SITE_META[siteKey].accentClass}
                      onClick={() => {
                        changeStage('site')
                        onSiteChange?.(siteKey)
                      }}
                    >
                      <div className="mt-1 text-xs text-gray-500">직접 배송 중심</div>
                    </ChainNode>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
                <div className="mb-3 text-sm font-semibold text-white">도서 현장</div>
                <div className="space-y-2">
                  {(['DAS', 'AGI'] as const).map((siteKey) => (
                    <ChainNode
                      key={siteKey}
                      title={siteKey}
                      subtitle={`케이스 ${summary.sites.island[siteKey].toLocaleString()}건`}
                      count={summary.sites.island[siteKey]}
                      voyageCount={siteKey === 'DAS' ? voyageStages.nominated_das : voyageStages.nominated_agi}
                      active={site === siteKey || selectedStage === 'site'}
                      accentClass={SITE_META[siteKey].accentClass}
                      onClick={() => {
                        changeStage('site')
                        onSiteChange?.(siteKey)
                      }}
                    >
                      <div className="mt-1 text-xs text-orange-400/80">MOSB 경유 기준 관리</div>
                      {siteKey === 'AGI' && !voyageLoading && voyageStages.agi_das_no_mosb_alert > 0 ? (
                        <div className="mt-1.5 inline-block rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                          필수 MOSB 경유 누락 {voyageStages.agi_das_no_mosb_alert}건
                        </div>
                      ) : null}
                    </ChainNode>
                  ))}
                </div>
              </section>
            </div>

            {!voyageLoading ? (
              <section className="rounded-2xl border border-gray-800/60 bg-gray-900/60 p-4">
                <div className="mb-3 text-sm font-semibold text-white">노미현장별 항차 현황</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { site: 'SHU', count: voyageStages.nominated_shu, note: '육상 직배' },
                    { site: 'MIR', count: voyageStages.nominated_mir, note: '육상 직배' },
                    { site: 'DAS', count: voyageStages.nominated_das, note: 'MOSB 기준 관리' },
                    { site: 'AGI', count: voyageStages.nominated_agi, note: 'MOSB 기준 관리' },
                  ].map(({ site: siteKey, count, note }) => (
                    <button
                      key={siteKey}
                      type="button"
                      onClick={() => {
                        changeStage('site')
                        onSiteChange?.(siteKey as 'SHU' | 'MIR' | 'DAS' | 'AGI')
                      }}
                      className="flex flex-col gap-1 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-left"
                    >
                      <div className={`text-xs font-semibold uppercase tracking-wide ${SITE_META[siteKey as keyof typeof SITE_META].accentClass}`}>
                        {siteKey}
                      </div>
                      <div className="text-xl font-bold text-white">{count.toLocaleString()}건</div>
                      <div className="text-xs text-gray-500">{note}</div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </section>

      {!compact ? (
        <PipelineCasesTable
          stage={selectedStage}
          routeType={routeType}
          filters={{
            site: site ?? 'all',
            vendor: 'all',
            category: 'all',
          }}
          title="체인 선택 단계 케이스"
        />
      ) : null}
    </div>
  )
}
