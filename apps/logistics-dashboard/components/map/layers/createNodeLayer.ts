import { ScatterplotLayer, TextLayer } from "@deck.gl/layers"
import type { PickingInfo } from "@deck.gl/core"
import type { NetworkNode } from "@/lib/map/networkGraph"
import { getNodeLabelOffset, getRenderPosition, shouldRenderNodeLabel } from "@/lib/map/renderPositions"
import { getWarehouseLabel } from "@/lib/map/uaeOpsCopy"

interface CreateNodeLayerOptions {
  visible?: boolean
  pickable?: boolean
  showLabels?: boolean
  mode?: "global" | "uae-ops"
  selectedNodeId?: string | null
  onHover?: (info: PickingInfo) => void
  onClick?: (info: PickingInfo) => void
}

const NODE_FILL: Record<NetworkNode["type"], [number, number, number, number]> = {
  origin: [53, 214, 255, 220],
  port: [47, 107, 255, 230],
  airport: [94, 140, 255, 220],
  customs: [53, 214, 255, 230],
  warehouse: [246, 180, 69, 230],
  mosb: [255, 155, 55, 235],
  site: [46, 212, 122, 230],
}

const NODE_STROKE: Record<NetworkNode["risk"], [number, number, number, number]> = {
  ok: [255, 255, 255, 110],
  warn: [246, 180, 69, 185],
  critical: [255, 95, 109, 220],
}

const UAE_NODE_ALPHA: Partial<Record<NetworkNode["type"], number>> = {
  port: 220,
  airport: 214,
  customs: 246,
  warehouse: 168,
  mosb: 244,
  site: 236,
}

const UAE_LABEL_COLOR: Partial<Record<NetworkNode["type"], [number, number, number, number]>> = {
  customs: [220, 250, 255, 245],
  mosb: [255, 226, 181, 240],
  warehouse: [255, 232, 194, 214],
  site: [231, 255, 239, 238],
}

function nodeRadius(
  node: NetworkNode,
  selectedNodeId?: string | null,
  mode: "global" | "uae-ops" = "global",
): number {
  let base = Math.max(7, Math.sqrt(Math.max(node.volume, 1)) * 0.9 + 7)
  if (mode === "uae-ops") {
    if (node.type === "customs") base *= 1.16
    if (node.type === "mosb") base *= 1.1
    if (node.type === "warehouse") base *= 0.9
  }
  if (selectedNodeId && node.id === selectedNodeId) return base * 1.45
  if (node.highlighted) return base * 1.3
  if (node.active) return base * 1.2
  return base
}

function nodeFillColor(
  node: NetworkNode,
  mode: "global" | "uae-ops" = "global",
): [number, number, number, number] {
  if (mode !== "uae-ops") return NODE_FILL[node.type]
  const base = NODE_FILL[node.type]
  const alpha = UAE_NODE_ALPHA[node.type] ?? base[3]
  return [base[0], base[1], base[2], alpha]
}

function nodeLabel(node: NetworkNode): string {
  if (node.siteCode) return node.siteCode
  if (node.type === "customs") return node.name
  if (node.type === "mosb") return "MOSB"
  if (node.type === "warehouse") return getWarehouseLabel(node.name)
  if (node.type === "airport") return "AUH"
  if (node.type === "port" && node.name.toUpperCase().includes("KHALIFA")) return "KPP"
  if (node.type === "port" && node.name.toUpperCase().includes("ZAYED")) return "MZP"
  if (node.type === "port" && node.name.toUpperCase().includes("JEBEL")) return "JAFZ"
  return node.name
}

function labelSize(node: NetworkNode, mode: "global" | "uae-ops" = "global"): number {
  if (node.type === "customs") return mode === "uae-ops" ? 12.5 : 11
  if (node.type === "mosb") return mode === "uae-ops" ? 12 : 11
  if (node.type === "warehouse") return mode === "uae-ops" ? 10.5 : 11
  if (node.siteCode) return 15
  if (node.type === "port" || node.type === "airport") return 12
  return 11
}

function labelColor(
  node: NetworkNode,
  mode: "global" | "uae-ops" = "global",
): [number, number, number, number] {
  if (mode !== "uae-ops") return [244, 247, 255, 235]
  return UAE_LABEL_COLOR[node.type] ?? [244, 247, 255, 235]
}

export function createNodeLayer(
  nodes: NetworkNode[],
  options: CreateNodeLayerOptions = {},
) {
  const {
    visible = true,
    pickable = true,
    showLabels = true,
    mode = "global",
    selectedNodeId = null,
    onHover,
    onClick,
  } = options

  const scatter = new ScatterplotLayer<NetworkNode>({
    id: "network-nodes",
    data: nodes,
    visible,
    pickable,
    radiusUnits: "pixels",
    radiusMinPixels: 8,
    radiusMaxPixels: 28,
    stroked: true,
    filled: true,
    getPosition: (node) => getRenderPosition(node, mode),
    getRadius: (node) => nodeRadius(node, selectedNodeId, mode),
    getFillColor: (node) => nodeFillColor(node, mode),
    getLineColor: (node) => NODE_STROKE[node.risk],
    getLineWidth: (node) => {
      const typeBoost = mode === "uae-ops"
        ? node.type === "customs"
          ? 0.6
          : node.type === "mosb"
            ? 0.35
            : node.type === "warehouse"
              ? -0.15
              : 0
        : 0
      if (selectedNodeId && node.id === selectedNodeId) return 3 + typeBoost
      if (node.highlighted) return 2.6 + typeBoost
      if (node.risk === "critical") return 2.4
      if (node.risk === "warn") return 2
      return Math.max(1, 1.2 + typeBoost)
    },
    transitions: {
      getRadius: 220,
      getLineColor: 220,
      getFillColor: 220,
    },
    updateTriggers: {
      getRadius: [selectedNodeId, mode],
      getFillColor: [mode],
      getLineWidth: [selectedNodeId, mode],
    },
    onHover,
    onClick,
  })

  if (!showLabels) return [scatter]

  const labels = new TextLayer<NetworkNode>({
    id: "network-node-labels",
    data: nodes.filter((node) => shouldRenderNodeLabel(node, mode)),
    visible,
    pickable: false,
    getPosition: (node) => getRenderPosition(node, mode),
    getText: (node) => nodeLabel(node),
    getSize: (node) => labelSize(node, mode),
    sizeUnits: "pixels",
    getColor: (node) => labelColor(node, mode),
    getTextAnchor: "middle",
    getAlignmentBaseline: "bottom",
    getPixelOffset: (node) => getNodeLabelOffset(node, mode),
    background: true,
    getBackgroundColor: (node) =>
      mode === "uae-ops" && node.type === "customs"
        ? [10, 27, 41, 188]
        : mode === "uae-ops" && node.type === "mosb"
          ? [33, 23, 10, 182]
          : [11, 19, 36, 170],
    getBorderColor: [255, 255, 255, 28],
    getBorderWidth: 1,
    backgroundPadding: [8, 4],
    fontWeight: 700,
    updateTriggers: {
      getSize: [mode],
      getColor: [mode],
      getBackgroundColor: [mode],
      getPixelOffset: [mode],
    },
  })

  return [scatter, labels]
}
