# Phase 4: CSV 적재 플랜

> **목적**: Phase 3에서 생성된 CSV 파일들을 Supabase 테이블에 적재합니다.  
> **최종 업데이트**: 2026-01-25  
> **전제 조건**: Phase 2 (DDL 적용) 완료 필요  
> **참조**: [SUPABASE_LOADING_HYBRID_STRATEGY.md](../supabase/SUPABASE_LOADING_HYBRID_STRATEGY.md) ⭐ **권장 방법**, [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md)

---

## 개요

### 목표
- Status 레이어 CSV 적재: `shipments_status.csv` → `status.shipments_status`, `events_status.csv` → `status.events_status`
- Case 레이어 CSV 적재 (선택): `supabase/data/output/optionC/*.csv` → `case.*` 테이블들

### 현재 상황
- ✅ Phase 1 완료: 입력 검증 완료
- ✅ Phase 2 완료: DDL 적용 완료
- ✅ Phase 3 완료: ETL 실행 완료, CSV 생성됨
  - `hvdc_output/supabase/shipments_status.csv`, `events_status.csv`
- ✅ **Phase 4 완료** (2026-01-25): CSV 적재 완료. `load_csv.py --status-only` → `shipments_status` 871 rows, `events_status` 928 rows (UPSERT+FK 필터). `check_status_tables.py` 검증 통과.

### CSV 파일 위치
- Status 레이어: `hvdc_output/supabase/*.csv`
- Case 레이어: `supabase/data/output/optionC/*.csv` (Option-C 실행 시)

---

## 사전 준비

### 1. Phase 2 완료 확인
- [ ] `status` 스키마 존재 확인
- [ ] `case` 스키마 존재 확인 (Case 레이어 적재 시)
- [ ] 대상 테이블 존재 확인

### 2. CSV 파일 존재 확인
```bash
# Status 레이어
ls -la hvdc_output/supabase/shipments_status.csv
ls -la hvdc_output/supabase/events_status.csv

# Case 레이어 (Option-C 실행 시)
ls -la supabase/data/output/optionC/locations.csv
ls -la supabase/data/output/optionC/shipments_case.csv
ls -la supabase/data/output/optionC/cases.csv
ls -la supabase/data/output/optionC/flows.csv
ls -la supabase/data/output/optionC/events_case.csv
```

### 3. Supabase 연결 확인
- [ ] Supabase CLI 연결 확인 (`supabase link --project-ref <ref>`)
- [ ] 또는 Supabase Dashboard 접근 가능 확인

---

## 단계별 실행

### 방법 1: Supabase Dashboard Table Editor Import (권장, CLI 제한 시)

#### Status 레이어 적재

