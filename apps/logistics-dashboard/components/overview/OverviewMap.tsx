"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PickingInfo } from "@deck.gl/core"
import { MapboxOverlay } from "@deck.gl/mapbox"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { HeatmapLegend } from "@/components/map/HeatmapLegend"
import { MapLegend } from "@/components/map/MapLegend"
import { createArcLayer } from "@/components/map/layers/createArcLayer"
import { createEtaWedgeLayer } from "@/components/map/layers/createEtaWedgeLayer"
import { createGeofenceLayer } from "@/components/map/layers/createGeofenceLayer"
import { createGeofenceGeojson, isPointInGeofence } from "@/components/map/layers/geofenceUtils"
import { createHeatmapLayer } from "@/components/map/layers/createHeatmapLayer"
import { createNetworkStatusRingLayer } from "@/components/map/layers/createNetworkStatusRingLayer"
import { createNodeLayer } from "@/components/map/layers/createNodeLayer"
import { createOriginArcLayer, type OriginEntry } from "@/components/map/layers/createOriginArcLayer"
import { computeAnimTime, createTripsLayer, TRIPS_TIME_WINDOW_SECS } from "@/components/map/layers/createTripsLayer"
import { MapTrackSwitch, type MapLayerToggles, type MapTrack } from "@/components/overview/MapTrackSwitch"
import { useT } from "@/hooks/useT"
import { POI_LOCATIONS } from "@/lib/map/poiLocations"
import {
  buildMapFooterSummary,
  buildOriginEntries,
  buildOverviewNetworkGraph,
  buildOverviewTrips,
  type NetworkEdge,
  type NetworkNode,
  type NetworkTrip,
  type SiteFilter,
} from "@/lib/map/networkGraph"
import { UAE_OPS_FOOTER_COPY, UAE_OPS_ROUTE_COPY, getWarehouseLabel, hasDsvEvidence } from "@/lib/map/uaeOpsCopy"
import { formatInDubaiTimezone } from "@/lib/time"
import { useCasesStore } from "@/store/casesStore"
import { useLogisticsStore } from "@/store/logisticsStore"
import type { NavigationIntent, OverviewMapSnapshot } from "@/types/overview"

function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("")
}

type TooltipInfo =
  | { kind: "node"; x: number; y: number; object: NetworkNode }
  | { kind: "networkArc"; x: number; y: number; object: NetworkEdge; sourceName: string; targetName: string }
  | { kind: "originArc"; x: number; y: number; country: string; count: number }
  | {
      kind: "trip"
      x: number
      y: number
      shipmentId: string
      vendor: string | null
      routeLabel: string
      stageLabel: string
      nextMilestone?: string
      etaUnix: number
    }

const SSR_SAFE_TOGGLES: MapLayerToggles = {
  showOriginArcs: true,
  showTrips: true,
  showCustoms: true,
  showWarehouses: true,
  showMosb: true,
  showSites: true,
}

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

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
  networkLabelMin: 8.1,
  networkLabelDetailMin: 10.4,
  originArcMax: 8.0,
}

const ANIM_EPOCH_START = Math.floor(Date.now() / 1000) - TRIPS_TIME_WINDOW_SECS

interface OverviewMapProps {
  snapshot?: OverviewMapSnapshot | null
  onNavigateIntent?: (intent: NavigationIntent) => void
  siteFilter?: SiteFilter
}

function buildNetworkNodeIntent(node: NetworkNode): NavigationIntent {
  if (node.type === "site" && node.siteCode) {
    return {
      destinationId: "map-site",
      page: "sites",
      params: { site: node.siteCode, tab: "summary" },
    }
  }

  if (node.type === "port" || node.type === "airport" || node.type === "customs") {
    return {
      destinationId: node.type === "customs" ? "map-customs" : "map-port",
      page: "chain",
      params: { focus: "port" },
    }
  }

  if (node.type === "mosb") {
    return {
      destinationId: "map-mosb",
      page: "chain",
      params: { focus: "mosb" },
    }
  }

  return {
    destinationId: "map-warehouse",
    page: "chain",
    params: { focus: "warehouse" },
  }
}

function nodeKindLabel(node: NetworkNode): string {
  switch (node.type) {
    case "site":
      return node.siteCode === "DAS" || node.siteCode === "AGI" ? "Offshore Site" : "Land Site"
    case "port":
      return "Entry Point"
    case "airport":
      return "Entry Point"
    case "customs":
      return "Customs Stage"
    case "warehouse":
      return "Optional Staging"
    case "mosb":
      return "MOSB Hub"
    default:
      return "Origin"
  }
}

