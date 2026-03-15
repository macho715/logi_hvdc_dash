판정: **예 — 네트워크맵은 `2트랙`으로 다시 설계해야 합니다.**
근거: 현재 전세계 맵은 공급망 가시성에는 맞지만, **UAE 내 운송·통관·창고·MOSB·현장 판단**에는 너무 넓습니다. Overview는 상태·이벤트·흐름 중심으로 설계해야 하고, 구현은 **waterfall 제거 → 번들 축소** 우선이 맞습니다.  
다음행동: **`Global Track` + `UAE Ops Track` 이중 구조로 나누고, Overview 기본값을 `UAE Ops`로 바꾸십시오.**

# 1. 최종 방향

기존:

```text
전세계 공급망 맵
```

새 설계:

```text
Track A = Global Supply Map
Track B = UAE Inland / Customs Network Map
```

그리고 UI는 이렇게 갑니다.

```text
[ Map Mode ]
Global | UAE Ops

[ Layer Toggle ]
Origin Arc  On/Off
Trips       On/Off
Customs     On/Off
WH          On/Off
MOSB        On/Off
Sites       On/Off
```

즉 사용자가 **change**도 가능하고, 세부 레이어는 **on/off**도 가능해야 합니다.

---

# 2. 왜 2트랙이어야 하는가

## Track A: Global

목적:

* Origin country
* Port/Air arrival
* 대외 공급 흐름

질문:

* 어디서 오고 있는가
* 어떤 POD로 들어오는가
* 어느 vendor/route가 느린가

## Track B: UAE Ops

목적:

* Port → Customs → WH → MOSB → Site
* 실제 운영 병목
* 현장 납품 리스크

질문:

* 통관이 어디서 막히는가
* WH dwell이 어디서 길어지는가
* MOSB 대기가 어디서 생기는가
* AGI/DAS offshore flow가 정상인가

**Overview의 기본 주연은 Track B여야 합니다.**

---

# 3. 스위치 설계

## 추천 구조

상단 헤더 오른쪽에:

```text
[ Global ]
[ UAE Ops ]
```

### 동작

* `Global` 선택

  * 전세계 origin arc
  * UAE inbound port focus
  * long-haul 공급망 강조

* `UAE Ops` 선택

  * UAE 내부 노드/간선만
  * Port / Customs / WH / MOSB / Site 관계망
  * truck/barge/site delivery 판단 중심

## 추가 토글

```text
[Origin Arc]
[Trips]
[Customs]
[Warehouses]
[MOSB]
[Sites]
```

---

# 4. UAE Ops Track에서 보여줄 노드

이 부분이 핵심입니다.

## 필수 노드

* **Port**

  * Khalifa Port
  * Mina Zayed
* **Air**

  * Abu Dhabi Airport
* **Customs**

  * Khalifa Customs
  * Mina Zayed Customs
  * AUH Customs
* **Warehouse**

  * DSV Al Markaz
  * 기타 운영 창고
* **Staging**

  * MOSB
* **Sites**

  * SHU
  * MIR
  * DAS
  * AGI

가정: 운영 창고의 정확한 노드 목록은 SSOT 기준으로 확정해야 합니다.

---

# 5. UAE Ops Track에서 보여줄 간선

## 엣지 타입

```text
Port → Customs
Customs → WH
Customs → Site
WH → MOSB
WH → Site
MOSB → DAS
MOSB → AGI
```

## 색상 의미

* 파랑: 일반 inbound
* 청록: customs cleared transit
* 앰버: warehouse staging
* 오렌지: MOSB staging
* 빨강: blocker / overdue / hold
* 보라: offshore critical flow

## 굵기 의미

* case volume
* shipment count
* tonnage 중 택1 고정

권장:
Overview는 **shipment count**,
상세 drilldown은 **tonnage** 지원.

---

# 6. Customs를 어떻게 표현할 것인가

이건 단순 badge가 아니라 **논리 노드**로 분리하는 편이 맞습니다.

## 이유

통관은 현재 물류 운영의 핵심 게이트입니다.
단순히 Port 노드에 흡수하면:

* hold
* pending docs
* cleared not dispatched
  를 구분하기 어렵습니다.

## 표현 방식

### 옵션 A

Port 옆에 offset된 작은 customs node

```text
Khalifa Port ── Khalifa Customs ── DSV WH
```

### 옵션 B

Port 노드 내부 badge

권장:
**A**

왜냐하면 네트워크 관계가 더 잘 보입니다.

---

# 7. MOSB 표현 방식

MOSB는 UAE Ops Track의 핵심입니다.

## 이유

AGI / DAS는 사실상

```text
Port → WH → MOSB → Site
```

또는

```text
Port → MOSB → Site
```

성격이 강합니다.

## 표시 규칙

* MOSB는 일반 warehouse와 다르게
* **중앙 허브 노드**
* 노드 크기 더 큼
* glow stronger
* pending volume / barge queue 표시

즉 창고 중 하나가 아니라 **offshore staging hub**로 보여야 합니다.

---

# 8. Overview 기본 화면 구조

## Global Track

```text
KPI
+ Global arcs
+ UAE POD summary
+ Origin mix
+ inbound risk
```

## UAE Ops Track

```text
KPI
+ Port/Customs/WH/MOSB/Site network
+ Site readiness
+ Mission Control
+ Flow summary
```

---

# 9. KPI도 트랙별로 달라져야 함

## Global KPI

* Total Shipments
* In Transit
* ETA Risk
* Critical POD
* Critical Mode
* Origin Count

