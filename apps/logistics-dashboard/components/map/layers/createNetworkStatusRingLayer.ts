import { ScatterplotLayer } from "@deck.gl/layers"
import type { NetworkNode } from "@/lib/map/networkGraph"
import { getRenderPosition, type RenderTrack } from "@/lib/map/renderPositions"

interface CreateNetworkStatusRingLayerOptions {
  visible?: boolean
  selectedNodeId?: string | null
  pulse?: boolean
  emphasisTypes?: NetworkNode["type"][]
  mode?: RenderTrack
}

const RING_COLOR: Record<NetworkNode["risk"], [number, number, number, number]> = {
  ok: [46, 212, 122, 120],
  warn: [246, 180, 69, 185],
  critical: [255, 95, 109, 220],
}

const EMPHASIS_RING_COLOR: Partial<Record<NetworkNode["type"], [number, number, number, number]>> = {
  customs: [53, 214, 255, 178],
  mosb: [255, 155, 55, 168],
}

function ringRadius(
  node: NetworkNode,
  selectedNodeId?: string | null,
  emphasisTypes: NetworkNode["type"][] = [],
): number {
  const base = Math.max(14, Math.sqrt(Math.max(node.volume, 1)) * 1.15 + 12)
  const emphasized = emphasisTypes.includes(node.type)
  const boosted = emphasized ? base * 1.08 : base
  if (selectedNodeId && node.id === selectedNodeId) return boosted * 1.2
  if (node.highlighted) return boosted * 1.12
  return boosted
}

function outerRingColor(
  node: NetworkNode,
  pulse: boolean,
  emphasisTypes: NetworkNode["type"][] = [],
): [number, number, number, number] {
  if (node.risk !== "ok") {
    const base = RING_COLOR[node.risk]
    return [base[0], base[1], base[2], pulse ? Math.max(72, base[3] - 60) : base[3]]
  }
  if (emphasisTypes.includes(node.type)) {
    const base = EMPHASIS_RING_COLOR[node.type] ?? RING_COLOR.ok
    return [base[0], base[1], base[2], pulse ? Math.max(86, base[3] - 32) : base[3]]
  }
  const base = RING_COLOR.ok
  return [base[0], base[1], base[2], pulse ? Math.max(72, base[3] - 60) : base[3]]
}

function innerRingColor(
  node: NetworkNode,
  emphasisTypes: NetworkNode["type"][] = [],
): [number, number, number, number] {
  if (node.risk !== "ok") return RING_COLOR[node.risk]
  return EMPHASIS_RING_COLOR[node.type] ?? RING_COLOR.ok
}

export function createNetworkStatusRingLayer(
  nodes: NetworkNode[],
  options: CreateNetworkStatusRingLayerOptions = {},
) {
  const {
    visible = true,
    selectedNodeId = null,
    pulse = true,
    emphasisTypes = [],
    mode = "global",
  } = options
  const emphasisKey = emphasisTypes.join(",")
  const highlighted = nodes.filter(
    (node) => node.risk !== "ok" || node.highlighted || emphasisTypes.includes(node.type),
  )

  const outerRing = new ScatterplotLayer<NetworkNode>({
    id: "network-status-ring-outer",
    data: highlighted,
    visible,
    pickable: false,
    stroked: true,
    filled: false,
    radiusUnits: "pixels",
    radiusMinPixels: 16,
    radiusMaxPixels: 42,
    getPosition: (node) => getRenderPosition(node, mode),
    getRadius: (node) => ringRadius(node, selectedNodeId, emphasisTypes) + (pulse ? 3 : 0),
    getLineWidth: (node) => {
      if (emphasisTypes.includes(node.type) && node.risk === "ok") return 2.8
      return node.risk === "critical" ? 3.2 : 2.6
    },
    getLineColor: (node) => outerRingColor(node, pulse, emphasisTypes),
    transitions: {
      getRadius: 320,
      getLineColor: 320,
    },
    updateTriggers: {
      getRadius: [selectedNodeId, pulse, emphasisKey],
      getLineColor: [pulse, emphasisKey],
      getLineWidth: [emphasisKey],
    },
  })

  const innerRing = new ScatterplotLayer<NetworkNode>({
    id: "network-status-ring-inner",
    data: highlighted,
    visible,
    pickable: false,
    stroked: true,
    filled: false,
    radiusUnits: "pixels",
    radiusMinPixels: 14,
    radiusMaxPixels: 38,
    getPosition: (node) => getRenderPosition(node, mode),
    getRadius: (node) => ringRadius(node, selectedNodeId, emphasisTypes),
    getLineWidth: (node) => {
      if (node.highlighted) return 3
      if (emphasisTypes.includes(node.type) && node.risk === "ok") return 2.5
      return 2.2
    },
    getLineColor: (node) => innerRingColor(node, emphasisTypes),
    transitions: {
      getRadius: 240,
      getLineColor: 240,
    },
    updateTriggers: {
      getRadius: [selectedNodeId, emphasisKey],
      getLineColor: [emphasisKey],
      getLineWidth: [emphasisKey],
    },
  })

  return [outerRing, innerRing]
}
