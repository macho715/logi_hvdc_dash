import type { Gate, TriggerBadge, WorklistRow } from "@/types/worklist";

/**
 * Shipment 데이터 구조 (DB에서 가져온 원본).
 *
 * 이 인터페이스는 Supabase에서 반환되는 raw row를 모델링합니다. 일부 필드는
 * null 가능하며, 공백 문자열이 올 수도 있으므로 파생 계산을 할 때는
 * null-safe 처리를 해줘야 합니다.
 */
export interface ShipmentRow {
  id: string;
  sct_ship_no: string;
  mr_number?: string | null;
  commercial_invoice_no?: string | null;
  invoice_date?: string | null;
  vendor?: string | null;
  main_description?: string | null;
  port_of_loading?: string | null;
  port_of_discharge?: string | null;
  vessel_name?: string | null;
  bl_awb_no?: string | null;
  ship_mode?: string | null;
  coe?: string | null;
  etd?: string | null;
  eta?: string | null;
  do_collection_date?: string | null;
  customs_start_date?: string | null;
  customs_close_date?: string | null;
  delivery_date?: string | null;
  duty_amount_aed?: number | null;
  vat_amount_aed?: number | null;
  incoterms?: string | null;
  warehouse_inventory?: {
    mosb?: string | null;
    dsv_indoor?: string | null;
    dsv_outdoor?: string | null;
    dsv_mzd?: string | null;
    jdn_mzd?: string | null;
    jdn_waterfront?: string | null;
    project_shu2?: string | null;
    project_mir3?: string | null;
    project_das4?: string | null;
    project_agi5?: string | null;
  } | null;
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 변환합니다.
 * 입력 값이 falsy하면 undefined를 반환합니다. ISO 문자열을 출력합니다.
 */
function formatDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

/**
 * DRI 점수 계산 (Document Readiness Index).
 * 필수 문서 필드의 완성도를 백분율로 계산합니다.
 */
export function calculateDriScore(shipment: ShipmentRow): number {
  const requiredFields = [
    shipment.commercial_invoice_no,
    shipment.invoice_date,
    shipment.coe,
    shipment.bl_awb_no,
    shipment.vessel_name,
    shipment.etd,
    shipment.eta,
    shipment.do_collection_date,
    shipment.customs_start_date,
  ];
  const presentCount = requiredFields.filter((field) => {
    return field !== null && field !== undefined && String(field).trim() !== "";
  }).length;
  return Math.round((presentCount / requiredFields.length) * 100 * 100) / 100;
}

/**
 * Gate 상태와 Trigger 목록을 계산합니다.
 * ETA가 지났는지 여부와 필수 문서 누락 여부를 기준으로 Gate를 결정합니다.
 */
export function calculateGateAndTriggers(
  shipment: ShipmentRow,
  today: string = new Date().toISOString().split("T")[0]
): { gate: Gate; triggers: TriggerBadge[] } {
  const triggers: TriggerBadge[] = [];
  // 필수 문서 체크: 없으면 Trigger 추가
  if (!shipment.do_collection_date) triggers.push("DO_MISSING");
  if (!shipment.customs_start_date) triggers.push("CUSTOMS_START_MISSING");
  if (!shipment.delivery_date) triggers.push("DELIVERY_DATE_MISSING");
  if (!shipment.bl_awb_no) triggers.push("BL_MISSING");
  if (!shipment.incoterms) triggers.push("INCOTERM_MISSING");
  // ETA가 오늘 이전인지 확인
  const eta = shipment.eta;
  const isEtaPassed = eta ? eta < today : false;
  let gate: Gate = "GREEN";
  if (isEtaPassed) {
    if (triggers.includes("DO_MISSING") || triggers.includes("CUSTOMS_START_MISSING")) {
      gate = "RED";
    } else if (triggers.includes("DELIVERY_DATE_MISSING")) {
      gate = "AMBER";
    } else {
      gate = "GREEN";
    }
  } else {
    // ETA가 아직 안 지났으면 GREEN (단, 주요 문서 누락 시 AMBER)
    if (triggers.includes("DO_MISSING") || triggers.includes("CUSTOMS_START_MISSING")) {
      gate = "AMBER";
    } else {
      gate = "GREEN";
    }
  }
  return { gate, triggers };
}

/**
 * 가장 최근에 업데이트된 Warehouse 위치를 계산합니다.
 * warehouse_inventory 내 날짜가 최신인 항목을 찾아 해당 위치 이름을 반환합니다.
 */
export function calculateCurrentLocation(shipment: ShipmentRow): string | undefined {
  const wh = shipment.warehouse_inventory;
  if (!wh) return undefined;
  const locationDates: Array<[string, string | null | undefined]> = [
    ["MOSB", wh.mosb],
    ["DSV Indoor", wh.dsv_indoor],
    ["DSV Outdoor", wh.dsv_outdoor],
    ["DSV MZD", wh.dsv_mzd],
    ["JDN MZD", wh.jdn_mzd],
    ["JDN Waterfront", wh.jdn_waterfront],
    ["SHU", wh.project_shu2],
    ["MIR", wh.project_mir3],
    ["DAS", wh.project_das4],
    ["AGI", wh.project_agi5],
  ];
  let latest: { date: Date; label: string } | null = null;
  for (const [label, dateStr] of locationDates) {
    if (!dateStr) continue;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;
      if (!latest || date > latest.date) {
        latest = { date, label };
      }
    } catch {
      continue;
    }
  }
  return latest?.label;
}

