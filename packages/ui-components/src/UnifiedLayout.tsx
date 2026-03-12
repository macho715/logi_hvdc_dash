"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapView } from "./map/MapView"
import { RightPanel } from "./dashboard/RightPanel"
import { KpiStrip } from "./dashboard/KpiStrip"
import { WorklistTable } from "./dashboard/WorklistTable"
import { DetailDrawer } from "./dashboard/DetailDrawer"
import { HeaderBar } from "./dashboard/HeaderBar"
import { useLogisticsStore } from "@/store/logisticsStore"
import { useDashboardStore } from "@/store/dashboardStore"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { fetchLocations, fetchLocationStatuses, fetchEvents } from "@/lib/api"

/**
 * UnifiedLayout - HVDC + Logistics 통합 레이아웃
 * 
 * 레이아웃 불변 (AGENTS.md 기준):
 * - 좌측: MapView (maplibre-gl + deck.gl)
 * - 우측: RightPanel (위치 상태 정보)
 * - 하단: HVDC Panel (KPI Strip + Worklist Table)
 * 
 * 모바일 대응:
 * - 하단 패널 드래그 제스처
 * - 모바일 드로어 오버레이 모드
 * - 터치 인터랙션 최적화
 * 
 * 접근성 (WCAG 2.2 AA):
 * - 키보드 네비게이션 지원
 * - ARIA 레이블
 * - ESC 키로 드로어 닫기
 * 
 * Flow Code v3.5 통합 (Logi ontol core doc 기준):
 * - WorklistTable에 Flow Code 컬럼 표시 (0-5)
 * - AGI/DAS 규칙 검증: final_location이 AGI/DAS인 경우 flow_code ≥ 3 필수
 * - AGI/DAS 규칙 위반 시 경고 배지 표시
 * - Flow Code 배지 색상: 0=Gray, 1=Blue, 2=Green, 3=Orange, 4=Purple, 5=Red
 * 
 * OCR KPI Gates (CONSOLIDATED-03 기준):
 * - documents 테이블의 OCR KPI Gate 통과 여부 확인
 * - MeanConf ≥ 0.92, TableAcc ≥ 0.98, NumericIntegrity = 1.00, EntityMatch ≥ 0.98
 * - KPI Gate 실패 시 ZERO mode 전환 (자동)
 */
export function UnifiedLayout() {
  const initialLoadDone = useRef(false)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState(300) // 모바일 패널 높이 (px)
  const panelDragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  // Logistics Store
  const setLocations = useLogisticsStore((state) => state.setLocations)
  const setLocationStatuses = useLogisticsStore((state) => state.setLocationStatuses)
  const mergeEvent = useLogisticsStore((state) => state.mergeEvent)
  const setLoading = useLogisticsStore((state) => state.setLoading)

  // Dashboard Store
  const applyPayload = useDashboardStore((state) => state.applyPayload)
  const closeDrawer = useDashboardStore((state) => state.closeDrawer)

  // Connect to WebSocket for real-time updates
  useLiveFeed()

  // 초기 데이터 로드
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    async function loadInitialData() {
      setLoading(true)
      try {
        // Logistics 데이터 로드
        const [locations, statuses, events] = await Promise.all([
          fetchLocations(),
          fetchLocationStatuses(),
          fetchEvents(),
        ])

        setLocations(locations)
        setLocationStatuses(statuses)
        events.forEach((event) => mergeEvent(event))

        // HVDC 데이터 로드
        const worklistResponse = await fetch("/api/worklist")
        if (worklistResponse.ok) {
          const payload = await worklistResponse.json()
          applyPayload(payload)
        }
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [setLocations, setLocationStatuses, mergeEvent, setLoading, applyPayload])

  // ESC 키로 드로어 닫기 (접근성)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [closeDrawer])

  // 모바일 패널 드래그 핸들러
  const handlePanelDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    panelDragRef.current = {
      startY: clientY,
      startHeight: panelHeight,
    }
  }, [panelHeight])

  const handlePanelDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!panelDragRef.current) return

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = panelDragRef.current.startY - clientY
    const newHeight = Math.max(200, Math.min(600, panelDragRef.current.startHeight + deltaY))
    setPanelHeight(newHeight)
  }, [])

  const handlePanelDragEnd = useCallback(() => {
    panelDragRef.current = null
  }, [])

  useEffect(() => {
    if (panelDragRef.current) {
      document.addEventListener('mousemove', handlePanelDragMove)
      document.addEventListener('mouseup', handlePanelDragEnd)
      document.addEventListener('touchmove', handlePanelDragMove, { passive: false })
      document.addEventListener('touchend', handlePanelDragEnd)

      return () => {
        document.removeEventListener('mousemove', handlePanelDragMove)
        document.removeEventListener('mouseup', handlePanelDragEnd)
        document.removeEventListener('touchmove', handlePanelDragMove)
        document.removeEventListener('touchend', handlePanelDragEnd)
      }
    }
  }, [handlePanelDragMove, handlePanelDragEnd])

  return (
    <div className="min-h-screen w-full bg-background dark">
      {/* Header Bar */}
      <HeaderBar />

      {/* Main Content Area */}
      <div className="flex min-h-screen pt-14">
        {/* Left: MapView */}
        <div className="flex-1 relative min-w-0 min-h-0" role="main" aria-label="Logistics Map View">
          <MapView />
        </div>

        {/* Right: RightPanel (Desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0 min-h-0" aria-label="Location Status Panel">
          <RightPanel />
        </aside>
      </div>

      {/* Bottom: HVDC Panel (Desktop) */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-80 bg-card border-t border-border z-40" aria-label="HVDC Worklist Panel">
        <div className="h-96 flex flex-col">
          <div className="p-4 border-b">
            <KpiStrip />
          </div>
          <div className="flex-1 overflow-auto">
            <WorklistTable />
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Panel with Drag Handle */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 rounded-t-lg shadow-lg"
        aria-label="HVDC Worklist Panel (Mobile)"
      >
        {/* Drag Handle */}
        <div
          className="h-1 bg-border rounded-full mx-auto w-12 mt-2 mb-2 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handlePanelDragStart}
          onTouchStart={handlePanelDragStart}
          role="button"
          aria-label="Drag to resize panel"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setMobilePanelOpen(!mobilePanelOpen)
            }
          }}
        />

        {/* Panel Content */}
        <div
          className="overflow-hidden transition-all duration-200"
          style={{ height: `${panelHeight}px` }}
        >
          <div className="p-4 border-b">
            <KpiStrip />
          </div>
          <div className="flex-1 overflow-auto" style={{ height: `${panelHeight - 120}px` }}>
            <WorklistTable />
          </div>
        </div>
      </div>

      {/* Detail Drawer (Desktop: Sidepanel, Mobile: Overlay) */}
      <div className="hidden lg:block">
        <DetailDrawer mode="sidepanel" />
      </div>
      <div className="lg:hidden">
        <DetailDrawer mode="overlay" />
      </div>
    </div>
  )
}
