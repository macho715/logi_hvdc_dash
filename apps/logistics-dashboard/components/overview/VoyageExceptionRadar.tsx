'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewAlert } from '@/types/overview'

type RadarTab = 'all' | 'critical' | 'warning' | 'overdue'

interface VoyageExceptionRadarProps {
  alerts: OverviewAlert[]
  loading?: boolean
  onNavigate: (intent: NavigationIntent) => void
}

function severityBarColor(s: OverviewAlert['severity']): string {
  if (s === 'critical') return 'bg-hvdc-status-risk'
  if (s === 'warning')  return 'bg-hvdc-status-warn'
  return 'bg-hvdc-status-info'
}

function severityBadge(s: OverviewAlert['severity']): string {
  if (s === 'critical') return 'bg-hvdc-status-risk/10 text-hvdc-status-risk ring-1 ring-hvdc-status-risk/18'
  if (s === 'warning')  return 'bg-hvdc-status-warn/12 text-hvdc-status-warn ring-1 ring-hvdc-status-warn/20'
  return 'bg-hvdc-status-info/12 text-hvdc-status-info ring-1 ring-hvdc-status-info/20'
}

export function VoyageExceptionRadar({ alerts, loading, onNavigate }: VoyageExceptionRadarProps) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<RadarTab>('all')

  const TABS: { id: RadarTab; label: string }[] = [
    { id: 'all',      label: t.voyageRadar.tabAll },
    { id: 'critical', label: t.voyageRadar.tabCritical },
    { id: 'warning',  label: t.voyageRadar.tabWarning },
    { id: 'overdue',  label: t.voyageRadar.tabOverdue },
  ]

  const filtered = alerts.filter((a) => {
    if (activeTab === 'all')      return true
    if (activeTab === 'critical') return a.severity === 'critical'
    if (activeTab === 'warning')  return a.severity === 'warning'
    if (activeTab === 'overdue')  return a.alertTypeId.includes('overdue') || a.alertTypeId.includes('eta')
    return true
  })

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-hvdc-text-secondary">
          {t.voyageRadar.title}
        </h3>
        <span className="text-[11px] text-hvdc-text-muted">{alerts.length}</span>
      </div>
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-hvdc-brand/15 text-hvdc-brand'
                : 'text-hvdc-text-muted hover:text-hvdc-text-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex h-12 animate-pulse items-center gap-3 rounded-xl px-3">
                <div className="h-7 w-[3px] shrink-0 rounded-full bg-white/10" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-3 w-3/5 rounded bg-white/10" />
                  <div className="h-2.5 w-2/5 rounded bg-white/[0.06]" />
                </div>
              </div>
            ))
          : filtered.length === 0
          ? <p className="py-6 text-center text-[12px] text-hvdc-text-muted">{t.voyageRadar.noItems}</p>
          : filtered.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onNavigate(alert.navigationIntent)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className={cn('h-7 w-[3px] shrink-0 self-center rounded-full', severityBarColor(alert.severity))} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium text-hvdc-text-primary">{alert.title}</span>
                  <span className="truncate text-[11px] text-hvdc-text-muted">{alert.description}</span>
                </div>
                {alert.count > 0 && (
                  <span className={cn('shrink-0 self-center rounded-full px-2 py-0.5 text-[11px] font-semibold', severityBadge(alert.severity))}>
                    {alert.count}
                  </span>
                )}
              </button>
            ))
        }
      </div>
    </div>
  )
}
