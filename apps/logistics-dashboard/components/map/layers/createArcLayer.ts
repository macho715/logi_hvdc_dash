import { ArcLayer, PathLayer } from "@deck.gl/layers"
import type { Layer, PickingInfo } from "@deck.gl/core"
import type { NetworkEdge, NetworkNode } from "@/lib/map/networkGraph"
import { getGeometryPosition } from "@/lib/map/renderPositions"

interface CreateArcLayerOptions {
  visible?: boolean
  pickable?: boolean
  mode?: "global" | "uae-ops"
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
  highlightedEdgeId?: string | null
}

const EDGE_COLOR = {
  portCustoms: [53, 214, 255, 165] as [number, number, number, number],
  customsSite: [120, 170, 255, 148] as [number, number, number, number],
  customsWh: [47, 107, 255, 110] as [number, number, number, number],
  customsMosb: [139, 108, 255, 190] as [number, number, number, number],
  whMosb: [246, 180, 69, 122] as [number, number, number, number],
  whSite: [120, 170, 255, 102] as [number, number, number, number],
  mosbSite: [46, 212, 122, 215] as [number, number, number, number],
  warn: [246, 180, 69, 140] as [number, number, number, number],
  critical: [255, 95, 109, 180] as [number, number, number, number],
} as const

const GLOBAL_ROUTE_WIDTH_MULTIPLIER: Record<NetworkEdge["routeType"], number> = {
  "port-customs": 1.12,
  "customs-site": 1,
  "customs-wh": 0.76,
  "customs-mosb": 1.22,
  "wh-mosb": 0.88,
  "wh-site": 0.72,
  "mosb-site": 1.48,
}

const GLOBAL_ROUTE_HEIGHT_MULTIPLIER: Record<NetworkEdge["routeType"], number> = {
  "port-customs": 1.08,
  "customs-site": 0.9,
  "customs-wh": 0.72,
  "customs-mosb": 0.94,
  "wh-mosb": 0.74,
  "wh-site": 0.68,
  "mosb-site": 1.06,
}

const GLOBAL_ARC_PROFILE = {
  alphaBoost: 1,
  widthScale: 1,
  heightScale: 1,
  minHeight: 10,
  widthMaxPixels: 10,
  numSegments: 48,
  greatCircle: true,
} as const

const UAE_OPS_ARC_PROFILE = {
  alphaBoost: 0.35,
  widthScale: 0.45,
  heightScale: 0.3,
  minHeight: 0,
  widthMaxPixels: 5,
  numSegments: 24,
  greatCircle: false,
} as const

const UAE_ROUTE_WIDTH: Record<NetworkEdge["routeType"], number> = {
  "port-customs": 3.4,
  "customs-site": 2.7,
  "customs-wh": 2.3,
  "customs-mosb": 2.8,
  "wh-mosb": 2.6,
  "wh-site": 2.2,
  "mosb-site": 3.6,
}

const UAE_ROUTE_HEIGHT: Record<NetworkEdge["routeType"], number> = {
  "port-customs": 1.2,
  "customs-site": 0.92,
  "customs-wh": 0.74,
  "customs-mosb": 0.86,
  "wh-mosb": 0.78,
  "wh-site": 0.7,
  "mosb-site": 1.04,
}

function getRouteTypeColor(routeType: NetworkEdge["routeType"]) {
  switch (routeType) {
    case "port-customs":
      return { source: EDGE_COLOR.portCustoms, target: EDGE_COLOR.portCustoms }
    case "customs-site":
      return { source: EDGE_COLOR.customsSite, target: EDGE_COLOR.customsSite }
    case "customs-wh":
      return { source: EDGE_COLOR.customsWh, target: EDGE_COLOR.customsWh }
    case "customs-mosb":
      return { source: EDGE_COLOR.customsMosb, target: EDGE_COLOR.customsMosb }
    case "wh-mosb":
      return { source: EDGE_COLOR.whMosb, target: EDGE_COLOR.whMosb }
    case "wh-site":
      return { source: EDGE_COLOR.whSite, target: EDGE_COLOR.whSite }
    case "mosb-site":
      return { source: EDGE_COLOR.mosbSite, target: EDGE_COLOR.mosbSite }
    default:
      return { source: EDGE_COLOR.customsSite, target: EDGE_COLOR.customsSite }
  }
}

