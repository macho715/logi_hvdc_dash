# Supabase 업로드 실제 데이터 위치

> **최종 업데이트**: 2026-01-25  
> **목적**: 실제로 Supabase에 업로드 가능한 CSV 파일의 위치와 상태를 정리합니다.

---

## 📊 RAW DATA 입력 파일

### ✅ Case 레이어 RAW DATA (처리 완료 데이터)

**위치**: `supabase/data/raw/` (✅ 이동 완료)

| 파일명 | 용도 | 행 수 | 상태 | 비고 |
|--------|------|------|------|------|
| `hvdc_excel_reporter_final_sqm_rev_3.json` | **Option-C ETL 입력** (우선) | **8,804행** | ✅ **RAW DATA** | FLOW_CODE 포함, 처리 완료 데이터 |
| `hvdc_excel_reporter_final_sqm_rev_3.csv` | 백업/참조용 | **8,858행** | ✅ **RAW DATA** | JSON과 동일 데이터 (CSV 형식) |

**특징**:
- ✅ **FLOW_CODE 포함**: 이미 Flow Code v3.5가 계산되어 있음 (0~5)
  - FLOW_CODE 0: 245개 (2.8%)
  - FLOW_CODE 1: 3,729개 (42.3%)
  - FLOW_CODE 2: 4,035개 (45.8%)
  - FLOW_CODE 3: 790개 (9.0%)
  - FLOW_CODE 4: 5개 (0.1%)
  - FLOW_CODE 5: 0개 (0%)
- ✅ **FLOW_DESCRIPTION 포함**: "Port → Site", "Port → WH → Site", "Port → WH → MOSB → Site" 등
- ✅ **날짜 형식**: ISO 문자열 (`"2023-12-01"`) - ETL에서 epoch ms로 변환 필요할 수 있음
- ✅ **추가 필드**: `Status_*`, `wh_handling_*`, `site handling`, `SQM`, `Final_Location` 등

**ETL 우선순위** (`run_all.ps1`):
1. `hvdc_excel_reporter_final_sqm_rev_3.json` (✅ 우선 사용)
2. `hvdc_allshpt_status.json` (대체)
3. `HVDC_all_status.json` (최후 대체)

**사용 방법**:
- `run_all.ps1`이 자동으로 `hvdc_excel_reporter_final_sqm_rev_3.json`을 우선 인식
- ETL 스크립트(`scripts/etl/optionc_etl.py`)가 `--all` 인자로 사용

---

## 📊 실제 업로드 가능한 데이터

### ✅ Status 레이어 (실제 데이터 존재)

**위치**: `hvdc_output/supabase/`

| 파일명 | 테이블 | 행 수 (예상) | 상태 | 비고 |
|--------|--------|-------------|------|------|
| `shipments_status.csv` | `status.shipments_status` | **871행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |
| `events_status.csv` | `status.events_status` | **928행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |

**데이터 샘플**:
- `shipments_status.csv`: HVDC-ADOPT-PPL-0001, HVDC-ADOPT-PPL-0002 등 실제 선적 데이터
- `events_status.csv`: sev_HVDCADOPTHE0001_DSVOutdoor_2024-01-19 등 실제 이벤트 데이터

**적재 순서**:
1. `status.shipments_status` (FK 의존성 없음)
2. `status.events_status` (`shipments_status` 참조)

---

### ✅ Case 레이어 (Option-C, 실제 데이터 존재)

**위치**: `hvdc_output/optionC/`

| 파일명 | 테이블 | 행 수 (예상) | 상태 | 비고 |
|--------|--------|-------------|------|------|
| `locations.csv` | `case.locations` | **28행** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |
| `shipments.csv` | `case.shipments_case` | **491행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |
| `cases.csv` | `case.cases` | **6,745행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |
| `flows.csv` | `case.flows` | **6,704행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |
| `events.csv` | `case.events_case` | **50,677행 이상** | ✅ **업로드 가능** | 헤더 포함, 실제 데이터 있음 |

**데이터 샘플**:
- `locations.csv`: AGI_SITE, CUSTOMS_UAE, DAS_SITE, DSV_OUTDOOR, MOSB 등 28개 위치
- `shipments.csv`: HVDC-ADOPT-HE-0001, HVDC-ADOPT-HE-0002 등 실제 선적 데이터
- `cases.csv`: HVDC-ADOPT-HE-0001/207721, HVDC-ADOPT-HE-0001/207722 등 실제 케이스 데이터
- `flows.csv`: Flow Code v3.5 계산 결과 (0~5), AGI/DAS 룰 적용
- `events.csv`: PORT_ATD, CUSTOMS_START, PORT_ATA, DO_COLLECTION 등 실제 이벤트 데이터

**적재 순서** (FK 의존성):
1. `case.locations` (FK 없음)
2. `case.shipments_case` (FK 없음)
3. `case.cases` (`shipments_case` 참조 가능)
4. `case.flows` (`cases` 참조 필요)
5. `case.events_case` (`cases`, `locations` 참조 필요)

---

## ❌ 업로드 불가능한 데이터 (비어있음)

### Case 레이어 (Option-C, 빈 파일)

**위치**: `supabase/data/output/optionC/`

