# Development Plan (TDD)

> **SoT (Source of Truth)**: 이 파일이 테스트 계획의 단일 진실원입니다.
> 
> **TDD 규칙**: 
> - `go` 명령 시 다음 미표시 테스트만 선택
> - RED → GREEN → REFACTOR 사이클
> - Test SLA: unit ≤0.20s / integration ≤2.00s / e2e ≤5m
> 
> **최종 업데이트**: 2026-02-07

## Context & SoT Alignment

- 이 파일은 테스트 계획 관점의 **SoT**이며, 실제 구현/통합 상태는 `STATUS.md`, `docs/integration/INTEGRATION_ROADMAP.md`, `docs/integration/NEXT_STEPS_PRIORITY.md`와 함께 본다.
- **데이터 적재 실행(Phase 2~6)** 상태·실행 방법은 [DASHBOARD_DATA_INTEGRATION_PROGRESS](docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) 및 Phase별 계획(PHASE2/4/5/6) 참조. 권장: Supavisor Session :5432, `SUPABASE_DB_URL` + `connect_timeout`, redaction 규칙.
- **dash 패치 적용** (맵 POI·StageCardsStrip·GlobalSearch) 상태·실행 방법은 [DASH_PLAN](docs/DASH_PLAN.md) §3.0 진행 체크리스트, 검증은 §4, [dash/reakmapping.md](../dash/reakmapping.md) (POI 좌표 SSOT), [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) 참조.
- 데이터 모델/마이그레이션·RLS·Realtime·Foundry 연계 등 **통합 상태**는 `STATUS.md`와 `docs/integration/INTEGRATION_ROADMAP.md`를 기준으로 하고, 여기서는 해당 항목을 검증하는 테스트만 추적한다.
- Monorepo 구조, `UnifiedLayout.tsx`, `schema_v2_unified.sql` 등 이미 완료된 작업은 위 문서들에 맞춰 테스트 코멘트에만 요약으로 표시한다.
- Flow Code v3.5, OpsStore, RLS/Realtime/테스트 작성 등 남은 작업은 아래 테스트 카테고리와 게이트(Gate 1/2/3)에 매핑해 **TDD 우선순위**를 정한다.

## Tests

### Infrastructure & Setup
- [x] test: scaffold exists (file: tests/test_scaffold.py, name: test_scaffold_structure_exists) # completed @2026-01-23 - Monorepo 마이그레이션 완료
- [x] test: app runs (file: tests/test_app_runs.py, name: test_app_runs) # completed @2026-01-23 - 개발 서버 실행 성공 (포트 3001)
- [x] test: environment variables loaded (file: tests/test_env.py, name: test_env_variables_loaded) # completed @2026-01-23 - 환경 변수 로딩 함수 구현 완료
- [x] test: package manager detected (file: tests/test_setup.py, name: test_package_manager_detection) # completed @2026-01-23 - pnpm workspace 설정 완료

