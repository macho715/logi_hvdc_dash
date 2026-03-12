"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function DetailDrawer({ mode }: { mode: "sidepanel" | "overlay" }) {
    const rows = useDashboardStore((s) => s.rows);
    const selectedRowId = useDashboardStore((s) => s.selectedRowId);
    const drawerOpen = useDashboardStore((s) => s.drawerOpen);
    const closeDrawer = useDashboardStore((s) => s.closeDrawer);
    const drawerTab = useDashboardStore((s) => s.drawerTab);
    const setDrawerTab = useDashboardStore((s) => s.setDrawerTab);

    const row = useMemo(() => rows.find((r) => r.id === selectedRowId), [rows, selectedRowId]);

    const content = (
        <div className="h-full rounded-xl border bg-white">
            <div className="flex items-start justify-between border-b p-4">
                <div>
                    <div className="text-sm font-semibold">{row?.title ?? "Select an item"}</div>
                    <div className="text-xs text-slate-500">{row?.subtitle ?? "-"}</div>
                </div>
                {mode === "overlay" && (
                    <button className="rounded-md border px-2 py-1 text-xs" onClick={closeDrawer}>
                        Close
                    </button>
                )}
            </div>

            <div className="flex gap-2 border-b p-2 text-xs">
                {(["overview", "timeline", "docs", "warehouse", "cost", "evidence"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setDrawerTab(t)}
                        className={`rounded-md px-2 py-1 ${drawerTab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="p-4 text-sm">
                {!row ? (
                    <div className="text-slate-500">Pick a row from the worklist to view details.</div>
                ) : drawerTab === "overview" ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <KV k="Gate" v={row.gate} />
                        <KV k="Score" v={row.score?.toFixed(2) ?? "-"} />
                        <KV k="ETA" v={row.eta ?? "-"} />
                        <KV k="Due" v={row.dueAt ?? "-"} />
                        <KV k="Location" v={row.currentLocation ?? "-"} />
                        <KV k="Owner" v={row.owner ?? "-"} />
                    </div>
                ) : (
                    <pre className="overflow-auto rounded-md bg-slate-50 p-3 text-xs">
                        {JSON.stringify(row.meta ?? row, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );

    if (mode === "sidepanel") return content;

    // overlay (mobile)
    return (
        <>
            {drawerOpen && (
                <div className="fixed inset-0 z-50 bg-black/40" onClick={closeDrawer} aria-hidden="true" />
            )}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 h-[70vh] transform transition-transform ${drawerOpen ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                {content}
            </div>
        </>
    );
}

function KV({ k, v }: { k: string; v: string }) {
    return (
        <div className="rounded-lg border bg-white p-2">
            <div className="text-[11px] text-slate-500">{k}</div>
            <div className="mt-1 font-medium">{v}</div>
        </div>
    );
}
