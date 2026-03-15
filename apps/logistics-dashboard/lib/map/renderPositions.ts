export type RenderTrack = "global" | "uae-ops"

type PositionedNode = {
  id: string
  lon: number
  lat: number
  type?: string
  siteCode?: string
  highlighted?: boolean
  active?: boolean
}

const SSOT_NODE_POSITIONS: Record<string, [number, number]> = {
  "khalifa-port-kpct": [54.64842, 24.8095],
  "zayed-port": [54.37798, 24.52489],
  "jebel-ali-port": [55.0614, 25.0136],
  "auh-airport": [54.6492, 24.441],
  "dsv-inland-warehouse-m44": [54.58183, 24.3447],
  "mosb-yard": [54.46685, 24.32479],
  "shuweihat-complex": [52.57292, 24.16017],
  "mirfa-iwpp": [53.44436, 24.11885],
  "agi-jetty": [53.658619, 24.841096],
  "das-island": [52.875, 25.1477],
}

const CUSTOMS_PORT_ATTACHMENTS: Record<string, string> = {
  "khalifa-customs": "khalifa-port-kpct",
  "zayed-customs": "zayed-port",
  "auh-customs": "auh-airport",
  "jebel-ali-customs": "jebel-ali-port",
}

const CUSTOMS_RENDER_OFFSET: Record<string, { lng: number; lat: number }> = {
  "khalifa-customs": { lng: 0.015, lat: -0.01 },
  "zayed-customs": { lng: 0.012, lat: -0.006 },
  "auh-customs": { lng: 0.01, lat: -0.008 },
  "jebel-ali-customs": { lng: 0.012, lat: -0.006 },
}

const UAE_OPS_LABEL_OFFSETS: Record<string, [number, number]> = {
  "khalifa-customs": [18, -2],
  "zayed-customs": [0, -18],
  "auh-customs": [18, -2],
  "jebel-ali-customs": [12, -10],
  "dsv-inland-warehouse-m44": [18, -10],
  "mosb-yard": [18, -10],
  "das-island": [-18, -8],
  "agi-jetty": [-18, 10],
}

function ssotBasePosition(nodeId: string, fallback: [number, number]): [number, number] {
  const attachedPortId = CUSTOMS_PORT_ATTACHMENTS[nodeId]
  if (attachedPortId) {
    return SSOT_NODE_POSITIONS[attachedPortId] ?? fallback
  }
  return SSOT_NODE_POSITIONS[nodeId] ?? fallback
}

export function getGeometryPosition(node: PositionedNode): [number, number] {
  return ssotBasePosition(node.id, [node.lon, node.lat])
}

export function getRenderPosition(node: PositionedNode, track: RenderTrack): [number, number] {
  const base = getGeometryPosition(node)
  if (track !== "uae-ops" || node.type !== "customs") return base

  const offset = CUSTOMS_RENDER_OFFSET[node.id]
  if (!offset) return base
  return [base[0] + offset.lng, base[1] + offset.lat]
}

export function getNodeLabelOffset(node: PositionedNode, track: RenderTrack): [number, number] {
  if (track !== "uae-ops") return [0, -16]
  if (UAE_OPS_LABEL_OFFSETS[node.id]) return UAE_OPS_LABEL_OFFSETS[node.id]
  if (node.type === "site") return [0, -18]
  return [0, -16]
}

export function shouldRenderNodeLabel(node: PositionedNode, track: RenderTrack): boolean {
  if (track !== "uae-ops") {
    return Boolean(
      node.siteCode ||
      node.type === "port" ||
      node.type === "airport" ||
      node.type === "customs" ||
      node.type === "warehouse" ||
      node.type === "mosb",
    )
  }

  if (node.type === "site") {
    if (node.highlighted || node.active) return true
    return node.siteCode === "DAS" || node.siteCode === "AGI"
  }

  return node.type === "port" ||
    node.type === "airport" ||
    node.type === "customs" ||
    node.type === "warehouse" ||
    node.type === "mosb"
}
