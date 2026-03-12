아래 내용을 그대로 새 파일(예: `docs/HVDC_DATA_KPI_SPEC.md`나 `데이터_final.md`)로 붙여 쓰시면 “최종 HVDC 데이터·KPI 설계서(원파일)” 역할을 할 수 있습니다.

---

# HVDC Logistics Data & KPI 설계서 (Final)

**버전**: 1.0
**작성일**: 2026-01-24
**참조**: `docs/architecture.md`, `supabase/migrations/20260101_initial_schema.sql`, `supabass_ontol/vdc_supabase_kpi_v1 설계 문서.md`, `plan.md`, `docs/NEXT_STEPS_PRIORITY.md`

---

## 1. Executive Summary

- **목표**: HVDC 전체 물류 여정(Port → Customs → WH → MOSB → Site)을 **단일 데이터 모델 + KPI 뷰**로 정규화하여,
  - Supabase(SSOT)에 안전하게 적재하고
  - Next.js 기반 통합 대시보드에서 **SQL만으로 전 구간 리드타임·KPI 조회**가 가능하게 한다.
- **3계층 구조**:
  1. **Status 레이어 (선적 SSOT)** – `HVDC all status.json` 기반, 선적(hvdc_code) 단위 메타/통관 정보.
  2. **Case Option‑C 레이어 (케이스/팔렛/컨테이너)** – `hvdc_warehouse_status.json` 기반, `(hvdc_code, case_no)` 단위의 세부 물류/치수/Flow Code.
  3. **Ontology/OPS 레이어** – 위 두 레이어와 KPI 결과를 RDF(Turtle)로 출력, SHACL 검증·추론·감사에 사용.
- **주요 산출물**:
  - CSV: `hvdc_output/supabase/*.csv`, `hvdc_output/optionC/*.csv`
  - Supabase 스키마: `supabase/migrations/20260101_initial_schema.sql` + `20260101_initial_schema.sql` + `20260101_initial_schema.sql`(기존 HVDC/Logistics 스키마)
  - KPI 뷰: `v_case_timeline / v_case_kpi / v_kpi_site_flow_daily / v_case_segments / v_case_event_segments`
  - TTL: `hvdc_output/ontology/hvdc.ttl`, `hvdc_output/ontology/hvdc_ops_data.ttl`

---

## 2. 데이터 소스 & ETL 레이어

### 2.1 원본 JSON

- **Status SSOT (선적 레벨)** – `supabass_ontol/HVDC all status.json`
  - 핵심 컬럼:
    - 식별: `"SCT SHIP NO."`(→ `hvdc_code`), `"No"`(status_no)
    - 인보이스/PO: `COMMERCIAL INVOICE No.`, `INVOICE Date`, `PO No.`, `VENDOR`, `CATEGORY`
    - 무역/금액: `INCOTERMS`, `CURRENCY`, `INVOICE VALUE(A)`, `FREIGHT(B)`, `INSURANCE(C)`, `CIF VALUE(A+B+C)`, `COE`
    - Port: `POL`, `POD`, `B/L No.AWB No.`, `VESSEL NAME/FLIGHT No.`, `SHIPPING LINE`, `FORWARDER`, `SHIP MODE`
    - 일정: `ETD`, `ATD`, `ETA`, `ATA`
    - 통관: `Attestation Date`, `Customs Start`, `Customs Close`, `DO Collection`, `Custom Code`, `DUTY/VAT`
    - Site 마일스톤: `SHU2 / MIR3 / DAS4 / AGI5` (site arrival date)
- **Warehouse/Case 레벨** – `supabass_ontol/hvdc_warehouse_status.json`
  - 식별: `"HVDC CODE"`(→ hvdc_code), `"Case No."`(→ case_no), `no.`
  - 위치/이벤트 epoch(ms): `ETD/ATD`, `ETA/ATA`, `DHL Warehouse`, `DSV Indoor`, `DSV Al Markaz`, `DSV Outdoor`, `DSV MZP`, `MOSB`, `Shifting`, `MIR/SHU/DAS/AGI` 등
  - 치수/중량/설명: `Site`, `EQ No`, `Pkg`, `Description`, `Final_Location`, `Storage`, `L(CM)/W(CM)/H(CM)`, `CBM`, `N.W(kgs)`, `G.W(kgs)`, `SQM`, `Vendor`, `HS Code`, `Currency`, `Price`