function displayNodeTitle(node: NetworkNode): string {
  switch (node.id) {
    case "khalifa-port-kpct":
      return "Khalifa Port"
    case "zayed-port":
      return "Mina Zayed"
    case "auh-airport":
      return "AUH Airport"
    case "jebel-ali-port":
      return "Jebel Ali"
    case "khalifa-customs":
      return "Khalifa Customs Stage"
    case "zayed-customs":
      return "MZ Customs Stage"
    case "auh-customs":
      return "AUH Customs Stage"
    case "jebel-ali-customs":
      return "JAFZ Customs Stage"
    case "dsv-inland-warehouse-m44":
      return getWarehouseLabel(node.name)
    case "mosb-yard":
      return "MOSB Hub"
    default:
      return node.siteCode ?? node.name
  }
}

function nextPathForNode(node: NetworkNode): string {
  if (node.type === "port" || node.type === "airport") {
    return node.id === "khalifa-port-kpct" || node.id === "auh-airport" || node.id === "jebel-ali-port"
      ? "Warehouse / Site / MOSB"
      : "Warehouse / Site"
  }
  if (node.type === "customs") {
    return node.id === "khalifa-customs" || node.id === "auh-customs" || node.id === "jebel-ali-customs"
      ? "Warehouse / Site / MOSB"
      : "Warehouse / Site"
  }
  if (node.type === "warehouse") return "Site / MOSB"
  if (node.type === "mosb") return "DAS / AGI"
  if (node.siteCode === "DAS" || node.siteCode === "AGI") return "MOSB required"
  if (node.type === "site") return "Direct or WH-mediated"
  return "Voyage monitoring"
}

function riskLabel(risk: NetworkNode["risk"] | NetworkEdge["risk"]): string {
  if (risk === "critical") return "CRITICAL"
  if (risk === "warn") return "WARNING"
  return "OK"
}

function riskClass(risk: NetworkNode["risk"] | NetworkEdge["risk"]): string {
  if (risk === "critical") return "text-rose-300"
  if (risk === "warn") return "text-amber-300"
  return "text-emerald-300"
}

function routeLabel(edge: NetworkEdge): string {
  switch (edge.routeType) {
    case "port-customs":
      return UAE_OPS_ROUTE_COPY["port-customs"]
    case "customs-site":
      return UAE_OPS_ROUTE_COPY["customs-site"]
    case "customs-wh":
      return UAE_OPS_ROUTE_COPY["customs-wh"]
    case "customs-mosb":
      return UAE_OPS_ROUTE_COPY["customs-mosb"]
    case "wh-mosb":
      return UAE_OPS_ROUTE_COPY["wh-mosb"]
    case "wh-site":
      return UAE_OPS_ROUTE_COPY["wh-site"]
    case "mosb-site":
      return UAE_OPS_ROUTE_COPY["mosb-site"]
    default:
      return "Route"
  }
}

function nodeStatusText(node: NetworkNode): string {
  if (node.type === "customs") return node.active ? "In progress" : "Clearance monitored"
  if (node.type === "warehouse") return node.volume > 0 ? "Active" : "Standby"
  if (node.type === "mosb") return node.volume > 0 ? "Pending Dispatch" : "Standby"
  if (node.type === "site") return node.siteCode === "DAS" || node.siteCode === "AGI" ? "MOSB required" : "Direct or WH-mediated"
  return "Voyage monitoring"
}

function nodePrimaryMetricLabel(node: NetworkNode): string {
  if (node.type === "warehouse") return "Staged Shipments"
  if (node.type === "site") return "Assigned"
  return "Volume"
}

