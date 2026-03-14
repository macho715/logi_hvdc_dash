"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MapboxOverlay } from "@deck.gl/mapbox"
import type { PickingInfo } from "@deck.gl/core"
import { useOpsStore } from "@repo/shared"
import { useLogisticsStore } from "@/store/logisticsStore"
import { useCasesStore } from "@/store/casesStore"
import { createLocationLayer } from "@/components/map/layers/createLocationLayer"
import { createHeatmapLayer } from "@/components/map/layers/createHeatmapLayer"
import { createGeofenceLayer } from "@/components/map/layers/createGeofenceLayer"
import { createEtaWedgeLayer } from "@/components/map/layers/createEtaWedgeLayer"
import { createGeofenceGeojson, isPointInGeofence } from "@/components/map/layers/geofenceUtils"
import { HeatmapLegend } from "@/components/map/HeatmapLegend"
import { MapLegend } from "@/components/map/MapLegend"
import { createPoiLayers, getPoiTooltip } from "@/components/map/PoiLocationsLayer"
import { createStatusRingLayer } from "@/components/map/layers/createStatusRingLayer"
import { createTripsLayer, computeAnimTime, TRIPS_TIME_WINDOW_SECS } from "@/components/map/layers/createTripsLayer"
import { createOriginArcLayer } from "@/components/map/layers/createOriginArcLayer"
import type { OriginEntry } from "@/components/map/layers/createOriginArcLayer"
import { POI_LOCATIONS } from "@/lib/map/poiLocations"
import { buildDashboardLink } from "@/lib/navigation/contracts"
import { formatInDubaiTimezone } from "@/lib/time"
import { useT } from "@/hooks/useT"
import type { Event, Location, LocationStatus } from "@repo/shared"
import type { NavigationIntent } from "@/types/overview"
import type { PoiLocation } from "@/lib/map/poiTypes"
import type { TripData } from "@/app/api/shipments/trips/route"

/** Convert ISO-3166-1 alpha-2 country code to flag emoji (e.g., "SE" → "🇸🇪") */
function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("")
}

type TooltipInfo =
  | { kind: "location"; x: number; y: number; object: Location & { status?: LocationStatus } }
  | { kind: "poi"; x: number; y: number; text: string }
  | { kind: "arc"; x: number; y: number; country: string; count: number }
  | { kind: "trip"; x: number; y: number; vendor: string | null; flowCode: number | null; etaUnix: number }

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

// Abu Dhabi region center
const INITIAL_VIEW = {
  longitude: 54.4,
  latitude: 24.5,
  zoom: 8,
}

const POI_BOUNDS: maplibregl.LngLatBoundsLike = [
  [52.57, 24.12],
  [55.25, 25.25],
]

const MAP_LAYER_ZOOM_THRESHOLDS = {
  heatmapMax: 9.5,
  statusMin: 9.5,
  poiMin: 7.5,
  poiLabelMin: 7.5,
  poiDetailMin: 10.5,
  /** Show global origin arcs only when zoomed out to see supply-chain context */
  originArcMax: 8.0,
}

/** Epoch start for animation (60 days ago in unix seconds) */
const ANIM_EPOCH_START = Math.floor(Date.now() / 1000) - TRIPS_TIME_WINDOW_SECS

interface OverviewMapProps {
  onNavigateIntent?: (intent: NavigationIntent) => void
}

export function OverviewMap(props: OverviewMapProps) {
  return <OverviewMapInner {...props} />
}

function inferSiteCode(value: string): 'SHU' | 'MIR' | 'DAS' | 'AGI' | undefined {
  if (value.includes('SHU')) return 'SHU'
  if (value.includes('MIR')) return 'MIR'
  if (value.includes('DAS')) return 'DAS'
  if (value.includes('AGI')) return 'AGI'
  return undefined
}