### 2.2 ETL 스크립트 & 출력

- **Status ETL + TTL** – `supabass_ontol/Untitled-4_embedded_ops_ttl.py`
  - 입력: `--status HVDC all status.json`, `--warehouse hvdc_warehouse_status.json`
  - 출력 (기본 `../hvdc_output`):
    - `hvdc_output/supabase/schema.sql`
    - `hvdc_output/supabase/shipments.csv` (선적 SSOT)
    - `hvdc_output/supabase/logistics_events.csv` (Status + WH 기반 선적 이벤트)
    - `hvdc_output/ontology/hvdc.ttl` (Status 온톨로지 뷰)
    - `hvdc_output/ontology/hvdc_ops_status.ttl` (OPS용 Status 인스턴스)
    - `hvdc_output/report/qa_report.md`, `orphan_wh.json` (SSOT/coverage QA)

- **Case Option‑C ETL + TTL** – `supabass_ontol/Untitled-3_embedded_ops_ttl.py`
  - 입력: `--all HVDC all status.json`, `--wh hvdc_warehouse_status.json`, `--customs HVDC all status.json`
  - 출력 (기본 `../hvdc_output/optionC`):
    - `shipments.csv` – hvdc_code 레벨 메타(Invoice/Port/Vendor/Price 등)
    - `cases.csv` – `(hvdc_code, case_no)` 레벨 치수·중량·Site/Final_Location 등
    - `flows.csv` – Flow Code v3.5, warehouse_count, has_mosb_leg, has_site_arrival, Customs 코드/시간, last_status, requires_review
    - `locations.csv` – location_id, location_code, name, category(PORT/WAREHOUSE/MOSB/SITE/CUSTOMS/TRANSIT), hvdc_node, flag(is_mosb/is_site/is_port)
    - `events.csv` – 케이스 이벤트 타임라인: `(hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system, raw_epoch_ms)`
    - `events_debug.csv` – location_code 포함 디버그용 이벤트
    - `report.json`, `report.md` – SSOT/Flow 분포/AGI·DAS 규칙 위반·Coverage 등 QA
    - `hvdc_supabase.ttl` – Case/Flow/Event TTL
    - `hvdc_ops_data.ttl` – Ops Ontology 인스턴스 TTL (`hvdc_ops_ontology.ttl`, `hvdc_ops_shapes.ttl` 기반)

---

## 3. Supabase 스키마 (SSOT + Option‑C + OPS)

### 3.1 기존 통합 스키마 – `20260101_initial_schema.sql`

- **Logistics Core**:
  - `locations(id, name, lat, lng, type, address, country, region, created_at, updated_at)`
  - `location_statuses(id, location_id, status, pressure, occupancy_rate, capacity, current_load, metadata, updated_at, …)`
  - `events(id, location_id, shipment_id, event_type, description, metadata, ts, created_at)`
- **HVDC Core**:
  - `shipments(id, sct_ship_no, mr_number, commercial_invoice_no, invoice_date, invoice_value, incoterms, pol/pod, vessel, bl_awb, …, etd/eta/ata, attestation_date, customs_start_date/customs_close_date/custom_code, delivery_date, status, current_location(_id), …)`
  - `warehouse_inventory`, `container_details`, `financial_transactions`, `shipment_tracking_log`, `hvdc_worklist`, `hvdc_kpis`, `logs`
- **RLS & 트리거**:
  - `update_*_updated_at` 트리거, `calculate_cif_value`, `log_shipment_status_change`
  - 모든 테이블에 `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` + `FOR SELECT TO authenticated/anon` 정책