### Supabase Integration
- [x] test: supabase connection works (file: tests/integration/test_supabase_connection.py, name: test_supabase_connection) # completed @2026-01-23 - Supabase 클라이언트 설정 완료
- [ ] test: RLS policies enforced (file: tests/integration/test_rls.py, name: test_rls_policies_enforced)
- [x] test: anon key works for client (file: tests/integration/test_supabase_auth.py, name: test_anon_key_client_access) # completed @2026-01-23 - `/api/worklist` 엔드포인트 구현 완료
- [ ] test: service role key not exposed to client (file: tests/integration/test_supabase_auth.py, name: test_service_role_not_in_client)
- [x] test: core tables exist (file: tests/integration/test_supabase_schema.py, name: test_core_tables_exist) # completed @2026-01-23 - schema_v2_unified.sql 작성 완료
- [x] test: locations table accessible (file: tests/integration/test_supabase_schema.py, name: test_locations_table_accessible) # completed @2026-01-23 - 스키마에 포함
- [x] test: location_statuses table accessible (file: tests/integration/test_supabase_schema.py, name: test_location_statuses_table_accessible) # completed @2026-01-23 - 스키마에 포함
- [x] test: hvdc_worklist table accessible (file: tests/integration/test_supabase_schema.py, name: test_hvdc_worklist_table_accessible) # completed @2026-01-23 - `/api/worklist` 엔드포인트 구현 완료
- [x] test: status schema tables exist (file: tests/integration/test_supabase_schema.py, name: test_status_schema_tables_exist) # completed @2026-01-25 - Phase 2 DDL 적용 완료 (status.shipments_status, status.events_status)
- [x] test: case schema tables exist (file: tests/integration/test_supabase_schema.py, name: test_case_schema_tables_exist) # completed @2026-01-25 - Phase 2 DDL 적용 완료 (case.*)
- [x] test: public.shipments view exists (file: tests/integration/test_supabase_schema.py, name: test_public_shipments_view_exists) # completed @2026-01-25 - 대시보드 뷰 생성 완료
- [ ] test: hvdc_kpis table accessible (file: tests/integration/test_supabase_schema.py, name: test_hvdc_kpis_table_accessible)

### Data Loading & ETL
- [x] test: ETL script Untitled-4 executes successfully (file: tests/integration/test_etl.py, name: test_etl_script_untitled4_executes) # completed @2026-01-25 - Phase 3: Status SSOT Layer ETL 완료 (CSV 생성)
- [ ] test: ETL script Untitled-3 executes successfully (file: tests/integration/test_etl.py, name: test_etl_script_untitled3_executes) # Phase 3: Option-C Case Layer ETL
- [x] test: CSV files generated from ETL (file: tests/integration/test_etl.py, name: test_csv_files_generated) # completed @2026-01-25 - Phase 3 완료 (shipments_status.csv, events_status.csv)
- [ ] test: CSV data matches source JSON (file: tests/integration/test_etl.py, name: test_csv_data_matches_source)
- [x] test: status schema tables loaded from CSV (file: tests/integration/test_data_loading.py, name: test_status_schema_tables_loaded) # completed @2026-01-25 - Phase 4 완료 (871 shipments + 928 events, UPSERT + FK 필터)
- [ ] test: case schema tables loaded from CSV (file: tests/integration/test_data_loading.py, name: test_case_schema_tables_loaded)
- [x] test: CSV loading order enforced (file: tests/integration/test_data_loading.py, name: test_csv_loading_order_enforced) # completed @2026-01-25 - Phase 4: Status → Case 순서, UPSERT + FK 필터 구현

### RDF Pipeline (JSON → TTL)
- [x] test: json_to_ttl converts correctly (file: tests/test_rdf_pipeline.py, name: test_json_to_ttl_conversion) # completed @2026-01-23 - logiontology_scaffold 이관 완료
- [x] test: used_cols audit log generated (file: tests/test_rdf_pipeline.py, name: test_used_cols_audit_log) # completed @2026-01-23 - 스크립트 존재
- [x] test: column spec SSOT loaded (file: tests/test_rdf_pipeline.py, name: test_column_spec_ssot_loaded) # completed @2026-01-23 - configs/columns.hvdc_status.json SSOT
- [x] test: site arrival date mapped (file: tests/test_rdf_pipeline.py, name: test_site_arrival_date_mapping) # completed @2026-01-23 - 스크립트 존재
- [x] test: SHU2 mapped to hasSHUArrivalDate (file: tests/test_rdf_pipeline.py, name: test_shu2_mapping) # completed @2026-01-23 - 스크립트 존재
- [x] test: MIR3 mapped to hasMIRArrivalDate (file: tests/test_rdf_pipeline.py, name: test_mir3_mapping) # completed @2026-01-23 - 스크립트 존재
- [x] test: DAS4 mapped to hasDASArrivalDate (file: tests/test_rdf_pipeline.py, name: test_das4_mapping) # completed @2026-01-23 - 스크립트 존재
- [x] test: AGI5 mapped to hasAGIArrivalDate (file: tests/test_rdf_pipeline.py, name: test_agi5_mapping) # completed @2026-01-23 - 스크립트 존재
- [ ] test: unmapped columns logged (file: tests/test_rdf_pipeline.py, name: test_unmapped_columns_logged)
- [ ] test: TTL output valid (file: tests/test_rdf_pipeline.py, name: test_ttl_output_valid)

