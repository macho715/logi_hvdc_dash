// app/api/shipments/[id]/route.ts
/**
 * Individual Shipment API Routes
 * GET: 개별 선적 정보 조회
 * PUT: 선적 정보 수정
 * DELETE: 선적 정보 삭제
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/shipments/[id]
 * 개별 선적 정보 조회 (컨테이너, 창고 정보 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    
    // Shipment 기본 정보
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (shipmentError) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }
    
    // Container 정보
    const { data: containers } = await supabase
      .from('container_details')
      .select('*')
      .eq('shipment_id', id)
      .single()
    
    // Warehouse 정보
    const { data: warehouse } = await supabase
      .from('warehouse_inventory')
      .select('*')
      .eq('shipment_id', id)
      .single()
    
    // Financial Transactions
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('shipment_id', id)
      .order('transaction_date', { ascending: false })
    
    // Tracking Log
    const { data: trackingLog } = await supabase
      .from('shipment_tracking_log')
      .select('*')
      .eq('shipment_id', id)
      .order('event_date', { ascending: false })
    
    // Documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('shipment_id', id)
      .order('upload_date', { ascending: false })
    
    return NextResponse.json({
      shipment,
      containers,
      warehouse,
      transactions: transactions || [],
      tracking_log: trackingLog || [],
      documents: documents || []
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/shipments/[id]
 * 선적 정보 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('shipments')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        updated_by: 'api_user' // 실제로는 인증된 사용자 정보 사용
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Shipment updated successfully',
      data
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipments/[id]
 * 선적 정보 삭제 (CASCADE로 관련 데이터 자동 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Shipment deleted successfully'
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
