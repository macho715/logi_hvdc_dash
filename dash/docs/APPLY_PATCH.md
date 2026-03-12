# Apply Guide — Dashboard Map/Stage/Search Enhancement Patch v1

> 이 패치는 **새 파일 추가 + 최소 수정 가이드** 형태입니다.
> 레포의 실제 파일명/경로가 약간 다를 수 있으니, 아래 “통합 포인트”를 기준으로 반영하세요.

## 1) 새 파일 복사
레포 루트 기준으로 아래 경로에 파일을 추가합니다.

- `apps/logistics-dashboard/lib/map/poiTypes.ts`
- `apps/logistics-dashboard/lib/map/poiLocations.ts`
- `apps/logistics-dashboard/components/map/PoiLocationsLayer.ts`
- `apps/logistics-dashboard/lib/hvdc/buckets.ts`
- `apps/logistics-dashboard/components/hvdc/StageCardsStrip.tsx`
- `apps/logistics-dashboard/lib/search/searchIndex.ts`
- `apps/logistics-dashboard/components/search/GlobalSearch.tsx`

## 2) MapView 통합(필수)
`apps/logistics-dashboard/components/MapView.tsx`에서:

1. import 추가
```ts
import { POI_LOCATIONS } from '../lib/map/poiLocations'
import { createPoiLayers, getPoiTooltip } from './map/PoiLocationsLayer'
```

2. viewState.zoom을 전달해 poi layer 생성
```ts
const poiLayers = createPoiLayers({
  pois: POI_LOCATIONS,
  selectedPoiId,
  zoom: viewState.zoom,
  onSelectPoi: (poi) => {
    setSelectedPoiId(poi.id)
    // (옵션) map flyTo / store.selectLocation
  },
})
```

3. layers 배열에 추가
```ts
const layers = [...existingLayers, ...poiLayers]
```

4. DeckGL getTooltip에 병합
```ts
const getTooltip = (info) => {
  if (info.layer?.id?.startsWith('poi-')) return getPoiTooltip(info)
  return existingGetTooltip(info)
}
```

## 3) HVDC Panel(하단) 3카드 통합(필수)
`UnifiedLayout.tsx` 또는 HVDC Panel 컴포넌트에서:

```tsx
import { StageCardsStrip } from './hvdc/StageCardsStrip'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const pathname = usePathname()
const router = useRouter()

<StageCardsStrip
  rows={worklistRows}
  onNavigateBucket={(bucket) => {
    const url = new URL(window.location.href)
    url.searchParams.set('bucket', bucket)
    router.push(`${pathname}?${url.searchParams.toString()}`)
  }}
/>
```

WorklistTable에서 `bucket` query param을 읽어 필터:
```ts
const bucket = searchParams.get('bucket')
const filtered = bucket ? rows.filter(r => deriveBucket(r) === bucket) : rows
```

## 4) HeaderBar 검색창 통합(필수)
`HeaderBar.tsx`에서:

```tsx
import { GlobalSearch } from './search/GlobalSearch'
import { POI_LOCATIONS } from '../lib/map/poiLocations'
import { buildSearchIndex } from '../lib/search/searchIndex'

const items = useMemo(
  () => buildSearchIndex({ worklistRows, pois: POI_LOCATIONS }),
  [worklistRows]
)

<GlobalSearch
  items={items}
  onSelect={(res) => {
    // 1) URL로 상태 표현(추천)
    const url = new URL(window.location.href)
    if (res.type === 'shipment') url.searchParams.set('focus', String(res.payload.hvdc_code ?? ''))
    if (res.type === 'case') url.searchParams.set('case', String(res.payload.case_no ?? ''))
    if (res.type === 'location') url.searchParams.set('loc', String(res.payload.poi_code ?? ''))
    router.push(`${pathname}?${url.searchParams.toString()}`)

    // 2) (옵션) store.selectWorklistRow / store.selectLocation로 즉시 하이라이트
  }}
/>
```

## 5) 테스트/검증 체크리스트
- 지도에서 POI 마커/라벨 표시 + 라벨 겹침 최소화
- 모바일 줌 낮을 때 라벨 숨김
- 3카드 클릭 시 URL 변경 + Worklist 필터 적용
- 검색: 키보드(↑/↓/Enter/Esc) + 결과 선택 시 링크 이동

