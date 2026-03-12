export interface CaseRow {
  id: string
  case_no: string
  site: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  flow_code: 0 | 1 | 2 | 3 | 4 | 5
  flow_description: string
  status_current: 'site' | 'warehouse' | 'Pre Arrival'
  status_location: string
  final_location: string
  sqm: number
  source_vendor: 'Hitachi' | 'Siemens' | string
  storage_type: string
  stack_status: string
  category: string
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
  byFlowCode: Record<string, number>       // keys: "0"–"5"
  byVendor: Record<string, number>          // { Hitachi: n, Siemens: n, Other: n }
  bySqmByLocation: Record<string, number>  // { "DSV Outdoor": 846, ... }
  totalSqm: number
}

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
  flow_code: 0 | 1 | 2 | 3 | 4 | 5 | 'all'
  status_current: CaseRow['status_current'] | CaseRow['status_current'][] | 'all'
  vendor: 'Hitachi' | 'Siemens' | 'Other' | 'all'
  category: 'Elec' | 'Mech' | 'Inst.' | 'all'
  location: string | 'all'
}

export const DEFAULT_CASES_FILTER: CasesFilter = {
  site: 'all',
  flow_code: 'all',
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

// Pipeline stage ↔ status_current mapping
export type PipelineStage = 'pre-arrival' | 'warehouse' | 'site'

export const STAGE_TO_STATUS: Record<PipelineStage, CaseRow['status_current']> = {
  'pre-arrival': 'Pre Arrival',
  'warehouse': 'warehouse',
  'site': 'site',
}
