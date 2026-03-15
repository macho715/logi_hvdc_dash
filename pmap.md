판정: **예 — 바로 붙여넣을 수 있는 2트랙 맵 코드 드립니다.**
근거: **Global Track**는 기존 전세계 공급망용, **UAE Ops Track**는 Port/Customs/WH/MOSB/Site 네트워크용으로 분리하는 구조입니다.
다음행동: 아래 4개를 넣고 `OverviewMap.tsx`에 연결하십시오.

## 1) `components/overview/MapTrackSwitch.tsx`

```tsx
'use client'

export type MapTrack = 'global' | 'uae-ops'

export interface MapLayerToggles {
  showOriginArcs: boolean
  showTrips: boolean
  showCustoms: boolean
  showWarehouses: boolean
  showMosb: boolean
  showSites: boolean
}

interface MapTrackSwitchProps {
  track: MapTrack
  onTrackChange: (track: MapTrack) => void
  toggles: MapLayerToggles
  onToggleChange: <K extends keyof MapLayerToggles>(key: K, value: MapLayerToggles[K]) => void
}

function ToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl border px-3 py-2 text-xs font-medium transition',
        active
          ? 'border-hvdc-brand/30 bg-hvdc-brand/15 text-hvdc-text-primary shadow-hvdc-blue'
          : 'border-hvdc-border-soft bg-white/[0.03] text-hvdc-text-secondary hover:bg-white/[0.06]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function MapTrackSwitch({
  track,
  onTrackChange,
  toggles,
  onToggleChange,
}: MapTrackSwitchProps) {
  return (
    <div className="flex flex-col gap-3 rounded-hvdc-xl border border-hvdc-border-soft bg-hvdc-panel px-4 py-4 shadow-hvdc-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-hvdc-text-primary">Map Mode</div>
          <div className="mt-1 text-xs text-hvdc-text-secondary">
            Global 공급망 / UAE 운영 네트워크 전환
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-hvdc-border-soft bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => onTrackChange('global')}
            className={[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              track === 'global'
                ? 'bg-hvdc-brand text-white shadow-hvdc-blue'
                : 'text-hvdc-text-secondary hover:bg-white/[0.05]',
            ].join(' ')}
          >
            Global
          </button>

          <button
            type="button"
            onClick={() => onTrackChange('uae-ops')}
            className={[
              'rounded-lg px-3 py-2 text-xs font-semibold transition',
              track === 'uae-ops'
                ? 'bg-hvdc-brand text-white shadow-hvdc-blue'
                : 'text-hvdc-text-secondary hover:bg-white/[0.05]',
            ].join(' ')}
          >
            UAE Ops
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ToggleChip
          active={toggles.showOriginArcs}
          label="Origin Arc"
          onClick={() => onToggleChange('showOriginArcs', !toggles.showOriginArcs)}
        />
        <ToggleChip
          active={toggles.showTrips}
          label="Trips"
          onClick={() => onToggleChange('showTrips', !toggles.showTrips)}
        />
        <ToggleChip
          active={toggles.showCustoms}
          label="Customs"
          onClick={() => onToggleChange('showCustoms', !toggles.showCustoms)}
        />
        <ToggleChip
          active={toggles.showWarehouses}
          label="WH"
          onClick={() => onToggleChange('showWarehouses', !toggles.showWarehouses)}
        />
        <ToggleChip
          active={toggles.showMosb}
          label="MOSB"
          onClick={() => onToggleChange('showMosb', !toggles.showMosb)}
        />
        <ToggleChip
          active={toggles.showSites}
          label="Sites"
          onClick={() => onToggleChange('showSites', !toggles.showSites)}
        />
      </div>
    </div>
  )
}

export default MapTrackSwitch
```

---

## 2) `components/map/layers/createUaeRouteLayer.ts`

