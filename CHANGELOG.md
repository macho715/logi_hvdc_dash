# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed (2026-02-09)
- logistics-dashboard: adjusted UnifiedLayout min-height sizing to allow body scrolling while keeping panel-local scroll

### Changed (2026-02-08)
- logistics-dashboard: removed top-level overflow lock so scroll remains scoped to worklist/right panel containers
- logistics-dashboard: desktop worklist panel allows vertical scrolling within the table container

### Changed (2026-02-07)
- logistics-dashboard: fixed KPI summary strip to the header and adjusted layout spacing to avoid HVDC overlap
- logistics-dashboard: simplified RightPanel to keep detailed status charts without duplicate summary values
- logistics-dashboard: HVDC worklist table now shows core status columns only, with triggers/details moved into the detail drawer and a shorter default bottom panel height

### Changed (2026-02-06)
- logistics-dashboard: heatmap radius now scales with zoom level for clearer density at different map scales
- logistics-dashboard: zoom-based visibility for heatmap/status/POI layers with compact-to-detailed POI labels
- logistics-dashboard: RightPanel 탭 UI로 Status/Occupancy/Distribution 섹션 분리 및 접근성 포커스 처리
- logistics-dashboard: promote UI text sizing to text-sm for primary labels and table content
- docs: add typography scale guidance (base font size + text hierarchy)

### Added (2026-02-05)
- logistics-dashboard: 히트맵 토글 활성 시 강도 범례(낮음~높음) 표시

### Changed (2026-02-05)
- logistics-dashboard: heatmap events now gain extra weight when inside geofence areas
- logistics-dashboard mock events/locations fallback now uses ontology/POI sources with reduced coordinate jitter for closer heatmap alignment
- logistics-dashboard POI labels emphasize MOSB yard sites, add DSV warehouse labeling, and filter MOSB-SCT office from status views
- logistics-dashboard base typography contrast increased for better readability

### Changed (2026-01-26)
- logistics-dashboard: POI 라벨 크기/패딩/색상 대비를 다크 테마에 맞게 조정하여 가독성 강화

### Added (2026-01-25)
- dash 패치 적용 계획 문서 추가 (`docs/DASH_PLAN.md`) - 맵 POI·StageCardsStrip·GlobalSearch 실제 작업 계획
- dash 패치 관련 문서 링크 추가 (README, STATUS, plan, NEXT_STEPS_PRIORITY 등)
- 맵 POI 레이어, StageCardsStrip, GlobalSearch 기능 설명 추가 (README 주요 기능 섹션)
- Supabase 하이브리드 적재 전략 문서 보완 (`docs/SUPABASE_LOADING_HYBRID_STRATEGY.md`)
- logistics-dashboard: DSV M-44 창고 POI 추가 (좌표 SSOT 정합)
- logistics-dashboard: MOSB-SCT office POI 추가 및 POI 라벨 대비 개선

### Added (2026-01-25)
- Phase 2~6 완료: DDL 적용, CSV 적재 (871 shipments + 928 events), Gate 1 QA, Realtime 활성화
- `public.shipments` 뷰 생성 (`supabase/migrations/20260125_public_shipments_view.sql`), Worklist API `public.shipments` 조회 전환
- 로컬 대시보드 테스트 완료: `apps/logistics-dashboard/.env.local` Supabase 설정 후 `/api/worklist` 871 rows·KPI 정상 반환
- `scripts/hvdc/check_dashboard_data.py`, `verify_realtime_publication.py`, `check_status_tables.py` (Phase 4 검증) 추가·확장
- `gate1_qa.py` `--json` / `-j` 출력 모드 추가
- `load_csv.py` events_status UPSERT + FK 필터 지원 (duplicate key 방지)

### Fixed
- ✅ Vercel 배포 성공: monorepo 구조에서 Next.js 감지 및 빌드 정상 동작 확인
  - 배포 URL: https://logimasterdash-rkz2dqsc8-chas-projects-08028e73.vercel.app/
  - 해결된 문제: Next.js 감지 실패, pnpm 워크스페이스 해결, monorepo 빌드 설정
- logistics-dashboard: 위치 상태 fallback이 ontology 위치 ID(LOC-*) 기준으로 생성되도록 정합성 개선
- Option-C ETL: `_extract_ids()`가 `SCT SHIP NO.`/`SCT SHIP NO`도 인식하도록 보완 (status JSON 호환)
- `useInitialDataLoad`: 초기 fetch 실패 시 API 동일 포맷의 fallback payload로 스토어 채우고 로딩 종료
- `load_csv.py`: Option-C CSV의 빈 숫자/시간 필드를 NULL로 처리하여 적재 오류 방지
- Option-C ETL: TTL export 누락된 `_ttl_escape` 추가로 `--export-ttl` 실행 복구

### Changed (2026-01-25)
- RAW DATA 파일 이동: `hvdc_excel_reporter_final_sqm_rev_3.json`, `.csv`를 `supabass_ontol/`로 이동 (FLOW_CODE 포함된 처리 완료 데이터, 8,804 rows)
- `run_all.ps1`: Option-C ETL 입력 파일 우선순위 변경 - `hvdc_excel_reporter_final_sqm_rev_3.json` 우선 인식
- `DATA_LOADING_PLAN.md`: RAW DATA 입력 파일 확인 항목 추가
- `SUPABASE_UPLOAD_DATA_LOCATIONS.md`: RAW DATA 섹션 추가 (FLOW_CODE 분포 포함)

### Added
- 핸드오프 문서 번들 추가 (`SETUP.md`, `.env.example`, `CHANGELOG.md`)
- plan.md 요약/상세 불일치 탐지 PoC 추가 (`packages/doc-intelligence`)
- Realtime KPI Dashboard 구현 (Supabase Realtime 기반 실시간 KPI 업데이트)
  - `useSupabaseRealtime` 제네릭 Realtime 훅
  - `useKpiRealtime` KPI 전용 Realtime 훅
  - `useInitialDataLoad` 초기 데이터 로드 훅
  - `useBatchUpdates` 배치 업데이트 훅
  - `ConnectionStatusBadge` 연결 상태 UI 컴포넌트
  - Realtime 마이그레이션 스크립트 (`supabase/migrations/20260124_enable_realtime.sql`)
- Gate 1 QA Python runner 추가 (`scripts/hvdc/gate1_qa.py`)
- logistics-dashboard: POI 레이어, StageCardsStrip, GlobalSearch 통합

### Changed
- docs: consolidate logi-cockpit-docs docs into root docs/* and mark originals as templates
- hvdc scripts/docs: add `--connect-timeout` support, default timeout, redacted DB URL logging, and Session pooler troubleshooting standard
- logistics-dashboard API routes: `/api/locations`, `/api/location-status`, `/api/events`를 Mock 데이터에서 Supabase 실제 데이터 조회로 전환
  - 스키마 매핑: `id→location_id`, `lng→lon`, `type→siteType`, `status→status_code` (대문자), `occupancy_rate` (0–100→0–1)
  - Fallback: DB 조회 실패 시 Mock 데이터 반환
  - Events 조인: `locations!inner`, `shipments` (PostgREST 조인)

### Deprecated

### Removed

### Fixed
- 루트 `package.json`에 `packageManager: "pnpm@10.28.0"` 필드 추가 (pnpm 워크스페이스 해결을 위해 필요)
- Vercel 배포 시 서브모듈 페치 경고를 유발하던 레거시 서브모듈 엔트리 제거
- Vercel Next.js 감지를 위해 루트 `package.json`에 `next` 의존성 추가

### Security

---

## [0.1.0] - YYYY-MM-DD

### Added
- 초기 릴리즈
