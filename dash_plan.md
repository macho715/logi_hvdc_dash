# DASH Plan — 요약

> **캐넌(전체 본문)**: [docs/DASH_PLAN.md](./docs/DASH_PLAN.md)

dash 패치(맵 POI 11개·StageCardsStrip·GlobalSearch) 적용의 **실제 작업 계획**은 `docs/DASH_PLAN.md`를 참조하세요.  
**DASH 패치와 [reakmapping](./dash/reakmapping.md)은 함께 구현**하는 작업이며, Phase A는 reakmapping §1·§3·§4·§6를 기준으로 한다.

## 빠른 링크

- [DASH_PLAN (전체)](./docs/DASH_PLAN.md) — 적용 범위, 선행 조건, Phase A~D 작업 목록, 검증 시나리오, plan/README/STATUS 반영
- [dash/reakmapping.md](./dash/reakmapping.md) — POI 좌표·레이어 SSOT (**Phase A와 함께 구현**)
- [dash/docs/APPLY_PATCH.md](./dash/docs/APPLY_PATCH.md) — dash 패치 통합 절차

## 적용 범위 (요약)

| Phase | 내용 |
|-------|------|
| **A** | POI 레이어 (`poiTypes`, `poiLocations`, `PoiLocationsLayer`, MapView 연동) |
| **B** | StageCardsStrip (HVDC Panel 내 KpiStrip 상단 3카드, 라우팅) |
| **C** | GlobalSearch (searchIndex, worklist·locations 검색) |
| **D** | (선택) `poi_locations` 테이블 마이그레이션 |

**최종 업데이트**: 2026-02-07 (UI/UX 개선사항 반영: 히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)
