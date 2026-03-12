# 통합 테스트/검증 계획 (plan.md 대체 가능)

> 목표: 통합 과정에서 가장 위험한 3가지(키/날짜/집계 성능)를 **지속적으로 회귀 방지**합니다.

## 0) 테스트 철학

- **동작 보존이 1순위**: 이관/리팩토링 단계에서는 결과가 바뀌면 실패
- **SSOT 검증**: 동일 `case_id`에 대해 Map/Worklist/KPI 값이 다르면 실패
- **Date Canon 검증**: 이벤트 날짜/순서 위반이 늘어나면 실패

---

## 1) 레벨별 테스트 전략

### 1.1 Unit (빠르고 싸게)

- Flow Code 계산(순수 함수)
- Gate 계산(RED/AMBER/…)
- 날짜 파싱(Asia/Dubai 기준)

### 1.2 Integration (DB/RPC 포함)

- `rpc_get_worklist(filters)` 결과 스키마/행 개수
- `/api/worklist` vs RPC 결과 동등성(Phase 3)

### 1.3 E2E (사용자 플로우)

- Map marker 클릭 → Worklist 필터 적용 → Detail 열림
- Worklist row 클릭 → Map 하이라이트 → Detail 열림
- Gate 토글 → Map 색상/Worklist/KPI 동시 반영

---

## 2) 핵심 시나리오(최우선)

### Scenario A — Map → Worklist → Detail

**Given**: 지도에 위치 마커가 표시되고, Worklist가 로드됨

**When**: 사용자가 지도에서 location marker를 클릭

**Then**:
- store의 `selected_location_id`가 설정된다
- Worklist가 해당 location/site로 필터링된다
- Bottom Workbench가 열리거나, Worklist 상단에 필터 배지가 표시된다

### Scenario B — Worklist → Map highlight

**When**: 사용자가 Worklist row를 클릭

**Then**:
- `selected_case_id`가 설정된다
- 지도에서 해당 케이스가 강조 표시된다(마커 펄스/윤곽)
- DetailDrawer가 열린다

### Scenario C — Gate-first 운영

**When**: Gate를 RED로 설정

**Then**:
- KPI strip의 Red/Overdue 수치가 필터링된 값으로 변경된다
- Worklist row count가 동일한 필터를 반영한다
- Map heat/marker도 동일한 필터를 반영한다

---

## 3) 데이터 품질(QA) 게이트

### 3.1 이벤트 순서 검증(온톨로지 기반)

예시 규칙:
- `ATD <= ATA <= CUSTOMS_CLOSE <= SITE_ARRIVAL`

검증 방식:
- 위반 케이스를 `quality_violations` 테이블/리포트로 생성
- 위반율이 기준치를 초과하면 배치 실패 처리(또는 경보)

### 3.2 used_cols 변동 탐지

- 입력 JSON 컬럼이 바뀌어 매핑이 달라질 수 있음
- `*.used_cols.json`을 DB에 저장하고 전주 대비 diff를 자동 생성

---

## 4) 성능/부하 테스트(권장 최소)

### 4.1 API/RPC 성능

- Worklist (p95) ≤ 800ms
- Map locations (p95) ≤ 500ms

### 4.2 프론트 상호작용

- map pan/zoom 시 frame drop 최소화
- row selection → highlight 반영 p95 ≤ 200ms

---

## 5) 도구/자동화 제안

- Unit: Vitest/Jest(팀 표준)
- E2E: Playwright
- DB: Supabase local 또는 staging 프로젝트

CI 파이프라인(권장):
1) lint/typecheck
2) unit
3) integration (RPC contract)
4) e2e (happy path 3개)

---

## 6) 회귀 방지 기준(Definition of Done)

- [ ] `/api/worklist`(또는 RPC) 결과가 기준 샘플 N=200에서 동일
- [ ] Map ↔ Worklist ↔ Detail 동기화 e2e 3시나리오 통과
- [ ] Date Canon 위반율이 기준치 이하
- [ ] 번들/로딩 성능이 악화되지 않음(지도 관련 동적 로딩 적용)

Feasibility: **PASS** (테스트는 단계적으로 확장 가능)
