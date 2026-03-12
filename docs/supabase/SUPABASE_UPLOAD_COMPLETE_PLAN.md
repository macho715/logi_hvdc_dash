# supabase/data/raw 데이터 Supabase 업로드 완전 플랜

> **목적**: `supabase/data/raw` 폴더의 파일과 자료(HVDC JSON, ETL 스크립트, DDL, CSV)를 이용해서 Supabase에 업로드하는 전체 파이프라인(Phase 2~6) 통합 플랜  
> **최종 업데이트**: 2026-01-25  
> **참조**: [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md), [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md)

---

## 전체 개요

### 목표
`supabase/data/raw` 폴더의 파일과 자료를 활용하여 Supabase에 데이터를 업로드하고, 대시보드에서 실시간으로 데이터를 확인할 수 있도록 합니다.

### 데이터 흐름도

```
supabase/data/raw/
  ├── HVDC_all_status.json ──┐
  ├── hvdc_warehouse_status.json ──┼─→ ETL (Untitled-4) ──→ CSV ──→ Supabase
  └── 20260124_hvdc_layers_status_case_ops.sql ────────────┘
```

### 완료된 작업
- ✅ Phase 1: 입력 검증 완료
- ✅ Phase 3: ETL 실행 완료, CSV 생성됨
  - `hvdc_output/supabase/shipments_status.csv` (874 rows)
  - `hvdc_output/supabase/events_status.csv`

### 대기 중인 작업
- ⏳ Phase 2: DDL 적용
- ⏳ Phase 4: CSV 적재
- ⏳ Phase 5: Gate 1 QA
- ⏳ Phase 6: Realtime 활성화

---

## Phase별 상세 안내

### Phase 2: DDL 적용

**목적**: Supabase에 Status/Case/Ops 스키마 및 테이블 생성

**실행 방법**:
- **권장**: `SUPABASE_DB_URL` (Session pooler :5432 권장, `PGCONNECT_TIMEOUT=10` 또는 `--connect-timeout 10`) 설정 후 `run_phase2_ddl.ps1` (apply_ddl → verify 자동). Access Token 불필요.
- **대안**: Supabase CLI (`supabase link` → `db execute -f ...`) 또는 `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` 후 `run_phase2_ddl.ps1`.
- **대안**: Supabase Dashboard SQL Editor (최종 비상로).
- **VPN/failed to resolve/SSL reset** → [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432). **Redaction**: DB URL/비밀번호 로그·문서 기입 금지.

**생성되는 스키마/테이블**:
- `status.shipments_status`, `status.events_status`
- `case.locations`, `case.shipments_case`, `case.cases`, `case.flows`, `case.events_case`
- `ops.etl_runs`

**상세**: [PHASE2_DDL_APPLICATION_PLAN.md](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md)

---

### Phase 4: CSV 적재

**목적**: Phase 3에서 생성된 CSV 파일들을 Supabase 테이블에 적재

**실행 방법**:
- **권장**: Supabase Dashboard Table Editor Import
- **대안**: `SUPABASE_DB_URL` 또는 `--db-url` (Session 5432 권장, `--connect-timeout 10` 권장) 설정 후 `python scripts/hvdc/load_csv.py [--db-url URL] [--truncate] --status-only`. VPN/Pooler → [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432).
- **고급**: Supabase CLI + SQL

**적재 순서** (Case 레이어 시):
1. `case.locations`
2. `case.shipments_case`
3. `case.cases`
4. `case.flows`
5. `case.events_case`

**상세**: [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md)

---

### Phase 5: Gate 1 QA

**목적**: 데이터 무결성 검증 (Orphan, Duplicate, Flow Code 규칙)

**실행 방법**:
- **권장**: `SUPABASE_DB_URL` (Session 5432 권장) 설정 후 `run_gate1_qa.ps1` 또는 `.sh`. **대안**: Supabase Dashboard SQL Editor에서 `gate1_qa.sql` 실행. VPN/Pooler → [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432).

**검증 항목**:
- Orphan 체크: `events_status` 중 `shipments_status`에 없는 `hvdc_code` = 0
- Duplicate 체크: `events_case` 중 natural key 중복 = 0
- Flow Code 규칙: `flow_code=5` → `requires_review=true` 강제

**상세**: [PHASE5_GATE1_QA_PLAN.md](../data-loading/PHASE5_GATE1_QA_PLAN.md)

---

### Phase 6: Realtime 활성화

**목적**: Supabase Realtime publication 활성화

