"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useOpsActions, useWorklistRows } from "@repo/shared"
import { HeaderBar } from "@/components/dashboard/HeaderBar"
import { KpiStrip } from "@/components/hvdc/KpiStrip"
import { StageCardsStrip } from "@/components/hvdc/StageCardsStrip"
import { WorklistTable } from "@/components/hvdc/WorklistTable"
import { DetailDrawer } from "@/components/hvdc/DetailDrawer"
import { MapView } from "@/components/map/MapView"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { useInitialDataLoad } from "@/hooks/useInitialDataLoad"
import { fetchEvents, fetchLocationStatuses, fetchLocations } from "@/lib/api"
import type { HvdcBucket } from "@/lib/hvdc/buckets"

const MIN_PANEL_HEIGHT = 200
const MAX_PANEL_HEIGHT = 600
const DEFAULT_PANEL_HEIGHT = 260

export function UnifiedLayout() {
  const mapDataLoadDone = useRef(false)
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
  const panelDragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const actions = useOpsActions()
  const worklistRows = useWorklistRows()

  useInitialDataLoad({
    loadOptionCKpis: false,
    onLoadComplete: (payload) => {
      console.log("Initial worklist/KPI load complete:", payload)
    },
  })

  useLiveFeed()

  useEffect(() => {
    if (mapDataLoadDone.current) return
    mapDataLoadDone.current = true

    async function loadMapData() {
      try {
        const [locations, statuses, events] = await Promise.all([
          fetchLocations(),
          fetchLocationStatuses(),
          fetchEvents(),
        ])

        actions.setLocations(locations)
        actions.setLocationStatuses(statuses)
        actions.setEvents(events)
      } catch (error) {
        console.error("Failed to load map data:", error)
      }
    }

    loadMapData()
  }, [actions])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        actions.setDrawerOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [actions])

  const handlePanelDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!panelDragRef.current) return

    if ("cancelable" in e && e.cancelable) {
      e.preventDefault()
    }

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    const deltaY = panelDragRef.current.startY - clientY
    const nextHeight = panelDragRef.current.startHeight + deltaY
    const clampedHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, nextHeight))
    setPanelHeight(clampedHeight)
  }, [])

  const handlePanelDragEnd = useCallback(() => {
    panelDragRef.current = null
    document.removeEventListener("mousemove", handlePanelDragMove)
    document.removeEventListener("mouseup", handlePanelDragEnd)
    document.removeEventListener("touchmove", handlePanelDragMove)
    document.removeEventListener("touchend", handlePanelDragEnd)
  }, [handlePanelDragMove])

  const handlePanelDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      panelDragRef.current = {
        startY: clientY,
        startHeight: panelHeight,
      }

      document.addEventListener("mousemove", handlePanelDragMove)
      document.addEventListener("mouseup", handlePanelDragEnd)
      document.addEventListener("touchmove", handlePanelDragMove, { passive: false })
      document.addEventListener("touchend", handlePanelDragEnd)
    },
    [handlePanelDragEnd, handlePanelDragMove, panelHeight],
  )

  useEffect(() => () => handlePanelDragEnd(), [handlePanelDragEnd])

  const activeBucket = (() => {
    const raw = searchParams.get("bucket")
    if (raw === "cumulative" || raw === "current" || raw === "future") {
      return raw as HvdcBucket
    }
    return undefined
  })()

  useEffect(() => {
    if (activeBucket) {
      actions.setFilters({ bucket: activeBucket })
    } else {
      actions.setFilters({ bucket: undefined })
    }
  }, [actions, activeBucket])

  const handleNavigateBucket = useCallback(
    (bucket: HvdcBucket) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("bucket", bucket)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      <HeaderBar />

      <div className="flex-1 overflow-hidden pt-24 flex flex-col pb-[260px] lg:pb-0">
        <div className="flex flex-1 min-h-0">
          <div className="flex-[2] relative min-w-0 min-h-0" role="main" aria-label="Logistics Map View">
            <MapView />
          </div>
          <div className="hidden lg:block flex-[1] relative min-w-0 min-h-0">
            <DetailDrawer mode="sidepanel" />
          </div>
        </div>

        <div className="hidden lg:block w-full bg-card border-t border-border" aria-label="HVDC Worklist Panel">
          <div className="h-80 flex flex-col">
            <div className="p-4 border-b space-y-3">
              <StageCardsStrip rows={worklistRows} onNavigateBucket={handleNavigateBucket} activeBucket={activeBucket} />
              <KpiStrip />
            </div>
            <div className="flex-1 overflow-auto">
              <WorklistTable />
            </div>
          </div>
        </div>
      </div>

      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 rounded-t-lg shadow-lg"
        aria-label="HVDC Worklist Panel (Mobile)"
      >
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
              setPanelHeight((height) =>
                height <= MIN_PANEL_HEIGHT + 8 ? DEFAULT_PANEL_HEIGHT : MIN_PANEL_HEIGHT,
              )
            }
          }}
        />

        <div className="overflow-hidden transition-all duration-200" style={{ height: `${panelHeight}px` }}>
          <div className="p-4 border-b space-y-3">
            <StageCardsStrip rows={worklistRows} onNavigateBucket={handleNavigateBucket} activeBucket={activeBucket} />
            <KpiStrip />
          </div>
          <div className="flex-1 overflow-auto" style={{ height: `${panelHeight - 120}px` }}>
            <WorklistTable />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <DetailDrawer mode="overlay" />
      </div>
    </div>
  )
}

export default UnifiedLayout
