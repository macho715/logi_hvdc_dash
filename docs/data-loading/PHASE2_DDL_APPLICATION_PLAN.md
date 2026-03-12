# Phase 2: DDL 적용 플랜

> **목적**: `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql` DDL을 Supabase에 적용하여 Status/Case/Ops 스키마 및 테이블을 생성합니다.  
> **최종 업데이트**: 2026-02-07  
> **참조**: [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md), [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md)

---

## 개요

### 목표
- Status 레이어 스키마 및 테이블 생성 (`status.shipments_status`, `status.events_status`)
- Case 레이어 스키마 및 테이블 생성 (`case.locations`, `case.shipments_case`, `case.cases`, `case.flows`, `case.events_case`)
- Ops 레이어 스키마 생성 (향후 확장용)
- Public 뷰 생성 (`public.v_shipments_master`, `public.v_case_segments` 등)

### 현재 상황
- ✅ Phase 1 완료: 입력 검증 완료
- ✅ Phase 3 완료: ETL 실행 완료, CSV 생성됨
- ✅ **Phase 2 완료** (2026-01-25): DDL 적용 완료. `apply_ddl.py` + Session pooler(5432) 사용, `verify_phase2_ddl.py` 검증 통과.

### DDL 파일 경로
- `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql`

---

## 사전 준비

### 1. Supabase CLI 설치

#### Windows
**⚠️ winget 미지원**: Supabase CLI는 **winget 레포에 등록되어 있지 않음**. `winget install Supabase.CLI` 등은 동작하지 않음. 아래 방법 사용.

```powershell
# Scoop 사용 (권장)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 또는 Chocolatey
choco install supabase

# 또는 npx (Node.js 20+ 필요, 전역 설치 없이 실행)
npx supabase --version

# 또는 직접 다운로드
# https://github.com/supabase/cli/releases
```

#### macOS
```bash
brew install supabase/tap/supabase
```

#### Linux
```bash
# 직접 다운로드
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
sudo mv supabase /usr/local/bin/
```

#### 설치 확인
```bash
supabase --version
```

### 2. Supabase 프로젝트 연결

#### Access Token 발급
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Settings > Access Tokens
3. **Generate new token** 클릭
4. 토큰 복사 (한 번만 표시됨)

#### 로그인
```bash
supabase login
# Access Token 입력
```

#### 프로젝트 연결
```bash
# 프로젝트 ref 확인: Dashboard > Settings > General > Reference ID
supabase link --project-ref <your-project-ref>
# 예: supabase link --project-ref <PROJECT-REF>
```

### 3. DDL 파일 확인
```bash
# 프로젝트 루트에서
ls -la supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql
```

---

## 단계별 실행

### Step 1: DDL 적용 (권장 방법)

#### 방법 1: Supabase CLI (권장)

```bash
# 프로젝트 루트에서 실행
supabase db execute -f supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql
```

**예상 출력**:
```
Executing SQL from supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql...
Successfully executed.
```

#### 방법 2: Supabase Dashboard SQL Editor (대안)

CLI 사용이 불가능한 경우:

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql` 파일 내용 전체 복사
6. SQL Editor에 붙여넣기
7. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
8. 성공 메시지 확인

#### 방법 3: 마이그레이션 파일로 변환 (선택)

```bash
# supabase/migrations/ 디렉토리에 복사
cp supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql supabase/migrations/20260124_hvdc_layers_status_case_ops.sql

