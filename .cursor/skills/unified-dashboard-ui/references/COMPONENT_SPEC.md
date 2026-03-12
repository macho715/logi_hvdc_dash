# 컴포넌트 사양

> **최종 업데이트**: 2026-02-07  
> **상세 사양**: [COMPONENT_DETAIL_SPEC.md](./COMPONENT_DETAIL_SPEC.md)

---

## UnifiedLayout

**위치**: `apps/logistics-dashboard/components/UnifiedLayout.tsx`

**역할**: 통합 대시보드의 최상위 레이아웃 컨테이너

**구조**:
- HeaderBar (96px, 2-row)
- MapView (좌측, flex-1)
- RightPanel (우측, Desktop only, w-80)
- HVDC Panel (하단, fixed, 260px)
- DetailDrawer (오버레이, 조건부 표시)

**특징**:
- 모바일: HVDC Panel 드래그 가능 (200-600px)
- 데스크탑: 고정 레이아웃
- 접근성: ESC 키로 DetailDrawer 닫기

---

## HeaderBar

**위치**: `apps/logistics-dashboard/components/dashboard/HeaderBar.tsx`

**구조**: 2-row layout (96px)
- **상단 행**: GlobalSearch, 네비게이션, 토글 (Geofence/Heatmap/ETA Wedge), Window/Heat Filter, 사용자 메뉴
- **하단 행**: KPI 요약 스트립 (고정, `aria-live="polite"`)

**기능**:
- GlobalSearch (locations·worklist 검색)
- 레이어 토글 (Geofence, Heatmap, ETA Wedge)
- 실시간 연결 상태 표시
- KPI 요약 배지 (Shipments, Planned, In-Transit, Arrived, Delayed, Hold, Unknown, Events)

---

## MapView

**위치**: `apps/logistics-dashboard/components/map/MapView.tsx`

**라이브러리**: maplibre-gl 5.15.0 + deck.gl 9.2.5

**레이어** (줌 기반 가시성):
- **Location Layer** (deck.gl ScatterplotLayer): 줌 ≥ 9.5 표시
- **Heatmap Layer** (deck.gl HeatmapLayer): 줌 < 9.5 표시 (토글 ON일 때만)
- **HeatmapLegend**: 히트맵 활성 시 강도 범례 (낮음~매우 높음)
- **Geofence Layer** (deck.gl PathLayer): 토글 기반
- **ETA Wedge Layer** (deck.gl ArcLayer): 토글 기반
- **POI Layer** (deck.gl ScatterplotLayer + TextLayer): 줌 ≥ 7.5 표시
  - 라벨: 줌 7.5~10.5 (컴팩트), 줌 ≥ 10.5 (상세)

**인터랙션**:
- 클릭: 위치 선택 → Worklist 필터
- 줌/팬: 표준 지도 제스처
- 호버: 툴팁 표시

---

## RightPanel

**위치**: `apps/logistics-dashboard/components/dashboard/RightPanel.tsx`

**구조**: 탭 UI (Status/Occupancy/Distribution)

**탭 내용**:
- **Status 탭**: Location Status 목록, Event List
- **Occupancy 탭**: 점유율 차트 (Bar Chart)
- **Distribution 탭**: 상태 분포 차트 (Pie Chart)

**특징**:
- Desktop only (lg:block)
- 접근성: 활성 탭에 포커스 자동 이동
- MOSB-SCT office 필터링

---

## HVDC Panel

**위치**: `apps/logistics-dashboard/components/UnifiedLayout.tsx` (하단 고정)

**구성 요소**:
- **StageCardsStrip**: 상단 3카드 (라우팅 연동)
- **KpiStrip**: 실시간 KPI 지표
- **WorklistTable**: 워크리스트 테이블 (간소화: Gate/Title/Due/Score만)

**특징**:
- 데스크탑: 고정 높이 260px
- 모바일: 드래그 가능 (200-600px)

---

## DetailDrawer

**위치**: `apps/logistics-dashboard/components/hvdc/DetailDrawer.tsx`

**모드**:
- **sidepanel** (데스크탑): fixed top-24 right-80 bottom-80 w-96
- **overlay** (모바일): 전체 화면 덮음

**내용**:
- 케이스 상세 정보
- Flow Code 정보
- Triggers 섹션 (워크리스트에서 이동)

**접근성**:
- 포커스 트랩 (overlay 모드)
- ESC 키로 닫기

---

## 공통

- **테마**: 다크 모드 기본
- **타이포그래피**: 기본 16px, 주요 라벨 text-sm
- **반응형**: 모바일 < 1024px, 데스크탑 ≥ 1024px
- **접근성**: WCAG 2.2 AA 준수
- **PWA**: 지원 (향후)
