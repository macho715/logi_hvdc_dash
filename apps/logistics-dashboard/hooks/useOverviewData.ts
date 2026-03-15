'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { useOpsActions, useOpsStore } from '@repo/shared'
import { useInitialDataLoad } from '@/hooks/useInitialDataLoad'
import type { OverviewCockpitResponse, OverviewRuntimeState } from '@/types/overview'

const POLL_INTERVAL_MS = 30_000

type UseOverviewDataOptions = {
  refreshKey?: number
  primeWorklist?: boolean
}

export function useOverviewData(options?: UseOverviewDataOptions): OverviewRuntimeState {
  const actions = useOpsActions()
  const worklist = useOpsStore((state) => state.worklistRows)
  const shouldPrimeWorklist = options?.primeWorklist === true && worklist.length === 0
  useInitialDataLoad({ enabled: shouldPrimeWorklist })
  const [data, setData] = useState<OverviewCockpitResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useEffectEvent(async () => {
    try {
      setLoading((current) => current && data == null)
      const response = await fetch('/api/overview', {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Overview fetch failed: ${response.status}`)
      }

      const payload = (await response.json()) as OverviewCockpitResponse
      setData(payload)
      setError(null)
      actions.setLocations(payload.map.locations)
      actions.setLocationStatuses(payload.map.statuses)
      actions.setEvents(payload.map.events)
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Overview fetch failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  })

  // useEffectEvent functions are stable references — must NOT go in dependency arrays
  useEffect(() => {
    void loadOverview()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof document === 'undefined') return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const refreshVisibleState = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }

      if (document.visibilityState !== 'visible') return
      intervalId = setInterval(() => {
        void loadOverview()
      }, POLL_INTERVAL_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadOverview()
      }
      refreshVisibleState()
    }

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadOverview()
      }
    }

    refreshVisibleState()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!options?.refreshKey) return
    void loadOverview()
  }, [options?.refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    worklist,
  }
}
