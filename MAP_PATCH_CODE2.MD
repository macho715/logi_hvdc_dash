판정: **예 — 바로 파일로 쪼개 넣을 수 있는 `createArcLayer.ts / createNodeLayer.ts / createStatusRingLayer.ts` 실전 코드 세트입니다.**
근거: 이전 `OverviewMap.tsx` 구조에 맞춰 **MapLibre 위에 deck.gl layer**를 얹는 방식으로 작성했고, **dark basemap + network arcs + node circles + risk rings** 조합을 전제로 했습니다.
다음행동: 아래 3개 파일을 `components/map/layers/`에 넣고, `OverviewMap.tsx`에서 import 연결하면 됩니다. `가정:` 현재 repo가 `deck.gl`, `@deck.gl/layers`, `@deck.gl/core`를 이미 사용 중입니다.

---

# 1) `createArcLayer.ts`

```ts
import { ArcLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'

export type NodeType = 'origin' | 'port' | 'airport' | 'warehouse' | 'mosb' | 'site'
export type RiskLevel = 'ok' | 'warn' | 'critical'

export interface NetworkNode {
  id: string
  name: string
  type: NodeType
  lon: number
  lat: number
  volume?: number
  risk?: RiskLevel
  siteCode?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  active?: boolean
}

export interface NetworkEdge {
  id: string
  sourceId: string
  targetId: string
  flowCode: 0 | 1 | 2 | 3 | 4 | 5
  volume: number
  risk?: RiskLevel
  active?: boolean
  highlighted?: boolean
}

interface CreateArcLayerOptions {
  visible?: boolean
  pickable?: boolean
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
  highlightedEdgeId?: string | null
}

const EDGE_COLOR = {
  defaultSource: [120, 170, 255, 45] as [number, number, number, number],
  defaultTarget: [255, 214, 102, 70] as [number, number, number, number],

  flow0Source: [180, 185, 200, 35] as [number, number, number, number],
  flow0Target: [180, 185, 200, 50] as [number, number, number, number],

  flow1Source: [77, 184, 255, 55] as [number, number, number, number],
  flow1Target: [77, 184, 255, 95] as [number, number, number, number],

  flow2Source: [53, 214, 255, 55] as [number, number, number, number],
  flow2Target: [53, 214, 255, 95] as [number, number, number, number],

  flow3Source: [246, 180, 69, 55] as [number, number, number, number],
  flow3Target: [246, 180, 69, 95] as [number, number, number, number],

  flow4Source: [255, 95, 109, 55] as [number, number, number, number],
  flow4Target: [255, 95, 109, 95] as [number, number, number, number],

  flow5Source: [139, 108, 255, 55] as [number, number, number, number],
  flow5Target: [139, 108, 255, 95] as [number, number, number, number],

  warn: [246, 180, 69, 110] as [number, number, number, number],
  critical: [255, 95, 109, 135] as [number, number, number, number],
  activeBoost: [255, 255, 255, 180] as [number, number, number, number],
}

function getFlowColor(flowCode: NetworkEdge['flowCode']) {
  switch (flowCode) {
    case 0:
      return { source: EDGE_COLOR.flow0Source, target: EDGE_COLOR.flow0Target }
    case 1:
      return { source: EDGE_COLOR.flow1Source, target: EDGE_COLOR.flow1Target }
    case 2:
      return { source: EDGE_COLOR.flow2Source, target: EDGE_COLOR.flow2Target }
    case 3:
      return { source: EDGE_COLOR.flow3Source, target: EDGE_COLOR.flow3Target }
    case 4:
      return { source: EDGE_COLOR.flow4Source, target: EDGE_COLOR.flow4Target }
    case 5:
      return { source: EDGE_COLOR.flow5Source, target: EDGE_COLOR.flow5Target }
    default:
      return { source: EDGE_COLOR.defaultSource, target: EDGE_COLOR.defaultTarget }
  }
}

function alphaScale(edge: NetworkEdge, highlightedEdgeId?: string | null): number {
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return 1.8
  if (edge.highlighted) return 1.55
  if (edge.active) return 1.35
  if (edge.risk === 'critical') return 1.45
  if (edge.risk === 'warn') return 1.2
  return 1
}

function applyAlpha(
  rgba: [number, number, number, number],
  multiplier: number,
): [number, number, number, number] {
  return [rgba[0], rgba[1], rgba[2], Math.min(255, Math.round(rgba[3] * multiplier))]
}

function getEdgeColors(edge: NetworkEdge, highlightedEdgeId?: string | null) {
  const flow = getFlowColor(edge.flowCode)
  const multiplier = alphaScale(edge, highlightedEdgeId)

  if (edge.risk === 'critical') {
    return {
      source: applyAlpha(EDGE_COLOR.critical, multiplier),
      target: applyAlpha(EDGE_COLOR.critical, multiplier),
    }
  }

  if (edge.risk === 'warn') {
    return {
      source: applyAlpha(EDGE_COLOR.warn, multiplier),
      target: applyAlpha(EDGE_COLOR.warn, multiplier),
    }
  }

  return {
    source: applyAlpha(flow.source, multiplier),
    target: applyAlpha(flow.target, multiplier),
  }
}

function getWidth(edge: NetworkEdge, highlightedEdgeId?: string | null): number {
  const base = Math.max(1, Math.log2((edge.volume ?? 1) + 1))
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return base * 2.6
  if (edge.highlighted) return base * 2.2
  if (edge.active) return base * 1.8
  if (edge.risk === 'critical') return base * 1.7
  if (edge.risk === 'warn') return base * 1.4
  return base
}

export function createArcLayer(
  edges: NetworkEdge[],
  nodes: NetworkNode[],
  options: CreateArcLayerOptions = {},
) {
  const {
    visible = true,
    pickable = true,
    onHover,
    onClick,
    highlightedEdgeId = null,
  } = options

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  const validEdges = edges.filter((edge) => {
    return nodeMap.has(edge.sourceId) && nodeMap.has(edge.targetId)
  })

  return new ArcLayer<NetworkEdge>({
    id: 'network-arcs',
    data: validEdges,
    visible,
    pickable,
    greatCircle: false,
    numSegments: 48,
    getSourcePosition: (d) => {
      const n = nodeMap.get(d.sourceId)!
      return [n.lon, n.lat]
    },
    getTargetPosition: (d) => {
      const n = nodeMap.get(d.targetId)!
      return [n.lon, n.lat]
    },
    getSourceColor: (d) => getEdgeColors(d, highlightedEdgeId).source,
    getTargetColor: (d) => getEdgeColors(d, highlightedEdgeId).target,
    getWidth: (d) => getWidth(d, highlightedEdgeId),
    widthUnits: 'pixels',
    widthMinPixels: 1,
    widthMaxPixels: 8,
    getHeight: (d) => {
      const base = Math.max(6, Math.sqrt(d.volume ?? 1) * 1.25)
      if (d.flowCode >= 3) return base * 1.35
      return base
    },
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getWidth: 250,
      getSourceColor: 250,
      getTargetColor: 250,
    },
    onHover,
    onClick,
    updateTriggers: {
      getSourceColor: [highlightedEdgeId],
      getTargetColor: [highlightedEdgeId],
      getWidth: [highlightedEdgeId],
    },
  })
}
```

