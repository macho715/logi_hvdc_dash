# Phase 5: Gate 1 QA 플랜

> **목적**: Phase 4 완료 후 데이터 무결성 검증 (Orphan, Duplicate, Flow Code 규칙)을 수행합니다.  
> **최종 업데이트**: 2026-01-25  
> **전제 조건**: Phase 4 (CSV 적재) 완료 필요  
> **참조**: [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md), [RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md)

---

## 개요

### 목표
- Orphan 체크: 참조 무결성 검증
- Duplicate 체크: 중복 데이터 검증
- Flow Code 규칙 검증: Flow Code v3.5 규칙 준수 확인

### 현재 상황
- ✅ Phase 1~4 완료: 입력 검증, DDL 적용, ETL 실행, CSV 적재 완료
- ✅ **Phase 5 완료** (2026-01-25): Gate 1 QA 검증 완료. `gate1_qa.py` (또는 `--json`) 실행, Orphan/Duplicate/Flow Code 규칙 모두 통과.

### 검증 항목

1. **Orphan 체크**
   - `status.events_status` 중 `shipments_status`에 없는 `hvdc_code` = 0
   - `case.events_case` 중 `cases`에 없는 (hvdc_code, case_no) = 0

2. **Duplicate 체크**
   - `case.events_case` 중 natural key 중복 = 0

3. **Flow Code 규칙**
   - `flow_code=5` → `requires_review=true` 강제
   - AGI/DAS 규칙: `final_location IN ('AGI', 'DAS')` → `flow_code >= 3`

---

## 사전 준비

### 1. Phase 4 완료 확인
- [ ] Status 레이어 CSV 적재 완료
- [ ] Case 레이어 CSV 적재 완료 (Option-C 실행 시)
- [ ] 각 테이블 행 수 검증 완료

### 2. QA 스크립트 확인
```bash
# SQL 스크립트 확인
ls -la scripts/hvdc/gate1_qa.sql

# PowerShell 스크립트 확인 (Windows)
ls -la scripts/hvdc/run_gate1_qa.ps1

# Shell 스크립트 확인 (Linux/macOS)
ls -la scripts/hvdc/run_gate1_qa.sh

# Python 스크립트 확인 (cross-platform)
ls -la scripts/hvdc/gate1_qa.py
```

---

## 실행 방법

### 방법 1: 스크립트 실행 (권장)

#### Windows (PowerShell)
```powershell
# 프로젝트 루트에서 실행
powershell -ExecutionPolicy Bypass -File scripts/hvdc/run_gate1_qa.ps1
```

#### Linux/macOS (Bash)
```bash
# 프로젝트 루트에서 실행
bash scripts/hvdc/run_gate1_qa.sh
```

#### Python (cross-platform)
```bash
# 프로젝트 루트에서 실행
python scripts/hvdc/gate1_qa.py
# 또는: python scripts/hvdc/gate1_qa.py --db-url "postgresql://..." --connect-timeout 10
# JSON 출력 (CI 연동): python scripts/hvdc/gate1_qa.py --json  # 또는 -j
```
**참고**: Python 스크립트는 `OK/FAIL` 형식으로 출력하며, `--json` / `-j` 시 JSON 출력.

**예상 출력**:
```
[Gate1 QA] Starting Gate 1 QA validation...
[Gate1 QA] Checking orphan events_status...
[Gate1 QA] Orphan count: 0 ✓
[Gate1 QA] Checking duplicate events_case...
[Gate1 QA] Duplicate count: 0 ✓
[Gate1 QA] Checking Flow Code rules...
[Gate1 QA] Flow Code violations: 0 ✓
[Gate1 QA] All checks passed! ✓
```

### 방법 2: Supabase Dashboard SQL Editor

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. `scripts/hvdc/gate1_qa.sql` 파일 내용 복사
6. SQL Editor에 붙여넣기
7. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
8. 결과 확인

### 방법 3: Supabase CLI

```bash
# 프로젝트 루트에서 실행
supabase db execute -f scripts/hvdc/gate1_qa.sql
```

---

## 검증 항목 상세

### 5.1 Orphan 체크

#### Status 레이어
```sql
-- events_status 중 shipments_status에 없는 hvdc_code 확인
SELECT COUNT(*)::bigint AS orphan_status_events
FROM status.events_status es
LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
WHERE ss.hvdc_code IS NULL;
```

**통과 조건**: `orphan_status_events = 0`

**실패 시 조치**:
- Orphan 이벤트 삭제 또는 `shipments_status`에 해당 `hvdc_code` 추가
- ETL 스크립트 재실행 검토

