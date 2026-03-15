import { describe, expect, it } from "vitest"
import { POI_LOCATIONS } from "@/lib/map/poiLocations"
import {
  buildMapFooterSummary,
  buildOverviewNetworkGraph,
  buildOverviewTrips,
} from "@/lib/map/networkGraph"
import type { Location, LocationStatus } from "@/types/logistics"
import type { OverviewMapVoyage } from "@/types/overview"

const voyages: OverviewMapVoyage[] = [
  {
    id: "1",
    shipmentId: "HVDC-001",
    vendor: "Prysmian",
    originCountry: "KR",
    pol: "Busan",
    pod: "Khalifa Port",
    etd: "2026-03-01",
    atd: "2026-03-02",
    eta: "2026-03-18",
    ata: null,
    customsStart: null,
    customsClose: null,
    deliveryDate: null,
    plannedSites: ["AGI"],
    actualSite: null,
    siteBasis: "planned",
  },
  {
    id: "2",
    shipmentId: "HVDC-002",
    vendor: "Hitachi",
    originCountry: "DE",
    pol: "Hamburg",
    pod: "Mina Zayed",
    etd: "2026-03-03",
    atd: "2026-03-05",
    eta: "2026-03-19",
    ata: null,
    customsStart: null,
    customsClose: null,
    deliveryDate: null,
    plannedSites: ["SHU"],
    actualSite: null,
    siteBasis: "planned",
  },
  {
    id: "3",
    shipmentId: "HVDC-003",
    vendor: "Siemens",
    originCountry: "SE",
    pol: "Gothenburg",
    pod: "AUH",
    etd: "2026-03-04",
    atd: "2026-03-05",
    eta: "2026-03-14",
    ata: "2026-03-14",
    customsStart: "2026-03-15",
    customsClose: null,
    deliveryDate: null,
    plannedSites: ["SHU", "MIR"],
    actualSite: null,
    siteBasis: "planned",
  },
  {
    id: "4",
    shipmentId: "HVDC-004",
    vendor: "Prysmian",
    originCountry: "KR",
    pol: "Busan",
    pod: "Jebel Ali",
    etd: "2026-03-02",
    atd: "2026-03-03",
    eta: "2026-03-12",
    ata: "2026-03-12",
    customsStart: "2026-03-13",
    customsClose: "2026-03-14",
    deliveryDate: null,
    plannedSites: ["SHU", "DAS"],
    actualSite: "DAS",
    siteBasis: "actual",
  },
  {
    id: "5",
    shipmentId: "HVDC-005",
    vendor: "LS Cable",
    originCountry: "BE",
    pol: "Antwerp",
    pod: "Khalifa Port",
    etd: "2026-02-10",
    atd: "2026-02-11",
    eta: "2026-02-24",
    ata: "2026-02-24",
    customsStart: "2026-02-25",
    customsClose: "2026-02-27",
    deliveryDate: "2026-03-04",
    plannedSites: ["MIR"],
    actualSite: "MIR",
    siteBasis: "actual",
  },
]

const locations: Location[] = [
  { location_id: "LOC-KPP", name: "Khalifa Port (KPCT)", siteType: "PORT", lat: 24.8095, lon: 54.64842 },
  { location_id: "LOC-MZP", name: "Mina Zayed Port", siteType: "PORT", lat: 24.52489, lon: 54.37798 },
  { location_id: "LOC-DSV-M44", name: "DSV Inland WH", siteType: "MOSB_WH", lat: 24.347077, lon: 54.47772 },
  { location_id: "LOC-MOSB-SCT-YARD", name: "MOSB YARD", siteType: "MOSB_WH", lat: 24.331414, lon: 54.456911 },
  { location_id: "LOC-AGI", name: "Al Ghallan Island", siteType: "SITE", lat: 24.841096, lon: 53.658619 },
]

const statusByLocationId: Record<string, LocationStatus> = {
  "LOC-KPP": { location_id: "LOC-KPP", status_code: "WARNING", occupancy_rate: 0.54, last_updated: "2026-03-15T02:00:00Z" },
  "LOC-DSV-M44": { location_id: "LOC-DSV-M44", status_code: "OK", occupancy_rate: 0.68, last_updated: "2026-03-15T02:00:00Z" },
  "LOC-MOSB-SCT-YARD": { location_id: "LOC-MOSB-SCT-YARD", status_code: "CRITICAL", occupancy_rate: 0.83, last_updated: "2026-03-15T02:00:00Z" },
  "LOC-AGI": { location_id: "LOC-AGI", status_code: "WARNING", occupancy_rate: 0.47, last_updated: "2026-03-15T02:00:00Z" },
}

