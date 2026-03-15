'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { NavigationIntent, OverviewCockpitResponse } from '@/types/overview'
import type { WorklistRow } from '@repo/shared'

// ─── Design constants ─────────────────────────────────────────────
const PANEL_CLS = 'rounded-[22px] border border-white/20 bg-[linear-gradient(180deg,rgba(12,18,34,.95),rgba(8,13,26,.98))] px-5 py-4 shadow-hvdc-panel'
const ROW_CLS   = 'flex items-start gap-3 rounded-[16px] border border-white/15 bg-[linear-gradient(180deg,rgba(17,23,42,.9),rgba(10,14,28,.95))] px-4 py-3'
// ─────────────────────────────────────────────────────────────────

// Lock icon for row right side
function LockIcon() {
  return (
    <div className="shrink-0 h-8 w-8 grid place-items-center rounded-md border border-white/20 bg-white/[0.03]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-hvdc-text-muted" fill="currentColor">
        <path fillRule="evenodd" d="M8 1a3 3 0 00-3 3v1H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 1.5A1.5 1.5 0 019.5 4v1h-3V4A1.5 1.5 0 018 2.5z" clipRule="evenodd" />
      </svg>
    </div>
  )
}

interface MissionRowProps {
  accent: string
  primary: string
  secondary?: string
  onClick?: () => void
}

function MissionRow({ accent, primary, secondary, onClick }: MissionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(ROW_CLS, 'w-full text-left transition hover:bg-white/[0.04]')}
    >
      <div className="h-[42px] w-[4px] shrink-0 rounded-full" style={{ background: accent }} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-white truncate">{primary}</div>
        {secondary && (
          <div className="mt-0.5 text-[12px] text-hvdc-text-muted truncate">{secondary}</div>
        )}
      </div>
      <LockIcon />
    </button>
  )
}

interface PanelHeaderProps {
  title: string
  count?: number
  badgeColor?: string
  subtext?: string
}

function PanelHeader({ title, count, badgeColor = '#F3C562', subtext }: PanelHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-[16px] font-medium text-white">{title}</span>
      {count != null && count > 0 && (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white/6"
          style={{ color: badgeColor }}
        >
          {count}
        </span>
      )}
      {subtext && (
        <span className="ml-auto text-[11px] text-hvdc-text-muted">{subtext}</span>
      )}
    </div>
  )
}

interface MissionControlProps {
  data: OverviewCockpitResponse | null
  loading?: boolean
  worklist: WorklistRow[]
  onNavigate: (intent: NavigationIntent) => void
  selectedShipmentId?: string | null
  onClearSelection?: () => void
}

export function MissionControl({
  data,
  loading = false,
  worklist: _worklist,
  onNavigate,
  selectedShipmentId: _selectedShipmentId,
  onClearSelection: _onClearSelection,
}: MissionControlProps) {
  const t = useT()

  if (loading && !data) {
    return (
      <aside className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        </div>
        {[140, 160, 150].map((h, i) => (
          <div key={i} className={cn(PANEL_CLS, 'animate-pulse')} style={{ height: h }} />
        ))}
      </aside>
    )
  }

  if (!data) {
    return (
      <aside className="flex flex-col gap-3">
        <p className="text-sm text-hvdc-text-secondary">{t.rightPanel.loadError}</p>
      </aside>
    )
  }

  const criticalAlerts = data.alerts.filter(a => a.severity === 'critical')
  const warningAlerts  = data.alerts.filter(a => a.severity !== 'critical')
  const liveFeed       = data.liveFeed.slice(-3)

  return (
    <aside className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-[18px] font-medium text-hvdc-text-soft">Mission Control</span>
        <span className="text-[11px] text-hvdc-text-muted">◐ »</span>
      </div>

      {/* Panel 1: Critical Alerts */}
      <div className={PANEL_CLS}>
        <PanelHeader
          title="Critical Alerts"
          count={criticalAlerts.length}
          badgeColor="#FF9C4D"
        />
        {criticalAlerts.length === 0 ? (
          <div className="text-[13px] text-hvdc-text-muted">{t.missionControl.noItems}</div>
        ) : (
          <div className="space-y-2">
            {criticalAlerts.slice(0, 2).map(alert => (
              <MissionRow
                key={alert.id}
                accent="#FF9C4D"
                primary={alert.title}
                secondary={alert.description}
                onClick={() => onNavigate(alert.navigationIntent)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Panel 2: Action Queue */}
      <div className={PANEL_CLS}>
        <PanelHeader
          title="Action Queue"
          count={warningAlerts.length || data.routeSummary.length}
          badgeColor="#F5C366"
        />
        {warningAlerts.length > 0 ? (
          <div className="space-y-2">
            {warningAlerts.slice(0, 2).map(alert => (
              <MissionRow
                key={alert.id}
                accent="#F5C366"
                primary={alert.title}
                secondary={alert.description}
                onClick={() => onNavigate(alert.navigationIntent)}
              />
            ))}
          </div>
        ) : data.routeSummary.length > 0 ? (
          <div className="space-y-2">
            {data.routeSummary.slice(0, 2).map(item => (
              <MissionRow
                key={item.routeTypeId}
                accent="#F5C366"
                primary={`${item.routeTypeId} · ${item.count.toLocaleString()}`}
                secondary={`${item.percent.toFixed(1)}%`}
                onClick={() => onNavigate(item.navigationIntent)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-hvdc-text-muted">{t.missionControl.noItems}</div>
        )}
      </div>

      {/* Panel 3: Next 72 Hours */}
      <div className={PANEL_CLS}>
        <PanelHeader
          title="Next 72 Hours"
          count={liveFeed.length}
          badgeColor="#F5C366"
          subtext="Incoming"
        />
        {liveFeed.length === 0 ? (
          <div className="text-[13px] text-hvdc-text-muted">{t.missionControl.noItems}</div>
        ) : (
          <div className="space-y-2">
            {liveFeed.map(item => (
              <MissionRow
                key={item.id}
                accent="#FF7D52"
                primary={item.title}
                secondary={item.subtitle ?? formatDistanceToNowStrict(new Date(item.timestamp), { addSuffix: true, locale: ko })}
                onClick={() => onNavigate(item.navigationIntent)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
