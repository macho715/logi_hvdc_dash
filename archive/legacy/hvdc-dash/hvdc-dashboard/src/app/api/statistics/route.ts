// app/api/statistics/route.ts
/**
 * Statistics and Dashboard API
 * GET: 전체 물류 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

/**
 * GET /api/statistics
 * 전체 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 기본 통계 (PostgreSQL 함수 호출)
    const { data: stats, error: statsError } = await supabase
      .rpc('get_shipment_statistics')

    if (statsError) {
      throw statsError
    }

    // 2. 상태별 선적 수
    const { data: statusBreakdown } = await supabase
      .from('shipments')
      .select('status')
      .then(({ data }) => {
        const breakdown: Record<string, number> = {}
        data?.forEach(item => {
          breakdown[item.status] = (breakdown[item.status] || 0) + 1
        })
        return { data: breakdown }
      })

    // 3. 항구별 선적 수 (Top 10)
    const { data: portStats } = await supabase
      .from('shipments')
      .select('port_of_discharge')
      .then(({ data }) => {
        const ports: Record<string, number> = {}
        data?.forEach(item => {
          if (item.port_of_discharge) {
            ports[item.port_of_discharge] = (ports[item.port_of_discharge] || 0) + 1
          }
        })
        return {
          data: Object.entries(ports)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([port, count]) => ({ port, count }))
        }
      })

    // 4. 공급업체별 통계 (Top 10)
    const { data: vendorStats } = await supabase
      .from('shipments')
      .select('vendor, invoice_value')
      .then(({ data }) => {
        const vendors: Record<string, { count: number; total_value: number }> = {}
        data?.forEach(item => {
          if (item.vendor) {
            if (!vendors[item.vendor]) {
              vendors[item.vendor] = { count: 0, total_value: 0 }
            }
            vendors[item.vendor].count++
            vendors[item.vendor].total_value += item.invoice_value || 0
          }
        })
        return {
          data: Object.entries(vendors)
            .sort(([, a], [, b]) => b.total_value - a.total_value)
            .slice(0, 10)
            .map(([vendor, stats]) => ({ vendor, ...stats }))
        }
      })

    // 5. 월별 선적 트렌드 (최근 12개월)
    const { data: monthlyTrend } = await supabase
      .from('shipments')
      .select('eta, ata')
      .gte('eta', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        const months: Record<string, number> = {}
        data?.forEach(item => {
          const dateValue = item.eta || item.ata
          if (!dateValue) return
          const date = new Date(dateValue)
          if (Number.isNaN(date.getTime())) return
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          months[monthKey] = (months[monthKey] || 0) + 1
        })
        return {
          data: Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }))
        }
      })

    // 6. 월별 비용 트렌드 (최근 12개월)
    const { data: monthlyCostTrend } = await supabase
      .from('shipments')
      .select('eta, ata, invoice_value')
      .gte('eta', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        const months: Record<string, number> = {}
        data?.forEach(item => {
          const dateValue = item.eta || item.ata
          if (!dateValue) return
          const date = new Date(dateValue)
          if (Number.isNaN(date.getTime())) return
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          months[monthKey] = (months[monthKey] || 0) + (item.invoice_value || 0)
        })
        return {
          data: Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total_cost]) => ({ month, total_cost }))
        }
      })

    // 6. 지연 선적 조회
    const { data: delayedShipments, error: delayedError } = await supabase
      .rpc('get_delayed_shipments', { days_threshold: 7 })

    // 7. 창고별 재고 현황
    const { data: warehouseStatus } = await supabase
      .from('v_warehouse_status')
      .select('*')
      .limit(100)

    // Mock coordinates for demo purposes (approximate locations for common ports)
    // In a real app, these would come from a 'ports' table or shipment tracking data
    const mockCoordinates: Record<string, { lat: number, lng: number }> = {
      'BUSAN': { lat: 35.1796, lng: 129.0756 },
      'SHANGHAI': { lat: 31.2304, lng: 121.4737 },
      'ROTTERDAM': { lat: 51.9244, lng: 4.4777 },
      'JEBEL ALI': { lat: 24.9857, lng: 55.0273 },
      'HAMBURG': { lat: 53.5511, lng: 9.9937 },
      'SINGAPORE': { lat: 1.3521, lng: 103.8198 },
      'LOS ANGELES': { lat: 33.7405, lng: -118.2437 }
    }

    const delayedWithCoords = (delayedShipments || []).map((s: any) => {
      // Assign random or mapped coords if missing
      const port = s.port_of_discharge || s.port_of_loading || 'BUSAN'
      const coords = mockCoordinates[port.toUpperCase()] || { lat: 0, lng: 0 }

      // Add slight jitter so unrelated shipments don't overlap perfectly
      const jitter = () => (Math.random() - 0.5) * 2
      return {
        ...s,
        latitude: coords.lat + jitter(),
        longitude: coords.lng + jitter(),
        days_delayed: Math.floor(Math.random() * 10) + 1 // Mock delay days if not present
      }
    })

    // Mock trends for sparklines (random data for demo)
    const trends = {
      total_shipments: Array.from({ length: 10 }, () => Math.floor(Math.random() * 20) + 80),
      in_transit: Array.from({ length: 10 }, () => Math.floor(Math.random() * 10) + 40),
      delivered: Array.from({ length: 10 }, () => Math.floor(Math.random() * 15) + 30),
      delayed: Array.from({ length: 10 }, () => Math.floor(Math.random() * 5))
    }

    return NextResponse.json({
      overview: stats?.[0] || {},
      status_breakdown: statusBreakdown || {},
      port_statistics: portStats || [],
      vendor_statistics: vendorStats || [],
      monthly_trend: monthlyTrend || [],
      monthly_cost_trend: monthlyCostTrend || [],
      delayed_shipments: delayedWithCoords,
      warehouse_status: warehouseStatus || [],
      trends // Added trends
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// app/api/statistics/vendor/route.ts
/**
 * GET /api/statistics/vendor
 * 공급업체별 상세 통계
 */
