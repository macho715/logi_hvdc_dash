[![Khalifa Port expansion on track for Q1 2021 completion | Container ...](https://tse3.mm.bing.net/th/id/OIP.4wW9Q4SBrH1Uq40Hp4I7HgHaFj?pid=Api)](https://container-mag.com/2020/09/14/khalifa-port-expansion-on-track-for-q1-2021-completion/?utm_source=chatgpt.com)

## 적용 목표

요청하신 좌표(AGI/DAS/MIR/SHU + DSV(M-19/M-44) + MOSB(+Samsung) + Mina Zayed/Khalifa(KPCT) + AUH)를 **프론트엔드 맵 POI(고정 포인트)**로 **직접 세팅(하드코딩 SSOT)** 하고, **지도 위에 짧은 썸머리 라벨을 겹치지 않게 표시**하도록 구성하면 됩니다. (좌표 SSOT는 업로드하신 표 기준)

---

## 1) 좌표 SSOT(고정 POI) — 최종 입력값(Decimal, 6dp)

아래 값 그대로 `POI_LOCATIONS`에 반영합니다.

* **AGI (Jetty 대표)**: `24.841096, 53.658619`

  * 참고: Al Ghallan Island 로컬리티 좌표는 2GIS에 `24.843346, 53.656988`로 확인되며, Jetty 대표점은 운영상 대표값(가정)으로 별도 사용합니다. ([2GIS][1])
* **DAS (Das Island 중심)**: `25.147700, 52.875000` ([Mapcarta][2])
* **MIR (Mirfa IWPP)**: `24.118850, 53.444360` ([Mapcarta][3])
* **SHU (Shuweihat Complex)**: `24.160170, 52.572920` ([Mapcarta][4])
* **DSV Mussafah Office (M-19)**: `24.366698, 54.476102` ([2GIS][5])
* **DSV M-44 Warehouse(대표, 지역 중심점)**: `24.344700, 54.581830` ([Mapcarta][6])
* **MOSB (ESNAAD)**: `24.324790, 54.466850` ([Mapcarta][7])
* **MOSB Samsung Yard(대표, MOSB 좌표 사용)**: `24.324790, 54.466850` ([Mapcarta][7])
* **Mina Zayed Port**: `24.524890, 54.377980` ([Mapcarta][8])
* **Khalifa Port (KPCT)**: `24.809500, 54.648420` ([Mapcarta][9])
* **AUH (Zayed Int’l / OMAA)**: `24.441000, 54.649200` (OurAirports 좌표를 6dp 반올림으로 정규화) ([ourairports.com][10])

---

## 2) 맵 “직접 세팅” 구현 방식(권장)

### 핵심 설계

* **SSOT는 프론트엔드 상수 배열**: `POI_LOCATIONS`
* **표시 레이어는 deck.gl 2-layer**

  * `ScatterplotLayer`: 점(마커)
  * `TextLayer + CollisionFilterExtension`: `code · summary` 라벨, **겹침 방지**
* **중첩 포인트 처리(MOSB vs MOSB-SAM)**

  * SSOT 좌표는 동일하게 두되, **화면에서만 `displayJitter`로 살짝 분리**(선택/툴팁/라벨 겹침 방지)

---

## 3) 코드 스니펫(다운로드 실패 시 그대로 복붙 가능)

### `apps/logistics-dashboard/lib/map/poiTypes.ts` (필드 확장)

```ts
export type PoiCategory = 'HVDC_SITE' | 'PORT' | 'WAREHOUSE' | 'OFFICE' | 'YARD' | 'AIRPORT';

export type PoiLocation = {
  id: string;
  code: string;
  name: string;
  category: PoiCategory;

  latitude: number;
  longitude: number;

  /**
   * Optional display jitter (decimal degrees) applied only for map rendering.
   * Tuple order: [lngDelta, latDelta]
   */
  displayJitter?: [number, number];

  /**
   * Optional label pixel offset for map rendering.
   * Tuple order: [xPx, yPx]
   */
  labelOffsetPx?: [number, number];

  summary: string;
  address?: string;
  priority?: number;
  tags?: string[];
};
```

### `apps/logistics-dashboard/lib/map/poiLocations.ts` (요청 좌표 하드코딩)

```ts
import type { PoiLocation } from './poiTypes';

export const POI_LOCATIONS: ReadonlyArray<PoiLocation> = [
  {
    id: 'agi-jetty',
    code: 'AGI',
    name: 'AGI – Al Ghallan Island (Jetty 대표)',
    category: 'HVDC_SITE',
    latitude: 24.841096,
    longitude: 53.658619,
    summary: 'HVDC Site · Jetty (rep.)',
    priority: 900,
    tags: ['HVDC', 'site'],
  },
  {
    id: 'das-island',
    code: 'DAS',
    name: 'DAS – Das Island(섬 중심)',
    category: 'HVDC_SITE',
    latitude: 25.1477,
    longitude: 52.875,
    summary: 'HVDC Site · Island',
    priority: 890,
    tags: ['HVDC', 'site'],
  },
  {
    id: 'mirfa-iwpp',
    code: 'MIR',
    name: 'MIR – Mirfa IWPP(플랜트)',
    category: 'HVDC_SITE',
    latitude: 24.11885,
    longitude: 53.44436,
    summary: 'HVDC Site · IWPP',
    priority: 880,
    tags: ['HVDC', 'site'],
  },
  {
    id: 'shuweihat-complex',
    code: 'SHU',
    name: 'SHU – Shuweihat Complex(단지 중심)',
    category: 'HVDC_SITE',
    latitude: 24.16017,
    longitude: 52.57292,
    summary: 'HVDC Site · Complex',
    priority: 870,
    tags: ['HVDC', 'site'],
  },
  {
    id: 'dsv-mussafah-office-m19',
    code: 'DSV-M19',
    name: 'DSV Mussafah 사무실(M-19)',
    category: 'OFFICE',
    latitude: 24.366698,
    longitude: 54.476102,
    summary: 'Office · DSV (M-19)',
    priority: 800,
    tags: ['DSV', 'office'],
  },
  {
    id: 'dsv-mussafah-warehouse-m44',
    code: 'DSV-M44',
    name: 'DSV M-44 Inland Warehouse(대표)',
    category: 'WAREHOUSE',
    latitude: 24.3447,
    longitude: 54.58183,
    summary: 'Warehouse · DSV (M-44)',
    priority: 790,
    tags: ['DSV', 'warehouse'],
  },
  {
    id: 'mosb-esnaad',
    code: 'MOSB',
    name: 'MOSB – Mussafah Offshore Support Base(ESNAAD)',
    category: 'YARD',
    latitude: 24.32479,
    longitude: 54.46685,
    summary: 'Yard · MOSB (ESNAAD)',
    priority: 780,
    tags: ['MOSB', 'yard'],
  },
  {
    id: 'mosb-samsung-yard',
    code: 'MOSB-SAM',
    name: 'MOSB – Samsung Yard(대표)',
    category: 'YARD',
    latitude: 24.32479,
    longitude: 54.46685,
    // 화면에서만 살짝 분리(약 30~40m 수준): 중첩 클릭/라벨 겹침 방지
    displayJitter: [0.00035, 0.00015],
    labelOffsetPx: [0, -16],
    summary: 'Yard · Samsung (rep.)',
    priority: 770,
    tags: ['MOSB', 'yard', 'samsung'],
  },
  {
    id: 'zayed-port',
    code: 'MZP',
    name: 'Mina Zayed Port(대표)',
    category: 'PORT',
    latitude: 24.52489,
    longitude: 54.37798,
    summary: 'Port · Zayed',
    priority: 860,
    tags: ['port'],
  },
  {
    id: 'khalifa-port-kpct',
    code: 'KPP',
    name: 'Khalifa Port – KPCT',
    category: 'PORT',
    latitude: 24.8095,
    longitude: 54.64842,
    summary: 'Port · Khalifa (KPCT)',
    priority: 850,
    tags: ['port', 'KPCT'],
  },
  {
    id: 'auh-airport',
    code: 'AUH',
    name: "Abu Dhabi(Zayed) International Airport – AUH",
    category: 'AIRPORT',
    latitude: 24.441,
    longitude: 54.6492,
    summary: 'Airport · AUH',
    priority: 840,
    tags: ['airport'],
  },
];
```

### `apps/logistics-dashboard/components/map/PoiLocationsLayer.ts` (라벨 겹침 방지 + jitter 반영)

핵심만 요약하면:

* `getPosition()`에서 `displayJitter`를 더해 렌더링 좌표를 분리
* `TextLayer`에 `CollisionFilterExtension` 적용

(전체 파일은 아래 패치에 포함)

---

## 4) MapView에 “직접 표시” 연결(필수)

MapView에서 deck.gl layers 배열에 아래를 추가합니다.

```ts
import { POI_LOCATIONS } from '@/lib/map/poiLocations';
import { createPoiLayers, getPoiTooltip } from '@/components/map/PoiLocationsLayer';

const poiLayers = createPoiLayers({
  pois: POI_LOCATIONS,
  zoom: viewState.zoom,
  onSelectPoi: (poi) => {
    setSelectedPoiId(poi.id);
    // (옵션) map flyTo / 우측 패널에 POI 상세 표시
  },
});

const layers = [
  ...existingLayers,
  ...poiLayers,
];

<DeckGL
  layers={layers}
  getTooltip={(info) => getPoiTooltip(info)}
/>;
```

### 초기 화면에서 “전체 POI가 보이도록” (권장)

현재 맵이 다른 지역을 보고 있으면 POI가 안 보일 수 있으니, 최초 1회 `fitBounds`를 권장합니다.

* bounds:

  * minLng `52.572920`, minLat `24.118850`
  * maxLng `54.649200`, maxLat `25.147700`

---

## 5) 다운로드(바로 적용용)

다운로드 오류가 있으셨다고 해서 **2종류로 제공**합니다.

* 전체 기능 패치(POI 레이어 + 검색 + 하단 3카드까지 포함):

  * [Download dashboard-map-enhancement_patch_v2.zip](sandbox:/mnt/data/dashboard-map-enhancement_patch_v2.zip)
  * [Download dashboard-map-enhancement_patch_v2.tar.gz](sandbox:/mnt/data/dashboard-map-enhancement_patch_v2.tar.gz)
* **좌표/레이어만 최소 패치(가장 가벼움)**:

  * [Download map-poi-coords_only_patch_v1.zip](sandbox:/mnt/data/map-poi-coords_only_patch_v1.zip)
* GeoJSON(원하시면 MapLibre/Mapbox “소스+레이어”로도 바로 사용 가능):

  * [Download hvdc_poi_locations_v1.geojson](sandbox:/mnt/data/hvdc_poi_locations_v1.geojson)

---

## 6) 검증 시나리오(빠른 체크)

> **구현 상태**: ✅ 완료 (2026-01-25)
> - POI 레이어 구현 완료: `PoiLocationsLayer.ts`, `poiLocations.ts`, `poiTypes.ts`
> - MapView 연동 완료: 줌·툴팁·fitBounds
> - 맵 레이어 API Supabase 전환 완료: `/api/locations`, `/api/location-status`, `/api/events` (실제 데이터 조회, Fallback: Mock)
> - StageCardsStrip 구현 완료: HVDC Panel 내 KpiStrip 상단 3카드, 라우팅 연동
> - GlobalSearch 구현 완료: HeaderBar 검색창, locations·worklist 검색

1. 대시보드 MapView 실행
2. 줌을 **8.5 이상**으로 확대
3. 아래 POI가 지도에 모두 보이는지 확인

   * HVDC 4개(AGI/DAS/MIR/SHU), DSV 2개(M-19/M-44), MOSB 2개(일반/삼성), Port 2개(Zayed/KPCT), Airport 1개(AUH)
4. 라벨이 과도하게 겹치지 않고(충돌 시 일부 숨김), 마커 클릭 시 tooltip이 뜨는지 확인
5. MOSB와 MOSB-SAM이 **서로 클릭 가능**한지 확인(중첩 분리 동작)
6. **StageCardsStrip** (HVDC Panel 내 KpiStrip 상단 3카드) 클릭 시 라우팅 동작 확인
7. **GlobalSearch** (HeaderBar 검색창) 입력 시 locations·worklist 필터/검색 동작 확인

---

## 7) 맵 레이어 API Supabase 전환 (2026-01-25 완료)

### API 라우트 전환
- `/api/locations`: Supabase `public.locations` 조회 (Fallback: Mock)
  - 스키마 매핑: `id→location_id`, `lng→lon`, `type→siteType` (매핑 함수)
  - 필터: 좌표가 있는 행만 반환
- `/api/location-status`: Supabase `public.location_statuses` 조회 (Fallback: Mock)
  - 스키마 매핑: `status→status_code` (대문자 변환), `occupancy_rate` (0-100→0-1), `updated_at→last_updated`
- `/api/events`: Supabase `public.events` 조회 with joins (Fallback: Mock)
  - 조인: `locations!inner` (좌표 필수), `shipments` (선택적, PostgREST 조인 구문)
  - 스키마 매핑: `event_type→status`, `description→remark`, `shipments.sct_ship_no→shpt_no`
  - 필터: 유효한 좌표가 있는 이벤트만 반환

### 레이어 데이터 소스
- **Geofence Layer**: `/api/locations` 데이터 사용 (실제 Supabase 데이터 또는 Mock Fallback)
- **Heatmap Layer**: `/api/events` 데이터 사용 (실제 Supabase 데이터 또는 Mock Fallback)
- **ETA Wedge Layer**: `/api/locations` (PORT 타입 필터) 사용 (실제 Supabase 데이터 또는 Mock Fallback)
- **POI Layer**: 정적 데이터 (`lib/map/poiLocations.ts`, reakmapping SSOT)

**참고**: `public.locations`, `public.location_statuses`, `public.events` 테이블이 비어 있거나 조회 실패 시 Mock 데이터로 Fallback됩니다. 테이블이 채워지면 자동으로 실제 데이터를 사용합니다.

---

## 참고(좌표 근거 교차 확인 요약)

* Das Island / Mirfa IWPP / Shuweihat / MOSB(Esnaad) / Zayed Port / KPCT: Mapcarta(OpenStreetMap/Wikidata 기반)에서 위경도 확인 가능 ([Mapcarta][2])
* DSV M-19: 2GIS에 `24.366698, 54.476102`로 표기되며, DSV 공식 페이지의 M-19 Visitor Address와 정합 ([2GIS][5])
* AUH(OMAA): OurAirports 좌표를 6dp로 정규화해 사용 ([ourairports.com][10])

원하시면, 다음 단계로 **POI를 Supabase 테이블(`poi_locations`)로 승격**해서 운영자가 좌표/요약을 UI에서 바꾸는 형태(권한/RLS 포함)로도 확장할 수 있습니다.

[1]: https://2gis.ae/dubai/geo/70030076307991297 "Al Ghallan Island, микрорайон, Abu Dhabi Emirate — 2GIS"
[2]: https://mapcarta.com/37841780 "Das Island Map - Locality - Al Dhafra Region, Abu Dhabi, United Arab Emirates"
[3]: https://mapcarta.com/W689277122 "Mirfa International Power & Water Plant Map - Waterworks - Al Marfa, Abu Dhabi, United Arab Emirates"
[4]: https://mapcarta.com/W301651562 "Al Shuweihat Power and Water Complex Map - Waterworks - Jabel Al Dhannah, Abu Dhabi, United Arab Emirates"
[5]: https://2gis.ae/dubai/firm/70000001033052910 "DSV Global Transport & Logistics, company, Abu Dhabi, Abu Dhabi — 2GIS"
[6]: https://mapcarta.com/37845112 "Mz44 Map - Locality - Zayed City, Abu Dhabi, United Arab Emirates"
[7]: https://mapcarta.com/N5302911021 "Esnaad Map - Musaffah, Abu Dhabi, United Arab Emirates"
[8]: https://mapcarta.com/W873221087 "Zayed Port Map - Suburb - Abu Dhabi Island, Abu Dhabi, United Arab Emirates"
[9]: https://mapcarta.com/W243045263 "Khalifa Port Container Terminal Map - Khalifa Industrial City A, Abu Dhabi, United Arab Emirates"
[10]: https://ourairports.com/airports/OMAA/frequencies.html "Zayed International Airport frequencies @ OurAirports"
