# Realtime KPI Dashboard — Detailed Development Plan (Post Data Load)

> This document extends `plan.md` and focuses on the *next* execution tranche: finishing data loading, validating Gate 1, then tightening Realtime + KPI update guarantees.
>
> Assumptions:
> - Data layer follows `status.*` + `case.*` schemas as in `DATA_LOADING_PLAN.md`.
> - Frontend consumes views (e.g. `public.v_shipments_master`) and avoids client-side JOIN, per `ETL_GUIDE.md`.

---

## Workstream A — Data Loading (Phase 1~7)

### A1. Preflight
- Run `scripts/hvdc/validate_inputs.py` (hard fail on missing Status/Warehouse, optional on Customs if Option-C disabled)

### A2. Apply DDL
- Apply `supabass_ontol/20260124_hvdc_layers_status_case_ops.sql`
- Confirm indexes + RLS present

### A3. Run ETL
- Status: `scripts/hvdc/run_etl_status.sh`
- Case: `scripts/hvdc/run_etl_case.sh`

### A4. Load CSV
- Use `scripts/hvdc/load_csv.psql` via psql `\copy`

### A5. Gate 1 QA
- `scripts/hvdc/run_gate1_qa.sh`

### A6. Views + API
- Ensure required views exist (or create in a migration)
- Validate `/api/worklist`

### A7. Documentation
- Fill `docs/DATA_LOADING_REPORT_TEMPLATE.md`

---

## Workstream B — Realtime Configuration & RLS

### B1. Publication
- Apply migration: `supabase/migrations/20260124_enable_realtime_layers.sql`

### B2. RLS subscription validation
- Confirm the Realtime subscriber role can SELECT rows it should receive.
- Validate subscription filters (schema/table) in the client match `status` / `case` schemas.

---

## Workstream C — Realtime KPI Update Strategy

### Option A (MVP): Debounced re-fetch
- Subscribe to `status.shipments_status` (and optionally `case.events_case`) changes.
- Debounce 300–500ms and call `/api/worklist` to refresh KPI + worklist.

### Option C (Segment KPIs): View refresh on events
- Subscribe to `case.events_case` + `case.flows`.
- On relevant event types, refresh materialized views (if introduced) or re-query views via API.

---

## Workstream D — Performance & Reliability

- Measure DB change → UI render latency.
- Keep fallback polling when Realtime is disconnected.
- Add batch handling (buffer multiple row changes into one UI update).

---

## Acceptance Gates

1. Gate 1 QA: all checks pass (0 orphans, 0 rule violations).
2. Realtime: subscription establishes within 3s and receives updates.
3. KPI SLA: p95 KPI update latency < 3s under normal update cadence.