# 마이그레이션 적용
supabase db push
```

#### 방법 4: Python `apply_ddl.py` (Session pooler / VPN 환경)

```bash
# SUPABASE_DB_URL = Session pooler(5432) URI 설정 후
python scripts/hvdc/apply_ddl.py supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql
# 검증: python scripts/hvdc/verify_phase2_ddl.py
```

**참고**: CLI Direct DB 연결 실패 시(VPN/IPv6) [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조.

---

## 검증

### 1. 스키마 생성 확인

#### Supabase CLI 사용
```bash
supabase db execute --query "
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('status', 'case', 'ops')
ORDER BY schema_name;
"
```

**예상 결과**:
```
schema_name
-----------
case
ops
status
```

#### Supabase Dashboard 사용
1. **Database** > **Schemas** 메뉴 클릭
2. `status`, `case`, `ops` 스키마 존재 확인

### 2. 테이블 생성 확인

#### Status 레이어
```bash
supabase db execute --query "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'status' 
ORDER BY table_name;
"
```

**예상 결과**:
```
table_name
----------
events_status
shipments_status
```

#### Case 레이어
```bash
supabase db execute --query "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'case' 
ORDER BY table_name;
"
```

**예상 결과**:
```
table_name
----------
cases
events_case
events_case_debug
flows
locations
shipments_case
```

#### Ops 레이어
```bash
supabase db execute --query "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'ops' 
ORDER BY table_name;
"
```

**예상 결과**:
```
table_name
----------
etl_runs
```

### 3. 뷰 생성 확인

```bash
supabase db execute --query "
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'v_%'
ORDER BY table_name;
"
```

**예상 결과**:
```
table_name
----------
v_case_event_segments
v_case_segments
v_cases_kpi
v_flow_distribution
v_kpi_site_flow_daily
v_shipments_master
v_shipments_timeline
v_wh_inventory_current
```

### 4. 인덱스 생성 확인

```bash
supabase db execute --query "
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname IN ('status', 'case')
ORDER BY schemaname, tablename, indexname;
"
```

---

## 체크리스트

### 2.1 스키마 마이그레이션
- [ ] `status` 스키마 생성 확인
- [ ] `case` 스키마 생성 확인
- [ ] `ops` 스키마 생성 확인
- [ ] `pgcrypto` 확장 설치 확인

### 2.2 테이블 생성
- [ ] `status.shipments_status` 테이블 생성 확인
- [ ] `status.events_status` 테이블 생성 확인
- [ ] `case.locations` 테이블 생성 확인
- [ ] `case.shipments_case` 테이블 생성 확인
- [ ] `case.cases` 테이블 생성 확인
- [ ] `case.flows` 테이블 생성 확인
- [ ] `case.events_case` 테이블 생성 확인
- [ ] `case.events_case_debug` 테이블 생성 확인
- [ ] `ops.etl_runs` 테이블 생성 확인

### 2.3 뷰 및 인덱스
- [ ] `public.v_shipments_master` 뷰 생성 확인
- [ ] `public.v_shipments_timeline` 뷰 생성 확인
- [ ] `public.v_case_segments` 뷰 생성 확인
- [ ] `public.v_cases_kpi`, `v_flow_distribution`, `v_wh_inventory_current`, `v_case_event_segments`, `v_kpi_site_flow_daily` 뷰 생성 확인
- [ ] 모든 인덱스 생성 확인

### 2.4 RLS 정책 (해당 시)
- [ ] Status 레이어 RLS 정책 확인
- [ ] Case 레이어 RLS 정책 확인
- [ ] 테스트 사용자로 접근 권한 확인

---

## 문제 해결

### winget으로 설치 시도 시
**증상**: `winget install --id Supabase.CLI -e --source winget` → "입력 조건과 일치하는 패키지를 찾을 수 없습니다", `winget search Supabase.CLI` → 동일.

**원인**: Supabase CLI는 **winget 레포에 등록되어 있지 않음**. ([GitHub 이슈 #1611](https://github.com/supabase/cli/issues/1611) 요청 존재, 미구현.)

**해결**: winget 대신 **Scoop**(권장), **Chocolatey**, **npx** (`npx supabase`, Node.js 20+), 또는 [GitHub Releases](https://github.com/supabase/cli/releases)에서 바이너리 다운로드 후 PATH 추가.

### CLI 미설치
**증상**: `supabase: command not found`

**해결**:
- 위의 "사전 준비" 섹션 참조하여 CLI 설치 (winget 제외)
- 또는 Supabase Dashboard SQL Editor 사용 (방법 2)

### 로그인/링크 실패
**증상**: `Error: invalid access token` 또는 `Error: project not found`

**해결**:
1. Access Token 재발급 (Dashboard > Settings > Access Tokens)
2. 프로젝트 ref 확인 (Dashboard > Settings > General > Reference ID)
3. `supabase logout` 후 `supabase login` 재시도

### `relation already exists` 오류
**증상**: 테이블/스키마가 이미 존재함

**해결**:
- DDL 파일은 `CREATE TABLE IF NOT EXISTS` 사용하므로 일반적으로 문제 없음
- 특정 테이블만 재생성하려면:
  ```sql
  DROP TABLE IF EXISTS status.shipments_status CASCADE;
  -- 그 후 DDL 재실행
  ```

### 권한 오류
**증상**: `permission denied for schema` 또는 `must be owner of schema`

**해결**:
- Supabase Dashboard에서 프로젝트 소유자 권한 확인
- 또는 Supabase Support에 문의

### 네트워크/연결 오류 (failed to resolve · SSL reset)
**증상**: `failed to resolve host 'db.<ref>.supabase.co'`, `SSL SYSCALL error: Connection reset by peer`, `connection timeout`

**원인**: PC + VPN 환경에서는 **VPN의 DNS/IPv6 처리**에서 자주 발생. Direct DB(`db.<ref>.supabase.co:5432`)는 **IPv6 기본**이며, IPv6 불안정/차단(VPN 포함) 시 실패 가능.

**해결 우선순위**:
1. **VPN OFF** → DNS·TCP 확인 후 Direct 연결 재시도
2. **VPN ON 유지 시** → **Supavisor Pooler**(Session 5432) 사용으로 IPv4 우회. Dashboard > Settings > Database > Connection string > **Session** pooler URI를 `SUPABASE_DB_URL`에 설정 후 `apply_ddl.py` / `run_phase2_ddl.ps1` 실행

**상세**: [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) (VPN / IPv6 / Pooler) 참조. 대안으로 Supabase Dashboard SQL Editor 사용 (네트워크 문제 우회).

---

## 다음 단계

Phase 2 완료 후:

1. **Phase 4: CSV 적재**
   - `hvdc_output/supabase/shipments_status.csv` → `status.shipments_status`
   - `hvdc_output/supabase/events_status.csv` → `status.events_status`
   - 참조: [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md)

2. **Phase 5: Gate 1 QA**
   - Orphan/Duplicate/Flow Code 규칙 검증
   - 참조: [PHASE5_GATE1_QA_PLAN.md](../data-loading/PHASE5_GATE1_QA_PLAN.md)

3. **Phase 6: Realtime 활성화**
   - Realtime publication 활성화
   - 참조: [PHASE6_REALTIME_ACTIVATION_PLAN.md](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md)

---

## 참조 문서

- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 전체 데이터 로딩 계획
- [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md) - 실행 Runbook
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 해결
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - 진행 상황
- [supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql](../supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql) - DDL 파일

---

**최종 업데이트**: 2026-01-25
