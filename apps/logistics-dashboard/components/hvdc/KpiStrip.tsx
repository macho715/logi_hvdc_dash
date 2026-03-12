"use client"

import { useKpiRealtime } from "@/hooks/useKpiRealtime"

export function KpiStrip() {
  /**
   * KPI Dashboard(UI) 제거: 레이아웃 안정화 목적.
   * - Option A(권장): UI는 숨기되, KPI store를 다른 곳에서 쓸 가능성 대비해 Realtime 구독은 유지.
   * - Option B: 아래 useKpiRealtime 호출도 제거(리소스 최소).
   */
  useKpiRealtime({ enabled: true })
  return null
}
