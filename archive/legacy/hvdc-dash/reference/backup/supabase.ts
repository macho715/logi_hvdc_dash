import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트를 초기화합니다.
 *
 * 서버 사이드 환경에서만 사용하며, `persistSession`을 false로 설정하여
 * 브라우저 쿠키 세션을 저장하지 않습니다. 환경 변수는 Next.js 서버 환경에
 * 로드되어 있어야 합니다. 프라이빗 키 (`SUPABASE_SERVICE_ROLE_KEY`)는
 * 서버에서만 노출되어야 하므로 클라이언트 번들에는 포함되지 않습니다.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  }
);