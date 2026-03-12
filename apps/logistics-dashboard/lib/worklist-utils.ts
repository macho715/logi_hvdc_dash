import type { Gate, TriggerBadge, WorklistRow, HVDCKPIs } from "@repo/shared"

/**
 * Shipment 데이터 구조 (DB에서 가져온 원본)
 */
export interface ShipmentRow {
  id: string
  sct_ship_no: string
  mr_number?: string | null
  commercial_invoice_no?: string | null
  invoice_date?: string | null
  vendor?: string | null
  main_description?: string | null
  port_of_loading?: string | null
  port_of_discharge?: string | null
  vessel_name?: string | null
  bl_awb_no?: string | null
  ship_mode?: string | null
  coe?: string | null
  etd?: string | null
  eta?: string | null
  do_collection_date?: string | null
  customs_start_date?: string | null
  customs_close_date?: string | null
  delivery_date?: string | null
  duty_amount_aed?: number | null
  vat_amount_aed?: number | null
  incoterms?: string | null
  flow_code?: number | null
  flow_code_original?: number | null
  flow_override_reason?: string | null
  final_location?: string | null
  warehouse_inventory?: {
    mosb?: string | null
    dsv_indoor?: string | null
    dsv_outdoor?: string | null
    dsv_mzd?: string | null
    jdn_mzd?: string | null
    jdn_waterfront?: string | null
    project_shu2?: string | null
    project_mir3?: string | null
    project_das4?: string | null
    project_agi5?: string | null
  } | null
}

/**
 * Asia/Dubai 시간대로 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getDubaiToday(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return formatter.format(now)
}

/**
 * Asia/Dubai 시간대로 현재 시간을 YYYY-MM-DD HH:mm 형식으로 변환
 */
export function getDubaiTimestamp(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value
  const hour = parts.find((p) => p.type === "hour")?.value
  const minute = parts.find((p) => p.type === "minute")?.value

  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 변환 (null-safe)
 */
function formatDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return undefined
    return d.toISOString().split("T")[0]
  } catch {
    return undefined
  }
}

/**
 * 값이 비어있는지 확인
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string" && value.trim() === "") return true
  return false
}

/**
 * DRI Score 계산 (Document Readiness Index)
 */
export function calculateDriScore(shipment: ShipmentRow): number {
  const fields = [
    shipment.commercial_invoice_no,
    shipment.invoice_date,
    shipment.coe,
    shipment.bl_awb_no,
    shipment.vessel_name,
    shipment.etd,
    shipment.eta,
    shipment.do_collection_date,
    shipment.customs_start_date,
  ]

  const presentCount = fields.filter((field) => !isEmpty(field)).length

  return Math.round((presentCount / fields.length) * 100.0 * 100) / 100
}

/**
 * Gate 상태와 Triggers 계산
 */
export function calculateGateAndTriggers(
  shipment: ShipmentRow,
  today: string = getDubaiToday()
): { gate: Gate; triggers: TriggerBadge[] } {
  const triggers: TriggerBadge[] = []

  // 문서 누락 체크
  if (isEmpty(shipment.do_collection_date)) triggers.push("DO_MISSING")
  if (isEmpty(shipment.customs_start_date)) triggers.push("CUSTOMS_START_MISSING")
  if (isEmpty(shipment.delivery_date)) triggers.push("DELIVERY_DATE_MISSING")
  if (isEmpty(shipment.bl_awb_no)) triggers.push("BL_MISSING")
  if (isEmpty(shipment.incoterms)) triggers.push("INCOTERM_MISSING")

  // AGI/DAS Flow Code 위반 체크
  if (shipment.final_location && 
      (shipment.final_location === "AGI" || shipment.final_location === "DAS") &&
      shipment.flow_code !== undefined && 
      shipment.flow_code !== null &&
      shipment.flow_code < 3) {
    triggers.push("FLOW_CODE_VIOLATION")
  }

  // Gate 결정 로직
  const eta = shipment.eta
  const isEtaValid = !isEmpty(eta)
  const isEtaPassed = isEtaValid && eta! < today

  let gate: Gate

  if (isEtaValid && isEtaPassed && (triggers.includes("DO_MISSING") || triggers.includes("CUSTOMS_START_MISSING"))) {
    gate = "RED"
  } else if (isEtaValid && isEtaPassed && triggers.includes("DELIVERY_DATE_MISSING")) {
    gate = "AMBER"
  } else if (triggers.includes("FLOW_CODE_VIOLATION")) {
    gate = "ZERO"
  } else {
    gate = "GREEN"
  }

  return { gate, triggers }
}

