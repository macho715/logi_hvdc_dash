
-- Gate 1 QA Validation Queries
-- Run these in Supabase SQL Editor after applying migration and loading CSV data

-- 3.1 Orphan Check (Status layer)
SELECT COUNT(*)::bigint AS orphan_status_events
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;

-- 3.1 Orphan Check (Case layer)
SELECT COUNT(*)::bigint AS orphan_case_events
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;

-- 3.2 Duplicate Check (natural key)
SELECT
  hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
  COUNT(*)::bigint AS cnt
FROM "case".events_case
GROUP BY 1, 2, 3, 4, 5, 6, 7
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- 3.3 Flow Code 5 Rule
SELECT COUNT(*)::bigint AS bad_flow5
FROM "case".flows
WHERE flow_code = 5 AND requires_review IS NOT TRUE;

-- Verify KPI Views Exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'v_case_segments',
    'v_voyage_segments',
    'v_case_kpi',
    'v_kpi_site_flow_daily',
    'v_shipments_master',
    'v_shipments_timeline',
    'v_cases_kpi',
    'v_case_event_segments'
  )
ORDER BY table_name;
