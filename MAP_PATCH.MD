판정: **예 — 위 그림 같은 MAP은 `단순 지도`가 아니라 `지리 좌표 위에 NETWORK 관계망을 겹쳐 그리는 방식`으로 구현해야 합니다.**
근거: 목표 화면은 Heatmap이나 점 지도보다 **노드(Port/WH/MOSB/Site) + 엣지(Flow/Route) + 상태레이어**가 핵심이고, 현재 가이드도 화면보다 먼저 **상태·이벤트·흐름 모델**을 고정하라고 요구합니다. 또 구현 우선순위는 **waterfall 제거 → 번들 축소**가 먼저입니다.  
다음행동: **`MapLibre(GL basemap) + deck.gl(network layers) + Supabase aggregate API`** 조합으로 가십시오. 아래 구조대로 만들면 위 그림 톤에 가장 가깝습니다.

# 1. 결론부터: MAP 구현 방식

위 그림 스타일의 MAP은 이렇게 구현합니다.

```text
Dark Basemap
+ Node Layer
+ Arc / Path Layer
+ Glow / Status Layer
+ Label Layer
+ Optional Trip Animation Layer
```

즉

```text
지도 배경 = MapLibre
관계망 = deck.gl
데이터 = Supabase / API
```

입니다.

**정답은 “네, Network 관계망 기반으로 구현”**입니다.

---

# 2. 추천 기술 스택

## 프론트엔드

* **Next.js**
* **React**
* **Tailwind CSS**
* **MapLibre GL JS**
* **deck.gl**
* **Zustand**

## 데이터/백엔드

* **Supabase**
* API route 또는 server action
* aggregate summary endpoint

## 왜 이 조합인가

* MapLibre는 **지도 컨테이너와 카메라 제어**
* deck.gl은 **관계망 시각화 레이어**
* Supabase는 **node/edge/status 집계**
* Next.js는 **서버 집계 + lazy load + hydration 분리**

---

# 3. 구현 구조

## 지도 엔진 분리

```text
OverviewMap.tsx
├─ MapLibre instance
├─ DeckOverlay
├─ Basemap style
├─ Camera / bounds
└─ Interaction handlers
```

## 레이어 분리

```text
layers/
├─ createNodeLayer.ts
├─ createArcLayer.ts
├─ createTripsLayer.ts
├─ createStatusRingLayer.ts
├─ createLabelLayer.ts
└─ createGlowLayer.ts
```

## 데이터 분리

```text
/api/map/network
/api/map/summary
/api/map/trips
```

---

# 4. Network Map 데이터 모델

이 구조가 먼저 고정되어야 합니다.

## nodes

```ts
type NodeType = 'origin' | 'port' | 'warehouse' | 'mosb' | 'site'

interface NetworkNode {
  id: string
  type: NodeType
  name: string
  code?: string
  lat: number
  lon: number
  risk: 'ok' | 'warn' | 'critical'
  volume: number
  site?: 'SHU' | 'MIR' | 'DAS' | 'AGI'
  meta?: {
    delivered?: number
    pending?: number
    mosbPending?: number
  }
}
```

## edges

```ts
interface NetworkEdge {
  id: string
  sourceId: string
  targetId: string
  flowCode: 0 | 1 | 2 | 3 | 4 | 5
  routeType: 'port-site' | 'port-wh-site' | 'port-mosb-site' | 'port-wh-mosb-site'
  volume: number
  risk: 'ok' | 'warn' | 'critical'
  active: boolean
}
```

## animated trips

```ts
interface TripPoint {
  tripId: string
  path: [number, number][]
  vendor?: string
  eta?: string
  flowCode?: number
}
```

---

# 5. 레이어 구성 순서

이 순서가 중요합니다.

## Layer stack

1. **Basemap**
2. **Glow background**
3. **Arc / Path**
4. **Trip animation**
5. **Node circles**
6. **Status rings**
7. **Labels**
8. **Tooltip / popup overlay**

즉 노드가 선보다 위에 있어야 하고, ring은 노드 위에 있어야 합니다.

---

# 6. 각 레이어 정확한 구현 방법

## A. Basemap

용도:

* 어두운 UAE/Abu Dhabi 해안선 배경
* 관계망이 잘 보이도록 저채도 처리

