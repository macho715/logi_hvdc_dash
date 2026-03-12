"use client"

import { useEffect, useRef, useState } from "react"
import { useKpiRealtime } from "./useKpiRealtime"
import type { RealtimeStatus } from "./useSupabaseRealtime"

/**
 * Hook that combines Realtime subscriptions with fallback polling.
 * Polls only when Realtime is unhealthy (polling/offline status).
 */
export interface UseKpiRealtimeWithFallbackOptions {
  enabled?: boolean
  pollIntervalMs?: number // Default: 60s when Realtime unhealthy
  onStatusChange?: (status: RealtimeStatus) => void
  isMobile?: boolean
  onPoll?: () => Promise<void>
}

export function useKpiRealtimeWithFallback(
  opts: UseKpiRealtimeWithFallbackOptions = {}
) {
  const {
    enabled = true,
    pollIntervalMs = 60_000, // 60 seconds
    onStatusChange,
    isMobile = false,
    onPoll,
  } = opts

  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting")
  const pollTimerRef = useRef<number | null>(null)

  // Realtime subscription
  const { status } = useKpiRealtime({
    enabled,
    onStatusChange: (newStatus) => {
      setRealtimeStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    isMobile,
  })

  // Fallback polling when Realtime is unhealthy
  useEffect(() => {
    // Clear existing poll timer
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }

    // Only poll if Realtime is not live
    if (realtimeStatus !== "live" && enabled) {
      const poll = async () => {
        if (onPoll) {
          await onPoll()
        } else {
          // Default: fetch worklist
          try {
            const response = await fetch("/api/worklist")
            if (response.ok) {
              const payload = await response.json()
              // Store will be updated by the payload handler
              console.log("Fallback poll completed")
            }
          } catch (err) {
            console.error("Fallback poll failed:", err)
          }
        }
      }

      // Poll immediately, then on interval
      poll()
      pollTimerRef.current = window.setInterval(poll, pollIntervalMs)
    }

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [realtimeStatus, enabled, pollIntervalMs, onPoll])

  return {
    status: realtimeStatus,
  }
}
