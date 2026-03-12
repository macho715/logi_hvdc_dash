"use client";

import { useDashboardStore } from "@/store/dashboardStore";

/**
 * WorklistToolbar
 *
 * 필터 및 검색 바를 제공합니다. Gate 상태 필터와 검색 입력이 있습니다.
 */
export function WorklistToolbar() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const gateOptions: Array<{ label: string; value: string | null }> = [
    { label: "All", value: null },
    { label: "RED", value: "RED" },
    { label: "AMBER", value: "AMBER" },
    { label: "GREEN", value: "GREEN" },
  ];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Gate filter buttons */}
      <div className="flex items-center gap-1">
        {gateOptions.map((opt) => {
          const isActive = filters.gate === opt.value || (!filters.gate && opt.value === null);
          return (
            <button
              key={opt.label}
              className={
                isActive
                  ? "px-3 py-1 text-xs rounded-full border bg-blue-600 text-white border-blue-600"
                  : "px-3 py-1 text-xs rounded-full border bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }
              onClick={() => setFilter("gate", opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {/* Search input */}
      <input
        type="text"
        placeholder="Search..."
        value={filters.searchQuery || ""}
        onChange={(e) => setFilter("searchQuery", e.target.value)}
        className="flex-1 px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}