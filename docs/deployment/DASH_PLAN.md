# DASH Plan — 대시보드 맵/스테이지/검색 enhancement 실제 작업 계획

> **목적**: `dash/` 패치를 `apps/logistics-dashboard`에 적용하고, `reakmapping.md` SSOT에 맞춰 맵 POI·StageCardsStrip·GlobalSearch를 통합한다.  
> **SoT**: [dash/reakmapping.md](../dash/reakmapping.md) (POI 좌표·레이어), [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) (통합 절차).  
> **최종 업데이트**: 2026-02-07 (UI/UX 개선사항 반영)

**DASH 패치와 [reakmapping](../dash/reakmapping.md)은 동일 스코프로 함께 구현**한다. Phase A(POI)는 reakmapping §1·§3·§4를 그대로 반영하며, 검증은 reakmapping §6 기준이다.

---

## 1. 적용 범위

- **POI 레이어**: AGI/DAS/MIR/SHU, DSV M-19/M-44, MOSB/MOSB-SAM, Mina Zayed, Khalifa(KPCT), AUH (11개, `reakmapping` 좌표 SSOT).
- **StageCardsStrip**: HVDC Panel 내 **KpiStrip 상단** 3카드, 라우팅 연동.
- **GlobalSearch**: locations·worklist 검색, `searchIndex` 연동.
- **Supabase**: `poi_locations` 테이블 마이그레이션 (`dash/supabase/migrations/20260125_create_poi_locations.sql`) — 선택.

### 1.1 구현 관계 (함께 구현)

| DASH Phase | [reakmapping](../dash/reakmapping.md) | [APPLY_PATCH](../dash/docs/APPLY_PATCH.md) |
|------------|--------------------------------------|--------------------------------------------|
| **A** POI | §1 좌표 SSOT, §3 `poiTypes`·`poiLocations`·`PoiLocationsLayer`, §4 MapView 연동·fitBounds | §1 새 파일, §2 MapView 통합 |
| **B** StageCardsStrip | — | §3 HVDC Panel 3카드 |
| **C** GlobalSearch | — | §4 HeaderBar 검색창 |
| **D** 마이그레이션 | 참고: `poi_locations` 승격 | — |

Phase A 구현 시 **reakmapping §3·§4 스니펫을 기준**으로 하고, APPLY_PATCH는 통합 포인트(MapView/UnifiedLayout/HeaderBar) 가이드로 함께 따른다.

---

## 2. 선행 조건

- [ ] `apps/logistics-dashboard` 실행·빌드 정상 ([README](../README.md) 기준).
- [ ] Phase 2~6 완료, `public.shipments`·Worklist API 연동 확인 ([DASHBOARD_DATA_INTEGRATION_PROGRESS](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md)).
- [ ] `dash/` 내 `poiTypes`, `poiLocations`, `PoiLocationsLayer`, `buckets`, `StageCardsStrip`, `searchIndex`, `GlobalSearch` 경로·내용 확인.
- [ ] **`@deck.gl/extensions`** 설치 (`PoiLocationsLayer`의 `CollisionFilterExtension` 사용). `apps/logistics-dashboard` 의존성에 추가.

---

## 3. 실제 작업 목록 (실행 순서)

### 3.0 진행 체크리스트

| 항목 | 상태 |
|------|------|
| 플랜 등록 | [x] `.cursor/plans/dash_patch.plan.md` 생성 |
| A1 `poiTypes` | [x] `lib/map/poiTypes.ts` 추가 |
| A2 `poiLocations` | [x] `lib/map/poiLocations.ts` 추가 (11 POI, MOSB-SAM jitter) |
| A3 `PoiLocationsLayer` | [x] Scatterplot+Text, CollisionFilter, getPosition+jitter, labelOffsetPx |
| A4 MapView 연동 | [x] zoom·layers·tooltip·fitBounds |
| B1~B3 StageCardsStrip | [x] buckets, StageCardsStrip, UnifiedLayout·bucket URL↔store |
| C1~C3 GlobalSearch | [x] searchIndex, GlobalSearch, HeaderBar |
| D1 마이그레이션 | [ ] (선택) `poi_locations` |
| 타입체크 | [x] `pnpm --filter @repo/logistics-dashboard typecheck` |
| 검증 §4 | [x] 11 POI·줌·툴팁·StageCardsStrip·GlobalSearch (수동 체크 완료) |
| 문서 반영 | [x] plan.md·README·STATUS·CHANGELOG 갱신 |
| UI/UX 개선 | [x] 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화 (2026-02-05~07) |

