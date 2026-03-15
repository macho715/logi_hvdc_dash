import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface VendorsResponse {
  vendors: string[]
}

export async function GET() {
  try {
    // Primary: query pre-aggregated view (voyage-grain, server-side counting)
    const { data: viewData, error: viewError } = await supabase
      .from('v_vendor_list')
      .select('vendor, shipment_count')

    if (!viewError && viewData && viewData.length > 0) {
      const vendors = viewData.map((r: { vendor: string; shipment_count: number }) => r.vendor)
      return NextResponse.json({ vendors } satisfies VendorsResponse)
    }

    if (viewError) {
      console.warn('v_vendor_list query error (falling back to shipments):', viewError)
    }

    // Fallback: count JS-side from public.shipments
    const { data, error } = await supabase
      .from('shipments')
      .select('vendor')

    if (error) {
      console.error('vendors fallback query error:', error)
      return NextResponse.json({ vendors: [] } satisfies VendorsResponse)
    }

    const countMap: Record<string, number> = {}
    for (const row of data ?? []) {
      if (row.vendor) {
        countMap[row.vendor] = (countMap[row.vendor] ?? 0) + 1
      }
    }

    const vendors = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([vendor]) => vendor)

    return NextResponse.json({ vendors } satisfies VendorsResponse)
  } catch (err) {
    console.error('GET /api/shipments/vendors error:', err)
    return NextResponse.json({ vendors: [] } satisfies VendorsResponse)
  }
}
