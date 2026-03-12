"use client";

import { useDashboardStore } from "@/store/dashboardStore";

export function KpiStrip() {
    const kpis = useDashboardStore((s) => s.kpis);
    const lastRefreshAt = useDashboardStore((s) => s.lastRefreshAt);

    // 안전한 값 처리 (undefined 방지)
    const safeKpis = {
        driAvg: kpis?.driAvg ?? 0,
        wsiAvg: kpis?.wsiAvg ?? 0,
        redCount: kpis?.redCount ?? 0,
        overdueCount: kpis?.overdueCount ?? 0,
        recoverableAED: kpis?.recoverableAED ?? 0,
    };

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Card k="DRI Avg" v={safeKpis.driAvg.toFixed(2)} />
            <Card k="WSI Avg" v={safeKpis.wsiAvg.toFixed(2)} />
            <Card k="Red Count" v={safeKpis.redCount.toFixed(0)} />
            <Card k="Overdue" v={safeKpis.overdueCount.toFixed(0)} />
            <Card k="Recoverable (AED)" v={safeKpis.recoverableAED.toFixed(2)} />
            <Card k="Last Refresh" v={lastRefreshAt ?? "-"} />
        </div>
    );
}

function Card({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{v}</div>
        </div>
    );
}
