"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { useLogisticsStore } from "@/store/logisticsStore"
import { createLocationLayer } from "./layers/createLocationLayer"
import { createHeatmapLayer } from "./layers/createHeatmapLayer"
import { createGeofenceLayer } from "./layers/createGeofenceLayer"
import { createEtaWedgeLayer } from "./layers/createEtaWedgeLayer"
import { formatInDubaiTimezone } from "@/lib/time"
import type { Location, LocationStatus } from "@/types/logistics"

interface TooltipInfo {
  x: number
  y: number
  object?: Location & { status?: LocationStatus }
}

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

// Abu Dhabi region center
const INITIAL_VIEW = {
  longitude: 54.4,
  latitude: 24.5,
  zoom: 8,
}

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  const locationsById = useLogisticsStore((state) => state.locationsById)
  const statusByLocationId = useLogisticsStore((state) => state.statusByLocationId)
  const eventsById = useLogisticsStore((state) => state.eventsById)
  const windowHours = useLogisticsStore((state) => state.windowHours)
  const showGeofence = useLogisticsStore((state) => state.showGeofence)
  const showHeatmap = useLogisticsStore((state) => state.showHeatmap)
  const showEtaWedge = useLogisticsStore((state) => state.showEtaWedge)
  const heatFilter = useLogisticsStore((state) => state.heatFilter)

  const locations = useMemo(() => Object.values(locationsById), [locationsById])

  const eventsInWindow = useMemo(() => {
    const events = Object.values(eventsById)
    const windowMs = windowHours * 60 * 60 * 1000
    const now = Date.now()
    return events.filter((evt) => now - new Date(evt.ts).getTime() <= windowMs)
  }, [eventsById, windowHours])

  const handleHover = useCallback((info: { object?: Location & { status?: LocationStatus }; x: number; y: number }) => {
    if (info.object) {
      setTooltip({ x: info.x, y: info.y, object: info.object })
    } else {
      setTooltip(null)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl(), "bottom-right")
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")

    // Create deck.gl overlay
    const overlay = new MapboxOverlay({
      interleaved: false, // TODO: Switch to interleaved mode if needed
      layers: [],
    })

    map.addControl(overlay as unknown as maplibregl.IControl)

    mapRef.current = map
    overlayRef.current = overlay

    return () => {
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [])

  // Update layers
  useEffect(() => {
    if (!overlayRef.current) return

    // Filter events by heat filter
    const filteredEvents =
      heatFilter === "all"
        ? eventsInWindow
        : eventsInWindow.filter((evt) => {
            const status = statusByLocationId[evt.location_id]
            return status?.status_code === heatFilter
          })

    const layers = [
      createGeofenceLayer(locations, showGeofence),
      createHeatmapLayer(filteredEvents, showHeatmap),
      createEtaWedgeLayer(locations, showEtaWedge),
      createLocationLayer(locations, statusByLocationId, handleHover),
    ]

    overlayRef.current.setProps({ layers })
  }, [locations, statusByLocationId, eventsInWindow, showGeofence, showHeatmap, showEtaWedge, heatFilter, handleHover])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Tooltip */}
      {tooltip?.object && (
        <div
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl text-sm"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            maxWidth: 250,
          }}
        >
          <div className="font-semibold text-foreground mb-1">{tooltip.object.name}</div>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Occupancy:</span>
              <span className="font-medium text-foreground">
                {((tooltip.object.status?.occupancy_rate ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status:</span>
              <span
                className={`font-medium ${
                  tooltip.object.status?.status_code === "OK"
                    ? "text-green-500"
                    : tooltip.object.status?.status_code === "WARNING"
                      ? "text-amber-500"
                      : "text-red-500"
                }`}
              >
                {tooltip.object.status?.status_code ?? "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Updated:</span>
              <span className="font-medium text-foreground text-xs">
                {tooltip.object.status?.last_updated
                  ? formatInDubaiTimezone(tooltip.object.status.last_updated)
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
