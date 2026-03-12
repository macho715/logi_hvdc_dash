/**
 * Unit tests for useSupabaseRealtime hook
 * Tests hook lifecycle, cleanup, and error handling
 */

import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useSupabaseRealtime, type Binding } from "../useSupabaseRealtime"
import { supabase } from "@/lib/supabase"

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

describe("useSupabaseRealtime", () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback) => {
      // Simulate SUBSCRIBED status
      setTimeout(() => callback("SUBSCRIBED"), 10)
      return mockChannel
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabase.channel as any).mockReturnValue(mockChannel)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should create channel and subscribe on mount", async () => {
    const bindings: Binding[] = [
      {
        schema: "public",
        table: "shipments",
        event: "*",
      },
    ]

    const onChange = vi.fn()
    const onStatus = vi.fn()

    renderHook(() =>
      useSupabaseRealtime({
        channelName: "test-channel",
        bindings,
        onChange,
        onStatus,
      })
    )

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("test-channel", {
        config: {
          presence: {
            key: "",
          },
        },
      })
      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "*",
          schema: "public",
          table: "shipments",
        }),
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  it("should cleanup channel on unmount", () => {
    const bindings: Binding[] = [
      {
        schema: "public",
        table: "shipments",
      },
    ]

    const { unmount } = renderHook(() =>
      useSupabaseRealtime({
        channelName: "test-channel",
        bindings,
        onChange: vi.fn(),
      })
    )

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it("should handle CHANNEL_ERROR with retry", async () => {
    const bindings: Binding[] = [
      {
        schema: "public",
        table: "shipments",
      },
    ]

    const onStatus = vi.fn()

    // Mock subscribe to call callback with CHANNEL_ERROR
    mockChannel.subscribe = vi.fn((callback) => {
      setTimeout(() => callback("CHANNEL_ERROR"), 10)
      return mockChannel
    })

    vi.useFakeTimers()

    renderHook(() =>
      useSupabaseRealtime({
        channelName: "test-channel",
        bindings,
        onChange: vi.fn(),
        onStatus,
      })
    )

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith("polling")
    })

    // Fast-forward retry timer
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      // Should retry subscription
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(2)
    })

    vi.useRealTimers()
  })

  it("should support schema-qualified table names", () => {
    const bindings: Binding[] = [
      {
        schema: "case",
        table: "events_case",
        event: "INSERT",
      },
    ]

    renderHook(() =>
      useSupabaseRealtime({
        channelName: "test-case-events",
        bindings,
        onChange: vi.fn(),
      })
    )

    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        schema: "case",
        table: "events_case",
        event: "INSERT",
      }),
      expect.any(Function)
    )
  })
})
