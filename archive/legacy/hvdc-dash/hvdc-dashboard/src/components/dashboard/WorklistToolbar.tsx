"use client";

import { useDashboardStore } from "@/store/dashboardStore";

export function WorklistToolbar() {
    const filters = useDashboardStore((s) => s.filters);
    const setFilters = useDashboardStore((s) => s.setFilters);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <select
                className="h-9 rounded-md border bg-white px-2 text-xs"
                value={filters.gate ?? "ALL"}
                onChange={(e) => setFilters({ gate: e.target.value as any })}
            >
                <option value="ALL">Gate: ALL</option>
                <option value="RED">Gate: RED</option>
                <option value="AMBER">Gate: AMBER</option>
                <option value="GREEN">Gate: GREEN</option>
                <option value="ZERO">Gate: ZERO</option>
            </select>

            <select
                className="h-9 rounded-md border bg-white px-2 text-xs"
                value={filters.due ?? "ALL"}
                onChange={(e) => setFilters({ due: e.target.value as any })}
            >
                <option value="ALL">Due: ALL</option>
                <option value="OVERDUE">Due: OVERDUE</option>
                <option value="DUE_7D">Due: 7D</option>
            </select>

            <input
                className="h-9 w-64 rounded-md border px-2 text-xs"
                placeholder="Search shptNo / vendor / POL / POD..."
                value={filters.q ?? ""}
                onChange={(e) => setFilters({ q: e.target.value })}
            />
        </div>
    );
}
