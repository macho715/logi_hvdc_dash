/**
 * Recreate tables with correct schema by calling Supabase pg-meta API
 */

const SUPABASE_URL = 'https://rkfffveonaskewwzghex.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DROP_RECREATE_SQL = `
-- Drop and recreate tables with correct schema
DROP TABLE IF EXISTS "case".cases CASCADE;
DROP TABLE IF EXISTS "case".flows CASCADE;
DROP TABLE IF EXISTS status.shipments_status CASCADE;
DROP TABLE IF EXISTS wh.stock_onhand CASCADE;
DROP VIEW IF EXISTS public.shipments CASCADE;

-- case.cases
CREATE TABLE "case".cases (
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

-- case.flows
CREATE TABLE "case".flows (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code           TEXT NOT NULL,
  flow_code           INTEGER,
  flow_code_original  INTEGER,
  override_reason     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- status.shipments_status
CREATE TABLE status.shipments_status (
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

-- wh.stock_onhand
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

-- RLS
ALTER TABLE "case".cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE status.shipments_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh.stock_onhand ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY anon_read ON "case".cases FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON "case".cases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON "case".flows FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON "case".flows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON status.shipments_status FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON status.shipments_status FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anon_read ON wh.stock_onhand FOR SELECT TO anon USING (true);
CREATE POLICY service_all ON wh.stock_onhand FOR ALL TO service_role USING (true) WITH CHECK (true);

-- public.shipments view
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

NOTIFY pgrst, 'reload schema';

SELECT 'Tables recreated successfully' AS result;
`

async function tryPgMeta() {
  // Try calling pg-meta API (internal Supabase service)
  const url = `${SUPABASE_URL}/pg/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: DROP_RECREATE_SQL })
  })
  const text = await res.text()
  console.log(`pg-meta status: ${res.status}`)
  console.log(`pg-meta body: ${text.substring(0, 300)}`)
  return res.ok
}

async function tryRpc() {
  // Try using supabase client rpc with postgres extensions
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Try exec_sql RPC (may not exist)
  const { data, error } = await sb.rpc('exec_sql', { sql: DROP_RECREATE_SQL })
  if (error) {
    console.log('exec_sql RPC failed:', error.message)
    return false
  }
  console.log('exec_sql RPC success:', data)
  return true
}

console.log('Attempting to recreate tables with correct schema...\n')
try {
  const pgMetaOk = await tryPgMeta()
  if (!pgMetaOk) {
    console.log('\nTrying RPC fallback...')
    await tryRpc()
  }
} catch (e) {
  console.error('Error:', e.message)
}
