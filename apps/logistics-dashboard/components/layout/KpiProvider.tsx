'use client'

import { useKpiRealtime } from '@/hooks/useKpiRealtime'

/** Mount inside (dashboard)/layout.tsx to keep Realtime subscription alive across pages */
export function KpiProvider() {
  useKpiRealtime({ enabled: true })
  return null
}