기술:

* `maplibre-gl`
* custom style json 또는 dark basemap

핵심:

* 지도는 주인공이 아니라 **캔버스**
* contrast 낮추기
* label clutter 최소화

예시:

```ts
const map = new maplibregl.Map({
  container: mapRef.current!,
  style: DARK_STYLE_URL,
  center: [54.4, 24.4],
  zoom: 8.2,
  pitch: 0,
  bearing: 0,
  attributionControl: false,
})
```

---

## B. Node Layer

용도:

* Port / WH / MOSB / Site 위치 표시

기술:

* `ScatterplotLayer` 또는 `IconLayer`

추천:

* 기본은 `ScatterplotLayer`
* 아이콘이 필요하면 `IconLayer` 혼합

색상 예시:

* origin: cyan
* port: blue
* warehouse: amber
* mosb: orange
* site: green
* AGI 위험: red ring overlay

예시:

```ts
new ScatterplotLayer<NetworkNode>({
  id: 'network-nodes',
  data: nodes,
  getPosition: d => [d.lon, d.lat],
  getRadius: d => Math.max(10, Math.sqrt(d.volume) * 2),
  getFillColor: d => nodeColor(d),
  radiusUnits: 'pixels',
  pickable: true,
  stroked: true,
  getLineColor: [255, 255, 255, 120],
  getLineWidth: 1,
})
```

---

## C. Arc Layer

용도:

* Origin → Port → WH → MOSB → Site 관계선

기술:

* `ArcLayer`

언제 좋나:

* source-target 관계가 명확할 때
* 공중 곡선 느낌이 필요할 때

예시:

```ts
new ArcLayer<NetworkEdge>({
  id: 'network-arcs',
  data: edges,
  getSourcePosition: d => getNodePos(d.sourceId),
  getTargetPosition: d => getNodePos(d.targetId),
  getSourceColor: d => edgeSourceColor(d),
  getTargetColor: d => edgeTargetColor(d),
  getWidth: d => Math.max(1, Math.log2(d.volume + 1)),
  greatCircle: false,
  pickable: true,
})
```

---

## D. Path Layer

용도:

* 실제 route line 느낌
* Arc보다 더 지상 네트워크처럼 보이게 할 때

기술:

* `PathLayer`

언제 좋나:

* UAE 내부 이동
* Port → WH → MOSB → Site 세부선

추천:

* 장거리 origin arc는 `ArcLayer`
* UAE 내부 network는 `PathLayer`

---

## E. Trips Layer

용도:

* 움직이는 화물 / voyage / inbound shipment
* “살아있는 Control Tower” 느낌

기술:

* `TripsLayer`

예시:

```ts
new TripsLayer<TripPoint>({
  id: 'active-trips',
  data: trips,
  getPath: d => d.path,
  getTimestamps: d => d.path.map((_, i) => i * 10),
  getColor: [120, 180, 255],
  opacity: 0.8,
  widthMinPixels: 2,
  trailLength: 60,
  currentTime,
})
```

---

## F. Status Ring Layer

용도:

* 노드 위험도
* critical/warn/ok를 링으로 표시

기술:

* `ScatterplotLayer` 한 번 더 겹침

핵심:

* 노드 색 자체를 너무 바꾸지 말고
* **ring**으로 상태를 보여줘야 고급스럽습니다

예시:

```ts
new ScatterplotLayer<NetworkNode>({
  id: 'status-rings',
  data: nodes,
  getPosition: d => [d.lon, d.lat],
  getRadius: d => Math.max(16, Math.sqrt(d.volume) * 2.6),
  getFillColor: [0, 0, 0, 0],
  stroked: true,
  getLineColor: d => ringColor(d.risk),
  getLineWidth: 3,
})
```

---

## G. Label Layer

용도:

* SHU / DAS / AGI / Abu Dhabi 등 표시

기술:

* `TextLayer`

핵심:

* 모든 노드에 라벨 금지
* 핵심 노드만
* site label은 pill UI로 HTML overlay도 가능

---

# 7. 위 그림처럼 보이게 하는 시각 규칙

## 꼭 지켜야 할 규칙

