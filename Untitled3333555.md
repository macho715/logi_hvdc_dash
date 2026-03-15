판정: **예 — `AGENTS.md`에 맞게 `UAE Ops 맵 legend / tooltip / left panel / footer`를 다시 작성했습니다.**
근거: Overview는 `hvdc all status only`로 유지해야 하고, UAE Ops backbone은 `POD → Customs → WH(optional) → MOSB(optional) → Site`여야 하며, `Flow Code`는 Overview main logic에 쓰면 안 됩니다. 또한 WH는 optional staging이고, AGI/DAS는 MOSB path를 강하게 시사해야 합니다.  
다음행동: **아래 문구안을 그대로 쓰고, `DSV`는 기본 고정값이 아니라 source data가 있을 때만 badge/tooltip에 조건부 표시하십시오.**

## 작성 원칙

이번 문구안은 아래 원칙으로 고정했습니다.

* **Overview = voyage map**
* **Customs = status/stage 표현**
* **WH = optional staging**
* **MOSB = offshore hub**
* **Flow Code = main wording 금지**
* **DSV = 기본 고정 표기 금지, evidence 있을 때만 조건부 노출**

이는 `AGENTS.md`의 Overview 계약과 일치합니다.

---

# 1) UAE Ops Legend 최종 문구

## 1-1. 상단 제목

```text
UAE OPS NETWORK
Voyage execution view inside UAE
```

한글형:

```text
UAE OPS NETWORK
UAE 내 항차 실행 흐름
```

## 1-2. 노드 유형

```text
노드 유형
Port / Airport
Customs Stage
Warehouse
MOSB Hub
HVDC Site
```

보조설명 포함:

```text
노드 유형
Port / Airport
UAE entry point

Customs Stage
Clearance progress at entry point

Warehouse
Optional inland staging

MOSB Hub
Offshore staging / dispatch

HVDC Site
SHU · MIR · DAS · AGI
```

이 구성은 Overview가 보여야 할 항목인 `POD, customs progress, warehouse hint, MOSB hint, site nomination/actual`에 맞습니다.

## 1-3. 경로 의미

```text
경로 의미
Entry → Customs
Customs → Warehouse
Customs → Site
Warehouse → MOSB
Warehouse → Site
MOSB → DAS / AGI
```

## 1-4. Rule Notes

```text
RULE NOTES
Overview is voyage-first
Customs is shown as a clearance stage
WH is optional staging
SHU / MIR may be direct or WH-mediated
DAS / AGI require MOSB path
No Flow Code on Overview
```

`No Flow Code on Overview`와 `WH is optional staging`은 AGENTS와 직접 일치합니다.

---

# 2) Tooltip 최종 문구

## 2-1. Port Tooltip

```text
Khalifa Port
Type: Entry Point
Stage: Customs in progress
Next Path: Warehouse / Site / MOSB
```

```text
Mina Zayed
Type: Entry Point
Stage: Customs cleared
Next Path: Warehouse / Site
```

```text
AUH Airport
Type: Entry Point
Stage: Arrived / Clearance active
Next Path: Site / Warehouse
```

## 2-2. Customs Tooltip

중요한 점은 Customs를 **정확한 물리 장소**가 아니라 **clearance stage**로 읽히게 하는 것입니다.

```text
Khalifa Customs Stage
Type: Clearance Progress
Status: In progress
Related Entry: Khalifa Port
Next Action: Release to Warehouse / Site / MOSB
```

간략형:

```text
Khalifa Customs Stage
Status: In progress
Next: Warehouse / MOSB / Site
```

## 2-3. Warehouse Tooltip

```text
DSV WH
Type: Optional Staging
Status: Active
Staged Shipments: {count}
Next Path: Site / MOSB
```

주의: `DSV WH`는 실제 source label이 있을 때만 쓰고, 없으면 `Warehouse`로 중립 표기하십시오. AGENTS는 존재하지 않는 필드를 만들지 말라고 요구합니다.

## 2-4. MOSB Tooltip

```text
MOSB Hub
Type: Offshore Staging
Status: Pending Dispatch
Next Path: DAS / AGI
```

AGI/DAS offshore path에서 MOSB가 핵심이라는 점은 운영 문서와 도메인 문서에도 부합합니다.

## 2-5. Site Tooltip

### SHU / MIR

```text
SHU
Type: Land Site
Assigned: {count}
Delivered: {count}
Pending: {count}
Route: Direct or WH-mediated
```

```text
MIR
Type: Land Site
Assigned: {count}
Delivered: {count}
Pending: {count}
Route: Direct or WH-mediated
```

### DAS / AGI

```text
DAS
Type: Offshore Site
Assigned: {count}
Delivered: {count}
MOSB Pending: {count}
Route: MOSB required
```

```text
AGI
Type: Offshore Site
Assigned: {count}
Delivered: {count}
MOSB Pending: {count}
Route: MOSB required
```

## 2-6. Voyage Tooltip

`Flow 1/2/3/4` 대신 voyage language만 씁니다.

```text
Voyage: {shipment_id}
Vendor: {vendor}
Current Stage: {stage}
Next: {next_milestone}
ETA: {eta}
```

이렇게 해야 `Flow Code`를 Overview main wording으로 끌어오지 않습니다.

---

# 3) Left Panel 최종 문구

## 3-1. 맵 모드 설명

```text
맵 모드
Global 공급망과 UAE 실행 네트워크를 전환합니다.
UAE Ops는 Entry → Customs → WH / MOSB → Site 흐름을 표시합니다.
```

## 3-2. 토글