| 파일명 | 테이블 | 행 수 | 상태 | 비고 |
|--------|--------|------|------|------|
| `shipments.csv` | `case.shipments_case` | **0행** | ❌ **비어있음** | 헤더만 있거나 파일이 비어있음 |
| `cases.csv` | `case.cases` | **0행** | ❌ **비어있음** | 헤더만 있거나 파일이 비어있음 |
| `flows.csv` | `case.flows` | **0행** | ❌ **비어있음** | 헤더만 있거나 파일이 비어있음 |
| `events.csv` | `case.events_case` | **0행** | ❌ **비어있음** | 헤더만 있거나 파일이 비어있음 |
| `locations.csv` | `case.locations` | **4행** | ⚠️ **최소 데이터** | CUSTOMS_UAE, EDAS, PORT_AGENT만 있음 |

**원인**: `report.json`에서 확인:
- `shipments: 0`
- `cases: 0`
- `flows: 0`
- `events: 0`
- `all_unique_case_keys: 0`
- `merged_rows: 0`

**결론**: `supabase/data/output/optionC/` 디렉토리의 CSV 파일들은 ETL 실행이 실패했거나 데이터가 없는 상태입니다. **업로드하지 마세요.**

---

## 📋 실제 업로드 가이드

### Status 레이어 업로드

**Python 스크립트** (권장):
```bash
python scripts/hvdc/load_csv.py --status-only
```

**수동 COPY**:
```sql
\copy status.shipments_status (
  hvdc_code,status_no,vendor,band,incoterms,currency,pol,pod,bl_awb,vessel,ship_mode,pkg,qty_cntr,cbm,gwt_kg,etd,eta,ata,warehouse_flag,warehouse_last_location,warehouse_last_location_code,warehouse_last_date,raw
) FROM 'hvdc_output/supabase/shipments_status.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

\copy status.events_status (
  event_id,hvdc_code,event_type,location,location_code,location_match_method,location_match_score,event_date,source,raw
) FROM 'hvdc_output/supabase/events_status.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

### Case 레이어 업로드

**Python 스크립트** (권장):
```bash
python scripts/hvdc/load_csv.py --case-only
```

**수동 COPY** (순서 중요):
```sql
-- 1. locations (FK 없음)
\copy "case".locations (
  location_id,location_code,name,category,hvdc_node,is_mosb,is_site,is_port,active
) FROM 'hvdc_output/optionC/locations.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2. shipments_case (FK 없음)
\copy "case".shipments_case (
  hvdc_code,shipment_invoice_no,vendor,coe,pol,pod,vessel,hs_code,currency,price
) FROM 'hvdc_output/optionC/shipments.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 3. cases (shipments_case 참조 가능)
\copy "case".cases (
  hvdc_code,case_no,site_code,eq_no,pkg,description,final_location,storage,l_cm,w_cm,h_cm,cbm,nw_kg,gw_kg,sqm,vendor
) FROM 'hvdc_output/optionC/cases.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 4. flows (cases 참조 필요)
\copy "case".flows (
  hvdc_code,case_no,flow_code,flow_code_original,flow_code_derived,override_reason,warehouse_count,has_mosb_leg,has_site_arrival,customs_code,customs_start_iso,customs_end_iso,last_status,requires_review
) FROM 'hvdc_output/optionC/flows.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 5. events_case (cases, locations 참조 필요)
\copy "case".events_case (
  hvdc_code,case_no,event_type,event_time_iso,location_id,source_field,source_system,raw_epoch_ms
) FROM 'hvdc_output/optionC/events.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

---

## 🔍 데이터 검증

### Status 레이어 검증
```sql
-- 행 수 확인
SELECT COUNT(*) FROM status.shipments_status;  -- 예상: 871
SELECT COUNT(*) FROM status.events_status;     -- 예상: 928

-- Orphan 체크
SELECT COUNT(*) FROM status.events_status e
WHERE NOT EXISTS (
  SELECT 1 FROM status.shipments_status s WHERE s.hvdc_code = e.hvdc_code
);  -- 예상: 0
```

### Case 레이어 검증
```sql
-- 행 수 확인
SELECT COUNT(*) FROM "case".locations;        -- 예상: 28
SELECT COUNT(*) FROM "case".shipments_case; -- 예상: 491
SELECT COUNT(*) FROM "case".cases;          -- 예상: 6,745
SELECT COUNT(*) FROM "case".flows;          -- 예상: 6,704
SELECT COUNT(*) FROM "case".events_case;    -- 예상: 50,677

-- FK 제약조건 체크
SELECT COUNT(*) FROM "case".cases c
WHERE NOT EXISTS (
  SELECT 1 FROM "case".shipments_case s WHERE s.hvdc_code = c.hvdc_code
);  -- 예상: 0

SELECT COUNT(*) FROM "case".flows f
WHERE NOT EXISTS (
  SELECT 1 FROM "case".cases c 
  WHERE c.hvdc_code = f.hvdc_code AND c.case_no = f.case_no
);  -- 예상: 0

SELECT COUNT(*) FROM "case".events_case e
WHERE e.location_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM "case".locations l WHERE l.location_id = e.location_id
  );  -- 예상: 0
```

---

## 📝 요약

### ✅ 업로드 가능한 데이터
- **Status 레이어**: `hvdc_output/supabase/` (2개 파일)
- **Case 레이어**: `hvdc_output/optionC/` (5개 파일)

### ❌ 업로드 불가능한 데이터
- **Case 레이어**: `supabase/data/output/optionC/` (모든 파일이 비어있음)

### 권장 사항
1. **Status 레이어 먼저 업로드**: `hvdc_output/supabase/` 디렉토리 사용
2. **Case 레이어 다음 업로드**: `hvdc_output/optionC/` 디렉토리 사용 (FK 순서 준수)
3. **`supabase/data/output/optionC/` 디렉토리는 무시**: 데이터가 없으므로 업로드하지 마세요

---

**최종 업데이트**: 2026-01-25
