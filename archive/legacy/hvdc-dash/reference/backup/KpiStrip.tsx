"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { Gauge, CircleAlert, Clock3, Coin } from "lucide-react";

/**
 * KpiStrip 컴포넌트
 *
 * 대시보드 상단에 DRI 평균, WSI 평균, Red 카운트, Overdue 카운트,
 * Recoverable AED, 마지막 갱신 시간을 표시합니다. 아이콘은 Lucide를 사용하여
 * 간단히 시각적 구분을 제공합니다. 값이 없는 경우 0 또는 "--" 로 표시됩니다.
 */
export function KpiStrip() {
  const kpis = useDashboardStore((s) => s.kpis);
  const lastRefreshAt = useDashboardStore((s) => s.lastRefreshAt);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <KpiCard
        label="DRI Avg"
        value={kpis.driAvg?.toFixed(2) || "0.00"}
        icon={<Gauge className="h-4 w-4 text-blue-600" />}
      />
      <KpiCard
        label="WSI Avg"
        value={kpis.wsiAvg?.toFixed(2) || "0.00"}
        icon={<Gauge className="h-4 w-4 text-indigo-600" />}
      />
      <KpiCard
        label="Red Count"
        value={kpis.redCount?.toString() || "0"}
        icon={<CircleAlert className="h-4 w-4 text-red-600" />}
      />
      <KpiCard
        label="Overdue"
        value={kpis.overdueCount?.toString() || "0"}
        icon={<Clock3 className="h-4 w-4 text-amber-600" />}
      />
      <KpiCard
        label="Recoverable (AED)"
        value={kpis.recoverableAED?.toFixed(2) || "0.00"}
        icon={<Coin className="h-4 w-4 text-green-600" />}
      />
      <KpiCard
        label="Last Refresh"
        value={lastRefreshAt || "--"}
        icon={<Clock3 className="h-4 w-4 text-gray-600" />}
      />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg p-2 shadow-sm">
      <div>{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
    </div>
  );
}