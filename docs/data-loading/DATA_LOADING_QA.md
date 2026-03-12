# 데이터 로딩 및 시스템 통합 Q&A 종합 문서

> **작성일**: 2026-01-24
> **목적**: 데이터 로딩 파이프라인, 시스템 통합, Realtime 구현 관련 주요 문의와 답변 종합

---

## Q1: realtime-kpi-dashboard_patch 폴더 전체 파일과 문서 확인

### 문의 내용
`realtime-kpi-dashboard_patch` 폴더 전체의 파일과 문서를 확인하라.

### 답변 요약

#### 폴더 구조
```
realtime-kpi-dashboard_patch/
├── docs/                                    # 문서 (3개)
│   ├── DATA_LOADING_REPORT_TEMPLATE.md     # 실행 결과 기록 템플릿
│   ├── DATA_LOADING_RUNBOOK.md             # Phase 1~7 실행 가이드
│   └── DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md  # 개발 계획
│
├── scripts/hvdc/                           # ETL 실행 스크립트 (7개)
│   ├── validate_inputs.py                 # Phase 1: 입력 검증
│   ├── run_etl_status.sh                  # Phase 3.1: Status ETL
│   ├── run_etl_case.sh                     # Phase 3.2: Option-C ETL
│   ├── load_csv.psql                       # Phase 4: CSV 적재
│   ├── gate1_qa.sql                       # Phase 5: Gate 1 QA 쿼리
│   ├── run_gate1_qa.sh                    # Phase 5: Gate 1 QA 실행
│   └── run_all.sh                         # 전체 파이프라인 실행
│
├── supabase/migrations/                    # 마이그레이션 (3개)
│   ├── 20260124_enable_realtime_layers.sql  # Realtime 활성화
│   ├── 20260124_create_dashboard_views.sql  # View 생성
│   └── 20260124_enable_realtime.sql        # (중복, 동일 내용)
│
└── tests/                                  # 테스트 (4개 파일)
    ├── integration/
    │   ├── test_etl.py                     # ETL 통합 테스트
    │   └── test_data_loading.py            # 데이터 로딩 테스트
    ├── validation/
    │   └── test_gate1_qa.py                # Gate 1 QA 검증
    └── utils/
        └── db.py                           # DB 헬퍼
```

#### 주요 발견 사항
- 중복 구조: `realtime-kpi-dashboard_patch/realtime-kpi-dashboard_patch/` 안에 동일한 파일들이 중복되어 있음
- 완전한 ETL 파이프라인: Phase 1~7 실행 가능한 스크립트 준비됨
- 문서 상태: Runbook, Report Template, Development Plan 포함

---

## Q2: 실제 레포 구조에 맞춘 경로/명명/CI 실행 방식 정리

### 문의 내용
신 레포의 실제 파일 트리에 맞춰 경로/명명/CI 실행 방식을 알려달라.

### 답변 요약

#### 실제 파일 경로 구조 (현재 상태)
```
c:\LOGI MASTER DASH\
├── scripts/
│   ├── core/                    # 기존: json_to_ttl.py, flow_code_calc.py 등
│   ├── pipelines/               # 기존: run_status_pipeline.py
│   ├── gate1_qa_queries.sql     # 기존 Gate 1 QA 쿼리
│   └── hvdc/                    # 🆕 패치에서 통합 필요
│       ├── validate_inputs.py
│       ├── run_etl_status.sh
│       ├── run_etl_case.sh
│       ├── run_all.sh
│       ├── run_gate1_qa.sh
│       ├── gate1_qa.sql
│       └── load_csv.psql
│
├── supabase/
│   └── migrations/
│       ├── 20260101_initial_schema.sql    # 기존
│       ├── 20260124_enable_realtime.sql   # 기존
│       └── 🆕 패치에서 통합 필요:
│           ├── 20260124_enable_realtime_layers.sql
│           └── 20260124_create_dashboard_views.sql
│
├── tests/
│   ├── integration/
│   │   ├── test_rls.py          # 기존
│   │   └── 🆕 패치에서 통합 필요:
│   │       ├── test_etl.py
│   │       └── test_data_loading.py
│   ├── validation/
│   │   └── 🆕 패치에서 통합 필요:
│   │       └── test_gate1_qa.py
│   ├── utils/
│   │   └── 🆕 패치에서 통합 필요:
│   │       └── db.py
│   └── test_*.py                # 기존 테스트들
```

#### CI 실행 방식
- **현재 CI 설정** (`.github/workflows/ci.yml`):
  ```yaml
  - uses: actions/setup-python@v5
    with: { python-version: '3.13' }
  - run: |
      pip install -r requirements-dev.txt
      pytest -q
  ```
- **ETL 테스트**: `HVDC_ETL_RUN=1` 환경 변수로 조건부 실행
- **DB 통합 테스트**: `SUPABASE_DB_URL` 환경 변수 필요

---

## Q3: 누락된 내용 검증

### 문의 내용
누락된 내용 있는지 검증하라.

