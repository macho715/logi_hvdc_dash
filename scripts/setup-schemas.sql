-- ============================================================
-- HVDC Dashboard: Schema + Table Setup
-- Run this in Supabase SQL Editor if the seed script DDL fails:
-- https://app.supabase.com/project/rkfffveonaskewwzghex/editor
-- ============================================================

-- 1. Create schemas
CREATE SCHEMA IF NOT EXISTS "case";
CREATE SCHEMA IF NOT EXISTS status;
CREATE SCHEMA IF NOT EXISTS wh;

-- 2. case.cases
CREATE TABLE IF NOT EXISTS "case".cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_no         TEXT NOT NULL,
  hvdc_code       TEXT,
  site            TEXT,
  flow_code       INTEGER,
  flow_description TEXT,
  status_current  TEXT,
  status_location TEXT,
  final_location  TEXT,
  sqm             NUMERIC,
  source_vendor   TEXT,
  storage_type    TEXT,
  stack_status    TEXT,
  category        TEXT,
  sct_ship_no     TEXT,
  site_arrival_date DATE,
  cbm             NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. case.flows
CREATE TABLE IF NOT EXISTS "case".flows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code           TEXT NOT NULL,
  flow_code           INTEGER,
  flow_code_original  INTEGER,
  override_reason     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. status.shipments_status
CREATE TABLE IF NOT EXISTS status.shipments_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code   TEXT NOT NULL,
  status_no   TEXT,
  vendor      TEXT,
  pol         TEXT,
  pod         TEXT,
  vessel      TEXT,
  bl_awb      TEXT,
  ship_mode   TEXT,
  etd         DATE,
  eta         DATE,
  atd         DATE,
  ata         DATE,
  incoterms   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. wh.stock_onhand
CREATE TABLE IF NOT EXISTS wh.stock_onhand (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no            INTEGER,
  sku           TEXT,
  description   TEXT,
  location      TEXT,
  pallet_id     TEXT,
  qty           INTEGER,
  shipping_ref  TEXT,
  date_received DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS
ALTER TABLE "case".cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE status.shipments_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh.stock_onhand ENABLE ROW LEVEL SECURITY;

-- 7. Policies (idempotent)
DO $$
BEGIN
  -- case.cases
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='cases' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON "case".cases FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='cases' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON "case".cases FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- case.flows
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='flows' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON "case".flows FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='flows' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON "case".flows FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- status.shipments_status
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='status' AND tablename='shipments_status' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON status.shipments_status FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='status' AND tablename='shipments_status' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON status.shipments_status FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- wh.stock_onhand
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='wh' AND tablename='stock_onhand' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON wh.stock_onhand FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='wh' AND tablename='stock_onhand' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON wh.stock_onhand FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 8. public.shipments view
CREATE OR REPLACE VIEW public.shipments AS
SELECT
  ss.hvdc_code::text AS id,
  ss.hvdc_code       AS sct_ship_no,
  NULL::text         AS mr_number,
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
  ss.eta,
  NULL::date         AS do_collection_date,
  NULL::date         AS customs_start_date,
  NULL::date         AS customs_close_date,
  ss.ata             AS delivery_date,
  NULL::numeric(12,2) AS duty_amount_aed,
  NULL::numeric(12,2) AS vat_amount_aed,
  ss.incoterms,
  (SELECT f.flow_code          FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code,
  (SELECT f.flow_code_original FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code_original,
  (SELECT f.override_reason    FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_override_reason,
  (SELECT c.final_location     FROM "case".cases c WHERE c.hvdc_code = ss.hvdc_code LIMIT 1) AS final_location
FROM status.shipments_status ss;

GRANT SELECT ON public.shipments TO anon, authenticated;

SELECT 'Setup complete ✅' AS result;