---

# 2) `createNodeLayer.ts`

```ts
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import type { NetworkNode, RiskLevel } from './createArcLayer'

interface CreateNodeLayerOptions {
  visible?: boolean
  pickable?: boolean
  showLabels?: boolean
  selectedNodeId?: string | null
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
}

const NODE_FILL: Record<NetworkNode['type'], [number, number, number, number]> = {
  origin: [53, 214, 255, 230],
  port: [47, 107, 255, 235],
  airport: [47, 107, 255, 235],
  warehouse: [246, 180, 69, 235],
  mosb: [255, 155, 55, 240],
  site: [46, 212, 122, 235],
}

const NODE_STROKE: Record<RiskLevel, [number, number, number, number]> = {
  ok: [255, 255, 255, 110],
  warn: [246, 180, 69, 180],
  critical: [255, 95, 109, 220],
}

function getNodeRadius(node: NetworkNode, selectedNodeId?: string | null): number {
  const base = Math.max(8, Math.sqrt(node.volume ?? 1) * 0.9 + 8)

  if (selectedNodeId && node.id === selectedNodeId) return base * 1.45
  if (node.active) return base * 1.25
  if (node.risk === 'critical') return base * 1.22
  return base
}

function getLabel(node: NetworkNode): string {
  if (node.siteCode) return node.siteCode
  if (node.type === 'mosb') return 'MOSB'
  return node.name
}

function getLabelSize(node: NetworkNode): number {
  if (node.siteCode) return 16
  if (node.type === 'port' || node.type === 'airport') return 13
  return 12
}

export function createNodeLayer(
  nodes: NetworkNode[],
  options: CreateNodeLayerOptions = {},
) {
  const {
    visible = true,
    pickable = true,
    showLabels = true,
    selectedNodeId = null,
    onHover,
    onClick,
  } = options

  const scatter = new ScatterplotLayer<NetworkNode>({
    id: 'network-nodes',
    data: nodes,
    visible,
    pickable,
    radiusUnits: 'pixels',
    radiusMinPixels: 8,
    radiusMaxPixels: 28,
    stroked: true,
    filled: true,
    getPosition: (d) => [d.lon, d.lat],
    getRadius: (d) => getNodeRadius(d, selectedNodeId),
    getFillColor: (d) => NODE_FILL[d.type],
    getLineColor: (d) => NODE_STROKE[d.risk ?? 'ok'],
    getLineWidth: (d) => {
      if (selectedNodeId && d.id === selectedNodeId) return 3
      if (d.risk === 'critical') return 2.5
      if (d.risk === 'warn') return 2
      return 1.2
    },
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getRadius: 220,
      getFillColor: 220,
      getLineColor: 220,
    },
    onHover,
    onClick,
    updateTriggers: {
      getRadius: [selectedNodeId],
      getLineWidth: [selectedNodeId],
    },
  })

  if (!showLabels) return [scatter]

  const labels = new TextLayer<NetworkNode>({
    id: 'network-node-labels',
    data: nodes.filter((d) => d.siteCode || d.type === 'port' || d.type === 'airport' || d.type === 'mosb'),
    visible,
    pickable: false,
    getPosition: (d) => [d.lon, d.lat],
    getText: (d) => getLabel(d),
    getSize: (d) => getLabelSize(d),
    sizeUnits: 'pixels',
    getColor: [244, 247, 255, 235],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'bottom',
    getPixelOffset: (_d) => [0, -16],
    fontWeight: 700,
    background: true,
    getBackgroundColor: [11, 19, 36, 165],
    getBorderColor: [255, 255, 255, 24],
    getBorderWidth: 1,
    backgroundPadding: [8, 4],
    parameters: {
      depthTest: false,
    },
  })

  return [scatter, labels]
}
```