### 3.2 Option‑C 전용 스키마 – `20260101_initial_schema.sql` + `20260101_initial_schema.sql` (예: `optionc` 또는 `public` 내 `hvdc_*`)

**권장**: `optionc` 스키마 분리 + public VIEW 노출.

#### 3.2.1 Case 레이어 테이블 (CSV → Supabase)

- `optionc.shipments_case` (hvdc_code 레벨)
  - `hvdc_code (PK)`, `shipment_invoice_no`, `vendor`, `coe`, `pol`, `pod`, `vessel`, `hs_code`, `currency`, `price`
- `optionc.cases`
  - `hvdc_code`, `case_no`, `site_code`, `eq_no`, `pkg`, `description`, `final_location`, `storage`, `l_cm/w_cm/h_cm`, `cbm`, `nw_kg/gw_kg`, `sqm`, `vendor`
  - PK: `(hvdc_code, case_no)`
- `optionc.flows`
  - `(hvdc_code, case_no)` + `flow_code`, `flow_code_original`, `flow_code_derived`, `override_reason`
  - `warehouse_count`, `has_mosb_leg`, `has_site_arrival`, `customs_code`, `customs_start_iso`, `customs_end_iso`, `last_status`, `requires_review`
- `optionc.locations`
  - `location_id (PK)`, `location_code`, `name`, `category`, `hvdc_node`, `is_mosb/is_site/is_port`, `active`
- `optionc.events_case`
  - `(hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system, raw_epoch_ms)`
  - FK: `(hvdc_code, case_no) → cases`, `location_id → locations`

#### 3.2.2 Status 레이어 (Status SSOT) – `supabass_ontol/Untitled-4_embedded_ops_ttl.py` + `20260101_initial_schema.sql 또는 20260101_initial_schema.sql`

- `public.shipments` 또는 `status.shipments`
  - `hvdc_code`(PK or unique), `status_no`, `vendor`, `band`, `incoterms`, `currency`, `pol`, `pod`, `bl_awb`, `vessel`, `ship_mode`, `pkg`, `qty_cntr`, `cbm`, `gwt_kg`, `etd/eta/ata`, `warehouse_flag`, `warehouse_last_location`, `warehouse_last_date`, `raw`
- `public.logistics_events` 또는 `status.logistics_events`
  - `event_id`(PK), `hvdc_code`(FK→shipments), `event_type`, `location`, `event_date`, `source`, `raw`

---

## 4. 케이스/플로우/이벤트 모델 & KPI

### 4.1 Flow Code v3.5 정의

- 입력: WH/MOSB/Site 이벤트 존재 여부
  - `wh_cnt` = MOSB 제외 WAREHOUSE 이벤트 존재 수
  - `has_mosb` = MOSB 이벤트 존재 여부
  - `has_site` = Site(=MIR/SHU/DAS/AGI) 도착 이벤트 존재 여부
- 로직(요약):
  - `flow=0` – 아무 위치 이벤트 없음(Pre Arrival)
  - `flow=1` – has_site & !has_mosb & wh_cnt=0 (Port→Site 직송)
  - `flow=2` – has_site & !has_mosb & wh_cnt≥1 (Port→WH→Site)
  - `flow=3` – has_site & has_mosb & wh_cnt=0 (Port→MOSB→Site)
  - `flow=4` – has_site & has_mosb & wh_cnt≥1 (Port→WH→MOSB→Site)
  - `flow=5` – site 없음 + mosb 있거나, site 없음 + mosb/WH 혼재 등 “Mixed/Incomplete”
- 오버라이드 규칙:
  - `final_location ∈ {AGI, DAS}` & `FLOW_CODE < 3` → `FLOW_CODE=3`, `FLOW_OVERRIDE_REASON='AGI/DAS requires MOSB leg'`

### 4.2 이벤트 타입 표준 (Case 레이어)

