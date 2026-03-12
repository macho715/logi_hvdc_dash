# realtime-kpi-dashboard_patch_v2 통합 작업 계획

> **작성일**: 2026-01-24  
> **목적**: `realtime-kpi-dashboard_patch_v2` 폴더의 파일들을 메인 레포에 통합하여 Windows/Linux/Mac 모두에서 실행 가능한 데이터 로딩 파이프라인을 구축합니다.

## 목적

`realtime-kpi-dashboard_patch_v2` 폴더의 파일들을 메인 레포에 통합하여 Windows/Linux/Mac 모두에서 실행 가능한 데이터 로딩 파이프라인을 구축합니다.

## 통합 대상 파일

### 1. scripts/hvdc/ 디렉토리 (9개 파일)

**소스**: `realtime-kpi-dashboard_patch_v2/scripts/hvdc/`  
**대상**: `scripts/hvdc/` (신규 생성)

- `validate_inputs.py` - Phase 1: 입력 검증 스크립트
- `run_etl_status.sh` - Phase 3.1: Status ETL 실행 (bash)
- `run_etl_case.sh` - Phase 3.2: Option-C ETL 실행 (bash)
- `run_all.sh` - 전체 파이프라인 실행 (bash)
- `run_gate1_qa.sh` - Gate 1 QA 실행 (bash)
- `run_all.ps1` - 전체 파이프라인 실행 (PowerShell, Windows)
- `run_gate1_qa.ps1` - Gate 1 QA 실행 (PowerShell, Windows)
- `load_csv.psql` - Phase 4: CSV 적재 스크립트
- `gate1_qa.sql` - Phase 5: Gate 1 QA 쿼리

**주의사항**:
- `scripts/gate1_qa_queries.sql` (기존)과 `scripts/hvdc/gate1_qa.sql` (신규)는 다른 용도이므로 둘 다 유지
- bash 스크립트는 실행 권한 설정 필요 (`chmod +x`)

### 2. tests/ 디렉토리 확장 (4개 파일)

**소스**: `realtime-kpi-dashboard_patch_v2/tests/`  
**대상**: `tests/` (기존 디렉토리 확장)

- `tests/integration/test_etl.py` - ETL 통합 테스트 (기존 `test_rls.py`와 병행)
- `tests/integration/test_data_loading.py` - 데이터 로딩 통합 테스트
- `tests/validation/test_gate1_qa.py` - Gate 1 QA 검증 테스트 (신규 디렉토리)
- `tests/utils/db.py` - DB 헬퍼 유틸리티 (신규 디렉토리)

**주의사항**:
- `tests/validation/` 디렉토리 신규 생성
- `tests/utils/` 디렉토리 신규 생성

### 3. supabase/migrations/ 파일 (2개)

**소스**: `realtime-kpi-dashboard_patch_v2/supabase/migrations/`  
**대상**: `supabase/migrations/` (기존 디렉토리)

- `20260124_enable_realtime_layers.sql` - Realtime 활성화 (레이어 스키마용)
- `20260124_create_dashboard_views.sql` - 대시보드 View 생성

**주의사항**:
- `20260124_enable_realtime.sql` (기존)과 `20260124_enable_realtime_layers.sql` (신규)는 다른 목적이므로 둘 다 유지
- 기존 파일은 더 상세한 주석 포함, 신규 파일은 레이어 스키마 전용

### 4. docs/ 문서 (3개)

**소스**: `realtime-kpi-dashboard_patch_v2/docs/`  
**대상**: `docs/` (기존 디렉토리)

- `DATA_LOADING_RUNBOOK.md` - Phase 1~7 실행 가이드
- `DATA_LOADING_REPORT_TEMPLATE.md` - 실행 결과 기록 템플릿
- `DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md` - Realtime KPI 개발 계획

**주의사항**:
- `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md`는 루트에 이미 존재하며 내용이 동일하므로 복사하지 않음
- 루트의 `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md`는 중복이므로 삭제 고려

## 설정 파일 업데이트

### 1. requirements-dev.txt

**파일**: `requirements-dev.txt`  
**변경**: DB 테스트용 드라이버 추가

```txt
pytest
ruff
black
isort
bandit
pyupgrade
psycopg[binary]>=3.0.0  # 추가: DB 통합/검증 테스트용
```

**이유**: `tests/utils/db.py`가 `psycopg` 또는 `psycopg2`를 사용하므로 필요

### 2. pyproject.toml

**파일**: `pyproject.toml`  
**변경**: pytest 마커 추가

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
markers = [
    "integration: integration tests (require DB or external services)",
    "validation: validation tests (require DB)",
    "etl: ETL tests (require source files)",
]
```

**이유**: 테스트 마커로 조건부 실행 제어 (`HVDC_ETL_RUN=1`, `SUPABASE_DB_URL` 등)

## 문서 업데이트

### 1. README.md

**파일**: `README.md`  
**변경**: 주요 문서 섹션에 새 문서 링크 추가

```markdown
## 📚 주요 문서

