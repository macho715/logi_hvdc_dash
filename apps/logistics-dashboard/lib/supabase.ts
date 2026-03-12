import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 환경 변수가 없어도 클라이언트는 생성하되, API 호출 시 에러가 발생할 수 있음
// API 라우트에서 에러 처리를 통해 fallback 데이터를 반환하도록 함
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        persistSession: false,
      },
    })

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        persistSession: false,
      },
    })
