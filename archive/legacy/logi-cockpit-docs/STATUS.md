# STATUS — 통합 상태(SSOT)

> 이 문서는 프로젝트 통합의 **현재 상태/리스크/다음 액션**을 한 곳에서 추적하기 위한 **SSOT**입니다.

## 1) 현재 통합 상태 요약

### 소스 프로젝트(현행)

1) **HVDC Dashboard** (`HVDC_DASH/hvdc-dashboard`)
- Next.js App Router 기반, Supabase 연동, `/api/worklist`로 KPI/Worklist 집계
- 주요 UI: `KpiStrip`, `WorklistTable`, `DetailDrawer`, `SavedViewsBar`

2) **MOSB Logistics Dashboard** (`v0-logistics-dashboard-build-main`)
- MapLibre + deck.gl 지도 엔진
- 주요 UI: `MapView`(Geofence/Heatmap/ETA wedge/Locations), `RightPanel`(상태/점유율 차트)
- 실시간 훅: `useLiveFeed`

3) **logiontology_scaffold_2026-01-23**
- JSON → TTL 변환, Flow Code v3.5 계산, used_cols 감사 로그
- `configs/columns.hvdc_status.json` 기반 컬럼 SSOT

4) **Ontology Core Doc**
- Flow Code v3.5 룰, 통합 문서(Consolidated), SHACL 규칙

---

## 2) 목표 아키텍처(종착점)

### 목표 구조(AGENTS.md/통합 설계 기준)

```text
/apps
  /logistics-dashboard   # Map-centric cockpit (HVDC 패널 포함)
  /hvdc-dashboard        # Legacy/독립 운영(회귀/비교용)
/packages
  /ui-components
  /hvdc-workbench        # (권장) KPI/Worklist/DetailDrawer 모듈
  /shared                # types/time/ontology constants
/scripts                 # ETL + RDF
/configs                 # SSOT column spec + namespaces
/supabase
  /migrations
/docs
```

### 핵심 목표

- **UI:** Map(좌) + Ops Panel(우) + Workbench/Detail(하)
- **SSOT:** Supabase 단일 DB + 공용 View/RPC
- **Date Canon:** 이벤트/온톨로지 기반 날짜 일원화
- **Realtime:** 단계적으로 Realtime 고도화

---

## 3) 갭 분석(What’s missing)

### A. 레이아웃/UX 통합
- [ ] 3패널 레이아웃 구현(지도 좌측, 우측 패널, 하단 패널)
- [ ] Map 선택 ↔ Worklist 선택 ↔ Detail Drawer 동기화(`selected_case_id`)
- [ ] 모바일: Bottom sheet / Right drawer 제스처(드래그/스냅)

### B. 상태관리/데이터계층
- [ ] 공용 Zustand store 설계(선택/필터/윈도우)
- [ ] 공용 데이터 fetch layer(Supabase client, RPC, 캐시)
- [ ] 시간대(Asia/Dubai) 일원화

### C. Supabase 스키마 통합
- [ ] `events` 중심 스키마 정의 + worklist 계산 View/RPC
- [ ] Map용 지오데이터 적재(locations, geofences, occupancy)
- [ ] RLS 정책/권한 분리(anon read, service role write)

### D. RDF 파이프라인/검증
- [ ] JSON/Excel 적재 → Events 정규화 → TTL 산출 자동화
- [ ] SHACL 게이트를 CI/배치에 통합
- [ ] used_cols 감사 로그를 DB에 저장(변경 추적)

---

## 4) 리스크 레지스터(상위 10)

| ID | Risk | Symptom | Mitigation | Owner | Status |
|---:|------|---------|------------|-------|--------|
| R1 | `case_id` 불일치 | Map 선택과 Worklist row가 연결 안 됨 | `case_id` UUID를 공용 키로 고정 + `hvdc_code` 업무키 보조 | Data | OPEN |
| R2 | Date Canon 혼재 | KPI/ETA가 화면마다 다름 | `events` 기반으로만 계산하도록 규정 + 뷰/RPC 단일화 | Data | OPEN |
| R3 | RLS/키 노출 | 서비스 롤 키 노출 위험 | server-only 사용 강제 + env 분리 + lint check | DevOps | OPEN |
| R4 | Map 번들 비대 | 초기 로딩 느림 | 동적 import + map 초기화 지연 + 코드 스플릿 | FE | OPEN |
| R5 | 실시간 폭주 | Realtime 채널 과부하 | 초기에는 polling/DB Changes, Scale 단계에서 Broadcast 트리거 적용 | FE/BE | OPEN |
| R6 | 집계 성능 | worklist p95 상승 | MV/RPC + 인덱스 + 캐시 전략 | Data | OPEN |
| R7 | v0 생성 코드 품질 | 유지보수 비용 | packages화 + lint/format + AGENTS 규칙 적용 | FE | OPEN |
| R8 | 온톨로지 버전 관리 | 스키마/룰 drift | schema/patches 분리 + 릴리즈 노트 | Data | OPEN |
| R9 | 데이터 적재 실패 | 배치 누락 | 재시도/알림 + idempotent upsert | DataOps | OPEN |
| R10| UI 동기화 버그 | 선택/필터 꼬임 | 단일 store + 이벤트 버스 규정 + e2e 테스트 | FE | OPEN |

---

## 5) 다음 2주 실행 계획(권장)

### Week 1 — Monorepo + 레이아웃 뼈대
- [ ] Monorepo 스캐폴딩(`/apps`, `/packages`, `/scripts`, `/configs`, `/supabase`)
- [ ] 3패널 레이아웃(더미 데이터) 구현
- [ ] `selected_case_id`/`selected_location_id` 공용 store 설계

### Week 2 — HVDC 패널 삽입 + 연결
- [ ] `KpiStrip`/`WorklistTable`/`DetailDrawer`를 `packages/hvdc-workbench`로 추출
- [ ] logistics-dashboard에 hvdc-workbench 삽입(우/하)
- [ ] Map ↔ Worklist ↔ Detail 연결(하이라이트/필터)

---

## 6) Done Definition(수용 기준)

- **Layout:** Map/Right/Bottom 3패널이 데스크탑/모바일에서 깨지지 않고 동작
- **Sync:** (Map 클릭)→Worklist 필터 적용 + Detail 열림, (Worklist 클릭)→Map 하이라이트 + Detail 열림
- **SSOT:** 동일 `case_id`에 대해 KPI/Worklist/Map 표출 값이 불일치하지 않음
- **Perf:** 초기 로딩에서 Map 관련 번들은 동적 로딩으로 분리되어 Lighthouse/TTI가 악화되지 않음

---

## 7) 변경 로그

- 2026-01-23: 통합 상태 문서 초안 생성
