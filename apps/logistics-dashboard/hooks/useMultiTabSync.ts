"use client"

import { useEffect, useRef } from "react"

/**
 * Hook for synchronizing state across multiple browser tabs/windows.
 * MVP: Allow each tab to subscribe independently (Supabase handles this).
 * Phase 2: Can be extended with BroadcastChannel leader election if needed.
 *
 * @example
 * ```tsx
 * useMultiTabSync({
 *   onSync: (data) => {
 *     // Update local state from other tabs
 *   }
 * })
 * ```
 */
export interface UseMultiTabSyncOptions {
  /**
   * Callback when state is synced from another tab
   */
  onSync?: (data: any) => void
  /**
   * Whether to enable multi-tab sync (default: true for MVP)
   */
  enabled?: boolean
}

/**
 * MVP implementation: Each tab subscribes independently.
 * Supabase Realtime handles multiple subscriptions gracefully.
 *
 * Phase 2 enhancement: Use BroadcastChannel for leader election
 * to reduce duplicate subscriptions if needed.
 */
export function useMultiTabSync(opts: UseMultiTabSyncOptions = {}) {
  const { enabled = true, onSync } = opts
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") {
      return
    }

    // Create BroadcastChannel for cross-tab communication
    const channel = new BroadcastChannel("hvdc-dashboard-sync")
    broadcastChannelRef.current = channel

    // Listen for messages from other tabs
    channel.onmessage = (event) => {
      if (onSync && event.data?.type === "state-sync") {
        onSync(event.data.payload)
      }
    }

    return () => {
      channel.close()
      broadcastChannelRef.current = null
    }
  }, [enabled, onSync])

  /**
   * Broadcast state to other tabs (optional, for Phase 2)
   */
  const broadcast = (payload: any) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "state-sync",
        payload,
        timestamp: Date.now(),
      })
    }
  }

  return {
    broadcast,
  }
}
