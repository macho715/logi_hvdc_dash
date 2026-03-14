import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { buildCasesSummary, createEmptyCasesSummary, type CasesSummarySourceRow } from '@/lib/cases/summary'

/** Fetch all rows from v_cases using pagination (PostgREST db-max-rows=1000 per page). */
async function fetchAllCases() {
  const PAGE = 1000
  const cols = 'site, flow_code, status_current, status_location, sqm, source_vendor, storage_type'
  const allRows: CasesSummarySourceRow[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('v_cases')
      .select(cols)
      .range(offset, offset + PAGE - 1)
      .order('id')

    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }

  return allRows
}

export async function GET() {
  try {
    const data = await fetchAllCases()
    return NextResponse.json(buildCasesSummary(data))
  } catch (err) {
    console.error('GET /api/cases/summary error:', err)
    return NextResponse.json(createEmptyCasesSummary())
  }
}