1. **shipments_status 적재**
   - [Supabase Dashboard](https://supabase.com/dashboard) 접속
   - 프로젝트 선택
   - 왼쪽 메뉴에서 **Table Editor** 클릭
   - 스키마 선택: `status`
   - 테이블 선택: `shipments_status`
   - **Import data** 버튼 클릭
   - `hvdc_output/supabase/shipments_status.csv` 파일 업로드
   - 컬럼 매핑 확인 (자동 매핑됨)
   - **Import** 버튼 클릭
   - 성공 메시지 확인

2. **events_status 적재**
   - 동일한 방법으로 `status.events_status` 테이블 선택
   - `hvdc_output/supabase/events_status.csv` 파일 업로드
   - **Import** 버튼 클릭

#### Case 레이어 적재 (Option-C 실행 시)

**중요**: FK 의존성을 고려하여 다음 순서로 적재해야 합니다.

1. **locations** (FK 의존성 없음)
   - `case.locations` 테이블 선택
   - `supabase/data/output/optionC/locations.csv` 업로드

2. **shipments_case** (FK 의존성 없음)
   - `case.shipments_case` 테이블 선택
   - `supabase/data/output/optionC/shipments_case.csv` 업로드

3. **cases** (shipments_case 참조 가능)
   - `case.cases` 테이블 선택
   - `supabase/data/output/optionC/cases.csv` 업로드

4. **flows** (cases 참조 필요)
   - `case.flows` 테이블 선택
   - `supabase/data/output/optionC/flows.csv` 업로드

5. **events_case** (cases, locations 참조 필요)
   - `case.events_case` 테이블 선택
   - `supabase/data/output/optionC/events_case.csv` 업로드

---

### 방법 2: Python 스크립트 (`scripts/hvdc/load_csv.py`)

#### 사전 준비
```bash
# 환경 변수 설정
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
export PGCONNECT_TIMEOUT=10
# VPN/IPv6 이슈 시 Session pooler(5432) URI 사용 권장
# 또는 --db-url 인자로 전달
```

#### Status 레이어만 적재
```bash
python scripts/hvdc/load_csv.py --status-only
# 또는: python scripts/hvdc/load_csv.py --db-url "postgresql://..." --connect-timeout 10 --status-only
```

#### Status + Case 레이어 적재
```bash
python scripts/hvdc/load_csv.py
```

#### 옵션
```bash
# 기존 데이터 삭제 후 적재 (TRUNCATE)
python scripts/hvdc/load_csv.py --truncate --status-only

# --db-url으로 연결 문자열 전달 (env 대안)
python scripts/hvdc/load_csv.py --db-url "postgresql://postgres:[PASSWORD]@HOST:5432/postgres" --connect-timeout 10 --status-only
```

**참고**: `psycopg` (v3) 사용. VPN/failed to resolve 시 [연결 문제 해결](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조. DB URL 전체는 문서/로그에 남기지 말고 `user:***@host` 형태로 마스킹.

---

### 방법 3: Supabase CLI + SQL (고급)

#### CSV를 Supabase Storage에 업로드 후 SQL 실행

1. **Supabase Storage에 CSV 업로드**
   - Dashboard > Storage > Create bucket (예: `csv-imports`)
   - CSV 파일 업로드

2. **SQL 실행**
```sql
-- shipments_status 적재
COPY status.shipments_status (
  hvdc_code, status_no, vendor, band, incoterms, currency,
  pol, pod, bl_awb, vessel, ship_mode, pkg, qty_cntr,
  cbm, gwt_kg, etd, eta, ata,
  warehouse_flag, warehouse_last_location, warehouse_last_date, raw
)
FROM 'https://[PROJECT-REF].supabase.co/storage/v1/object/public/csv-imports/shipments_status.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

**참고**: 이 방법은 Supabase Storage 설정이 필요하며, 일반적으로 방법 1 또는 2를 권장합니다.

---

## 적재 순서 (Case 레이어 시)

FK 의존성을 고려한 적재 순서:

```
1. case.locations          (FK 의존성 없음)
2. case.shipments_case     (FK 의존성 없음)
3. case.cases              (shipments_case 참조 가능)
4. case.flows              (cases 참조 필요)
5. case.events_case        (cases, locations 참조 필요)
```

**중요**: 순서를 위반하면 FK 제약조건 위반 오류가 발생할 수 있습니다.

---

## 검증

### 1. 행 수 확인

#### Status 레이어
```sql
-- shipments_status
SELECT COUNT(*) AS row_count FROM status.shipments_status;
-- 예상: 871 rows (dedupe 적용 시, Phase 4 load_csv.py --status-only 기준)

-- events_status
SELECT COUNT(*) AS row_count FROM status.events_status;
-- 예상: 928 rows (UPSERT+FK 필터 기준)
```

#### Case 레이어 (Option-C 실행 시)
```sql
-- 각 테이블 행 수 확인
SELECT 
  'locations' AS table_name, COUNT(*) AS row_count FROM "case".locations
UNION ALL
SELECT 'shipments_case', COUNT(*) FROM "case".shipments_case
UNION ALL
SELECT 'cases', COUNT(*) FROM "case".cases
UNION ALL
SELECT 'flows', COUNT(*) FROM "case".flows
UNION ALL
SELECT 'events_case', COUNT(*) FROM "case".events_case;
```

### 2. Orphan 체크

#### Status 레이어
```sql
-- events_status 중 shipments_status에 없는 hvdc_code 확인
SELECT COUNT(*) AS orphan_count
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;
```

**통과 조건**: `orphan_count = 0`

#### Case 레이어
```sql
-- events_case 중 cases에 없는 (hvdc_code, case_no) 확인
SELECT COUNT(*) AS orphan_count
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;
```

**통과 조건**: `orphan_count = 0`

### 3. 샘플 데이터 확인
```sql
-- shipments_status 샘플
SELECT * FROM status.shipments_status LIMIT 5;

-- events_status 샘플
SELECT * FROM status.events_status LIMIT 5;
```

---

## 체크리스트

### 4.1 Status 레이어 적재
- [ ] `shipments_status.csv` 파일 존재 확인
- [ ] `events_status.csv` 파일 존재 확인
- [ ] `status.shipments_status` 테이블에 적재 완료
- [ ] `status.events_status` 테이블에 적재 완료
- [ ] 행 수 검증 완료 (CSV 행 수 == 테이블 행 수)
- [ ] Orphan 체크 통과 (orphan_count = 0)

### 4.2 Case 레이어 적재 (선택)
- [ ] `locations.csv` 파일 존재 확인
- [ ] `shipments_case.csv` 파일 존재 확인
- [ ] `cases.csv` 파일 존재 확인
- [ ] `flows.csv` 파일 존재 확인
- [ ] `events_case.csv` 파일 존재 확인
- [ ] 적재 순서 준수 (locations → shipments_case → cases → flows → events_case)
- [ ] 각 테이블 행 수 검증 완료
- [ ] FK 제약조건 위반 없음
- [ ] Orphan 체크 통과

### 4.3 데이터 검증
- [ ] 샘플 데이터 확인 완료
- [ ] 날짜 형식 확인 (Asia/Dubai 타임존)
- [ ] JSONB 필드 (`raw`) 확인

---

## 문제 해결

### CSV 인코딩 오류
**증상**: `invalid byte sequence for encoding "UTF8"`

**해결**:
- CSV 파일을 UTF-8 인코딩으로 저장
- 또는 Python 스크립트에서 인코딩 지정:
  ```python
  df.to_csv('output.csv', encoding='utf-8', index=False)
  ```

### FK 제약 위반
**증상**: `foreign key constraint "fk_..." violates foreign key constraint`

**해결**:
- Case 레이어 적재 순서 확인 (locations → shipments_case → cases → flows → events_case)
- 참조되는 테이블이 먼저 적재되었는지 확인
- Orphan 데이터 확인 및 정리

### 중복 키 오류
**증상**: `duplicate key value violates unique constraint`

**해결**:
- 기존 데이터 삭제 후 재적재:
  ```sql
  TRUNCATE TABLE status.shipments_status CASCADE;
  -- 그 후 재적재
  ```
- 또는 UPSERT 사용 (Python 스크립트 옵션)

### 대용량 CSV 적재 시간 초과
**증상**: 적재 중 타임아웃 또는 연결 끊김

**해결**:
- 배치 적재 사용 (Python 스크립트 수정)
- 또는 Supabase Dashboard Table Editor Import 사용 (자동 배치 처리)

### Python 스크립트 연결 오류
**증상**: `failed to resolve host` 또는 `connection timeout`

**해결**:
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조
- Supabase Dashboard Table Editor Import 사용 (방법 1)

---

## 다음 단계

Phase 4 완료 후:

1. **Phase 5: Gate 1 QA**
   - Orphan/Duplicate/Flow Code 규칙 검증
   - 참조: [PHASE5_GATE1_QA_PLAN.md](../data-loading/PHASE5_GATE1_QA_PLAN.md)

2. **Phase 6: Realtime 활성화**
   - Realtime publication 활성화
   - 참조: [PHASE6_REALTIME_ACTIVATION_PLAN.md](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md)

---

## 참조 문서

- **[SUPABASE_LOADING_HYBRID_STRATEGY.md](../supabase/SUPABASE_LOADING_HYBRID_STRATEGY.md)** - ⭐ **권장: 하이브리드 접근법** (초기 Full-Load는 `psql \copy`, 일상 증분은 `load_csv.py` UPSERT)
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 전체 데이터 로딩 계획
- [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md) - 실행 Runbook
- [PHASE2_DDL_APPLICATION_PLAN.md](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) - Phase 2 DDL 적용
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 해결
- [scripts/hvdc/load_csv.py](../scripts/hvdc/load_csv.py) - Python CSV 적재 스크립트

---

**최종 업데이트**: 2026-01-25