export async function GET_VENDOR(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor')

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor parameter required' },
        { status: 400 }
      )
    }

    // 해당 공급업체의 모든 선적 정보
    const { data: shipments } = await supabase
      .from('v_shipment_overview')
      .select('*')
      .eq('vendor', vendor)
      .order('eta', { ascending: false })

    // 통계 계산
    const stats = {
      total_shipments: shipments?.length || 0,
      total_value: shipments?.reduce((sum, s) => sum + (s.invoice_value || 0), 0) || 0,
      total_containers: shipments?.reduce((sum, s) => sum + (s.total_containers || 0), 0) || 0,
      total_weight: shipments?.reduce((sum, s) => sum + (s.gross_weight_kg || 0), 0) || 0,
      total_cbm: shipments?.reduce((sum, s) => sum + (s.cbm || 0), 0) || 0,
      on_time_delivery_rate: calculateOnTimeRate(shipments || []),
      avg_transit_days: calculateAvgTransitDays(shipments || [])
    }

    return NextResponse.json({
      vendor,
      statistics: stats,
      recent_shipments: shipments?.slice(0, 10) || []
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 유틸리티 함수
function calculateOnTimeRate(shipments: any[]): number {
  const delivered = shipments.filter(s => s.ata && s.eta)
  if (delivered.length === 0) return 0

  const onTime = delivered.filter(s =>
    new Date(s.ata) <= new Date(s.eta)
  )

  return (onTime.length / delivered.length) * 100
}

function calculateAvgTransitDays(shipments: any[]): number {
  const completed = shipments.filter(s => s.atd && s.ata)
  if (completed.length === 0) return 0

  const totalDays = completed.reduce((sum, s) => {
    const start = new Date(s.atd)
    const end = new Date(s.ata)
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  }, 0)

  return totalDays / completed.length
}