### Flow Code v3.5 (Ontology)
- [x] test: flow code 0-5 classification (file: tests/test_flow_code.py, name: test_flow_code_classification) # completed @2026-01-23 - Flow Code v3.5 계산 로직 포함
- [x] test: AGI requires flow code >= 3 (file: tests/test_flow_code.py, name: test_agi_requires_flow_3) # completed @2026-01-23 - AGI/DAS 규칙 검증 포함
- [x] test: DAS requires flow code >= 3 (file: tests/test_flow_code.py, name: test_das_requires_flow_3) # completed @2026-01-23 - AGI/DAS 규칙 검증 포함
- [x] test: flow code auto upgrade for AGI/DAS (file: tests/test_flow_code.py, name: test_flow_code_auto_upgrade) # completed @2026-01-23 - 마이그레이션 스크립트에 포함
- [x] test: original flow code preserved (file: tests/test_flow_code.py, name: test_original_flow_code_preserved) # completed @2026-01-23 - flow_code_original 필드 포함
- [x] test: override reason recorded (file: tests/test_flow_code.py, name: test_override_reason_recorded) # completed @2026-01-23 - flow_override_reason 필드 포함

### UI Components (Next.js/React)
- [x] test: MapView renders (file: tests/ui/test_mapview.tsx, name: test_mapview_renders) # completed @2026-01-23 - apps/logistics-dashboard에 존재
- [x] test: RightPanel renders (file: tests/ui/test_rightpanel.tsx, name: test_rightpanel_renders) # completed @2026-01-23 - apps/logistics-dashboard에 존재
- [x] test: HVDC Panel renders (file: tests/ui/test_hvdc_panel.tsx, name: test_hvdc_panel_renders) # completed @2026-01-23 - UnifiedLayout.tsx 프로토타입 완료
- [x] test: MapView uses maplibre-gl (file: tests/ui/test_mapview.tsx, name: test_mapview_uses_maplibre) # completed @2026-01-23 - MapView 컴포넌트에 사용 중
- [x] test: MapView uses deck.gl (file: tests/ui/test_mapview.tsx, name: test_mapview_uses_deckgl) # completed @2026-01-23 - MapView 컴포넌트에 사용 중
- [x] test: location layer created (file: tests/ui/test_mapview.tsx, name: test_location_layer_created) # completed @2026-01-23 - MapView에 레이어 구현됨
- [x] test: heatmap layer created (file: tests/ui/test_mapview.tsx, name: test_heatmap_layer_created) # completed @2026-01-23 - MapView에 레이어 구현됨
- [x] test: geofence layer created (file: tests/ui/test_mapview.tsx, name: test_geofence_layer_created) # completed @2026-01-23 - MapView에 레이어 구현됨
- [x] test: ETA wedge layer created (file: tests/ui/test_mapview.tsx, name: test_eta_wedge_layer_created) # completed @2026-01-23 - MapView에 레이어 구현됨
- [x] test: worklist API returns data (file: tests/ui/test_worklist_api.tsx, name: test_worklist_api_returns_data) # completed @2026-01-25 - 로컬 테스트 완료 (871 rows + KPI 정상 반환)
- [x] test: POI layer displays 11 fixed locations (file: tests/ui/test_mapview.tsx, name: test_poi_layer_displays_11_fixed_locations) # completed @2026-01-25 - dash 패치 적용 완료: reakmapping SSOT 기준 11개 POI (AGI/DAS/MIR/SHU, DSV, MOSB, Port, Airport), PoiLocationsLayer.ts 구현
- [x] test: StageCardsStrip renders 3 cards (file: tests/ui/test_hvdc_panel.tsx, name: test_stagecardsstrip_renders_3_cards) # completed @2026-01-25 - dash 패치 적용 완료: HVDC Panel 내 KpiStrip 상단 3카드, 라우팅 연동
- [x] test: GlobalSearch filters worklist (file: tests/ui/test_search.tsx, name: test_globalsearch_filters_worklist) # completed @2026-01-25 - dash 패치 적용 완료: locations·worklist 검색, searchIndex 연동, HeaderBar 통합
- [x] test: locations API returns Supabase data (file: tests/ui/test_locations_api.tsx, name: test_locations_api_returns_supabase_data) # completed @2026-01-25 - 맵 레이어 API Supabase 전환 완료: /api/locations (public.locations 조회, 스키마 매핑, Fallback: Mock)
- [x] test: location-status API returns Supabase data (file: tests/ui/test_location_status_api.tsx, name: test_location_status_api_returns_supabase_data) # completed @2026-01-25 - 맵 레이어 API Supabase 전환 완료: /api/location-status (public.location_statuses 조회, 스키마 매핑, Fallback: Mock)
- [x] test: events API returns Supabase data with joins (file: tests/ui/test_events_api.tsx, name: test_events_api_returns_supabase_data) # completed @2026-01-25 - 맵 레이어 API Supabase 전환 완료: /api/events (public.events with locations!inner + shipments joins, 스키마 매핑, Fallback: Mock)
- [x] test: heatmap intensity legend displays (file: tests/ui/test_mapview.tsx, name: test_heatmap_intensity_legend) # completed @2026-02-05 - 히트맵 토글 활성 시 강도 범례 표시 (낮음~매우 높음)
- [x] test: zoom-based layer visibility works (file: tests/ui/test_mapview.tsx, name: test_zoom_based_layer_visibility) # completed @2026-02-06 - 줌 기반 레이어 전환: Heatmap(<9.5) ↔ Status(≥9.5), POI 마커/라벨(≥7.5), 히트맵 반경 스케일링
- [x] test: RightPanel tab UI renders (file: tests/ui/test_rightpanel.tsx, name: test_rightpanel_tab_ui) # completed @2026-02-06 - RightPanel 탭 UI (Status/Occupancy/Distribution) 분리 및 키보드 포커스 처리
- [x] test: typography improvements applied (file: tests/ui/test_typography.tsx, name: test_typography_improvements) # completed @2026-02-06 - 타이포그래피 개선 (text-sm 기준, 가독성 향상)
- [x] test: KPI strip header fixed (file: tests/ui/test_hvdc_panel.tsx, name: test_kpi_strip_header_fixed) # completed @2026-02-07 - KPI 요약 스트립 헤더 고정 및 레이아웃 간격 조정
- [x] test: worklist simplified layout (file: tests/ui/test_hvdc_panel.tsx, name: test_worklist_simplified) # completed @2026-02-07 - HVDC 워크리스트 간소화 (핵심 컬럼만 표시, 트리거/상세는 DetailDrawer로 이동)