describe("buildMapFooterSummary", () => {
  it("uses voyage milestones instead of flow-code buckets", () => {
    expect(buildMapFooterSummary(voyages)).toEqual({
      origin: 5,
      inTransit: 2,
      customsHold: 1,
      warehouseStaging: 0,
      mosbPending: 1,
      siteReady: 2,
      delivered: 1,
    })
  })
})

describe("buildOverviewNetworkGraph", () => {
  it("forces AGI/DAS voyages through customs and MOSB", () => {
    const graph = buildOverviewNetworkGraph({
      pois: POI_LOCATIONS,
      voyages,
      locations,
      statusByLocationId,
    })

    expect(graph.nodes.some((node) => node.id === "khalifa-customs")).toBe(true)
    expect(graph.nodes.some((node) => node.id === "mosb-yard")).toBe(true)
    expect(graph.edges.some((edge) => edge.routeType === "customs-mosb")).toBe(true)
    expect(graph.edges.some((edge) => edge.id.includes("mosb-yard::agi-jetty") && edge.routeType === "mosb-site")).toBe(true)
    expect(graph.edges.some((edge) => edge.id.includes("das-island") && edge.routeType === "mosb-site")).toBe(true)
    expect(graph.edges.some((edge) => edge.targetId === "agi-jetty" && edge.routeType === "customs-site")).toBe(false)
    expect(graph.edges.some((edge) => edge.targetId === "das-island" && edge.routeType === "customs-site")).toBe(false)
  })

  it("keeps SHU/MIR direct when there is no explicit warehouse evidence", () => {
    const graph = buildOverviewNetworkGraph({
      pois: POI_LOCATIONS,
      voyages,
      locations,
      statusByLocationId,
    })

    expect(graph.edges.some((edge) => edge.routeType === "customs-site" && edge.targetId === "shuweihat-complex")).toBe(true)
    expect(graph.edges.some((edge) => edge.routeType === "customs-site" && edge.targetId === "mirfa-iwpp")).toBe(true)
    expect(graph.edges.some((edge) => edge.routeType === "customs-wh")).toBe(false)
    expect(graph.edges.some((edge) => edge.routeType === "wh-site")).toBe(false)
  })

  it("uses actual site over planned nomination and keeps multi-site planned splits", () => {
    const graph = buildOverviewNetworkGraph({
      pois: POI_LOCATIONS,
      voyages,
      locations,
      statusByLocationId,
      siteFilter: "DAS",
    })

    expect(graph.edges.some((edge) => edge.targetId === "das-island" && edge.routeType === "mosb-site")).toBe(true)
    expect(graph.edges.some((edge) => edge.targetId === "shuweihat-complex")).toBe(false)
    expect(graph.nodes.find((node) => node.id === "jebel-ali-customs")?.highlighted).toBe(true)
  })

  it("does not collapse multi-site planned voyages into one fake route", () => {
    const graph = buildOverviewNetworkGraph({
      pois: POI_LOCATIONS,
      voyages,
      locations,
      statusByLocationId,
    })

    const shuEdge = graph.edges.find((edge) => edge.routeType === "customs-site" && edge.targetId === "shuweihat-complex")
    const mirEdge = graph.edges.find((edge) => edge.routeType === "customs-site" && edge.targetId === "mirfa-iwpp")

    expect(shuEdge?.volume).toBeGreaterThan(0)
    expect(mirEdge?.volume).toBeGreaterThan(0)
  })
})

describe("buildOverviewTrips", () => {
  it("builds voyage-language tooltips without flow-code wording", () => {
    const graph = buildOverviewNetworkGraph({
      pois: POI_LOCATIONS,
      voyages,
      locations,
      statusByLocationId,
    })

    const trips = buildOverviewTrips({
      voyages,
      nodes: graph.nodes,
      track: "uae-ops",
    })

    const agiTrip = trips.find((trip) => trip.shipmentId === "HVDC-001")
    const shuTrip = trips.find((trip) => trip.shipmentId === "HVDC-002")

    expect(agiTrip?.routeLabel).toContain("MOSB")
    expect(agiTrip?.routeLabel).not.toContain("Flow")
    expect(shuTrip?.routeLabel).toBe("Customs -> SHU")
    expect(shuTrip?.stageLabel).toBe("In transit")
    expect(shuTrip?.stageLabel).not.toContain("Flow")
    expect(shuTrip?.stageLabel).not.toContain("_")
  })
})