function formatVolume(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function TooltipCard({
  x,
  y,
  children,
}: {
  x: number
  y: number
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute z-50 max-w-[280px] min-w-[180px] pointer-events-none rounded-hvdc-lg border border-white/10 bg-hvdc-bg-overlay px-3 py-2 text-xs text-hvdc-text-primary shadow-hvdc-card backdrop-blur-md"
      style={{
        left: x + 12,
        top: y + 12,
      }}
    >
      {children}
    </div>
  )
}

export function OverviewMap(props: OverviewMapProps) {
  return <OverviewMapInner {...props} />
}

function OverviewMapInner({ snapshot, onNavigateIntent, siteFilter }: OverviewMapProps) {
  const t = useT()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const didFitBoundsRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)
  const animStartRef = useRef<number>(Date.now())

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom)
  const [compactViewport, setCompactViewport] = useState(false)
  const [mapTrack, setMapTrack] = useState<MapTrack>("uae-ops")
  const [mapToggles, setMapToggles] = useState<MapLayerToggles>(SSR_SAFE_TOGGLES)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [animTime, setAnimTime] = useState(ANIM_EPOCH_START)

  const locations = snapshot?.locations ?? []
  const statuses = snapshot?.statuses ?? []
  const events = snapshot?.events ?? []
  const voyages = snapshot?.voyages ?? []

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isCompact = window.innerWidth < 960
    if (prefersReducedMotion || isCompact) {
      setMapToggles((prev) => ({ ...prev, showTrips: false }))
    }
  }, [])

  const statusByLocationId = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status.location_id, status])),
    [statuses],
  )
  const geofenceGeojson = useMemo(() => createGeofenceGeojson(locations), [locations])

  const windowHours = useLogisticsStore((state) => state.windowHours)
  const showGeofence = useLogisticsStore((state) => state.showGeofence)
  const showHeatmap = useLogisticsStore((state) => state.showHeatmap)
  const showEtaWedge = useLogisticsStore((state) => state.showEtaWedge)
  const heatFilter = useLogisticsStore((state) => state.heatFilter)
  const layerTrips = useLogisticsStore((state) => state.layerTrips)
  const layerOriginArcs = useLogisticsStore((state) => state.layerOriginArcs)
  const highlightedShipmentId = useLogisticsStore((state) => state.highlightedShipmentId)
  const activePipelineStage = useCasesStore((state) => state.activePipelineStage)
  const isUaeOps = mapTrack === "uae-ops"

  const eventsInWindow = useMemo(() => {
    const windowMs = windowHours * 60 * 60 * 1000
    const now = Date.now()
    return events.filter((event) => now - new Date(event.ts).getTime() <= windowMs)
  }, [events, windowHours])

  const geofenceWeight = useCallback(
    (event: (typeof eventsInWindow)[number]) => {
      if (geofenceGeojson.features.length === 0) return 1
      return isPointInGeofence(event.lon, event.lat, geofenceGeojson) ? 2 : 1
    },
    [geofenceGeojson],
  )

  const heatmapRadiusPixels = useMemo(() => {
    if (zoom >= 12) return 36
    if (zoom >= 9) return 56
    return 78
  }, [zoom])

  const showHeatmapLayer =
    !isUaeOps &&
    showHeatmap &&
    zoom < MAP_LAYER_ZOOM_THRESHOLDS.heatmapMax
  const showEtaWedgeLayer =
    !isUaeOps &&
    showEtaWedge
  const showOriginArcs =
    !isUaeOps &&
    layerOriginArcs &&
    mapToggles.showOriginArcs &&
    zoom <= MAP_LAYER_ZOOM_THRESHOLDS.originArcMax
  const showTripsLayer = layerTrips && mapToggles.showTrips
  const showNodeLabels =
    mapTrack === "uae-ops"
      ? zoom >= MAP_LAYER_ZOOM_THRESHOLDS.networkLabelMin
      : !compactViewport || zoom >= MAP_LAYER_ZOOM_THRESHOLDS.networkLabelDetailMin

  const originsData = useMemo<OriginEntry[]>(
    () => buildOriginEntries(voyages, siteFilter),
    [voyages, siteFilter],
  )

  const graph = useMemo(
    () =>
      buildOverviewNetworkGraph({
        pois: POI_LOCATIONS,
        voyages,
        locations,
        statusByLocationId,
        activePipelineStage,
        siteFilter,
      }),
    [activePipelineStage, locations, siteFilter, statusByLocationId, voyages],
  )

  const tripsData = useMemo(
    () =>
      buildOverviewTrips({
        voyages,
        nodes: graph.nodes,
        track: mapTrack,
        siteFilter,
      }),
    [graph.nodes, mapTrack, siteFilter, voyages],
  )

  const footer = useMemo(
    () => buildMapFooterSummary(voyages, siteFilter),
    [siteFilter, voyages],
  )

  const filteredNodes = useMemo(() => {
    if (mapTrack === "global") {
      return graph.nodes.filter((node) => node.type !== "customs")
    }

    return graph.nodes.filter((node) => {
      if (node.type === "customs") return mapToggles.showCustoms
      if (node.type === "warehouse") return mapToggles.showWarehouses
      if (node.type === "mosb") return mapToggles.showMosb
      if (node.type === "site") return mapToggles.showSites
      return true
    })
  }, [
    graph.nodes,
    mapToggles.showCustoms,
    mapToggles.showMosb,
    mapToggles.showSites,
    mapToggles.showWarehouses,
    mapTrack,
  ])

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes],
  )

  const filteredEdges = useMemo(() => {
    if (mapTrack === "global") return [] as NetworkEdge[]

    return graph.edges.filter((edge) => {
      if (!filteredNodeIds.has(edge.sourceId) || !filteredNodeIds.has(edge.targetId)) return false

      switch (edge.routeType) {
        case "port-customs":
          return mapToggles.showCustoms
        case "customs-site":
          return mapToggles.showCustoms && mapToggles.showSites
        case "customs-wh":
          return mapToggles.showCustoms && mapToggles.showWarehouses
        case "customs-mosb":
          return mapToggles.showCustoms && mapToggles.showMosb
        case "wh-mosb":
          return mapToggles.showWarehouses && mapToggles.showMosb
        case "wh-site":
          return mapToggles.showWarehouses && mapToggles.showSites
        case "mosb-site":
          return mapToggles.showMosb && mapToggles.showSites
        default:
          return true
      }
    })
  }, [
    filteredNodeIds,
    graph.edges,
    mapToggles.showCustoms,
    mapToggles.showMosb,
    mapToggles.showSites,
    mapToggles.showWarehouses,
    mapTrack,
  ])

  const nodeMap = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])
  const highlightedEdgeId = useMemo(
    () => filteredEdges.find((edge) => edge.highlighted)?.id ?? null,
    [filteredEdges],
  )
  const effectiveSelectedNodeId = useMemo(() => {
    if (selectedNodeId && filteredNodes.some((node) => node.id === selectedNodeId)) {
      return selectedNodeId
    }
    return filteredNodes.find((node) => node.highlighted)?.id ?? null
  }, [filteredNodes, selectedNodeId])

  const navigate = useCallback(
    (intent: NavigationIntent) => {
      onNavigateIntent?.(intent)
      if (!onNavigateIntent) {
        console.warn("[OverviewMap] onNavigateIntent not provided, navigation skipped", intent)
      }
    },
    [onNavigateIntent],
  )

  const handleToggleChange = useCallback(
    <K extends keyof MapLayerToggles>(key: K, value: MapLayerToggles[K]) => {
      setMapToggles((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleHover = useCallback(
    (info: PickingInfo) => {
      if (!info?.object) {
        setTooltip(null)
        return
      }

      if (info.layer?.id === "origin-country-arcs") {
        const obj = info.object as { country: string; count: number }
        setTooltip({ kind: "originArc", x: info.x, y: info.y, country: obj.country, count: obj.count })
        return
      }

      if (info.layer?.id === "active-voyages") {
        const trip = info.object as NetworkTrip
        setTooltip({
          kind: "trip",
          x: info.x,
          y: info.y,
          shipmentId: trip.shipmentId,
          vendor: trip.vendor,
          routeLabel: trip.routeLabel,
          stageLabel: trip.stageLabel,
          nextMilestone: trip.nextMilestone,
          etaUnix: trip.etaUnix,
        })
        return
      }

      if (info.layer?.id === "network-arcs") {
        const edge = info.object as NetworkEdge
        setTooltip({
          kind: "networkArc",
          x: info.x,
          y: info.y,
          object: edge,
          sourceName: nodeMap.get(edge.sourceId)?.name ?? edge.sourceId,
          targetName: nodeMap.get(edge.targetId)?.name ?? edge.targetId,
        })
        return
      }

      if (info.layer?.id === "network-nodes" || info.layer?.id === "network-node-labels") {
        setTooltip({ kind: "node", x: info.x, y: info.y, object: info.object as NetworkNode })
        return
      }

      setTooltip(null)
    },
    [nodeMap],
  )

  const handleNodeClick = useCallback(
    (info: PickingInfo) => {
      const node = info.object as NetworkNode | undefined
      if (!node) return
      setSelectedNodeId(node.id)
      navigate(buildNetworkNodeIntent(node))
    },
    [navigate],
  )

  useEffect(() => {
    const updateViewportMode = () => {
      setCompactViewport(window.innerWidth < 960)
    }

    updateViewportMode()
    window.addEventListener("resize", updateViewportMode)
    return () => window.removeEventListener("resize", updateViewportMode)
  }, [])

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

    const overlay = new MapboxOverlay({
      interleaved: false,
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

  useEffect(() => {
    if (tripsData.length === 0) return

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

  useEffect(() => {
    if (!overlayRef.current) return

    const filteredEvents =
      heatFilter === "all"
        ? eventsInWindow
        : eventsInWindow.filter((event) => statusByLocationId[event.location_id]?.status_code === heatFilter)

    const rawLayers = [
      showOriginArcs ? createOriginArcLayer(originsData, true) : null,
      createGeofenceLayer(locations, showGeofence),
      showHeatmapLayer
        ? createHeatmapLayer(filteredEvents, {
            getWeight: geofenceWeight,
            radiusPixels: heatmapRadiusPixels,
            visible: true,
          })
        : null,
      showEtaWedgeLayer ? createEtaWedgeLayer(locations, true) : null,
      createArcLayer(filteredEdges, filteredNodes, {
        visible: filteredEdges.length > 0,
        mode: mapTrack,
        highlightedEdgeId,
      }),
      createTripsLayer(tripsData, animTime, showTripsLayer, highlightedShipmentId, mapTrack),
      ...createNodeLayer(filteredNodes, {
        visible: filteredNodes.length > 0,
        mode: mapTrack,
        showLabels: showNodeLabels && zoom >= MAP_LAYER_ZOOM_THRESHOLDS.networkLabelMin,
        selectedNodeId: effectiveSelectedNodeId,
        onClick: handleNodeClick,
      }),
      ...createNetworkStatusRingLayer(filteredNodes, {
        visible: filteredNodes.length > 0,
        selectedNodeId: effectiveSelectedNodeId,
        mode: mapTrack,
        emphasisTypes: mapTrack === "uae-ops" ? ["customs", "mosb"] : [],
        pulse: mapTrack === "global" && zoom >= MAP_LAYER_ZOOM_THRESHOLDS.networkLabelMin,
      }),
    ]

    const layers = rawLayers.filter(
      (layer): layer is NonNullable<(typeof rawLayers)[number]> => layer != null,
    )

    overlayRef.current.setProps({
      layers,
      onHover: handleHover,
    })
  }, [
    animTime,
    effectiveSelectedNodeId,
    eventsInWindow,
    filteredEdges,
    filteredNodes,
    geofenceWeight,
    handleHover,
    handleNodeClick,
    heatFilter,
    heatmapRadiusPixels,
    highlightedEdgeId,
    highlightedShipmentId,
    locations,
    mapTrack,
    originsData,
    showEtaWedgeLayer,
    showGeofence,
    showHeatmapLayer,
    showNodeLabels,
    showOriginArcs,
    showTripsLayer,
    statusByLocationId,
    tripsData,
    zoom,
  ])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(47,107,255,0.18),_transparent_42%),linear-gradient(180deg,_rgba(7,11,22,0.4),_rgba(7,11,22,0.86))]">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        aria-label="Overview map"
        tabIndex={-1}
      />

      <MapTrackSwitch
        track={mapTrack}
        toggles={mapToggles}
        onTrackChange={setMapTrack}
        onToggleChange={handleToggleChange}
      />

      <MapLegend
        className="left-3 top-[136px] sm:top-[116px]"
        track={mapTrack}
        showArcs={showOriginArcs}
        showTrips={showTripsLayer && tripsData.length > 0}
      />

      {showHeatmapLayer ? <HeatmapLegend className="bottom-20 right-3" /> : null}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30">
        {mapTrack === "uae-ops" ? (
          <div className="grid grid-cols-2 gap-2 rounded-hvdc-lg border border-white/10 bg-hvdc-bg-overlay p-2 backdrop-blur-md sm:grid-cols-4">
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              {UAE_OPS_FOOTER_COPY.compact[0]} {footer.customsHold.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              {UAE_OPS_FOOTER_COPY.compact[1]} {footer.warehouseStaging.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              {UAE_OPS_FOOTER_COPY.compact[2]} {footer.mosbPending.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              {UAE_OPS_FOOTER_COPY.compact[3]} {footer.siteReady.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-hvdc-lg border border-white/10 bg-hvdc-bg-overlay p-2 backdrop-blur-md sm:grid-cols-5">
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              Origin {footer.origin.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              In Transit {footer.inTransit.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              Customs Hold {footer.customsHold.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              Site Ready {footer.siteReady.toLocaleString()}
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2 py-2 text-center text-[11px] text-hvdc-text-secondary">
              Delivered {footer.delivered.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {tooltip && tooltip.kind === "node" ? (
        <TooltipCard x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-hvdc-text-primary">{displayNodeTitle(tooltip.object)}</div>
          <div className="mt-2 space-y-1.5 text-[11px] text-hvdc-text-secondary">
            <div className="flex items-center justify-between gap-4">
              <span>Type</span>
              <span className="font-medium text-hvdc-text-primary">{nodeKindLabel(tooltip.object)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>{nodePrimaryMetricLabel(tooltip.object)}</span>
              <span className="font-medium text-hvdc-text-primary">{formatVolume(tooltip.object.volume)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>{tooltip.object.type === "port" || tooltip.object.type === "airport" ? "Stage" : "Status"}</span>
              <span className="font-medium text-hvdc-text-primary">{nodeStatusText(tooltip.object)}</span>
            </div>
            {tooltip.object.type !== "site" ? (
              <div className="flex items-center justify-between gap-4">
                <span>{tooltip.object.type === "customs" ? "Next Action" : "Next Path"}</span>
                <span className="font-medium text-hvdc-text-primary">{nextPathForNode(tooltip.object)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span>Route</span>
                <span className="font-medium text-hvdc-text-primary">{nextPathForNode(tooltip.object)}</span>
              </div>
            )}
            {tooltip.object.type === "customs" ? (
              <div className="flex items-center justify-between gap-4">
                <span>Related Entry</span>
                <span className="font-medium text-hvdc-text-primary">
                  {tooltip.object.id === "khalifa-customs"
                    ? "Khalifa Port"
                    : tooltip.object.id === "zayed-customs"
                      ? "Mina Zayed"
                      : tooltip.object.id === "auh-customs"
                        ? "AUH Airport"
                        : "Jebel Ali"}
                </span>
              </div>
            ) : null}
            {tooltip.object.type === "warehouse" && hasDsvEvidence(tooltip.object.name) ? (
              <div className="flex items-center justify-between gap-4">
                <span>Owner</span>
                <span className="font-medium text-hvdc-text-primary">DSV</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <span>Updated</span>
              <span className="font-medium text-hvdc-text-primary">
                {tooltip.object.status?.last_updated
                  ? formatInDubaiTimezone(tooltip.object.status.last_updated)
                  : "N/A"}
              </span>
            </div>
          </div>
        </TooltipCard>
      ) : null}

      {tooltip && tooltip.kind === "networkArc" ? (
        <TooltipCard x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-hvdc-text-primary">
            {tooltip.sourceName} → {tooltip.targetName}
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] text-hvdc-text-secondary">
            <div className="flex items-center justify-between gap-4">
              <span>Route</span>
              <span className="font-medium text-hvdc-text-primary">{routeLabel(tooltip.object)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Volume</span>
              <span className="font-medium text-hvdc-text-primary">{formatVolume(tooltip.object.volume)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Risk</span>
              <span className={`font-medium ${riskClass(tooltip.object.risk)}`}>{riskLabel(tooltip.object.risk)}</span>
            </div>
          </div>
        </TooltipCard>
      ) : null}

      {tooltip && tooltip.kind === "originArc" ? (
        <TooltipCard x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-hvdc-text-primary">
            {countryFlag(tooltip.country)} {tooltip.country}
          </div>
          <div className="mt-1 text-[11px] text-hvdc-text-secondary">
            {tooltip.count.toLocaleString()}
            {t.overviewMap.countSuffix}
          </div>
        </TooltipCard>
      ) : null}

      {tooltip && tooltip.kind === "trip" ? (
        <TooltipCard x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-hvdc-text-primary">Voyage: {tooltip.shipmentId}</div>
          <div className="mt-1 space-y-1 text-[11px] text-hvdc-text-secondary">
            {tooltip.vendor ? <div>Vendor: {tooltip.vendor}</div> : null}
            <div>Current Stage: {tooltip.stageLabel}</div>
            {tooltip.nextMilestone ? <div>Next: {tooltip.nextMilestone}</div> : null}
            <div>
              ETA{" "}
              {new Date(tooltip.etaUnix * 1000).toLocaleDateString("en-AE", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </TooltipCard>
      ) : null}
    </div>
  )
}
