#!/usr/bin/env node
/**
 * Excel → Supabase data import
 *
 * Prerequisites:
 *   1. Run supabase/migrations/20260313_add_shipment_columns.sql in Supabase SQL editor first
 *   2. Set env vars: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/import-excel.mjs [--dry-run] [/path/to/HVDC STATUS1.xlsx]
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BATCH_SIZE = 200
const DEFAULT_EXCEL_PATH = path.resolve(__dirname, '../../../Logi ontol core doc/HVDC STATUS1.xlsx')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const FLOW_LABELS = {
  0: 'Pre Arrival',
  1: 'Port->Site',
  2: 'Port->WH->Site',
  3: 'Port->MOSB->Site',
  4: 'Port->WH->MOSB->Site',
  5: 'Mixed / Incomplete',
}

// ── helpers ──────────────────────────────────────────────────────────────────

function textValue(value) {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeDate(value) {
  if (!value) return null
  const text = String(value).trim()
  if (!text) return null
  const dateStr = text.slice(0, 10)
  // Reject invalid Excel serial-0 dates like "1900-01-00" and pre-1970 sentinel values
  if (dateStr.endsWith('-00') || dateStr < '1970-01-01') return null
  return dateStr
}

function toNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toInteger(value, fallback = null) {
  if (value == null || value === '') return fallback
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeStorage(value) {
  if (value == null) return null
  const raw = String(value).trim().toLowerCase()
  if (!raw) return null
  if (raw === 'indoor') return 'Indoor'
  if (raw === 'outdoor' || raw === 'outtdoor') return 'Outdoor'
  if (raw.startsWith('outdoor cov') || raw === 'outdoor covered' || raw === 'open yard') {
    return 'Outdoor Cov'
  }
  return null
}

function normalizeSite(value) {
  if (value == null) return null
  const raw = String(value).trim().toUpperCase()
  return ['SHU', 'MIR', 'DAS', 'AGI'].includes(raw) ? raw : null
}

function normalizeCaseVendor(value) {
  if (value == null) return null
  const raw = String(value).trim().toUpperCase()
  if (raw === 'HITACHI') return 'Hitachi'
  if (raw === 'SIEMENS') return 'Siemens'
  return textValue(value)
}

function normalizeDocFlag(value) {
  return String(value ?? '').trim().toUpperCase() === 'O'
}

function daysDiff(d1, d2) {
  if (!d1 || !d2) return null
  const ms = new Date(d1).getTime() - new Date(d2).getTime()
  if (!Number.isFinite(ms)) return null
  return Math.round(ms / 86400000)
}

// ── Excel parsing ─────────────────────────────────────────────────────────────

function parseWorkbook(excelPath) {
  const python = `
import json
import sys
from datetime import date, datetime
from openpyxl import load_workbook

def encode_cell(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value

def sheet_to_rows(ws):
    rows = ws.iter_rows(values_only=True)
    headers = [str(v).strip() if v is not None else f"col_{i}" for i, v in enumerate(next(rows))]
    data = []
    for row in rows:
        item = {}
        for i, key in enumerate(headers):
            item[key] = encode_cell(row[i] if i < len(row) else None)
        data.append(item)
    return data

wb = load_workbook(sys.argv[1], read_only=True, data_only=True)
payload = {
    "wh_status": sheet_to_rows(wb["wh status"]),
    "hvdc_all_status": sheet_to_rows(wb["hvdc all status"]),
}
print(json.dumps(payload, ensure_ascii=False))
`

  const output = execFileSync('python', ['-c', python, excelPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  })

  return JSON.parse(output)
}

// ── data transformers ─────────────────────────────────────────────────────────

function transformCases(rows) {
  return rows.map((row, index) => {
    const flowCode = toInteger(row['FLOW_CODE'], 5)
    return {
      case_no: textValue(row['Case No.']) ?? `CASE-${String(index + 1).padStart(5, '0')}`,
      sct_ship_no: textValue(row['SCT SHIP NO.']),
      hvdc_code: textValue(row['EQ No']),
      site: normalizeSite(row['Site']),
      flow_code: flowCode,
      flow_description: textValue(row['FLOW_DESCRIPTION']) ?? FLOW_LABELS[flowCode] ?? FLOW_LABELS[5],
      status_current: textValue(row['Status_Current']) ?? 'Pre Arrival',
      status_location: textValue(row['Status_Location']),
      final_location: textValue(row['Final_Location']),
      sqm: toNumber(row['SQM']),
      cbm: toNumber(row['CBM']),
      source_vendor: normalizeCaseVendor(row['Source_Vendor']),
      storage_type: normalizeStorage(row['Storage']),
      stack_status: textValue(row['Stack_Status']),
      category: null,
      site_arrival_date: normalizeDate(row['Status_Location_Date']),
    }
  })
}

function transformFlows(rows) {
  const seen = new Set()
  const flows = []

  for (const row of rows) {
    const caseNo = textValue(row['Case No.'])
    if (!caseNo || seen.has(caseNo)) continue
    seen.add(caseNo)
    const flowCode = toInteger(row['FLOW_CODE'], 5)
    flows.push({
      case_no: caseNo,
      sct_ship_no: textValue(row['SCT SHIP NO.']),
      hvdc_code: textValue(row['EQ No']),
      flow_code: flowCode,
      flow_description: textValue(row['FLOW_DESCRIPTION']) ?? FLOW_LABELS[flowCode] ?? FLOW_LABELS[5],
    })
  }

  return flows
}

function transformShipments(rows) {
  const deduped = new Map()

  for (const row of rows) {
    const hvdcCode = textValue(row['SCT SHIP NO.'])
    if (!hvdcCode) continue

    const eta = normalizeDate(row['ETA'])
    const ata = normalizeDate(row['ATA'])
    const attestationDate = normalizeDate(row['Attestation Date'])
    const customsClose = normalizeDate(row['Customs Close'])
    const finalDelivery = normalizeDate(row['FINAL DELIVERY'])

    deduped.set(hvdcCode, {
      hvdc_code: hvdcCode,
      status_no: textValue(row['MR#']),
      vendor: textValue(row['VENDOR']),
      pol: textValue(row['POL']),
      pod: textValue(row['POD']),
      vessel: textValue(row['VESSEL NAME/ FLIGHT No.']),
      bl_awb: textValue(row['B/L No./ AWB No.']),
      ship_mode: textValue(row['SHIP MODE']),
      etd: normalizeDate(row['ETD']),
      atd: normalizeDate(row['ATD']),
      eta,
      ata,
      incoterms: textValue(row['INCOTERMS']),
      final_delivery_date: finalDelivery,
      transit_days: daysDiff(ata, eta),
      customs_days: daysDiff(customsClose, attestationDate),
      inland_days: daysDiff(finalDelivery, customsClose),
      doc_shu: normalizeDocFlag(row['DOC_SHU']),
      doc_das: normalizeDocFlag(row['DOC_DAS']),
      doc_mir: normalizeDocFlag(row['DOC_MIR']),
      doc_agi: normalizeDocFlag(row['DOC_AGI']),
    })
  }

  return Array.from(deduped.values())
}

// ── Supabase RPC helpers ──────────────────────────────────────────────────────

function isValidSupabaseConfig() {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return false
    if (SUPABASE_URL === 'True' || SERVICE_ROLE_KEY === 'True') return false
    new URL(SUPABASE_URL)
    return true
  } catch {
    return false
  }
}

async function rpcCall(supabase, fn, args) {
  const { error } = await supabase.rpc(fn, args)
  if (error) throw new Error(`RPC ${fn}: ${error.message}`)
}

async function insertBatchesViaRpc(supabase, fn, rows, label) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    await rpcCall(supabase, fn, { p_rows: batch })
    process.stdout.write(`\r  ${label}: ${Math.min(i + batch.length, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const excelArg = args.find((arg) => arg !== '--dry-run')
  const excelPath = excelArg ? path.resolve(excelArg) : DEFAULT_EXCEL_PATH

  console.log('Parsing workbook...')
  const workbook = parseWorkbook(excelPath)
  const cases = transformCases(workbook.wh_status ?? [])
  const flows = transformFlows(workbook.wh_status ?? [])
  const shipments = transformShipments(workbook.hvdc_all_status ?? [])

  console.log(`  cases: ${cases.length}`)
  console.log(`  flows: ${flows.length}`)
  console.log(`  shipments: ${shipments.length}`)

  if (shipments.length > 0) {
    const s = shipments[0]
    console.log(`  sample: ${s.hvdc_code} | transit=${s.transit_days}d customs=${s.customs_days}d inland=${s.inland_days}d`)
  }

  if (dryRun || !isValidSupabaseConfig()) {
    if (!isValidSupabaseConfig()) {
      console.log('Supabase env missing or placeholder — no DB writes.')
    }
    return
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  console.log('Clearing existing data (via RPC)...')
  await rpcCall(supabase, 'import_truncate_tables', {})

  console.log('Inserting batches (via RPC)...')
  await insertBatchesViaRpc(supabase, 'import_cases_batch', cases, 'case.cases')
  await insertBatchesViaRpc(supabase, 'import_flows_batch', flows, 'case.flows')
  await insertBatchesViaRpc(supabase, 'import_shipments_batch', shipments, 'status.shipments_status')

  console.log('Import complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
