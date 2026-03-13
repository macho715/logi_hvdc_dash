#!/usr/bin/env node
/**
 * HVDC Dashboard – Supabase Seed Script
 * Inserts 300 cases, 300 flows, 300 shipments, 150 stock items
 *
 * Run from project root:
 *   node scripts/seed-data.mjs
 *
 * Or with pnpm (from apps/logistics-dashboard):
 *   cd apps/logistics-dashboard && node ../../scripts/seed-data.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = 'https://rkfffveonaskewwzghex.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF      = 'rkfffveonaskewwzghex'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand      = arr => arr[Math.floor(Math.random() * arr.length)]
const randInt   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const randFloat = (a, b, d = 2) => parseFloat((Math.random() * (b - a) + a).toFixed(d))
const addDays   = (base, n) => {
  const d = new Date(base); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── Lookup tables ────────────────────────────────────────────────────────────
const SITES        = ['SHU', 'MIR', 'DAS', 'AGI']
const VENDOR_POOL  = ['Hitachi', 'Siemens', 'ABB', 'Nexans', 'Prysmian', 'GE Grid', 'Toshiba', 'Mitsubishi']
const normVendor   = v => (v === 'Hitachi' || v === 'Siemens') ? v : 'Other'
const STATUS_LOCS  = ['DSV Indoor', 'DSV Outdoor', 'DSV Al Markaz', 'MOSB', 'JDN MZD', 'JDN Waterfront', 'Zener WH']
const CATEGORIES   = ['Cable', 'Transformer', 'Reactor', 'Valve Group', 'Control Equipment', 'Bus Bar', 'Cooling Equipment', 'Switchgear']
const PORTS_LOAD   = ['Shanghai Port', 'Busan Port', 'Rotterdam', 'Hamburg', 'Yokohama', 'Singapore']
const PORTS_DISC   = ['Khalifa Port', 'Mina Zayed', 'KPCT', 'Jebel Ali']
const VESSELS      = ['MV Pacific Carrier', 'MV Arabian Gulf', 'MV Desert Star', 'MV Horizon', 'MV Orient Bridge', 'MV Gulf Express', 'MV Silk Road', 'MV Fujairah Star']
const SHIP_MODES   = ['B', 'C', 'C', 'B', 'B', 'A']
const INCOTERMS    = ['CIF', 'CFR', 'DAP', 'FOB', 'CIF', 'CIF']
const FLOW_DESC    = { 0:'Pre Arrival', 1:'Direct Delivery', 2:'Warehouse → Site', 3:'MOSB → Site', 4:'Warehouse → MOSB → Site', 5:'Mixed / Incomplete' }
const STOCK_DESCS  = [
  'XLPE Cable 132kV 1000mm²', 'Valve Group Assembly VG-A', 'Smoothing Reactor SR-500',
  'AC Filter Bus Bar 500kV', 'Cooling Water System Module', 'Control Cabinet Assembly',
  'HVDC Transformer Unit 500kV', 'Cable Joint Kit 400kV', 'Converter Transformer Bushing',
  'DC Yard Equipment Panel', 'AC Switchgear Module', 'Station Earthing Kit',
  'Reactive Power Compensator', 'HVDC Converter Bridge', 'DC Line Reactor',
]

// ─── Generate data ────────────────────────────────────────────────────────────
// Site distribution: AGI 40 %, SHU 20 %, MIR 20 %, DAS 20 %
const SITE_DIST = [
  ...Array(120).fill('AGI'),
  ...Array(60).fill('SHU'),
  ...Array(60).fill('MIR'),
  ...Array(60).fill('DAS'),
]

const cases     = []
const flows     = []
const shipments = []
const stock     = []

const BASE = '2025-01-01'

for (let i = 0; i < 300; i++) {
  const site      = SITE_DIST[i]
  const offshore  = site === 'AGI' || site === 'DAS'

  // Flow code: offshore must be >= 3
  const flowCode  = offshore ? rand([3, 3, 4, 4, 5]) : rand([0, 1, 1, 2, 2, 3, 4, 5])
  const flowOrig  = (offshore && Math.random() < 0.25 && flowCode >= 3) ? rand([0, 1, 2]) : flowCode

  // Status
  let statusCurrent
  if (flowCode === 0)            statusCurrent = 'Pre Arrival'
  else if (site === 'AGI')       statusCurrent = rand(['site', 'site', 'warehouse', 'warehouse', 'warehouse'])
  else                           statusCurrent = rand(['site', 'site', 'site', 'warehouse', 'warehouse'])

  const vendor  = rand(VENDOR_POOL)
  const caseNo  = `HVDC-${site}-${String(i + 1).padStart(5, '0')}`
  const hvdc    = `SCT-${String(2001 + i).padStart(6, '0')}`
  const etd     = addDays(BASE, randInt(0, 420))
  const eta     = addDays(etd, randInt(18, 65))
  const ata     = statusCurrent !== 'Pre Arrival' ? addDays(eta, randInt(-10, 20)) : null
  const arrived = statusCurrent === 'site' && ata ? addDays(ata, randInt(2, 45)) : null

  cases.push({
    case_no:           caseNo,
    hvdc_code:         hvdc,
    site,
    flow_code:         flowCode,
    flow_description:  FLOW_DESC[flowCode],
    status_current:    statusCurrent,
    status_location:   statusCurrent === 'warehouse' ? rand(STATUS_LOCS) : null,
    final_location:    site,
    sqm:               randFloat(2, 250),
    source_vendor:     normVendor(vendor),
    storage_type:      rand(['Indoor', 'Outdoor', 'Open Yard']),
    stack_status:      rand(['Stackable', 'Non-Stackable', null]),
    category:          rand(CATEGORIES),
    sct_ship_no:       hvdc,
    site_arrival_date: arrived,
    cbm:               randFloat(0.5, 60),
  })

  flows.push({
    hvdc_code:          hvdc,
    flow_code:          flowCode,
    flow_code_original: flowOrig,
    override_reason:    flowCode !== flowOrig ? 'AGI/DAS requires MOSB leg (Flow Code ≥ 3)' : null,
  })

  shipments.push({
    hvdc_code:  hvdc,
    status_no:  `SS-${String(i + 1).padStart(4, '0')}`,
    vendor,
    pol:        rand(PORTS_LOAD),
    pod:        rand(PORTS_DISC),
    vessel:     rand(VESSELS),
    bl_awb:     `BL${randInt(1000000, 9999999)}`,
    ship_mode:  rand(SHIP_MODES),
    etd,
    eta,
    atd:        ata,
    ata,
    incoterms:  rand(INCOTERMS),
  })
}

// 150 stock items
for (let i = 1; i <= 150; i++) {
  const prefix = rand(['CB', 'TR', 'RC', 'VG', 'CE', 'BB', 'CL', 'SW'])
  stock.push({
    no:           i,
    sku:          `${prefix}-${randInt(10000, 99999)}`,
    description:  rand(STOCK_DESCS),
    location:     rand(STATUS_LOCS),
    pallet_id:    `PLT-${randInt(1000, 9999)}`,
    qty:          randInt(1, 25),
    shipping_ref: `SCT-${String(randInt(2001, 2300)).padStart(6, '0')}`,
    date_received: addDays('2024-01-01', randInt(0, 500)),
  })
}

// ─── DDL via Supabase Management API ─────────────────────────────────────────
const DDL_SQL = `
CREATE SCHEMA IF NOT EXISTS "case";
CREATE SCHEMA IF NOT EXISTS status;
CREATE SCHEMA IF NOT EXISTS wh;

CREATE TABLE IF NOT EXISTS "case".cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_no TEXT NOT NULL, hvdc_code TEXT, site TEXT, flow_code INTEGER,
  flow_description TEXT, status_current TEXT, status_location TEXT,
  final_location TEXT, sqm NUMERIC, source_vendor TEXT, storage_type TEXT,
  stack_status TEXT, category TEXT, sct_ship_no TEXT, site_arrival_date DATE,
  cbm NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "case".flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code TEXT NOT NULL, flow_code INTEGER, flow_code_original INTEGER,
  override_reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status.shipments_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hvdc_code TEXT NOT NULL, status_no TEXT, vendor TEXT, pol TEXT, pod TEXT,
  vessel TEXT, bl_awb TEXT, ship_mode TEXT, etd DATE, eta DATE, atd DATE,
  ata DATE, incoterms TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wh.stock_onhand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no INTEGER, sku TEXT, description TEXT, location TEXT, pallet_id TEXT,
  qty INTEGER, shipping_ref TEXT, date_received DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "case".cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE status.shipments_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh.stock_onhand ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='cases' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON "case".cases FOR SELECT TO anon USING (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='cases' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON "case".cases FOR ALL TO service_role USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='flows' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON "case".flows FOR SELECT TO anon USING (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='case' AND tablename='flows' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON "case".flows FOR ALL TO service_role USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='status' AND tablename='shipments_status' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON status.shipments_status FOR SELECT TO anon USING (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='status' AND tablename='shipments_status' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON status.shipments_status FOR ALL TO service_role USING (true) WITH CHECK (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='wh' AND tablename='stock_onhand' AND policyname='anon_read') THEN
    EXECUTE 'CREATE POLICY anon_read ON wh.stock_onhand FOR SELECT TO anon USING (true)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='wh' AND tablename='stock_onhand' AND policyname='service_all') THEN
    EXECUTE 'CREATE POLICY service_all ON wh.stock_onhand FOR ALL TO service_role USING (true) WITH CHECK (true)'; END IF;
END $$;

CREATE OR REPLACE VIEW public.shipments AS
SELECT
  ss.hvdc_code::text AS id, ss.hvdc_code AS sct_ship_no,
  NULL::text AS mr_number, NULL::text AS commercial_invoice_no, NULL::date AS invoice_date,
  ss.vendor, NULL::text AS main_description, ss.pol AS port_of_loading, ss.pod AS port_of_discharge,
  ss.vessel AS vessel_name, ss.bl_awb AS bl_awb_no, ss.ship_mode, NULL::text AS coe,
  ss.etd, ss.eta, NULL::date AS do_collection_date, NULL::date AS customs_start_date,
  NULL::date AS customs_close_date, ss.ata AS delivery_date,
  NULL::numeric(12,2) AS duty_amount_aed, NULL::numeric(12,2) AS vat_amount_aed, ss.incoterms,
  (SELECT f.flow_code          FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code,
  (SELECT f.flow_code_original FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_code_original,
  (SELECT f.override_reason    FROM "case".flows f WHERE f.hvdc_code = ss.hvdc_code LIMIT 1) AS flow_override_reason,
  (SELECT c.final_location     FROM "case".cases c WHERE c.hvdc_code = ss.hvdc_code LIMIT 1) AS final_location
FROM status.shipments_status ss;

GRANT SELECT ON public.shipments TO anon, authenticated;
`

async function tryMgmtDDL() {
  console.log('  ⟳ Trying Supabase Management API (DDL)...')
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: DDL_SQL }),
    })
    if (res.ok) {
      console.log('  ✅ Management API DDL succeeded')
      return true
    }
    const body = await res.text()
    console.log(`  ⚠️  Management API returned ${res.status} – ${body.slice(0, 120)}`)
  } catch (e) {
    console.log('  ⚠️  Management API unreachable:', e.message)
  }
  return false
}

// ─── Batch insert helper ──────────────────────────────────────────────────────
async function insertBatch(supabase, schema, table, data, label) {
  const BS = 50
  let total = 0
  for (let i = 0; i < data.length; i += BS) {
    const batch = data.slice(i, i + BS)
    const q = schema
      ? supabase.schema(schema).from(table).upsert(batch, { onConflict: 'id' })
      : supabase.from(table).upsert(batch, { onConflict: 'id' })
    const { error } = await q
    if (error) {
      process.stdout.write('\n')
      console.error(`  ❌ ${label} [${i}–${i + BS}]: ${error.message}`)
      if (error.message.includes('does not exist')) return false
    } else {
      total += batch.length
      process.stdout.write(`\r  ↳ ${label}: ${total}/${data.length}`)
    }
  }
  process.stdout.write('\n')
  console.log(`  ✅ ${label}: ${total} rows`)
  return true
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════')
  console.log('  HVDC Dashboard – Supabase Seed')
  console.log('══════════════════════════════════════════════')
  console.log(`  URL : ${SUPABASE_URL}`)
  console.log(`  Data: ${cases.length} cases · ${shipments.length} shipments · ${flows.length} flows · ${stock.length} stock`)
  console.log()

  // Step 1 – DDL
  console.log('Step 1 – Schema / table setup')
  const ddlOk = await tryMgmtDDL()
  if (!ddlOk) {
    console.log('  ℹ️  DDL via Management API failed.')
    console.log('     If tables do not yet exist, run scripts/setup-schemas.sql in:')
    console.log('     https://app.supabase.com/project/rkfffveonaskewwzghex/editor')
    console.log('     Then re-run this script.')
    console.log()
  }

  // Step 2 – Insert data
  console.log('Step 2 – Inserting data')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const r1 = await insertBatch(supabase, 'case',   'cases',             cases,     'case.cases')
  const r2 = await insertBatch(supabase, 'case',   'flows',             flows,     'case.flows')
  const r3 = await insertBatch(supabase, 'status', 'shipments_status',  shipments, 'status.shipments_status')
  const r4 = await insertBatch(supabase, 'wh',     'stock_onhand',      stock,     'wh.stock_onhand')

  console.log()
  console.log('══════════════════════════════════════════════')
  if (r1 && r2 && r3 && r4) {
    console.log('  ✅ Seed complete!  Refresh localhost:3001')
  } else {
    console.log('  ⚠️  Some tables missing – run setup-schemas.sql first, then re-seed.')
  }
  console.log('══════════════════════════════════════════════')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
