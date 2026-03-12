### hvdc_supabase_kpi_v1 설계 문서 (요약 리포트)

### 1. Executive Summary

- **목표**: HVDC `hvdc_warehouse_status.json / hvdc_allshpt_status.json`를 Supabase(PostgreSQL)로 적재하고, **Port→Customs→WH→MOSB→Site** 전 구간 KPI를 SQL만으로 조회 가능하게 만드는 SSOT 설계.
- **구성**:
  - **DDL**: `shipments / cases / locations / flows / events` 5테이블
  - **ETL**: `hvdc_json_to_supabase.py` (JSON→CSV→Supabase)
  - **KPI 뷰**: `v_case_timeline / v_case_kpi / v_kpi_site_flow_daily`
- **온톨로지 매핑**:
  - `shipments` → `hvdc:Shipment` / `hvdc:BillOfLading`
  - `cases` → `hvdc:Case`
  - `events` → `hvdc:TransportEvent / hvdc:StockEvent`
  - `locations` → `hvdc:Location`
  - `flows` → `hvdc:LogisticsFlow`

---

### 2. 데이터 모델(DDL) – Supabase 테이블 설계

- **`shipments` (hvdc_code 레벨)**
  - **PK**: `hvdc_code` (`text`)
  - **주요 컬럼**: `shipment_invoice_no, vendor, coe, pol, pod, vessel, hs_code, currency, price`
  - **역할**: 한 HVDC CODE(Shipment 단위)의 상위 메타 (Invoice, Port, Vessel, 가격/통화 등) 보관.

- **`cases` (Case No. 단위)**
  - **PK**: `(hvdc_code, case_no)`
  - **주요 컬럼**:
    - ID/타겟: `site_code, eq_no, final_location, storage, vendor`
    - 치수/중량: `l_cm, w_cm, h_cm, cbm, nw_kg, gw_kg, sqm`
    - 스택/상태: `stack_label, stack_status, stack_status2`
  - **역할**: `hvdc:Case` 실체 – 팔렛/박스 단위의 실제 운송 유닛.

- **`locations` (표준 위치 마스터)**
  - **PK**: `location_id (serial)`
  - **주요 컬럼**: `location_code, name, category, hvdc_node, is_mosb, is_site, is_port, active`
  - **역할**: `events.location_id`가 참조하는 표준 위치 코드; HVDC 6노드(Port/MOSB/Site)와 연결.

- **`flows` (케이스별 Flow Code 메타)**
  - **PK**: `(hvdc_code, case_no)`
  - **주요 컬럼**:
    - Flow: `flow_code (0–5), flow_code_original`
    - 경로 특징: `warehouse_count, has_mosb_leg, has_site_arrival`
    - Customs: `customs_code, customs_start, customs_end`
    - 상태: `last_status` (`Status_Current/Status_Storage` 매핑)
  - **역할**: `hvdc:LogisticsFlow` – 각 Case가 어떤 경로(직송/WH/MOSB)를 탔는지, 통관 구간/최종 상태 기록.

- **`events` (이벤트 타임라인 사실 테이블)**
  - **PK**: `event_id (bigserial)`
  - **FK**: `(hvdc_code, case_no) → cases`, `location_id → locations`
  - **주요 컬럼**:
    - 키: `hvdc_code, case_no, event_type, event_time, location_id`
    - 추적: `source_field, source_system, raw_epoch_ms`
  - **event_type 예시(ETL 기준)**:
    - Port: `PORT_DEPARTURE`, `PORT_ARRIVAL`
    - Warehouse: `WH_IN`, `WH_OUT`
    - MOSB: `MOSB_IN`
    - Site: `SITE_ARRIVAL`
    - Customs: `CUSTOMS_START`, `CUSTOMS_END` (추후 확장 가능)
  - **역할**: JSON의 날짜/epoch 필드(ETD/ATD, ETA/ATA, DSV/MOSB/MIR/SHU/DAS…)를 전부 **row 단위 이벤트**로 unpivot.

---

### 3. ETL 파이프라인 – `hvdc_json_to_supabase.py`

- **입력**
  - 파일: `hvdc_warehouse_status.json` / `hvdc_allshpt_status.json`
  - 포맷: JSON 배열, 각 객체는 하나의 Case 레코드 (공통 키: `"HVDC CODE"`, `"Case No."`).