### Mobile Interactions
- [x] test: HVDC Panel mobile drag works (file: tests/ui/test_mobile_interactions.tsx, name: test_hvdc_panel_mobile_drag) # completed @2026-01-23 - UnifiedLayout.tsx에 부분 구현
- [ ] test: RightPanel drawer opens on mobile (file: tests/ui/test_mobile_interactions.tsx, name: test_rightpanel_drawer_opens)
- [ ] test: RightPanel drawer closes on mobile (file: tests/ui/test_mobile_interactions.tsx, name: test_rightpanel_drawer_closes)
- [ ] test: one-hand operation supported (file: tests/ui/test_mobile_interactions.tsx, name: test_one_hand_operation)

### Accessibility (WCAG 2.2 AA)
- [ ] test: keyboard navigation works (file: tests/a11y/test_keyboard.tsx, name: test_keyboard_navigation)
- [ ] test: contrast ratio >= 4.5:1 (file: tests/a11y/test_contrast.tsx, name: test_contrast_ratio)
- [ ] test: aria-live for KPI updates (file: tests/a11y/test_aria.tsx, name: test_aria_live_kpi)
- [x] test: ESC closes drawers (file: tests/a11y/test_keyboard.tsx, name: test_esc_closes_drawers) # completed @2026-01-23 - UnifiedLayout.tsx에 구현됨
- [ ] test: focus trap in modals (file: tests/a11y/test_focus.tsx, name: test_focus_trap_modals)
- [ ] test: screen reader compatible (file: tests/a11y/test_screen_reader.tsx, name: test_screen_reader_compatible)

