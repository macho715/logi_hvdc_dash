/**
 * 타입 정의: WorklistRow, TriggerBadge, Gate, KPI 구조 등
 *
 * 이 타입들은 프론트엔드 컴포넌트와 API 응답 간 데이터 계약을 명확히 하기 위해
 * 분리되어 있습니다. 필요에 따라 확장 가능합니다.
 */

// Gate 상태: RED/AMBER/GREEN/ZERO 등을 표현
export type Gate = "RED" | "AMBER" | "GREEN" | "ZERO";

// Trigger 뱃지: 필수 문서 누락 등을 강조하기 위한 태그 값
export type TriggerBadge =
  | "DO_MISSING"
  | "CUSTOMS_START_MISSING"
  | "DELIVERY_DATE_MISSING"
  | "BL_MISSING"
  | "INCOTERM_MISSING";

// WorklistRow: 대시보드 테이블 한 줄을 표현합니다.
export interface WorklistRow {
  id: string;
  kind: "SHIPMENT";
  title: string;
  subtitle?: string;
  gate: Gate;
  score?: number;
  dueAt?: string;
  eta?: string;
  currentLocation?: string;
  triggers: TriggerBadge[];
  ref: {
    shptNo: string;
    invoiceNo?: string;
  };
  meta?: {
    vendor?: string | null;
    incoterms?: string | null;
    bl_awb?: string | null;
    do_collection?: string | undefined;
    customs_start?: string | undefined;
    customs_close?: string | undefined;
    duty_aed?: number | null;
    vat_aed?: number | null;
  };
}

// KPI 구조: 대시보드 상단에 표시되는 요약 수치
export interface Kpis {
  driAvg: number;
  wsiAvg: number;
  redCount: number;
  overdueCount: number;
  recoverableAED: number;
  zeroStops: number;
}

// API 응답 페이로드 구조
export interface DashboardPayload {
  lastRefreshAt: string;
  kpis: Kpis;
  rows: WorklistRow[];
}