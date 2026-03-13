-- Migration: Add columns + RPC import helpers
-- Run this in the Supabase SQL editor BEFORE running the import script

-- ── 1. Add missing columns ───────────────────────────────────────────────────

-- case.cases: add columns needed by import script
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS sct_ship_no TEXT;
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS cbm NUMERIC;
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS storage_type TEXT;
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS stack_status TEXT;
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE "case".cases ADD COLUMN IF NOT EXISTS site_arrival_date DATE;

-- case.flows: add columns needed by import script
ALTER TABLE "case".flows ADD COLUMN IF NOT EXISTS sct_ship_no TEXT;
ALTER TABLE "case".flows ADD COLUMN IF NOT EXISTS hvdc_code TEXT;

-- status.shipments_status: add new analytics columns
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS final_delivery_date DATE;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS transit_days INTEGER;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS customs_days INTEGER;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS inland_days INTEGER;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS doc_shu BOOLEAN DEFAULT FALSE;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS doc_das BOOLEAN DEFAULT FALSE;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS doc_mir BOOLEAN DEFAULT FALSE;
ALTER TABLE status.shipments_status ADD COLUMN IF NOT EXISTS doc_agi BOOLEAN DEFAULT FALSE;

-- ── 2. Update views ──────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.shipments;
DROP VIEW IF EXISTS public.v_shipments_status;

CREATE OR REPLACE VIEW public.v_shipments_status AS
SELECT
  id, hvdc_code, status_no, vendor, pol, pod, vessel, bl_awb, ship_mode,
  etd, eta, atd, ata, incoterms,
  final_delivery_date, transit_days, customs_days, inland_days,
  doc_shu, doc_das, doc_mir, doc_agi,
  created_at
FROM status.shipments_status;

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
  ss.hvdc_code AS sct_ship_no,
  ss.status_no AS mr_number,
  NULL::text AS commercial_invoice_no,
  NULL::date AS invoice_date,
  ss.vendor,
  NULL::text AS main_description,
  ss.pol AS port_of_loading,
  ss.pod AS port_of_discharge,
  ss.vessel AS vessel_name,
  ss.bl_awb AS bl_awb_no,
  ss.ship_mode,
  NULL::text AS coe,
  ss.etd,
  ss.atd,
  ss.eta,
  ss.ata,
  NULL::date AS do_collection_date,
  NULL::date AS customs_start_date,
  NULL::date AS customs_close_date,
  COALESCE(ss.final_delivery_date, case_rollup.site_arrival_date, ss.ata) AS delivery_date,
  NULL::numeric(12,2) AS duty_amount_aed,
  NULL::numeric(12,2) AS vat_amount_aed,
  ss.incoterms,
  flow_rollup.flow_code,
  flow_rollup.flow_code AS flow_code_original,
  NULL::text AS flow_override_reason,
  case_rollup.final_location,
  ss.transit_days,
  ss.customs_days,
  ss.inland_days,
  ss.doc_shu,
  ss.doc_das,
  ss.doc_mir,
  ss.doc_agi
FROM status.shipments_status ss
LEFT JOIN flow_rollup ON flow_rollup.sct_ship_no = ss.hvdc_code
LEFT JOIN case_rollup ON case_rollup.sct_ship_no = ss.hvdc_code;

GRANT SELECT ON public.v_shipments_status TO anon, authenticated;
GRANT SELECT ON public.shipments TO anon, authenticated;

-- ── 3. RPC import helper functions ──────────────────────────────────────────

-- Truncate all import tables (called once before batches start)
CREATE OR REPLACE FUNCTION public.import_truncate_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, "case", status
AS $$
BEGIN
  DELETE FROM "case".flows;
  DELETE FROM "case".cases;
  DELETE FROM status.shipments_status;
END;
$$;

-- Insert a batch of cases (JSONB array)
CREATE OR REPLACE FUNCTION public.import_cases_batch(p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, "case", status
AS $$
BEGIN
  INSERT INTO "case".cases (
    case_no, sct_ship_no, hvdc_code, site, flow_code, flow_description,
    status_current, status_location, final_location,
    sqm, cbm, source_vendor, storage_type, stack_status, category, site_arrival_date
  )
  SELECT
    (r->>'case_no'),
    (r->>'sct_ship_no'),
    (r->>'hvdc_code'),
    (r->>'site'),
    (r->>'flow_code')::integer,
    (r->>'flow_description'),
    (r->>'status_current'),
    (r->>'status_location'),
    (r->>'final_location'),
    (r->>'sqm')::numeric,
    (r->>'cbm')::numeric,
    (r->>'source_vendor'),
    (r->>'storage_type'),
    (r->>'stack_status'),
    (r->>'category'),
    (r->>'site_arrival_date')::date
  FROM jsonb_array_elements(p_rows) r;
END;
$$;

-- Insert a batch of flows (JSONB array)
CREATE OR REPLACE FUNCTION public.import_flows_batch(p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, "case", status
AS $$
BEGIN
  INSERT INTO "case".flows (case_no, sct_ship_no, hvdc_code, flow_code, flow_description)
  SELECT
    (r->>'case_no'),
    (r->>'sct_ship_no'),
    (r->>'hvdc_code'),
    (r->>'flow_code')::integer,
    (r->>'flow_description')
  FROM jsonb_array_elements(p_rows) r;
END;
$$;

-- Insert a batch of shipments (JSONB array)
CREATE OR REPLACE FUNCTION public.import_shipments_batch(p_rows jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, "case", status
AS $$
BEGIN
  INSERT INTO status.shipments_status (
    hvdc_code, status_no, vendor, pol, pod, vessel, bl_awb, ship_mode,
    etd, atd, eta, ata, incoterms,
    final_delivery_date, transit_days, customs_days, inland_days,
    doc_shu, doc_das, doc_mir, doc_agi
  )
  SELECT
    (r->>'hvdc_code'),
    (r->>'status_no'),
    (r->>'vendor'),
    (r->>'pol'),
    (r->>'pod'),
    (r->>'vessel'),
    (r->>'bl_awb'),
    (r->>'ship_mode'),
    (r->>'etd')::date,
    (r->>'atd')::date,
    (r->>'eta')::date,
    (r->>'ata')::date,
    (r->>'incoterms'),
    (r->>'final_delivery_date')::date,
    (r->>'transit_days')::integer,
    (r->>'customs_days')::integer,
    (r->>'inland_days')::integer,
    (r->>'doc_shu')::boolean,
    (r->>'doc_das')::boolean,
    (r->>'doc_mir')::boolean,
    (r->>'doc_agi')::boolean
  FROM jsonb_array_elements(p_rows) r;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.import_truncate_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.import_cases_batch(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_flows_batch(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_shipments_batch(jsonb) TO service_role;

NOTIFY pgrst, 'reload schema';
