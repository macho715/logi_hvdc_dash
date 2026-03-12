---
name: Phase 2 DDL 적용 (Supabase CLI)
overview: Supabase CLI로 20260124_hvdc_layers_status_case_ops.sql DDL을 적용하고, status/case/ops 스키마·테이블·뷰 생성 및 검증까지 수행한다.
todos:
  - id: db-url-option
    content: SUPABASE_DB_URL 설정 시 apply_ddl 경로 (Access Token 불필요, Session 5432 권장)
    status: pending
  - id: install-cli
    content: Supabase CLI 설치 및 supabase --version 확인 (Windows/macOS/Linux)
    status: pending
  - id: login-link
    content: supabase login, supabase link --project-ref <ref> 로 프로젝트 연결 (CLI 경로 시)
    status: pending
  - id: run-ddl
    content: run_phase2_ddl.ps1 (SUPABASE_DB_URL) 또는 supabase db execute -f DDL 실행, connect_timeout 권장
    status: pending
  - id: verify-schemas
    content: verify_phase2_ddl.py 또는 CLI db execute --query로 스키마·테이블·뷰 검증
    status: pending
  - id: update-progress
    content: DASHBOARD_DATA_INTEGRATION_PROGRESS.md Phase 2 완료 처리 및 다음 단계 링크 추가
    status: pending
isProject: false
---

# Phase 2 DDL 적용 (Supabase CLI)

## 목적

Phase 2 DDL 적용을 **Supabase CLI** 기준으로 실행한다. `supabass_ontol/20260124_hvdc_layers_status_case_ops.sql`으로 `status` / `case` / `ops` 스키마, 테이블, `public.v_*` 뷰를 생성한다.

## 상세 절차·검증·트러블슈팅

→ [docs/PHASE2_DDL_APPLICATION_PLAN.md](../docs/PHASE2_DDL_APPLICATION_PLAN.md) 참조.

## 실행 순서

**Option A (권장)** — `SUPABASE_DB_URL` (Session pooler :5432 권장, `?connect_timeout=10`) 설정 후 `run_phase2_ddl.ps1` (apply_ddl → verify 자동). Access Token 불필요.

**Option B** — `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` → `supabase link` → `db execute -f ...` → 검증.

**Option C** — Supabase Dashboard SQL Editor에서 DDL 실행 (최종 비상로).

1. **설치** — Supabase CLI (Option B 시) 또는 psycopg (Option A 시)
2. **로그인/링크** — Option B 시 `supabase login`, `supabase link --project-ref <ref>`
3. **DDL 실행** — Option A: `run_phase2_ddl.ps1` / Option B: `supabase db execute -f supabass_ontol/20260124_hvdc_layers_status_case_ops.sql`
4. **검증** — `verify_phase2_ddl.py` 또는 `supabase db execute --query "SELECT ..."` 또는 Dashboard
5. **progress 문서 업데이트** — [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) Phase 2 완료 처리 및 다음 단계 링크 추가

**VPN/failed to resolve/SSL reset** 시 [SUPABASE_CONNECTION_TROUBLESHOOTING](../docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md) **방법 2 (Session 5432)** 참조. **Redaction**: DB URL/비밀번호 로그·문서 기입 금지.
