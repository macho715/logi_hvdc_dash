"use client";

import { getDubaiDateAfterDays, getDubaiToday } from "@/lib/worklist-utils";
import { useDashboardStore } from "@/store/dashboardStore";
import type { Gate } from "@/types/worklist";
import { useMemo } from "react";

function gateClass(g: Gate) {
    if (g === "ZERO") return "bg-black text-white";
    if (g === "RED") return "bg-red-600 text-white";
    if (g === "AMBER") return "bg-amber-500 text-black";
    return "bg-emerald-600 text-white";
}

function fmtDate(d?: string) {
    return d ?? "-";
}

export function WorklistTable() {
    const rows = useDashboardStore((s) => s.rows);
    const filters = useDashboardStore((s) => s.filters);
    const selectRow = useDashboardStore((s) => s.selectRow);
    const selectedRowId = useDashboardStore((s) => s.selectedRowId);

    const visible = useMemo(() => {
        const q = (filters.q ?? "").toLowerCase().trim();
        // Asia/Dubai 시간대 기준 오늘 날짜 (API와 일관성 유지)
        const today = getDubaiToday();

        const filtered = rows.filter((r) => {
            if (filters.gate && filters.gate !== "ALL" && r.gate !== filters.gate) return false;
            if (filters.kind && filters.kind !== "ALL" && r.kind !== filters.kind) return false;
            if (filters.owner && filters.owner !== "ALL" && (r.owner ?? "") !== filters.owner) return false;
            if (q && !(r.title.toLowerCase().includes(q) || (r.subtitle ?? "").toLowerCase().includes(q))) return false;

            // Due 필터 로직 (Asia/Dubai 시간대 기준)
            if (filters.due === "OVERDUE") {
                if (!r.dueAt) return false;
                if (r.dueAt >= today) return false;
            } else if (filters.due === "DUE_7D") {
                if (!r.dueAt) return false;
                // 오늘부터 7일 후까지 (Asia/Dubai 시간대 기준으로 일관성 유지)
                const sevenDaysLaterStr = getDubaiDateAfterDays(7);
                if (r.dueAt < today || r.dueAt > sevenDaysLaterStr) return false;
            }

            return true;
        });

        // 기본 정렬: gate 우선(RED/ZERO) → dueAt asc
        const gateRank = (g: Gate) => (g === "ZERO" ? 0 : g === "RED" ? 1 : g === "AMBER" ? 2 : 3);
        filtered.sort((a, b) => {
            const gr = gateRank(a.gate) - gateRank(b.gate);
            if (gr !== 0) return gr;
            return (a.dueAt ?? "9999-12-31").localeCompare(b.dueAt ?? "9999-12-31");
        });

        return filtered.slice(0, 50);
    }, [rows, filters]);

    return (
        <div className="overflow-auto rounded-lg border">
            <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-700">
                    <tr>
                        <th className="px-3 py-2 text-left">Gate</th>
                        <th className="px-3 py-2 text-left">Title</th>
                        <th className="px-3 py-2 text-left">ETA</th>
                        <th className="px-3 py-2 text-left">Due</th>
                        <th className="px-3 py-2 text-left">Location</th>
                        <th className="px-3 py-2 text-left">Triggers</th>
                        <th className="px-3 py-2 text-right">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((r) => {
                        const active = r.id === selectedRowId;
                        return (
                            <tr
                                key={r.id}
                                className={`cursor-pointer border-t hover:bg-slate-50 ${active ? "bg-slate-100" : "bg-white"}`}
                                onClick={() => selectRow(r.id)}
                            >
                                <td className="px-3 py-2">
                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${gateClass(r.gate)}`}>
                                        {r.gate}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="font-medium">{r.title}</div>
                                    <div className="text-xs text-slate-500">{r.subtitle ?? "-"}</div>
                                </td>
                                <td className="px-3 py-2">{fmtDate(r.eta)}</td>
                                <td className="px-3 py-2">{fmtDate(r.dueAt)}</td>
                                <td className="px-3 py-2">{r.currentLocation ?? "-"}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        {r.triggers.slice(0, 3).map((t) => (
                                            <span key={t} className="rounded border bg-white px-1.5 py-0.5 text-xs text-slate-700">
                                                {t}
                                            </span>
                                        ))}
                                        {r.triggers.length > 3 && (
                                            <span className="rounded border bg-white px-1.5 py-0.5 text-xs text-slate-500">
                                                +{r.triggers.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{r.score?.toFixed(2) ?? "-"}</td>
                            </tr>
                        );
                    })}
                    {visible.length === 0 && (
                        <tr>
                            <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                                No results (check filters)
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