- ... (기존 문서들) ...
- [데이터 로딩 실행 가이드](./REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md) - 실제 레포 구조 기반 실행 가이드 (이미 존재)
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md) - 🆕 Phase 1~7 상세 실행 가이드
- [데이터 로딩 리포트 템플릿](../data-loading/DATA_LOADING_REPORT_TEMPLATE.md) - 🆕 실행 결과 기록 템플릿
- [Realtime KPI 개발 계획](../guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md) - 🆕 Realtime KPI 개발 계획
```

### 2. 데이터 로딩 및 시스템 통합 Q&A 종합 문서.md

**파일**: `데이터 로딩 및 시스템 통합 Q&A 종합 문서.md`  
**변경**: Q7 섹션 추가 (v2 통합 완료 내용)

```markdown
## Q7: v2 패치 통합 완료

### 통합 완료 사항
- Windows PowerShell 스크립트 추가 완료
- 실행 가이드 문서 통합 완료
- 테스트 파일 통합 완료
- 설정 파일 업데이트 완료

### 참조 문서 업데이트
- [데이터 로딩 실행 가이드](./REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md)
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md)
- [데이터 로딩 리포트 템플릿](../data-loading/DATA_LOADING_REPORT_TEMPLATE.md)
- [Realtime KPI 개발 계획](../guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md)
```

## 충돌 확인 및 해결

### 1. Gate 1 QA 쿼리

- **기존**: `scripts/gate1_qa_queries.sql` (SQL 쿼리만)
- **신규**: `scripts/hvdc/gate1_qa.sql` (psql 실행 가능)
- **해결**: 둘 다 유지 (용도가 다름)

### 2. Realtime 마이그레이션

- **기존**: `supabase/migrations/20260124_enable_realtime.sql` (189줄, 상세 주석)
- **신규**: `supabase/migrations/20260124_enable_realtime_layers.sql` (48줄, 레이어 전용)
- **해결**: 둘 다 유지 (목적이 다름)

### 3. 실행 가이드 문서

- **기존**: 루트 `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md`
- **신규**: `realtime-kpi-dashboard_patch_v2/docs/REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md`
- **복사본**: 루트 `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md`
- **해결**: 내용이 모두 동일하므로 기존 루트 파일 유지, v2 패치의 문서는 복사하지 않음, 복사본 파일은 삭제

## 사전 요구사항 확인

### supabase/data/raw 폴더 필수 파일 확인

통합 작업 전에 `supabase/data/raw/` 폴더에 다음 필수 파일들이 존재하는지 확인해야 합니다:

#### 필수 파일 (Status SSOT 레이어)
- ✅ `HVDC_all_status.json` (또는 `HVDC all status.json`) - **확인됨**
- ✅ `hvdc_warehouse_status.json` - **확인됨**
- ✅ `scripts/etl/status_etl.py` - **확인됨**
- ✅ `20260124_hvdc_layers_status_case_ops.sql` - **확인됨**

#### 필수 파일 (Option-C Case 레이어)
- ✅ `scripts/etl/optionc_etl.py` - **확인됨**
- ✅ `flow_code_calculator.py` - **확인됨**
- ❌ `HVDC_STATUS.json` - **누락됨** (Option-C 실행 시 필요)

#### 확인 방법

```bash
# validate_inputs.py 스크립트로 확인
python scripts/hvdc/validate_inputs.py --repo-root . --source-dir supabase/data/raw

