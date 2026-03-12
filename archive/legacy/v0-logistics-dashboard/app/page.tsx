"use client"

import { useEffect, useRef } from "react"
import { useLogisticsStore } from "@/store/logisticsStore"
import { useLiveFeed } from "@/hooks/useLiveFeed"
import { fetchLocations, fetchLocationStatuses, fetchEvents } from "@/lib/api"
import { HeaderBar } from "@/components/dashboard/HeaderBar"
import { RightPanel } from "@/components/dashboard/RightPanel"
import { MapView } from "@/components/map/MapView"

export default function DashboardPage() {
  const initialLoadDone = useRef(false)

  // Connect to WebSocket for real-time updates
  useLiveFeed()

  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    async function loadInitialData() {
      const { setLocations, setLocationStatuses, mergeEvent, setLoading } = useLogisticsStore.getState()

      setLoading(true)
      try {
        const [locations, statuses, events] = await Promise.all([
          fetchLocations(),
          fetchLocationStatuses(),
          fetchEvents(),
        ])

        setLocations(locations)
        setLocationStatuses(statuses)
        events.forEach((event) => mergeEvent(event))
      } catch (error) {
        console.error("Failed to load initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, []) // Empty deps - store actions accessed via getState() are stable

  return (
    <div className="h-screen w-screen overflow-hidden bg-background dark">
      {/* Header Bar */}
      <HeaderBar />

      {/* Main Content */}
      <div className="flex h-full pt-14">
        {/* Map View - Full screen background */}
        <div className="flex-1 relative">
          <MapView />
        </div>

        {/* Right Panel */}
        <RightPanel />
      </div>
    </div>
  )
}
