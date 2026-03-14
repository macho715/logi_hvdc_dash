'use client'

import { useLogisticsStore } from '@/store/logisticsStore'
import { cn } from '@/lib/utils'

interface ToggleButtonProps {
  label: string
  icon: string
  active: boolean
  onToggle: () => void
}

function ToggleButton({ label, icon, active, onToggle }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={active ? `${label} 숨기기` : `${label} 표시`}
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

export function MapLayerToggles() {
  const layerOriginArcs = useLogisticsStore((s) => s.layerOriginArcs)
  const layerTrips = useLogisticsStore((s) => s.layerTrips)
  const showHeatmap = useLogisticsStore((s) => s.showHeatmap)
  const toggleLayerOriginArcs = useLogisticsStore((s) => s.toggleLayerOriginArcs)
  const toggleLayerTrips = useLogisticsStore((s) => s.toggleLayerTrips)
  const toggleHeatmap = useLogisticsStore((s) => s.toggleHeatmap)

  return (
    <div className="flex items-center gap-2">
      <ToggleButton label="Origin Arc" icon="🌐" active={layerOriginArcs} onToggle={toggleLayerOriginArcs} />
      <ToggleButton label="항차" icon="🚢" active={layerTrips} onToggle={toggleLayerTrips} />
      <ToggleButton label="Heatmap" icon="🔥" active={showHeatmap} onToggle={toggleHeatmap} />
    </div>
  )
}
