# run_all.ps1 완전 실행 가이드

> **목적**: `run_all.ps1` 스크립트 실행을 위한 종합 가이드  
> **최종 업데이트**: 2026-02-07  
> **참조 문서**: [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md](../REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md), [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md)

---

## 📋 개요

`run_all.ps1`은 HVDC 데이터를 Supabase에 적재하는 **전체 파이프라인을 자동 실행**하는 PowerShell 스크립트입니다.

### 실행 단계 (자동)

1. **파일 이동** (자동): RAW DATA 파일을 `supabase/data/raw/`로 이동
2. **Phase 1**: 입력 검증
3. **Phase 2**: DDL 적용
4. **Phase 3**: ETL 실행 (Status + Option-C)
5. **Phase 4**: CSV 적재
6. **Phase 5**: Gate 1 QA
7. **Phase 6**: Realtime 활성화

---

## 🔧 사전 요구사항

### 1. 필수 도구

- **PowerShell 5.1+**
  ```powershell
  $PSVersionTable.PSVersion
  ```

- **psql** (PostgreSQL 클라이언트)
  ```powershell
  psql --version
  ```
  - 설치: [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
  - PATH에 추가 확인

- **Python 3.x**
  ```powershell
  python --version
  ```
  - 필수 패키지: `pandas`, `numpy`
  - 설치: `pip install pandas numpy`

### 2. 필수 환경 변수

- **`SUPABASE_DB_URL`** (필수)
  - 형식: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
  - 권장: **Session pooler (포트 5432)** - VPN/IPv6 이슈 대응
  - 예: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10`

### 3. 필수 파일 확인

**입력 파일** (`supabase/data/raw/`):
- ✅ `HVDC_all_status.json` (또는 `HVDC all status.json`)
- ✅ `hvdc_warehouse_status.json`
- ✅ `hvdc_excel_reporter_final_sqm_rev_3.json` (✅ 우선: FLOW_CODE 포함, 8,804 rows)
- ✅ `HVDC_STATUS.json` (또는 `hvdc_status.json`)

**ETL 스크립트** (`supabase/data/raw/`):
- ✅ `scripts/etl/status_etl.py`
- ✅ `scripts/etl/optionc_etl.py`
- ✅ `flow_code_calculator.py`

---

## 🚀 실행 방법

### Windows PowerShell

```powershell
# 1. 프로젝트 루트로 이동
cd "c:\LOGI MASTER DASH"

# 2. 환경 변수 설정
$env:SUPABASE_DB_URL = "postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10"

# 3. 연결 타임아웃 설정 (선택)
$env:PGCONNECT_TIMEOUT = "10"

# 4. 스크립트 실행
powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_all.ps1
```

### 실행 시간

- **예상 시간**: 약 5-10분 (데이터 크기에 따라 다름)
- **단계별 시간**:
  - Phase 1 (검증): ~10초
  - Phase 2 (DDL): ~30초
  - Phase 3 (ETL): ~3-5분
  - Phase 4 (CSV 적재): ~1-2분
  - Phase 5 (Gate 1 QA): ~10초
  - Phase 6 (Realtime): ~10초

---

## 📊 실행 단계 상세

### Step 0: 파일 이동 (자동)

스크립트가 자동으로 다음 파일을 이동합니다:
- `hvdc_excel_reporter_final_sqm_rev_3.json` → `supabase/data/raw/`
- `hvdc_excel_reporter_final_sqm_rev_3.csv` → `supabase/data/raw/`

### Step 1: Phase 1 - 입력 검증

```powershell
python scripts/hvdc/validate_inputs.py --repo-root . --source-dir supabase/data/raw --require-customs
```

**검증 항목**:
- 필수 JSON 파일 존재 확인
- ETL 스크립트 존재 확인
- Python 의존성 확인

### Step 2: Phase 2 - DDL 적용

```sql
-- supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql 실행
```

**생성되는 스키마/테이블**:
- `status.shipments_status`, `status.events_status`
- `case.locations`, `case.shipments_case`, `case.cases`, `case.flows`, `case.events_case`
- `public.v_shipments_master`, `public.v_case_segments` 등 (뷰)

### Step 3: Phase 3 - ETL 실행

#### 3.1 Status SSOT 레이어

```bash
python scripts/etl/status_etl.py \
  --status "HVDC_all_status.json" \
  --warehouse hvdc_warehouse_status.json \
  --outdir ../hvdc_output
```

**생성 파일**:
- `hvdc_output/supabase/shipments_status.csv` (예상: 871행)
- `hvdc_output/supabase/events_status.csv` (예상: 928행)

#### 3.2 Option-C Case 레이어

```bash
python scripts/etl/optionc_etl.py \
  --all hvdc_excel_reporter_final_sqm_rev_3.json \  # ✅ 우선 사용
  --wh hvdc_warehouse_status.json \
  --customs HVDC_STATUS.json \
  --output-dir .../supabase/supabase/data/output/optionC \
  --export-ttl
```

**생성 파일**:
- `supabase/data/output/optionC/locations.csv` (예상: 28행)
- `supabase/data/output/optionC/shipments_case.csv` (예상: 491행)
- `supabase/data/output/optionC/cases.csv` (예상: 8,804행)
- `supabase/data/output/optionC/flows.csv` (예상: 8,804행)
- `supabase/data/output/optionC/events_case.csv` (예상: 50,677행)

### Step 4: Phase 4 - CSV 적재

**적재 순서** (FK 의존성):
1. `status.shipments_status` (FK 없음)
2. `status.events_status` (`shipments_status` 참조)
3. `case.locations` (FK 없음)
4. `case.shipments_case` (FK 없음)
5. `case.cases` (`shipments_case` 참조 가능)
6. `case.flows` (`cases` 참조 필요)
7. `case.events_case` (`cases`, `locations` 참조 필요)

### Step 5: Phase 5 - Gate 1 QA

**검증 항목**:
- **Orphan 체크**: 참조 무결성 검증 (예상: 0)
- **Duplicate 체크**: 중복 데이터 검증 (예상: 0)
- **Flow Code 규칙**: Flow Code v3.5 규칙 준수 확인

### Step 6: Phase 6 - Realtime 활성화

**활성화 대상 테이블**:
- `status.shipments_status`, `status.events_status`
- `case.events_case`, `case.flows`, `case.cases`

---

## 🔍 연결 문제 해결

### VPN/IPv6 이슈

**증상**:
```
failed to resolve host 'db.<PROJECT-REF>.supabase.co'
SSL SYSCALL error: Connection reset by peer
```

**해결**: Session pooler 사용

```powershell
# Session pooler URI (포트 5432)
$env:SUPABASE_DB_URL = "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=10"
```

**진단**:
```powershell
# DNS 확인
Resolve-DnsName aws-0-[REGION].pooler.supabase.com

# TCP 연결 확인
Test-NetConnection aws-0-[REGION].pooler.supabase.com -Port 5432
```

자세한 내용: [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md)

### Supabase 연결 문자열 찾기

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Connect** 버튼 클릭
4. **Session** pooler URI 선택 (포트 5432)
5. Connection string 복사

자세한 내용: [SUPABASE_CONNECTION_STRING_GUIDE.md](../supabase/SUPABASE_CONNECTION_STRING_GUIDE.md)

---

## ✅ 실행 후 확인

### 1. CSV 생성 확인

```powershell
# Status 레이어
Get-Content hvdc_output/supabase/shipments_status.csv | Measure-Object -Line
Get-Content hvdc_output/supabase/events_status.csv | Measure-Object -Line

# Case 레이어
Get-Content supabase/data/output/optionC/cases.csv | Measure-Object -Line
Get-Content supabase/data/output/optionC/flows.csv | Measure-Object -Line
```

**예상 결과**:
- `shipments_status.csv`: 872행 (헤더 포함)
- `events_status.csv`: 929행 (헤더 포함)
- `cases.csv`: 8,805행 (헤더 포함)
- `flows.csv`: 8,805행 (헤더 포함)

### 2. 리포트 확인

```powershell
# Option-C ETL 리포트
Get-Content supabase/data/output/optionC/report.json | ConvertFrom-Json | Format-List
```

**예상 결과**:
```json
{
  "all_rows": 8804,
  "all_invalid_rows": 0,           // ✅ 0이어야 함
  "all_unique_case_keys": 8804,     // ✅ 0보다 커야 함
  "shipments": 491,                // ✅ 0보다 커야 함
  "cases": 8804,                   // ✅ 0보다 커야 함
  "flows": 8804,                   // ✅ 0보다 커야 함
  "events": 50677                  // ✅ 0보다 커야 함
}
```

### 3. Supabase 데이터 확인

```sql
-- Status 레이어
SELECT COUNT(*) FROM status.shipments_status;  -- 예상: 871
SELECT COUNT(*) FROM status.events_status;     -- 예상: 928

-- Case 레이어
SELECT COUNT(*) FROM "case".cases;          -- 예상: 8,804
SELECT COUNT(*) FROM "case".flows;          -- 예상: 8,804
SELECT COUNT(*) FROM "case".events_case;    -- 예상: 50,677
```

---

## 🚨 트러블슈팅

### 오류 1: `SUPABASE_DB_URL is required`

**원인**: 환경 변수가 설정되지 않음

**해결**:
```powershell
$env:SUPABASE_DB_URL = "postgresql://..."
```

### 오류 2: `psql: command not found`

**원인**: PostgreSQL 클라이언트가 PATH에 없음

**해결**:
- PostgreSQL 설치 확인
- PATH에 `psql` 추가
- 또는 Supabase Dashboard SQL Editor 사용

### 오류 3: `Option-C input JSON not found`

**원인**: `hvdc_excel_reporter_final_sqm_rev_3.json`이 `supabase/data/raw/`에 없음

**해결**:
- 파일이 루트 디렉토리에 있으면 스크립트가 자동 이동
- 수동 이동: `Move-Item -Path "hvdc_excel_reporter_final_sqm_rev_3.json" -Destination "supabase/data/raw/"`

### 오류 4: ETL 스크립트 실행 실패

**원인**: Python 의존성 누락 또는 입력 파일 오류

**해결**:
```powershell
# Python 의존성 설치
pip install pandas numpy

# 입력 파일 확인
python scripts/hvdc/validate_inputs.py --repo-root . --source-dir supabase/data/raw
```

---

## 📚 참조 문서

### 실행 가이드
- [REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md](../REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md) - 실행 가이드
- [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md) - 상세 Runbook
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 단계별 계획

### Phase별 상세 플랜
- [PHASE2_DDL_APPLICATION_PLAN.md](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) - DDL 적용
- [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - CSV 적재
- [PHASE5_GATE1_QA_PLAN.md](../data-loading/PHASE5_GATE1_QA_PLAN.md) - Gate 1 QA
- [PHASE6_REALTIME_ACTIVATION_PLAN.md](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md) - Realtime 활성화

### 연결 및 트러블슈팅
- [SUPABASE_CONNECTION_STRING_GUIDE.md](../supabase/SUPABASE_CONNECTION_STRING_GUIDE.md) - 연결 문자열 찾기
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 해결

### ETL 및 데이터
- [ETL_GUIDE.md](./ETL_GUIDE.md) - ETL 스크립트 가이드
- [SUPABASE_UPLOAD_DATA_LOCATIONS.md](../supabase/SUPABASE_UPLOAD_DATA_LOCATIONS.md) - 실제 데이터 위치
- [SUPABASE_OPTIONC_EMPTY_DATA_ANALYSIS.md](../supabase/SUPABASE_OPTIONC_EMPTY_DATA_ANALYSIS.md) - Option-C 빈 데이터 원인 분석

### 소스 파일
- [supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md) - Supabase 구성 Runbook
- [supabase/data/raw/README_dashboard_ready_FULL.md](../supabase/data/raw/README_dashboard_ready_FULL.md) - ETL 스크립트 설명

---

## 📝 실행 체크리스트

### 실행 전
- [ ] PowerShell 5.1+ 확인
- [ ] `psql` 설치 및 PATH 확인
- [ ] `python` 설치 및 PATH 확인
- [ ] `SUPABASE_DB_URL` 환경 변수 설정
- [ ] 필수 입력 파일 존재 확인
- [ ] ETL 스크립트 존재 확인

### 실행 중
- [ ] 파일 이동 성공 확인
- [ ] Phase 1 (입력 검증) 통과
- [ ] Phase 2 (DDL 적용) 성공
- [ ] Phase 3 (ETL 실행) 성공
- [ ] Phase 4 (CSV 적재) 성공
- [ ] Phase 5 (Gate 1 QA) 통과
- [ ] Phase 6 (Realtime 활성화) 성공

### 실행 후
- [ ] CSV 파일 생성 확인
- [ ] 리포트 확인 (`report.json`)
- [ ] Supabase 데이터 확인 (행 수 검증)
- [ ] Gate 1 QA 결과 확인 (Orphan/Duplicate/Flow Code)

---

**최종 업데이트**: 2026-02-07

**최근 변경사항** (2026-02-05~2026-02-07):
- UI/UX 개선 완료: 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화
- 대시보드 데이터 반영 완료: Phase 2~6 완료, 로컬 테스트 성공 (871 rows·KPI)
