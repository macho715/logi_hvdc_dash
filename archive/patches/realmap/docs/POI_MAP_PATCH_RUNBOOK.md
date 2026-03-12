# POI Map Patch Runbook (Real Site Coordinates)

목표: Mockup POI 대신 실제 현장/부두/창고/사무실 좌표를 지도에 표시합니다.

## 포함 내용

1) **GeoJSON SSOT**
- `apps/logistics-dashboard/public/poi/hvdc_poi_locations_v1.geojson`

2) **Deck.gl 레이어**
- `apps/logistics-dashboard/lib/map/hvdcPoiLocations.ts`
- `apps/logistics-dashboard/components/map/HvdcPoiLayers.ts`

3) **자동 주입 스크립트**
- `scripts/hvdc/apply_map_poi_patch.mjs`

## 적용 방법

### A) 가장 빠른 방법 (권장)

1. 이 패치를 레포 루트에 **덮어쓰기**로 복사
2. MapView 자동 주입 실행:

```bash
node scripts/hvdc/apply_map_poi_patch.mjs
```

3. 로컬 실행:

```bash
pnpm -w install
pnpm -w dev
```

4. 지도에서 다음 POI가 **아부다비/서부지역**에 표시되는지 확인:
- AGI, DAS, MIR, SHU
- DSV(M-19, M-44)
- MOSB(ESNAAD, Samsung Yard)
- Mina Zayed Port, Khalifa Port(KPCT), AUH

### B) 스크립트가 실패할 때 (수동 통합)

MapView(DeckGL 사용하는 파일)에 아래 2개만 반영하면 됩니다.

1) import 추가 (MapView 위치에 따라 상대경로 조정)
```ts
import { createHvdcPoiLayers } from './map/HvdcPoiLayers';
```

2) layers 배열에 추가
```ts
const layers = [
  ...createHvdcPoiLayers(),
  // existing layers...
];
```

## 트러블슈팅

- **POI가 안 보임**
  - 레이어 순서가 다른 레이어에 가려질 수 있음 → `createHvdcPoiLayers()`를 layers 배열의 마지막(또는 앞)으로 이동해 확인
  - 맵 초기 카메라가 UAE가 아닐 수 있음 → 초기 viewState를 Abu Dhabi 근처로 이동

- **중복 마커가 보임**
  - 기존 LocationLayer가 mock 좌표를 렌더 중일 수 있음
  - 이 패치는 “실제 POI 오버레이”를 추가하는 방식이므로, 다음 단계로는:
    - `/api/locations` 또는 locations seed를 실제 좌표로 교체
    - 혹은 기존 LocationLayer에서 해당 코드(AGI/DAS/…)를 필터링


## (옵션) 기존 GeoJSON 파일을 교체하는 방식

만약 현재 맵이 **repo root의 `cntr_layers_points_v1.geojson`**를 로드 중이라면,
`apps/logistics-dashboard/public/poi/hvdc_poi_locations_v1.geojson` 내용을 해당 파일로 교체하는 방식으로도 좌표를 반영할 수 있습니다.
(단, 기존 파일에 다른 POI가 더 들어있다면 병합이 필요합니다.)
