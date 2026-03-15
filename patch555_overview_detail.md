판정: **예 — 실제 적용용 문구 patch로 바로 정리할 수 있습니다. 다만 `OverviewBottomPanel`은 현재 active overview 계약에 포함되지 않으므로, 적용 우선순위는 `OverviewPageClient / KpiStripCards / MissionControl / SiteDeliveryMatrix`가 먼저입니다.** `OverviewPageClient`의 현재 active 7-row는 `OverviewToolbar → ProgramFilterBar → KpiStripCards → ChainRibbonStrip → OverviewMap + MissionControl → SiteDeliveryMatrix → OpenRadarTable + OpsSnapshot`이고, `OverviewBottomPanel`은 보존만 된 inactive 파일입니다.   
다음행동: **아래 문구를 그대로 교체하고, `OverviewBottomPanel`은 재활성화할 때만 적용하십시오.**

# 1) `OverviewPageClient.tsx`용 실제 문구 patch

현재 active row 구성은 유지하고, 문구 의미만 `voyage-first`로 맞추는 것이 맞습니다. `OverviewPageClient`는 이미 `KpiStripCards`, `MissionControl`, `SiteDeliveryMatrix`, `OpenRadarTable`, `OpsSnapshot`를 직접 조합하고 있으므로, 여기서는 제목/설명용 상수만 교체하면 됩니다. 

## 교체 문구

```ts
// page meta / local labels
const OVERVIEW_TITLE = 'HVDC CONTROL TOWER'
const OVERVIEW_SUBTITLE = 'Voyage-first overview for Shipping → Customs → Storage → MOSB → Site'
const OVERVIEW_SEARCH_PLACEHOLDER = 'Search HVDC / Vendor / POL / POD / Site...'

// mode helper text
const PROGRAM_MODE_DESC = 'Global voyage allocation and site distribution'
const OPS_MODE_DESC = 'UAE execution path: Port/Air → Customs → WH(optional) → MOSB(optional) → Site'

// section intent
const MAP_SECTION_DESC = 'Overview voyage map'
const MATRIX_SECTION_DESC = 'Site delivery matrix'
const MISSION_SECTION_DESC = 'Alerts, action queue, and next milestones'
```

## 교체 포인트

* `selectedShipmentId`는 유지
* `dashMode`는 유지
* `filterSite`는 유지
* row 순서는 절대 변경하지 않음
* Overview 의미는 **warehouse-first**가 아니라 **voyage-first**로 설명

---

# 2) `KpiStripCards.tsx`용 실제 문구 patch

현재 overview는 `hero metrics`를 상단 KPI로 쓰는 구조입니다. 따라서 여기서 `Flow Code`, `warehouse stock`, `AGI readiness 단독 KPI` 같은 문구를 빼고, `hvdc all status` 기반 항차 KPI로 고정하는 것이 맞습니다.  

## 카드 6개 제목

```ts
const KPI_LABELS = [
  'TOTAL SHIPMENTS',
  'FINAL DELIVERED',
  'CUSTOMS ACTIVE',
  'OVERDUE ETA',
  'WH STAGING',
  'MOSB PENDING',
]
```

## 카드별 sublabel

```ts
const KPI_SUBLABELS = {
  total_shipments: 'All Vendors / All POD',
  final_delivered: 'Final delivery milestone reached',
  customs_active: 'Customs started, not yet closed',
  overdue_eta: 'ETA passed and not finally delivered',
  wh_staging: 'Optional staging node only',
  mosb_pending: 'Offshore routing pending for DAS / AGI',
}
```

## 카드별 badge / helper text

```ts
const KPI_HELPERS = {
  total_shipments: 'Voyage-level count',
  final_delivered: 'Delivered share',
  customs_active: 'In Progress / Hold',
  overdue_eta: 'Needs timeline review',
  wh_staging: 'Not all cargo passes WH',
  mosb_pending: 'Island routing watchlist',
}
```

## 번역 키 교체 권장

기존 `translations.ts`의 `kpi` 섹션은 아직 `inTransit / atWarehouse / delayed / delivered` 중심입니다. 이것을 아래로 바꾸는 편이 맞습니다. 현재 번역 구조가 존재하므로 이 키를 확장하면 됩니다. 

```ts
kpi: {
  totalShipments: 'Total Shipments' / '전체 항차',
  finalDelivered: 'Final Delivered' / '최종 납품',
  customsActive: 'Customs Active' / '통관 진행',
  overdueEta: 'Overdue ETA' / 'ETA 초과',
  whStaging: 'WH Staging' / 'WH 경유',
  mosbPending: 'MOSB Pending' / 'MOSB 대기',
}
```

---

# 3) `SiteDeliveryMatrix.tsx`용 실제 문구 patch

