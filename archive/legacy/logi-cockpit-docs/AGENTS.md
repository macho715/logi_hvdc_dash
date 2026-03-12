# AGENTS.md — 통합 레포 코딩/리뷰 가이드

> 이 레포는 **Map-centric Ops Cockpit**(HVDC + MOSB Logistics) 통합을 목표로 합니다.
> 아래 규칙은 사람/에이전트(Claude/Cursor/Copilot/Codex 등) 모두에게 동일하게 적용합니다.

---

## 0) 최우선 원칙 (Priority Order)

1) **Async Waterfall 제거** (체감 성능 최우선)
2) **클라이언트 번들 사이즈 감소** (Map/차트 무거움)
3) 서버 성능(RSC/SSR) 최적화
4) 클라이언트 데이터 페칭/중복 요청 제거
5) 불필요한 re-render 제거
6) 렌더링 성능
7) 고급 패턴/마이크로 최적화(위 1–6 이후)

---

## 1) 구조 원칙

### 1.1 Monorepo

- `apps/*`: 배포 단위(Next.js 앱)
- `packages/*`: 재사용 모듈(컴포넌트/도메인)
- `scripts/*`: ETL/온톨로지 파이프라인
- `configs/*`: 컬럼 매핑 SSOT
- `supabase/*`: migrations/RPC/뷰

### 1.2 SSOT & Date Canon

- 데이터 SSOT는 **Supabase 1곳**
- 날짜/진행 상태 계산은 **events(event_type + event_date_dubai)** 만 기준
- UI에서 “임의로 날짜/게이트를 재계산”하지 않는다(불일치 발생)

---

## 2) 프론트엔드 규칙

### 2.1 Map 번들/성능

- MapLibre/deck.gl은 무겁기 때문에:
  - **동적 import**로 분리
  - 필요할 때만 초기화(뷰 진입 시)
  - 초기 뷰는 skeleton/placeholder로 대체

### 2.2 데이터 페칭

- 서버에서 가능하면 **병렬로 fetch** (예: `Promise.all`)
- 동일 데이터는 store/캐시 레이어에서 dedupe
- API/RPC contract를 문서화하고, 클라이언트에서 파싱/정규화 비용을 최소화

### 2.3 상태 관리

- 선택/필터는 **단일 store**
  - `selected_case_id`, `selected_location_id`, `filters`, `ui`
- Map/Worklist/Detail은 store만 읽고/쓰기(직접 서로 state를 건드리지 않음)

### 2.4 접근성

- Worklist는 키보드로 조작 가능해야 함
- Drawer/Sheet는 focus trap + ESC 닫기 + 트리거 복귀
- Gate 색상은 색만으로 의미 전달 금지(라벨/아이콘 병행)

---

## 3) 백엔드/DB 규칙

- service role key는 절대 클라이언트로 노출 금지
- 집계는 View/RPC로 단일화(특히 Worklist/KPI)
- 스키마 변경 시:
  1) `supabase/migrations` 추가
  2) `docs/ARCHITECTURE.md` 업데이트
  3) 회귀 테스트 추가(샘플 결과)

---

## 4) PR 운영 규칙

- PR은 “이동/리팩토링/기능”을 섞지 않는다.
  - PR1: 이동만
  - PR2: 경로/alias 정리
  - PR3: 기능 변경
- 모든 PR은 아래를 포함:
  - 변경 요약
  - 리스크
  - 검증 방법(로컬/테스트)

---

## 5) 에이전트 출력 포맷(권장)

### 5.1 Audit 출력

| Priority | Category | Location | Problem | Fix | Validation |
|---|---|---|---|---|---|

### 5.2 Plan 출력(JSON)

```json
{
  "summary": "…",
  "work_items": [
    {
      "priority": "CRITICAL",
      "category": "Eliminating Waterfalls",
      "location": ["path/to/file.tsx:12-55"],
      "change": "…",
      "risk": "…",
      "validation": ["unit", "e2e"]
    }
  ]
}
```

---

## 6) Done Definition

- Map ↔ Worklist ↔ Detail이 `case_id`로 일관되게 동기화
- Worklist/KPI 결과가 SSOT(View/RPC)로 단일화
- Date Canon 위반이 감지/알림 가능
- 성능: map 번들 동적 로딩, 주요 상호작용 p95 200ms 목표

