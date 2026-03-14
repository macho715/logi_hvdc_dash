판정: **예 — `Overview 2.0`은 `창고 중심 화면`이 아니라 `Program Overview + Ops Snapshot` 2층 구조로 가야 합니다.**
근거: 현재 repo README는 Overview를 `KPI 카드 + 지도 + 실시간 피드`로 정의하고 있고, 원 설계 문서는 화면의 중심축을 `원산지 → 항구/공항 → 창고 → MOSB → 4개 현장` 체인으로 잡고 있습니다. 즉 2.0의 핵심은 새 위젯 추가가 아니라 **warehouse-first → chain-first** 전환입니다. ([GitHub][1])
다음행동: 아래 wireframe 기준으로 `program_summary_v2(hvdc all status)`와 `ops_snapshot_v1(wh status)`를 분리해 Overview 상·하단에 배치하십시오.

## Overview 2.0 와이어프레임

### 1) 권장안 — Desktop 12-column

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HVDC Overview 2.0                               [Program ●][Ops ○]   [Project ▼][Vendor ▼][Site ▼][72h ▼] │
│                                                  [Count ● / Value ○]                    Updated 2026-03-14  │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PROGRAM BAR (from hvdc all status)                                                                         │
│ [Total Shipments] [Final Delivered] [Open/Anomaly] [Overdue ETA] [Critical POD by Value] [Critical Mode] │
│ [AGI Risk] [Data Freshness]                                                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CHAIN FUNNEL                                                                                               │
│ Origin ─────▶ Port/Air ─────▶ Customs ─────▶ Warehouse ─────▶ MOSB ─────▶ Site                            │
│ count / share / delta / risk                                                                              │
│ KR·EU mix      Khalifa·Mina·AUH     Cleared / Hold      Indoor/Outdoor      AGI/DAS only      SHU/MIR/... │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LEFT 8 cols                                             │ RIGHT 4 cols                                      │
│ NETWORK MAP                                             │ MISSION CONTROL                                    │
│ - UAE network map                                       │ 1. Critical exceptions                             │
│ - Port / WH / MOSB / Site nodes                         │ 2. Next 72h arrivals / departures                  │
│ - Flow thickness by active cargo                        │ 3. AGI / DAS blockers                              │
│ - Mini global inset for origin countries                │ 4. Top 5 action queue                              │
│ - Click node → filter rest of page                      │ 5. Escalation owner / due                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SITE DELIVERY MATRIX                                                                                    │
│ [SHU] Assigned / Delivered / Pending / Risk                                                               │
│ [MIR] Assigned / Delivered / Pending / Risk                                                               │
│ [DAS] Assigned / Delivered / MOSB Pending / Risk                                                          │
│ [AGI] Assigned / Delivered / MOSB Pending / Overdue / Risk                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ LEFT 7 cols                                             │ RIGHT 5 cols                                      │
│ OPEN RADAR / BOTTLENECK TABLE                            │ OPS SNAPSHOT (from wh status)                      │
│ - Open items by stage                                    │ - WH pressure                                      │
│ - Overdue ETA                                            │ - Active worklist                                  │
│ - Customs cleared / dispatch pending                     │ - Exception board                                  │
│ - Final delivery missing                                 │ - Recent event feed                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM STRIP                                                                                               │
│ [Recent Voyages Timeline]   [Vendor concentration]   [POD count/value toggle]   [Export CSV / PNG]        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2) 이 구조가 맞는 이유

현재 repo는 이미 **Overview / Pipeline / Sites / Cargo**로 역할을 나눠 두었기 때문에, Overview는 세부 테이블이 아니라 **프로젝트 전체 판단 화면**이 되는 편이 맞습니다. 원 설계도 `지도 개요`, `물류 파이프라인`, `현장 현황`, `화물 목록`을 분리해 chain narrative를 먼저 보여주도록 잡고 있습니다. ([GitHub][1])

또한 `hvdc all status` 재확인 기준으로는 program 단위 판단 포인트가 `shipment / milestone / overdue / anomaly / POD / mode / site risk`에 있고, `wh status`는 `case / location / SQM / warehouse pressure / worklist`에 가깝습니다. 그래서 두 층을 한 카드열에 섞지 말고 **상단은 program, 하단은 ops**로 나누는 것이 해석 오류를 줄입니다.

---

## 3) 블록별 역할 정의

| No | Block                | 목적                   | 주 데이터                    | 클릭 시 동작                 |
| -: | -------------------- | -------------------- | ------------------------ | ----------------------- |
|  1 | Program Bar          | 프로젝트 전체 상태 8초 판독     | `hvdc all status`        | Count/Value 토글          |
|  2 | Chain Funnel         | 병목 stage 식별          | milestone stage engine   | stage filter 적용         |
|  3 | Network Map          | node/route 시각화       | port/WH/MOSB/site geo    | node 클릭 시 연쇄 필터         |
|  4 | Mission Control      | 오늘 해야 할 일 표시         | overdue/anomaly/worklist | owner 기준 drill-down     |
|  5 | Site Delivery Matrix | SHU/MIR/DAS/AGI 비교   | site assignment/delivery | site focus mode 전환      |
|  6 | Open Radar           | 열린 이슈만 압축            | open items only          | priority sort           |
|  7 | Ops Snapshot         | warehouse/case 운영 현황 | `wh status`              | existing worklist reuse |

