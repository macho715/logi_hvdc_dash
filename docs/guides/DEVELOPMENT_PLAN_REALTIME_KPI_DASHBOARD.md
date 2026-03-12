# Realtime KPI Dashboard — Detailed Development Plan (Post Data Load)

> **최종 업데이트**: 2026-02-07  
> This document extends `plan.md` and focuses on the *next* execution tranche: finishing data loading, validating Gate 1, then tightening Realtime + KPI update guarantees.
>
> Assumptions:
> - Data layer follows `status.*` + `case.*` schemas as in `DATA_LOADING_PLAN.md`.
> - Frontend consumes views (e.g. `public.v_shipments_master`) and avoids client-side JOIN, per `ETL_GUIDE.md`.
> - UI/UX improvements completed (2026-02-05~2026-02-07): heatmap legend, zoom-based layer visibility, RightPanel tab UI, typography improvements, KPI strip header fixed, worklist simplified.

---

## Workstream A — Data Loading (Phase 1~7) ✅ 완료

### A1. Preflight ✅
- Run `scripts/hvdc/validate_inputs.py` (hard fail on missing Status/Warehouse, optional on Customs if Option-C disabled)

### A2. Apply DDL ✅ 완료 (2026-01-25)
- Apply `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql`
- Confirm indexes + RLS present

### A3. Run ETL ✅ 완료 (2026-01-25)
- Status: `scripts/hvdc/run_etl_status.sh` → CSV 생성 완료
- Case: `scripts/hvdc/run_etl_case.sh` (선택)

### A4. Load CSV ✅ 완료 (2026-01-25)
- Use `scripts/hvdc/load_csv.py` (UPSERT + FK 필터)
- 871 shipments + 928 events 적재 완료

### A5. Gate 1 QA ✅ 완료 (2026-01-25)
- `scripts/hvdc/gate1_qa.py` → 모든 검사 통과

### A6. Views + API ✅ 완료 (2026-01-25)
- `public.shipments` 뷰 생성 완료
- `/api/worklist` 검증 완료 (871 rows + KPI)

### A7. Documentation ✅
- `docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md` 업데이트 완료

---

## Workstream B — Realtime Configuration & RLS ✅ 완료

### B1. Publication ✅ 완료 (2026-01-25)
- Apply migration: `supabase/migrations/20260124_enable_realtime.sql`
- 5개 테이블 Realtime 활성화 완료

### B2. RLS subscription validation ✅ 완료
- Confirm the Realtime subscriber role can SELECT rows it should receive.
- Validate subscription filters (schema/table) in the client match `status` / `case` schemas.

---

## Workstream C — Realtime KPI Update Strategy ✅ 구현 완료 (2026-01-24)

### Option A+ (구현됨): Client-side KPI 재계산 + 배치 업데이트
- ✅ `useSupabaseRealtime`, `useKpiRealtime` 훅 구현 완료
- ✅ `useBatchUpdates` 배치 업데이트 구현 완료
- ✅ `useInitialDataLoad` 초기 데이터 로드 구현 완료
- ✅ 폴백 폴링 메커니즘 구현 완료

### Option C (Segment KPIs): View refresh on events
- Subscribe to `case.events_case` + `case.flows`.
- On relevant event types, refresh materialized views (if introduced) or re-query views via API.

---

## Workstream D — Performance & Reliability ✅ 부분 완료

- ✅ Fallback polling 구현 완료 (Realtime 실패 시 자동 전환)
- ✅ Batch handling 구현 완료 (`useBatchUpdates`로 다중 변경 버퍼링)
- ⏳ DB change → UI render latency 측정 (다음 단계)

---

## Acceptance Gates

1. Gate 1 QA: all checks pass (0 orphans, 0 rule violations). ✅ **완료** (2026-01-25)
2. Realtime: subscription establishes within 3s and receives updates. ✅ **완료** (2026-01-25)
3. KPI SLA: p95 KPI update latency < 3s under normal update cadence. ✅ **구현 완료** (2026-01-24)

## UI/UX Improvements (2026-02-05~2026-02-07) ✅

### Completed Enhancements
- ✅ Heatmap intensity legend (낮음~매우 높음)
- ✅ Zoom-based layer visibility (heatmap/status/POI layers)
- ✅ RightPanel tab UI (Status/Occupancy/Distribution)
- ✅ Typography improvements (base font 16px, text-sm scale, contrast enhancement)
- ✅ KPI summary strip fixed in header (2-row layout, `aria-live="polite"`)
- ✅ Layout spacing adjustments (HVDC panel overlap prevention)
- ✅ HVDC worklist simplification (core columns only, details in DetailDrawer)

### Impact on Realtime KPI Dashboard
- KPI summary strip now fixed in header for better visibility
- Improved readability with typography enhancements
- Better UX with tabbed RightPanel and simplified worklist

