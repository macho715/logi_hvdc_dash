---
name: dash 패치 적용 (맵 POI · StageCardsStrip · GlobalSearch)
overview: DASH_PLAN 기준 Phase A/B/C 실행. [dash/reakmapping.md](../dash/reakmapping.md) POI SSOT, [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) 통합 절차 참조. DASH 패치와 reakmapping은 함께 구현.
todos:
  - id: dash-plan-register
    content: DASH_PLAN Cursor 플랜 등록 (dash_patch.plan.md 생성)
    status: completed
  - id: phase-a1
    content: A1 lib/map/poiTypes.ts 추가 (reakmapping §3)
    status: pending
  - id: phase-a2
    content: A2 lib/map/poiLocations.ts 추가 (11 POI, reakmapping §1·§3)
    status: pending
  - id: phase-a3
    content: A3 PoiLocationsLayer 복사·수정 (getPosition+jitter, labelOffsetPx)
    status: pending
  - id: phase-a4
    content: A4 MapView POI 연동 (zoom, layers, tooltip, fitBounds)
    status: pending
  - id: phase-b1
    content: B1 lib/hvdc/buckets.ts 추가
    status: pending
  - id: phase-b2
    content: B2 StageCardsStrip.tsx 추가
    status: pending
  - id: phase-b3
    content: B3 UnifiedLayout StageCardsStrip·bucket URL↔store 연동
    status: pending
  - id: phase-c1
    content: C1 lib/search/searchIndex.ts 추가
    status: pending
  - id: phase-c2
    content: C2 GlobalSearch.tsx 추가
    status: pending
  - id: phase-c3
    content: C3 HeaderBar GlobalSearch 연동 (usePathname/router, onSelect→URL)
    status: pending
  - id: phase-d1
    content: D1 (선택) poi_locations 마이그레이션
    status: pending
  - id: verify
    content: DASH_PLAN §4 검증 시나리오 실행
    status: pending
  - id: docs-update
    content: DASH_PLAN 체크리스트·STATUS 갭 분석 반영
    status: pending
isProject: false
---

# dash 패치 적용 (맵 POI · StageCardsStrip · GlobalSearch)

**캐넌**: [docs/DASH_PLAN.md](../docs/DASH_PLAN.md)

적용 범위·선행 조건·Phase A~D 작업 목록·검증 시나리오는 DASH_PLAN을 참조한다.  
[dash/reakmapping.md](../dash/reakmapping.md) §1·§3·§4·§6와 [dash/docs/APPLY_PATCH.md](../dash/docs/APPLY_PATCH.md) 통합 절차를 **함께** 따른다.

## 실행 순서

1. Phase A: A1 → A2 → A3 → A4 (POI 레이어 · MapView)
2. Phase B: B1 → B2 → B3 (buckets · StageCardsStrip · UnifiedLayout · store bucket)
3. Phase C: C1 → C2 → C3 (searchIndex · GlobalSearch · HeaderBar)
4. (선택) Phase D: poi_locations 마이그레이션
5. 검증 §4 실행, DASH_PLAN · STATUS 문서 반영
