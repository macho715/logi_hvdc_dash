"use client"

import { REGION_COLORS } from "@/components/map/layers/createOriginArcLayer"
import type { Region } from "@/components/map/layers/createOriginArcLayer"
import { useT } from "@/hooks/useT"
import { UAE_OPS_LEGEND_COPY } from "@/lib/map/uaeOpsCopy"

interface MapLegendProps {
  showArcs?: boolean
  showTrips?: boolean
  className?: string
  track?: "global" | "uae-ops"
}

function rgbToCss(color: [number, number, number] | [number, number, number, number]) {
  return `rgb(${color[0]},${color[1]},${color[2]})`
}

const REGION_LABELS: Record<Region, string> = {
  EU: "Europe",
  Asia: "East / SE Asia",
  ME: "Middle East",
  Americas: "Americas",
  Unknown: "Other",
}

export function MapLegend({
  showArcs = false,
  showTrips = false,
  className = "",
  track = "global",
}: MapLegendProps) {
  const t = useT()

  const globalNodeLegend = [
    { label: t.legend.hvdcSite, color: "rgb(34,197,94)", desc: "SHU · MIR · DAS · AGI" },
    { label: t.legend.mosbYard, color: "rgb(249,115,22)", desc: "MOSB staging" },
    { label: t.legend.port, color: "rgb(59,130,246)", desc: "Khalifa · Zayed · JAFZ · AUH" },
    { label: t.legend.warehouse, color: "rgb(234,179,8)", desc: "DSV inland warehouse" },
  ]

  const opsNodeLegend = [
    { label: "Port / Airport", color: "rgb(59,130,246)", desc: "UAE entry point" },
    { label: "Customs Stage", color: "rgb(53,214,255)", desc: "Clearance progress at entry point" },
    { label: "Warehouse", color: "rgb(234,179,8)", desc: "Optional inland staging" },
    { label: "MOSB Hub", color: "rgb(249,115,22)", desc: "Offshore staging / dispatch" },
    { label: "HVDC Site", color: "rgb(34,197,94)", desc: "SHU · MIR · DAS · AGI" },
  ]

  const tripLegend = [
    { label: "Voyage path", color: "rgb(120,170,255)", desc: "Subdued semantic voyage motion" },
    { label: "Selected shipment", color: "rgb(255,255,255)", desc: "Highlighted path focus" },
  ]

  const routeLegend = [
    { label: "Entry → Customs", color: "rgb(53,214,255)", desc: "Port / airport to customs" },
    { label: "Customs → Warehouse", color: "rgb(47,107,255)", desc: "Optional inland staging" },
    { label: "Customs → Site", color: "rgb(120,170,255)", desc: "Direct land-site path" },
    { label: "Warehouse → MOSB", color: "rgb(139,108,255)", desc: "Offshore staging transfer" },
    { label: "Warehouse → Site", color: "rgb(120,170,255)", desc: "Land-site dispatch" },
    { label: "MOSB → DAS / AGI", color: "rgb(46,212,122)", desc: "Offshore delivery leg" },
  ]

  const regions = (Object.entries(REGION_COLORS) as [Region, [number, number, number]][]).filter(
    ([region]) => region !== "Unknown",
  )

  const nodeLegend = track === "uae-ops" ? opsNodeLegend : globalNodeLegend

  return (
    <div
      className={[
        "pointer-events-none absolute z-40 w-56 select-none space-y-3 rounded-hvdc-lg border border-[#24314E] bg-hvdc-bg-overlay p-3 text-xs text-hvdc-text-primary shadow-hvdc-card backdrop-blur-md",
        className,
      ].join(" ")}
      aria-label="Map legend"
    >
      {track === "uae-ops" ? (
        <div className="rounded-lg border border-white/10 p-2">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-hvdc-text-primary">
            {UAE_OPS_LEGEND_COPY.title}
          </p>
          <p className="mt-1 text-[10px] text-hvdc-text-secondary">
            {UAE_OPS_LEGEND_COPY.subtitle}
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border border-white/10 p-2">
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-hvdc-text-muted">
          {track === "uae-ops" ? UAE_OPS_LEGEND_COPY.nodesTitle : t.legend.nodeType}
        </p>
        <div className="space-y-1">
          {nodeLegend.map(({ label, color, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <span
                className="inline-block h-3 w-3 flex-shrink-0 rounded-full border-2"
                style={{ borderColor: color, backgroundColor: "transparent" }}
              />
              <span className="leading-tight">
                <span className="block">{label}</span>
                <span className="block text-[10px] text-hvdc-text-secondary">{desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {track === "global" && showArcs ? (
        <div className="rounded-lg border border-white/10 p-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-hvdc-text-muted">{t.legend.originRegion}</p>
          <div className="space-y-1">
            {regions.map(([region, color]) => (
              <div key={region} className="flex items-center gap-2">
                <span
                  className="inline-block h-0.5 w-6 flex-shrink-0 rounded"
                  style={{ backgroundColor: rgbToCss(color) }}
                />
                <span>{REGION_LABELS[region]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {track === "uae-ops" ? (
        <>
          <div className="rounded-lg border border-white/10 p-2">
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-hvdc-text-muted">
              {UAE_OPS_LEGEND_COPY.routesTitle}
            </p>
            <div className="space-y-1">
              {routeLegend.map(({ label, color, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <span
                    className="inline-block h-0.5 w-6 flex-shrink-0 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="leading-tight">
                    <span className="block">{label}</span>
                    <span className="block text-[10px] text-hvdc-text-secondary">{desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-2">
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-hvdc-text-muted">
              {UAE_OPS_LEGEND_COPY.rulesTitle}
            </p>
            <div className="space-y-1 text-[10px] text-hvdc-text-secondary">
              {UAE_OPS_LEGEND_COPY.rules.map((rule) => (
                <div key={rule}>{rule}</div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {showTrips ? (
        <div className="rounded-lg border border-white/10 p-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-hvdc-text-muted">{t.legend.activeVoyage}</p>
          <div className="space-y-1">
            {tripLegend.map(({ label, color, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <span
                  className="inline-block h-0.5 w-6 flex-shrink-0 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="leading-tight">
                  <span className="block">{label}</span>
                  <span className="block text-[10px] text-hvdc-text-secondary">{desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
