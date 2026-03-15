import type { PipelineStage } from "@/lib/cases/pipelineStage"
import { isIslandSite, normalizePortName } from "@/lib/logistics/normalizers"
import { resolvePodCoords, resolvePolCoords } from "@/lib/map/portCoordinates"
import type { PoiLocation } from "@/lib/map/poiTypes"
import { getGeometryPosition } from "@/lib/map/renderPositions"
import type { Location, LocationStatus } from "@/types/logistics"
import type { OverviewMapSiteCode, OverviewMapVoyage } from "@/types/overview"

export type NodeType = "origin" | "port" | "airport" | "customs" | "warehouse" | "mosb" | "site"
export type RiskLevel = "ok" | "warn" | "critical"
export type SiteFilter = OverviewMapSiteCode | null | undefined
export type RouteType =
  | "port-customs"
  | "customs-site"
  | "customs-wh"
  | "customs-mosb"
  | "wh-mosb"
  | "wh-site"
  | "mosb-site"

type SiteCode = OverviewMapSiteCode
type OverviewVoyageStage =
  | "pre_arrival"
  | "in_transit"
  | "arrived_port"
  | "customs_in_progress"
  | "customs_cleared"
  | "at_site"
  | "delivered"

export interface NetworkNode {
  id: string
  name: string
  type: NodeType
  lon: number
  lat: number
  volume: number
  risk: RiskLevel
  siteCode?: SiteCode
  active?: boolean
  highlighted?: boolean
  status?: LocationStatus
}

export interface NetworkEdge {
  id: string
  sourceId: string
  targetId: string
  routeType: RouteType
  volume: number
  risk: RiskLevel
  active?: boolean
  highlighted?: boolean
}

export interface NetworkTrip {
  id: string
  shipmentId: string
  vendor: string | null
  path: [number, number][]
  timestamps: number[]
  etaUnix: number
  routeLabel: string
  stageLabel: string
  nextMilestone?: string
  kind: "global" | "direct-site" | "via-warehouse" | "via-mosb" | "via-warehouse-mosb"
}

export interface MapFooterSummary {
  origin: number
  inTransit: number
  customsHold: number
  warehouseStaging: number
  mosbPending: number
  siteReady: number
  delivered: number
}

export interface OverviewOriginSummary {
  country: string
  count: number
}

export interface CustomsAnchor {
  id: string
  name: string
  portIds: string[]
  locationHints: string[]
}

interface BuildOverviewNetworkGraphInput {
  pois: ReadonlyArray<PoiLocation>
  voyages: OverviewMapVoyage[]
  locations: Location[]
  statusByLocationId: Record<string, LocationStatus>
  activePipelineStage?: PipelineStage | null
  siteFilter?: SiteFilter
}

interface BuildOverviewTripsInput {
  voyages: OverviewMapVoyage[]
  nodes: NetworkNode[]
  track: "global" | "uae-ops"
  siteFilter?: SiteFilter
}

const NETWORK_POI_IDS = new Set([
  "agi-jetty",
  "das-island",
  "mirfa-iwpp",
  "shuweihat-complex",
  "dsv-inland-warehouse-m44",
  "mosb-yard",
  "zayed-port",
  "khalifa-port-kpct",
  "jebel-ali-port",
  "auh-airport",
])

const POI_LOCATION_HINTS: Record<string, string[]> = {
  "agi-jetty": ["ghallan", "agi"],
  "das-island": ["das island", "das"],
  "mirfa-iwpp": ["mirfa", "mir"],
  "shuweihat-complex": ["shuweihat", "shu"],
  "dsv-inland-warehouse-m44": ["dsv inland", "dsv wh", "m44"],
  "mosb-yard": ["mosb yard", "mosb"],
  "zayed-port": ["mina zayed", "zayed", "mzp"],
  "khalifa-port-kpct": ["khalifa", "kpct", "kpp"],
  "jebel-ali-port": ["jebel ali", "jafz"],
  "auh-airport": ["auh", "airport"],
}

export const CUSTOMS_ANCHORS: ReadonlyArray<CustomsAnchor> = [
  {
    id: "khalifa-customs",
    name: "Khalifa Customs",
    portIds: ["khalifa-port-kpct"],
    locationHints: ["khalifa customs", "kpct customs", "abu dhabi customs", "clearance"],
  },
  {
    id: "zayed-customs",
    name: "MZ Customs",
    portIds: ["zayed-port"],
    locationHints: ["mina zayed customs", "zayed customs", "mzd customs", "abu dhabi customs"],
  },
  {
    id: "auh-customs",
    name: "AUH Customs",
    portIds: ["auh-airport"],
    locationHints: ["auh customs", "airport customs", "abu dhabi customs"],
  },
  {
    id: "jebel-ali-customs",
    name: "JAFZ Customs",
    portIds: ["jebel-ali-port"],
    locationHints: ["jebel ali customs", "jafza customs", "dubai customs"],
  },
] as const

