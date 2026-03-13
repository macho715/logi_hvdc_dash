import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export interface VendorsResponse {
  vendors: { vendor: string; count: number }[]
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('vendor')

    if (error) {
      console.error('vendors query error:', error)
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
      .map(([vendor, count]) => ({ vendor, count }))

    return NextResponse.json({ vendors } satisfies VendorsResponse)
  } catch (err) {
    console.error('GET /api/shipments/vendors error:', err)
    return NextResponse.json({ vendors: [] } satisfies VendorsResponse)
  }
}
