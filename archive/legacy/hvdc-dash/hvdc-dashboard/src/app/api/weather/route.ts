// app/api/weather/route.ts
/**
 * Weather API
 * GET: 항만 날씨 데이터 (스텁)
 */

import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        source: 'manual_stub',
        data: null,
        updated_at: new Date().toISOString()
    })
}
