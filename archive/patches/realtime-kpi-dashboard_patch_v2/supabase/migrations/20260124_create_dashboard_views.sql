-- Dashboard Views (baseline)
--
-- Purpose:
-- - Provide a server-side JOIN surface so the frontend can query Views only.
-- - Align with docs/ETL_GUIDE.md guidance: "프론트엔드에서 직접 JOIN 금지. View만 조회."
--
-- NOTE:
-- - This file intentionally ships a minimal baseline view (v_shipments_master).
-- - Add additional views (v_cases_kpi, v_case_segments, ...) as the KPI strategy finalizes.

CREATE OR REPLACE VIEW public.v_shipments_master AS
SELECT
  ss.hvdc_code,
  ss.status_no,
  ss.vendor,
  ss.eta,
  ss.ata,
  COUNT(DISTINCT c.case_no) AS case_count,
  SUM(c.cbm) AS total_cbm
FROM status.shipments_status ss
LEFT JOIN "case".cases c ON c.hvdc_code = ss.hvdc_code
GROUP BY ss.hvdc_code, ss.status_no, ss.vendor, ss.eta, ss.ata;

-- Optional: grant read access via RLS policies instead of grants.
-- If you rely on GRANTs (no RLS), uncomment:
-- GRANT SELECT ON public.v_shipments_master TO anon, authenticated;
