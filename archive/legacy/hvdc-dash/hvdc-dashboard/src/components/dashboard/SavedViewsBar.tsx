"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function SavedViewsBar() {
    const savedViews = useDashboardStore((s) => s.savedViews);
    const setActiveView = useDashboardStore((s) => s.setActiveView);
    const saveCurrentView = useDashboardStore((s) => s.saveCurrentView);
    const deleteView = useDashboardStore((s) => s.deleteView);
    const [name, setName] = useState("");

    return (
        <div className="flex flex-wrap items-center gap-2">
            {savedViews.map((v) => (
                <div key={v.id} className="flex items-center gap-1">
                    <button
                        className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-slate-50"
                        onClick={() => setActiveView(v.id)}
                    >
                        {v.name}
                    </button>
                    {v.id.startsWith("today_") || v.id === "red_gate" || v.id === "overdue" ? null : (
                        <button className="text-xs text-slate-500" onClick={() => deleteView(v.id)}>
                            ×
                        </button>
                    )}
                </div>
            ))}

            <div className="ml-auto flex items-center gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Save view name"
                    className="h-8 w-36 rounded-md border px-2 text-xs"
                />
                <button
                    className="h-8 rounded-md bg-slate-900 px-3 text-xs text-white"
                    onClick={() => {
                        if (!name.trim()) return;
                        saveCurrentView(name.trim());
                        setName("");
                    }}
                >
                    Save
                </button>
            </div>
        </div>
    );
}