`SiteDeliveryMatrix`는 active overview contract에서 **site readiness drilldown** 역할입니다. 따라서 카드 구조는 유지하되, 각 카드가 `배정 / 납품 / 대기 / MOSB 대기 / 초과 / 위험도`를 보여주게 바꾸는 것이 맞습니다. `translations.ts`에도 이미 그 키들이 준비돼 있습니다.  

## 섹션 제목

```ts
const SECTION_TITLE = 'Site Delivery Matrix'
const SECTION_SUBTITLE = 'Planned vs actual site progress by voyage milestone'
```

## SHU 카드

```ts
const SHU_CARD = {
  title: 'SHU',
  line1Label: 'Assigned',
  line2Label: 'Delivered',
  line3Label: 'Pending',
  line4Label: 'Overdue',
  footer: 'Delivered / Assigned %',
}
```

## MIR 카드

```ts
const MIR_CARD = {
  title: 'MIR',
  line1Label: 'Assigned',
  line2Label: 'Delivered',
  line3Label: 'Pending',
  line4Label: 'Overdue',
  footer: 'Delivered / Assigned %',
}
```

## DAS 카드

```ts
const DAS_CARD = {
  title: 'DAS',
  line1Label: 'Assigned',
  line2Label: 'Delivered',
  line3Label: 'MOSB Pending',
  line4Label: 'Overdue',
  footer: 'Offshore routing progress',
}
```

## AGI 대형 카드

```ts
const AGI_CARD = {
  title: 'AGI OFFSHORE FOCUS',
  heroLabel: 'Assigned',
  sub1Label: 'Delivered',
  sub2Label: 'MOSB Pending',
  sub3Label: 'Last Milestone',
  footer: 'Offshore execution focus',
}
```

## `translations.ts`에서 그대로 쓸 키

이미 존재:

* `siteMatrix.title`
* `siteMatrix.assigned`
* `siteMatrix.delivered`
* `siteMatrix.pending`
* `siteMatrix.mosbPending`
* `siteMatrix.overdue`
* `siteMatrix.risk` 

---

# 4) `MissionControl.tsx`용 실제 문구 patch

현재 active overview contract에서 `MissionControl`은 **alert stack / route summary / site readiness / selected shipment card** 역할입니다. 여기서는 `Flow Code`가 아니라 **voyage alert / action / next milestone** 언어를 써야 합니다. 

## 섹션 제목 3개

```ts
const MISSION_TITLES = {
  critical: 'Critical Alerts',
  queue: 'Action Queue',
  next72h: 'Next 72 Hours',
}
```

## `Critical Alerts` 카드 문구

```ts
const CRITICAL_ALERT_TEXT = [
  'Customs hold beyond SLA',
  'ETA overdue without final delivery',
  'Arrived POD but customs not started',
  'Site milestone reached but final delivery missing',
]
```

## `Action Queue` 카드 문구

```ts
const ACTION_QUEUE_TEXT = [
  'Customs cleared / dispatch pending',
  'MOSB required / not yet staged',
  'Planned site exists / actual milestone missing',
  'Vendor shipment with missing ETA or ATA',
]
```

## `Next 72 Hours` 카드 문구

```ts
const NEXT_72H_TEXT = [
  'ETA due within 72h',
  'ATA expected within 72h',
  'Customs close expected',
  'Site arrival planned',
]
```

## 선택 shipment 카드 상단 문구

```ts
const SELECTED_SHIPMENT_TEXT = {
  title: 'Selected Voyage',
  stage: 'Current Stage',
  route: 'Voyage Path',
  nextMilestone: 'Next Milestone',
  cta: 'Open detailed drilldown →',
}
```

## 번역 키 교체 권장

현재 `translations.ts`에는 `missionControl.title / critical / next72h / agiDasBlockers / actionQueue / noItems`가 있습니다. 여기서 `agiDasBlockers`는 너무 좁으므로 active surface에서는 아래 문구로 바꾸는 편이 맞습니다. 

```ts
missionControl: {
  title: 'Mission Control' / '미션 컨트롤',
  critical: 'Critical Alerts' / '핵심 경보',
  next72h: 'Next 72 Hours' / '향후 72시간',
  blockers: 'Voyage Blockers' / '항차 차단요인',
  actionQueue: 'Action Queue' / '조치 대기',
  noItems: 'No items' / '항목 없음',
}
```

---

# 5) `OverviewBottomPanel.tsx`용 실제 문구 patch

이 파일은 현재 **inactive**입니다. active overview는 row 7에서 `OpenRadarTable + OpsSnapshot`를 사용하고, `OverviewBottomPanel`은 현재 layout contract 바깥입니다. 그래서 이 문구 patch는 **재활성화 시에만** 쓰면 됩니다.  

## 재활성화 시 제목

```ts
const BOTTOM_PANEL_TITLE = 'Chain Funnel'
const BOTTOM_PANEL_SUBTITLE = 'Voyage stage counts across the logistics chain'
```

## 단계 라벨