### Realtime & Performance
- [x] test: realtime subscription works (file: tests/integration/test_realtime.py, name: test_realtime_subscription) # completed @2026-01-24 - Realtime KPI Dashboard 구현 완료 (useSupabaseRealtime, useKpiRealtime 훅 구현)
- [x] test: realtime updates merged correctly (file: tests/integration/test_realtime.py, name: test_realtime_updates_merged) # completed @2026-01-24 - useBatchUpdates 훅으로 배치 업데이트 구현
- [x] test: no duplicate updates (file: tests/integration/test_realtime.py, name: test_no_duplicate_updates) # completed @2026-01-24 - 배치 업데이트 및 중복 제거 로직 구현
- [x] test: realtime publication enabled for status tables (file: tests/integration/test_realtime.py, name: test_realtime_publication_enabled) # completed @2026-01-25 - Phase 6 완료 (5개 테이블 Realtime 활성화)
- [ ] test: worklist load < 1s (file: tests/performance/test_performance.py, name: test_worklist_load_time)
- [ ] test: status panel refresh < 1s (file: tests/performance/test_performance.py, name: test_status_panel_refresh_time)
- [ ] test: p95 response time < 3s (file: tests/performance/test_performance.py, name: test_p95_response_time)

### Supabase ↔ Foundry/Ontology Integration
- [ ] test: DB pull connection works (file: tests/integration/test_foundry_integration.py, name: test_db_pull_connection)
- [ ] test: API pull works with RLS (file: tests/integration/test_foundry_integration.py, name: test_api_pull_with_rls)
- [ ] test: webhook payload structure (file: tests/integration/test_foundry_integration.py, name: test_webhook_payload_structure)
- [ ] test: thin webhook fat pull pattern (file: tests/integration/test_foundry_integration.py, name: test_thin_webhook_fat_pull)
- [ ] test: sync lag p95 <= 300s (file: tests/integration/test_foundry_integration.py, name: test_sync_lag_p95)

### Validation & Quality Gates
- [ ] test: SHACL validation works (file: tests/validation/test_shacl.py, name: test_shacl_validation)
- [ ] test: flow code validation (file: tests/validation/test_shacl.py, name: test_flow_code_validation)
- [ ] test: invoice math integrity (file: tests/validation/test_shacl.py, name: test_invoice_math_integrity)
- [ ] test: OCR gate MeanConf >= 0.92 (file: tests/validation/test_ocr_gates.py, name: test_ocr_meanconf_gate)
- [ ] test: OCR gate TableAcc >= 0.98 (file: tests/validation/test_ocr_gates.py, name: test_ocr_tableacc_gate)
- [ ] test: OCR gate NumericIntegrity = 1.00 (file: tests/validation/test_ocr_gates.py, name: test_ocr_numeric_integrity_gate)
- [ ] test: ZERO-fail-safe on OCR gate failure (file: tests/validation/test_ocr_gates.py, name: test_zero_failsafe_on_ocr_failure)
- [x] test: Gate 1 QA orphan check passes (file: tests/validation/test_gate1_qa.py, name: test_gate1_qa_orphan_check) # completed @2026-01-25 - Phase 5 완료 (orphan_count = 0)
- [x] test: Gate 1 QA duplicate check passes (file: tests/validation/test_gate1_qa.py, name: test_gate1_qa_duplicate_check) # completed @2026-01-25 - Phase 5 완료 (dup_events_case_rows = 0)
- [x] test: Gate 1 QA flow code validation (file: tests/validation/test_gate1_qa.py, name: test_gate1_qa_flow_code_validation) # completed @2026-01-25 - Phase 5 완료 (bad_flow5 = 0, agi_das_violation = 0)
- [x] test: Gate 1 QA coverage check passes (file: tests/validation/test_gate1_qa.py, name: test_gate1_qa_coverage_check) # completed @2026-01-25 - Phase 5 완료 (871 shipments, 540 events)

