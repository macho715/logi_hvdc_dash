export const UAE_OPS_LEGEND_COPY = {
  title: "UAE OPS NETWORK",
  subtitle: "UAE 내 항차 실행 흐름",
  nodesTitle: "노드 유형",
  nodes: [
    { label: "Port / Airport", desc: "UAE entry point" },
    { label: "Customs Stage", desc: "Clearance progress at entry point" },
    { label: "Warehouse", desc: "Optional inland staging" },
    { label: "MOSB Hub", desc: "Offshore staging / dispatch" },
    { label: "HVDC Site", desc: "SHU · MIR · DAS · AGI" },
  ],
  routesTitle: "경로 의미",
  routes: [
    "Entry → Customs",
    "Customs → Warehouse",
    "Customs → Site",
    "Warehouse → MOSB",
    "Warehouse → Site",
    "MOSB → DAS / AGI",
  ],
  rulesTitle: "RULE NOTES",
  rules: [
    "Overview is voyage-first",
    "Customs is shown as a clearance stage",
    "WH is optional staging",
    "SHU / MIR may be direct or WH-mediated",
    "DAS / AGI require MOSB path",
    "No Flow Code on Overview",
  ],
} as const

export const UAE_OPS_LEFT_PANEL_COPY = {
  modeTitle: "맵 모드",
  modeDesc: "Global 공급망과 UAE 실행 네트워크를 전환합니다.",
  modeDesc2: "UAE Ops는 Entry → Customs → WH / MOSB → Site 흐름을 표시합니다.",
  toggles: {
    voyages: "Voyages",
    customs: "Customs",
    warehouse: "WH",
    mosb: "MOSB",
    sites: "Sites",
  },
} as const

export const UAE_OPS_FOOTER_COPY = {
  compact: ["Customs Hold", "WH Staging", "MOSB Pending", "Site Ready"],
} as const

export const UAE_OPS_ROUTE_COPY = {
  "port-customs": "Entry → Customs",
  "customs-wh": "Customs → Warehouse",
  "customs-site": "Customs → Site",
  "customs-mosb": "Customs → MOSB",
  "wh-mosb": "Warehouse → MOSB",
  "wh-site": "Warehouse → Site",
  "mosb-site": "MOSB → DAS / AGI",
} as const

export function hasDsvEvidence(value: string | null | undefined): boolean {
  return /DSV/i.test(value ?? "")
}

export function getWarehouseLabel(value: string | null | undefined): string {
  return hasDsvEvidence(value) ? "DSV WH" : "Warehouse"
}
