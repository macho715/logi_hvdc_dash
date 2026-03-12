# Feature Spec — Map POI (현장/부두/창고/사무실) 표시

## 목적
대시보드 MapView(좌측)에 **업로드된 좌표(AGI/DAS/MIR/SHU + DSV + MOSB + Ports + AUH)** 를 **고정 POI 레이어**로 표시한다.
- 각 POI는 **아주 간단한 썸머리(1줄)** 를 지도에 표시한다.
- 썸머리는 서로 **겹치지 않게**(최소화) 표시하며, 충돌 시 우선순위(현장/항만 우선)로 노출한다.
- 마커 클릭 시 POI 상세(tooltip) + (옵션) Worklist 필터로 연결한다.

## 데이터 소스
- SSOT: `docs/map.md`의 좌표 표 (WGS84, Decimal 6dp)
- v1 구현: 프론트엔드 상수(`POI_LOCATIONS`)로 관리
- v2(옵션): `public.poi_locations` 또는 `public.locations` 테이블로 승격(관리 UI/CSV 적재 가능)

## UI/UX 요구사항
- 마커: 카테고리별 색상(현장/항만/창고/사무실/야드/공항)
- 라벨: `${code} · ${summary}` 형태의 매우 짧은 문자열
- 겹침 방지: Deck.gl `CollisionFilterExtension` 적용
  - 줌이 낮으면 라벨 숨김(기본 zoom < 8.5)
  - collision priority: 현장/항만 > 창고 > 사무실/야드

## 접근성
- POI tooltip 텍스트는 화면 낭독기에서 읽을 수 있도록(가능하면) DOM tooltip 컴포넌트로도 제공
- 마커/라벨 클릭 영역(타깃) 최소 24px 이상 유지

## 구현 파일
- `apps/logistics-dashboard/lib/map/poiTypes.ts`
- `apps/logistics-dashboard/lib/map/poiLocations.ts`
- `apps/logistics-dashboard/components/map/PoiLocationsLayer.ts`

## MapView 통합 방법(필수 수정)
MapView에서 deck.gl layers 배열에 아래를 추가:

```ts
import { POI_LOCATIONS } from '../lib/map/poiLocations';
import { createPoiLayers, getPoiTooltip } from './map/PoiLocationsLayer';

// inside component
const poiLayers = createPoiLayers({
  pois: POI_LOCATIONS,
  selectedPoiId,
  zoom: viewState.zoom,
  onSelectPoi: (poi) => {
    setSelectedPoiId(poi.id);
    // (옵션) store.selectLocation(poi.code) 또는 map flyTo
  },
});

const layers = [
  ...existingLayers,
  ...poiLayers,
];

// DeckGL getTooltip에 병합
const getTooltip = (info) => {
  if (info.layer?.id?.startsWith('poi-')) return getPoiTooltip(info);
  return existingTooltip(info);
};
```

## 리스크/주의
- 기존 locations/location_statuses 레이어와 시각적으로 겹칠 수 있음 → v1은 라벨 줌 임계값 + collision 적용
- 좌표 중 일부는 representative(가정) → tooltip에 assumption 표기 유지
