import { ArcLayer } from "@deck.gl/layers"
import type { Layer } from "@deck.gl/core"

import { getPoiById } from "@/lib/map/poiLocations"

export type FlowArcSpec = {
  id: string
  sourcePoiId: string
  targetPoiId: string
  color: [number, number, number]
  width: number
  label: string
}

const FLOW_ARC_SPECS: FlowArcSpec[] = [
  {
    id: "khalifa-to-wh",
    sourcePoiId: "khalifa-port-kpct",
    targetPoiId: "dsv-inland-warehouse-m44",
    color: [59, 130, 246],
    width: 4,
    label: "Port -> WH",
  },
  {
    id: "mzp-to-wh",
    sourcePoiId: "zayed-port",
    targetPoiId: "dsv-inland-warehouse-m44",
    color: [59, 130, 246],
    width: 4,
    label: "Port -> WH",
  },
  {
    id: "jebel-ali-to-wh",
    sourcePoiId: "jebel-ali-port",
    targetPoiId: "dsv-inland-warehouse-m44",
    color: [59, 130, 246],
    width: 4,
    label: "Port -> WH",
  },
  {
    id: "auh-to-wh",
    sourcePoiId: "auh-airport",
    targetPoiId: "dsv-inland-warehouse-m44",
    color: [59, 130, 246],
    width: 3,
    label: "Airport -> WH",
  },
  {
    id: "wh-to-shu",
    sourcePoiId: "dsv-inland-warehouse-m44",
    targetPoiId: "shuweihat-complex",
    color: [234, 179, 8],
    width: 3,
    label: "WH -> SHU",
  },
  {
    id: "wh-to-mir",
    sourcePoiId: "dsv-inland-warehouse-m44",
    targetPoiId: "mirfa-iwpp",
    color: [234, 179, 8],
    width: 3,
    label: "WH -> MIR",
  },
  {
    id: "wh-to-mosb",
    sourcePoiId: "dsv-inland-warehouse-m44",
    targetPoiId: "mosb-yard",
    color: [249, 115, 22],
    width: 4,
    label: "WH -> MOSB",
  },
  {
    id: "mosb-to-das",
    sourcePoiId: "mosb-yard",
    targetPoiId: "das-island",
    color: [249, 115, 22],
    width: 4,
    label: "MOSB -> DAS",
  },
  {
    id: "mosb-to-agi",
    sourcePoiId: "mosb-yard",
    targetPoiId: "agi-jetty",
    color: [249, 115, 22],
    width: 4,
    label: "MOSB -> AGI",
  },
]

export function createFlowArcLayer(visible: boolean): Layer | null {
  const arcs = FLOW_ARC_SPECS.map((spec) => {
    const source = getPoiById(spec.sourcePoiId)
    const target = getPoiById(spec.targetPoiId)
    if (!source || !target) return null
    return {
      ...spec,
      sourcePosition: [source.longitude, source.latitude] as [number, number],
      targetPosition: [target.longitude, target.latitude] as [number, number],
    }
  }).filter((spec): spec is NonNullable<typeof spec> => spec !== null)

  if (arcs.length === 0) return null

  return new ArcLayer({
    id: "hvdc-flow-arcs",
    data: arcs,
    pickable: false,
    visible,
    getSourcePosition: (d) => d.sourcePosition,
    getTargetPosition: (d) => d.targetPosition,
    getSourceColor: (d) => [d.color[0], d.color[1], d.color[2], 220] as [number, number, number, number],
    getTargetColor: (d) => [d.color[0], d.color[1], d.color[2], 60] as [number, number, number, number],
    getWidth: (d) => d.width,
    widthUnits: "pixels",
    greatCircle: false,
    getHeight: 0.08,
  })
}
