\set ON_ERROR_STOP on

\echo '=== Gate 1 QA ==='

\echo '--- Orphan checks ---'
SELECT COUNT(*)::bigint AS orphan_status_events
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;

SELECT COUNT(*)::bigint AS orphan_case_events
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;

\echo '--- Duplicate checks ---'
SELECT COUNT(*)::bigint AS dup_events_case_rows
FROM (
  SELECT
    hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
    COUNT(*)::bigint AS cnt
  FROM "case".events_case
  GROUP BY 1,2,3,4,5,6,7
  HAVING COUNT(*) > 1
) d;

\echo '--- Flow code rules ---'
SELECT COUNT(*)::bigint AS bad_flow5
FROM "case".flows
WHERE flow_code = 5 AND requires_review IS NOT TRUE;

SELECT COUNT(*)::bigint AS agi_das_violation
FROM "case".cases c
JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3;

\echo '--- Coverage ---'
SELECT
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.shipments_status) AS shipments_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.events_status) AS events_shipments_count;

SELECT
  (SELECT COUNT(*) FROM "case".cases) AS cases_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM "case".cases) AS unique_hvdc_codes;

\echo '=== End Gate 1 QA ==='
