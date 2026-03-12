"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { X } from "lucide-react";

interface DetailDrawerProps {
  /**
   * sidepanel: 고정 오른쪽 패널 (lg breakpoint 이상에서 사용)
   * overlay: 작은 화면에서 전체 overlay 모달 형태
   */
  mode: "sidepanel" | "overlay";
}

/**
 * DetailDrawer
 *
 * 선택된 선적의 상세 정보를 표시하는 드로어입니다. 상태와 메타데이터를
 * 보여주며, 간단한 탭 네비게이션을 제공합니다. 현재는 overview 탭만
 * 구현되었습니다.
 */
export function DetailDrawer({ mode }: DetailDrawerProps) {
  const rows = useDashboardStore((s) => s.rows);
  const selection = useDashboardStore((s) => s.selection);
  const ui = useDashboardStore((s) => s.ui);
  const setDrawerOpen = useDashboardStore((s) => s.setDrawerOpen);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);
  // 선택한 row 찾기
  const row = rows.find((r) => r.id === selection);
  const isOpen = ui.drawerOpen && !!selection;
  if (mode === "overlay" && !isOpen) {
    return null;
  }
  return (
    <div
      className={
        mode === "overlay"
          ? `fixed inset-0 z-40 bg-black bg-opacity-25 flex items-end`
          : `border-l bg-white h-full flex flex-col`
      }
    >
      {mode === "overlay" && isOpen && (
        <div className="absolute inset-0" onClick={() => setDrawerOpen(false)}></div>
      )}
      {/* Drawer content */}
      <div
        className={
          mode === "overlay"
            ? `relative w-full max-h-[80%] bg-white rounded-t-lg shadow-xl flex flex-col`
            : `w-full h-full flex flex-col`
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="font-mono font-semibold text-gray-800">
            {row?.title ?? "Select a shipment"}
          </div>
          {mode === "overlay" && (
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex border-b text-xs overflow-x-auto">
          {[
            "overview",
            "timeline",
            "docs",
            "warehouse",
            "cost",
            "evidence",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                ui.activeTab === tab
                  ? "px-3 py-2 border-b-2 border-blue-600 text-blue-600"
                  : "px-3 py-2 text-gray-600 hover:text-gray-800"
              }
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="p-4 overflow-y-auto text-sm flex-1">
          {!row && <p className="text-gray-500">Pick a row from the worklist to view details.</p>}
          {row && ui.activeTab === "overview" && (
            <div className="space-y-2">
              <div>
                <span className="text-gray-500">Vendor: </span>
                <span className="font-medium text-gray-800">{row.meta?.vendor || "--"}</span>
              </div>
              <div>
                <span className="text-gray-500">Incoterms: </span>
                <span className="font-medium text-gray-800">{row.meta?.incoterms || "--"}</span>
              </div>
              <div>
                <span className="text-gray-500">ETA: </span>
                <span className="font-medium text-gray-800">{row.eta || "--"}</span>
              </div>
              <div>
                <span className="text-gray-500">Due: </span>
                <span className="font-medium text-gray-800">{row.dueAt || "--"}</span>
              </div>
              <div>
                <span className="text-gray-500">Location: </span>
                <span className="font-medium text-gray-800">{row.currentLocation || "--"}</span>
              </div>
              <div>
                <span className="text-gray-500">DRI Score: </span>
                <span className="font-medium text-gray-800">{row.score?.toFixed(1) ?? "--"}</span>
              </div>
              {/* Trigger 리스트 */}
              {row.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {row.triggers.map((t) => (
                    <span
                      key={t}
                      className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full"
                    >
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* 다른 탭들에 대한 컨텐츠는 추후 구현 */}
          {row && ui.activeTab !== "overview" && (
            <p className="text-gray-500">Not implemented yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}