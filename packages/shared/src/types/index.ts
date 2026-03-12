export type Gate = "GREEN" | "AMBER" | "RED" | "ZERO";
export type RowKind = "SHIPMENT" | "WAREHOUSE" | "COST" | "EXCEPTION" | "ACTION";
export type HvdcBucket = "cumulative" | "current" | "future";

export type TriggerBadge =
  | "DO_MISSING"
  | "CUSTOMS_START_MISSING"
  | "DELIVERY_DATE_MISSING"
  | "BL_MISSING"
  | "INCOTERM_MISSING"
  | "HS_RISK"
  | "DEMDET_RISK"
  | "FLOW_CODE_VIOLATION"; // AGI/DAS Flow Code < 3

export interface WorklistRow {
  id: string;
  kind: RowKind;

  title: string;
  subtitle?: string;

  gate: Gate;
  score?: number; // 0.00–100.00 (DRI/WSI) or Δ%
  dueAt?: string; // YYYY-MM-DD
  eta?: string; // YYYY-MM-DD
  owner?: string;
  lastSeenAt?: string; // YYYY-MM-DD HH:mm

  currentLocation?: string;
  triggers: TriggerBadge[];

  // Flow Code v3.5 fields
  flowCode?: number; // 0-5
  flowCodeOriginal?: number;
  flowOverrideReason?: string;
  finalLocation?: string; // 'SHU', 'MIR', 'DAS', 'AGI'

  ref: {
    shptNo?: string;
    whName?: string;
    invoiceNo?: string;
  };

  // Drawer 상세에 쓰는 원본 요약(선택)
  meta?: Record<string, unknown>;
}

export interface HVDCKPIs {
  driAvg: number;
  wsiAvg: number;
  redCount: number;
  overdueCount: number;
  recoverableAED: number;
  zeroStops: number;
}

export interface DashboardPayload {
  lastRefreshAt: string; // YYYY-MM-DD HH:mm (Asia/Dubai)
  kpis: HVDCKPIs;
  rows: WorklistRow[];
}

// ============================================================
// Logistics Types
// ============================================================

export interface Location {
  location_id: string;
  name: string;
  siteType: "SITE" | "MOSB_WH" | "PORT" | "BERTH" | "OTHER";
  lat: number;
  lon: number;
}

export type StatusCode = "OK" | "WARNING" | "CRITICAL";

export interface LocationStatus {
  location_id: string;
  occupancy_rate: number; // 0..1
  status_code: StatusCode;
  last_updated: string; // ISO string
}

export interface Event {
  event_id: string;
  ts: string; // ISO string
  shpt_no: string;
  status: string;
  location_id: string;
  lat: number;
  lon: number;
  remark?: string;

  // Date Canon fields
  event_type?: string; // 온톨로지 개념 (ATD, ATA, CUSTOMS_CLOSE, SITE_ARRIVAL_SHU 등)
  event_date_dubai?: string; // YYYY-MM-DD (Asia/Dubai 기준)
}

// ============================================================
// Unified Filter Types
// ============================================================

export interface DashboardFilters {
  // Gate filter
  gates?: Gate[];

  // Location filter
  locationIds?: string[];

  // Flow Code filter
  flowCodes?: number[];

  // Vendor filter
  vendors?: string[];

  // Date range filter
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD

  // Search
  searchQuery?: string;

  // Bucket filter
  bucket?: HvdcBucket;
}