const SITE_POI_BY_CODE: Record<SiteCode, string> = {
  SHU: "shuweihat-complex",
  MIR: "mirfa-iwpp",
  DAS: "das-island",
  AGI: "agi-jetty",
}

const WAREHOUSE_POI_ID = "dsv-inland-warehouse-m44"
const MOSB_POI_ID = "mosb-yard"

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
}

function toRiskLevel(status?: LocationStatus): RiskLevel {
  if (status?.status_code === "CRITICAL") return "critical"
  if (status?.status_code === "WARNING") return "warn"
  return "ok"
}

function maxRisk(...risks: Array<RiskLevel | undefined>): RiskLevel {
  if (risks.includes("critical")) return "critical"
  if (risks.includes("warn")) return "warn"
  return "ok"
}

function toNodeType(poi: PoiLocation): NodeType | null {
  if (poi.category === "HVDC_SITE") return "site"
  if (poi.category === "PORT") return "port"
  if (poi.category === "AIRPORT") return "airport"
  if (poi.category === "WAREHOUSE") return "warehouse"
  if (poi.category === "YARD") return "mosb"
  return null
}

function inferSiteCode(poi: PoiLocation): SiteCode | undefined {
  const code = poi.code.toUpperCase()
  if (code.includes("SHU")) return "SHU"
  if (code.includes("MIR")) return "MIR"
  if (code.includes("DAS")) return "DAS"
  if (code.includes("AGI")) return "AGI"
  return undefined
}

function stageMatchesNode(stage: PipelineStage | null | undefined, type: NodeType): boolean {
  if (!stage) return false
  if (stage === "pre-arrival") return type === "origin"
  if (stage === "port") return type === "port" || type === "airport" || type === "customs"
  if (stage === "warehouse") return type === "warehouse"
  if (stage === "mosb") return type === "mosb"
  return type === "site"
}

function edgeMatchesStage(stage: PipelineStage | null | undefined, routeType: RouteType): boolean {
  if (!stage) return false
  if (stage === "port") return routeType === "port-customs"
  if (stage === "warehouse") return routeType === "customs-wh" || routeType === "wh-site" || routeType === "wh-mosb"
  if (stage === "mosb") return routeType === "customs-mosb" || routeType === "wh-mosb" || routeType === "mosb-site"
  if (stage === "site") return routeType === "customs-site" || routeType === "wh-site" || routeType === "mosb-site"
  return false
}

function findLocationStatusByHints(
  hints: readonly string[],
  locations: Location[],
  statusByLocationId: Record<string, LocationStatus>,
): LocationStatus | undefined {
  const normalizedHints = hints.map(normalize)
  const match = locations.find((location) => {
    const haystack = `${location.location_id} ${location.name}`
    const normalizedLocation = normalize(haystack)
    return normalizedHints.some((hint) => normalizedLocation.includes(hint))
  })

  return match ? statusByLocationId[match.location_id] : undefined
}

function findLocationStatusForPoi(
  poi: PoiLocation,
  locations: Location[],
  statusByLocationId: Record<string, LocationStatus>,
): LocationStatus | undefined {
  const hints = POI_LOCATION_HINTS[poi.id] ?? [poi.name, poi.code]
  return findLocationStatusByHints(hints, locations, statusByLocationId)
}

function resolvePodNodeId(pod: string | null): string | null {
  const normalized = normalizePortName(pod)
  if (normalized === "Khalifa Port") return "khalifa-port-kpct"
  if (normalized === "Mina Zayed") return "zayed-port"
  if (normalized === "Jebel Ali") return "jebel-ali-port"
  if (normalized === "AUH Airport") return "auh-airport"
  return null
}

function resolveCustomsNodeId(portId: string | null): string | null {
  const anchor = CUSTOMS_ANCHORS.find((candidate) => portId != null && candidate.portIds.includes(portId))
  return anchor?.id ?? null
}