- **핵심 키 추출**
  - `_extract_ids(record)`
    - `hvdc_code`: `"HVDC CODE"` → 문자열 트림
    - `case_no`: `"Case No."` (또는 변형 필드) → `int` 변환

- **1) `shipments.csv` 생성 (hvdc_code 레벨 집계)**
  - 함수: `build_shipments(records)`
  - 집계 로직: 같은 `hvdc_code`에 대해 **첫 번째 non-null 값**을 골라 메타 채움.
  - 매핑:
    - JSON → `shipments`
      - `"Shipment Invoice No."` → `shipment_invoice_no`
      - `"Vendor"` → `vendor`
      - `"COE"` → `coe`
      - `"POL"` → `pol`
      - `"POD"` → `pod`
      - `"Vessel"` → `vessel`
      - `"HS Code"` → `hs_code` (문자열)
      - `"Currency"` → `currency`
      - `"Price"` → `price` (`float`)

- **2) `cases.csv` 생성 (Case No. 단위)**
  - 함수: `build_case_row(record)`
  - 매핑:
    - 식별자: `"HVDC CODE"`, `"Case No."` → `hvdc_code`, `case_no`
    - 로케이션/설명: `"Site"`, `"EQ No"`, `"Description"`, `"Final_Location"`, `"Storage"`, `"Vendor"`
    - 치수: `"L(CM)"`, `"W(CM)"`, `"H(CM)"`, `"CBM"`
    - 중량: `"N.W(kgs)"`, `"G.W(kgs)"`
    - 기타: `"Stack"`, `"stack status"`, `"stack status2"`, `"SQM"`

- **3) `flows.csv` 생성 (Flow Code & Customs 메타)**
  - 함수: `build_flow_row(record)`
  - 매핑:
    - Flow: `"FLOW_CODE"` → `flow_code`, `flow_code_original`
    - WH hop: `"wh_handling_original"` or `"wh_handling_legacy"` → `warehouse_count`
    - MOSB 경유 여부: `"MOSB"` 값 존재 여부 → `has_mosb_leg`
    - Site 도착 여부: `"MIR"`, `"SHU"`, `"DAS"`, `"AGI"` 중 하나라도 값 있으면 → `has_site_arrival`
    - Customs: `"Customs Code"`, `"Customs_Start_ms"`, `"Customs_End_ms"` → `customs_code`, `customs_start_ms`, `customs_end_ms`
    - 상태: `"Status_Current"` or `"Status_Storage"` → `last_status`

- **4) `events.csv` 생성 (이벤트 타임라인)**
  - 함수: `iter_event_rows(record, source_system)`
  - 시간 변환: `epoch_ms → datetime(+04:00, Asia/Dubai) → ISO8601`
  - Port 이벤트:
    - `"ETD/ATD"` → `event_type='PORT_DEPARTURE'`, `location_code='PORT_POL_<POL_NORMALIZED>'`
    - `"ETA/ATA"` → `event_type='PORT_ARRIVAL'`, `location_code='PORT_POD_<POD_NORMALIZED>'`
  - WH/MOSB/Site 이벤트: `STATIC_EVENT_FIELD_MAP` 기준
    - `"DHL Warehouse"` → `WH_IN`, `DHL_WAREHOUSE`
    - `"DSV Indoor"` → `WH_IN`, `DSV_INDOOR`
    - `"DSV Al Markaz"` → `WH_IN`, `DSV_AL_MARKAZ`
    - `"DSV Outdoor"` → `WH_IN`, `DSV_OUTDOOR`
    - `"Hauler Indoor"` → `WH_IN`, `HAULER_INDOOR`
    - `"DSV MZP"` → `WH_IN`, `DSV_MZP`
    - `"MOSB"` → `MOSB_IN`, `MOSB`
    - `"Shifting"` → `WH_OUT`, `SHIFTING`
    - `"MIR"`, `"SHU"`, `"DAS"`, `"AGI"` → `SITE_ARRIVAL`, `<SITE>_SITE`
  - 보존 메타: `source_field`(원본 컬럼명), `source_system`(파일명), `raw_epoch_ms`(검증/리플레이용).

---

### 4. KPI 뷰 설계 (Port→Customs→WH→MOSB→Site)