```ts
import { PathLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'

export type UaeNodeType = 'port' | 'airport' | 'customs' | 'warehouse' | 'mosb' | 'site'
export type RiskLevel = 'ok' | 'warn' | 'critical'

export interface UaeNode {
  id: string
  name: string
  type: UaeNodeType
  lon: number
  lat: number
  risk?: RiskLevel
  volume?: number
  siteCode?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
}

export interface UaeRouteEdge {
  id: string
  sourceId: string
  targetId: string
  routeType:
    | 'port-customs'
    | 'customs-wh'
    | 'customs-site'
    | 'wh-mosb'
    | 'wh-site'
    | 'mosb-site'
  flowCode: 0 | 1 | 2 | 3 | 4 | 5
  volume: number
  risk?: RiskLevel
  active?: boolean
  highlighted?: boolean
  path?: [number, number][]
}

interface CreateUaeRouteLayerOptions {
  visible?: boolean
  pickable?: boolean
  showCustoms?: boolean
  showWarehouses?: boolean
  showMosb?: boolean
  showSites?: boolean
  highlightedEdgeId?: string | null
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
}

const ROUTE_COLOR = {
  portCustoms: [53, 214, 255, 150] as [number, number, number, number],
  customsWh: [47, 107, 255, 165] as [number, number, number, number],
  customsSite: [46, 212, 122, 170] as [number, number, number, number],
  whMosb: [246, 180, 69, 185] as [number, number, number, number],
  whSite: [120, 170, 255, 160] as [number, number, number, number],
  mosbSite: [139, 108, 255, 200] as [number, number, number, number],
  warn: [246, 180, 69, 215] as [number, number, number, number],
  critical: [255, 95, 109, 235] as [number, number, number, number],
  highlight: [255, 255, 255, 245] as [number, number, number, number],
}

function getRouteColor(edge: UaeRouteEdge, highlightedEdgeId?: string | null) {
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return ROUTE_COLOR.highlight
  if (edge.highlighted) return ROUTE_COLOR.highlight
  if (edge.risk === 'critical') return ROUTE_COLOR.critical
  if (edge.risk === 'warn') return ROUTE_COLOR.warn

  switch (edge.routeType) {
    case 'port-customs':
      return ROUTE_COLOR.portCustoms
    case 'customs-wh':
      return ROUTE_COLOR.customsWh
    case 'customs-site':
      return ROUTE_COLOR.customsSite
    case 'wh-mosb':
      return ROUTE_COLOR.whMosb
    case 'wh-site':
      return ROUTE_COLOR.whSite
    case 'mosb-site':
      return ROUTE_COLOR.mosbSite
    default:
      return ROUTE_COLOR.customsWh
  }
}

function getRouteWidth(edge: UaeRouteEdge, highlightedEdgeId?: string | null) {
  const base = Math.max(2, Math.log2((edge.volume ?? 1) + 1))
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return base * 2.4
  if (edge.highlighted) return base * 2.1
  if (edge.active) return base * 1.5
  if (edge.risk === 'critical') return base * 1.9
  if (edge.risk === 'warn') return base * 1.5
  return base
}

function edgeVisible(edge: UaeRouteEdge, options: CreateUaeRouteLayerOptions) {
  if (options.showCustoms === false && edge.routeType.includes('customs')) return false
  if (options.showWarehouses === false && edge.routeType.includes('wh')) return false
  if (options.showMosb === false && edge.routeType.includes('mosb')) return false
  if (options.showSites === false && edge.routeType.endsWith('site')) return false
  return true
}

export function createUaeRouteLayer(
  edges: UaeRouteEdge[],
  nodes: UaeNode[],
  options: CreateUaeRouteLayerOptions = {},
) {
  const {
    visible = true,
    pickable = true,
    highlightedEdgeId = null,
    onHover,
    onClick,
  } = options

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  const filtered = edges.filter((edge) => {
    if (!nodeMap.has(edge.sourceId) || !nodeMap.has(edge.targetId)) return false
    return edgeVisible(edge, options)
  })

  return new PathLayer<UaeRouteEdge>({
    id: 'uae-route-layer',
    data: filtered,
    visible,
    pickable,
    widthUnits: 'pixels',
    widthMinPixels: 2,
    widthMaxPixels: 10,
    rounded: true,
    capRounded: true,
    jointRounded: true,
    billboard: true,
    getPath: (d) => {
      if (d.path && d.path.length >= 2) return d.path

      const source = nodeMap.get(d.sourceId)!
      const target = nodeMap.get(d.targetId)!
      return [
        [source.lon, source.lat],
        [target.lon, target.lat],
      ]
    },
    getColor: (d) => getRouteColor(d, highlightedEdgeId),
    getWidth: (d) => getRouteWidth(d, highlightedEdgeId),
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getColor: 250,
      getWidth: 250,
    },
    onHover,
    onClick,
    updateTriggers: {
      getColor: [highlightedEdgeId],
      getWidth: [highlightedEdgeId],
    },
  })
}
```

