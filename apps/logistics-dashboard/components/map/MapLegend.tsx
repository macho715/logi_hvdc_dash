"use client"

import { REGION_COLORS } from "@/components/map/layers/createOriginArcLayer"
import type { Region } from "@/components/map/layers/createOriginArcLayer"

interface MapLegendProps {
  /** When true, show the origin arc color legend section */
  showArcs?: boolean
  /** When true, show the trip animation legend section */
  showTrips?: boolean
}

function rgbToHex(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`
}

const REGION_LABELS: Record<Region, string> = {
  EU:       "Europe",
  Asia:     "East / SE Asia",
  ME:       "Middle East",
  Americas: "Americas",
  Unknown:  "Other",
}

const RING_LEGEND = [
  { label: "HVDC Site",  color: "rgb(34,197,94)",   desc: "SHU · MIR · DAS · AGI" },
  { label: "MOSB Yard",  color: "rgb(249,115,22)",   desc: "Das Island staging" },
  { label: "Port",       color: "rgb(59,130,246)",   desc: "Khalifa · MZD · JAFZ" },
  { label: "Warehouse",  color: "rgb(234,179,8)",    desc: "DSV · JDN · AAA" },
]

const TRIP_LEGEND = [
  { label: "Flow 1-2 (Direct / WH)", color: "rgb(56,189,248)",  desc: "SHU · MIR route" },
  { label: "Flow 3-4 (MOSB)",         color: "rgb(249,115,22)",  desc: "DAS · AGI via MOSB" },
]

export function MapLegend({ showArcs = false, showTrips = false }: MapLegendProps) {
  const regions = (Object.entries(REGION_COLORS) as [Region, [number, number, number]][])
    .filter(([r]) => r !== "Unknown")

  return (
    <div
      className="absolute bottom-10 right-2 z-40 pointer-events-none
                 bg-black/70 backdrop-blur-sm border border-white/10
                 rounded-lg p-3 text-xs text-white/90 w-48 space-y-3 select-none"
      aria-label="Map legend"
    >
      {/* POI rings */}
      <div>
        <p className="text-white/50 uppercase tracking-wide text-[10px] mb-1.5">Node type</p>
        <div className="space-y-1">
          {RING_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: color, backgroundColor: "transparent" }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Origin arc colors — only when zoomed out */}
      {showArcs && (
        <div>
          <p className="text-white/50 uppercase tracking-wide text-[10px] mb-1.5">Origin region</p>
          <div className="space-y-1">
            {regions.map(([region, [r, g, b]]) => (
              <div key={region} className="flex items-center gap-2">
                <span
                  className="inline-block w-6 h-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: rgbToHex(r, g, b) }}
                />
                <span>{REGION_LABELS[region]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trip animation colors */}
      {showTrips && (
        <div>
          <p className="text-white/50 uppercase tracking-wide text-[10px] mb-1.5">Active voyage</p>
          <div className="space-y-1">
            {TRIP_LEGEND.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="inline-block w-6 h-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
