# Logi Cockpit Monorepo (HVDC + MOSB Logistics) — 통합 운영 콕핏

> **목표:** `Map-centric 운영 콕핏` — 좌측은 MOSB 지도(Geofence/Heatmap/ETA Wedge), 우측·하단은 HVDC KPI + Worklist + Detail Drawer를 패널로 삽입해 **한 화면에서 의사결정 → 조치까지** 끝내는 통합 앱.

이 문서는 3개의 독립 프로젝트(1) HVDC Dashboard, (2) MOSB Logistics Dashboard, (3) Ontology/RDF 파이프라인을 **Monorepo + Supabase SSOT**로 통합하기 위한 운영 문서 세트입니다.

- 통합 상태 점검: [`STATUS.md`](./STATUS.md)
- 로드맵: [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- 시스템 아키텍처: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- UI 레이아웃(3패널): [`docs/LAYOUT.md`](./docs/LAYOUT.md)
- 시스템/프론트 컴포넌트 문서: [`docs/COMPONENTS.md`](./docs/COMPONENTS.md)
- 모노레포 마이그레이션 가이드: [`docs/MIGRATION_GUIDE.md`](./docs/MIGRATION_GUIDE.md)
- 통합 테스트/검증 계획: [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md)

---

## 0) TL;DR

- **SSOT:** 모든 운영 데이터는 **Supabase(Postgres)** 1곳에 적재
- **Date Canon:** `event_type(온톨로지 개념) + event_date`를 기준으로 KPI/Flow/ETA 산출
- **UI:** `Map(좌)` + `Ops Panel(우)` + `Case Detail / Workbench(하)`
- **Realtime:** Supabase Realtime 채널을 통해 UI 갱신(초기에는 DB Changes 구독, 스케일 단계에서 Broadcast+Trigger)

---

## 1) Monorepo 목표 디렉토리 구조(권장)

```text
/
  apps/
    logistics-dashboard/      # v0-logistics-dashboard-build-main (이관)
    hvdc-dashboard/           # HVDC_DASH/hvdc-dashboard (이관)

  packages/
    ui-components/            # 공용 UI primitives/shadcn 래핑
    hvdc-workbench/           # (권장) Worklist/KPI/DetailDrawer 모듈화
    shared/                   # (권장) types, constants, time utils, zod schemas

  scripts/                    # logiontology_scaffold_2026-01-23 (이관)
  configs/                    # columns.hvdc_status.json (SSOT), namespaces 등

  supabase/
    migrations/               # 스키마/함수/뷰
    seed/                     # 시드/샘플

  docs/                       # 본 문서
  AGENTS.md                   # 엔지니어링/코딩 규칙(에이전트 포함)
  STATUS.md                   # 통합 상태(단일 진실원천)
```

> **원칙:**
> - `apps/*`는 배포 단위, `packages/*`는 재사용 모듈
> - `/scripts`는 ETL/온톨로지 파이프라인(배치), `/supabase`는 DB 마이그레이션/함수

---

## 2) 로컬 실행(예시)

> 실제 명령은 패키지 매니저/워크스페이스 선택에 따라 달라집니다. `pnpm` 기준 예시입니다.

```bash
pnpm -w install

# 각각 실행(예시)
pnpm --filter logistics-dashboard dev
pnpm --filter hvdc-dashboard dev
```

### 공통 환경변수(.env.local)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버/API/배치 전용)
- `NEXT_PUBLIC_MAP_STYLE` (MapLibre basemap)

> **보안:** 서비스 롤 키는 절대 클라이언트 번들로 노출 금지. Next.js API Route/서버 액션에서만 사용.

---

## 3) “온톨로지 Date Canon” 개념

- 모든 날짜/진행상태 계산은 **정규화된 `events` 테이블**을 기반으로 합니다.
- `event_type`은 온톨로지 개념(예: `ATD`, `ATA`, `CUSTOMS_CLOSE`, `SITE_ARRIVAL_SHU`)을 의미하며,
- `event_date`는 Asia/Dubai 기준으로 산출된 **운영 기준 일자**입니다.

이를 통해:

- Worklist의 Gate(RED/AMBER/GREEN/ZERO)
- KPI(Overdue, Recoverable 등)
- ETA Window(Heatmap/ETA wedge)

가 모두 **같은 사실(SSOT) 기반**으로 계산됩니다.

---

## 4) 문서 운영 원칙

- 변경 사항은 항상 `STATUS.md`에 반영(단일 진실원천)
- 스키마/파이프라인 변경은 `supabase/migrations` + `scripts/` + `configs/` 3점을 함께 업데이트
- UI 변경은 `docs/LAYOUT.md`에 레이아웃/인터랙션을 먼저 업데이트 후 구현

---

## 5) 기여/PR 규칙

- 변경은 작게(PR 단위) 쪼개기
- **성능 우선순위:** waterfall 제거 → 번들 감소 → 서버/클라이언트 렌더링 → re-render 최소화
- 상세 규칙은 [`AGENTS.md`](./AGENTS.md) 참고