function applyAlpha(
  color: [number, number, number, number],
  multiplier: number,
): [number, number, number, number] {
  return [color[0], color[1], color[2], Math.min(255, Math.round(color[3] * multiplier))]
}

function getArcProfile(mode: "global" | "uae-ops") {
  return mode === "uae-ops" ? UAE_OPS_ARC_PROFILE : GLOBAL_ARC_PROFILE
}

function emphasisMultiplier(
  edge: NetworkEdge,
  mode: "global" | "uae-ops",
  highlightedEdgeId?: string | null,
) {
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return mode === "uae-ops" ? 2 : 1.85
  if (edge.highlighted) return mode === "uae-ops" ? 1.72 : 1.6
  if (edge.active) return mode === "uae-ops" ? 1.42 : 1.28
  if (edge.risk === "critical") return 1.35
  if (edge.risk === "warn") return 1.15
  return mode === "uae-ops" ? 0.96 : 1
}

function edgeColors(
  edge: NetworkEdge,
  mode: "global" | "uae-ops",
  highlightedEdgeId?: string | null,
) {
  const modeProfile = getArcProfile(mode)
  const boost = emphasisMultiplier(edge, mode, highlightedEdgeId) * modeProfile.alphaBoost
  if (mode !== "uae-ops" && edge.risk === "critical") {
    return {
      source: applyAlpha(EDGE_COLOR.critical, boost),
      target: applyAlpha(EDGE_COLOR.critical, boost),
    }
  }
  if (mode !== "uae-ops" && edge.risk === "warn") {
    return {
      source: applyAlpha(EDGE_COLOR.warn, boost),
      target: applyAlpha(EDGE_COLOR.warn, boost),
    }
  }
  const flow = getRouteTypeColor(edge.routeType)
  return {
    source: applyAlpha(flow.source, boost),
    target: applyAlpha(flow.target, boost),
  }
}

function edgeWidth(
  edge: NetworkEdge,
  mode: "global" | "uae-ops",
  highlightedEdgeId?: string | null,
): number {
  if (mode === "uae-ops") {
    return getUaeOpsEdgeWidth(edge, highlightedEdgeId)
  }

  return getGlobalEdgeWidth(edge, highlightedEdgeId)
}

function getGlobalEdgeWidth(
  edge: NetworkEdge,
  highlightedEdgeId?: string | null,
): number {
  const base =
    Math.max(1.2, Math.log2(edge.volume + 1)) *
    GLOBAL_ROUTE_WIDTH_MULTIPLIER[edge.routeType] *
    GLOBAL_ARC_PROFILE.widthScale
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return base * 2.6
  if (edge.highlighted) return base * 2.2
  if (edge.active) return base * 1.8
  if (edge.risk === "critical") return base * 1.6
  if (edge.risk === "warn") return base * 1.35
  return base
}

function getUaeOpsEdgeWidth(
  edge: NetworkEdge,
  highlightedEdgeId?: string | null,
): number {
  const base = UAE_ROUTE_WIDTH[edge.routeType] * UAE_OPS_ARC_PROFILE.widthScale
  if (highlightedEdgeId && edge.id === highlightedEdgeId) return base * 1.6
  if (edge.highlighted) return base * 1.42
  if (edge.active) return base * 1.2
  return base
}

function edgeHeight(
  edge: NetworkEdge,
  mode: "global" | "uae-ops",
  highlightedEdgeId?: string | null,
): number {
  if (mode === "uae-ops") {
    return getUaeOpsEdgeHeight(edge, highlightedEdgeId)
  }

  return getGlobalEdgeHeight(edge, highlightedEdgeId)
}

