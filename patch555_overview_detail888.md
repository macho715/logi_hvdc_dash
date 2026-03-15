판정: **예 — 이번 범위를 `OverviewMap` 중심의 map-only patch로 고정하는 방향은 맞습니다. 다만 `UAE Ops`를 제대로 보이게 하려면, 지금 코드에서 가장 먼저 고쳐야 할 것은 “지도 트랙 상태가 실제 맵 레이어와 연결되지 않는 문제”입니다.**
근거: 현재 `OverviewPageClient`에는 이미 `dashMode('program'|'ops')` 상태가 있지만 `OverviewMap`에는 전달되지 않고, Row 5에서는 단순히 `<OverviewMap onNavigateIntent={...} />`만 렌더합니다. 반면 `OverviewMap` 내부는 현재 `origin arcs + active trips + POI/status/heatmap` 구조로만 동작하며, tooltip도 아직 `Flow X` 언어를 노출합니다.   
다음행동: **UAE 패치는 `OverviewMap.tsx`를 중심으로 ① track wiring, ② customs synthetic nodes, ③ UAE semantic edges, ④ tooltip/legend/footer 분기 순서로 자르십시오. KPI/API/backbone은 그대로 두면 됩니다.**

# 결론 먼저

지금 요청한 범위에서는 **전체 Overview 계약을 다시 엎는 것이 아니라**,
현재 map engine 위에 **`UAE Ops` 전용 시각 문법을 얹는 패치**가 정답입니다.

즉 이번 패치는 아래로 정의하면 됩니다.

```text
유지:
- OverviewPageClient shell
- KPI / MissionControl / SiteDeliveryMatrix
- 기존 deep-link 계약
- 기존 /api/shipments/trips, /api/chain/summary fetch 축

변경:
- OverviewMap 내부 레이어 스택
- track 분기(global / uae-ops)
- customs synthetic node
- UAE network edge semantics
- map legend / footer / tooltip wording
```

현재 Overview는 Row 5에서 `OverviewMap + MissionControl`로 분리되어 있으므로, 맵만 독립 패치하기 좋은 구조입니다. 

---

# 1) 현재 코드 기준 핵심 문제

## A. `program|ops` 상태가 맵에 연결되지 않음

`OverviewPageClient`에는 `dashMode`가 이미 존재하지만, `OverviewMap`에는 전달되지 않습니다.
그래서 화면 상단 모드 전환과 실제 맵 표시가 느슨하게 분리돼 있습니다. 

## B. 현재 맵은 “UAE 운영 관계망”이 아니라 “혼합 레이어”

현재 `OverviewMap`은 아래 레이어를 한꺼번에 올립니다.

* `createOriginArcLayer`
* `createGeofenceLayer`
* `createHeatmapLayer`
* `createEtaWedgeLayer`
* `createLocationLayer`
* `createTripsLayer`
* `createStatusRingLayer`
* `createPoiLayers`

즉 `global 공급망`, `실시간 event heatmap`, `status ring`, `trip animation`, `POI`가 동시에 겹쳐져 있습니다.
이 구조는 map-only patch에는 좋지만, `UAE Ops`를 읽기 쉽게 만들기에는 너무 혼합돼 있습니다. 

## C. Tooltip이 아직 `Flow Code` 언어를 씀

현재 active trip tooltip은 다음 형태입니다.

* `Flow {n}`
* `flowCode >= 3 ? mosbRoute : directRoute`

하지만 repo changelog는 이미 Overview가 user-facing `Flow Code` 대신 plain-language route label로 바뀌었다고 명시합니다.
즉 UAE map에서도 `Flow 1/2/3/4`를 전면에 두면 안 됩니다.  

---

# 2) 이번 UAE 맵 패치의 정확한 목표

이번 패치의 목표는 **지도를 “예쁜 배경”에서 “운영 네트워크”로 바꾸는 것**입니다.

`UAE Ops`에서 사용자가 읽어야 하는 순서는 고정입니다.

```text
Port / Air
→ Customs
→ WH(optional)
→ MOSB(optional)
→ Site
```

여기서 핵심은 두 가지입니다.

1. **WH는 중심 허브가 아니다**
2. **DAS / AGI는 MOSB 경유가 강하게 읽혀야 한다**

즉 사용자는 지도를 보고 아래 5개를 바로 이해해야 합니다.

* 어느 UAE entry point로 들어오는가
* 어떤 customs를 거치는가
* direct 인가, WH staging 인가
* MOSB가 필요한가
* 최종 site가 어디인가

---