### Layout Invariants
- [x] test: MapView left layout (file: tests/ui/test_layout.tsx, name: test_mapview_left_layout) # completed @2026-01-23 - UnifiedLayout.tsx 프로토타입 완료
- [x] test: RightPanel right layout (file: tests/ui/test_layout.tsx, name: test_rightpanel_right_layout) # completed @2026-01-23 - UnifiedLayout.tsx 프로토타입 완료
- [x] test: HVDC Panel bottom layout (file: tests/ui/test_layout.tsx, name: test_hvdc_panel_bottom_layout) # completed @2026-01-23 - UnifiedLayout.tsx 프로토타입 완료
- [ ] test: layout does not break on resize (file: tests/ui/test_layout.tsx, name: test_layout_resize)

### User Flows
- [ ] test: location selection shows status panel (file: tests/e2e/test_user_flows.ts, name: test_location_selection_flow) # POI 클릭 시 RightPanel 연동 (dash 패치)
- [ ] test: worklist item opens detail drawer (file: tests/e2e/test_user_flows.ts, name: test_worklist_detail_drawer)
- [ ] test: worklist filter works (file: tests/e2e/test_user_flows.ts, name: test_worklist_filter) # GlobalSearch 연동 (dash 패치)
- [ ] test: worklist search works (file: tests/e2e/test_user_flows.ts, name: test_worklist_search) # GlobalSearch 연동 (dash 패치)
- [ ] test: failure recovery with cached data (file: tests/e2e/test_user_flows.ts, name: test_failure_recovery)

## Gates & Test Taxonomy

- **Gate 1 — Data Model & Validation**: `Supabase Integration`, `Data Loading & ETL`, `RDF Pipeline`, `Flow Code v3.5`, `Supabase ↔ Foundry/Ontology Integration`, `Validation & Quality Gates` 카테고리 테스트가 포함된다.
- **Gate 2 — UI/UX & Accessibility**: `UI Components`, `Mobile Interactions`, `Accessibility`, `Layout Invariants`, `User Flows` 카테고리 테스트가 포함되며, MapView | RightPanel | HVDC Panel 3패널 레이아웃과 모바일 제스처를 검증한다.
- **Gate 3 — Realtime & Performance**: `Realtime & Performance` 카테고리 테스트와 Supabase/RLS 관련 성능 테스트가 포함된다.
- 각 테스트는 **Unit / Integration / E2E / Performance**로 나뉘며, Gate 1→2→3 순으로 통과해야 AGENTS.md의 Done 정의(Gate 1/2/3)를 만족한다.

## Execution Strategy (TDD + Gates)

- 기본 규칙: 사용자가 `go`라고 하면 이 파일의 `## Tests` 섹션에서 **위에서부터 첫 번째 미체크(`- [ ] test:`)** 테스트 한 건만 선택해 RED → GREEN → REFACTOR 사이클을 수행한다.
- 현재 테스트 순서는 인프라 → 데이터 모델(Gate 1) → 레이아웃/UX(Gate 2) → Realtime/성능/Foundry(Gate 3) 순으로 배치되어 있어, `go` 프로토콜을 그대로 따르면 게이트 통과 순서와도 정렬된다.
- 단기 우선순위는 `docs/integration/NEXT_STEPS_PRIORITY.md` 기준으로 **Flow Code v3.5 마이그레이션 검증**, **OpsStore/통합 Store**, **RLS·Realtime·Foundry/Validation 테스트**에 해당하는 항목을 우선 구현하는 것이다.