#### Case 레이어 (Option-C 실행 시)
```sql
-- events_case 중 cases에 없는 (hvdc_code, case_no) 확인
SELECT COUNT(*)::bigint AS orphan_case_events
FROM "case".events_case e
LEFT JOIN "case".cases c ON c.hvdc_code = e.hvdc_code AND c.case_no = e.case_no
WHERE c.hvdc_code IS NULL;
```

**통과 조건**: `orphan_case_events = 0`

**실패 시 조치**:
- Orphan 이벤트 삭제 또는 `cases`에 해당 케이스 추가
- ETL 스크립트 재실행 검토

---

### 5.2 Duplicate 체크

#### events_case 중복 확인
```sql
-- events_case 중복 확인 (natural key 기준)
SELECT
  hvdc_code,
  case_no,
  event_type,
  event_time_iso,
  location_id,
  source_field,
  source_system,
  COUNT(*)::bigint AS cnt
FROM "case".events_case
GROUP BY hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```

**통과 조건**: 중복 행 = 0 또는 명시된 예외만 존재

**실패 시 조치**:
- 중복 행 확인 및 원인 분석
- ETL 스크립트에서 중복 생성 원인 확인
- 필요 시 중복 제거 (DISTINCT 또는 ROW_NUMBER 사용)

---

### 5.3 Flow Code 규칙 검증

#### Flow Code 5는 requires_review=true 필수
```sql
-- Flow Code 5인데 requires_review가 true가 아닌 경우
SELECT COUNT(*)::bigint AS bad_flow5
FROM "case".flows
WHERE flow_code = 5 AND requires_review IS NOT TRUE;
```

**통과 조건**: `bad_flow5 = 0`

**실패 시 조치**:
```sql
-- 자동 수정
UPDATE "case".flows
SET requires_review = TRUE
WHERE flow_code = 5 AND requires_review IS NOT TRUE;
```

#### AGI/DAS 규칙: final_location이 AGI/DAS인 경우 flow_code >= 3
```sql
-- AGI/DAS 규칙 위반 확인
SELECT COUNT(*)::bigint AS agi_das_violation
FROM "case".cases c
JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3;
```

**통과 조건**: `agi_das_violation = 0`

**실패 시 조치**:
- AGI/DAS 위치의 케이스에 대해 Flow Code 재계산 필요
- `flow_code_calculator.py` 스크립트 재실행 검토

---

### 5.4 Coverage 검증 (선택)

#### Status 레이어 Coverage
```sql
-- Status 레이어 Coverage 확인
SELECT
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.shipments_status) AS shipments_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM status.events_status) AS events_shipments_count;
```

**예상 결과**: `events_shipments_count <= shipments_count` (이벤트가 있는 shipment 수)

#### Case 레이어 Coverage
```sql
-- Case 레이어 Coverage 확인
SELECT
  (SELECT COUNT(*) FROM "case".cases) AS cases_count,
  (SELECT COUNT(DISTINCT hvdc_code) FROM "case".cases) AS unique_hvdc_codes;
```

---

## 통과 조건

Gate 1 QA는 다음 조건을 모두 만족해야 통과합니다:

- [ ] `orphan_status_events = 0`
- [ ] `orphan_case_events = 0` (Case 레이어 적재 시)
- [ ] `duplicate_rows = 0` (또는 사전 합의된 예외만)
- [ ] `bad_flow5 = 0`
- [ ] `agi_das_violation = 0`

---

## 체크리스트

### 5.1 Orphan 체크
- [ ] Status 레이어 Orphan 체크 실행
- [ ] Orphan 이벤트 수 = 0 확인
- [ ] Case 레이어 Orphan 체크 실행 (Option-C 실행 시)
- [ ] Orphan 케이스 이벤트 수 = 0 확인

### 5.2 Duplicate 체크
- [ ] events_case 중복 확인 실행
- [ ] 중복 행 수 = 0 확인 (또는 예외 확인)

### 5.3 Flow Code 검증
- [ ] Flow Code 5 → requires_review 규칙 검증
- [ ] AGI/DAS 규칙 검증
- [ ] 위반 사항 수정 (필요 시)

### 5.4 Coverage 검증 (선택)
- [ ] Status 레이어 Coverage 확인
- [ ] Case 레이어 Coverage 확인

---

## 문제 해결

### Orphan 이벤트 발견
**증상**: `orphan_status_events > 0` 또는 `orphan_case_events > 0`

**원인**:
- ETL 스크립트에서 이벤트는 생성했지만 shipment/case는 누락
- CSV 적재 순서 문제