#### 4.1 `v_case_timeline` – 케이스별 주요 시점 타임라인

- **입력**: `events e` + `cases c` + `shipments s` (+ `flows f`에서 Customs)
- **그룹 키**: `(e.hvdc_code, e.case_no)`
- **출력 컬럼** (핵심):
  - ID: `hvdc_code, case_no, vendor, final_location`
  - Port:
    - `port_departure` = `min(event_time where event_type='PORT_DEPARTURE')`
    - `port_arrival`   = `min(event_time where event_type='PORT_ARRIVAL')`
  - Customs (`flows` 조인):
    - `customs_start, customs_end` (flows.customs_*)
  - Warehouse/MOSB/Site:
    - `first_wh_in`  = `min(event_time where event_type='WH_IN')`
    - `mosb_in`      = `min(event_time where event_type='MOSB_IN')`
    - `site_arrival` = `min(event_time where event_type='SITE_ARRIVAL')`

#### 4.2 `v_case_kpi` – 케이스별 구간 리드타임 (시간)

- **입력**: `v_case_timeline t`
- **주요 KPI 컬럼**:
  - `customs_hours` = `(customs_end - customs_start) / 3600`
  - `customs_to_first_wh_hours` = `(first_wh_in - customs_end) / 3600`
  - `wh_to_mosb_hours` = `(mosb_in - first_wh_in) / 3600`
  - `last_leg_hours` = `(site_arrival - coalesce(mosb_in, first_wh_in)) / 3600`
  - `port_to_site_hours` = `(site_arrival - port_departure) / 3600`

#### 4.3 `v_kpi_site_flow_daily` – Site×Flow 일(日) 단위 집계

- **입력**: `v_case_kpi k` + `flows f`
- **그룹 키**:
  - `site_day = date_trunc('day', k.site_arrival)`
  - `final_location` (Site)
  - `flow_code`
- **집계 지표**:
  - `cases_count`
  - `avg_port_to_site_hours`
  - `avg_customs_hours`
  - `avg_last_leg_hours`
  - `avg_wh_to_mosb_hours`

---

### 5. 확장 옵션 및 Roadmap

- **Dimension 확장**:
  - `vendor`, `customs_code`, `hvdc_node` (locations.hvdc_node) 기준 KPI 피벗 가능.
- **KPI 확장**:
  - Port 편차(Plan vs Actual)가 필요하면, `PORT_ETA/PORT_ATA` 별도 event_type 추가 후 slip 계산 뷰 추가.
- **Ontology/RDF 연계**:
  - 동일 키(`hvdc_code`, `case_no`, `location_code`, `event_id`)를 사용해 RDF 생성 후 기존 Neo4j/TTL 그래프와 통합.

---

### 6. 운영/자동화 & QA 체크리스트

- **운영 플로우**:
  1) 원본 JSON 업데이트 → 2) `hvdc_json_to_supabase.py` 실행(새 CSV) →
  3) Supabase에 `COPY` 로드 → 4) 뷰 3종(`v_case_timeline`, `v_case_kpi`, `v_kpi_site_flow_daily`) 재생성/확인 →
  5) 대시보드(Port→Customs→WH→MOSB→Site 리드타임/Flow 분포) 자동 갱신.
- **QA 체크**:
  - 음수 리드타임(역전) 여부: `customs_hours < 0`, `port_to_site_hours < 0` 등 필터로 모니터링.
  - 이벤트 누락: `first_wh_in is null and flow_code in (2,4)` 같은 룰로 누락 케이스 탐지.
  - MOSB 경유 불일치: `has_mosb_leg = true`인데 `mosb_in is null`인 케이스.

---

🔧 **추천 명령어:**
- `/logi-master kpi-dash` [위 3개 뷰를 기준으로 Port→Customs→WH→MOSB→Site KPI 카드·트렌드 차트 구성]
- `/analyze data-quality` [flows/events 기준으로 음수 리드타임·이벤트 누락·MOSB 경유 불일치 자동 검증 쿼리 생성]
- `/logi-master --deep report hvdc_supabase_kpi_v2` [향후 Port Plan/Actual, Customs 단계 세분화, Vendor/HVDC Node별 KPI 확장안을 포함한 v2 설계 초안 생성]
