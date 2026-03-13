/**
 * Recreate tables with the current logistics schema by calling the project SQL endpoint.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkfffveonaskewwzghex.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DROP_RECREATE_SQL = `
DROP VIEW IF EXISTS public.shipments CASCADE;
DROP VIEW IF EXISTS public.v_cases CASCADE;
DROP VIEW IF EXISTS public.v_flows CASCADE;
DROP VIEW IF EXISTS public.v_shipments_status CASCADE;
DROP VIEW IF EXISTS public.v_stock_onhand CASCADE;
DROP TABLE IF EXISTS "case".cases CASCADE;
DROP TABLE IF EXISTS "case".flows CASCADE;
DROP TABLE IF EXISTS status.shipments_status CASCADE;
DROP TABLE IF EXISTS wh.stock_onhand CASCADE;

CREATE SCHEMA IF NOT EXISTS "case";
CREATE SCHEMA IF NOT EXISTS status;
CREATE SCHEMA IF NOT EXISTS wh;

CREATE TABLE "case".cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_no           TEXT NOT NULL,
  hvdc_code         TEXT,
  site              TEXT,
  flow_code         INTEGER,
  flow_description  TEXT,
  status_current    TEXT,
  status_location   TEXT,
  final_location    TEXT,
  sqm               NUMERIC,
  source_vendor     TEXT,
  storage_type      TEXT,
  stack_status      TEXT,
  category          TEXT,
  sct_ship_no       TEXT,
  site_arrival_date DATE,
  cbm               NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "case".flows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_no           TEXT,
  sct_ship_no       TEXT,
  hvdc_code         TEXT,
  flow_code         INTEGER,
  flow_description  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE status.shipments_status (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code            TEXT NOT NULL,
  status_no            TEXT,
  vendor               TEXT,
  pol                  TEXT,
  pod                  TEXT,
  vessel               TEXT,
  bl_awb               TEXT,
  ship_mode            TEXT,
  etd                  DATE,
  eta                  DATE,
  atd                  DATE,
  ata                  DATE,
  incoterms            TEXT,
  final_delivery_date  DATE,
  doc_shu              BOOLEAN DEFAULT FALSE,
  doc_das              BOOLEAN DEFAULT FALSE,
  doc_mir              BOOLEAN DEFAULT FALSE,
  doc_agi              BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wh.stock_onhand (
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

CREATE INDEX idx_cases_case_no ON "case".cases (case_no);
CREATE INDEX idx_cases_sct_ship_no ON "case".cases (sct_ship_no);
CREATE INDEX idx_flows_case_no ON "case".flows (case_no);
CREATE INDEX idx_flows_sct_ship_no ON "case".flows (sct_ship_no);
CREATE INDEX idx_shipments_status_hvdc_code ON status.shipments_status (hvdc_code);

ALTER TABLE "case".cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE status.shipments_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh.stock_onhand ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_read ON "case".cases FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON "case".cases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON "case".flows FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON "case".flows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON status.shipments_status FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON status.shipments_status FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON wh.stock_onhand FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON wh.stock_onhand FOR ALL TO service_role USING (true) WITH CHECK (true);

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

SELECT 'Tables recreated successfully' AS result;
`

async function tryPgMeta() {
  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: DROP_RECREATE_SQL }),
  })
  const text = await response.text()
  console.log(`pg-meta status: ${response.status}`)
  console.log(`pg-meta body: ${text.slice(0, 300)}`)
  return response.ok
}

async function tryRpc() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.rpc('exec_sql', { sql: DROP_RECREATE_SQL })
  if (error) {
    console.log('exec_sql RPC failed:', error.message)
    return false
  }
  console.log('exec_sql RPC success:', data)
  return true
}

console.log('Attempting to recreate tables with correct schema...\n')
try {
  const ok = await tryPgMeta()
  if (!ok) {
    console.log('\nTrying RPC fallback...')
    await tryRpc()
  }
} catch (error) {
  console.error('Error:', error.message)
}