- Port:
  - `PORT_ETD` – `ETD/ATD` & Status=Pre Arrival
  - `PORT_ATD` – `ETD/ATD` & Status≠Pre Arrival
  - `PORT_ETA` – `ETA/ATA` & Status=Pre Arrival
  - `PORT_ATA` – `ETA/ATA` & Status≠Pre Arrival
- Warehouse/MOSB:
  - `WH_IN` – DSV/MZP/Indoor/Outdoor/AAA/ZENER/Hauler/Vijay Tanks 등
  - `MOSB_IN` – MOSB 첫 입고
  - `WH_OUT_DERIVED` – WH_IN 이후 “다른 위치/사이트로 이동하는 첫 이벤트 시간”을 OUT 시점으로 파생
  - `MOSB_OUT_DERIVED` – MOSB_IN 이후 다른 위치/사이트로 이동하는 첫 이벤트
- Site:
  - `SITE_ARRIVAL` – MIR/SHU/DAS/AGI 컬럼의 epoch(ms)
- Customs & DO:
  - `CUSTOMS_START` – `Attestation Date`
  - `CUSTOMS_FORMAL_START` – `Customs Start`
  - `CUSTOMS_END` – `Customs Close`
  - `DO_COLLECTION` – `DO Collection`

---

## 5. KPI 뷰 설계 (케이스/항차별 리드타임)

### 5.1 v_case_timeline – 케이스별 타임라인

- 입력: `optionc.events_case` + `optionc.cases` + `optionc.flows` + `shipments_case`
- 출력(핵심 컬럼):
  - ID: `hvdc_code`, `case_no`, `vendor`, `final_location`
  - Port: `port_departure`, `port_arrival`
  - Customs: `customs_start`, `customs_end`
  - WH/MOSB/Site:
    - `first_wh_in`, `last_wh_out`
    - `mosb_in`, `mosb_out`
    - `site_arrival`

### 5.2 v_case_kpi – 케이스별 리드타임

- 기반: `v_case_timeline t`
- KPI 컬럼(예시):
  - `customs_hours` = `(customs_end - customs_start) / 3600`
  - `customs_to_first_wh_hours` = `(first_wh_in - customs_end) / 3600`
  - `wh_to_mosb_hours` = `(mosb_in - first_wh_in) / 3600`
  - `last_leg_hours` = `(site_arrival - COALESCE(mosb_in, first_wh_in)) / 3600`
  - `port_to_site_hours` = `(site_arrival - port_departure) / 3600`

### 5.3 v_kpi_site_flow_daily – Site × Flow × Day KPI

- 기반: `v_case_kpi k` + `flows f`
- 그룹 키:
  - `site_day = date_trunc('day', k.site_arrival)`
  - `final_location` (Site 코드)
  - `flow_code`
- 집계:
  - `cases_count`
  - `avg_port_to_site_hours`
  - `avg_customs_hours`
  - `avg_last_leg_hours`
  - `avg_wh_to_mosb_hours`

### 5.4 v_case_event_segments – 전 구간 리드타임 (요청 사항 반영)

- 목적: **단일 케이스에서 모든 이벤트 간 시간차**를 한 눈에 보기
- 로직(개념):
  - `events_case`를 `(hvdc_code, case_no, event_time_iso)` 순으로 정렬
  - 각 이벤트에 대해 직전 이벤트(`LAG`)와의 시간 차이(s)를 계산 → `hours_between_events`
- 활용:
  - “UAE ETA→Customs End”, “WH_IN→WH_OUT_DERIVED”, “MOSB_IN→MOSB_OUT_DERIVED”, “MOSB_OUT→SITE_ARRIVAL” 등 모든 조합 필터링 가능.

### 5.5 v_case_segments – 전 구간 KPI 통합 뷰 (데이터2.md 내용 통합)

- `v_case_event_segments` + `flows` + `cases`를 묶어 **한 행에 모든 핵심 시간**을 담는 뷰:
  - `hours_port_to_customs_end`
  - `hours_customs_doc_to_end` (통관 서류 준비→종료)
  - `hours_wh_stay` (WH 입출고 체류)
  - `hours_mosb_stay`
  - `hours_mosb_to_site`
  - `hours_port_to_site`
