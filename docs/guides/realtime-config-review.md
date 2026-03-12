# Supabase Realtime Configuration Review

**Last Updated**: 2026-01-24  
**Status**: ✅ Realtime KPI Dashboard 구현 완료

## Current State

### Realtime Publication Status

**Initial Schema (`supabase/migrations/20260101_initial_schema.sql`)**:
- Realtime publication statements are **commented out** (lines 527-530)
- Tables that would need Realtime:
  - `public.location_statuses`
  - `public.events`
  - `public.hvdc_worklist`
  - `public.hvdc_kpis`
  - `public.shipments` (not explicitly listed but may be needed)

**Realtime Migration (`supabase/migrations/20260124_enable_realtime.sql`)** ✅ 완료:
- ✅ Realtime publication enabled for:
  - `public.shipments` (KPI Realtime 구독)
  - `public.location_statuses`
  - `public.hvdc_kpis`
  - `status.shipments_status` (if exists)
  - `status.events_status` (if exists)
  - `"case".events_case` (if exists, Option-C layer)
  - `"case".flows` (if exists)
  - `"case".cases` (if exists)
- ✅ Idempotent migration (safe to run multiple times)
- ✅ Schema-qualified table name support

**Option-C Layer (`supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql`)**:
- Creates `status.*` and `"case".*` schemas
- **No Realtime publication statements** in this migration (handled by `20260124_enable_realtime.sql`)
- **No RLS policies** defined for these schemas (needs verification)

### RLS Policies Status

#### Public Schema Tables (from `20260101_initial_schema.sql`)

**RLS Enabled**: Yes, all tables have RLS enabled

**Policies**:
- `locations`: `FOR SELECT TO authenticated USING (true)`
- `location_statuses`: `FOR SELECT TO authenticated USING (true)`
- `events`: `FOR SELECT TO authenticated USING (true)`
- `shipments`: `FOR SELECT TO authenticated USING (true)`
- `hvdc_worklist`: `FOR SELECT TO authenticated USING (true)`
- `hvdc_kpis`: 
  - `FOR SELECT TO authenticated USING (true)`
  - `FOR SELECT TO anon USING (true)` (anonymous read allowed for KPIs)

**Status**: ✅ RLS policies exist for public schema tables

#### Status Schema Tables (`status.*`)

**RLS Status**: ⚠️ **Not verified** - migration file does not show RLS policies

**Required Policies** (for Realtime subscriptions):
- `status.shipments_status`: Need `FOR SELECT TO authenticated USING (true)`
- `status.events_status`: Need `FOR SELECT TO authenticated USING (true)`

#### Case Schema Tables (`"case".*`)

**RLS Status**: ⚠️ **Not verified** - migration file does not show RLS policies

**Required Policies** (for Realtime subscriptions):
- `"case".cases`: Need `FOR SELECT TO authenticated USING (true)`
- `"case".flows`: Need `FOR SELECT TO authenticated USING (true)`
- `"case".events_case`: Need `FOR SELECT TO authenticated USING (true)` (critical for Option C KPI strategy)
- `"case".locations`: Need `FOR SELECT TO authenticated USING (true)`

## Implementation Status

### ✅ Completed (2026-01-24)

1. **Realtime Migration Script**
   - ✅ `supabase/migrations/20260124_enable_realtime.sql` 생성
   - ✅ `public.shipments` 테이블 Realtime 활성화
   - ✅ Schema-qualified table name support

2. **Realtime Hooks Implementation**
   - ✅ `useSupabaseRealtime` 제네릭 훅 구현
   - ✅ `useKpiRealtime` KPI 전용 훅 구현
   - ✅ `useInitialDataLoad` 초기 데이터 로드 훅 구현
   - ✅ `useBatchUpdates` 배치 업데이트 훅 구현

3. **UI Components**
   - ✅ `ConnectionStatusBadge` 연결 상태 UI 컴포넌트 구현
   - ✅ `KpiStrip` 컴포넌트에 Realtime 통합
   - ✅ `UnifiedLayout`에 초기 데이터 로드 및 Realtime 구독 통합

4. **Performance Optimizations**
   - ✅ 배치 업데이트 (300-500ms desktop, 1s mobile)
   - ✅ React.useTransition으로 비차단 업데이트
   - ✅ 성능 모니터링 (commit_timestamp 추적)

5. **Fallback Mechanism**
   - ✅ 폴백 폴링 메커니즘 구현 (Realtime 실패 시 60s 간격 폴링)

### ⏭️ Pending

1. **RLS Policies for Status/Case Schemas**
   - ⏭️ Status schema 테이블 RLS 정책 추가
   - ⏭️ Case schema 테이블 RLS 정책 추가

2. **Performance Testing**
   - ⏭️ k6 부하 테스트 실행
   - ⏭️ p95 < 3s 검증
   - ⏭️ 동시 구독자 처리 능력 검증

3. **Option C Support**
   - ⏭️ `/api/kpi/case-segments` 엔드포인트 구현
   - ⏭️ `/api/kpi/voyage-segments` 엔드포인트 구현
   - ⏭️ `"case".events_case` 테이블 구독

## Required Actions

### 1. Verify RLS on Status/Case Schemas

Run this query in Supabase SQL Editor to check RLS status:

```sql
-- Check if RLS is enabled on status.* tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname IN ('status', 'case')
ORDER BY schemaname, tablename;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname IN ('status', 'case')
ORDER BY schemaname, tablename;
```

### 2. Add RLS Policies if Missing

If RLS is not enabled or policies are missing, add them:

```sql
-- Enable RLS on status schema tables
ALTER TABLE status.shipments_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE status.events_status ENABLE ROW LEVEL SECURITY;

-- Enable RLS on case schema tables
ALTER TABLE "case".cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".events_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE "case".shipments_case ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (read access for Realtime subscriptions)
CREATE POLICY "Enable read access for authenticated users" 
  ON status.shipments_status FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON status.events_status FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON "case".cases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON "case".flows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON "case".events_case FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON "case".locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" 
  ON "case".shipments_case FOR SELECT TO authenticated USING (true);
```

### 3. Verify Realtime Publication

Check current Realtime publication status:

```sql
-- List tables in supabase_realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;
```

## Recommendations

1. **Before enabling Realtime**: Ensure RLS policies exist for all tables that will be subscribed to ✅ Completed for `public.shipments`
2. **Schema-qualified tables**: Supabase Realtime supports schema-qualified table names (e.g., `"case".events_case`) ✅ Implemented
3. **Test subscriptions**: After enabling Realtime, test that authenticated users can subscribe to these tables ⏭️ Pending
4. **Security**: Never use `service_role` key in client code; only use `anon` or `authenticated` keys ✅ Enforced

## Next Steps

1. ✅ Verify RLS status on status.* and case.* schemas (run queries above)
2. ⏭️ Add RLS policies if missing (use SQL above)
3. ✅ Create Realtime migration ✅ Completed (2026-01-24)
4. ⏭️ Test Realtime subscriptions with authenticated user
5. ⏭️ Performance testing (k6, p95 < 3s 검증)

## References

- Supabase RLS Guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime Postgres Changes: https://supabase.com/docs/guides/realtime/postgres-changes
- Project migration: `supabase/data/raw/20260124_hvdc_layers_status_case_ops.sql`
- Realtime Implementation: `./REALTIME_IMPLEMENTATION.md`