# 3) 파일 기준 패치 범위

## 반드시 건드릴 파일

| 파일                                                     | 패치 내용                                         |
| ------------------------------------------------------ | --------------------------------------------- |
| `components/overview/OverviewMap.tsx`                  | 핵심 track 분기, 레이어 조합, tooltip/legend/footer 분기 |
| `components/map/MapLegend.tsx`                         | UAE 전용 node/route legend 분기                   |
| `components/map/layers/createTripsLayer.ts`            | UAE tooltip용 plain-language route metadata 노출 |
| `components/map/PoiLocationsLayer.tsx` 또는 유사 POI layer | customs / mosb / site label 밀도 제어             |
| `store/logisticsStore.ts`                              | map local toggle 추가 시 최소 상태 확장                |

현재 `OverviewMap.tsx`는 이미 `/api/shipments/trips`와 `/api/chain/summary`를 mount 시 fetch하고 있으므로, map-only patch는 이 컴포넌트 중심으로 닫을 수 있습니다. 

## 추가 생성 권장 파일

| 새 파일                                              | 역할                                         |
| ------------------------------------------------- | ------------------------------------------ |
| `components/map/layers/createUaeOpsEdgeLayer.ts`  | customs-aware semantic arc layer           |
| `components/map/layers/createCustomsNodeLayer.ts` | customs synthetic node scatter/label       |
| `lib/map/uaeOpsGraph.ts`                          | `TripData + POI` → UAE edge/node transform |
| `lib/map/customsAnchors.ts`                       | Khalifa/MZD/AUH customs anchor 좌표 SSOT     |

---

# 4) 가장 중요한 구조 변경 1개

## 지금

`OverviewMap`은 내부적으로 줌 기준 `origin arcs`, `heatmap`, `status`, `trips`, `poi`를 켜고 끄는 구조입니다.
하지만 **`global`과 `uae-ops`라는 “읽기 모드” 개념이 레이어 스택에 반영돼 있지 않습니다.** 

## 바꿀 것

`OverviewMap`에 track 개념을 넣으십시오.

```ts
type MapTrack = 'global' | 'uae-ops'
```

그리고 실제 레이어 조합을 분기합니다.

### Global

```text
origin arcs ON
trip lines ON
uae customs edges OFF
heatmap optional
status rings optional
```

### UAE Ops

```text
origin arcs OFF
uae semantic edges ON
customs nodes ON
trip lines reduced or re-styled
heatmap default OFF
location occupancy layer de-emphasized
```

### 권장 구현

가장 안전한 방식은 1-prop pass-through 입니다.

```tsx
<OverviewMap track={dashMode === 'program' ? 'global' : 'uae-ops'} ... />
```

엄밀히 말해 `OverviewPageClient`도 1줄 수정되지만, KPI/backbone을 바꾸는 것이 아니라 **기존 mode state를 map에 연결하는 wiring**이라 범위 충돌이 거의 없습니다. `dashMode`가 이미 존재한다는 점이 이 방법의 근거입니다. 

---

# 5) UAE 네트워크맵의 시각 문법

## 노드 체계

UAE 모드에서 노드는 아래 5종만 강하게 보여야 합니다.

| Node Type      | 색      |
| -------------- | ------ |
| Port / Airport | Blue   |
| Customs        | Cyan   |
| Warehouse      | Yellow |
| MOSB           | Orange |
| Site           | Green  |

현재 코드는 `POI`, `Location`, `Status ring`이 겹쳐 있어 의미가 분산됩니다.
UAE 모드에서는 `status location` 레이어보다 **semantic node layer**가 우선이어야 합니다. 

## 간선 체계

UAE 모드 간선은 아래 6개로 고정하는 것이 맞습니다.

```text
Port → Customs
Customs → WH
Customs → Site
Customs → MOSB
WH → Site
WH → MOSB
MOSB → Site
```

실사용 표현은 6색까지 안 가도 되지만, 최소한 아래 차이는 보여야 합니다.

* `Port→Customs`
* `Customs→WH`
* `Customs/WH→MOSB`
* `Direct to Site`
* `MOSB→DAS/AGI`

---

# 6) Customs synthetic node를 어떻게 넣을 것인가

이 부분이 UAE 패치의 핵심입니다.

현재 `OverviewMap`의 deep-link는

* site → `/sites`
* port → `/chain?focus=port`
* mosb → `/chain?focus=mosb`
* warehouse → `/chain?focus=warehouse`

로 연결됩니다.
하지만 **customs node는 아직 별도 취급이 없습니다.** `buildLocationIntent`, `buildPoiIntent`에도 customs 분기가 없습니다. 

