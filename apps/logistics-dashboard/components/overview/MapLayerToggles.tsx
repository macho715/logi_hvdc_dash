'use client'

import { useLogisticsStore } from '@/store/logisticsStore'
import { cn } from '@/lib/utils'

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
          ? 'bg-blue-600/80 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200',
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

import { useT } from '@/hooks/useT'

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
