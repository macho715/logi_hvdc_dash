import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for Supabase client.')
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase client.')
}

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for Supabase admin client.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