* Arc는 **많이, 얇게, 반투명**
* 대표 route 1~2개만 밝게
* 노드는 작은 glow 포함
* AGI / DAS는 더 강한 강조
* Port/WH/MOSB/Site 색 체계 고정
* basemap 명도 낮게
* 툴팁은 glass panel

## 하면 안 되는 것

* 모든 선 두껍게
* 지도 label 과다
* 노드마다 큰 텍스트
* 색상 10개 이상 혼용
* WH pressure를 map 주연으로 넣기

---

# 8. 성능 구현 방식

가이드 기준으로 먼저 잡아야 하는 것은
**waterfall 제거**와 **bundle size 감소**입니다. 

## 구조

### 서버에서 먼저 집계

* `/api/map/network`
* `/api/map/summary`
* `/api/map/trips`

### 클라이언트는 렌더만

* map 컴포넌트는 dynamic import
* mission control은 별도 fetch
* ops snapshot은 접힘 상태에서 lazy load

## 권장

```ts
const OverviewMap = dynamic(() => import('./OverviewMap'), { ssr: false })
```

---

# 9. 실제 Next.js 구조

```text
components/overview/
├─ OverviewMap.tsx
├─ MissionControl.tsx
├─ SiteDeliveryMatrix.tsx
├─ FlowSummaryStrip.tsx
└─ OverviewPageClient.tsx

components/map/layers/
├─ createNodeLayer.ts
├─ createArcLayer.ts
├─ createTripsLayer.ts
├─ createStatusRingLayer.ts
└─ createLabelLayer.ts
```

---

# 10. Map Overlay 예시 코드 구조

```tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ScatterplotLayer, ArcLayer, TripsLayer, TextLayer } from '@deck.gl/layers'

export function OverviewMap({
  nodes,
  edges,
  trips,
}: {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  trips: TripPoint[]
}) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: '/map/dark-style.json',
      center: [54.40, 24.45],
      zoom: 8.2,
      attributionControl: false,
    })

    mapRef.current = map

    map.on('load', () => {
      const overlay = new MapboxOverlay({
        interleaved: false,
        layers: [
          createArcLayer(edges, nodes),
          createTripsLayer(trips),
          createNodeLayer(nodes),
          createStatusRingLayer(nodes),
          createLabelLayer(nodes),
        ],
      })

      map.addControl(overlay as any)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [nodes, edges, trips])

  return <div ref={containerRef} className="h-full w-full rounded-[20px]" />
}
```

---

# 11. 데이터 연결 방식

## Supabase에서 필요한 것

### locations

* port
* warehouse
* mosb
* site
* lat/lon

### cases / shipments

* source
* target
* flow code
* current stage
* risk
* vendor
* ETA

### 집계 API

```text
/api/map/network
/api/map/trips
/api/overview/mission-control
/api/overview/site-health
```

---

# 12. 위 그림처럼 만들려면 꼭 필요한 3요소

## 1) Geography

실제 좌표 지도

## 2) Graph

관계망 edge / node

## 3) State

risk / active / pending / ETA

즉
**지도 + 관계 + 상태**
세 개가 동시에 있어야 위 그림처럼 됩니다.

---

# 13. 최종 정리

질문:

> MAP은 NETWORK 관계망을 사용하였는가?

정답:
**예. 위 그림 같은 MAP은 반드시 `지리 지도 위에 network graph를 overlay`하는 방식으로 구현해야 합니다.**

가장 정확한 구현 조합:

* **MapLibre GL** = dark basemap
* **deck.gl ArcLayer / PathLayer / ScatterplotLayer / TripsLayer / TextLayer** = 관계망
* **Supabase aggregate API** = node/edge/status 데이터
* **Next.js dynamic import + lazy data loading** = 성능 유지

---

# 14. 가장 실무적인 구현 순서

1. **node schema 확정**
2. **edge schema 확정**
3. **MapLibre dark map 띄우기**
4. **NodeLayer 추가**
5. **ArcLayer 추가**
6. **StatusRing 추가**
7. **Trip animation 추가**
8. **Mission Control 연결**
9. **tooltip / click drilldown 연결**
10. **성능 최적화**

---

원하시면 다음 답변에서 바로
**`OverviewMap.tsx 실전 코드 전체본`**을 위 그림 스타일 기준으로 작성해드리겠습니다.