---

## 3) `components/map/layers/createCustomsNodeLayer.ts`

```ts
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import type { UaeNode } from './createUaeRouteLayer'

interface CreateCustomsNodeLayerOptions {
  visible?: boolean
  pickable?: boolean
  selectedNodeId?: string | null
  showLabels?: boolean
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
}

const CUSTOMS_FILL = [53, 214, 255, 230] as [number, number, number, number]
const CUSTOMS_STROKE = [255, 255, 255, 130] as [number, number, number, number]

function getRadius(node: UaeNode, selectedNodeId?: string | null) {
  const base = Math.max(10, Math.sqrt(node.volume ?? 1) * 0.8 + 10)
  if (selectedNodeId && node.id === selectedNodeId) return base * 1.45
  if (node.risk === 'critical') return base * 1.25
  if (node.risk === 'warn') return base * 1.15
  return base
}

export function createCustomsNodeLayer(
  nodes: UaeNode[],
  options: CreateCustomsNodeLayerOptions = {},
) {
  const {
    visible = true,
    pickable = true,
    selectedNodeId = null,
    showLabels = true,
    onHover,
    onClick,
  } = options

  const customsNodes = nodes.filter((node) => node.type === 'customs')

  const pointLayer = new ScatterplotLayer<UaeNode>({
    id: 'customs-node-layer',
    data: customsNodes,
    visible,
    pickable,
    stroked: true,
    filled: true,
    radiusUnits: 'pixels',
    radiusMinPixels: 10,
    radiusMaxPixels: 24,
    getPosition: (d) => [d.lon, d.lat],
    getRadius: (d) => getRadius(d, selectedNodeId),
    getFillColor: CUSTOMS_FILL,
    getLineColor: CUSTOMS_STROKE,
    getLineWidth: (d) => {
      if (selectedNodeId && d.id === selectedNodeId) return 3
      if (d.risk === 'critical') return 2.8
      if (d.risk === 'warn') return 2.2
      return 1.6
    },
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getRadius: 220,
    },
    onHover,
    onClick,
    updateTriggers: {
      getRadius: [selectedNodeId],
    },
  })

  if (!showLabels) return [pointLayer]

  const labelLayer = new TextLayer<UaeNode>({
    id: 'customs-node-label-layer',
    data: customsNodes,
    visible,
    pickable: false,
    getPosition: (d) => [d.lon, d.lat],
    getText: (d) => d.name,
    getSize: 12,
    sizeUnits: 'pixels',
    getColor: [244, 247, 255, 230],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'bottom',
    getPixelOffset: [0, -16],
    fontWeight: 700,
    background: true,
    getBackgroundColor: [11, 19, 36, 168],
    getBorderColor: [255, 255, 255, 24],
    getBorderWidth: 1,
    backgroundPadding: [8, 4],
    parameters: {
      depthTest: false,
    },
  })

  return [pointLayer, labelLayer]
}
```

---

## 4) `OverviewMap.tsx` 연결 스니펫

아래만 넣으면 2트랙 전환이 됩니다.

