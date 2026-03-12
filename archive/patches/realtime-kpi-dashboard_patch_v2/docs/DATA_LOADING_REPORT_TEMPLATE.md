# HVDC Data Loading Report (Template)

- Date (Asia/Dubai):
- Operator:
- Supabase Project:
- Repo branch/commit:

---

## 1) Inputs

| Item | Path | OK? | Notes |
|---|---|---:|---|
| Status JSON | `supabass_ontol/HVDC all status.json` (or `HVDC_all_status.json`) |  |  |
| Warehouse JSON | `supabass_ontol/hvdc_warehouse_status.json` |  |  |
| Customs JSON (Option‑C) | `supabass_ontol/HVDC_STATUS.json` |  |  |

---

## 2) DDL

- Applied: `supabass_ontol/20260124_hvdc_layers_status_case_ops.sql`
- Result:
  - [ ] status schema created
  - [ ] case schema created
  - [ ] indexes created
  - [ ] RLS policies verified

---

## 3) ETL Outputs

### 3.1 Status SSOT (Untitled-4)

| File | Expected | Exists | Row count |
|---|---:|---:|---:|
| `hvdc_output/supabase/shipments_status.csv` | yes |  |  |
| `hvdc_output/supabase/events_status.csv` | yes |  |  |
| `hvdc_output/supabase/schema.sql` | yes |  | n/a |
| `hvdc_output/report/qa_report.md` | yes |  | n/a |
| `hvdc_output/report/orphan_wh.json` | yes |  | n/a |

### 3.2 Option‑C Case (Untitled-3)

| File | Expected | Exists | Row count |
|---|---:|---:|---:|
| `supabase_csv_optionC_v3/locations.csv` | yes |  |  |
| `supabase_csv_optionC_v3/shipments_case.csv` | yes |  |  |
| `supabase_csv_optionC_v3/cases.csv` | yes |  |  |
| `supabase_csv_optionC_v3/flows.csv` | yes |  |  |
| `supabase_csv_optionC_v3/events_case.csv` | yes |  |  |

---

## 4) Load Results (DB Row Counts)

| Table | Count | Notes |
|---|---:|---|
| `status.shipments_status` |  |  |
| `status.events_status` |  |  |
| `case.locations` |  |  |
| `case.shipments_case` |  |  |
| `case.cases` |  |  |
| `case.flows` |  |  |
| `case.events_case` |  |  |

---

## 5) Gate 1 QA

| Check | Query | Result | Pass? |
|---|---|---:|---:|
| Orphan status events | `orphan_status_events` |  |  |
| Orphan case events | `orphan_case_events` |  |  |
| Duplicate events_case | `dup_events_case_rows` |  |  |
| Flow code 5 requires_review | `bad_flow5` |  |  |
| AGI/DAS rule | `agi_das_violation` |  |  |

---

## 6) Views / API

- [ ] `public.v_shipments_master` exists (if required)
- [ ] `/api/worklist` returns expected payload

---

## 7) Realtime

- Migration applied: `supabase/migrations/20260124_enable_realtime_layers.sql`
- [ ] `status.shipments_status` subscription works
- [ ] KPI updates visible in UI

---

## 8) Issues & Follow-ups

- 