**해결**:
1. Orphan 이벤트 확인:
   ```sql
   SELECT * FROM status.events_status es
   LEFT JOIN status.shipments_status ss ON ss.hvdc_code = es.hvdc_code
   WHERE ss.hvdc_code IS NULL;
   ```
2. 원본 JSON에서 해당 `hvdc_code` 확인
3. ETL 스크립트 재실행 또는 수동으로 `shipments_status` 추가

### 중복 행 발견
**증상**: `duplicate_rows > 0`

**원인**:
- ETL 스크립트에서 동일 이벤트를 여러 번 생성
- CSV 적재 시 중복 업로드

**해결**:
1. 중복 행 확인:
   ```sql
   SELECT * FROM "case".events_case
   WHERE (hvdc_code, case_no, event_type, event_time_iso, location_id) IN (
     SELECT hvdc_code, case_no, event_type, event_time_iso, location_id
     FROM "case".events_case
     GROUP BY hvdc_code, case_no, event_type, event_time_iso, location_id
     HAVING COUNT(*) > 1
   );
   ```
2. 중복 제거:
   ```sql
   DELETE FROM "case".events_case
   WHERE ctid NOT IN (
     SELECT MIN(ctid)
     FROM "case".events_case
     GROUP BY hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system
   );
   ```

### Flow Code 규칙 위반
**증상**: `bad_flow5 > 0` 또는 `agi_das_violation > 0`

**원인**:
- Flow Code 계산 로직 오류
- ETL 스크립트 버전 불일치

**해결**:
1. Flow Code 5 수정:
   ```sql
   UPDATE "case".flows
   SET requires_review = TRUE
   WHERE flow_code = 5 AND requires_review IS NOT TRUE;
   ```
2. AGI/DAS 규칙 위반 케이스 확인:
   ```sql
   SELECT c.hvdc_code, c.case_no, c.final_location, f.flow_code
   FROM "case".cases c
   JOIN "case".flows f ON f.hvdc_code = c.hvdc_code AND f.case_no = c.case_no
   WHERE c.final_location IN ('AGI', 'DAS') AND f.flow_code < 3;
   ```
3. ETL 스크립트 재실행 또는 Flow Code 수동 수정

### run_gate1_qa 실행 시 failed to resolve · SSL reset (VPN/IPv6)
**증상**: `run_gate1_qa.ps1` / `run_gate1_qa.sh` 실행 시 psql `failed to resolve host` 또는 `SSL SYSCALL reset`

**원인**: `run_gate1_qa`는 `SUPABASE_DB_URL` + psql 사용. PC + VPN 환경에서 Direct DB IPv6 불안정/차단. [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조.

**해결**:
1. **Session pooler(5432)** URI를 `SUPABASE_DB_URL`로 사용 (VPN/IPv6 표준)
2. `PGCONNECT_TIMEOUT=10` 설정 (무한 대기 방지)
3. VPN OFF로 확인
4. **Supabase Dashboard SQL Editor**에서 `gate1_qa.sql` 실행 (네트워크 우회)

**보안**: DB URL 전체를 문서/로그에 남기지 말고 `user:***@host` 형태로 마스킹.

---

## 다음 단계

Phase 5 완료 후:

1. **Phase 6: Realtime 활성화**
   - Realtime publication 활성화
   - 참조: [PHASE6_REALTIME_ACTIVATION_PLAN.md](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md)

2. **대시보드 데이터 반영 확인**
   - 로컬 및 Vercel 프로덕션에서 데이터 확인
   - KPI 계산 정상 작동 확인

---

## 참조 문서

- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) - 전체 데이터 로딩 계획
- [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - Phase 4 CSV 적재
- [RUNBOOK_HVDC_SUPABASE_SETUP.md](../supabase/data/raw/RUNBOOK_HVDC_SUPABASE_SETUP.md) - Supabase 설정 Runbook
- [scripts/hvdc/gate1_qa.sql](../scripts/hvdc/gate1_qa.sql) - Gate 1 QA SQL 스크립트
- [scripts/hvdc/gate1_qa.py](../scripts/hvdc/gate1_qa.py) - Gate 1 QA Python 스크립트 (`--json` 지원)
- [scripts/hvdc/run_gate1_qa.ps1](../scripts/hvdc/run_gate1_qa.ps1) - PowerShell 실행 스크립트
- [scripts/hvdc/run_gate1_qa.sh](../scripts/hvdc/run_gate1_qa.sh) - Bash 실행 스크립트

---

**최종 업데이트**: 2026-01-25
