import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for Supabase API client.')
}

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for Supabase API client.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Fetch shipment with all related data
        const { data: shipment, error } = await supabase
            .from('shipments')
            .select(`
        *,
        container_details (*),
        warehouse_inventory (*),
        financial_transactions (*)
      `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
        }

        return NextResponse.json({ data: shipment })
    } catch (error) {
        console.error('Internal server error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
