# 데이터 연동 요약

> **목적**: HVDC/물류 데이터가 JSON → ETL → Supabase → 대시보드 API로 이어지는 **데이터 연동** 흐름과 실행 방법을 한곳에 정리합니다.  
> **최종 업데이트**: 2026-02-07

---

## 1. 데이터 연동이란

| 단계 | 설명 | 산출물 |
|------|------|--------|
| **Source** | HVDC JSON (`HVDC all status.json`, `hvdc_warehouse_status.json`) | - |
| **Phase 3 ETL** | Untitled-4 (Status) / Untitled-3 (Option-C) | `hvdc_output/supabase/*.csv`, Option-C CSV |
| **Phase 2 DDL** | 스키마·테이블·뷰 생성 | `status.*`, `case.*`, `public.v_*`, `public.shipments` |
| **Phase 4** | CSV 적재 | `status.shipments_status`, `status.events_status` 등 |
| **Phase 5** | Gate 1 QA (Orphan/Duplicate/Flow) | 검증 통과 |
| **Phase 6** | Realtime publication | 5개 테이블 Realtime 활성화 |
| **대시보드** | Worklist / 맵 API | `/api/worklist`, `/api/locations`, `/api/location-status`, `/api/events` |

**정리**: JSON → ETL(CSV) → DDL → 적재 → QA → Realtime → **대시보드 API**가 Supabase `public.shipments` 등과 연동됩니다.

---

## 2. 현재 상태 (2026-02-07)

- **Phase 2~6**: ✅ 완료 (DDL, CSV 적재 871+928 rows, Gate 1 QA, Realtime)
- **대시보드 반영**: ✅ `public.shipments` 뷰, Worklist API 연동
- **맵 API**: ✅ `/api/locations`, `/api/location-status`, `/api/events` Supabase 조회 (Fallback: **Ontology**)
- **로컬 검증**: ✅ `pnpm dev` → `http://localhost:3001` → `/api/worklist` 871 rows·KPI 확인 가능
- **Locations Mock → Ontology 대체** (2026-01-26): `map/HVDC_Location_Master_Ontology_with_Coordinates.json` 기반 8건을 폴백으로 사용. SSOT: `lib/data/ontology-locations.ts`
- **UI/UX 개선 완료** (2026-02-05~2026-02-07): 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 헤더 고정, 워크리스트 간소화

상세: [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md)

---

## 3. 데이터 연동 확인 방법

### 3.1 로컬 실행

```bash
pnpm install
pnpm dev
# 또는 logistics만: cd apps/logistics-dashboard && pnpm dev
```

- **접속**: http://localhost:3001  
- **Worklist/KPI**: `GET /api/worklist` → `rows` 871, `kpis.redCount` 등  
- **맵**: `/api/locations`, `/api/location-status`, `/api/events` (테이블 비어 있으면 **Ontology** 폴백: 8개 HVDC 위치)

### 3.2 환경 변수 (로컬)

`apps/logistics-dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

설정 후 `pnpm dev` → Worklist API가 `public.shipments`에서 데이터 조회.  
미설정 시 API 오류 시 Fallback(빈 rows, 0 KPI) 반환.

### 3.3 파이프라인 재실행 (Phase 2~6)

`SUPABASE_DB_URL` (Session pooler 5432 권장) 필요.

| 단계 | 명령 |
|------|------|
| Phase 1 | `python scripts/hvdc/validate_inputs.py --repo-root . --source-dir supabase/data/raw` |
| Phase 2 | `./scripts/hvdc/run_phase2_ddl.ps1` 또는 `apply_ddl.py` + `verify_phase2_ddl.py` |
| Phase 3 | `run_etl_status.sh` / `run_etl_case.sh` (CSV 생성) |
| Phase 4 | `load_csv.py --status-only` (또는 `load_csv.psql`) |
| Phase 5 | `run_gate1_qa.ps1` / `gate1_qa.py` |
| Phase 6 | `apply_ddl.py supabase/migrations/20260124_enable_realtime_layers.sql` |
| **맵 locations 시딩** | `apply_ddl.py supabase/migrations/20260126_public_locations_seed_ontology.sql` (`SUPABASE_DB_URL` 필요) |

**맵 locations 시딩**: `public.locations` 없으면 생성 후 Ontology 8건 INSERT. 적용 시 `/api/locations`가 Mock/Ontology 폴백 대신 DB 데이터 사용.

상세 절차: [DATA_LOADING_RUNBOOK.md](../data-loading/DATA_LOADING_RUNBOOK.md), [PHASE2/4/5/6 계획](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) 등.

---

## 4. 참조 문서

| 문서 | 용도 |
|------|------|
| [DASHBOARD_DATA_INTEGRATION_PROGRESS](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) | Phase 2~6·대시보드 반영 진행 상황 SSOT |
| [DATA_LOADING_RUNBOOK](../data-loading/DATA_LOADING_RUNBOOK.md) | Phase 1~7 실행 Runbook |
| [DATA_LOADING_PLAN](../data-loading/DATA_LOADING_PLAN.md) | 데이터 적재 단계별 계획 |
| [PHASE2_DDL_APPLICATION_PLAN](../data-loading/PHASE2_DDL_APPLICATION_PLAN.md) | DDL 적용 |
| [PHASE4_CSV_LOADING_PLAN](../data-loading/PHASE4_CSV_LOADING_PLAN.md) | CSV 적재 |
| [PHASE5_GATE1_QA_PLAN](../data-loading/PHASE5_GATE1_QA_PLAN.md) | Gate 1 QA |
| [PHASE6_REALTIME_ACTIVATION_PLAN](../data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md) | Realtime 활성화 |
| [SUPABASE_CONNECTION_TROUBLESHOOTING](../supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) | DB 연결 문제 해결 |
| [README](../README.md) | 설치·실행·env 요약 |

---

**요약**: 데이터 연동은 **ETL → Supabase 적재 → 대시보드 API** 흐름이며, Phase 2~6와 Worklist/맵 API 연동이 완료된 상태입니다. 재실행·검증은 위 Runbook과 Phase 계획을 따르면 됩니다.