### 답변 요약

#### 발견된 누락 사항

1. **의존성 설치** (누락)
   - `requirements-dev.txt`에 DB 테스트용 드라이버가 없음
   - 추가 필요: `psycopg[binary]>=3.0.0` 또는 `psycopg2-binary>=2.9.0`

2. **환경 변수 설정 가이드** (누락)
   - `SUPABASE_DB_URL` 설정 방법이 문서에 없음

3. **Windows 실행 스크립트** (누락)
   - 모든 스크립트가 bash 기반, Windows PowerShell 버전 없음

4. **스크립트 실행 권한** (누락)
   - bash 스크립트 실행 권한 설정 방법이 없음

5. **CI/CD 환경 변수 설정** (누락)
   - GitHub Actions에서 DB 테스트 실행 방법이 없음

6. **에러 복구 가이드** (누락)
   - 각 단계별 실패 시 복구 방법이 없음

7. **로그 저장 위치** (누락)
   - 실행 로그 저장 방법이 없음

8. **문서 통합 계획** (누락)
   - 패치 문서들을 메인 `docs/`로 이동하는 방법이 없음

9. **테스트 마커 설정** (누락)
   - pytest 마커 설정이 `pyproject.toml`에 없음

10. **의존성 확인 스크립트** (누락)
    - 전체 의존성 확인 스크립트가 없음

---

## Q4: 기존 시스템과 충돌 확인

### 문의 내용
기존에 있는 시스템과 충돌되는가?

### 답변 요약

#### 충돌 항목

1. **Gate 1 QA 쿼리 파일** (부분 충돌)
   - **기존**: `scripts/gate1_qa_queries.sql` - SQL 쿼리만
   - **패치**: `realtime-kpi-dashboard_patch/scripts/hvdc/gate1_qa.sql` - psql 실행 가능 스크립트
   - **해결 방안**: 패치 버전을 메인으로 사용, 기존은 참조용으로 유지

2. **Realtime 마이그레이션** (중복, 충돌 가능)
   - **기존**: `supabase/migrations/20260124_enable_realtime.sql` (189줄, 상세)
   - **패치**: `realtime-kpi-dashboard_patch/supabase/migrations/20260124_enable_realtime_layers.sql` (48줄, 간결)
   - **해결 방안**: 기존 파일 유지 권장 (더 상세한 주석 포함)

#### 충돌 없는 항목
- 스크립트 경로 (`scripts/hvdc/` - 기존에 없음)
- 테스트 파일 (기존에 없음)
- View 마이그레이션 파일 (기존에 없음)

#### 최종 권장 사항
1. Gate 1 QA: 패치 버전 사용 (더 완전함)
2. Realtime 마이그레이션: 기존 파일 유지 (더 상세한 주석)
3. 나머지 파일: 모두 통합 가능 (충돌 없음)

---

## Q5: Realtime의 의미

### 문의 내용
리얼 타임의 의미는?

### 답변 요약

#### 기본 개념
**Realtime = 데이터베이스 변경사항이 발생하면 즉시 대시보드에 반영되는 기능**

#### 기존 방식 vs Realtime

**기존 방식 (Polling)**:
```
대시보드 → 5분마다 서버에 요청 → 데이터 확인 → 업데이트
```
- 최대 5분 지연
- 불필요한 요청 발생
- 서버 부하 증가

**Realtime 방식**:
```
데이터베이스 변경 → 즉시 알림 → 대시보드 자동 업데이트
```
- 지연 시간: 평균 < 1초, p95 < 3초
- 변경 시에만 업데이트
- 효율적

#### 작동 방식
1. **데이터베이스 변경 감지**: Supabase가 PostgreSQL 변경사항 감지
2. **Realtime 채널로 전송**: 변경사항을 WebSocket을 통해 클라이언트에 전송
3. **대시보드 자동 업데이트**: React 훅이 변경사항 수신, KPI 자동 재계산, UI 자동 갱신

#### 구체적 예시
**시나리오**: 선적 상태가 "In Transit"에서 "Arrived"로 변경됨

```
1. DB: shipments 테이블 UPDATE
   ↓ (즉시, < 1초)
2. Realtime: 변경 이벤트 전송
   ↓ (즉시, < 1초)
3. 대시보드: KPI 재계산
   - "Arrived" 선적 수 +1
   - "In Transit" 선적 수 -1
   ↓ (즉시, < 1초)
4. UI: 숫자 자동 업데이트
```

**전체 지연 시간**: DB 변경 → UI 업데이트까지 평균 < 3초

---

## Q6: supabase/data/raw 폴더 활용 현황

### 문의 내용
`supabase/data/raw` 여기에 있는 자료를 활용하는가?

### 답변 요약

#### 핵심 활용 파일

1. **ETL 스크립트** (데이터 변환)
   - `scripts/etl/status_etl.py` - Status SSOT 레이어 ETL
   - `scripts/etl/optionc_etl.py` - Option-C Case 레이어 ETL

