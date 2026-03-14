'use client'

import { MapLayerToggles } from './MapLayerToggles'
import { ShipmentSearchBar } from './ShipmentSearchBar'
import { useT } from '@/hooks/useT'
import { LangToggle } from '@/components/ui/LangToggle'
import { ui } from '@/lib/overview/ui'

interface OverviewToolbarProps {
  onShipmentSelect: (sctShipNo: string) => void
  onNewVoyageClick: () => void
}

export function OverviewToolbar({ onShipmentSelect, onNewVoyageClick }: OverviewToolbarProps) {
  const t = useT()

  return (
    <div className={`flex items-center justify-between px-4 py-2 ${ui.topbar}`}>
      {/* Left: search */}
      <ShipmentSearchBar onSelect={onShipmentSelect} />

      {/* Center: map layer toggles */}
      <MapLayerToggles />

      {/* Right: lang toggle + new voyage button */}
      <div className="flex items-center gap-2">
        <LangToggle />
        <button
          type="button"
          onClick={onNewVoyageClick}
          className="flex items-center gap-1.5 rounded-lg bg-hvdc-brand px-3 py-1.5 text-sm font-medium text-white shadow-hvdc-active transition-colors hover:bg-hvdc-brand-hi"
        >
          {t.toolbar.newVoyage}
        </button>
      </div>
    </div>
  )
}
