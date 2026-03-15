"use client"

import { useT } from "@/hooks/useT"
import { UAE_OPS_LEFT_PANEL_COPY } from "@/lib/map/uaeOpsCopy"

export type MapTrack = "global" | "uae-ops"

export interface MapLayerToggles {
  showOriginArcs: boolean
  showTrips: boolean
  showCustoms: boolean
  showWarehouses: boolean
  showMosb: boolean
  showSites: boolean
}

interface MapTrackSwitchProps {
  track: MapTrack
  toggles: MapLayerToggles
  onTrackChange: (track: MapTrack) => void
  onToggleChange: <K extends keyof MapLayerToggles>(key: K, value: MapLayerToggles[K]) => void
}

function ToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-1.5 text-[11px] font-medium transition",
        active
          ? "border-[#2F76FF]/40 bg-hvdc-brand/15 text-hvdc-text-primary shadow-hvdc-blue"
          : "border-white/12 bg-white/[0.03] text-hvdc-text-secondary hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

export function MapTrackSwitch({
  track,
  toggles,
  onTrackChange,
  onToggleChange,
}: MapTrackSwitchProps) {
  const t = useT()

  const visibleToggles =
    track === "global"
      ? [
          { key: "showOriginArcs" as const, label: t.layers.originArc, active: toggles.showOriginArcs },
          { key: "showTrips" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.voyages, active: toggles.showTrips },
        ]
      : [
          { key: "showTrips" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.voyages, active: toggles.showTrips },
          { key: "showCustoms" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.customs, active: toggles.showCustoms },
          { key: "showWarehouses" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.warehouse, active: toggles.showWarehouses },
          { key: "showMosb" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.mosb, active: toggles.showMosb },
          { key: "showSites" as const, label: UAE_OPS_LEFT_PANEL_COPY.toggles.sites, active: toggles.showSites },
        ]

  return (
    <div className="pointer-events-auto absolute left-3 right-3 top-3 z-50 sm:right-auto sm:w-[min(360px,calc(100%-24px))]">
      <div className="rounded-hvdc-lg border border-white/20 bg-hvdc-bg-overlay px-3 py-3 shadow-hvdc-card backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-hvdc-text-muted">
              {UAE_OPS_LEFT_PANEL_COPY.modeTitle}
            </div>
            <div className="mt-1 text-xs text-hvdc-text-secondary">
              {UAE_OPS_LEFT_PANEL_COPY.modeDesc}
            </div>
            {track === "uae-ops" ? (
              <div className="mt-1 text-[11px] text-hvdc-text-secondary">
                {UAE_OPS_LEFT_PANEL_COPY.modeDesc2}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => onTrackChange("global")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                track === "global"
                  ? "bg-hvdc-brand text-white shadow-hvdc-blue"
                  : "text-hvdc-text-secondary hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {t.overviewMap.globalTrack}
            </button>
            <button
              type="button"
              onClick={() => onTrackChange("uae-ops")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                track === "uae-ops"
                  ? "bg-hvdc-brand text-white shadow-hvdc-blue"
                  : "text-hvdc-text-secondary hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {t.overviewMap.uaeOpsTrack}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleToggles.map((toggle) => (
            <ToggleChip
              key={toggle.key}
              active={toggle.active}
              label={toggle.label}
              onClick={() => onToggleChange(toggle.key, !toggle.active)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
