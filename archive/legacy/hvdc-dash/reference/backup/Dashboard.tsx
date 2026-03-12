"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { KpiStrip } from "./dashboard/KpiStrip";
import { SavedViewsBar } from "./dashboard/SavedViewsBar";
import { WorklistToolbar } from "./dashboard/WorklistToolbar";
import { WorklistTable } from "./dashboard/WorklistTable";
import { DetailDrawer } from "./dashboard/DetailDrawer";

/**
 * Dashboard Page Component
 *
 * Worklist와 KPI를 포함한 대시보드 페이지입니다. 서버 API에서 데이터를
 * 가져와 Zustand 스토어에 적용하며, 5분마다 자동 갱신합니다. 로딩/에러
 * 상태를 적절히 처리하여 사용자에게 피드백을 제공합니다.
 */
export default function Dashboard() {
  const applyPayload = useDashboardStore((s) => s.applyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorklist() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/worklist");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const payload = await response.json();
        applyPayload(payload);
      } catch (err: any) {
        console.error("Failed to fetch worklist:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchWorklist();
    const interval = setInterval(fetchWorklist, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [applyPayload]);

  return (
    <div className="flex flex-col gap-4">
      {loading && (
        <div className="rounded-lg border bg-white p-4 text-center text-sm text-slate-500">
          Loading worklist data...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Error: {error} (Using fallback data)
        </div>
      )}
      <KpiStrip />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-xl border bg-white">
          <div className="flex flex-col gap-3 p-4">
            <SavedViewsBar />
            <WorklistToolbar />
            <WorklistTable />
          </div>
        </section>
        <aside className="hidden lg:block">
          <DetailDrawer mode="sidepanel" />
        </aside>
        {/* mobile drawer overlay */}
        <div className="lg:hidden">
          <DetailDrawer mode="overlay" />
        </div>
      </div>
    </div>
  );
}