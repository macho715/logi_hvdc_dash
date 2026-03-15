import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { fetchAllPagesInParallel } from '@/lib/supabasePagination'
import { buildCasesSummary, createEmptyCasesSummary, type CasesSummarySourceRow } from '@/lib/cases/summary'

/** Fetch all rows from v_cases using pagination (PostgREST db-max-rows=1000 per page). */
async function fetchAllCases() {
  const cols = 'site, flow_code, status_current, status_location, sqm, source_vendor, storage_type'
  return fetchAllPagesInParallel<CasesSummarySourceRow>(supabase, 'v_cases', cols)
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
