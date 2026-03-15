"use client"

import { HEATMAP_COLOR_RANGE } from "./layers/createHeatmapLayer"
import { useT } from '@/hooks/useT'

interface HeatmapLegendProps {
  className?: string
}

function rgbaString([r, g, b, a]: [number, number, number, number]) {
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

export function HeatmapLegend({ className = "" }: HeatmapLegendProps) {
  const t = useT()

  return (
    <div
      className={[
        "absolute z-40 rounded-hvdc-lg border border-white/10 bg-hvdc-bg-overlay px-3 py-2 text-xs text-hvdc-text-primary shadow-hvdc-card backdrop-blur-md",
        className,
      ].join(" ")}
      role="group"
      aria-label="Heatmap intensity legend"
    >
      <div className="mb-2 text-[11px] font-semibold text-hvdc-text-secondary">Heatmap</div>
      <div className="flex flex-col gap-1.5">
        {HEATMAP_COLOR_RANGE.map((color, index) => (
          <div key={t.heatmap.labels[index] ?? index} className="flex items-center gap-2">
            <span
              className="h-3 w-6 rounded-sm border border-white/10"
              style={{ backgroundColor: rgbaString(color) }}
              aria-hidden="true"
            />
            <span className="text-[11px] text-hvdc-text-secondary">
              {t.heatmap.labels[index] ?? "High"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