현재 `translations.ts`에는 `chainRibbon.origin / portAir / customs / warehouse / mosb / site`가 이미 있습니다. 이 키를 그대로 쓰면 됩니다. 

```ts
const BOTTOM_CHAIN_LABELS = [
  'Shipping',
  'Port / Air',
  'Customs',
  'Warehouse',
  'MOSB',
  'Site',
]
```

## worklist 박스 제목

```ts
const BOTTOM_WORKLIST = {
  title: 'Priority Worklist',
  subtitle: 'Use the same URL contract as Pipeline / Cargo / Sites',
  empty: 'No priority items',
  noLocation: 'Location unknown',
  dueAt: 'Due',
}
```

## 금지 문구

```ts
// 사용 금지
'Flow 1'
'Flow 2'
'Flow 3'
'Flow 4'
'FC0'
'FC1'
'FC2'
'FC3'
'FC4'
'FC5'
```

---

# 6) 바로 붙여넣는 최종 문구 세트

## `KpiStripCards`

```ts
export const OVERVIEW_KPI_COPY = {
  totalShipments: {
    title: 'TOTAL SHIPMENTS',
    subtitle: 'All Vendors / All POD',
    helper: 'Voyage-level count',
  },
  finalDelivered: {
    title: 'FINAL DELIVERED',
    subtitle: 'Final delivery milestone reached',
    helper: 'Delivered share',
  },
  customsActive: {
    title: 'CUSTOMS ACTIVE',
    subtitle: 'Customs started, not yet closed',
    helper: 'In Progress / Hold',
  },
  overdueEta: {
    title: 'OVERDUE ETA',
    subtitle: 'ETA passed and not finally delivered',
    helper: 'Needs timeline review',
  },
  whStaging: {
    title: 'WH STAGING',
    subtitle: 'Optional staging node only',
    helper: 'Not all cargo passes WH',
  },
  mosbPending: {
    title: 'MOSB PENDING',
    subtitle: 'Offshore routing pending for DAS / AGI',
    helper: 'Island routing watchlist',
  },
}
```

## `SiteDeliveryMatrix`

```ts
export const SITE_MATRIX_COPY = {
  sectionTitle: 'Site Delivery Matrix',
  sectionSubtitle: 'Planned vs actual site progress by voyage milestone',
  shu: { title: 'SHU', a: 'Assigned', b: 'Delivered', c: 'Pending', d: 'Overdue', footer: 'Delivered / Assigned %' },
  mir: { title: 'MIR', a: 'Assigned', b: 'Delivered', c: 'Pending', d: 'Overdue', footer: 'Delivered / Assigned %' },
  das: { title: 'DAS', a: 'Assigned', b: 'Delivered', c: 'MOSB Pending', d: 'Overdue', footer: 'Offshore routing progress' },
  agi: { title: 'AGI OFFSHORE FOCUS', hero: 'Assigned', s1: 'Delivered', s2: 'MOSB Pending', s3: 'Last Milestone', footer: 'Offshore execution focus' },
}
```

## `MissionControl`

```ts
export const MISSION_CONTROL_COPY = {
  title: 'Mission Control',
  criticalTitle: 'Critical Alerts',
  queueTitle: 'Action Queue',
  next72hTitle: 'Next 72 Hours',
  criticalItems: [
    'Customs hold beyond SLA',
    'ETA overdue without final delivery',
    'Arrived POD but customs not started',
    'Site milestone reached but final delivery missing',
  ],
  queueItems: [
    'Customs cleared / dispatch pending',
    'MOSB required / not yet staged',
    'Planned site exists / actual milestone missing',
    'Vendor shipment with missing ETA or ATA',
  ],
  next72hItems: [
    'ETA due within 72h',
    'ATA expected within 72h',
    'Customs close expected',
    'Site arrival planned',
  ],
}
```

## `OverviewBottomPanel` 재활성화 시

```ts
export const OVERVIEW_BOTTOM_COPY = {
  title: 'Chain Funnel',
  subtitle: 'Voyage stage counts across the logistics chain',
  labels: ['Shipping', 'Port / Air', 'Customs', 'Warehouse', 'MOSB', 'Site'],
  worklistTitle: 'Priority Worklist',
  worklistSubtitle: 'Use the same URL contract as Pipeline / Cargo / Sites',
  empty: 'No priority items',
  dueAt: 'Due',
}
```

## 최종 결론

현재 active overview 기준으로는 **`OverviewPageClient / KpiStripCards / MissionControl / SiteDeliveryMatrix`만 바로 반영**하면 되고, `OverviewBottomPanel`은 **inactive 파일용 예비 문구 patch**로 보관하는 것이 정확합니다. active layout과 inactive 파일 구분은 repo 문서에 명시돼 있습니다.  

원하면 다음 단계로 **각 파일별 diff 형식**으로 바로 이어가겠습니다.
