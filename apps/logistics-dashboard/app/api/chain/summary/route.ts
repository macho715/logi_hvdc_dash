import { NextRequest, NextResponse } from "next/server"

import { classifyStage, type PipelineStage } from "@/lib/cases/pipelineStage"
import { getRouteTypeIdsForFlowCodes, isOverviewRouteTypeId } from "@/lib/overview/routeTypes"
import {
  extractOriginCountry,
  normalizePortName,
  normalizeSite,
} from "@/lib/logistics/normalizers"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import type { ChainSummary } from "@/types/chain"

const EMPTY_SUMMARY: ChainSummary = {
  origins: [],
  ports: [],
  stages: {
    "pre-arrival": 0,
    port: 0,
    warehouse: 0,
    mosb: 0,
    site: 0,
  },
  sites: {
    land: { SHU: 0, MIR: 0 },
    island: { DAS: 0, AGI: 0 },
  },
  mosbTransit: 0,
}

function sortCounts(record: Record<string, number>) {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))
}

/** Fetch all v_cases rows using pagination (PostgREST db-max-rows=1000 per page). */
async function fetchAllCasesForChain() {
  const PAGE = 1000
  const allRows: Array<{
    site: string | null
    flow_code: number | null
    status_current: string | null
    status_location: string | null
  }> = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("v_cases")
      .select("site, flow_code, status_current, status_location")
      .range(offset, offset + PAGE - 1)
      .order("id")

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  return allRows
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteFilter = searchParams.get('site')
    const routeTypeFilter = searchParams.get('route_type')
    const [casesData, shipmentsResult] = await Promise.all([
      fetchAllCasesForChain(),
      supabase
        .from("shipments")
        .select("port_of_loading, port_of_discharge"),
    ])

    if (shipmentsResult.error) {
      console.error("chain/summary shipments query error:", shipmentsResult.error)
      return NextResponse.json(EMPTY_SUMMARY)
    }

    const stages: Record<PipelineStage, number> = {
      "pre-arrival": 0,
      port: 0,
      warehouse: 0,
      mosb: 0,
      site: 0,
    }

    const siteCounts = {
      land: { SHU: 0, MIR: 0 },
      island: { DAS: 0, AGI: 0 },
    }

    let mosbTransit = 0
    const filteredCases = casesData.filter((row) => {
      if (siteFilter && siteFilter !== 'all' && row.site !== siteFilter) return false
      if (routeTypeFilter === 'review-required') {
        return row.flow_code == null || row.flow_code === 5
      }
      if (routeTypeFilter && isOverviewRouteTypeId(routeTypeFilter)) {
        return row.flow_code != null && getRouteTypeIdsForFlowCodes(routeTypeFilter).includes(row.flow_code)
      }
      return true
    })

    for (const row of filteredCases) {
      const stage = classifyStage(row.status_current ?? null, row.status_location ?? null)
      stages[stage]++

      const site = normalizeSite(row.site ?? null)
      if (site === "SHU") siteCounts.land.SHU++
      if (site === "MIR") siteCounts.land.MIR++
      if (site === "DAS") siteCounts.island.DAS++
      if (site === "AGI") siteCounts.island.AGI++

      if (row.flow_code === 3 || row.flow_code === 4) {
        mosbTransit++
      }
    }

    const originCounts: Record<string, number> = {}
    const portCounts: Record<string, number> = {}

    for (const row of shipmentsResult.data ?? []) {
      const origin = extractOriginCountry(row.port_of_loading ?? null)
      if (origin) {
        originCounts[origin] = (originCounts[origin] ?? 0) + 1
      }

      const port = normalizePortName(row.port_of_discharge ?? null)
      if (port) {
        portCounts[port] = (portCounts[port] ?? 0) + 1
      }
    }

    return NextResponse.json({
      origins: sortCounts(originCounts).map(({ name, count }) => ({ country: name, count })),
      ports: sortCounts(portCounts),
      stages,
      sites: siteCounts,
      mosbTransit,
    } satisfies ChainSummary)
  } catch (error) {
    console.error("GET /api/chain/summary error:", error)
    return NextResponse.json(EMPTY_SUMMARY)
  }
}
