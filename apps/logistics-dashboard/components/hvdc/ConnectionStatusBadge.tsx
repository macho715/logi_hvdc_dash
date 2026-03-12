"use client"

import { useMemo } from "react"
import type { RealtimeStatus } from "@/hooks/useSupabaseRealtime"

export interface ConnectionStatusBadgeProps {
  status: RealtimeStatus
  lastUpdatedAt?: Date
  details?: string
}

/**
 * Connection status badge component for displaying Realtime connection state.
 * WCAG 2.2 AA compliant with icon + label text (not color alone).
 */
export function ConnectionStatusBadge(props: ConnectionStatusBadgeProps) {
  const { status, lastUpdatedAt, details } = props

  const statusConfig = useMemo(() => {
    switch (status) {
      case "live":
        return {
          label: "Live",
          icon: "●",
          className: "text-green-500",
          bgClassName: "bg-green-500/10 border-green-500/20",
          ariaLabel: "Realtime connection active",
        }
      case "polling":
        return {
          label: "Polling",
          icon: "◐",
          className: "text-amber-500",
          bgClassName: "bg-amber-500/10 border-amber-500/20",
          ariaLabel: "Using fallback polling mode",
        }
      case "offline":
        return {
          label: "Offline",
          icon: "○",
          className: "text-red-500",
          bgClassName: "bg-red-500/10 border-red-500/20",
          ariaLabel: "Connection offline, showing cached data",
        }
      case "connecting":
        return {
          label: "Connecting",
          icon: "⟳",
          className: "text-blue-500",
          bgClassName: "bg-blue-500/10 border-blue-500/20",
          ariaLabel: "Connecting to Realtime",
        }
      default:
        return {
          label: "Unknown",
          icon: "?",
          className: "text-gray-500",
          bgClassName: "bg-gray-500/10 border-gray-500/20",
          ariaLabel: "Unknown connection status",
        }
    }
  }, [status])

  const timeAgo = useMemo(() => {
    if (!lastUpdatedAt) return null
    const seconds = Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }, [lastUpdatedAt])

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${statusConfig.bgClassName}`}
      role="status"
      aria-live="polite"
      aria-label={statusConfig.ariaLabel}
      title={details || statusConfig.ariaLabel}
    >
      <span className={statusConfig.className} aria-hidden="true">
        {statusConfig.icon}
      </span>
      <span className="font-medium">{statusConfig.label}</span>
      {timeAgo && (
        <span className="text-muted-foreground text-[10px]">
          {timeAgo}
        </span>
      )}
    </div>
  )
}