function buildLocationIntent(location: Location): NavigationIntent {
  const siteCode = inferSiteCode(`${location.location_id} ${location.name}`.toUpperCase())

  if (location.siteType === 'SITE' && siteCode) {
    return {
      destinationId: 'map-site',
      page: 'sites',
      params: { site: siteCode, tab: 'summary' },
    }
  }

  if (location.siteType === 'PORT' || location.siteType === 'BERTH') {
    return {
      destinationId: 'map-port',
      page: 'chain',
      params: { focus: 'port' },
    }
  }

  if (location.siteType === 'MOSB_WH' && location.name.toUpperCase().includes('MOSB')) {
    return {
      destinationId: 'map-mosb',
      page: 'chain',
      params: { focus: 'mosb' },
    }
  }

  return {
    destinationId: 'map-warehouse',
    page: 'chain',
    params: { focus: 'warehouse' },
  }
}

function buildPoiIntent(poi: PoiLocation): NavigationIntent {
  const siteCode = inferSiteCode(`${poi.code} ${poi.name}`.toUpperCase())

  if (poi.category === 'HVDC_SITE' && siteCode) {
    return {
      destinationId: 'map-site',
      page: 'sites',
      params: { site: siteCode, tab: 'summary' },
    }
  }

  if (poi.category === 'PORT' || poi.category === 'AIRPORT') {
    return {
      destinationId: 'map-port',
      page: 'chain',
      params: { focus: 'port' },
    }
  }

  if (poi.category === 'WAREHOUSE') {
    return {
      destinationId: 'map-warehouse',
      page: 'chain',
      params: { focus: 'warehouse' },
    }
  }

  return {
    destinationId: 'map-mosb',
    page: 'chain',
    params: { focus: 'mosb' },
  }
}