/**
 * ShipmentRow를 WorklistRow로 변환합니다.
 * 파생 필드를 계산하고 subtitle/metadata를 채웁니다.
 */
export function shipmentToWorklistRow(
  shipment: ShipmentRow,
  today?: string
): WorklistRow {
  const driScore = calculateDriScore(shipment);
  const { gate, triggers } = calculateGateAndTriggers(shipment, today);
  const currentLocation = calculateCurrentLocation(shipment);
  // Subtitle: Vendor, mode, POL, POD
  const subtitle = [
    shipment.vendor || "-",
    shipment.ship_mode || "-",
    shipment.port_of_loading || "-",
    shipment.port_of_discharge ? `→${shipment.port_of_discharge}` : "",
  ]
    .filter((s) => s !== "" && s !== "-")
    .join(" · ");
  return {
    id: shipment.id,
    kind: "SHIPMENT",
    title: shipment.sct_ship_no,
    subtitle: subtitle || undefined,
    gate,
    score: driScore,
    dueAt: formatDate(shipment.delivery_date || shipment.eta),
    eta: formatDate(shipment.eta),
    currentLocation,
    triggers,
    ref: {
      shptNo: shipment.sct_ship_no,
      invoiceNo: shipment.commercial_invoice_no || undefined,
    },
    meta: {
      vendor: shipment.vendor,
      incoterms: shipment.incoterms,
      bl_awb: shipment.bl_awb_no,
      do_collection: formatDate(shipment.do_collection_date),
      customs_start: formatDate(shipment.customs_start_date),
      customs_close: formatDate(shipment.customs_close_date),
      duty_aed: shipment.duty_amount_aed,
      vat_aed: shipment.vat_amount_aed,
    },
  };
}

/**
 * KPI 계산: DRI 평균, WSI 평균, Red Count, Overdue Count, Recoverable AED 등.
 * 현재 WSI와 Zero Stops 계산 로직은 없으므로 0으로 반환합니다.
 */
export function calculateKpis(
  rows: WorklistRow[],
  today: string = new Date().toISOString().split("T")[0]
): {
  driAvg: number;
  wsiAvg: number;
  redCount: number;
  overdueCount: number;
  recoverableAED: number;
  zeroStops: number;
} {
  const shipments = rows.filter((r) => r.kind === "SHIPMENT");
  if (shipments.length === 0) {
    return {
      driAvg: 0.0,
      wsiAvg: 0.0,
      redCount: 0,
      overdueCount: 0,
      recoverableAED: 0.0,
      zeroStops: 0,
    };
  }
  const scores = shipments.map((r) => r.score ?? 0).filter((s) => s > 0);
  const driAvg =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.0;
  const redCount = shipments.filter((r) => r.gate === "RED").length;
  const overdueCount = shipments.filter((r) => {
    if (!r.dueAt) return false;
    return r.dueAt < today;
  }).length;
  const recoverableAED = shipments.reduce((sum, r) => {
    const duty = (r.meta?.duty_aed as number) ?? 0;
    const vat = (r.meta?.vat_aed as number) ?? 0;
    return sum + duty + vat;
  }, 0);
  return {
    driAvg: Math.round(driAvg * 100) / 100,
    wsiAvg: 0.0,
    redCount,
    overdueCount,
    recoverableAED: Math.round(recoverableAED * 100) / 100,
    zeroStops: 0,
  };
}