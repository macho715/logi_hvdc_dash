/**
 * Locations from map/HVDC_Location_Master_Ontology_with_Coordinates.json (SSOT).
 * Fallback when Supabase locations is empty or unreachable (replaces mock).
 */

import type { Location } from "@/types/logistics"

export const ontologyLocations: Location[] = [
  { location_id: "LOC-DAS", name: "Das Island", siteType: "SITE", lat: 25.1477, lon: 52.875 },
  { location_id: "LOC-AGI", name: "Al Ghallan Island", siteType: "SITE", lat: 24.841096, lon: 53.658619 },
  { location_id: "LOC-MIR", name: "Mirfa", siteType: "SITE", lat: 24.11885, lon: 53.44436 },
  { location_id: "LOC-SHU", name: "Shuweihat", siteType: "SITE", lat: 24.16017, lon: 52.57292 },
  { location_id: "LOC-MOSB-SCT-OFFICE", name: "MOSB-SCT Office", siteType: "OTHER", lat: 24.32479, lon: 54.46685 },
  { location_id: "LOC-MOSB-SCT-YARD", name: "MOSB YARD", siteType: "MOSB_WH", lat: 24.331414, lon: 54.456911 },
  { location_id: "LOC-DSV-M44", name: "DSV Inland WH", siteType: "MOSB_WH", lat: 24.347077, lon: 54.47772 },
  { location_id: "LOC-KPP", name: "Khalifa Port (KPCT)", siteType: "PORT", lat: 24.8095, lon: 54.64842 },
  { location_id: "LOC-MZP", name: "Mina Zayed Port", siteType: "PORT", lat: 24.52489, lon: 54.37798 },
  { location_id: "LOC-DSV-M19", name: "DSV-M19 (Office)", siteType: "OTHER", lat: 24.366698, lon: 54.476102 },
]
