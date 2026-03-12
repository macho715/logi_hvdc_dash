"use client"

import { useEffect, useRef } from "react"
import { useOpsStore } from "@repo/shared"
import { useLogisticsStore } from "@/store/logisticsStore"
import type { WSMessage } from "@/types/logistics"

const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

export function useLiveFeed() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || ""

    const { setConnected } = useLogisticsStore.getState()
    const { actions } = useOpsStore.getState()

    function scheduleReconnect() {
      if (!isMountedRef.current) return

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return
        console.log(`Reconnecting in ${reconnectDelayRef.current}ms...`)
        connect()
        // Exponential backoff
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY)
      }, reconnectDelayRef.current)
    }

    function connect() {
      if (!WS_URL) {
        console.warn("No WebSocket URL configured (NEXT_PUBLIC_WS_URL)")
        return
      }

      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMountedRef.current) return
          console.log("WebSocket connected")
          setConnected(true)
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
        }

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return
          try {
            const message: WSMessage = JSON.parse(event.data)

            if (message.type === "event") {
              actions.mergeEvent(message.payload)
            } else if (message.type === "location_status") {
              useOpsStore.setState((state) => ({
                locationStatusesById: {
                  ...state.locationStatusesById,
                  [message.payload.location_id]: message.payload,
                },
              }))
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err)
          }
        }

        ws.onclose = () => {
          if (!isMountedRef.current) return
          console.log("WebSocket disconnected")
          setConnected(false)
          scheduleReconnect()
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          ws.close()
        }
      } catch (err) {
        console.error("Failed to create WebSocket:", err)
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      isMountedRef.current = false
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, []) // Empty deps - store actions accessed via getState() are stable

  return {
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    },
  }
}
