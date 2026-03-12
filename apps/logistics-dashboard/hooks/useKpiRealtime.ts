"use client"

import { useCallback, useEffect, useRef, useTransition } from "react"
import { useOpsStore, useOpsActions, type WorklistRow } from "@repo/shared"
import { calculateKpis, getDubaiToday, shipmentToWorklistRow, type ShipmentRow } from "@/lib/worklist-utils"
import { useSupabaseRealtime, type Binding } from "./useSupabaseRealtime"
import { useBatchUpdates } from "./useBatchUpdates"

/**
 * Hook for managing KPI Realtime updates via Supabase Postgres Changes.
 * Implements Option A+ strategy: subscribe to shipments changes, batch updates,
 * and recalculate KPIs client-side.
 *
 * @example
 * ```tsx
 * const { status } = useKpiRealtime({
 *   enabled: true,
 *   onStatusChange: (status) => console.log('KPI Realtime status:', status)
 * })
 * ```
 */
export interface UseKpiRealtimeOptions {
  enabled?: boolean
  onStatusChange?: (status: "connecting" | "live" | "polling" | "offline") => void
  isMobile?: boolean
}

export function useKpiRealtime(opts: UseKpiRealtimeOptions = {}) {
  const { enabled = true, onStatusChange, isMobile = false } = opts

  const actions = useOpsActions()
  const worklistRowsRef = useRef(useOpsStore.getState().worklistRows)

  // Keep worklistRowsRef in sync with store
  // Use useEffect to subscribe to store changes
  useEffect(() => {
    const unsubscribe = useOpsStore.subscribe((state) => {
      worklistRowsRef.current = state.worklistRows
    })
    return unsubscribe
  }, [])

  // Use React.useTransition for non-urgent KPI updates (performance optimization)
  const [isPending, startTransition] = useTransition()

  // Handle batched shipment updates with performance monitoring
  const handleBatchUpdate = useCallback(
    (batch: any[]) => {
      // Performance monitoring: track commit_timestamp → render latency
      const batchStartTime = performance.now()
      let earliestCommitTime: number | null = null

      // Extract commit_timestamp from payloads if available
      for (const payload of batch) {
        if (payload.commit_timestamp) {
          const commitTime = new Date(payload.commit_timestamp).getTime()
          if (earliestCommitTime === null || commitTime < earliestCommitTime) {
            earliestCommitTime = commitTime
          }
        }
      }

      const currentRows = worklistRowsRef.current
      const today = getDubaiToday()

      // Process each update in the batch
      const updatedRows = [...currentRows]
      let hasChanges = false

      for (const payload of batch) {
        // Supabase Realtime payload: eventType or type field
        const eventType = payload.eventType || payload.type
        const newRecord = payload.new
        const oldRecord = payload.old

        if (eventType === "INSERT" && newRecord) {
          // Convert new shipment to WorklistRow and add
          try {
            const shipmentRow: ShipmentRow = {
              id: newRecord.id,
              sct_ship_no: newRecord.sct_ship_no,
              mr_number: newRecord.mr_number,
              commercial_invoice_no: newRecord.commercial_invoice_no,
              invoice_date: newRecord.invoice_date,
              vendor: newRecord.vendor,
              main_description: newRecord.main_description,
              port_of_loading: newRecord.port_of_loading,
              port_of_discharge: newRecord.port_of_discharge,
              vessel_name: newRecord.vessel_name,
              bl_awb_no: newRecord.bl_awb_no,
              ship_mode: newRecord.ship_mode,
              coe: newRecord.coe,
              etd: newRecord.etd,
              eta: newRecord.eta,
              do_collection_date: newRecord.do_collection_date,
              customs_start_date: newRecord.customs_start_date,
              customs_close_date: newRecord.customs_close_date,
              delivery_date: newRecord.delivery_date,
              duty_amount_aed: newRecord.duty_amount_aed,
              vat_amount_aed: newRecord.vat_amount_aed,
              incoterms: newRecord.incoterms,
              flow_code: newRecord.flow_code,
              flow_code_original: newRecord.flow_code_original,
              flow_override_reason: newRecord.flow_override_reason,
              final_location: newRecord.final_location,
              warehouse_inventory: newRecord.warehouse_inventory,
            }

            const worklistRow = shipmentToWorklistRow(shipmentRow, today)
            if (worklistRow) {
              updatedRows.push(worklistRow)
              hasChanges = true
            }
          } catch (err) {
            console.error("Error converting new shipment to WorklistRow:", err)
          }
        } else if (eventType === "UPDATE" && newRecord) {
          // Update existing row
          const index = updatedRows.findIndex(
            (r) => r.id === newRecord.id || r.meta?.shipment_id === newRecord.id
          )

          if (index >= 0) {
            try {
              const shipmentRow: ShipmentRow = {
                id: newRecord.id,
                sct_ship_no: newRecord.sct_ship_no,
                mr_number: newRecord.mr_number,
                commercial_invoice_no: newRecord.commercial_invoice_no,
                invoice_date: newRecord.invoice_date,
                vendor: newRecord.vendor,
                main_description: newRecord.main_description,
                port_of_loading: newRecord.port_of_loading,
                port_of_discharge: newRecord.port_of_discharge,
                vessel_name: newRecord.vessel_name,
                bl_awb_no: newRecord.bl_awb_no,
                ship_mode: newRecord.ship_mode,
                coe: newRecord.coe,
                etd: newRecord.etd,
                eta: newRecord.eta,
                do_collection_date: newRecord.do_collection_date,
                customs_start_date: newRecord.customs_start_date,
                customs_close_date: newRecord.customs_close_date,
                delivery_date: newRecord.delivery_date,
                duty_amount_aed: newRecord.duty_amount_aed,
                vat_amount_aed: newRecord.vat_amount_aed,
                incoterms: newRecord.incoterms,
                flow_code: newRecord.flow_code,
                flow_code_original: newRecord.flow_code_original,
                flow_override_reason: newRecord.flow_override_reason,
                final_location: newRecord.final_location,
                warehouse_inventory: newRecord.warehouse_inventory,
              }

              const worklistRow = shipmentToWorklistRow(shipmentRow, today)
              if (worklistRow) {
                updatedRows[index] = worklistRow
                hasChanges = true
              }
            } catch (err) {
              console.error("Error updating shipment to WorklistRow:", err)
            }
          }
        } else if (eventType === "DELETE" && oldRecord) {
          // Remove deleted row
          const index = updatedRows.findIndex(
            (r) => r.id === oldRecord.id || r.meta?.shipment_id === oldRecord.id
          )

          if (index >= 0) {
            updatedRows.splice(index, 1)
            hasChanges = true
          }
        }
      }

      // Update store and recalculate KPIs if there were changes
      // Use startTransition for non-urgent updates (prevents blocking UI)
      if (hasChanges) {
        startTransition(() => {
          actions.setWorklistRows(updatedRows)
          const newKpis = calculateKpis(updatedRows, today)
          actions.setKPIs(newKpis)
          actions.setLastRefreshAt(new Date().toISOString())

          // Performance monitoring: log latency if commit_timestamp available
          if (earliestCommitTime !== null) {
            const renderTime = performance.now()
            const totalLatency = renderTime - batchStartTime
            const dbToRenderLatency = renderTime - earliestCommitTime

            // Log if p95 threshold exceeded (3s = 3000ms)
            if (dbToRenderLatency > 3000) {
              console.warn(
                `[Performance] KPI update latency exceeded 3s: ${dbToRenderLatency.toFixed(0)}ms (batch processing: ${totalLatency.toFixed(0)}ms)`
              )
            } else if (process.env.NODE_ENV === "development") {
              console.log(
                `[Performance] KPI update latency: ${dbToRenderLatency.toFixed(0)}ms (batch: ${totalLatency.toFixed(0)}ms)`
              )
            }
          }
        })
      }
    },
    [actions, startTransition]
  )

  // Batch updates to avoid excessive recalculations
  const addToBatch = useBatchUpdates({
    debounceMs: isMobile ? 1000 : 500,
    onBatchReady: handleBatchUpdate,
    isMobile,
  })

  // Realtime subscription bindings
  const bindings: Binding[] = [
    {
      schema: "public",
      table: "shipments",
      event: "*", // INSERT, UPDATE, DELETE
    },
  ]

  // Subscribe to Realtime changes
  const { status } = useSupabaseRealtime({
    channelName: "kpi:shipments",
    bindings,
    enabled,
    onChange: addToBatch,
    onStatus: onStatusChange,
  })

  return {
    status,
    isPending, // React transition pending state
  }
}
