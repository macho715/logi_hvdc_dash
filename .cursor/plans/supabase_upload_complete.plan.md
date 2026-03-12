---
name: supabass_ontol 데이터 Supabase 업로드 완전 플랜
overview: supabass_ontol 폴더의 파일과 자료를 이용해서 Supabase에 업로드하는 전체 파이프라인(Phase 2~6) 실행 플랜
todos:
  - id: phase2-ddl
    content: Phase 2: DDL 적용 - SUPABASE_DB_URL(Session 5432 권장)+run_phase2_ddl.ps1 또는 CLI db execute, connect_timeout·redaction 준수
    status: pending
  - id: phase2-verify
    content: Phase 2 검증: status/case/ops 스키마 및 핵심 테이블·뷰 생성 확인
    status: pending
  - id: phase4-csv-status
    content: Phase 4: Status 레이어 CSV 적재 - Table Editor Import 또는 load_csv (SUPABASE_DB_URL/--db-url, Session 5432 권장)
    status: pending
  - id: phase4-csv-case
    content: Phase 4: Case 레이어 CSV 적재 (선택) - locations → shipments_case → cases → flows → events_case 순서로 적재
    status: pending
  - id: phase4-verify
    content: Phase 4 검증: 행 수 확인, Orphan 체크 통과 확인
    status: pending
  - id: phase5-qa
    content: Phase 5: Gate 1 QA - run_gate1_qa (SUPABASE_DB_URL, Session 5432 권장) 또는 Dashboard SQL Editor
    status: pending
  - id: phase5-verify
    content: Phase 5 검증: 모든 QA 체크 통과 확인 (orphan_count=0, duplicate_rows=0, flow_code_violations=0)
    status: pending
  - id: phase6-realtime
    content: Phase 6: Realtime 활성화 - CLI db execute 또는 Dashboard SQL Editor (Session 5432/VPN 참조)
    status: pending
  - id: phase6-verify
    content: Phase 6 검증: pg_publication_tables에서 대상 테이블 확인, RLS 정책 확인
    status: pending
  - id: dashboard-verify
    content: 대시보드 데이터 반영 확인 - 로컬 및 Vercel 프로덕션에서 데이터 확인, KPI 계산 정상 작동 확인
    status: pending
isProject: false
---

# supabass_ontol 데이터 Supabase 업로드 완전 플랜

## 목적

`supabass_ontol` 폴더의 파일과 자료(HVDC JSON, ETL 스크립트, DDL, CSV)를 활용하여 Supabase에 데이터를 업로드하고, 대시보드에서 실시간으로 데이터를 확인할 수 있도록 합니다.

## 현재 상황

- ✅ **완료된 작업**: Phase 1 (입력 검증), Phase 3 (ETL 실행, CSV 생성)
  - 생성된 CSV: `hvdc_output/supabase/shipments_status.csv` (874 rows), `hvdc_output/supabase/events_status.csv`
- ⏳ **대기 중인 작업**: Phase 2 (DDL 적용), Phase 4 (CSV 적재), Phase 5 (Gate 1 QA), Phase 6 (Realtime 활성화)

## 실행 순서

### Phase 2: DDL 적용
1. **권장**: `SUPABASE_DB_URL` (Session pooler :5432, `?connect_timeout=10`) 설정 후 `run_phase2_ddl.ps1` (apply_ddl → verify 자동). **대안**: CLI `link` + `db execute -f ...` 또는 Dashboard SQL Editor.
2. 검증: 스키마/테이블/뷰 생성 확인

**상세**: [PHASE2_DDL_APPLICATION_PLAN.md](../docs/PHASE2_DDL_APPLICATION_PLAN.md). **VPN/failed to resolve** → [SUPABASE_CONNECTION_TROUBLESHOOTING](../docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md) 방법 2 (Session 5432).

### Phase 4: CSV 적재
1. **권장**: Dashboard Table Editor Import. **대안**: `SUPABASE_DB_URL` 또는 `--db-url` 설정 후 `load_csv.py` (Session 5432 권장).
2. Case 레이어 (선택): `locations` → `shipments_case` → `cases` → `flows` → `events_case`
3. 검증: 행 수 확인, Orphan 체크

**상세**: [PHASE4_CSV_LOADING_PLAN.md](../docs/PHASE4_CSV_LOADING_PLAN.md). VPN/Pooler 동일.

### Phase 5: Gate 1 QA
1. **권장**: `SUPABASE_DB_URL` 설정 후 `run_gate1_qa.ps1` 또는 `.sh`. **대안**: Dashboard SQL Editor에서 `gate1_qa.sql` 실행.
2. 검증: Orphan/Duplicate/Flow Code 규칙 통과 확인

**상세**: [PHASE5_GATE1_QA_PLAN.md](../docs/PHASE5_GATE1_QA_PLAN.md). VPN/Pooler 참조.

### Phase 6: Realtime 활성화
1. **권장**: CLI `db execute -f supabase/migrations/20260124_enable_realtime_layers.sql`. **대안**: Dashboard SQL Editor (최종 비상로).
2. 검증: Publication에 테이블 추가 확인, RLS 정책 확인

**상세**: [PHASE6_REALTIME_ACTIVATION_PLAN.md](../docs/PHASE6_REALTIME_ACTIVATION_PLAN.md). VPN/Pooler 참조.

## 참조 문서

- [통합 플랜 문서](../docs/SUPABASE_UPLOAD_COMPLETE_PLAN.md) - Phase 2~6 통합 플랜
- [진행 상황 문서](../docs/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - 진행 상황 SSOT
- [데이터 로딩 계획](../docs/DATA_LOADING_PLAN.md) - 전체 데이터 로딩 계획
- [SUPABASE_CONNECTION_TROUBLESHOOTING](../docs/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - VPN/IPv6/Pooler, 방법 1~5, redaction·connect_timeout

## 주의사항

- 모든 플랜 문서에 DB 비밀번호, Access Token 등 **비밀 정보 기술 금지**. **Redaction**: 로그·문서에 DB URL 전체 출력 금지, `user@host:port/db` 형태만 허용.
- Supabase 프로젝트 ref는 예시로 두고, 실제 실행 시 사용자 환경에 맞게 변경
- **connect_timeout**(예: 10초) 권장(무한 대기 방지). URI에 `?connect_timeout=10` 또는 `PGCONNECT_TIMEOUT=10`.
- **supabass_ontol 폴더 경로**는 프로젝트 루트 기준 상대 경로로 명시
- **CSV 파일 경로**는 Phase 3 ETL 실행 결과물 기준