## 권장 방식

synthetic customs node를 3개만 추가하십시오.

* `khalifa-customs`
* `mzd-customs`
* `auh-customs`

이 노드는 **실재 DB location**이 아니라 **맵용 semantic anchor**입니다.

## 좌표 규칙

* Khalifa Customs: Khalifa Port 옆 고정 offset
* MZ Customs: Mina Zayed 옆 고정 offset
* AUH Customs: AUH Airport 옆 고정 offset

즉 geocoding이 아니라 **design anchor**로 두는 것이 맞습니다.

## 클릭 규칙

```text
customs click → /chain?focus=customs
```

단, 현재 chain page가 `focus=customs`를 소화하는지 repo evidence는 확인되지 않았습니다.
그래서 이건 **가정**입니다.

```text
[ASSUMPTION] /chain page가 focus=customs를 허용하지 않으면, 1차 패치에서는 /chain?focus=port fallback으로 유지.
```

---

# 7) UAE 모드에서 무엇을 숨겨야 하는가

이게 중요합니다.
이번 패치는 “무엇을 추가할지”보다 “무엇을 약하게 만들지”가 더 중요합니다.

## 숨김/약화 대상

### 1. Origin arc

Global 전용입니다. UAE 모드에서는 끄십시오.
현재 `origin-country-arcs`는 zoom≤8일 때 노출되므로, UAE track에서는 강제 off가 맞습니다. 

### 2. Heatmap default

현재 heatmap은 event density 기반입니다. UAE 네트워크를 읽는 데 방해가 됩니다.
UAE 모드에서는 default off, toggle on 정도가 맞습니다. 

### 3. Location occupancy tooltip

현재 `location` tooltip은 Occupancy / Status / Updated를 보여줍니다.
이건 control-tower 네트워크가 아니라 시설 status card 해석입니다. UAE 모드에선 보조로 내려야 합니다. 

### 4. `Flow X` 텍스트

반드시 제거하십시오.
repo는 이미 plain-language route labels로 간다고 명시합니다. 

---

# 8) UAE 모드에서 trips layer를 어떻게 살릴 것인가

완전히 없애면 맵이 죽습니다.
하지만 현재처럼 `Flow Code` 중심으로 살리면 또 틀립니다.

## 권장 방식

`createTripsLayer`는 유지하되, **UAE semantic edge layer의 보조 애니메이션**으로 격하하십시오.

### 변경 규칙

* stroke opacity 낮춤
* width 낮춤
* highlighted shipment만 밝게
* tooltip 문구 교체

### 기존 tooltip

```text
Flow 3 · mosbRoute
ETA Mar 15
```

### 교체 tooltip

```text
Voyage: Prysmian / HVDC-ADOPT-SCT-0042
Route: Customs → WH → MOSB → DAS
ETA: Mar 15
Next: MOSB staging
```

즉 trip layer는 **“몇 번 Flow”가 아니라 “어디서 어디로 진행 중인가”**를 설명해야 합니다.

---

# 9) Map Legend는 UAE 모드에서 분기돼야 한다

현재 `MapLegend`는 `showArcs`, `showTrips` 정도만 받고 있는 구조로 보입니다.
이 상태로는 UAE semantic legend를 표현하기에 부족합니다. 

## 권장 변경

```ts
<MapLegend
  track={track}
  showArcs={...}
  showTrips={...}
  showHeatmap={...}
/>
```

## UAE legend 문구

```text
Nodes
- Port / Airport
- Customs
- Warehouse
- MOSB
- Site

Routes
- Port → Customs
- Customs → WH
- Customs → Site
- WH → MOSB
- MOSB → DAS / AGI
```

## Global legend 문구

기존 유지:

* Origin arc
* Trips
* POD / Airport
* Sites

---

# 10) Footer strip는 UAE 모드에서 반드시 있어야 한다

이건 좋은 패치 포인트입니다.
KPI는 못 건드려도, map footer는 `OverviewMap` 내부에서 additive overlay로 넣을 수 있습니다.

## UAE footer 추천

```text
Port Pending | Customs Hold | WH Staging | MOSB Pending | Site Ready
```

## 왜 필요한가

현재 map은 레이어는 많지만 **사용자가 읽는 요약 문장**이 없습니다.
footer가 있으면 지도 해석이 빨라집니다.

## 데이터 소스

