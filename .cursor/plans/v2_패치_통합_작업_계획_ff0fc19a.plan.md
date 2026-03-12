---
name: v2 패치 통합 작업 계획
overview: realtime-kpi-dashboard_patch_v2의 파일들을 메인 레포에 통합하고, 필요한 설정 파일과 문서를 업데이트합니다.
todos:
  - id: copy-scripts
    content: scripts/hvdc/ 디렉토리 생성 및 9개 파일 복사 (validate_inputs.py, run_etl_status.sh, run_etl_case.sh, run_all.sh, run_gate1_qa.sh, run_all.ps1, run_gate1_qa.ps1, load_csv.psql, gate1_qa.sql)
    status: completed
  - id: copy-tests
    content: tests/validation/, tests/utils/ 디렉토리 생성 및 4개 파일 복사 (test_etl.py, test_data_loading.py, test_gate1_qa.py, db.py)
    status: completed
  - id: copy-migrations
    content: supabase/migrations/에 2개 파일 복사 (20260124_enable_realtime_layers.sql, 20260124_create_dashboard_views.sql)
    status: completed
  - id: copy-docs
    content: docs/에 4개 문서 복사 (DATA_LOADING_RUNBOOK.md, DATA_LOADING_REPORT_TEMPLATE.md, DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md, REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md - 중복 확인 필요)
    status: completed
  - id: update-requirements
    content: requirements-dev.txt에 psycopg[binary]>=3.0.0 추가
    status: completed
  - id: update-pyproject
    content: pyproject.toml에 pytest 마커 (integration, validation, etl) 추가
    status: completed
  - id: update-readme
    content: README.md의 주요 문서 섹션에 새 문서 링크 4개 추가
    status: completed
  - id: update-qa-doc
    content: 데이터 로딩 및 시스템 통합 Q&A 종합 문서.md에 Q7 섹션 추가 (v2 통합 완료 내용)
    status: completed
  - id: set-permissions
    content: bash 스크립트 실행 권한 설정 (chmod +x scripts/hvdc/*.sh)
    status: completed
  - id: verify-integration
    content: "통합 검증: 의존성 설치 확인, 기본 테스트 실행 (pytest -q)"
    status: completed
isProject: false
---

# realtime-kpi-dashboard_patch_v2 통합 작업 계획

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
- [데이터 로딩 Runbook](./docs/DATA_LOADING_RUNBOOK.md) - 🆕 Phase 1~7 상세 실행 가이드
- [데이터 로딩 리포트 템플릿](./docs/DATA_LOADING_REPORT_TEMPLATE.md) - 🆕 실행 결과 기록 템플릿
- [Realtime KPI 개발 계획](./docs/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md) - 🆕 Realtime KPI 개발 계획
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
- [데이터 로딩 Runbook](./docs/DATA_LOADING_RUNBOOK.md)
- [데이터 로딩 리포트 템플릿](./docs/DATA_LOADING_REPORT_TEMPLATE.md)
- [Realtime KPI 개발 계획](./docs/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md)
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

## 실행 순서

1. **파일 복사** (Windows PowerShell 또는 Linux/Mac)

   - scripts/hvdc/ 디렉토리 생성 및 파일 복사 (9개)
   - tests/validation/, tests/utils/ 디렉토리 생성 및 파일 복사 (4개)
   - supabase/migrations/ 파일 복사 (2개)
   - docs/ 문서 복사 (3개: REPO_EXECUTION_GUIDE 제외)
   - 루트의 중복 파일 정리 (REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md 삭제)

2. **설정 파일 업데이트**

   - requirements-dev.txt에 psycopg 추가
   - pyproject.toml에 pytest 마커 추가

3. **문서 업데이트**

   - README.md에 새 문서 링크 추가
   - Q&A 종합 문서에 Q7 섹션 추가

4. **검증**

   - bash 스크립트 실행 권한 설정 (`chmod +x scripts/hvdc/*.sh`)
   - 의존성 설치 확인 (`pip install -r requirements-dev.txt`)
   - 기본 테스트 실행 (`pytest -q`)

## 예상 결과

통합 완료 후:

- Windows/Linux/Mac 모두에서 데이터 로딩 파이프라인 실행 가능
- ETL 통합 테스트, 데이터 로딩 테스트, Gate 1 QA 검증 테스트 사용 가능
- 완전한 문서 세트 제공 (Runbook, Report Template, Development Plan, Execution Guide)
