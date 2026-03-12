"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export type RealtimeStatus = "connecting" | "live" | "polling" | "offline"

export type Binding = {
  schema: string
  table: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  filter?: string
}

export interface UseSupabaseRealtimeOptions {
  channelName: string
  bindings: Binding[]
  enabled?: boolean
  onChange: (payload: any) => void
  onStatus?: (status: RealtimeStatus) => void
  supabaseClient?: SupabaseClient
}

const MAX_RETRY_DELAY = 30_000 // 30 seconds
const INITIAL_RETRY_DELAY = 500 // 500ms

/**
 * Hook for managing Supabase Realtime subscriptions with automatic reconnection,
 * error handling, and mobile-friendly pause/resume.
 *
 * @example
 * ```tsx
 * const { status } = useSupabaseRealtime({
 *   channelName: 'kpi:shipments',
 *   bindings: [{
 *     schema: 'public',
 *     table: 'shipments',
 *     event: '*'
 *   }],
 *   onChange: (payload) => {
 *     console.log('Change detected:', payload)
 *   },
 *   onStatus: (status) => {
 *     console.log('Connection status:', status)
 *   }
 * })
 * ```
 */
export function useSupabaseRealtime(opts: UseSupabaseRealtimeOptions) {
  const {
    channelName,
    bindings,
    enabled = true,
    onChange,
    onStatus,
    supabaseClient = supabase,
  } = opts

  const channelRef = useRef<RealtimeChannel | null>(null)
  const [status, setStatus] = useState<RealtimeStatus>("connecting")
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const isVisibleRef = useRef(true)

  const updateStatus = useCallback(
    (newStatus: RealtimeStatus) => {
      if (!isMountedRef.current) return
      setStatus(newStatus)
      onStatus?.(newStatus)
    },
    [onStatus]
  )

  const subscribe = useCallback(() => {
    if (!enabled || !isMountedRef.current) return

    // Clean up existing channel if any
    if (channelRef.current) {
      try {
        supabaseClient.removeChannel(channelRef.current)
      } catch (err) {
        console.warn("Error removing existing channel:", err)
      }
      channelRef.current = null
    }

    updateStatus("connecting")

    const channel = supabaseClient.channel(channelName, {
      config: {
        // Enable presence if needed in future
        presence: {
          key: "",
        },
      },
    })

    // Add postgres_changes listeners for each binding
    bindings.forEach((binding) => {
      const config: {
        event: string
        schema: string
        table: string
        filter?: string
      } = {
        event: binding.event ?? "*",
        schema: binding.schema,
        table: binding.table,
      }

      if (binding.filter) {
        config.filter = binding.filter
      }

      channel.on("postgres_changes" as any, config, (payload: any) => {
        if (!isMountedRef.current || !isVisibleRef.current) return
        onChange(payload)
      })
    })

    // Subscribe and handle status changes
    channel.subscribe((status) => {
      if (!isMountedRef.current) return

      if (status === "SUBSCRIBED") {
        retryCountRef.current = 0
        updateStatus("live")
        return
      }

      // Handle error states
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        updateStatus("polling")
        retryCountRef.current += 1

        // Exponential backoff: 500ms, 1s, 2s, 4s, ... max 30s
        const backoffMs = Math.min(
          MAX_RETRY_DELAY,
          INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1)
        )

        // Clear existing retry timer
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current)
        }

        // Schedule retry
        retryTimerRef.current = window.setTimeout(() => {
          if (!isMountedRef.current) return

          try {
            // Remove failed channel before retrying
            if (channelRef.current) {
              supabaseClient.removeChannel(channelRef.current)
            }
          } catch (err) {
            console.warn("Error removing channel during retry:", err)
          } finally {
            // Retry subscription
            subscribe()
          }
        }, backoffMs)

        console.warn(
          `Realtime subscription error (${status}), retrying in ${backoffMs}ms...`
        )
      }
    })

    channelRef.current = channel
  }, [enabled, channelName, bindings, onChange, supabaseClient, updateStatus])

  // Handle visibility changes (mobile background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return

      if (document.visibilityState === "hidden") {
        isVisibleRef.current = false
        // Optional: pause subscriptions when backgrounded
        // For now, we keep them active but don't process updates
      } else {
        isVisibleRef.current = true
        // Resume: if channel was removed, reconnect
        if (!channelRef.current && enabled) {
          subscribe()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [enabled, subscribe])

  // Main subscription effect
  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      subscribe()
    }

    return () => {
      isMountedRef.current = false

      // Clear retry timer
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }

      // Remove channel
      if (channelRef.current) {
        try {
          supabaseClient.removeChannel(channelRef.current)
        } catch (err) {
          console.warn("Error removing channel on unmount:", err)
        }
        channelRef.current = null
      }
    }
  }, [enabled, subscribe, supabaseClient])

  return {
    status,
    channel: channelRef.current,
  }
}