---

# 3) `createStatusRingLayer.ts`

```ts
import { ScatterplotLayer } from '@deck.gl/layers'
import type { NetworkNode, RiskLevel } from './createArcLayer'

interface CreateStatusRingLayerOptions {
  visible?: boolean
  selectedNodeId?: string | null
  pulse?: boolean
}

const RING_COLOR: Record<RiskLevel, [number, number, number, number]> = {
  ok: [46, 212, 122, 165],
  warn: [246, 180, 69, 190],
  critical: [255, 95, 109, 220],
}

function ringBaseRadius(node: NetworkNode, selectedNodeId?: string | null): number {
  const base = Math.max(14, Math.sqrt(node.volume ?? 1) * 1.15 + 12)
  if (selectedNodeId && node.id === selectedNodeId) return base * 1.22
  return base
}

export function createStatusRingLayer(
  nodes: NetworkNode[],
  options: CreateStatusRingLayerOptions = {},
) {
  const {
    visible = true,
    selectedNodeId = null,
    pulse = true,
  } = options

  const filtered = nodes.filter((n) => n.risk && n.risk !== 'ok')

  const outerRing = new ScatterplotLayer<NetworkNode>({
    id: 'network-status-ring-outer',
    data: filtered,
    visible,
    pickable: false,
    stroked: true,
    filled: false,
    radiusUnits: 'pixels',
    radiusMinPixels: 16,
    radiusMaxPixels: 36,
    getPosition: (d) => [d.lon, d.lat],
    getRadius: (d) => ringBaseRadius(d, selectedNodeId) + (pulse ? 4 : 0),
    getLineWidth: (d) => (d.risk === 'critical' ? 3 : 2.5),
    getLineColor: (d) => {
      const base = RING_COLOR[d.risk ?? 'warn']
      return [base[0], base[1], base[2], pulse ? Math.max(70, base[3] - 60) : base[3]]
    },
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getRadius: 350,
      getLineColor: 350,
    },
    updateTriggers: {
      getRadius: [selectedNodeId, pulse],
      getLineColor: [pulse],
    },
  })

  const innerRing = new ScatterplotLayer<NetworkNode>({
    id: 'network-status-ring-inner',
    data: filtered,
    visible,
    pickable: false,
    stroked: true,
    filled: false,
    radiusUnits: 'pixels',
    radiusMinPixels: 12,
    radiusMaxPixels: 30,
    getPosition: (d) => [d.lon, d.lat],
    getRadius: (d) => ringBaseRadius(d, selectedNodeId),
    getLineWidth: (d) => (d.risk === 'critical' ? 3.5 : 2.75),
    getLineColor: (d) => RING_COLOR[d.risk ?? 'warn'],
    parameters: {
      depthTest: false,
      blend: true,
      blendFunc: [770, 771],
    },
    transitions: {
      getRadius: 250,
      getLineColor: 250,
    },
    updateTriggers: {
      getRadius: [selectedNodeId],
    },
  })

  return [outerRing, innerRing]
}
```