**실행 방법**:
- **권장**: Supabase CLI `db execute -f supabase/migrations/20260124_enable_realtime_layers.sql` (link 필요). **대안**: Supabase Dashboard SQL Editor (최종 비상로). VPN/failed to resolve → [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (Session pooler 5432) 또는 Dashboard.

**활성화 대상 테이블**:
- `status.shipments_status`, `status.events_status`
- `case.events_case`, `case.flows`, `case.cases`
- `public.shipments`, `public.location_statuses`, `public.hvdc_kpis` (기존)

**상세**: [PHASE6_REALTIME_ACTIVATION_PLAN.md](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md)

---

## 전체 체크리스트

### Phase 2: DDL 적용
- [ ] Supabase CLI 설치 및 연결
- [ ] DDL 파일 존재 확인
- [ ] DDL 실행 완료
- [ ] 스키마 생성 확인 (`status`, `case`, `ops`)
- [ ] 테이블 생성 확인
- [ ] 뷰 생성 확인
- [ ] 인덱스 생성 확인

### Phase 4: CSV 적재
- [ ] Phase 2 완료 확인
- [ ] CSV 파일 존재 확인
- [ ] Status 레이어 적재 완료
- [ ] Case 레이어 적재 완료 (Option-C 실행 시)
- [ ] 행 수 검증 완료
- [ ] Orphan 체크 통과

### Phase 5: Gate 1 QA
- [ ] Phase 4 완료 확인
- [ ] Orphan 체크 실행 및 통과
- [ ] Duplicate 체크 실행 및 통과
- [ ] Flow Code 규칙 검증 및 통과
- [ ] Coverage 검증 완료 (선택)

### Phase 6: Realtime 활성화
- [ ] Phase 4 완료 확인
- [ ] 마이그레이션 파일 실행 완료
- [ ] Publication에 테이블 추가 확인
- [ ] RLS 정책 확인
- [ ] Realtime 구독 테스트 완료 (선택)

---

## 문제 해결

### 각 Phase별 문제 해결 가이드

#### Phase 2 문제
- CLI 미설치: [PHASE2_DDL_APPLICATION_PLAN.md](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md#문제-해결) 참조
- 연결 오류: [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조

#### Phase 4 문제
- CSV 인코딩 오류: [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md#문제-해결) 참조
- FK 제약 위반: 적재 순서 확인
- Python 스크립트 연결 오류: Dashboard Import 사용

#### Phase 5 문제
- Orphan 이벤트 발견: ETL 스크립트 재실행 검토
- 중복 행 발견: 중복 제거 SQL 실행
- Flow Code 규칙 위반: Flow Code 수정 또는 ETL 재실행

#### Phase 6 문제
- 테이블이 publication에 추가되지 않음: 수동 추가 또는 마이그레이션 재실행
- RLS 정책 오류: RLS 정책 확인 및 수정
- Realtime 연결 실패: Supabase 설정 확인

---

## 예상 일정

| Phase | 작업 | 예상 시간 | 누적 시간 |
|-------|------|----------|----------|
| Phase 2 | DDL 적용 | 0.5일 | 0.5일 |
| Phase 4 | CSV 적재 | 1일 | 1.5일 |
| Phase 5 | Gate 1 QA | 0.5일 | 2일 |
| Phase 6 | Realtime 활성화 | 0.5일 | 2.5일 |

**총 예상 시간**: 2.5일

---

## 참조 문서 링크

### Phase별 상세 플랜
- [Phase 2: DDL 적용 플랜](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md)
- [Phase 4: CSV 적재 플랜](../data-loading/PHASE4_CSV_LOADING_PLAN.md)
- [Phase 5: Gate 1 QA 플랜](../data-loading/PHASE5_GATE1_QA_PLAN.md)
- [Phase 6: Realtime 활성화 플랜](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md)

### 관련 문서
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 전체 데이터 로딩 계획
- [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md) - 실행 Runbook
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - 진행 상황
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 해결
- [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md) - Realtime 구현 가이드

### 소스 파일
- [supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql](../supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql) - DDL 파일
- [supabase/migrations/20260124_enable_realtime_layers.sql](../supabase/migrations/20260124_enable_realtime_layers.sql) - Realtime 활성화 마이그레이션
- [scripts/hvdc/load_csv.py](../scripts/hvdc/load_csv.py) - CSV 적재 Python 스크립트
- [scripts/hvdc/gate1_qa.sql](../scripts/hvdc/gate1_qa.sql) - Gate 1 QA SQL 스크립트

---

## 빠른 시작 가이드

### 1. Phase 2 실행
```bash
# Supabase CLI 설치 및 연결
supabase login
supabase link --project-ref <your-project-ref>

# DDL 적용
supabase db execute -f supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql
```

### 2. Phase 4 실행
- Supabase Dashboard > Table Editor > Import data 사용
- 또는 `python scripts/hvdc/load_csv.py --status-only`

### 3. Phase 5 실행
```bash
# Windows
powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_gate1_qa.ps1

# Linux/macOS
bash scripts/hvdc/run_gate1_qa.sh
```

### 4. Phase 6 실행
```bash
supabase db execute -f supabase/migrations/20260124_enable_realtime_layers.sql
```

---

**최종 업데이트**: 2026-01-25 — Phase 2~6 Session 5432·connect_timeout·redaction·SUPABASE_CONNECTION_TROUBLESHOOTING 동기화