```text
Voyages
Customs
WH
MOSB
Sites
```

`Clearance` 대신 `Customs`를 써도 되지만, tooltip/legend에서 `Customs Stage`라고 풀어주는 편이 좋습니다.

## 3-3. 좌측 정보 카드 1 — Node Semantics

```text
노드 유형
Port / Airport
UAE entry point

Customs Stage
Clearance progress

Warehouse
Optional inland staging

MOSB Hub
Offshore dispatch hub

HVDC Site
SHU · MIR · DAS · AGI
```

## 3-4. 좌측 정보 카드 2 — Route Semantics

```text
경로 의미
Entry → Customs
Customs → Warehouse
Customs → Site
Warehouse → MOSB
Warehouse → Site
MOSB → DAS / AGI
```

## 3-5. 좌측 정보 카드 3 — Rule Notes

```text
RULE NOTES
Overview is voyage-first
WH is optional staging
SHU / MIR may be direct
DAS / AGI require MOSB path
No Flow Code on Overview
```

## 3-6. 좌측 정보 카드 4 — 조건부 Owner 표기

기존 `DSV CLEARANCE CONTROL`은 Overview에서 과합니다. 아래처럼 중립형으로 바꾸는 것이 맞습니다.

```text
CLEARANCE HANDLING
Owner: {dynamic_owner}
Status: {clearance_status}
Open Items: {count}
```

`dynamic_owner`가 source에 없으면 이 카드 자체를 숨기십시오. `AGENTS.md`는 존재하지 않는 필드를 만들지 말라고 합니다.

---

# 4) Footer 최종 문구

## 4-1. 최소형

```text
Customs Hold | WH Staging | MOSB Pending | Site Ready
```

## 4-2. 확장형

```text
Customs Hold | WH Staging | MOSB Pending | SHU Ready | MIR Ready | DAS Risk | AGI Risk
```

## 4-3. offshore 운영형

```text
Clearance Active | MOSB Pending | DAS Ready | AGI Ready
```

footer는 `hvdc all status`에서 직접 계산 가능한 stage/hint 기반 지표만 써야 안전합니다. `DSV Queue`, `BOE Submitted`, `Avg Lead Time` 같은 항목은 source evidence가 없으면 넣지 않는 것이 맞습니다.

---

# 5) 바로 붙여넣는 상수형 patch

```ts
export const UAE_OPS_LEGEND_COPY = {
  title: 'UAE OPS NETWORK',
  subtitle: 'Voyage execution view inside UAE',
  nodesTitle: '노드 유형',
  nodes: [
    'Port / Airport',
    'Customs Stage',
    'Warehouse',
    'MOSB Hub',
    'HVDC Site',
  ],
  routesTitle: '경로 의미',
  routes: [
    'Entry → Customs',
    'Customs → Warehouse',
    'Customs → Site',
    'Warehouse → MOSB',
    'Warehouse → Site',
    'MOSB → DAS / AGI',
  ],
  rulesTitle: 'RULE NOTES',
  rules: [
    'Overview is voyage-first',
    'Customs is shown as a clearance stage',
    'WH is optional staging',
    'SHU / MIR may be direct or WH-mediated',
    'DAS / AGI require MOSB path',
    'No Flow Code on Overview',
  ],
}
```

```ts
export const UAE_OPS_LEFT_PANEL_COPY = {
  modeTitle: '맵 모드',
  modeDesc: 'Global 공급망과 UAE 실행 네트워크를 전환합니다.',
  modeDesc2: 'UAE Ops는 Entry → Customs → WH / MOSB → Site 흐름을 표시합니다.',
  toggles: ['Voyages', 'Customs', 'WH', 'MOSB', 'Sites'],
  nodeCardTitle: '노드 유형',
  routeCardTitle: '경로 의미',
  rulesCardTitle: 'RULE NOTES',
}
```

```ts
export const UAE_OPS_FOOTER_COPY = {
  compact: ['Customs Hold', 'WH Staging', 'MOSB Pending', 'Site Ready'],
  extended: ['Customs Hold', 'WH Staging', 'MOSB Pending', 'SHU Ready', 'MIR Ready', 'DAS Risk', 'AGI Risk'],
  offshore: ['Clearance Active', 'MOSB Pending', 'DAS Ready', 'AGI Ready'],
}
```

```ts
export const UAE_OPS_TOOLTIP_COPY = {
  port: ['Type', 'Stage', 'Next Path'],
  customs: ['Type', 'Status', 'Related Entry', 'Next Action'],
  warehouse: ['Type', 'Status', 'Staged Shipments', 'Next Path'],
  mosb: ['Type', 'Status', 'Next Path'],
  site: ['Type', 'Assigned', 'Delivered', 'Pending', 'Route'],
  voyage: ['Voyage', 'Vendor', 'Current Stage', 'Next', 'ETA'],
}
```

---

# 6) 금지 문구

아래는 빼십시오.

```text
Handled by DSV
DSV CLEARANCE CONTROL
DSV Queue
BOE Submitted
Avg Lead Time
Flow 1
Flow 2
Flow 3
Flow 4
FC0
FC1
FC2
FC3
FC4
FC5
Main customs hub
All cargo via WH
```

단, `DSV`가 실제 source field로 확인되면 tooltip의 **보조 1줄**로만 조건부 노출하는 것은 가능합니다.

## 한 줄 결론

**이 최종안은 `AGENTS.md`에 맞게 Customs를 clearance stage로, WH를 optional staging으로, MOSB를 offshore hub로, Overview를 voyage-first surface로 유지하도록 다시 정리한 문구 patch입니다.**
