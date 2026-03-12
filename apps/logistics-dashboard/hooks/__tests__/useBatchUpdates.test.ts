/**
 * Unit tests for useBatchUpdates hook
 * Tests batching logic and debounce behavior
 */

import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useBatchUpdates } from "../useBatchUpdates"

describe("useBatchUpdates", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("should batch multiple rapid updates", async () => {
    const onBatchReady = vi.fn()

    const { result } = renderHook(() =>
      useBatchUpdates({
        debounceMs: 500,
        onBatchReady,
      })
    )

    // Add multiple updates rapidly
    result.current({ id: 1, type: "UPDATE" })
    result.current({ id: 2, type: "UPDATE" })
    result.current({ id: 3, type: "UPDATE" })

    // Should not call onBatchReady yet
    expect(onBatchReady).not.toHaveBeenCalled()

    // Fast-forward debounce timer
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      // Should call once with all updates batched
      expect(onBatchReady).toHaveBeenCalledTimes(1)
      expect(onBatchReady).toHaveBeenCalledWith([
        { id: 1, type: "UPDATE" },
        { id: 2, type: "UPDATE" },
        { id: 3, type: "UPDATE" },
      ])
    })
  })

  it("should use longer debounce on mobile", async () => {
    const onBatchReady = vi.fn()

    const { result } = renderHook(() =>
      useBatchUpdates({
        debounceMs: 1000, // Mobile: 1s
        onBatchReady,
        isMobile: true,
      })
    )

    result.current({ id: 1 })

    // Fast-forward 500ms (should not trigger)
    vi.advanceTimersByTime(500)
    expect(onBatchReady).not.toHaveBeenCalled()

    // Fast-forward remaining 500ms
    vi.advanceTimersByTime(500)
    await waitFor(() => {
      expect(onBatchReady).toHaveBeenCalledTimes(1)
    })
  })

  it("should flush remaining batch on unmount", () => {
    const onBatchReady = vi.fn()

    const { result, unmount } = renderHook(() =>
      useBatchUpdates({
        debounceMs: 500,
        onBatchReady,
      })
    )

    result.current({ id: 1 })
    result.current({ id: 2 })

    // Unmount before debounce completes
    unmount()

    // Should flush immediately
    expect(onBatchReady).toHaveBeenCalledTimes(1)
    expect(onBatchReady).toHaveBeenCalledWith([
      { id: 1 },
      { id: 2 },
    ])
  })
})