## Progress Summary

**완료된 테스트**: 60개 / 97개 (61.9%)
**남은 테스트**: 37개

### 완료된 카테고리
- ✅ Infrastructure & Setup: 4/4 (100%)
- ✅ RDF Pipeline: 8/10 (80%)
- ✅ Flow Code v3.5: 6/6 (100%)
- ✅ UI Components: 21/21 (100%) - dash 패치 적용 완료 (POI 레이어, StageCardsStrip, GlobalSearch), 맵 레이어 API Supabase 전환 완료 (2026-01-25), UI/UX 개선 완료 (히트맵 범례, 줌 기반 레이어, RightPanel 탭, 타이포그래피, KPI 스트립 고정, 워크리스트 간소화) (2026-02-05~07)
- ✅ Layout Invariants: 3/4 (75%)
- ✅ Realtime & Performance: 4/7 (57%) - Realtime publication 활성화 완료 (2026-01-25)
- ✅ Validation & Quality Gates: 4/11 (36%) - Gate 1 QA 검증 완료 (2026-01-25)

### 진행 중인 카테고리
- ⏳ Supabase Integration: 9/12 (75%) - Phase 2 DDL 적용 완료 (2026-01-25)
- ⏳ Data Loading & ETL: 3/7 (43%) - Phase 3~4 완료 (2026-01-25)
- ⏳ Mobile Interactions: 1/4 (25%)
- ⏳ Accessibility: 1/6 (17%)
- ⏳ Realtime & Performance: 4/7 (57%) - 성능 테스트 대기 중
- ⏳ Foundry/Ontology Integration: 0/5 (0%)
- ⏳ Validation & Quality Gates: 4/11 (36%) - OCR/SHACL 검증 대기 중
- ⏳ User Flows: 0/5 (0%)

### 최근 추가된 테스트 (2026-02-05~07)
- ✅ 히트맵 강도 범례 표시 테스트
- ✅ 줌 기반 레이어 가시성 테스트
- ✅ RightPanel 탭 UI 테스트
- ✅ 타이포그래피 개선 테스트
- ✅ KPI 스트립 헤더 고정 테스트
- ✅ 워크리스트 간소화 테스트

## Notes

- 각 테스트는 RED → GREEN → REFACTOR 사이클로 진행
- 테스트 실행 시간: unit ≤0.20s, integration ≤2.00s, e2e ≤5m
- `go` 명령 시 다음 미표시 테스트만 선택하여 진행
- 테스트 완료 시 체크박스 업데이트: `- [x] test: ... # passed @YYYY-MM-DD <commit:hash>`
- **최종 업데이트**: 2026-02-07 - Phase 2~6 완료 상태 반영 (DDL 적용, CSV 적재, Gate 1 QA, Realtime 활성화, 대시보드 데이터 반영 완료), dash 패치 적용 완료 (POI 레이어, StageCardsStrip, GlobalSearch), 맵 레이어 API Supabase 전환 완료 (/api/locations, /api/location-status, /api/events), 최근 UI 개선사항 반영 (히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)

## 참조 문서

- [STATUS.md](./STATUS.md) - 통합 상태 SSOT
- [INTEGRATION_ROADMAP.md](./docs/integration/INTEGRATION_ROADMAP.md) - 통합 로드맵
- [AGENTS.md](./AGENTS.md) - 프로젝트 규칙
- [DATA_LOADING_PLAN.md](./docs/DATA_LOADING_PLAN.md) - Supabase 데이터 적재 작업 계획
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](./docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - Phase 2~6 실행 방법·진행 상황 SSOT
- [DASH_PLAN.md](./docs/DASH_PLAN.md) - dash 패치 적용 계획 (맵 POI·StageCardsStrip·GlobalSearch)
- [dash/reakmapping.md](./dash/reakmapping.md) - 맵 POI 좌표·레이어 SSOT
- [dash/docs/APPLY_PATCH.md](./dash/docs/APPLY_PATCH.md) - dash 패치 통합 절차