## UAE Ops KPI

* Port Pending
* Customs Hold
* WH Dwell
* MOSB Pending
* Site Ready
* AGI/DAS Risk

즉 같은 KPI strip을 쓰지 말고
**track별 KPI 세트**를 분리해야 합니다.

---

# 10. 기술 구조

## 상태

```ts
type MapTrack = 'global' | 'uae-ops'
```

```ts
interface MapLayerState {
  track: MapTrack
  showOriginArcs: boolean
  showTrips: boolean
  showCustoms: boolean
  showWarehouses: boolean
  showMosb: boolean
  showSites: boolean
}
```

## 추천 store

```ts
useMapViewStore()
```

---

# 11. 컴포넌트 구조

```text
components/overview/
├─ OverviewMap.tsx
├─ MapTrackSwitch.tsx
├─ MapLayerToggleBar.tsx
├─ MissionControl.tsx
└─ SiteDeliveryMatrix.tsx

components/map/layers/
├─ createGlobalArcLayer.ts
├─ createUaeRouteLayer.ts
├─ createTripsLayer.ts
├─ createNodeLayer.ts
├─ createStatusRingLayer.ts
├─ createCustomsNodeLayer.ts
└─ createLabelLayer.ts
```

---

# 12. 레이어 설계

## Global Track 레이어

1. basemap
2. origin arc
3. active trips
4. UAE entry nodes
5. labels

## UAE Ops Track 레이어

1. basemap
2. UAE route edges
3. customs nodes
4. warehouse nodes
5. MOSB node
6. site nodes
7. status rings
8. trip animation
9. labels

---

# 13. OverviewMap.tsx 조립 방식

핵심은 **track별 layer composition 분기**입니다.

```tsx
const layers =
  track === 'global'
    ? [
        createGlobalArcLayer(...),
        createTripsLayer(...),
        ...createNodeLayer(globalNodes, ...),
        createLabelLayer(globalNodes, ...)
      ]
    : [
        createUaeRouteLayer(...),
        ...createCustomsNodeLayer(...),
        ...createNodeLayer(uaeNodes, ...),
        ...createStatusRingLayer(uaeNodes, ...),
        createTripsLayer(uaeTrips, ...),
        createLabelLayer(uaeNodes, ...)
      ]
```

---

# 14. API 분리

## Global

```text
/api/map/global-summary
/api/map/global-trips
/api/map/origin-arcs
```

## UAE Ops

```text
/api/map/uae-network
/api/map/uae-trips
/api/map/uae-customs
/api/map/uae-site-readiness
```

---

# 15. 데이터 모델

## UAE node

```ts
interface UaeNode {
  id: string
  type: 'port' | 'customs' | 'warehouse' | 'mosb' | 'site'
  name: string
  code?: string
  lat: number
  lon: number
  risk: 'ok' | 'warn' | 'critical'
  volume: number
  siteCode?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
}
```

## UAE edge

```ts
interface UaeEdge {
  id: string
  sourceId: string
  targetId: string
  routeType:
    | 'port-customs'
    | 'customs-wh'
    | 'customs-site'
    | 'wh-mosb'
    | 'wh-site'
    | 'mosb-site'
  flowCode: 0 | 1 | 2 | 3 | 4 | 5
  volume: number
  risk: 'ok' | 'warn' | 'critical'
  active: boolean
}
```

---

# 16. UX 규칙

## 기본값

* Overview 처음 진입 시:

```text
track = 'uae-ops'
```

## 이유

사용자는 대부분

* 오늘 통관
* 오늘 현장
* 오늘 MOSB
* 오늘 지연
  을 보려는 것이지
  항상 전세계 origin arc를 먼저 보려는 것이 아닙니다.

## Global track은 어디에 적합한가

* Logistics Chain
* Supply summary
* executive brief

---

# 17. 시각 스타일 규칙

## Global Track

* arc 많음
* 얇고 반투명
* global overview 느낌

## UAE Ops Track

* edge fewer but thicker
* node stronger
* customs / mosb / site 강조
* path clarity 우선

즉 UAE Track은
**decorative arc map**
가 아니라
**operational network graph**
여야 합니다.

---

# 18. 가장 좋은 UI

```text
[ Overview ]
          [ Global | UAE Ops ]
          [Origin Arc]
          [Trips]
          [Customs]
          [WH]
          [MOSB]
          [Sites]
```

### 동작

* Global 선택 → world view
* UAE Ops 선택 → UAE network
* 나머지는 세부 layer on/off

이게 사용성도 가장 좋습니다.

---

# 19. 구현 순서

1. `MapTrackSwitch` 추가
2. store에 `track` 상태 추가
3. API를 global / uae 분리
4. `createUaeRouteLayer.ts` 추가
5. `createCustomsNodeLayer.ts` 추가
6. Overview 기본값 `uae-ops`
7. KPI strip도 track별 분기
8. Mission Control을 UAE Ops와 강결합

---

# 20. 최종 한 줄

**기존 맵은 공급망 맵으로 유지하고, 새 맵은 UAE 내 운송·통관·현장 네트워크맵으로 분리해야 합니다.**
즉 정답은:

```text
1개 맵 개선 ❌
2개 트랙 분리 ⭕
```

원하시면 다음 답변에서 바로
**`MapTrackSwitch.tsx + createUaeRouteLayer.ts + createCustomsNodeLayer.ts` 실전 코드**로 이어서 드리겠습니다.
