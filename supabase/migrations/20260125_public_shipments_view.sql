-- public.shipments view: maps status.shipments_status + case.flows/cases to dashboard API schema.
-- Worklist API queries this view; no warehouse_inventory (use null).
-- Requires: status.shipments_status, "case".flows, "case".cases.

CREATE OR REPLACE VIEW public.shipments AS
SELECT
  ss.hvdc_code::text AS id,
  ss.hvdc_code AS sct_ship_no,
  NULL::text AS mr_number,
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
  ss.eta,
  NULL::date AS do_collection_date,
  NULL::date AS customs_start_date,
  NULL::date AS customs_close_date,
  NULL::date AS delivery_date,
  NULL::numeric(12,2) AS duty_amount_aed,
  NULL::numeric(12,2) AS vat_amount_aed,
  ss.incoterms,
  (SELECT f.flow_code FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code,
  (SELECT f.flow_code_original FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code_original,
  (SELECT f.override_reason FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_override_reason,
  (SELECT c.final_location FROM "case".cases c WHERE c.hvdc_code = ss.hvdc_code LIMIT 1) AS final_location
FROM status.shipments_status ss;
