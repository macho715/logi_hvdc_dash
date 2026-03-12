// app/api/shipments/route.ts
/**
 * HVDC Shipments API Routes
 * GET: 선적 정보 조회 (필터링, 페이지네이션)
 * POST: 선적 정보 대량 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

type PortCoordinates = {
  lat: number
  lng: number
}

const PORT_COORDINATES: Record<string, PortCoordinates> = {
  'abu dhabi': { lat: 24.4539, lng: 54.3773 },
  'jebel ali': { lat: 25.0223, lng: 55.0617 },
  'damman': { lat: 26.4344, lng: 50.1033 },
  'rotterdam': { lat: 51.9519, lng: 4.1423 },
  'busan': { lat: 35.1028, lng: 129.0403 },
  'ulsan': { lat: 35.5384, lng: 129.3114 },
  'singapore': { lat: 1.2644, lng: 103.8200 },
  'hamburg': { lat: 53.5461, lng: 9.9661 },
  'houston': { lat: 29.7294, lng: -95.2652 }
}

const normalizePortName = (port?: string | null) => port?.trim().toLowerCase()

const resolvePortCoordinates = (port?: string | null): PortCoordinates | null => {
  const normalized = normalizePortName(port)
  if (!normalized) return null
  return PORT_COORDINATES[normalized] ?? null
}

/**
 * GET /api/shipments
 * 선적 정보 조회
 * 
 * Query Parameters:
 * - sct_ship_no: SCT 선적 번호 (부분 검색)
 * - mr_number: MR 번호
 * - vendor: 공급업체 (부분 검색)
 * - status: 상태 (pending, scheduled, in_transit, arrived, delivered)
 * - from_date: 시작 날짜 (ETA 기준)
 * - to_date: 종료 날짜 (ETA 기준)
 * - port_of_loading: 선적항
 * - port_of_discharge: 도착항
 * - page: 페이지 번호 (default: 1)
 * - limit: 페이지당 항목 수 (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // 기본 쿼리 (뷰 사용)
    let query = supabase
      .from('v_shipment_overview')
      .select('*', { count: 'exact' })

    // 필터 적용
    if (searchParams.get('sct_ship_no')) {
      query = query.ilike('sct_ship_no', `%${searchParams.get('sct_ship_no')}%`)
    }

    if (searchParams.get('mr_number')) {
      query = query.eq('mr_number', searchParams.get('mr_number'))
    }

    if (searchParams.get('vendor')) {
      query = query.ilike('vendor', `%${searchParams.get('vendor')}%`)
    }

    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status'))
    }

    if (searchParams.get('from_date')) {
      query = query.gte('eta', searchParams.get('from_date'))
    }

    if (searchParams.get('to_date')) {
      query = query.lte('eta', searchParams.get('to_date'))
    }

    if (searchParams.get('port_of_loading')) {
      query = query.eq('port_of_loading', searchParams.get('port_of_loading'))
    }

    if (searchParams.get('port_of_discharge')) {
      query = query.eq('port_of_discharge', searchParams.get('port_of_discharge'))
    }

    // 정렬 및 페이지네이션
    query = query
      .order('eta', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const shipmentsWithCoordinates = (data ?? []).map((shipment: any) => {
      const loading = resolvePortCoordinates(shipment.port_of_loading)
      const discharge = resolvePortCoordinates(shipment.port_of_discharge)
      return {
        ...shipment,
        loading_lat: loading?.lat ?? null,
        loading_lng: loading?.lng ?? null,
        discharge_lat: discharge?.lat ?? null,
        discharge_lng: discharge?.lng ?? null
      }
    })

    return NextResponse.json({
      data: shipmentsWithCoordinates,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: count ? Math.ceil(count / limit) : 0
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipments
 * 선적 정보 대량 업로드
 * 
 * Body: {
 *   shipments: Array<ShipmentData>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipments } = body

    if (!shipments || !Array.isArray(shipments)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { shipments: Array }' },
        { status: 400 }
      )
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 배치 처리 (한 번에 100개씩)
    const batchSize = 100
    for (let i = 0; i < shipments.length; i += batchSize) {
      const batch = shipments.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('shipments')
        .upsert(batch, {
          onConflict: 'sct_ship_no',
          ignoreDuplicates: false
        })

      if (error) {
        results.failed += batch.length
        results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`)
      } else {
        results.successful += batch.length
      }
    }

    return NextResponse.json({
      message: `업로드 완료: ${results.successful}건 성공, ${results.failed}건 실패`,
      results
    }, { status: results.failed > 0 ? 207 : 200 })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
