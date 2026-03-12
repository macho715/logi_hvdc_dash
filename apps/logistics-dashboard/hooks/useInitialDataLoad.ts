"use client"

import { useEffect, useState, useRef } from "react"
import { useOpsStore } from "@repo/shared"
import type { DashboardPayload } from "@repo/shared"
import { getDubaiTimestamp } from "@/lib/worklist-utils"

export interface UseInitialDataLoadOptions {
  /**
   * Whether to load Option-C segment KPIs (requires /api/kpi/case-segments or /api/kpi/voyage-segments)
   */
  loadOptionCKpis?: boolean
  /**
   * Callback when initial load completes
   */
  onLoadComplete?: (payload: DashboardPayload) => void
  /**
   * Callback when load fails
   */
  onLoadError?: (error: Error) => void
}

/**
 * Hook for initial data load before establishing Realtime subscriptions.
 * Ensures UI has data immediately, preventing empty flicker.
 *
 * @example
 * ```tsx
 * const { isLoading, error } = useInitialDataLoad({
 *   loadOptionCKpis: true,
 *   onLoadComplete: (payload) => {
 *     console.log('Initial load complete:', payload)
 *   }
 * })
 * ```
 */
export function useInitialDataLoad(opts: UseInitialDataLoadOptions = {}) {
  const { loadOptionCKpis = false, onLoadComplete, onLoadError } = opts

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedRef = useRef(false)
  const { actions } = useOpsStore.getState()

  useEffect(() => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) return

    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 1. Load worklist data (KPIs + shipments)
        const worklistResponse = await fetch("/api/worklist")
        if (!worklistResponse.ok) {
          throw new Error(
            `Failed to load worklist: ${worklistResponse.statusText}`
          )
        }

        const worklistPayload: DashboardPayload = await worklistResponse.json()

        // Update store with initial data
        actions.setWorklistRows(worklistPayload.rows)
        actions.setKPIs(worklistPayload.kpis)
        if (worklistPayload.lastRefreshAt) {
          actions.setLastRefreshAt(worklistPayload.lastRefreshAt)
        }

        // 2. Optionally load Option-C segment KPIs
        if (loadOptionCKpis) {
          try {
            // Try case-segments endpoint first
            const caseSegmentsResponse = await fetch("/api/kpi/case-segments")
            if (caseSegmentsResponse.ok) {
              const caseSegmentsData = await caseSegmentsResponse.json()
              // Store segment KPIs if needed
              // actions.setCaseSegments(caseSegmentsData)
              console.log("Loaded case segments:", caseSegmentsData)
            } else {
              // Fallback to voyage-segments
              const voyageSegmentsResponse = await fetch(
                "/api/kpi/voyage-segments"
              )
              if (voyageSegmentsResponse.ok) {
                const voyageSegmentsData =
                  await voyageSegmentsResponse.json()
                // actions.setVoyageSegments(voyageSegmentsData)
                console.log("Loaded voyage segments:", voyageSegmentsData)
              } else {
                console.warn(
                  "Option-C KPI endpoints not available, skipping segment KPIs"
                )
              }
            }
          } catch (err) {
            // Non-critical: Option-C KPIs are optional
            console.warn("Failed to load Option-C KPIs:", err)
          }
        }

        hasLoadedRef.current = true
        setIsLoading(false)
        onLoadComplete?.(worklistPayload)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error during initial load")

        const fallback: DashboardPayload = {
          rows: [],
          kpis: {
            driAvg: 0,
            wsiAvg: 0,
            redCount: 0,
            overdueCount: 0,
            recoverableAED: 0,
            zeroStops: 0,
          },
          lastRefreshAt: getDubaiTimestamp(),
        }

        actions.setWorklistRows(fallback.rows)
        actions.setKPIs(fallback.kpis)
        actions.setLastRefreshAt(fallback.lastRefreshAt)

        hasLoadedRef.current = true
        setIsLoading(false)
        setError(null)
        onLoadComplete?.(fallback)
        onLoadError?.(error)
        console.warn("Initial worklist fetch failed, using fallback", error)
      }
    }

    loadInitialData()
  }, [loadOptionCKpis, onLoadComplete, onLoadError, actions])

  return {
    isLoading,
    error,
    hasLoaded: hasLoadedRef.current,
  }
}
