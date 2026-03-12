# 루트 폴더 추가 정리 계획

> **상태**: 계획 완료, 실행 대기  
> **작성일**: 2026-01-26  
> **목적**: 루트 폴더의 빌드 캐시, 빈 폴더, 임시 파일들을 정리하고 src/ 폴더와 reports/ 폴더의 적절한 위치를 결정

## 개요

이 문서는 루트 폴더 정리 작업의 상세 계획을 담고 있습니다. 모든 작업은 단계별 검증을 거쳐 안전하게 진행됩니다.

## 현재 상태 분석

### 발견된 추가 정리 대상

#### 1. 빌드/캐시 폴더 (5개 삭제, 1개 유지)

- `.benchmarks` - 벤치마크 결과 (임시) → 삭제
- `.pytest_cache` - pytest 캐시 (임시) → 삭제
- `.turbo` - Turbo 빌드 캐시 (임시) → 삭제
- `.venv` - Python 가상환경 (로컬 개발용) → **유지** (정리 대상 제외)
- `.vercel` - Vercel 빌드 캐시 (임시) → 삭제
- `out` - Next.js 빌드 출력 (임시) → 삭제

**상태**: 모두 .gitignore에 포함되어 있지만 실제로 존재  
**처리**: 5개 삭제, `.venv`는 유지

#### 2. 빈 폴더 (완료)

- `supabase_csv_optionC_v3` - 빈 폴더 (이미 삭제됨)  
**상태**: 삭제 완료  
**처리**: 완료

#### 3. 확인 필요 폴더 (2개)

##### 3.1 src/ 폴더

- `src/core/app.py` - 간단한 main() 함수
- `src/core/env.py` - 환경 변수 로딩 함수
- `src/__init__.py` - Python 패키지 초기화

**참조 확인**:
- `tests/test_env.py`에서 `from src.core.env import load_env_variables` 사용
- `tests/test_app_runs.py`에서 `from src.core.app import main` 사용

**상태**: 테스트에서 사용 중  
**처리 옵션**:
- 옵션 A: `src/` 유지 (현재 구조 유지)
- 옵션 B: `src/` → `scripts/core/`로 이동 (scripts 구조와 통합)
- **권장: 옵션 B** (scripts 구조와 일관성)

##### 3.2 reports/ 폴더

- `reports/analysis/` - 분석 리포트 파일들
  - `columns_inventory.json`
  - `csv/flow_distribution.csv`
  - `csv/site_summary.csv`
  - `csv/vendor_flow_top20.csv`
  - `hvdc_json_analysis.json`
  - `hvdc_json_analysis.md`

**상태**: 분석 리포트 (과거 분석 결과)  
**참조 확인**: 문서/코드에서 참조 없음  
**처리**: `archive/reports/`로 이동 (과거 분석 결과 보존)

## 정리 계획 (신중한 접근)

### Phase 1: 빌드/캐시 폴더 삭제 (단계별 검증)

#### 1.1 안전하게 삭제 가능한 빌드 캐시 (5개)

- `.benchmarks` 삭제 (벤치마크 결과, 재생성 가능)
- `.pytest_cache` 삭제 (pytest 캐시, 자동 재생성)
- `.turbo` 삭제 (Turbo 빌드 캐시, 자동 재생성)
- `.vercel` 삭제 (Vercel 빌드 캐시, 자동 재생성)
- `out` 삭제 (Next.js 빌드 출력, 자동 재생성)

**검증 절차**:

1. 각 폴더 삭제 전 크기 확인 (선택적)
2. 삭제 후 간단한 명령 실행하여 정상 작동 확인:
   - `.pytest_cache`: `pytest tests/test_app_runs.py -v`
   - `.turbo`, `out`: 선택적 (필요 시 부분 빌드로 확인)
3. 문제 발생 시 즉시 중단 및 롤백

#### 1.2 .venv 폴더 처리 (유지 결정)

- **현재 상태**: 5597개 파일이 있는 활발한 가상환경
- **Python 경로**: 시스템 Python 사용 중 (가상환경 비활성화 상태)
- **결정**: **유지** (로컬 개발 환경 보존)
- **이유**:
  - .gitignore에 포함되어 Git 영향 없음
  - 로컬 개발 환경 보존 필요
  - 삭제 시 재생성 시간 소요
- **처리**: 삭제하지 않음 (정리 대상에서 제외)

### Phase 2: 빈 폴더 삭제

#### 2.1 supabase_csv_optionC_v3 삭제 (완료)

- 빈 폴더이므로 안전하게 삭제 가능
- **상태**: 이미 삭제 완료

### Phase 3: src/ 폴더 처리

#### 3.1 src/ 폴더 이동 결정

- 옵션 A: 유지 (현재 구조 유지)
- 옵션 B: `src/` → `scripts/core/`로 이동

**권장: 옵션 B**

- 이유: scripts 구조와 일관성, 프로젝트 구조 단순화

#### 3.2 src/ 폴더 이동 (옵션 B 선택 시 - 신중한 검증)