function siteCodesForVoyage(voyage: OverviewMapVoyage, siteFilter?: SiteFilter): SiteCode[] {
  const baseSites = voyage.actualSite ? [voyage.actualSite] : [...voyage.plannedSites]
  const deduped = [...new Set(baseSites)]
  if (!siteFilter) return deduped
  return deduped.filter((site) => site === siteFilter)
}

function voyageMatchesSiteFilter(voyage: OverviewMapVoyage, siteFilter?: SiteFilter): boolean {
  if (!siteFilter) return true
  return siteCodesForVoyage(voyage, siteFilter).length > 0
}

function deriveVoyageStage(voyage: OverviewMapVoyage): OverviewVoyageStage {
  if (voyage.deliveryDate) return "delivered"
  if (voyage.actualSite) return "at_site"
  if (voyage.customsClose) return "customs_cleared"
  if (voyage.customsStart) return "customs_in_progress"
  if (voyage.ata) return "arrived_port"
  if (voyage.atd || voyage.eta) return "in_transit"
  return "pre_arrival"
}

function stageLabel(stage: OverviewVoyageStage): string {
  switch (stage) {
    case "pre_arrival":
      return "Pre-arrival"
    case "in_transit":
      return "In transit"
    case "arrived_port":
      return "Arrived at port"
    case "customs_in_progress":
      return "Customs in progress"
    case "customs_cleared":
      return "Customs cleared"
    case "at_site":
      return "At site"
    default:
      return "Delivered"
  }
}

function nextMilestone(
  stage: OverviewVoyageStage,
  site: SiteCode | null,
  warehouseHint: boolean,
): string | undefined {
  if (stage === "delivered") return undefined
  if (stage === "at_site") return "Final delivery"
  if (stage === "customs_cleared") {
    if (site && isIslandSite(site)) return warehouseHint ? "Warehouse staging" : "MOSB staging"
    return warehouseHint ? "Warehouse staging" : "Site delivery"
  }
  if (stage === "customs_in_progress") return "Customs cleared"
  if (stage === "arrived_port") return "Customs clearance"
  if (stage === "in_transit") return "Port arrival"
  return "Departure"
}

function routeLabelForSite(site: SiteCode | null, warehouseHint: boolean): string {
  if (!site) return "Customs"
  if (isIslandSite(site)) {
    return warehouseHint
      ? `Customs -> Warehouse -> MOSB -> ${site}`
      : `Customs -> MOSB -> ${site}`
  }
  return warehouseHint
    ? `Customs -> Warehouse -> ${site}`
    : `Customs -> ${site}`
}

function hasWarehouseEvidence(_voyage: OverviewMapVoyage): boolean {
  // [ASSUMPTION] current overview-safe shipment payload has no trustworthy warehouse milestone.
  return false
}

function toUnix(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = new Date(value).getTime()
  if (!Number.isFinite(ms)) return null
  return Math.floor(ms / 1000)
}

function buildTimestamps(stopCount: number, voyage: OverviewMapVoyage): number[] {
  const end =
    toUnix(voyage.eta) ??
    toUnix(voyage.ata) ??
    toUnix(voyage.deliveryDate) ??
    Math.floor(Date.now() / 1000) + 2 * 24 * 3600
  const rawStart =
    toUnix(voyage.atd) ??
    toUnix(voyage.etd) ??
    toUnix(voyage.customsStart) ??
    end - 7 * 24 * 3600
  const start = rawStart < end ? rawStart : end - 24 * 3600
  if (stopCount <= 1) return [start]
  const step = (end - start) / (stopCount - 1)
  return Array.from({ length: stopCount }, (_, index) => Math.floor(start + step * index))
}

function formatTripKind(site: SiteCode | null, warehouseHint: boolean): NetworkTrip["kind"] {
  if (!site) return "global"
  if (isIslandSite(site)) return warehouseHint ? "via-warehouse-mosb" : "via-mosb"
  return warehouseHint ? "via-warehouse" : "direct-site"
}

function buildPoiNodes({
  pois,
  locations,
  statusByLocationId,
  activePipelineStage,
  siteFilter,
}: BuildOverviewNetworkGraphInput): NetworkNode[] {
  return pois
    .filter((poi) => NETWORK_POI_IDS.has(poi.id))
    .reduce<NetworkNode[]>((nodes, poi) => {
      const type = toNodeType(poi)
      if (!type) return nodes

      const status = findLocationStatusForPoi(poi, locations, statusByLocationId)
      const siteCode = inferSiteCode(poi)
      nodes.push({
        id: poi.id,
        name: poi.displayLabel ?? poi.name,
        type,
        lon: poi.longitude + (poi.displayJitter?.[0] ?? 0),
        lat: poi.latitude + (poi.displayJitter?.[1] ?? 0),
        volume: 0,
        risk: toRiskLevel(status),
        siteCode,
        active: stageMatchesNode(activePipelineStage, type),
        highlighted: siteFilter != null && siteCode === siteFilter,
        status,
      })

      return nodes
    }, [])
}