# 또는 수동 확인
ls supabase/data/raw/HVDC_all_status.json
ls supabase/data/raw/hvdc_warehouse_status.json
ls supabase/data/raw/scripts/etl/status_etl.py
ls supabase/data/raw/scripts/etl/optionc_etl.py
ls supabase/data/raw/flow_code_calculator.py
ls supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql
```

#### 누락 파일 처리

- `HVDC_STATUS.json`이 없으면 Option-C Case 레이어 ETL은 실행할 수 없습니다.
- Status SSOT 레이어만 사용하는 경우에는 문제없습니다.
- Option-C를 사용하려면 `HVDC_STATUS.json` 파일을 `supabase/data/raw/` 폴더에 추가해야 합니다.

## 실행 순서

### 0단계: 사전 요구사항 확인

1. `supabase/data/raw/` 폴더 존재 확인
2. 필수 파일 확인 (위의 "사전 요구사항 확인" 섹션 참조)
3. `validate_inputs.py` 실행하여 검증

### 1단계: 파일 복사

**Windows PowerShell:**
```powershell
# scripts/hvdc/ 디렉토리 생성 및 파일 복사
New-Item -ItemType Directory -Force -Path scripts/hvdc
Copy-Item realtime-kpi-dashboard_patch_v2/scripts/hvdc/* scripts/hvdc/

# supabase/migrations/ 파일 복사
Copy-Item realtime-kpi-dashboard_patch_v2/supabase/migrations/* supabase/migrations/

# tests/ 디렉토리 생성 및 파일 복사
New-Item -ItemType Directory -Force -Path tests/integration
New-Item -ItemType Directory -Force -Path tests/validation
New-Item -ItemType Directory -Force -Path tests/utils
Copy-Item realtime-kpi-dashboard_patch_v2/tests/integration/* tests/integration/
Copy-Item realtime-kpi-dashboard_patch_v2/tests/validation/* tests/validation/
Copy-Item realtime-kpi-dashboard_patch_v2/tests/utils/* tests/utils/

# docs/ 문서 복사 (REPO_EXECUTION_GUIDE 제외)
Copy-Item realtime-kpi-dashboard_patch_v2/docs/DATA_LOADING_RUNBOOK.md docs/
Copy-Item realtime-kpi-dashboard_patch_v2/docs/DATA_LOADING_REPORT_TEMPLATE.md docs/
Copy-Item realtime-kpi-dashboard_patch_v2/docs/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md docs/

# 중복 파일 삭제
Remove-Item "REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md" -ErrorAction SilentlyContinue
```

**Linux/Mac:**
```bash
# scripts/hvdc/ 디렉토리 생성 및 파일 복사
mkdir -p scripts/hvdc
cp realtime-kpi-dashboard_patch_v2/scripts/hvdc/* scripts/hvdc/
chmod +x scripts/hvdc/*.sh

# supabase/migrations/ 파일 복사
cp realtime-kpi-dashboard_patch_v2/supabase/migrations/* supabase/migrations/

# tests/ 디렉토리 생성 및 파일 복사
mkdir -p tests/integration tests/validation tests/utils
cp -r realtime-kpi-dashboard_patch_v2/tests/integration/* tests/integration/
cp -r realtime-kpi-dashboard_patch_v2/tests/validation/* tests/validation/
cp -r realtime-kpi-dashboard_patch_v2/tests/utils/* tests/utils/

# docs/ 문서 복사 (REPO_EXECUTION_GUIDE 제외)
cp realtime-kpi-dashboard_patch_v2/docs/DATA_LOADING_RUNBOOK.md docs/
cp realtime-kpi-dashboard_patch_v2/docs/DATA_LOADING_REPORT_TEMPLATE.md docs/
cp realtime-kpi-dashboard_patch_v2/docs/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md docs/

# 중복 파일 삭제
rm -f "REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md"
```

### 2단계: 설정 파일 업데이트

- `requirements-dev.txt`에 `psycopg[binary]>=3.0.0` 추가
- `pyproject.toml`에 pytest 마커 추가

### 3단계: 문서 업데이트

- `README.md`에 새 문서 링크 추가
- `데이터 로딩 및 시스템 통합 Q&A 종합 문서.md`에 Q7 섹션 추가

### 4단계: 검증

1. bash 스크립트 실행 권한 설정 (Linux/Mac):
   ```bash
   chmod +x scripts/hvdc/*.sh
   ```

2. 의존성 설치 확인:
   ```bash
   pip install -r requirements-dev.txt
   ```

3. 기본 테스트 실행:
   ```bash
   pytest -q  # 기본 테스트 (스킵됨)
   ```

## 예상 결과

통합 완료 후:
- Windows/Linux/Mac 모두에서 데이터 로딩 파이프라인 실행 가능
- ETL 통합 테스트, 데이터 로딩 테스트, Gate 1 QA 검증 테스트 사용 가능
- 완전한 문서 세트 제공 (Runbook, Report Template, Development Plan, Execution Guide)

## 참조 문서

- [데이터 로딩 실행 가이드](../REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md)
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md)
- [데이터 로딩 리포트 템플릿](./DATA_LOADING_REPORT_TEMPLATE.md)
- [Realtime KPI 개발 계획](./DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md)
- [데이터 로딩 및 시스템 통합 Q&A 종합 문서](../데이터 로딩 및 시스템 통합 Q&A 종합 문서.md)

---

**최종 업데이트**: 2026-02-07

**통합 완료 상태**:
- ✅ Windows PowerShell 스크립트 통합 완료
- ✅ 실행 가이드 문서 통합 완료
- ✅ 테스트 파일 통합 완료
- ✅ 설정 파일 업데이트 완료
- ✅ Phase 2~6 데이터 적재 완료 (2026-01-25)
- ✅ 대시보드 데이터 반영 완료 (2026-01-25)
- ✅ UI/UX 개선 완료 (2026-02-05~2026-02-07)
