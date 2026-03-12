"use client"

import { useRef, useCallback, useEffect } from "react"

export interface UseBatchUpdatesOptions {
  /**
   * Debounce delay in milliseconds (desktop: 300-500ms, mobile: ~1000ms)
   */
  debounceMs?: number
  /**
   * Callback when batch is ready to be processed
   */
  onBatchReady: (batch: any[]) => void
  /**
   * Whether running on mobile (uses longer debounce)
   */
  isMobile?: boolean
}

/**
 * Hook for batching multiple rapid updates into a single processing cycle.
 * Required for p95 < 3s target by reducing KPI recalculation frequency.
 *
 * @example
 * ```tsx
 * const flushBatch = useBatchUpdates({
 *   debounceMs: isMobile ? 1000 : 500,
 *   onBatchReady: (batch) => {
 *     // Process all updates at once
 *     batch.forEach(update => applyUpdate(update))
 *     recalculateKPIs()
 *   }
 * })
 *
 * // In Realtime onChange handler:
 * flushBatch(payload)
 * ```
 */
export function useBatchUpdates(opts: UseBatchUpdatesOptions) {
  const { debounceMs, onBatchReady, isMobile = false } = opts

  const bufferRef = useRef<any[]>([])
  const flushTimerRef = useRef<number | null>(null)

  // Default debounce: 500ms desktop, 1000ms mobile
  const effectiveDebounceMs =
    debounceMs ?? (isMobile ? 1000 : 500)

  const flushBatch = useCallback(() => {
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }

    const batch = bufferRef.current
    bufferRef.current = []

    if (batch.length > 0) {
      onBatchReady(batch)
    }
  }, [onBatchReady])

  const addToBatch = useCallback(
    (payload: any) => {
      bufferRef.current.push(payload)

      // Schedule flush if not already scheduled
      if (flushTimerRef.current === null) {
        flushTimerRef.current = window.setTimeout(() => {
          flushTimerRef.current = null
          flushBatch()
        }, effectiveDebounceMs)
      }
    },
    [effectiveDebounceMs, flushBatch]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current)
      }
      // Flush any remaining items
      if (bufferRef.current.length > 0) {
        flushBatch()
      }
    }
  }, [flushBatch])

  return addToBatch
}
