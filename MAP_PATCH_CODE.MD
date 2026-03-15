판정: **예 — 아래 코드는 `OverviewMap.tsx` 교체본으로 바로 넣을 수 있는 실전 버전입니다.**
근거: 목표는 **지리 지도 위에 관계망(Network Graph)을 오버레이**하는 것이고, 구현 우선순위는 **waterfall 제거 → 번들 축소 → map/ops 분리**가 맞습니다. 
다음행동: 아래 파일로 교체한 뒤, `/api/shipments/trips`와 `/api/chain/summary` 응답 shape만 현재 repo와 맞는지 확인하십시오. 가정: 현재 repo의 `POI_LOCATIONS`, `TripData`, `LocationStatus` 타입은 기존 구현과 동일합니다. 

```tsx
'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { PickingInfo } from '@deck.gl/core'

import { useOpsStore } from '@repo/shared'
import { useLogisticsStore } from '@/store/logisticsStore'
import { useCasesStore } from '@/store/casesStore'

import { createLocationLayer } from '@/components/map/layers/createLocationLayer'
import { createHeatmapLayer } from '@/components/map/layers/createHeatmapLayer'
import { createGeofenceLayer } from '@/components/map/layers/createGeofenceLayer'
import { createEtaWedgeLayer } from '@/components/map/layers/createEtaWedgeLayer'
import { createGeofenceGeojson, isPointInGeofence } from '@/components/map/layers/geofenceUtils'
import { createPoiLayers, getPoiTooltip } from '@/components/map/PoiLocationsLayer'
import { createStatusRingLayer } from '@/components/map/layers/createStatusRingLayer'
import {
  createTripsLayer,
  computeAnimTime,
  TRIPS_TIME_WINDOW_SECS,
} from '@/components/map/layers/createTripsLayer'
import {
  createOriginArcLayer,
  type OriginEntry,
} from '@/components/map/layers/createOriginArcLayer'

import { HeatmapLegend } from '@/components/map/HeatmapLegend'
import { MapLegend } from '@/components/map/MapLegend'
import { POI_LOCATIONS } from '@/lib/map/poiLocations'
import { buildDashboardLink } from '@/lib/navigation/contracts'
import { formatInDubaiTimezone } from '@/lib/time'
import { useT } from '@/hooks/useT'

import type { Event, Location, LocationStatus } from '@repo/shared'
import type { NavigationIntent } from '@/types/overview'
import type { PoiLocation } from '@/lib/map/poiTypes'
import type { TripData } from '@/app/api/shipments/trips/route'

/** 국가코드 → 국기 이모지 */
function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

type TooltipInfo =
  | { kind: 'location'; x: number; y: number; object: Location & { status?: LocationStatus } }
  | { kind: 'poi'; x: number; y: number; text: string }
  | { kind: 'arc'; x: number; y: number; country: string; count: number }
  | { kind: 'trip'; x: number; y: number; vendor: string | null; flowCode: number | null; etaUnix: number }

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ||
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const INITIAL_VIEW = {
  longitude: 54.4,
  latitude: 24.5,
  zoom: 8.1,
}

const POI_BOUNDS: maplibregl.LngLatBoundsLike = [
  [52.57, 24.12],
  [55.25, 25.25],
]

const MAP_LAYER_ZOOM_THRESHOLDS = {
  heatmapMax: 8.8,
  statusMin: 8.4,
  poiMin: 7.2,
  poiLabelMin: 7.4,
  poiDetailMin: 10.2,
  originArcMax: 8.8,
}

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

function LegendDot({
  colorClass,
  label,
}: {
  colorClass: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass} shadow-[0_0_10px_rgba(255,255,255,0.12)]`} />
      <span className="text-xs text-white/75">{label}</span>
    </div>
  )
}