---

## 4) KPI 카드 문구까지 포함한 상단부 초안

### Program Bar

* **Total Shipments**
* **Final Delivered**
* **Open / Anomaly**
* **Overdue ETA**
* **Critical POD (Value)**
* **Critical Mode (Value)**
* **AGI Risk**
* **Data Freshness**

### Chain Funnel

* **Origin**
* **Port / Air**
* **Customs**
* **Warehouse**
* **MOSB**
* **Site**

현재 Overview가 `KPI 카드 + 지도 + 실시간 피드`로 정의돼 있으므로, 2.0에서도 그 골격은 유지하되 KPI 의미를 `warehouse pressure` 중심에서 `chain + risk` 중심으로 바꾸는 것이 자연스럽습니다. ([GitHub][1])

---

## 5) 추천 레이아웃 비율

### Desktop

* Header: `80px`
* Program Bar: `120px`
* Chain Funnel: `96px`
* Main Split: `8 / 4`
* Site Matrix: `4 equal cards`
* Bottom Split: `7 / 5`

### Tablet

* Map 위, Mission Control 아래
* Site Matrix 2x2
* Open Radar와 Ops Snapshot 세로 적층

### Mobile

* Program Bar 2열 카드
* Funnel은 horizontal scroll
* Map은 collapse
* Mission Control이 최상단 우선

---

## 6) 컴포넌트 스펙 요약

### Header

* 좌측: `Overview 2.0`
* 중앙: `Program / Ops` segmented control
* 우측: `Project / Vendor / Site / Horizon / Count-Value / Updated`

### Chain Funnel 카드

각 노드는 아래 4줄 고정:

1. Stage 명
2. Count
3. Share %
4. Risk badge

### Mission Control

순서 고정:

1. `Critical`
2. `72h`
3. `AGI/DAS`
4. `Action Queue`

### Site Matrix

각 카드 고정 필드:

* Assigned
* Delivered
* Pending
* MOSB Pending
* Overdue
* Risk

---

## 7) 색상/시각 계층

### 상태색

* 정상: `blue / slate`
* 주의: `amber`
* 지연/누락: `red`
* 완료: `green`

### 사용 원칙

* **상단 KPI는 진한 단색 배경 최소화**
* **red는 open/anomaly에만 제한**
* map의 node 색상은 node type 기준, 위험은 ring/badge로 분리
* `Count / Value`는 같은 차트 안에서 toggle만 허용, 동시 혼합 표시는 금지

현재 화면처럼 예외 카드가 상단 시선을 먼저 빼앗는 구조보다, 상단은 **중립적 chain 요약**, 우측은 **행동 유도형 alert**로 분리하는 편이 hierarchy가 더 명확합니다.

---

## 8) 접근성 메모

이 화면은 sticky filter, map, 우측 패널이 동시에 있기 때문에 WCAG 2.2 기준을 초기에 박아두는 편이 좋습니다.

* 포커스 이동 시 sticky header나 floating panel이 focus 대상을 가리면 안 됩니다. WCAG 2.2의 **Focus Not Obscured**가 바로 이 상황을 다룹니다. ([W3C][2])
* map drag 기반 인터랙션만 두면 안 되고, `Zoom + / -`, `Fit UAE`, `Node list jump` 같은 단일 pointer 대체 수단이 있어야 합니다. 이는 **Dragging Movements** 기준과 맞닿아 있습니다. ([W3C][2])
* 상단 filter chip, toggle, badge button은 최소 `24x24 CSS px` 이상을 기본값으로 잡는 편이 맞습니다. **Target Size (Minimum)** 기준입니다. ([W3C][2])

---

## 9) 성능 메모

이 화면은 map + KPI + feed + worklist를 동시에 올리기 때문에, 구현 우선순위는 **request waterfall 제거**와 **bundle size 축소**가 먼저입니다. Vercel도 React 최적화에서 이 두 가지를 가장 먼저 처리하라고 권고합니다. ([Vercel][3])

따라서:

* `Program Bar + Funnel`은 server aggregate 1회
* `Map`은 dynamic import
* `Ops Snapshot`은 lazy load
* `Recent feed`는 deferred stream
  구조가 적절합니다. 이 방식이 현재 Next.js/React 스택과도 잘 맞습니다. repo README 기준 스택이 Next.js 16, React 19, Tailwind, deck.gl, Recharts이기 때문입니다. ([GitHub][1])

---

## 10) 구현 순서

1. `program_summary_v2` 스키마 정의
2. Header + Program Bar 고정
3. Chain Funnel 추가
4. Mission Control 교체
5. Site Matrix 추가
6. 기존 map을 Network Map으로 확장
7. 하단에 `wh status` 기반 Ops Snapshot 이관

---

## 11) 가장 실무적인 한 줄

**첫 화면 1초 인상은 `창고`가 아니라 `프로젝트 전체 chain`이어야 하고, 창고/예외/worklist는 그 아래 `Ops Snapshot`으로 내려가야 합니다.**

다음 단계는 이 와이어프레임을 기준으로 **Tailwind/React div 구조**로 떨어뜨리는 것입니다.

[1]: https://raw.githubusercontent.com/macho715/logi_hvdc_dash/main/README.md "raw.githubusercontent.com"
[2]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[3]: https://vercel.com/blog/introducing-react-best-practices "Introducing: React Best Practices - Vercel"
