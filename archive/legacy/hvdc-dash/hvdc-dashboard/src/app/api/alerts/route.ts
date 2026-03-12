// app/api/alerts/route.ts
/**
 * Alerts API
 * GET: 운영 알림 목록 (스텁)
 */

import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        source: 'manual_stub',
        data: [],
        updated_at: new Date().toISOString()
    })
}