function buildCustomsNodes(
  nodes: NetworkNode[],
  locations: Location[],
  statusByLocationId: Record<string, LocationStatus>,
  activePipelineStage?: PipelineStage | null,
): NetworkNode[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  return CUSTOMS_ANCHORS.map((anchor) => {
    const connectedPorts = anchor.portIds
      .map((id) => nodeMap.get(id))
      .filter((node): node is NetworkNode => node != null)
    const status = findLocationStatusByHints(anchor.locationHints, locations, statusByLocationId)
    const primaryPort = connectedPorts[0]

    return {
      id: anchor.id,
      name: anchor.name,
      type: "customs" as const,
      lon: primaryPort?.lon ?? 0,
      lat: primaryPort?.lat ?? 0,
      volume: 0,
      risk: status ? toRiskLevel(status) : maxRisk(...connectedPorts.map((node) => node.risk)),
      active: stageMatchesNode(activePipelineStage, "customs"),
      highlighted: false,
      status,
    }
  })
}

function edgeRisk(source?: NetworkNode, target?: NetworkNode): RiskLevel {
  return maxRisk(source?.risk, target?.risk)
}

function addNodeVolume(
  nodeMap: Map<string, NetworkNode>,
  nodeId: string,
  volume: number,
  highlighted: boolean,
) {
  const node = nodeMap.get(nodeId)
  if (!node) return
  node.volume += volume
  node.highlighted = node.highlighted || highlighted
}

function addEdgeVolume(
  edgeMap: Map<string, NetworkEdge>,
  nodeMap: Map<string, NetworkNode>,
  sourceId: string,
  targetId: string,
  routeType: RouteType,
  volume: number,
  highlighted: boolean,
  activePipelineStage?: PipelineStage | null,
) {
  const source = nodeMap.get(sourceId)
  const target = nodeMap.get(targetId)
  if (!source || !target) return

  const key = `${sourceId}::${targetId}::${routeType}`
  const existing = edgeMap.get(key)
  if (existing) {
    existing.volume += volume
    existing.highlighted = existing.highlighted || highlighted
    existing.active = existing.active || edgeMatchesStage(activePipelineStage, routeType)
    return
  }

  edgeMap.set(key, {
    id: key,
    sourceId,
    targetId,
    routeType,
    volume,
    risk: edgeRisk(source, target),
    active: edgeMatchesStage(activePipelineStage, routeType),
    highlighted,
  })
}

function decorateNodes(nodes: NetworkNode[], edges: NetworkEdge[]): NetworkNode[] {
  const highlightedNodeIds = new Set<string>()
  const activeNodeIds = new Set<string>()

  for (const edge of edges) {
    if (edge.highlighted) {
      highlightedNodeIds.add(edge.sourceId)
      highlightedNodeIds.add(edge.targetId)
    }
    if (edge.active) {
      activeNodeIds.add(edge.sourceId)
      activeNodeIds.add(edge.targetId)
    }
  }

  return nodes.map((node) => ({
    ...node,
    highlighted: node.highlighted || highlightedNodeIds.has(node.id),
    active: node.active || activeNodeIds.has(node.id),
  }))
}

function filteredVoyages(voyages: OverviewMapVoyage[], siteFilter?: SiteFilter) {
  return voyages.filter((voyage) => voyageMatchesSiteFilter(voyage, siteFilter))
}

