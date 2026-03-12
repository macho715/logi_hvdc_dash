# Phase 6: Realtime 활성화 플랜

> **목적**: Supabase Realtime publication을 활성화하여 대시보드에서 실시간 데이터 업데이트를 받을 수 있도록 합니다.  
> **최종 업데이트**: 2026-01-25  
> **전제 조건**: Phase 4 (CSV 적재) 완료 필요  
> **참조**: [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md), [supabase/migrations/20260124_enable_realtime_layers.sql](../supabase/migrations/20260124_enable_realtime_layers.sql)

---

## 개요

### 목표
- Status 레이어 테이블 Realtime 활성화 (`status.shipments_status`, `status.events_status`)
- Case 레이어 테이블 Realtime 활성화 (`case.events_case`, `case.flows`, `case.cases`)
- Public 테이블 Realtime 활성화 (기존 테이블이 있는 경우)

### 현재 상황
- ✅ Phase 1~5 완료: 입력 검증, DDL 적용, ETL 실행, CSV 적재, Gate 1 QA 완료
- ✅ **Phase 6 완료** (2026-01-25): Realtime 활성화 완료. `apply_ddl.py`로 `20260124_enable_realtime_layers.sql` 적용, `verify_realtime_publication.py`로 status/case 5개 테이블 publication 확인.

### 마이그레이션 파일
- `supabase/migrations/20260124_enable_realtime_layers.sql`

---

## 사전 준비

### 1. Phase 4 완료 확인
- [ ] Status 레이어 테이블에 데이터 적재 완료
- [ ] Case 레이어 테이블에 데이터 적재 완료 (Option-C 실행 시)

### 2. 마이그레이션 파일 확인
```bash
# 프로젝트 루트에서
ls -la supabase/migrations/20260124_enable_realtime_layers.sql
```

### 3. Supabase 연결 확인
- [ ] Supabase CLI 연결 확인 (`supabase link --project-ref <ref>`)
- [ ] 또는 Supabase Dashboard 접근 가능 확인

---

## 실행 방법

### 방법 1: Supabase CLI (권장)

```bash
# 프로젝트 루트에서 실행
supabase db execute -f supabase/migrations/20260124_enable_realtime_layers.sql
```

**예상 출력**:
```
Executing SQL from supabase/migrations/20260124_enable_realtime_layers.sql...
Successfully executed.
```

### 방법 2: Supabase Dashboard SQL Editor

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. `supabase/migrations/20260124_enable_realtime_layers.sql` 파일 내용 전체 복사
6. SQL Editor에 붙여넣기
7. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
8. 성공 메시지 확인

### 방법 3: Python `apply_ddl.py` (Session pooler / VPN 환경)

```bash
# SUPABASE_DB_URL = Session pooler(5432) URI 설정 후
python scripts/hvdc/apply_ddl.py supabase/migrations/20260124_enable_realtime_layers.sql
# 검증: python scripts/hvdc/verify_realtime_publication.py
```

