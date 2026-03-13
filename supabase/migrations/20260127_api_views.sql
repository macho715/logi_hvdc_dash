-- 20260127_api_views.sql
-- =====================================================================
-- API-layer views: v_cases, v_stock_onhand
-- =====================================================================
-- 목적:
--   /api/cases, /api/cases/summary → public.v_cases
--   /api/stock                     → public.v_stock_onhand
--
-- 의존성:
--   - "case".cases    (recreate-tables.mjs 또는 20260124_hvdc_layers_status_case_ops.sql로 생성)
--   - wh.stock_onhand (recreate-tables.mjs로 생성)
--
-- 실행 순서:
--   ① supabase/scripts/20260124_hvdc_layers_status_case_ops.sql  (스키마 + 핵심 뷰)
--   ② supabase/migrations/ 순서대로 (이 파일 포함)
-- =====================================================================

-- ── v_cases ──────────────────────────────────────────────────────────
-- API /api/cases 및 /api/cases/summary 전용 뷰
-- case.cases 의 모든 컬럼을 그대로 노출
-- PostgREST는 public 스키마만 접근 가능하므로 뷰로 래핑 필수

CREATE OR REPLACE VIEW public.v_cases AS
SELECT
    id,
    case_no,
    hvdc_code,
    site,
    flow_code,
    flow_description,
    status_current,
    status_location,
    final_location,
    sqm,
    source_vendor,
    storage_type,
    stack_status,
    category,
    sct_ship_no,
    site_arrival_date,
    cbm,
    created_at
FROM "case".cases;

-- GRANT: PostgREST anon 접근 허용
GRANT SELECT ON public.v_cases TO anon, authenticated;

-- ── v_stock_onhand ────────────────────────────────────────────────────
-- API /api/stock 전용 뷰
-- wh.stock_onhand 의 모든 컬럼을 그대로 노출

CREATE OR REPLACE VIEW public.v_stock_onhand AS
SELECT
    id,
    no,
    sku,
    description,
    location,
    pallet_id,
    qty,
    shipping_ref,
    date_received,
    created_at
FROM wh.stock_onhand;

-- GRANT: PostgREST anon 접근 허용
GRANT SELECT ON public.v_stock_onhand TO anon, authenticated;

-- ── PostgREST 스키마 캐시 갱신 ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 확인 쿼리 (실행 후 수동 검증용) ──────────────────────────────────────
-- SELECT schemaname, viewname FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname IN ('v_cases', 'v_stock_onhand');
-- → 2행 반환되어야 함