**사전 확인**:

- `scripts/core/` 폴더는 이미 존재하며 다른 파일들 사용 중:
  - `column_audit.py` - 컬럼 감사 스크립트
  - `flow_code_calc.py` - Flow Code v3.5 계산
  - `json_to_ttl.py` - JSON → TTL 변환
- `src/core/app.py`와 `src/core/env.py`는 새 파일이므로 기존 파일과 충돌 없음
- `pyproject.toml`에 `pythonpath = ["."]` 설정되어 있어 경로 변경 시 문제 없음
- README.md 프로젝트 구조에 `src/` 폴더 언급 없음 (제거해도 문서 영향 없음)

**이동 절차**:

1. `src/core/app.py` → `scripts/core/app.py`로 이동 (기존 app.py 없음 확인)
2. `src/core/env.py` → `scripts/core/env.py`로 이동 (기존 env.py 없음 확인)
3. `src/__init__.py` 삭제 (불필요)
4. 테스트 파일 import 경로 업데이트:
   - `tests/test_env.py`: `from src.core.env` → `from scripts.core.env`
   - `tests/test_app_runs.py`: `from src.core.app` → `from scripts.core.app`
5. **즉시 검증**: `pytest tests/test_env.py tests/test_app_runs.py -v` 실행하여 통과 확인
6. 문제 발생 시 롤백 (파일 원위치, import 경로 복원)

### Phase 4: reports/ 폴더 아카이브

#### 4.1 reports/ 폴더 이동

- `reports/` → `archive/reports/`로 이동
- 과거 분석 결과 보존

### Phase 5: 최종 검증

#### 5.1 루트 폴더 구조 확인

- 빌드/캐시 폴더 제거 확인
- 빈 폴더 제거 확인
- src/ 또는 scripts/core/ 구조 확인
- reports/ 아카이브 확인

#### 5.2 참조 링크 확인

- src/ 이동 시 테스트 파일 import 경로 업데이트 확인
- 모든 테스트 통과 확인

## 실행 순서

### Step 1: 빌드/캐시 폴더 삭제 (단계별 검증)

1. 각 폴더 삭제 전 크기 확인
2. `.benchmarks` 삭제 → 검증 (선택적)
3. `.pytest_cache` 삭제 → 간단한 테스트 실행 (`pytest tests/test_app_runs.py -v`)하여 정상 작동 확인
4. `.turbo` 삭제 → 선택적 검증 (필요 시 `pnpm build --filter logistics-dashboard`로 부분 빌드 확인)
5. `.vercel` 삭제 → 검증 (Vercel CLI 사용 시 자동 재생성, 문제 없음)
6. `out` 삭제 → 선택적 검증 (필요 시 `pnpm build --filter logistics-dashboard`로 부분 빌드 확인)
7. `.venv` 유지 (정리 대상에서 제외)

### Step 2: 빈 폴더 삭제 (완료)

1. `supabase_csv_optionC_v3` 삭제 (완료)

### Step 3: src/ 폴더 처리 (신중한 검증)

1. `scripts/core/` 폴더 기존 파일 확인 (column_audit.py, flow_code_calc.py, json_to_ttl.py 존재 확인)
2. src/ 폴더 이동 결정 (옵션 B 권장: scripts 구조와 일관성)
3. 파일 이동:
   - `src/core/app.py` → `scripts/core/app.py` (기존 app.py 없음 확인)
   - `src/core/env.py` → `scripts/core/env.py` (기존 env.py 없음 확인)
   - `src/__init__.py` 삭제
4. 테스트 파일 import 경로 업데이트:
   - `tests/test_env.py`: `from src.core.env` → `from scripts.core.env`
   - `tests/test_app_runs.py`: `from src.core.app` → `from scripts.core.app`
5. **즉시 검증**: `pytest tests/test_env.py tests/test_app_runs.py -v` 실행
6. 테스트 통과 확인 실패 시 즉시 롤백 (파일 원위치, import 경로 복원)

### Step 4: reports/ 폴더 아카이브

1. `reports/` → `archive/reports/`로 이동

### Step 5: 최종 검증

1. 루트 폴더 구조 확인
2. 테스트 실행 및 통과 확인

## 예상 최종 구조

루트 폴더에는 다음만 남음:

### 핵심 문서 (8개)

- README.md, CHANGELOG.md, STATUS.md, PROJECT_SUMMARY.md, SETUP.md, plan.md, AGENTS.md, dash_plan.md

### 설정 파일 (11개)

- .env.example, .gitignore, .pre-commit-config.yaml, pnpm-lock.yaml, pnpm-workspace.yaml, pyproject.toml, turbo.json, vercel.json, requirements-dev.txt, package.json, CODEOWNERS

### 프로젝트 구조 폴더

- apps/, packages/, scripts/ (src/core/ 통합 예정), configs/, docs/, supabase/, tests/, tools/, map/, supabass_ontol/, archive/ (reports/ 포함 예정), dash/, Logi ontol core doc/, hvdc_output/

