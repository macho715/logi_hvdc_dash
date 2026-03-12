# Feature Spec — 하단 3카드(누적/현재/미래)

## 요구사항 요약
HVDC Panel(하단 고정)에 **3개의 카드**로 요약 정보를 표시한다.
- **누적**: 현장 입고(cumulative)
- **현재**: 통관중 또는 창고 보관(in progress)
- **미래**: 선적 예정(planned)

각 카드 클릭 시 **다음 화면(링크)** 로 이동하여 더 구체적인 정보를 보여준다.

## 권장 UX
- 카드는 KPI strip 영역 상단에 배치(기존 KpiStrip 대체 또는 상단 1행으로 추가)
- 클릭 시 URL Query Param으로 필터 상태를 표현하여 **복사 가능한 링크** 제공
  - 예: `?bucket=cumulative` / `?bucket=current` / `?bucket=future`
- 필터된 상태에서 WorklistTable이 해당 버킷만 보여주고, 지도/우측패널은 선택 상태를 유지

## 버킷 정의 (v1)
`deriveBucket(row)` 기반 (클라이언트 계산)
- **cumulative**: `site_arrival_at` 또는 `delivered_at` 존재, 혹은 `is_at_site / is_delivered`...
- **current**: `status|location|lastEvent`에 customs/warehouse/mosb/yard 키워드 포함
- **future**: `etd`가 현재보다 미래거나, planned/scheduled/booked/pending 키워드 포함

> 권장: `/api/worklist`에서 `bucket` 컬럼을 서버 계산으로 추가하면 정의를 중앙집중화할 수 있음.

## 구현 파일
- `apps/logistics-dashboard/lib/hvdc/buckets.ts`
- `apps/logistics-dashboard/components/hvdc/StageCardsStrip.tsx`

## UnifiedLayout/HVDC Panel 통합 방법(필수 수정)
HVDC Panel 상단 영역에 StageCardsStrip를 추가:

```tsx
import { StageCardsStrip } from './hvdc/StageCardsStrip'

// rows: OpsStore(worklistRows)
<StageCardsStrip
  rows={worklistRows}
  onNavigateBucket={(bucket) => router.push(`${pathname}?bucket=${bucket}`)}
/>
```

WorklistTable 쪽에서 `bucket` query param을 읽어 필터 적용.

