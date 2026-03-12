import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { StockRow, StockResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const sku = searchParams.get('sku')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    let query = supabase
      .schema('wh')
      .from('stock_onhand')
      .select(
        'id, no, sku, description, location, pallet_id, qty, shipping_ref, date_received',
        { count: 'exact' }
      )

    if (location && location !== 'all') query = query.eq('location', location)
    if (sku && sku !== 'all') query = query.ilike('sku', `%${sku}%`)

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1).order('no')

    const { data, error, count } = await query

    if (error) {
      console.error('stock_onhand query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies StockResponse)
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    } satisfies StockResponse)
  } catch (err) {
    console.error('GET /api/stock error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies StockResponse)
  }
}
