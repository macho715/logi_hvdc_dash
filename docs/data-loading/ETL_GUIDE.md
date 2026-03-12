# ETL 스크립트 가이드

> **Supabase 데이터 적재를 위한 ETL 스크립트 사용 가이드**  
> **최종 업데이트**: 2026-01-24  
> **참조**: [README_dashboard_ready_FULL.md](../supabase/data/raw/README_dashboard_ready_FULL.md)

---

## 📋 개요

HVDC 데이터를 Supabase에 적재하기 위한 두 가지 ETL 스크립트가 준비되어 있습니다:

1. **Status SSOT 레이어** (`scripts/etl/status_etl.py`)
2. **Option-C Case 레이어** (`scripts/etl/optionc_etl.py`)

---

## 1️⃣ Status SSOT 레이어 (Untitled-4)

### 목적
- Status(SSOT) 전량(=HVDC S No 1~830xx) 기준으로 `status.shipments_status` 갱신
- Warehouse JSON(케이스 단위)을 hvdc_code 기준으로 집계하여 `status.events_status` 적재
- (옵션) Option-C `locations.csv`가 있으면 `events_status.location_code` 채우기

### 입력 파일
- `HVDC_all_status.json` - Status SSOT 데이터
- `hvdc_warehouse_status.json` - Warehouse 데이터 (케이스 단위)
- (옵션) `supabase/data/output/optionC/locations.csv` - Option-C locations

### 출력 파일 (out/)
- `supabase/schema.sql` - 스키마 정의
- `supabase/shipments_status.csv` - shipments_status 테이블용
- `supabase/events_status.csv` - events_status 테이블용
- `supabase/shipments.csv` - 호환용 복제본
- `supabase/logistics_events.csv` - 호환용 복제본
- `ontology/hvdc_ops_status.ttl` - OPS TTL (기본 ON)
- `ontology/hvdc.ttl` - Legacy TTL (기본 ON)
- `report/qa_report.md` - QA 리포트
- `report/orphan_wh.json` - Orphan Warehouse 데이터

### 실행 예시

```bash
python supabase/data/raw/scripts/etl/status_etl.py \
  --status HVDC_all_status.json \
  --warehouse hvdc_warehouse_status.json \
  --outdir out \
  --base-iri https://example.com/hvdc \
  --case-locations supabase/data/output/optionC/locations.csv
```

---

## 2️⃣ Option-C Case 레이어 (Untitled-3)

### 목적
- 케이스 단위 `(hvdc_code, case_no)` 정밀 흐름(Flow/WH IN-OUT/SITE ARRIVAL/Customs)을 `case.*` 적재용 CSV로 생성
- Flow Code v3.5 계산 (0~5)
- (옵션) `--export-ttl` 시 `hvdc_ops_data.ttl` 생성

### 입력 파일
- `hvdc_allshpt_status.json` - 전체 Shipment 데이터
- `hvdc_warehouse_status.json` - Warehouse 데이터
- `HVDC_STATUS.json` - Customs 데이터

### 출력 파일
- `shipments_case.csv` - case.shipments_case 테이블용
- `cases.csv` - case.cases 테이블용
- `flows.csv` - case.flows 테이블용 (Flow Code v3.5 포함)
- `locations.csv` - case.locations 테이블용
- `events_case.csv` - case.events_case 테이블용
- `events_case_debug.csv` - 디버그용 (location_code 포함)
- (옵션) `hvdc_ops_data.ttl` - TTL 파일

### 실행 예시

```bash
python supabase/data/raw/scripts/etl/optionc_etl.py \
  --all hvdc_allshpt_status.json \
  --wh hvdc_warehouse_status.json \
  --customs HVDC_STATUS.json \
  --output-dir supabase/data/output/optionC \
  --export-ttl \
  --base-iri https://example.com/hvdc
```

---

## 3️⃣ Supabase 적재 순서

### 권장 순서

1. **DDL 적용**: `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql` 실행

2. **Status 레이어 적재**:
   ```sql
   \copy status.shipments_status from 'out/supabase/shipments_status.csv' with (format csv, header true, encoding 'UTF8');
   \copy status.events_status from 'out/supabase/events_status.csv' with (format csv, header true, encoding 'UTF8');
   ```

3. **Case 레이어 적재** (순서 중요):
   ```sql
   -- 1) locations 먼저 (FK 참조)
   \copy "case".locations from 'supabase/data/output/optionC/locations.csv' with (format csv, header true, encoding 'UTF8');
   
   -- 2) shipments_case
   \copy "case".shipments_case from 'supabase/data/output/optionC/shipments_case.csv' with (format csv, header true, encoding 'UTF8');
   
   -- 3) cases
   \copy "case".cases from 'supabase/data/output/optionC/cases.csv' with (format csv, header true, encoding 'UTF8');
   
   -- 4) flows
   \copy "case".flows from 'supabase/data/output/optionC/flows.csv' with (format csv, header true, encoding 'UTF8');
   
   -- 5) events_case
   \copy "case".events_case from 'supabase/data/output/optionC/events_case.csv' with (format csv, header true, encoding 'UTF8');
   ```

---

## 4️⃣ 검증 (Gate 1 QA)

### Orphan 체크

```sql
-- Status 레이어
select count(*)::bigint as orphan_status_events
from status.events_status es
left join status.shipments_status ss on ss.hvdc_code = es.hvdc_code
where ss.hvdc_code is null;

-- Case 레이어
select count(*)::bigint as orphan_case_events
from "case".events_case e
left join "case".cases c on c.hvdc_code=e.hvdc_code and c.case_no=e.case_no
where c.hvdc_code is null;
```

### 중복 체크

```sql
select
  hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system,
  count(*)::bigint as cnt
from "case".events_case
group by 1,2,3,4,5,6,7
having count(*) > 1
order by cnt desc;
```

### Flow Code 규칙 검증

```sql
-- Flow Code 5는 requires_review=true 필수
select count(*)::bigint as bad_flow5
from "case".flows
where flow_code=5 and requires_review is not true;
```

---

## 5️⃣ 대시보드 JOIN 핵심

### 조인 키
- **Status ↔ Case**: `hvdc_code`
- **Events ↔ Locations**: `location_code` (Option-C locations와 조인)

### 대시보드 데이터 소스 (View)
- `public.v_shipments_master`
- `public.v_shipments_timeline`
- `public.v_cases_kpi`
- `public.v_case_segments`
- `public.v_case_event_segments`
- `public.v_kpi_site_flow_daily`

> **주의**: 프론트엔드에서 직접 JOIN 금지. View만 조회.

---

## 📚 참조 문서

- [README_dashboard_ready_FULL.md](../supabase/data/raw/README_dashboard_ready_FULL.md) - 스크립트 상세 설명
- [RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md) - Supabase 구성 Runbook
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 데이터 적재 단계별 실행 계획
- [STATUS.md](../STATUS.md) - 통합 상태 SSOT

---

**최종 업데이트**: 2026-01-24
