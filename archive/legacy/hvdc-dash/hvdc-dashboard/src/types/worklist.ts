export type Gate = "GREEN" | "AMBER" | "RED" | "ZERO";
export type RowKind = "SHIPMENT" | "WAREHOUSE" | "COST" | "EXCEPTION" | "ACTION";

export type TriggerBadge =
    | "DO_MISSING"
    | "CUSTOMS_START_MISSING"
    | "DELIVERY_DATE_MISSING"
    | "BL_MISSING"
    | "INCOTERM_MISSING"
    | "HS_RISK"
    | "DEMDET_RISK";

export interface WorklistRow {
    id: string;
    kind: RowKind;

    title: string;
    subtitle?: string;

    gate: Gate;
    score?: number;         // 0.00–100.00 (DRI/WSI) or Δ%
    dueAt?: string;         // YYYY-MM-DD
    eta?: string;           // YYYY-MM-DD
    owner?: string;
    lastSeenAt?: string;    // YYYY-MM-DD HH:mm

    currentLocation?: string;
    triggers: TriggerBadge[];

    ref: {
        shptNo?: string;
        whName?: string;
        invoiceNo?: string;
    };

    // Drawer 상세에 쓰는 원본 요약(선택)
    meta?: Record<string, unknown>;
}

export interface DashboardPayload {
    lastRefreshAt: string; // YYYY-MM-DD HH:mm (Asia/Dubai)
    kpis: {
        driAvg: number;
        wsiAvg: number;
        redCount: number;
        overdueCount: number;
        recoverableAED: number;
        zeroStops: number;
    };
    rows: WorklistRow[];
}
