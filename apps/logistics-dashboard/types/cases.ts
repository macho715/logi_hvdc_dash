import type { OverviewRouteTypeId } from '@/types/overview'

export interface CaseRow {
  id: string
  case_no: string
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI' | null
  flow_code: 0 | 1 | 2 | 3 | 4 | 5
  route_type?: OverviewRouteTypeId
  flow_description: string
  status_current: 'site' | 'warehouse' | 'Pre Arrival'
  status_location: string | null
  final_location: string | null
  sqm: number
  source_vendor: 'Hitachi' | 'Siemens' | string
  storage_type: string | null
  stack_status: string | null
  category: string | null
  sct_ship_no: string | null
  site_arrival_date: string | null  // ISO date
}

export interface CasesResponse {
  data: CaseRow[]
  total: number
  page: number
  pageSize: number
}

export interface CasesSummary {
  total: number
  byStatus: {
    site: number
    warehouse: number
    'Pre Arrival': number
    port: number   // ← ADD
    mosb: number   // ← ADD
  }
  bySite: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
    Unassigned: number
  }
  bySiteArrived: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
  }
  bySiteStorageType: {                          // ← ADD
    [site: string]: { Indoor: number; Outdoor: number; 'Outdoor Cov': number }
  }
  byRouteType: Record<OverviewRouteTypeId, number>
  byFlowCode: Record<string, number>       // keys: "0"–"5"
  byVendor: Record<string, number>          // { Hitachi: n, Siemens: n, Other: n }
  bySqmByLocation: Record<string, number>  // { "DSV Outdoor": 846, ... }
  totalSqm: number
}

export type VoyageStage = 'pre-departure' | 'in-transit' | 'port-customs' | 'inland' | 'delivered'

export interface ShipmentRow {
  id: string
  sct_ship_no: string
  vendor: string
  pol: string
  pod: string
  etd: string | null
  atd: string | null
  eta: string | null
  ata: string | null
  cif_value: number | null
  customs_status: 'cleared' | 'in_progress' | 'pending'
  ship_mode: 'Container' | 'Air' | 'Bulk' | 'LCL' | string
  container_no: string | null
  // Voyage stage and analytics fields
  voyage_stage: VoyageStage
  flow_code: number | null
  route_type?: OverviewRouteTypeId
  transit_days: number | null
  customs_days: number | null
  inland_days: number | null
  /** Nominated delivery sites derived from doc_shu / doc_das / doc_mir / doc_agi columns */
  nominated_sites: string[]
}

export interface ShipmentsResponse {
  data: ShipmentRow[]
  total: number
  page: number
  pageSize: number
}

export interface StockRow {
  id: string
  no: number
  sku: string
  description: string
  location: string
  pallet_id: string
  qty: number
  shipping_ref: string
  date_received: string  // ISO date
}

export interface StockResponse {
  data: StockRow[]
  total: number
  page: number
  pageSize: number
}

export interface CasesFilter {
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI' | 'all'
  route_type?: OverviewRouteTypeId | 'all'
  status_current: CaseRow['status_current'] | CaseRow['status_current'][] | 'all'
  vendor: 'Hitachi' | 'Siemens' | 'Other' | 'all'
  category: 'Elec' | 'Mech' | 'Inst.' | 'all'
  location: string | 'all'
}

export const DEFAULT_CASES_FILTER: CasesFilter = {
  site: 'all',
  route_type: 'all',
  status_current: 'all',
  vendor: 'all',
  category: 'all',
  location: 'all',
}

export interface StockFilter {
  location: string | 'all'
  sku: string | 'all'
}

export const DEFAULT_STOCK_FILTER: StockFilter = {
  location: 'all',
  sku: 'all',
}

export type { PipelineStage } from '@/lib/cases/pipelineStage'
