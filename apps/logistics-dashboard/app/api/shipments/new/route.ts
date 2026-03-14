import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export interface NewVoyagePayload {
  hvdc_code: string           // required — SCT SHIP NO
  vendor?: string
  pol?: string
  pod?: string
  ship_mode?: string
  incoterms?: string
  status_no?: number | null   // MR No. (BIGINT)
  vessel?: string
  bl_awb?: string
  etd?: string | null         // ISO date string
  atd?: string | null
  eta?: string | null
  ata?: string | null
  transit_days?: number | null
  customs_days?: number | null
  inland_days?: number | null
  doc_shu?: boolean
  doc_das?: boolean
  doc_mir?: boolean
  doc_agi?: boolean
  description?: string        // stored in raw JSONB column
}

export async function POST(request: Request) {
  let body: NewVoyagePayload
  try {
    body = (await request.json()) as NewVoyagePayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.hvdc_code?.trim()) {
    return NextResponse.json({ error: 'hvdc_code_required' }, { status: 400 })
  }

  const { description, ...rest } = body
  const row = {
    ...rest,
    hvdc_code: body.hvdc_code.trim().toUpperCase(),
    raw: description ? { description } : null,
  }

  try {
    const { error } = await supabaseAdmin
      .schema('status')
      .from('shipments_status')
      .insert(row)

    if (error) {
      // Postgres unique violation on hvdc_code
      if (error.code === '23505') {
        return NextResponse.json({ error: 'duplicate_hvdc_code' }, { status: 409 })
      }
      console.error('[POST /api/shipments/new] Supabase error:', error)
      return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/shipments/new] Unexpected error:', err)
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 })
  }
}