export function buildOriginEntries(voyages: OverviewMapVoyage[], siteFilter?: SiteFilter): OverviewOriginSummary[] {
  const counts = new Map<string, number>()
  for (const voyage of filteredVoyages(voyages, siteFilter)) {
    if (!voyage.originCountry) continue
    counts.set(voyage.originCountry, (counts.get(voyage.originCountry) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([country, count]) => ({ country, count }))
}

export function buildMapFooterSummary(voyages: OverviewMapVoyage[], siteFilter?: SiteFilter): MapFooterSummary {
  const scopedVoyages = filteredVoyages(voyages, siteFilter)

  return scopedVoyages.reduce<MapFooterSummary>(
    (summary, voyage) => {
      const stage = deriveVoyageStage(voyage)
      const sites = siteCodesForVoyage(voyage, siteFilter)
      const primarySite = sites[0] ?? voyage.actualSite ?? null
      const warehouseHint = hasWarehouseEvidence(voyage)

      summary.origin += voyage.originCountry ? 1 : 0
      if (stage === "in_transit") summary.inTransit += 1
      if (stage === "customs_in_progress") summary.customsHold += 1
      if (warehouseHint && stage !== "delivered" && stage !== "at_site") summary.warehouseStaging += 1
      if (primarySite && isIslandSite(primarySite) && stage !== "delivered" && stage !== "at_site") summary.mosbPending += 1
      if (stage === "at_site" || stage === "delivered") summary.siteReady += 1
      if (stage === "delivered") summary.delivered += 1
      return summary
    },
    {
      origin: 0,
      inTransit: 0,
      customsHold: 0,
      warehouseStaging: 0,
      mosbPending: 0,
      siteReady: 0,
      delivered: 0,
    },
  )
}

export function buildOverviewNetworkGraph(input: BuildOverviewNetworkGraphInput) {
  const poiNodes = buildPoiNodes(input)
  const customsNodes = buildCustomsNodes(
    poiNodes,
    input.locations,
    input.statusByLocationId,
    input.activePipelineStage,
  )
  const nodeMap = new Map(
    [...poiNodes, ...customsNodes].map((node) => [node.id, { ...node }]),
  )
  const edgeMap = new Map<string, NetworkEdge>()

  for (const voyage of filteredVoyages(input.voyages, input.siteFilter)) {
    const sites = siteCodesForVoyage(voyage, input.siteFilter)
    const highlighted = input.siteFilter != null
    const podNodeId = resolvePodNodeId(voyage.pod)
    const customsNodeId = resolveCustomsNodeId(podNodeId)
    const warehouseHint = hasWarehouseEvidence(voyage)

    if (podNodeId) addNodeVolume(nodeMap, podNodeId, 1, highlighted)
    if (customsNodeId) addNodeVolume(nodeMap, customsNodeId, 1, highlighted)
    if (podNodeId && customsNodeId) {
      addEdgeVolume(edgeMap, nodeMap, podNodeId, customsNodeId, "port-customs", 1, highlighted, input.activePipelineStage)
    }

    if (sites.length === 0) continue

    const volumePerSite = 1 / sites.length
    for (const site of sites) {
      const siteNodeId = SITE_POI_BY_CODE[site]
      addNodeVolume(nodeMap, siteNodeId, volumePerSite, highlighted)

      if (isIslandSite(site)) {
        addNodeVolume(nodeMap, MOSB_POI_ID, volumePerSite, highlighted)
        if (warehouseHint) {
          addNodeVolume(nodeMap, WAREHOUSE_POI_ID, volumePerSite, highlighted)
          if (customsNodeId) {
            addEdgeVolume(edgeMap, nodeMap, customsNodeId, WAREHOUSE_POI_ID, "customs-wh", volumePerSite, highlighted, input.activePipelineStage)
          }
          addEdgeVolume(edgeMap, nodeMap, WAREHOUSE_POI_ID, MOSB_POI_ID, "wh-mosb", volumePerSite, highlighted, input.activePipelineStage)
        } else if (customsNodeId) {
          addEdgeVolume(edgeMap, nodeMap, customsNodeId, MOSB_POI_ID, "customs-mosb", volumePerSite, highlighted, input.activePipelineStage)
        }
        addEdgeVolume(edgeMap, nodeMap, MOSB_POI_ID, siteNodeId, "mosb-site", volumePerSite, highlighted, input.activePipelineStage)
        continue
      }

      if (warehouseHint) {
        addNodeVolume(nodeMap, WAREHOUSE_POI_ID, volumePerSite, highlighted)
        if (customsNodeId) {
          addEdgeVolume(edgeMap, nodeMap, customsNodeId, WAREHOUSE_POI_ID, "customs-wh", volumePerSite, highlighted, input.activePipelineStage)
        }
        addEdgeVolume(edgeMap, nodeMap, WAREHOUSE_POI_ID, siteNodeId, "wh-site", volumePerSite, highlighted, input.activePipelineStage)
      } else if (customsNodeId) {
        addEdgeVolume(edgeMap, nodeMap, customsNodeId, siteNodeId, "customs-site", volumePerSite, highlighted, input.activePipelineStage)
      }
    }
  }

  const nodes = decorateNodes(
    [...nodeMap.values()],
    [...edgeMap.values()].map((edge) => ({
      ...edge,
      risk: edgeRisk(nodeMap.get(edge.sourceId), nodeMap.get(edge.targetId)),
    })),
  )
  const decoratedNodeMap = new Map(nodes.map((node) => [node.id, node]))
  const edges = [...edgeMap.values()]
    .map((edge) => ({
      ...edge,
      risk: edgeRisk(decoratedNodeMap.get(edge.sourceId), decoratedNodeMap.get(edge.targetId)),
    }))
    .filter((edge) => edge.volume > 0)

  return {
    nodes,
    edges,
    footer: buildMapFooterSummary(input.voyages, input.siteFilter),
  }
}

export function buildOverviewTrips(input: BuildOverviewTripsInput): NetworkTrip[] {
  const nodeMap = new Map(input.nodes.map((node) => [node.id, node]))
  const trips: NetworkTrip[] = []

  for (const voyage of filteredVoyages(input.voyages, input.siteFilter)) {
    const stage = deriveVoyageStage(voyage)
    if (stage === "delivered" || stage === "at_site") continue

    if (input.track === "global") {
      const polCoords = resolvePolCoords(voyage.pol)
      const podCoords = resolvePodCoords(voyage.pod)
      const etaUnix = toUnix(voyage.eta)
      if (!polCoords || !podCoords || etaUnix == null) continue
      trips.push({
        id: `${voyage.shipmentId}::global`,
        shipmentId: voyage.shipmentId,
        vendor: voyage.vendor,
        path: [polCoords, podCoords],
        timestamps: buildTimestamps(2, voyage),
        etaUnix,
        routeLabel: `${voyage.pol ?? "POL"} -> ${voyage.pod ?? "POD"}`,
        stageLabel: stageLabel(stage),
        nextMilestone: nextMilestone(stage, voyage.actualSite, false),
        kind: "global",
      })
      continue
    }

    const podNodeId = resolvePodNodeId(voyage.pod)
    const customsNodeId = resolveCustomsNodeId(podNodeId)
    const etaUnix = toUnix(voyage.eta)
    if (!podNodeId || !customsNodeId || etaUnix == null) continue

    const sites = siteCodesForVoyage(voyage, input.siteFilter)
    const warehouseHint = hasWarehouseEvidence(voyage)

    if (sites.length === 0) {
      const podNode = nodeMap.get(podNodeId)
      const customsNode = nodeMap.get(customsNodeId)
      if (!podNode || !customsNode) continue
      trips.push({
        id: `${voyage.shipmentId}::customs`,
        shipmentId: voyage.shipmentId,
        vendor: voyage.vendor,
        path: [
          getGeometryPosition(podNode),
          getGeometryPosition(customsNode),
        ],
        timestamps: buildTimestamps(2, voyage),
        etaUnix,
        routeLabel: "Customs",
        stageLabel: stageLabel(stage),
        nextMilestone: nextMilestone(stage, null, warehouseHint),
        kind: "direct-site",
      })
      continue
    }

    for (const site of sites) {
      const pathIds = (() => {
        if (isIslandSite(site)) {
          return warehouseHint
            ? [podNodeId, customsNodeId, WAREHOUSE_POI_ID, MOSB_POI_ID, SITE_POI_BY_CODE[site]]
            : [podNodeId, customsNodeId, MOSB_POI_ID, SITE_POI_BY_CODE[site]]
        }
        return warehouseHint
          ? [podNodeId, customsNodeId, WAREHOUSE_POI_ID, SITE_POI_BY_CODE[site]]
          : [podNodeId, customsNodeId, SITE_POI_BY_CODE[site]]
      })()
      const path = pathIds
        .map((nodeId) => nodeMap.get(nodeId))
        .filter((node): node is NetworkNode => node != null)
        .map((node) => getGeometryPosition(node))
      if (path.length < 2) continue

      trips.push({
        id: `${voyage.shipmentId}::${site}`,
        shipmentId: voyage.shipmentId,
        vendor: voyage.vendor,
        path,
        timestamps: buildTimestamps(path.length, voyage),
        etaUnix,
        routeLabel: routeLabelForSite(site, warehouseHint),
        stageLabel: stageLabel(stage),
        nextMilestone: nextMilestone(stage, site, warehouseHint),
        kind: formatTripKind(site, warehouseHint),
      })
    }
  }

  return trips
}
