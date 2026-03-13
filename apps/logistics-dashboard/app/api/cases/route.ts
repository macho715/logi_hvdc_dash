import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { getRouteTypeIdFromFlowCode, getRouteTypeIdsForFlowCodes, isOverviewRouteTypeId } from '@/lib/overview/routeTypes'
import type { CaseRow, CasesResponse } from '@/types/cases'
import { classifyStage, type PipelineStage } from '@/lib/cases/pipelineStage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const site = searchParams.get('site')
    const flow_code = searchParams.get('flow_code')
    const routeType = searchParams.get('route_type')
    const vendor = searchParams.get('vendor')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const stage = searchParams.get('stage') as PipelineStage | null
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)
    // status_current supports repeating params: ?status_current=warehouse&status_current=Pre+Arrival
    const status_current_values = searchParams.getAll('status_current')
    const needsClientStageFilter = stage != null || id != null

    let query = supabase
      .from('v_cases')
      .select(
        `id, case_no, site, flow_code, flow_description,
         status_current, status_location, final_location,
         sqm, source_vendor, storage_type, stack_status,
         category, sct_ship_no, site_arrival_date`,
        { count: 'exact' }
      )

    if (id) query = query.eq('id', id)
    if (site && site !== 'all') query = query.eq('site', site)
    if (flow_code && flow_code !== 'all') query = query.eq('flow_code', parseInt(flow_code, 10))
    else if (routeType && routeType !== 'all') {
      if (routeType === 'review-required') {
        query = query.or('flow_code.eq.5,flow_code.is.null')
      } else if (isOverviewRouteTypeId(routeType)) {
        query = query.in('flow_code', getRouteTypeIdsForFlowCodes(routeType))
      }
    }
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

    query = query.order('case_no')

    if (!needsClientStageFilter) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    } else {
      query = query.range(0, 20000)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('cases query error:', error)
      return NextResponse.json({ data: [], total: 0, page, pageSize } satisfies CasesResponse)
    }

    const filtered = (data ?? []).filter((row) => {
      if (!stage) return true
      return classifyStage(row.status_current ?? null, row.status_location ?? null) === stage
    })
      .map((row) => ({
        ...row,
        route_type: getRouteTypeIdFromFlowCode(row.flow_code),
      } satisfies CaseRow))

    const total = needsClientStageFilter ? filtered.length : (count ?? 0)
    const paged = needsClientStageFilter
      ? filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
      : filtered

    return NextResponse.json({
      data: paged,
      total,
      page,
      pageSize,
    } satisfies CasesResponse)
  } catch (err) {
    console.error('GET /api/cases error:', err)
    return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 50 } satisfies CasesResponse)
  }
}