- 항차(hvdc_code) 기준 집계: `v_kpi_shipment_flow_daily` 또는 `v_kpi_shipment_summary`로 확장 가능.

---

## 6. OPS / 온톨로지 레이어

### 6.1 export_hvdc_ops_ttl.py

- 입력:
  - Status CSV 디렉터리(`out/supabase`): `shipments(_status).csv`, `logistics_events`/`events_status.csv`
  - Case CSV 디렉터리(`supabase_csv_optionC_v3` 또는 `hvdc_output/optionC`):
    - `cases.csv`, `flows.csv`, `locations.csv`, `events(_case).csv`
- 출력:
  - `out/ontology/hvdc_ops_data.ttl` – `hvdc_ops_ontology.ttl` + `hvdc_ops_shapes.ttl` 스키마에 맞는 인스턴스 TTL
- IRI 규칙(고정):
  - Shipment: `{base}/Shipment/{hvdc_code}`
  - Case: `{base}/Case/{hvdc_code}/{case_no}`
  - Flow: `{base}/Flow/{hvdc_code}/{case_no}`
  - StatusEvent: `{base}/StatusEvent/{event_id}`
  - CaseEvent: `{base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}`

---

## 7. 실행 & QA Runbook 요약

1. **ETL 실행**
   ```bash
   cd supabass_ontol

   # Status SSOT + TTL
   python Untitled-4_embedded_ops_ttl.py \
     --status "HVDC all status.json" \
     --warehouse "hvdc_warehouse_status.json" \
     --outdir "../hvdc_output" \
     --base-iri "https://example.com/hvdc"

   # Option-C Case + TTL
   python Untitled-3_embedded_ops_ttl.py \
     --all "HVDC all status.json" \
     --wh  "hvdc_warehouse_status.json" \
     --customs "HVDC all status.json" \
     --output-dir "../hvdc_output/optionC" \
     --export-ttl \
     --base-iri "https://example.com/hvdc"
   ```

2. **Supabase 스키마 적용**
   - `supabase/migrations/20260101_initial_schema.sql`
   - (선택) `supabase/migrations/20260101_initial_schema.sql` 또는 `20260101_initial_schema.sql` 내 Option‑C/OPS 스키마

3. **CSV 로드 (`hvdc_output` 기준)**
   - Status 레이어: `supabase_csv_optionC_v3` 또는 `hvdc_output/supabase` → `shipments`, `logistics_events`
   - Case 레이어: `hvdc_output/optionC/*.csv` → `optionc.*` 테이블

4. **QA 체크 (Gate 1)**
   - Coverage: `status_in == ship_out == all_unique_case_keys + (optionC.cases rows)`
   - Orphan:
     - `events` 중 `(hvdc_code, case_no)`가 `cases`에 없는 행 = 0
     - WH에만 있고 Status에 없는 hvdc_code 리스트: `orphan_wh.json`
   - Flow 규칙:
     - `final_location ∈ {AGI,DAS}` & `flow_code < 3` → 0행
     - `flow_code_original ≠ flow_code` & `override_reason IS NULL` → 0행

5. **대시보드 / API 연결**
   - API 레이어에서 `SELECT * FROM v_case_kpi / v_kpi_site_flow_daily / v_case_segments` 사용
   - MapView/RightPanel/HVDC Panel은 이 뷰를 기반으로 KPI 카드·테이블·차트 구성

---

이 문서가 **supabass 원본 데이터 → ETL → Supabase 스키마 → KPI/뷰 → 온톨로지/QA**까지를 한 번에 담는 최종 설계서입니다.
원하시면, 여기서 바로 `docs` 폴더에 맞게 제목·섹션만 살짝 조정해서 프로젝트 표준 문서 포맷에 맞춰 드릴 수도 있습니다.
