"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import type { WorklistRow } from "@/types/worklist";

/**
 * WorklistTable
 *
 * 필터된 선적 목록을 테이블 형태로 보여줍니다. 게이트 색상에 따라 라벨을 표시하고,
 * 행을 클릭하면 DetailDrawer에 상세 정보가 표시됩니다.
 */
export function WorklistTable() {
  const rows = useDashboardStore((s) => s.rows);
  const filters = useDashboardStore((s) => s.filters);
  const selection = useDashboardStore((s) => s.selection);
  const selectRow = useDashboardStore((s) => s.selectRow);
  // 필터링 로직: 게이트 및 검색어
  const filtered = rows.filter((row) => {
    const gateOk = filters.gate ? row.gate === filters.gate : true;
    const query = (filters.searchQuery || "").toLowerCase();
    const matchesQuery = query
      ? row.title.toLowerCase().includes(query) ||
        (row.subtitle || "").toLowerCase().includes(query)
      : true;
    return gateOk && matchesQuery;
  });
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="px-2 py-1 text-left">Gate</th>
            <th className="px-2 py-1 text-left">Shipment</th>
            <th className="px-2 py-1 text-left">ETA</th>
            <th className="px-2 py-1 text-left">Due</th>
            <th className="px-2 py-1 text-left">Location</th>
            <th className="px-2 py-1 text-left">DRI</th>
            <th className="px-2 py-1 text-left">Triggers</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const isSelected = selection === row.id;
            return (
              <tr
                key={row.id}
                onClick={() => selectRow(row.id)}
                className={
                  isSelected
                    ? "bg-blue-50 cursor-pointer"
                    : "hover:bg-gray-50 cursor-pointer"
                }
              >
                <td className="px-2 py-1">
                  <GateBadge gate={row.gate} />
                </td>
                <td className="px-2 py-1">
                  <div className="font-mono text-gray-800">{row.title}</div>
                  {row.subtitle && <div className="text-xs text-gray-500">{row.subtitle}</div>}
                </td>
                <td className="px-2 py-1">{row.eta || "--"}</td>
                <td className="px-2 py-1">{row.dueAt || "--"}</td>
                <td className="px-2 py-1">{row.currentLocation || "--"}</td>
                <td className="px-2 py-1">{row.score?.toFixed(1) ?? "--"}</td>
                <td className="px-2 py-1 space-x-1">
                  {row.triggers.map((t) => (
                    <span
                      key={t}
                      className="inline-block px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800"
                    >
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-4 text-gray-500">
                No shipments found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * GateBadge
 *
 * Gate 상태에 따라 색상을 지정하여 라벨을 출력합니다.
 */
function GateBadge({ gate }: { gate: WorklistRow["gate"] }) {
  const colourMap: Record<string, string> = {
    RED: "bg-red-600 text-white",
    AMBER: "bg-amber-500 text-white",
    GREEN: "bg-green-600 text-white",
    ZERO: "bg-gray-400 text-white",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded-full ${colourMap[gate] || "bg-gray-300 text-gray-800"}`}
    >
      {gate}
    </span>
  );
}