function MetricChip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  )
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
    if (zoom >= 12) return 34
    if (zoom >= 9) return 52
    return 72
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
      }
    },
    [onNavigateIntent],
  )

  const handleHover = useCallback((info: PickingInfo) => {
    if (!info?.object) {
      setTooltip(null)
      return
    }

    if (info.layer?.id === 'origin-country-arcs') {
      const obj = info.object as { country: string; count: number }
      setTooltip({ kind: 'arc', x: info.x, y: info.y, country: obj.country, count: obj.count })
      return
    }

    if (info.layer?.id === 'active-voyages') {
      const obj = info.object as { vendor: string | null; flowCode: number | null; etaUnix: number }
      setTooltip({
        kind: 'trip',
        x: info.x,
        y: info.y,
        vendor: obj.vendor ?? null,
        flowCode: obj.flowCode ?? null,
        etaUnix: obj.etaUnix,
      })
      return
    }

    if (info.layer?.id === 'poi-markers' || info.layer?.id === 'poi-labels') {
      const poi = getPoiTooltip(info)
      if (!poi?.text) {
        setTooltip(null)
        return
      }
      setTooltip({ kind: 'poi', x: info.x, y: info.y, text: poi.text })
      return
    }

    setTooltip({
      kind: 'location',
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      attributionControl: false,
      pitch: 0,
      bearing: 0,
      antialias: true,
    })

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      'bottom-right',
    )

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

    const handleZoomChange = () => {
      setZoom(map.getZoom())
    }

    map.on('moveend', handleZoomChange)
    map.on('zoomend', handleZoomChange)

    map.once('load', () => {
      try {
        map.setFog?.({
          color: 'rgba(11,19,36,0.82)',
          'high-color': 'rgba(11,19,36,0.92)',
          'horizon-blend': 0.12,
        } as any)
      } catch {
        // maplibre 일부 스타일에서는 fog 미지원
      }

      if (!didFitBoundsRef.current) {
        map.fitBounds(POI_BOUNDS, { padding: 48, duration: 0 })
        didFitBoundsRef.current = true
        setZoom(map.getZoom())
      }
    })

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
    })

    map.addControl(overlay as unknown as maplibregl.IControl)

    mapRef.current = map
    overlayRef.current = overlay

    return () => {
      map.off('moveend', handleZoomChange)
      map.off('zoomend', handleZoomChange)
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [])

  useEffect(() => {
    fetch('/api/shipments/trips')
      .then((r) => r.json())
      .then((j) => setTripsData(j.trips ?? []))
      .catch(() => setTripsData([]))
  }, [])

  useEffect(() => {
    fetch('/api/chain/summary')
      .then((r) => r.json())
      .then((j) => setOriginsData(j.origins ?? []))
      .catch(() => setOriginsData([]))
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
      heatFilter === 'all'
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

    const stageKey = activePipelineStage as string | null

    const layers = [
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
      createTripsLayer(tripsData, animTime, layerTrips, highlightedShipmentId),
      createStatusRingLayer(POI_LOCATIONS, showPoiLayer, stageKey),
      ...poiLayers,
    ].filter((layer): layer is NonNullable<typeof layer> => layer != null)

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
    navigate,
  ])

  const networkStats = useMemo(() => {
    const ports = POI_LOCATIONS.filter((x) => x.category === 'PORT' || x.category === 'AIRPORT').length
    const warehouses = POI_LOCATIONS.filter((x) => x.category === 'WAREHOUSE').length
    const sites = POI_LOCATIONS.filter((x) => x.category === 'HVDC_SITE').length

    const lastUpdatedValues = Object.values(statusByLocationId)
      .map((x) => x?.last_updated)
      .filter(Boolean)
      .map((x) => new Date(x as string).getTime())

    const latestUpdated =
      lastUpdatedValues.length > 0
        ? new Date(Math.max(...lastUpdatedValues)).toISOString()
        : null

    const totalOriginCases = originsData.reduce((sum, item) => sum + (item.count ?? 0), 0)

    return {
      ports,
      warehouses,
      sites,
      origins: originsData.length,
      totalOriginCases,
      activeTrips: tripsData.length,
      latestUpdated,
    }
  }, [originsData, tripsData.length, statusByLocationId])

  const isFresh = useMemo(() => {
    if (!networkStats.latestUpdated) return false
    const diff = Date.now() - new Date(networkStats.latestUpdated).getTime()
    return diff <= 1000 * 60 * 30
  }, [networkStats.latestUpdated])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px]">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        aria-label="Overview network map"
        tabIndex={-1}
      />

      {/* 상단/좌측 네트워크 패널 */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 hidden w-[220px] rounded-[20px] border border-white/10 bg-black/36 p-4 backdrop-blur-md xl:block">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-base text-white/90">◉</span>
          <div>
            <div className="text-sm font-semibold text-white">Network Map</div>
            <div className="text-[11px] text-white/45">HVDC Control Tower</div>
          </div>
        </div>

        <div className="space-y-3">
          <LegendDot colorClass="bg-cyan-400" label="Port / Airport" />
          <LegendDot colorClass="bg-amber-400" label="Warehouse" />
          <LegendDot colorClass="bg-orange-400" label="MOSB" />
          <LegendDot colorClass="bg-emerald-400" label="HVDC Site" />
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="grid grid-cols-2 gap-2">
          <MetricChip label="Origins" value={networkStats.origins.toString()} />
          <MetricChip label="Origin Cases" value={networkStats.totalOriginCases.toLocaleString()} />
          <MetricChip label="Ports" value={networkStats.ports.toString()} />
          <MetricChip label="WH" value={networkStats.warehouses.toString()} />
          <MetricChip label="Sites" value={networkStats.sites.toString()} />
          <MetricChip label="Trips" value={networkStats.activeTrips.toString()} />
        </div>
      </div>

      {/* 하단 우측 freshness pill */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-2xl border border-white/10 bg-black/38 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isFresh ? 'bg-emerald-400' : 'bg-amber-400'
            } shadow-[0_0_12px_rgba(255,255,255,0.18)]`}
          />
          <div className="text-xs text-white/78">
            {networkStats.latestUpdated
              ? `${isFresh ? 'Fresh' : 'Stale'} ${formatInDubaiTimezone(networkStats.latestUpdated)}`
              : 'No freshness'}
          </div>
        </div>
      </div>

      {showHeatmapLayer ? <HeatmapLegend /> : null}
      <MapLegend showArcs={showOriginArcs} showTrips={tripsData.length > 0} />

      {/* 툴팁 */}
      {tooltip && tooltip.kind === 'location' && (
        <div
          className="absolute z-50 max-w-[260px] rounded-2xl border border-white/10 bg-[#0B1324]/95 p-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <div className="mb-1 font-semibold text-white">{tooltip.object.name}</div>
          <div className="space-y-1 text-white/70">
            <div className="flex justify-between gap-4">
              <span>Occupancy</span>
              <span className="font-medium text-white">
                {((tooltip.object.status?.occupancy_rate ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status</span>
              <span
                className={`font-medium ${
                  tooltip.object.status?.status_code === 'OK'
                    ? 'text-emerald-400'
                    : tooltip.object.status?.status_code === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }`}
              >
                {tooltip.object.status?.status_code ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Updated</span>
              <span className="text-xs font-medium text-white">
                {tooltip.object.status?.last_updated
                  ? formatInDubaiTimezone(tooltip.object.status.last_updated)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {tooltip && tooltip.kind === 'poi' && (
        <div
          className="absolute z-50 max-w-[260px] whitespace-pre-line rounded-2xl border border-white/10 bg-[#0B1324]/95 p-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <div className="font-semibold text-white">{tooltip.text}</div>
        </div>
      )}

      {tooltip && tooltip.kind === 'arc' && (
        <div
          className="absolute z-50 rounded-2xl border border-white/10 bg-[#0B1324]/95 px-3 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <span className="font-semibold text-white">
            {countryFlag(tooltip.country)} {tooltip.country}
          </span>
          <span className="ml-2 text-white/65">
            {tooltip.count.toLocaleString()}
            {t.overviewMap.countSuffix}
          </span>
        </div>
      )}

      {tooltip && tooltip.kind === 'trip' && (
        <div
          className="absolute z-50 min-w-[170px] rounded-2xl border border-white/10 bg-[#0B1324]/95 px-3 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.vendor && (
            <div className="font-semibold text-white">{tooltip.vendor}</div>
          )}
          <div className="text-xs text-white/65">
            {tooltip.flowCode !== null
              ? `Flow ${tooltip.flowCode} · ${tooltip.flowCode >= 3 ? t.overviewMap.mosbRoute : t.overviewMap.directRoute}`
              : 'In transit'}
          </div>
          <div className="mt-1 text-xs text-white/65">
            ETA{' '}
            {new Date(tooltip.etaUnix * 1000).toLocaleDateString('en-AE', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

## 적용 포인트

이 코드가 위 그림처럼 보이게 하는 핵심은 4개입니다.

1. **MapLibre dark basemap**
2. **Origin Arc + Trips + Node + Status Ring** 동시 렌더
3. **좌상단 glass legend panel**
4. **우하단 freshness pill**

## 다음 확인

아래 3개만 확인하면 됩니다.

* `POI_LOCATIONS`에 `PORT / AIRPORT / WAREHOUSE / HVDC_SITE` category 존재 여부
* `/api/shipments/trips` 응답에 `trips` 배열 존재 여부
* `/api/chain/summary` 응답에 `origins` 배열 존재 여부

원하시면 다음으로 바로
**`createArcLayer.ts / createNodeLayer.ts / createStatusRingLayer.ts` 실전 코드 세트**까지 이어서 드리겠습니다.