---

# 4) `OverviewMap.tsx`에서 연결 방법

아래처럼 연결하면 됩니다.

```tsx id="nnkzdo"
import { createArcLayer } from '@/components/map/layers/createArcLayer'
import { createNodeLayer } from '@/components/map/layers/createNodeLayer'
import { createStatusRingLayer } from '@/components/map/layers/createStatusRingLayer'

const layers = [
  createArcLayer(edges, nodes, {
    highlightedEdgeId,
    onHover: handleHover,
    onClick: handleArcClick,
  }),
  ...createNodeLayer(nodes, {
    selectedNodeId,
    showLabels: true,
    onHover: handleHover,
    onClick: handleNodeClick,
  }),
  ...createStatusRingLayer(nodes, {
    selectedNodeId,
    pulse: true,
  }),
]
```

---

# 5) 실전 적용 팁

## Arc

* `flowCode >= 3`은 MOSB route라 더 밝거나 더 높게
* `critical` edge는 빨강으로 override

## Node

* `siteCode`가 있으면 label은 `SHU / MIR / DAS / AGI`
* port/airport는 축소 label만

## Status Ring

* `ok`는 ring 생략
* `warn / critical`만 ring 표시
* AGI 같은 핵심 site는 `critical`이면 매우 잘 보입니다

---

# 6) 가장 중요한 한 줄

이 3개 파일이 하는 역할은 정확히 이겁니다.

* `createArcLayer.ts` → **관계망 선**
* `createNodeLayer.ts` → **지점 노드**
* `createStatusRingLayer.ts` → **위험 상태 시각화**

원하시면 다음으로 바로
**`TripsLayer + LabelLayer + Tooltip UI까지 포함한 OverviewMap 완성본`**으로 이어서 드리겠습니다.