/**
 * 현재 위치 계산 (Warehouse dates 기준)
 */
export function calculateCurrentLocation(shipment: ShipmentRow): string | undefined {
  const wh = shipment.warehouse_inventory
  if (!wh) return undefined

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
  ]

  let best: { date: Date; label: string } | null = null

  for (const [label, dateStr] of locationDates) {
    if (isEmpty(dateStr)) continue
    try {
      const date = new Date(dateStr!)
      if (isNaN(date.getTime())) continue

      if (best === null || date > best.date) {
        best = { date, label }
      }
    } catch {
      continue
    }
  }

  return best?.label
}

/**
 * ShipmentRow → WorklistRow 변환
 */
export function shipmentToWorklistRow(shipment: ShipmentRow, today?: string): WorklistRow {
  const driScore = calculateDriScore(shipment)
  const { gate, triggers } = calculateGateAndTriggers(shipment, today)
  const currentLocation = calculateCurrentLocation(shipment)

  const subtitle = [
    shipment.vendor || "-",
    shipment.ship_mode || "-",
    shipment.port_of_loading || "-",
    shipment.port_of_discharge ? `→${shipment.port_of_discharge}` : "",
  ]
    .filter((s) => s !== "" && s !== "-")
    .join(" · ")

  const dueAt = formatDate(shipment.delivery_date) || formatDate(shipment.eta)

  return {
    id: shipment.id,
    kind: "SHIPMENT",
    title: shipment.sct_ship_no,
    subtitle: subtitle || undefined,
    gate,
    score: driScore,
    dueAt,
    eta: formatDate(shipment.eta),
    currentLocation,
    triggers,
    flowCode: shipment.flow_code ?? undefined,
    flowCodeOriginal: shipment.flow_code_original ?? undefined,
    flowOverrideReason: shipment.flow_override_reason ?? undefined,
    finalLocation: shipment.final_location ?? undefined,
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
      etd: formatDate(shipment.etd),
      delivery_date: formatDate(shipment.delivery_date),
    },
  }
}

/**
 * KPI 계산
 */
export function calculateKpis(
  rows: WorklistRow[],
  today: string = getDubaiToday()
): HVDCKPIs {
  const shipments = rows.filter((r) => r.kind === "SHIPMENT")

  if (shipments.length === 0) {
    return {
      driAvg: 0.0,
      wsiAvg: 0.0,
      redCount: 0,
      overdueCount: 0,
      recoverableAED: 0.0,
      zeroStops: 0,
    }
  }

  const scores = shipments.map((r) => r.score ?? 0)
  const driAvg = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    : 0.0

  const redCount = shipments.filter((r) => r.gate === "RED").length

  const overdueCount = shipments.filter((r) => {
    if (!r.dueAt) return false
    return r.dueAt < today
  }).length

  const recoverableAED = shipments.reduce((sum, r) => {
    const duty = (r.meta?.duty_aed as number) ?? 0
    const vat = (r.meta?.vat_aed as number) ?? 0
    return sum + duty + vat
  }, 0)

  const zeroStops = shipments.filter((r) => r.gate === "ZERO").length

  return {
    driAvg,
    wsiAvg: 0.0, // TODO: WSI 계산 로직 구현 필요
    redCount,
    overdueCount,
    recoverableAED: Math.round(recoverableAED * 100) / 100,
    zeroStops,
  }
}