---

### Phase A: POI 레이어 (reakmapping SSOT)

> **SSOT**: [reakmapping §3](../dash/reakmapping.md) `poiTypes`·`poiLocations` 스니펫 사용. `dash/` 번들의 `poiLocations`에는 `displayJitter`/`labelOffsetPx` 없음 → **reakmapping 데이터만 사용**, dash `poiLocations` 그대로 복사 금지.

| # | 작업 | 산출물 | 검증 |
|---|------|--------|------|
| A1 | `lib/map/poiTypes.ts` 추가·확장 (`PoiCategory`, `PoiLocation`, `displayJitter`, `labelOffsetPx`) | `apps/logistics-dashboard/lib/map/poiTypes.ts` | 타입 import 오류 없음 |
| A2 | `lib/map/poiLocations.ts` 추가 (11개 POI, [reakmapping §1·§3](../dash/reakmapping.md) 좌표·`displayJitter`·`labelOffsetPx` 반영, MOSB-SAM jitter) | `apps/logistics-dashboard/lib/map/poiLocations.ts` | `POI_LOCATIONS` length 11, 6dp |
| A3 | `components/map/PoiLocationsLayer.ts` 추가 (Scatterplot+Text, CollisionFilter). **`getPosition`에 `displayJitter` 반영**, TextLayer **`getPixelOffset`는 `d.labelOffsetPx ?? [0, -16]`** | `apps/logistics-dashboard/components/map/PoiLocationsLayer.ts` | 렌더·툴팁 동작 |
| A4 | MapView에 POI 레이어·getTooltip·fitBounds 연동 ([reakmapping §4](../dash/reakmapping.md#4-mapview에-직접-표시-연결필수)) | `MapView.tsx` 수정 | 줌 ≥8.5에서 11개 POI·툴팁·MOSB/MOSB-SAM 각각 클릭 |

### Phase B: StageCardsStrip

> **배치**: [FEATURE_SPEC_STAGE_CARDS](../dash/docs/FEATURE_SPEC_STAGE_CARDS.md)에 따라 **StageCardsStrip를 KpiStrip 상단**에 배치 (데스크탑·모바일 HVDC 패널 동일).

| # | 작업 | 산출물 | 검증 |
|---|------|--------|------|
| B1 | `lib/hvdc/buckets.ts` 추가 | `apps/logistics-dashboard/lib/hvdc/buckets.ts` | import 오류 없음 |
| B2 | `components/hvdc/StageCardsStrip.tsx` 추가 | `apps/logistics-dashboard/components/hvdc/StageCardsStrip.tsx` | 3카드 렌더 |
| B3 | UnifiedLayout/HVDC Panel에 **KpiStrip 위** StageCardsStrip 통합, `usePathname`/`useRouter`/`useSearchParams` 라우팅 | 레이아웃 수정 | 카드 클릭 시 라우팅 |

### Phase C: GlobalSearch

| # | 작업 | 산출물 | 검증 |
|---|------|--------|------|
| C1 | `lib/search/searchIndex.ts` 추가 | `apps/logistics-dashboard/lib/search/searchIndex.ts` | 인덱스·검색 함수 |
| C2 | `components/search/GlobalSearch.tsx` 추가 | `apps/logistics-dashboard/components/search/GlobalSearch.tsx` | 검색 UI |
| C3 | HeaderBar에 GlobalSearch 배치. **`usePathname`·`useRouter`** 추가. `onSelect` 시 **기존 query param(bucket 등) 유지**한 채 `focus`/`case`/`loc`만 설정 ([APPLY_PATCH §4](../dash/docs/APPLY_PATCH.md)). worklist·locations 연동 | 레이아웃 수정 | 검색·필터 동작 |

### Phase D: 선택 사항

| # | 작업 | 산출물 | 검증 |
|---|------|--------|------|
| D1 | `dash/supabase/migrations/20260125_create_poi_locations.sql`를 `supabase/migrations/`에 복사·적용. **기존 `20260125_public_shipments_view.sql`과 충돌** → `20260126_create_poi_locations.sql` 등 별도 날짜 파일명 권장 | 마이그레이션 적용 | `poi_locations` 테이블 존재 |

---

## 4. 검증 시나리오 ([reakmapping §6](../dash/reakmapping.md#6-검증-시나리오빠른-체크), [APPLY_PATCH §5](../dash/docs/APPLY_PATCH.md))

> **현재 상태**: 구현 완료 (문서 기준). 검증 §4와 타입체크는 미완료.  
> **다음 단계**: 로컬에서 타입체크 실행 → §4 수동 체크 → 결과 반영.

### 4.1 타입체크

```bash
pnpm --filter @repo/logistics-dashboard typecheck
```

- **성공**: Exit 0, TS 오류 없음 → §4 수동 검증 진행.
- **실패**: 보고된 타입 오류 수정 후 재실행.

### 4.2 수동 검증 체크리스트

1. MapView 실행 → 줌 **8.5 이상**.
2. **11개 POI** 표시 확인: HVDC 4(AGI/DAS/MIR/SHU), DSV 2(M-19/M-44), MOSB 2(일반/삼성), Port 2(Zayed/KPCT), Airport 1(AUH).
3. **줌 &lt; 8.5에서 라벨 숨김** 확인 (모바일 포함). 줌 ≥8.5에서 라벨 표시, 과도한 겹침 없음. 마커 클릭 시 **tooltip** 표시.
4. **MOSB vs MOSB-SAM** 각각 클릭 가능 (중첩 분리).
5. StageCardsStrip 3카드 클릭 → 라우팅.
6. GlobalSearch 입력 → worklist/locations 필터·검색. 키보드(↑/↓/Enter/Esc) 동작.

**검증 완료 후**: §3.0 체크리스트 "검증 §4" 행을 `[x]`로 업데이트.

---

## 5. plan.md · README · STATUS · CHANGELOG 반영

- **plan.md**: `test: POI layer displays 11 fixed locations`, User Flows (location selection, worklist filter/search) 갱신; 참조에 `DASH_PLAN`, `reakmapping`, `APPLY_PATCH` 추가.
- **README**: 맵 POI·Stage·Search 설명, `dash/`·`reakmapping` 링크, "dash 패치 적용" 절.
- **STATUS**: 갭 분석·다음 2주에 dash 적용 반영, 참조에 `DASH_PLAN`·`reakmapping`·`APPLY_PATCH`.
- **CHANGELOG**: dash 패치 적용 완료 기록 (POI 레이어, StageCardsStrip, GlobalSearch 통합).

---

## 6. 참조

- [dash/reakmapping.md](../dash/reakmapping.md) — POI 좌표·레이어 SSOT. **DASH Phase A와 함께 구현**.
- [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) — 통합 절차.
- [dash/docs/FEATURE_SPEC_MAP_POI.md](../dash/docs/FEATURE_SPEC_MAP_POI.md) — Map POI 스펙.
- [dash/docs/FEATURE_SPEC_STAGE_CARDS.md](../dash/docs/FEATURE_SPEC_STAGE_CARDS.md) — Stage Cards 스펙.
- [dash/docs/FEATURE_SPEC_SEARCH.md](../dash/docs/FEATURE_SPEC_SEARCH.md) — Search 스펙.
- [STATUS.md](../STATUS.md) — 통합 상태 SSOT.
- [plan.md](../plan.md) — TDD 테스트 계획 SoT.
- [DASHBOARD_DATA_INTEGRATION_PROGRESS.md](../data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) — Phase 2~6·대시보드 반영.