**참고**: CLI Direct DB 연결 실패 시 [SUPABASE_CONNECTION_TROUBLESHOOTING.md](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조.

---

## 활성화 대상 테이블

### Status 레이어
- `status.shipments_status`
- `status.events_status`

### Case 레이어 (Option-C 실행 시)
- `case.events_case`
- `case.flows`
- `case.cases`

### Public 테이블 (기존 테이블이 있는 경우)
- `public.shipments`
- `public.location_statuses`
- `public.hvdc_worklist`
- `public.hvdc_kpis`

**참고**: 마이그레이션 스크립트는 테이블이 존재하는 경우에만 publication에 추가합니다 (idempotent).

---

## 검증

### 1. Publication 확인

#### Supabase CLI 사용
```bash
supabase db execute --query "
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
"
```

**예상 결과**:
```
schemaname | tablename
-----------|------------------
case       | cases
case       | events_case
case       | flows
status     | events_status
status     | shipments_status
public     | hvdc_kpis
public     | hvdc_worklist
public     | location_statuses
public     | shipments
```

#### Supabase Dashboard 사용
1. **Database** > **Replication** 메뉴 클릭
2. `supabase_realtime` publication 확인
3. 테이블 목록 확인

### 2. RLS 정책 확인

Realtime이 작동하려면 RLS 정책이 올바르게 설정되어 있어야 합니다.

```sql
-- RLS 활성화 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname IN ('status', 'case', 'public')
  AND tablename IN ('shipments_status', 'events_status', 'events_case', 'flows', 'cases', 'shipments', 'location_statuses', 'hvdc_worklist', 'hvdc_kpis')
ORDER BY schemaname, tablename;
```

**예상 결과**: `rowsecurity = true` (RLS 활성화됨)

### 3. Realtime 구독 테스트 (선택)

프론트엔드에서 Realtime 구독이 정상 작동하는지 확인:

```typescript
// 예시: Supabase 클라이언트 사용
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// shipments_status 변경 구독
const channel = supabase
  .channel('shipments-status-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'status',
    table: 'shipments_status'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()

// 구독 확인
console.log('Subscribed:', channel.state === 'SUBSCRIBED')
```

---

## 체크리스트

### 6.1 Realtime publication 활성화
- [ ] 마이그레이션 파일 실행 완료
- [ ] `supabase_realtime` publication에 테이블 추가 확인
- [ ] Status 레이어 테이블 활성화 확인
- [ ] Case 레이어 테이블 활성화 확인 (Option-C 실행 시)
- [ ] Public 테이블 활성화 확인 (기존 테이블이 있는 경우)

### 6.2 테이블 확인
- [ ] `pg_publication_tables`에서 대상 테이블 확인
- [ ] Supabase Dashboard Replication 메뉴에서 확인

### 6.3 RLS 정책 확인
- [ ] 모든 대상 테이블에 RLS 활성화 확인
- [ ] RLS 정책이 올바르게 설정되어 있는지 확인

### 6.4 Realtime 구독 테스트 (선택)
- [ ] 프론트엔드에서 Realtime 구독 연결 확인
- [ ] 데이터 변경 시 실시간 업데이트 수신 확인

---

## 문제 해결

### 테이블이 publication에 추가되지 않음
**증상**: `pg_publication_tables`에서 테이블이 보이지 않음

**원인**:
- 테이블이 존재하지 않음
- 마이그레이션 스크립트 실행 실패

**해결**:
1. 테이블 존재 확인:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'status' AND table_name = 'shipments_status';
   ```
2. 마이그레이션 스크립트 재실행
3. 수동으로 publication에 추가:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE status.shipments_status;
   ```

### RLS 정책 오류
**증상**: Realtime 구독은 연결되지만 데이터를 받지 못함

**원인**:
- RLS 정책이 너무 제한적
- 사용자 권한 부족

**해결**:
1. RLS 정책 확인:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'status' AND tablename = 'shipments_status';
   ```
2. RLS 정책 수정 (필요 시):
   ```sql
   -- 예시: 모든 사용자가 읽기 가능
   CREATE POLICY "Allow public read access" ON status.shipments_status
   FOR SELECT USING (true);
   ```

### Realtime 연결 실패
**증상**: 프론트엔드에서 Realtime 구독 연결 실패

**원인**:
- Supabase URL/Key 오류
- 네트워크 문제
- Realtime 서비스 비활성화

**해결**:
1. Supabase URL/Key 확인
2. Supabase Dashboard > Settings > API에서 Realtime 활성화 확인
3. 네트워크/방화벽 확인

### CLI 실행 시 failed to resolve · SSL reset (VPN/IPv6)
**증상**: `supabase db execute -f ...` 실행 시 `failed to resolve host` 또는 `SSL SYSCALL reset`

**원인**: PC + VPN 환경에서 Direct DB(`db.<ref>.supabase.co`) IPv6 불안정/차단. [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 참조.

**해결**:
1. VPN ON 환경이면 **Session pooler(5432)** 기준으로 재시도
2. VPN OFF로 확인
3. **Supabase Dashboard SQL Editor**에서 `20260124_enable_realtime_layers.sql` 실행 (네트워크 우회)

**보안**: DB URL 전체를 문서/로그에 남기지 말고 `user:***@host` 형태로 마스킹.

---

## 다음 단계

Phase 6 완료 후:

1. **대시보드 데이터 반영 확인**
   - 로컬 및 Vercel 프로덕션에서 데이터 확인
   - KPI 계산 정상 작동 확인
   - Realtime 업데이트 정상 작동 확인

2. **성능 테스트**
   - Realtime 구독 성능 확인 (p95 < 3s)
   - 대용량 업데이트 시 병합/중복 제거 확인

---

## 참조 문서

- [REALTIME_IMPLEMENTATION.md](./REALTIME_IMPLEMENTATION.md) - Realtime 구현 가이드
- [PHASE4_CSV_LOADING_PLAN.md](../data-loading/PHASE4_CSV_LOADING_PLAN.md) - Phase 4 CSV 적재
- [PHASE5_GATE1_QA_PLAN.md](../data-loading/PHASE5_GATE1_QA_PLAN.md) - Phase 5 Gate 1 QA
- [supabase/migrations/20260124_enable_realtime_layers.sql](../supabase/migrations/20260124_enable_realtime_layers.sql) - Realtime 활성화 마이그레이션
- [scripts/hvdc/verify_realtime_publication.py](../scripts/hvdc/verify_realtime_publication.py) - Realtime publication 검증 스크립트
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - Phase 2~6·대시보드 반영 진행
- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime) - 공식 문서

---

**최종 업데이트**: 2026-01-25
