'use client'

import { useLogisticsStore } from '@/store/logisticsStore'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'

interface ToggleButtonProps {
  label: string
  icon: string
  active: boolean
  title: string
  onToggle: () => void
}

function ToggleButton({ label, icon, active, title, onToggle }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-hvdc-brand text-white shadow-hvdc-active'
          : 'bg-hvdc-surface-subtle text-hvdc-text-secondary hover:bg-hvdc-surface-hover hover:text-hvdc-text-primary',
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export function MapLayerToggles() {
  const t = useT()

  const layerOriginArcs = useLogisticsStore((s) => s.layerOriginArcs)
  const layerTrips = useLogisticsStore((s) => s.layerTrips)
  const showHeatmap = useLogisticsStore((s) => s.showHeatmap)
  const toggleLayerOriginArcs = useLogisticsStore((s) => s.toggleLayerOriginArcs)
  const toggleLayerTrips = useLogisticsStore((s) => s.toggleLayerTrips)
  const toggleHeatmap = useLogisticsStore((s) => s.toggleHeatmap)

  return (
    <div className="flex items-center gap-2">
      <ToggleButton
        label={t.layers.originArc}
        icon="🌐"
        active={layerOriginArcs}
        title={`${t.layers.originArc} ${layerOriginArcs ? t.layers.hide : t.layers.show}`}
        onToggle={toggleLayerOriginArcs}
      />
      <ToggleButton
        label={t.layers.voyage}
        icon="🚢"
        active={layerTrips}
        title={`${t.layers.voyage} ${layerTrips ? t.layers.hide : t.layers.show}`}
        onToggle={toggleLayerTrips}
      />
      <ToggleButton
        label={t.layers.heatmap}
        icon="🔥"
        active={showHeatmap}
        title={`${t.layers.heatmap} ${showHeatmap ? t.layers.hide : t.layers.show}`}
        onToggle={toggleHeatmap}
      />
    </div>
  )
}