```tsx
import { useState } from 'react'
import { MapTrackSwitch, type MapTrack, type MapLayerToggles } from '@/components/overview/MapTrackSwitch'
import { createUaeRouteLayer, type UaeNode, type UaeRouteEdge } from '@/components/map/layers/createUaeRouteLayer'
import { createCustomsNodeLayer } from '@/components/map/layers/createCustomsNodeLayer'

const [mapTrack, setMapTrack] = useState<MapTrack>('uae-ops')
const [mapToggles, setMapToggles] = useState<MapLayerToggles>({
  showOriginArcs: true,
  showTrips: true,
  showCustoms: true,
  showWarehouses: true,
  showMosb: true,
  showSites: true,
})

const handleToggleChange = <K extends keyof MapLayerToggles>(
  key: K,
  value: MapLayerToggles[K],
) => {
  setMapToggles((prev) => ({ ...prev, [key]: value }))
}

const uaeNodes: UaeNode[] = [
  { id: 'khalifa-port', name: 'Khalifa Port', type: 'port', lon: 54.89, lat: 24.81, volume: 410, risk: 'ok' },
  { id: 'auh-customs', name: 'AUH Customs', type: 'customs', lon: 54.70, lat: 24.46, volume: 145, risk: 'warn' },
  { id: 'dsv-wh', name: 'DSV WH', type: 'warehouse', lon: 54.58, lat: 24.36, volume: 951, risk: 'warn' },
  { id: 'mosb', name: 'MOSB', type: 'mosb', lon: 54.53, lat: 24.31, volume: 520, risk: 'critical' },
  { id: 'agi-site', name: 'AGI', type: 'site', siteCode: 'AGI', lon: 54.94, lat: 24.53, volume: 1057, risk: 'critical' },
]

const uaeEdges: UaeRouteEdge[] = [
  { id: 'r1', sourceId: 'khalifa-port', targetId: 'auh-customs', routeType: 'port-customs', flowCode: 1, volume: 200, risk: 'ok', active: true },
  { id: 'r2', sourceId: 'auh-customs', targetId: 'dsv-wh', routeType: 'customs-wh', flowCode: 2, volume: 160, risk: 'warn', active: true },
  { id: 'r3', sourceId: 'dsv-wh', targetId: 'mosb', routeType: 'wh-mosb', flowCode: 4, volume: 125, risk: 'critical', active: true },
  { id: 'r4', sourceId: 'mosb', targetId: 'agi-site', routeType: 'mosb-site', flowCode: 4, volume: 110, risk: 'critical', active: true },
]

// JSX
<MapTrackSwitch
  track={mapTrack}
  onTrackChange={setMapTrack}
  toggles={mapToggles}
  onToggleChange={handleToggleChange}
/>

// layer 조립부
const layers =
  mapTrack === 'global'
    ? [
        createArcLayer(globalEdges, globalNodes, {
          visible: mapToggles.showOriginArcs,
          onHover: handleHover,
        }),
        ...createNodeLayer(globalNodes, {
          selectedNodeId,
          showLabels: true,
          onHover: handleHover,
          onClick: handleNodeClick,
        }),
        ...createStatusRingLayer(globalNodes, {
          selectedNodeId,
          pulse: true,
        }),
        createTripsLayer(tripsData, animTime, mapToggles.showTrips, highlightedTripId),
        createLabelLayer(globalNodes, POI_LOCATIONS, true),
      ]
    : [
        createUaeRouteLayer(uaeEdges, uaeNodes, {
          visible: true,
          showCustoms: mapToggles.showCustoms,
          showWarehouses: mapToggles.showWarehouses,
          showMosb: mapToggles.showMosb,
          showSites: mapToggles.showSites,
          onHover: handleHover,
        }),
        ...createCustomsNodeLayer(uaeNodes, {
          visible: mapToggles.showCustoms,
          selectedNodeId,
          showLabels: true,
          onHover: handleHover,
          onClick: handleNodeClick,
        }),
        ...createNodeLayer(
          uaeNodes.filter((n) => n.type !== 'customs') as any,
          {
            visible: true,
            selectedNodeId,
            showLabels: true,
            onHover: handleHover,
            onClick: handleNodeClick,
          },
        ),
        ...createStatusRingLayer(
          uaeNodes.filter((n) => n.type !== 'customs') as any,
          {
            visible: true,
            selectedNodeId,
            pulse: true,
          },
        ),
        createTripsLayer(tripsData, animTime, mapToggles.showTrips, highlightedTripId),
      ]
```

---

## 5) 핵심 요약

이 코드로 바뀌는 구조는 이겁니다.

```text
Global Track = 기존 전세계 공급망 맵 유지
UAE Ops Track = Port / Customs / WH / MOSB / Site 네트워크맵
```

즉 사용자는

* `Global ↔ UAE Ops` **change**
* `Origin Arc / Trips / Customs / WH / MOSB / Sites` **on/off**

둘 다 할 수 있습니다.

원하시면 다음으로 바로
**이 코드 기준 `OverviewMap.tsx` 전체 통합본**까지 한 번에 정리해드리겠습니다.
