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

/** 빈 문자열·undefined를 제거해 실제 입력값만 남긴 UPDATE 전용 patch 객체 반환 */
function buildPatch(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([key, val]) => {
      if (key === 'hvdc_code') return false          // PK — UPDATE 조건으로 사용, patch에서 제외
      if (val === null) return true                  // null은 명시적 초기화 → 허용
      if (val === undefined || val === '') return false
      return true
    }),
  )
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
  const hvdc_code = body.hvdc_code.trim().toUpperCase()
  const row = {
    ...rest,
    hvdc_code,
    raw: description ? { description } : null,
  }

  try {
    // 1차 시도: INSERT
    const { error: insertError } = await supabaseAdmin
      .schema('status')
      .from('shipments_status')
      .insert(row)

    // INSERT 성공
    if (!insertError) {
      return NextResponse.json({ ok: true, action: 'created' }, { status: 200 })
    }

    // 중복 hvdc_code → 입력한 필드만 PATCH (UPDATE)
    if (insertError.code === '23505') {
      const patch = buildPatch(row as Record<string, unknown>)

      // 빈 patch (SCT SHIP NO만 입력한 경우) → 조회만 하고 OK 반환
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ ok: true, action: 'exists' }, { status: 200 })
      }

      const { error: updateError } = await supabaseAdmin
        .schema('status')
        .from('shipments_status')
        .update(patch)
        .eq('hvdc_code', hvdc_code)

      if (updateError) {
        console.error('[POST /api/shipments/new] UPDATE error:', updateError)
        return NextResponse.json({ error: 'db_error', detail: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, action: 'updated' }, { status: 200 })
    }

    // 그 외 DB 에러
    console.error('[POST /api/shipments/new] Supabase error:', insertError)
    return NextResponse.json({ error: 'db_error', detail: insertError.message }, { status: 500 })

  } catch (err) {
    console.error('[POST /api/shipments/new] Unexpected error:', err)
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 })
  }
}
