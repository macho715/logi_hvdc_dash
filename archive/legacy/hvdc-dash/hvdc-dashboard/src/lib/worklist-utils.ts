import type { Gate, TriggerBadge, WorklistRow } from "@/types/worklist";

/**
 * Shipment 데이터 구조 (DB에서 가져온 원본)
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
 * Asia/Dubai 시간대로 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * 모든 날짜 비교 및 필터링에서 일관성 있게 사용
 */
export function getDubaiToday(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return formatter.format(now);
}

/**
 * Asia/Dubai 시간대 기준으로 지정된 일수 후의 날짜를 YYYY-MM-DD 형식으로 반환
 * @param days 추가할 일수 (기본값: 0, 오늘)
 *
 * 시간대 인식 날짜 산술: Asia/Dubai 시간대에서 오늘 날짜를 가져온 후,
 * 날짜 컴포넌트(year, month, day)에 직접 일수를 추가하여 월/년 경계를 처리합니다.
 */
export function getDubaiDateAfterDays(days: number = 0): string {
    if (days === 0) {
        return getDubaiToday();
    }

    // 1. Asia/Dubai 시간대에서 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
    const todayStr = getDubaiToday();
    const [year, month, day] = todayStr.split("-").map(Number);

    // 2. Asia/Dubai 시간대 기준으로 날짜 객체 생성 (UTC+4)
    // Asia/Dubai는 항상 UTC+4 (DST 없음)이므로 명시적으로 지정
    const dubaiDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+04:00`);

    // 3. 일수 추가: Date 객체에 직접 밀리초 단위로 추가하면
    // 내부적으로 UTC로 변환 후 더하고, 포맷팅 시 Asia/Dubai로 변환됨
    const targetDate = new Date(dubaiDate.getTime() + days * 24 * 60 * 60 * 1000);

    // 4. Asia/Dubai 시간대로 다시 포맷팅 (Date 객체의 UTC 타임스탬프를 Asia/Dubai 시간대로 해석)
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return formatter.format(targetDate);
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 변환 (null-safe)
 * Python의 iso_date() 함수와 동일한 동작
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
 * 값이 비어있는지 확인 (Python의 pd.isna() 및 빈 문자열 체크와 동일)
 */
function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
}

/**
 * DRI Score 계산 (Document Readiness Index)
 * Python의 dri_score() 함수와 정확히 동일한 로직
 *
 * 필드: COMMERCIAL INVOICE No., INVOICE Date, COE, B/L No./\n AWB No.,
 *       VESSEL NAME/\n FLIGHT No., ETD, ETA, DO Collection, Customs\n Start
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
    ];

    const presentCount = fields.filter((field) => !isEmpty(field)).length;

    // Python: round(present / len(fields) * 100.0, 2)
    return Math.round((presentCount / fields.length) * 100.0 * 100) / 100;
}

/**
 * Gate 상태와 Triggers 계산
 * Python의 gate_and_triggers() 함수와 정확히 동일한 로직
 */
export function calculateGateAndTriggers(
    shipment: ShipmentRow,
    today: string = getDubaiToday()
): { gate: Gate; triggers: TriggerBadge[] } {
    const triggers: TriggerBadge[] = [];

    // 문서 누락 체크 (Python과 동일한 순서 및 조건)
    // Python: if pd.isna(row.get("DO Collection")): triggers.append("DO_MISSING")
    if (isEmpty(shipment.do_collection_date)) triggers.push("DO_MISSING");
    if (isEmpty(shipment.customs_start_date)) triggers.push("CUSTOMS_START_MISSING");
    if (isEmpty(shipment.delivery_date)) triggers.push("DELIVERY_DATE_MISSING");
    if (isEmpty(shipment.bl_awb_no)) triggers.push("BL_MISSING");
    if (isEmpty(shipment.incoterms)) triggers.push("INCOTERM_MISSING");

    // Gate 결정 로직 (Python gate_and_triggers()와 정확히 동일)
    // Python 코드:
    //   eta = pd.to_datetime(row.get("ETA"), errors="coerce")
    //   if pd.notna(eta) and eta < TODAY and ("DO_MISSING" in triggers or "CUSTOMS_START_MISSING" in triggers):
    //       gate = "RED"
    //   elif pd.notna(eta) and eta < TODAY and ("DELIVERY_DATE_MISSING" in triggers):
    //       gate = "AMBER"
    //   else:
    //       gate = "GREEN"

    const eta = shipment.eta;
    const isEtaValid = !isEmpty(eta);
    const isEtaPassed = isEtaValid && eta! < today;

    let gate: Gate;

    if (isEtaValid && isEtaPassed && (triggers.includes("DO_MISSING") || triggers.includes("CUSTOMS_START_MISSING"))) {
        gate = "RED";
    } else if (isEtaValid && isEtaPassed && triggers.includes("DELIVERY_DATE_MISSING")) {
        gate = "AMBER";
    } else {
        gate = "GREEN";
    }

    return { gate, triggers };
}

/**
 * 현재 위치 계산 (Warehouse dates 기준)
 * Python의 current_location_from_dates() 함수와 동일한 로직
 *
 * Python 매핑:
 *   ("MOSB", "MOSB"),
 *   ("DSV\n Indoor", "DSV Indoor"),
 *   ("DSV\n Outdoor", "DSV Outdoor"),
 *   ("DSV\n MZD", "DSV MZD"),
 *   ("JDN\n MZD", "JDN MZD"),
 *   ("JDN\n Waterfront", "JDN Waterfront"),
 *   ("SHU2", "SHU"),
 *   ("MIR3", "MIR"),
 *   ("DAS4", "DAS"),
 *   ("AGI5", "AGI"),
 */
export function calculateCurrentLocation(shipment: ShipmentRow): string | undefined {
    const wh = shipment.warehouse_inventory;
    if (!wh) return undefined;

    // Python과 동일한 순서와 매핑
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

    let best: { date: Date; label: string } | null = null;

    for (const [label, dateStr] of locationDates) {
        if (isEmpty(dateStr)) continue;
        try {
            const date = new Date(dateStr!);
            if (isNaN(date.getTime())) continue;

            // Python: if best is None or d > best[0]
            if (best === null || date > best.date) {
                best = { date, label };
            }
        } catch {
            continue;
        }
    }

    // Python: return best[1] if best else None
    return best?.label;
}

/**
 * ShipmentRow → WorklistRow 변환
 * Python의 main() 함수 내 row 생성 로직과 동일
 */
export function shipmentToWorklistRow(shipment: ShipmentRow, today?: string): WorklistRow {
    const driScore = calculateDriScore(shipment);
    const { gate, triggers } = calculateGateAndTriggers(shipment, today);
    const currentLocation = calculateCurrentLocation(shipment);

    // Python: subtitle = f"{r.get('VENDOR','-')} · {r.get('SHIP\\n MODE','-')} · {r.get('POL','-')}→{r.get('POD','-')}"
    const subtitle = [
        shipment.vendor || "-",
        shipment.ship_mode || "-",
        shipment.port_of_loading || "-",
        shipment.port_of_discharge ? `→${shipment.port_of_discharge}` : "",
    ]
        .filter((s) => s !== "" && s !== "-")
        .join(" · ");

    // Python: dueAt = iso_date(r.get("DELIVERY DATE")) or iso_date(r.get("ETA"))
    const dueAt = formatDate(shipment.delivery_date) || formatDate(shipment.eta);

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
 * KPI 계산
 * Python의 main() 함수 내 KPI 계산 로직과 동일
 */
export function calculateKpis(
    rows: WorklistRow[],
    today: string = getDubaiToday()
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

    // Python: dri_avg = round(df.apply(dri_score, axis=1).mean(), 2)
    // 모든 점수를 포함해야 함 (0점도 평균 계산에 포함)
    const scores = shipments.map((r) => r.score ?? 0);
    const driAvg = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0.0;

    // Python: red_count = sum(1 for x in rows if x["gate"] == "RED")
    const redCount = shipments.filter((r) => r.gate === "RED").length;

    // Python: overdue_count = sum(1 for x in rows if x.get("dueAt") and x["dueAt"] < today)
    const overdueCount = shipments.filter((r) => {
        if (!r.dueAt) return false;
        return r.dueAt < today;
    }).length;

    // Python: recoverable = round(float(df["DUTY AMT\n (AED)"].fillna(0).sum() + df["VAT AMT\n (AED)"].fillna(0).sum()), 2)
    const recoverableAED = shipments.reduce((sum, r) => {
        const duty = (r.meta?.duty_aed as number) ?? 0;
        const vat = (r.meta?.vat_aed as number) ?? 0;
        return sum + duty + vat;
    }, 0);

    return {
        driAvg,
        wsiAvg: 0.0, // TODO: WSI 계산 로직 구현 필요
        redCount,
        overdueCount,
        recoverableAED: Math.round(recoverableAED * 100) / 100,
        zeroStops: 0, // TODO: Zero Stops 계산 로직 구현 필요
    };
}
