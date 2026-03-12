# HVDC Supabase Data Loading - Repo Execution Guide

> 목적: `docs/DATA_LOADING_PLAN.md`의 Phase 1~6을 **현재 레포 구조**(`scripts/`, `supabase/migrations/`, `tests/`)에 맞게 실행/CI 검증 가능한 형태로 고정합니다.

## 1. 패치 적용 방법

이 패치는 **레포 루트**에 그대로 병합하는 것을 전제로 합니다.

### 옵션 A) Zip을 레포 루트에 압축 해제 (추천)
- 레포 루트에서 압축을 해제하면 다음 폴더에 파일이 들어갑니다.
  - `scripts/hvdc/*`
  - `supabase/migrations/*`
  - `tests/integration/*`, `tests/validation/*`, `tests/utils/*`
  - `docs/*`

### 옵션 B) 수동 복사
- 필요한 파일만 선택적으로 복사합니다.

## 2. 패치가 추가하는 파일

### 스크립트
- `scripts/hvdc/validate_inputs.py`
- `scripts/hvdc/run_etl_status.sh`
- `scripts/hvdc/run_etl_case.sh`
- `scripts/hvdc/load_csv.psql`
- `scripts/hvdc/gate1_qa.sql`
- `scripts/hvdc/run_gate1_qa.sh`
- `scripts/hvdc/run_all.sh`

#### Windows 전용 (PowerShell)
- `scripts/hvdc/run_all.ps1`
- `scripts/hvdc/run_gate1_qa.ps1`

### Supabase migrations
- `supabase/migrations/20260124_enable_realtime_layers.sql`
- `supabase/migrations/20260124_create_dashboard_views.sql`

> 주의: 레포에 이미 존재하는 `20260124_enable_realtime.sql`은 **덮어쓰지 않습니다**.

### Tests (pytest)
- `tests/integration/test_etl.py` (HVDC_ETL_RUN=1 필요)
- `tests/integration/test_data_loading.py` (SUPABASE_DB_URL 필요)
- `tests/validation/test_gate1_qa.py` (SUPABASE_DB_URL 필요)
- `tests/utils/db.py`

## 3. 로컬 실행 (Phase 1~6)

### 3.1 필수 환경 변수
- `SUPABASE_DB_URL` (필수)
  - 예: `postgresql://postgres:***@db.<ref>.supabase.co:5432/postgres`

### 3.2 Linux/Mac/Git-Bash (bash)
```bash
export SUPABASE_DB_URL="postgresql://..."

bash scripts/hvdc/run_all.sh
```

### 3.3 Windows PowerShell
```powershell
$env:SUPABASE_DB_URL = "postgresql://..."

powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_all.ps1
```

## 4. Gate 1 QA만 재실행

### bash
```bash
export SUPABASE_DB_URL="postgresql://..."

bash scripts/hvdc/run_gate1_qa.sh
```

### PowerShell
```powershell
$env:SUPABASE_DB_URL = "postgresql://..."

powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_gate1_qa.ps1
```

## 5. CI 실행 방식 (권장)

기본 CI는 **빠른 테스트**(`pytest -q`)만 돌리고, 무거운 테스트는 환경 변수로 opt-in 합니다.

### 5.1 기본 (CI)
```bash
pytest -q
```

### 5.2 ETL 통합 테스트 (로컬 opt-in)
```bash
HVDC_ETL_RUN=1 pytest -q tests/integration/test_etl.py
```

### 5.3 DB 통합/검증 테스트 (로컬 opt-in)
```bash
SUPABASE_DB_URL="postgresql://..." pytest -q tests/integration/test_data_loading.py
SUPABASE_DB_URL="postgresql://..." pytest -q tests/validation/test_gate1_qa.py
```

## 6. Realtime enable 참고

Realtime(Postgres Changes)는 Supabase Dashboard에서 `supabase_realtime` publication에 테이블을 토글하거나,
`ALTER PUBLICATION supabase_realtime ADD TABLE ...` 방식으로 활성화합니다.

패치의 `20260124_enable_realtime_layers.sql`은 다음 테이블을 **존재할 때만** publication에 추가합니다:
- `status.shipments_status`, `status.events_status`
- `case.cases`, `case.flows`, `case.events_case`
- (옵션) legacy/public 테이블

## 7. 트러블슈팅

- **psql: command not found**
  - Postgres client 설치 또는 PATH 설정이 필요합니다.

- **ETL 스크립트가 파일을 못 찾음**
  - `supabass_ontol/` 내에 `HVDC all status.json` 또는 `HVDC_all_status.json`이 있는지 확인
  - `hvdc_warehouse_status.json`, `HVDC_STATUS.json` 존재 확인

- **DB 스키마 없음**
  - `supabass_ontol/20260124_hvdc_layers_status_case_ops.sql`이 적용되었는지 확인