function OverviewMapInner({ onNavigateIntent }: OverviewMapProps) {
  const t = useT()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const didFitBoundsRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)
  const animStartRef = useRef<number>(Date.now())

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom)
  const [tripsData, setTripsData] = useState<TripData[]>([])
  const [animTime, setAnimTime] = useState(ANIM_EPOCH_START)
  const [originsData, setOriginsData] = useState<OriginEntry[]>([])

  const locationsById = useOpsStore((state) => state.locationsById)
  const statusByLocationId = useOpsStore((state) => state.locationStatusesById)
  const eventsById = useOpsStore((state) => state.eventsById)
  const windowHours = useLogisticsStore((state) => state.windowHours)
  const showGeofence = useLogisticsStore((state) => state.showGeofence)
  const showHeatmap = useLogisticsStore((state) => state.showHeatmap)
  const showEtaWedge = useLogisticsStore((state) => state.showEtaWedge)
  const heatFilter = useLogisticsStore((state) => state.heatFilter)
  const layerTrips = useLogisticsStore((state) => state.layerTrips)
  const layerOriginArcs = useLogisticsStore((state) => state.layerOriginArcs)
  const highlightedShipmentId = useLogisticsStore((state) => state.highlightedShipmentId)

  // Phase 2-B: pipeline stage → map highlight sync
  const activePipelineStage = useCasesStore((state) => state.activePipelineStage)

  const locations = useMemo(() => Object.values(locationsById), [locationsById])
  const geofenceGeojson = useMemo(() => createGeofenceGeojson(locations), [locations])

  const eventsInWindow = useMemo(() => {
    const events = Object.values(eventsById)
    const windowMs = windowHours * 60 * 60 * 1000
    const now = Date.now()
    return events.filter((evt) => now - new Date(evt.ts).getTime() <= windowMs)
  }, [eventsById, windowHours])

  const geofenceWeight = useCallback(
    (event: Event) => {
      if (geofenceGeojson.features.length === 0) return 1
      return isPointInGeofence(event.lon, event.lat, geofenceGeojson) ? 2 : 1
    },
    [geofenceGeojson],
  )

  const heatmapRadiusPixels = useMemo(() => {
    if (zoom >= 12) {
      return 40
    }
    if (zoom >= 9) {
      return 60
    }
    return 80
  }, [zoom])

  const showHeatmapLayer = showHeatmap && zoom < MAP_LAYER_ZOOM_THRESHOLDS.heatmapMax
  const showStatusLayer = zoom >= MAP_LAYER_ZOOM_THRESHOLDS.statusMin
  const showPoiLayer = zoom >= MAP_LAYER_ZOOM_THRESHOLDS.poiMin
  const showOriginArcs = layerOriginArcs && zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax

  const navigate = useCallback(
    (intent: NavigationIntent) => {
      onNavigateIntent?.(intent)
      if (!onNavigateIntent) {
        console.warn('[OverviewMap] onNavigateIntent not provided, navigation skipped', intent)
        return
      }
    },
    [onNavigateIntent],
  )

  const handleHover = useCallback((info: PickingInfo) => {
    if (!info?.object) {
      setTooltip(null)
      return
    }

    // Origin country arc hover
    if (info.layer?.id === "origin-country-arcs") {
      const obj = info.object as { country: string; count: number }
      setTooltip({ kind: "arc", x: info.x, y: info.y, country: obj.country, count: obj.count })
      return
    }

    // Active voyage trip hover
    if (info.layer?.id === "active-voyages") {
      const obj = info.object as { vendor: string | null; flowCode: number | null; etaUnix: number }
      setTooltip({ kind: "trip", x: info.x, y: info.y, vendor: obj.vendor ?? null, flowCode: obj.flowCode ?? null, etaUnix: obj.etaUnix })
      return
    }

    if (info.layer?.id === "poi-markers" || info.layer?.id === "poi-labels") {
      const poi = getPoiTooltip(info)
      if (!poi?.text) {
        setTooltip(null)
        return
      }
      setTooltip({ kind: "poi", x: info.x, y: info.y, text: poi.text })
      return
    }

    setTooltip({
      kind: "location",
      x: info.x,
      y: info.y,
      object: info.object as Location & { status?: LocationStatus },
    })
  }, [])

  const handleLocationClick = useCallback((info: PickingInfo) => {
    const location = info.object as Location | undefined
    if (!location) return
    navigate(buildLocationIntent(location))
  }, [navigate])

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

    const handleZoomChange = () => {
      setZoom(map.getZoom())
    }

    map.on("moveend", handleZoomChange)
    map.on("zoomend", handleZoomChange)

    map.once("load", () => {
      if (didFitBoundsRef.current) return
      map.fitBounds(POI_BOUNDS, { padding: 40, duration: 0 })
      didFitBoundsRef.current = true
      setZoom(map.getZoom())
    })

    // Create deck.gl overlay
    const overlay = new MapboxOverlay({
      interleaved: false, // TODO: Switch to interleaved mode if needed
      layers: [],
    })

    map.addControl(overlay as unknown as maplibregl.IControl)

    mapRef.current = map
    overlayRef.current = overlay

    return () => {
      map.off("moveend", handleZoomChange)
      map.off("zoomend", handleZoomChange)
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [])

  // Phase 2-A: Fetch in-transit trips on mount
  useEffect(() => {
    fetch('/api/shipments/trips')
      .then((r) => r.json())
      .then((j) => setTripsData(j.trips ?? []))
      .catch(() => setTripsData([]))
  }, [])

  // Phase 3-A: Fetch origin country aggregates on mount
  useEffect(() => {
    fetch('/api/chain/summary')
      .then((r) => r.json())
      .then((j) => setOriginsData(j.origins ?? []))
      .catch(() => setOriginsData([]))
  }, [])

  // Phase 2-A: Animation loop — cycles animTime at 30fps
  useEffect(() => {
    if (tripsData.length === 0) return  // no trips → skip animation loop

    animStartRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - animStartRef.current
      setAnimTime(computeAnimTime(ANIM_EPOCH_START, elapsed))
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [tripsData.length])

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

    const poiLayers = createPoiLayers({
      pois: POI_LOCATIONS,
      selectedPoiId,
      zoom,
      visible: showPoiLayer,
      labelZoomThreshold: MAP_LAYER_ZOOM_THRESHOLDS.poiLabelMin,
      labelDetailZoomThreshold: MAP_LAYER_ZOOM_THRESHOLDS.poiDetailMin,
      onSelectPoi: (poi) => {
        setSelectedPoiId(poi.id)
        navigate(buildPoiIntent(poi))
      },
      onHover: handleHover,
    })

    // Phase 2-B: pass activePipelineStage to status rings for highlight
    const stageKey = activePipelineStage as string | null

    const layers = [
      // Phase 3-A: global origin-country arcs (visible only when zoomed out ≤ 8)
      createOriginArcLayer(originsData, showOriginArcs),
      createGeofenceLayer(locations, showGeofence),
      createHeatmapLayer(filteredEvents, {
        getWeight: geofenceWeight,
        radiusPixels: heatmapRadiusPixels,
        visible: showHeatmapLayer,
      }),
      createEtaWedgeLayer(locations, showEtaWedge),
      createLocationLayer(locations, statusByLocationId, handleHover, handleLocationClick, {
        visible: showStatusLayer,
      }),
      // Phase 2-A: animated shipment routes
      createTripsLayer(tripsData, animTime, layerTrips, highlightedShipmentId),
      // Status rings with optional stage highlight (Phase 2-B)
      createStatusRingLayer(POI_LOCATIONS, showPoiLayer, stageKey),
      ...poiLayers,
    ]
      .filter((layer): layer is NonNullable<typeof layer> => layer != null)

    overlayRef.current.setProps({ layers, onHover: handleHover })
  }, [
    locations,
    statusByLocationId,
    eventsInWindow,
    showGeofence,
    showHeatmap,
    showEtaWedge,
    heatFilter,
    handleHover,
    handleLocationClick,
    geofenceWeight,
    heatmapRadiusPixels,
    selectedPoiId,
    zoom,
    showHeatmapLayer,
    showPoiLayer,
    showStatusLayer,
    tripsData,
    animTime,
    activePipelineStage,
    originsData,
    showOriginArcs,
    layerTrips,
    layerOriginArcs,
    highlightedShipmentId,
  ])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        aria-label="Overview map"
        tabIndex={-1}
      />

      {showHeatmapLayer ? <HeatmapLegend /> : null}
      <MapLegend showArcs={showOriginArcs} showTrips={tripsData.length > 0} />

      {/* Tooltip */}
      {tooltip && tooltip.kind === "location" && (
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
      {tooltip && tooltip.kind === "poi" && (
        <div
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl text-sm whitespace-pre-line"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            maxWidth: 260,
          }}
        >
          <div className="font-semibold text-foreground">{tooltip.text}</div>
        </div>
      )}
      {tooltip && tooltip.kind === "arc" && (
        <div
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl text-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <span className="font-semibold text-foreground">
            {countryFlag(tooltip.country)} {tooltip.country}
          </span>
          <span className="text-muted-foreground ml-2">{tooltip.count.toLocaleString()}{t.overviewMap.countSuffix}</span>
        </div>
      )}
      {tooltip && tooltip.kind === "trip" && (
        <div
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl text-sm space-y-0.5"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12, minWidth: 160 }}
        >
          {tooltip.vendor && (
            <div className="font-semibold text-foreground">{tooltip.vendor}</div>
          )}
          <div className="text-muted-foreground text-xs">
            {tooltip.flowCode !== null
              ? `Flow ${tooltip.flowCode} · ${tooltip.flowCode >= 3 ? t.overviewMap.mosbRoute : t.overviewMap.directRoute}`
              : "In transit"}
          </div>
          <div className="text-muted-foreground text-xs">
            ETA {new Date(tooltip.etaUnix * 1000).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}
          </div>
        </div>
      )}
    </div>
  )
}