function getGlobalEdgeHeight(
  edge: NetworkEdge,
  highlightedEdgeId?: string | null,
): number {
  const base = Math.max(GLOBAL_ARC_PROFILE.minHeight, Math.sqrt(edge.volume + 1) * 1.2)
  const emphasized =
    highlightedEdgeId && edge.id === highlightedEdgeId
      ? 1.28
      : edge.highlighted
        ? 1.18
        : edge.active
          ? 1.12
          : 1
  return base * GLOBAL_ROUTE_HEIGHT_MULTIPLIER[edge.routeType] * GLOBAL_ARC_PROFILE.heightScale * emphasized
}

function getUaeOpsEdgeHeight(
  edge: NetworkEdge,
  highlightedEdgeId?: string | null,
): number {
  const base = Math.max(UAE_OPS_ARC_PROFILE.minHeight, Math.sqrt(edge.volume + 1) * 0.42)
  const emphasized =
    highlightedEdgeId && edge.id === highlightedEdgeId
      ? 1.18
      : edge.highlighted
        ? 1.12
        : edge.active
          ? 1.08
          : 1
  return base * UAE_ROUTE_HEIGHT[edge.routeType]
    * UAE_OPS_ARC_PROFILE.heightScale
    * emphasized
}

export function createArcLayer(
  edges: NetworkEdge[],
  nodes: NetworkNode[],
  options: CreateArcLayerOptions = {},
): Layer | null {
  const {
    visible = true,
    pickable = true,
    mode = "uae-ops",
    onHover,
    onClick,
    highlightedEdgeId = null,
  } = options

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const validEdges = edges.filter((edge) => nodeMap.has(edge.sourceId) && nodeMap.has(edge.targetId))
  if (!visible || validEdges.length === 0) return null
  if (mode === "uae-ops") {
    return new PathLayer<NetworkEdge>({
      id: "network-arcs",
      data: validEdges,
      visible,
      pickable,
      capRounded: true,
      jointRounded: true,
      billboard: false,
      getPath: (edge) => {
        const source = nodeMap.get(edge.sourceId)!
        const target = nodeMap.get(edge.targetId)!
        return [getGeometryPosition(source), getGeometryPosition(target)]
      },
      getColor: (edge) => edgeColors(edge, mode, highlightedEdgeId).source,
      getWidth: (edge) => edgeWidth(edge, mode, highlightedEdgeId),
      widthUnits: "pixels",
      widthMinPixels: 1,
      widthMaxPixels: UAE_OPS_ARC_PROFILE.widthMaxPixels,
      transitions: {
        getWidth: 220,
        getColor: 220,
      },
      updateTriggers: {
        getPath: [mode],
        getColor: [highlightedEdgeId, mode],
        getWidth: [highlightedEdgeId, mode],
      },
      onHover,
      onClick,
    })
  }

  const profile = getArcProfile(mode)

  return new ArcLayer<NetworkEdge>({
    id: "network-arcs",
    data: validEdges,
    visible,
    pickable,
    greatCircle: profile.greatCircle,
    numSegments: profile.numSegments,
    getSourcePosition: (edge) => {
      const node = nodeMap.get(edge.sourceId)!
      return getGeometryPosition(node)
    },
    getTargetPosition: (edge) => {
      const node = nodeMap.get(edge.targetId)!
      return getGeometryPosition(node)
    },
    getSourceColor: (edge) => edgeColors(edge, mode, highlightedEdgeId).source,
    getTargetColor: (edge) => edgeColors(edge, mode, highlightedEdgeId).target,
    getWidth: (edge) => edgeWidth(edge, mode, highlightedEdgeId),
    widthUnits: "pixels",
    widthMinPixels: 1,
    widthMaxPixels: profile.widthMaxPixels,
    getHeight: (edge) => edgeHeight(edge, mode, highlightedEdgeId),
    transitions: {
      getWidth: 220,
      getHeight: 220,
      getSourceColor: 220,
      getTargetColor: 220,
    },
    updateTriggers: {
      getSourceColor: [highlightedEdgeId, mode],
      getTargetColor: [highlightedEdgeId, mode],
      getWidth: [highlightedEdgeId, mode],
      getHeight: [highlightedEdgeId, mode],
    },
    onHover,
    onClick,
  })
}
