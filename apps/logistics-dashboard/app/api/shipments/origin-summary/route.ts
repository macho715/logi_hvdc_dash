import { NextResponse } from "next/server"

import { extractOriginCountry } from "@/lib/logistics/normalizers"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import type { OriginSummaryRow } from "@/types/chain"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("port_of_loading")

    if (error) {
      console.error("shipments/origin-summary query error:", error)
      return NextResponse.json([] satisfies OriginSummaryRow[])
    }

    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      const country = extractOriginCountry(row.port_of_loading ?? null)
      if (!country) continue
      counts[country] = (counts[country] ?? 0) + 1
    }

    const payload = Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([country, count]) => ({ country, count }))

    return NextResponse.json(payload satisfies OriginSummaryRow[])
  } catch (error) {
    console.error("GET /api/shipments/origin-summary error:", error)
    return NextResponse.json([] satisfies OriginSummaryRow[])
  }
}