2. **DDL 파일** (데이터베이스 스키마)
   - `20260124_hvdc_layers_status_case_ops.sql` - Status/Case 레이어 테이블 생성

3. **입력 데이터 파일**
   - `HVDC_all_status.json` (또는 `HVDC all status.json`)
   - `hvdc_warehouse_status.json`
   - `HVDC_STATUS.json` (Option-C용)

4. **보조 스크립트**
   - `flow_code_calculator.py` - Flow Code v3.5 계산 로직

5. **문서**
   - `README_dashboard_ready_FULL.md` - ETL 스크립트 사용법
   - `RUNBOOK_HVDC_SUPABASE_SETUP.md` - Supabase 설정 가이드

#### 활용 여부 요약

| 파일/폴더 | 활용 여부 | 용도 |
|---------|---------|------|
| `scripts/etl/status_etl.py` | ✅ 필수 | Status 레이어 ETL |
| `scripts/etl/optionc_etl.py` | ✅ 필수 | Case 레이어 ETL |
| `20260124_hvdc_layers_status_case_ops.sql` | ✅ 필수 | DB 스키마 생성 |
| `HVDC_all_status.json` | ✅ 필수 | 입력 데이터 |
| `hvdc_warehouse_status.json` | ✅ 필수 | 입력 데이터 |
| `HVDC_STATUS.json` | ✅ 필수 (Option-C) | 입력 데이터 |
| `flow_code_calculator.py` | ✅ 사용 | Flow Code 계산 |
| `README_dashboard_ready_FULL.md` | ✅ 참조 | 문서 |
| `RUNBOOK_HVDC_SUPABASE_SETUP.md` | ✅ 참조 | 문서 |

#### 결론
**`supabase/data/raw` 폴더는 데이터 로딩 파이프라인의 핵심입니다.**
- 이 폴더 없이는 데이터 적재가 불가능합니다.
- ETL 스크립트, DDL 파일, 입력 데이터, 문서가 모두 이 폴더에 있습니다.

---

## Q7: v2 패치 통합 완료

### 문의 내용
`realtime-kpi-dashboard_patch_v2`를 메인 레포에 통합 완료

### 답변 요약

#### 통합 완료 사항
- ✅ Windows PowerShell 스크립트 추가 완료 (`run_all.ps1`, `run_gate1_qa.ps1`)
- ✅ 실행 가이드 문서 통합 완료 (3개 문서: Runbook, Report Template, Development Plan)
- ✅ 테스트 파일 통합 완료 (integration, validation, utils)
- ✅ 설정 파일 업데이트 완료 (requirements-dev.txt, pyproject.toml)

#### 통합된 파일 목록
- **scripts/hvdc/**: 9개 파일 (validate_inputs.py, run_etl_status.sh, run_etl_case.sh, run_all.sh, run_gate1_qa.sh, run_all.ps1, run_gate1_qa.ps1, load_csv.psql, gate1_qa.sql)
- **tests/**: 4개 파일 (test_etl.py, test_data_loading.py, test_gate1_qa.py, db.py)
- **supabase/migrations/**: 2개 파일 (20260124_enable_realtime_layers.sql, 20260124_create_dashboard_views.sql)
- **docs/**: 3개 문서 (DATA_LOADING_RUNBOOK.md, DATA_LOADING_REPORT_TEMPLATE.md, DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md)

#### 중복 파일 처리
- `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING - 복사본.md` 삭제 완료
- `REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md`는 루트에 이미 존재하므로 유지

#### supabase/data/raw 폴더 확인 결과
- ✅ 필수 파일 모두 존재 (Status SSOT 레이어 실행 가능)
- ❌ `HVDC_STATUS.json` 누락 (Option-C Case 레이어용, Status만 사용 시 불필요)

---

## 참조 문서

- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 데이터 적재 작업 계획
- [ETL_GUIDE.md](../data-loading/ETL_GUIDE.md) - ETL 스크립트 가이드
- [REALTIME_IMPLEMENTATION.md](../guides/REALTIME_IMPLEMENTATION.md) - Realtime 구현 가이드
- [PROJECT_STRUCTURE.md](../architecture/PROJECT_STRUCTURE.md) - 프로젝트 구조 가이드
- [데이터 로딩 실행 가이드](../guides/REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md) - 실제 레포 구조 기반 실행 가이드
- [데이터 로딩 Runbook](../data-loading/DATA_LOADING_RUNBOOK.md) - Phase 1~7 상세 실행 가이드
- [데이터 로딩 리포트 템플릿](../data-loading/DATA_LOADING_REPORT_TEMPLATE.md) - 실행 결과 기록 템플릿
- [Realtime KPI 개발 계획](../guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md) - Realtime KPI 개발 계획
- [v2 패치 통합 계획](../integration/V2_PATCH_INTEGRATION_PLAN.md) - v2 패치 통합 작업 계획

---

**최종 업데이트**: 2026-01-24
