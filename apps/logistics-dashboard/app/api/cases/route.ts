import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { CaseRow, CasesResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site')
    const flow_code = searchParams.get('flow_code')
    const vendor = searchParams.get('vendor')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)
    // status_current supports repeating params: ?status_current=warehouse&status_current=Pre+Arrival
    const status_current_values = searchParams.getAll('status_current')

    let query = supabase
      .from('v_cases')
      .select(
        `id, case_no, site, flow_code, flow_description,
         status_current, status_location, final_location,
         sqm, source_vendor, storage_type, stack_status,
         category, sct_ship_no, site_arrival_date`,
        { count: 'exact' }
      )

    if (site && site !== 'all') query = query.eq('site', site)
    if (flow_code && flow_code !== 'all') query = query.eq('flow_code', parseInt(flow_code, 10))
    if (vendor && vendor !== 'all') {
      if (vendor === 'Other') {
        query = query.not('source_vendor', 'in', '(Hitachi,Siemens)')
      } else {
        query = query.eq('source_vendor', vendor)
      }
    }
    if (category && category !== 'all') query = query.eq('category', category)
    if (location && location !== 'all') query = query.eq('status_location', location)
    if (status_current_values.length === 1 && status_current_values[0] !== 'all') {
      query = query.eq('status_current', status_current_values[0])
    } else if (status_current_values.length > 1) {
      query = query.in('status_current', status_current_values)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('case_no')

    const { data, error, count } = await query

    if (error) {
      console.error('cases query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies CasesResponse)
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    } satisfies CasesResponse)
  } catch (err) {
    console.error('GET /api/cases error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies CasesResponse)
  }
}
