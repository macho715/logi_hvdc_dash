-- 20260127_api_views.sql
-- =====================================================================
-- API-layer views: v_cases, v_flows, v_shipments_status, v_stock_onhand
-- =====================================================================

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

CREATE OR REPLACE VIEW public.v_flows AS
SELECT
  id,
  case_no,
  sct_ship_no,
  hvdc_code,
  flow_code,
  flow_description,
  created_at
FROM "case".flows;

CREATE OR REPLACE VIEW public.v_shipments_status AS
SELECT
  id,
  hvdc_code,
  status_no,
  vendor,
  pol,
  pod,
  vessel,
  bl_awb,
  ship_mode,
  etd,
  eta,
  atd,
  ata,
  incoterms,
  final_delivery_date,
  doc_shu,
  doc_das,
  doc_mir,
  doc_agi,
  created_at
FROM status.shipments_status;

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

GRANT SELECT ON public.v_cases TO anon, authenticated;
GRANT SELECT ON public.v_flows TO anon, authenticated;
GRANT SELECT ON public.v_shipments_status TO anon, authenticated;
GRANT SELECT ON public.v_stock_onhand TO anon, authenticated;

CREATE OR REPLACE VIEW public.shipments AS
WITH flow_rollup AS (
  SELECT
    sct_ship_no,
    CASE
      WHEN COUNT(DISTINCT flow_code) = 1 THEN MIN(flow_code)
      WHEN COUNT(DISTINCT flow_code) > 1 THEN 5
      ELSE NULL
    END AS flow_code
  FROM "case".flows
  WHERE sct_ship_no IS NOT NULL
  GROUP BY sct_ship_no
),
case_rollup AS (
  SELECT
    sct_ship_no,
    CASE
      WHEN COUNT(DISTINCT COALESCE(site, final_location)) = 1 THEN MIN(COALESCE(site, final_location))
      WHEN COUNT(DISTINCT COALESCE(site, final_location)) > 1 THEN 'Mixed'
      ELSE NULL
    END AS final_location,
    MAX(site_arrival_date) AS site_arrival_date
  FROM "case".cases
  WHERE sct_ship_no IS NOT NULL
  GROUP BY sct_ship_no
)
SELECT
  ss.hvdc_code::text AS id,
  ss.hvdc_code       AS sct_ship_no,
  ss.status_no       AS mr_number,
  NULL::text         AS commercial_invoice_no,
  NULL::date         AS invoice_date,
  ss.vendor,
  NULL::text         AS main_description,
  ss.pol             AS port_of_loading,
  ss.pod             AS port_of_discharge,
  ss.vessel          AS vessel_name,
  ss.bl_awb          AS bl_awb_no,
  ss.ship_mode,
  NULL::text         AS coe,
  ss.etd,
  ss.atd,
  ss.eta,
  ss.ata,
  NULL::date         AS do_collection_date,
  NULL::date         AS customs_start_date,
  NULL::date         AS customs_close_date,
  COALESCE(ss.final_delivery_date, case_rollup.site_arrival_date, ss.ata) AS delivery_date,
  NULL::numeric(12,2) AS duty_amount_aed,
  NULL::numeric(12,2) AS vat_amount_aed,
  ss.incoterms,
  flow_rollup.flow_code AS flow_code,
  flow_rollup.flow_code AS flow_code_original,
  NULL::text            AS flow_override_reason,
  case_rollup.final_location
FROM status.shipments_status ss
LEFT JOIN flow_rollup
  ON flow_rollup.sct_ship_no = ss.hvdc_code
LEFT JOIN case_rollup
  ON case_rollup.sct_ship_no = ss.hvdc_code;

GRANT SELECT ON public.shipments TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