**변경 예정**:

- `src/` → `scripts/core/`로 통합 (옵션 B 선택 시)
- `reports/` → `archive/reports/`로 이동

## 안전장치 (강화)

1. **단계별 검증 필수**: 각 폴더/파일 삭제/이동 후 즉시 검증
2. **롤백 계획**: 각 단계별 롤백 방법 명시
3. **.venv 유지**: 로컬 개발 환경이므로 삭제하지 않고 유지 (정리 대상에서 제외)
4. **src/ 이동 시 즉시 테스트**: import 경로 변경 후 즉시 해당 테스트 실행하여 통과 확인
5. **보존 우선**: reports/는 삭제하지 않고 archive로 이동
6. **Git 상태 확인**: 각 단계 전후 Git 상태 확인 (변경사항 추적)

## 주의사항 (신중한 접근)

1. **.venv 폴더**:
   - **결정: 유지** (정리 대상에서 제외)
   - 로컬 개발 환경 (5597개 파일)
   - 현재 비활성화 상태 (시스템 Python 사용 중)
   - .gitignore에 포함되어 Git 영향 없음
   - 로컬 개발 환경 보존 필요

2. **src/ 폴더 이동**:
   - 테스트에서 사용 중 (`tests/test_env.py`, `tests/test_app_runs.py`)
   - `scripts/core/` 폴더는 이미 존재하지만 충돌 없음 (app.py, env.py는 새 파일)
   - 이동 후 **즉시 테스트 실행**하여 검증 필수
   - 문제 발생 시 즉시 롤백

3. **빌드 캐시**:
   - 삭제해도 빌드/테스트 시 자동 재생성되므로 안전
   - 단, 삭제 후 빌드/테스트 정상 작동 확인 필수

4. **reports/ 폴더**:
   - 과거 분석 결과이므로 archive로 보존
   - 참조하는 코드/문서 없음 확인 완료

5. **Git 상태**:
   - 모든 변경사항은 Git으로 추적 가능
   - 문제 발생 시 `git checkout`으로 롤백 가능

## 검증 체크리스트 (단계별)

### Phase 1: 빌드/캐시 폴더

- [ ] 각 폴더 삭제 전 크기 확인 (선택적)
- [ ] `.benchmarks` 삭제 및 검증 (선택적)
- [ ] `.pytest_cache` 삭제 및 검증 (`pytest tests/test_app_runs.py -v` 실행하여 정상 작동 확인)
- [ ] `.turbo` 삭제 및 검증 (선택적: 필요 시 부분 빌드로 확인)
- [ ] `.vercel` 삭제 및 검증 (Vercel CLI 사용 시 자동 재생성, 문제 없음)
- [ ] `out` 삭제 및 검증 (선택적: 필요 시 부분 빌드로 확인)
- [ ] `.venv` 유지 확인 (정리 대상에서 제외)

### Phase 2: 빈 폴더 (완료)

- [x] `supabase_csv_optionC_v3` 빈 폴더 확인
- [x] 삭제 완료

### Phase 3: src/ 폴더

- [ ] src/ 폴더 처리 결정 (유지 또는 이동)
- [ ] `scripts/core/` 폴더 기존 파일 확인 (충돌 없음 확인)
- [ ] 파일 이동 완료 (app.py, env.py)
- [ ] 테스트 import 경로 업데이트 완료
- [ ] **즉시 테스트 실행**: `pytest tests/test_env.py tests/test_app_runs.py -v` 통과 확인
- [ ] 문제 발생 시 롤백 완료

### Phase 4: reports/ 폴더

- [ ] reports/ 폴더 참조 확인 (참조 없음 확인 완료)
- [ ] archive/reports/로 이동 완료

### Phase 5: 최종 검증

- [ ] 루트 폴더 최종 구조 확인 완료
- [ ] 모든 테스트 통과 확인 (`pytest` 전체 실행)
- [ ] Git 상태 확인 (`git status`로 변경사항 추적)
- [ ] README.md 프로젝트 구조 섹션 업데이트 (src/ 제거, scripts/core/ 명시)
- [ ] 모든 변경사항 커밋 준비 완료

## 실행 시 주의사항

1. **단계별 실행**: 한 번에 하나씩 실행하고 검증 후 다음 단계 진행
2. **Git 커밋**: 각 Phase 완료 후 커밋 권장 (롤백 용이)
3. **테스트 검증**: src/ 폴더 이동 시 반드시 테스트 통과 확인
4. **문제 발생 시**: 즉시 중단하고 롤백

## 참고 문서

- 원본 계획: `c:\Users\minky\.cursor\plans\루트_폴더_추가_정리_계획_e2d5ab58.plan.md`
- 이전 정리 작업: `archive/docs-cleanup-summary.md`

---

**작성일**: 2026-01-26  
**상태**: 계획 완료, 실행 대기  
**다음 단계**: 실행 준비 완료 시 이 문서를 참고하여 단계별로 진행
