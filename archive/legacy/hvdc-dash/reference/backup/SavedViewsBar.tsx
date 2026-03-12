"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { Plus, Star } from "lucide-react";

/**
 * SavedViewsBar
 *
 * 사용자가 필터 조합을 저장하고 재사용할 수 있는 뷰 리스트를 보여줍니다.
 * 현재는 간단한 구현으로 이름 없는 뷰를 연속 번호로 저장합니다.
 */
export function SavedViewsBar() {
  const savedViews = useDashboardStore((s) => s.savedViews);
  const addSavedView = useDashboardStore((s) => s.addSavedView);
  const applySavedView = useDashboardStore((s) => s.applySavedView);
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {savedViews.map((view, idx) => (
        <button
          key={idx}
          onClick={() => applySavedView(idx)}
          className="flex items-center gap-1 px-2 py-1 text-xs border rounded-lg bg-gray-50 hover:bg-gray-100"
        >
          <Star className="h-3 w-3 text-yellow-500" />
          {view.name}
        </button>
      ))}
      <button
        onClick={() => {
          const name = `View ${savedViews.length + 1}`;
          addSavedView(name);
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs border rounded-lg bg-white hover:bg-gray-100"
      >
        <Plus className="h-3 w-3 text-gray-500" />
        Save View
      </button>
    </div>
  );
}