이번 범위에서는 새 aggregate API를 만들지 않는 것이 기본이므로,
1차는 `tripsData`와 `status/location`에서 계산 가능한 수치만 쓰고, 부족한 값은 숨기는 것이 맞습니다.

```text
[ASSUMPTION] /api/shipments/trips payload에 customs/warehouse/mosb/site 단계 구분 필드가 부족하면 footer 일부 항목은 badge-only 또는 숨김 처리.
```

---

# 11) Deep-link는 이렇게 고정하면 됩니다

현재 코드의 deep-link contract는 유지하는 것이 맞습니다. `Overview map clicks now open the relevant dashboard page using the shared navigation contract`라는 changelog와도 맞습니다. 

## 고정 규칙

* site click → `/sites`
* port click → `/chain?focus=port`
* warehouse click → `/chain?focus=warehouse`
* mosb click → `/chain?focus=mosb`
* customs click → `/chain?focus=customs` 또는 fallback `/chain?focus=port`

---

# 12) 파일별 실제 패치 방향

## `OverviewMap.tsx`

가장 큰 수정 파일입니다.

### 추가

* `track: 'global' | 'uae-ops'` prop
* local overlay toggle state
* reduced-motion 감지
* mobile label density fallback
* `customsNodes`, `uaeEdges` memo

### 제거/약화

* UAE track에서 `createOriginArcLayer` 숨김
* UAE track에서 `location occupancy tooltip` 우선순위 낮춤
* `Flow Code` tooltip wording 제거

### 레이어 조합

```ts
if (track === 'uae-ops') {
  layers = [
    createUaeOpsEdgeLayer(...),
    createCustomsNodeLayer(...),
    createTripsLayer(...reducedStyle),
    createStatusRingLayer(...),
    ...poiLayers,
  ]
}
```

## `createTripsLayer.ts`

* `flowCode`를 user-facing text로 쓰지 않게 변경
* tooltip용 `routeLabel`, `nextMilestone`, `routeKind` 추가
* highlight shipment는 유지

## `MapLegend.tsx`

* `track` prop 추가
* UAE legend / Global legend 분기

## `lib/map/customsAnchors.ts`

* customs 좌표 SSOT

## `lib/map/uaeOpsGraph.ts`

* `TripData[] + POI_LOCATIONS` → semantic node/edge로 변환
* `AGI/DAS`는 MOSB 경유로 우선 라우팅
* `SHU/MIR`는 direct 또는 WH 경유

---

# 13) 구현 우선순위

## P1

1. `track` wiring
2. customs synthetic node
3. UAE edge layer
4. tooltip에서 `Flow` 제거
5. legend 분기

## P2

1. footer strip
2. reduced-motion/mobile fallback
3. line thickness / opacity 튜닝
4. selected voyage glow

## P3

1. label declutter
2. animated routing polish
3. mini map footer metrics
4. customs click deep-link 정식화

---

# 14) 가장 현실적인 리스크 3개

## 리스크 1

`/api/shipments/trips` payload가 UAE semantic path를 충분히 설명하지 못할 수 있습니다.

대응:

* 1차는 static semantic edge + trip highlight 혼합
* route counts는 과감히 줄임

## 리스크 2

`OverviewPageClient`의 `dashMode`와 map local state가 이중 관리될 수 있습니다.

대응:

* strict map-only를 고집하지 말고, `track` prop 1줄 pass-through로 정리

## 리스크 3

현재 POI/status/location 레이어가 동시에 살아 있어 UAE semantics가 약해질 수 있습니다.

대응:

* UAE track에서 `location/status` layer opacity 낮춤
* semantic edge/node가 최상위 시각 계층

---

# 최종 권장안

이번 UAE 패치는 이렇게 정의하면 가장 안전합니다.

```text
1) OverviewPageClient는 1줄만 수정
   dashMode -> OverviewMap.track 전달

2) OverviewMap은 global / uae-ops 분기
   - global: 기존 origin/trip 중심
   - uae-ops: customs-aware semantic network 중심

3) UAE track에서
   - origin arcs off
   - customs synthetic nodes on
   - semantic edges on
   - trip layer subdued
   - Flow wording 제거
   - legend/footer/tooltip 분기
```

최종 한 줄로 정리하면,

**이번 UAE 네트워크맵 패치는 “새 지도를 만드는 작업”이 아니라, 현재 `OverviewMap`의 레이어 우선순위를 `voyage/control-tower semantics`에 맞게 재편하는 작업”입니다.**

원하시면 다음 답변에서 바로 **`OverviewMap.tsx` 기준 파일별 diff 설계서`** 형태로 이어서 정리하겠습니다.
