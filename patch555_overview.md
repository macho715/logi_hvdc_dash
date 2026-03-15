판정: **예 — 현재 Overview의 레이아웃·다크 톤·박스 배치는 유지하고, `AGENTS.md` 기준에 맞게 박스 의미만 전면 교체하면 됩니다.**
근거: 현재 repo의 Overview는 이미 `OverviewToolbar → KpiStripCards → OverviewMap → OverviewRightPanel → OverviewBottomPanel` 구조를 갖고 있고, user-facing `Flow Code`는 Overview에서 빼는 방향으로 정리돼 있습니다.  
다음행동: **아래 spec대로 `검색 문구 / KPI 6개 / Map legend / Site Matrix / Mission Control / Bottom strip`만 교체하십시오. 레이아웃은 건드리지 마십시오.**

# Overview v3 박스 내용 교체안

**원칙:**

* `Overview = hvdc all status only`
* `Flow Code = Overview main surface에서 제거`
* `WH = optional staging node`
* `Global/UAE Ops = 둘 다 voyage-centric`
* 현재 7-row shell은 그대로 유지  

---

## 1) 화면 전체 고정 원칙

### 유지

* 좌측 sidebar
* 상단 header/search/toggle bar
* KPI 6카드 배치
* 중앙 map + 좌측 legend 박스
* 하단 `Site Health Matrix`
* 우측 `Mission Control`
* 맨 아래 strip + 네비 버튼

### 교체

* `창고 중심 문구`
* `Flow / FC / warehouse-first 해석`
* `AGI single-site 과몰입 KPI`
* `flow distribution 언어`

---

## 2) 상단 검색/토글 바 교체

### Search placeholder

기존:

```text
Search HVDC / Project / Vendor / Flow...
```

교체:

```text
Search HVDC / Vendor / POL / POD / Site...
```

### Toggle 의미

* `Origin Arc` = origin region ↔ POD arc
* `Voyage` = active shipment path
* `Next 72h` = ETA / customs / site due 강조
* `Heatmap` = activity density only

**주의:** `Voyage`는 `Flow Code`가 아니라 shipment/voyage path입니다. 

---

## 3) KPI Strip 6개 — 내용만 교체

| 위치 | 새 제목                |                              값 | 보조 텍스트                      | 데이터  |
| -- | ------------------- | -----------------------------: | --------------------------- | ---- |
| 1  | **TOTAL SHIPMENTS** |                  전체 shipment 수 | `hvdc all status` 총건수       | hvdc |
| 2  | **FINAL DELIVERED** |         `FINAL DELIVERY` 존재 건수 | Delivered share %           | hvdc |
| 3  | **CUSTOMS ACTIVE**  | `Customs Start 있고 Close 없는 건수` | `In Progress / Hold` 분리 표기  | hvdc |
| 4  | **OVERDUE ETA**     |                 ETA overdue 건수 | `ETA passed, not delivered` | hvdc |
| 5  | **WH STAGING**      |             WH milestone 보유 건수 | `optional staging` 문구       | hvdc |
| 6  | **MOSB PENDING**    |     DAS/AGI 중 MOSB 경유 필요·미완 건수 | `Offshore routing`          | hvdc |

### 교체 이유

현재 Overview는 `project-level voyage view`가 되어야 하므로, 상단 6카드는 **항차/통관/진행/지연/staging**만 보여야 합니다. `warehouse stock`, `Flow mix`, `AGI readiness 단독 KPI`는 상단 hero metric에 두면 안 됩니다. 

### 카드별 표시 형식

예:

```text
TOTAL SHIPMENTS
8,680
All Vendors / All POD
```

```text
CUSTOMS ACTIVE
332
248 In Progress · 84 Hold
```

```text
MOSB PENDING
520
DAS 311 · AGI 209
```

---

## 4) Map Legend 박스 교체

현재 legend는 의미가 흐리고 node type보다 장식성이 강합니다.
다음으로 교체하십시오.

### Legend 제목

```text
MODE
Voyage Network
```

### Node legend

```text
Origin Region   = Blue halo
POD / Airport   = Blue
Customs         = Cyan
Warehouse       = Yellow
MOSB Yard       = Orange
HVDC Sites      = Green
```

### Route legend

```text
Global: Origin -> POL -> POD -> Site
UAE Ops: Port/Air -> Customs -> WH(optional) -> MOSB(optional) -> Site
```

### 규칙 문구

```text
- WH is optional staging
- DAS / AGI require MOSB path
- SHU / MIR may be direct or WH-mediated
- No Flow Code on Overview
```

---

## 5) 중앙 Map 박스 해석 교체

### Global mode

반드시 이렇게 읽혀야 합니다:

```text
Origin Region -> POL -> POD -> Site
```

### UAE Ops mode

반드시 이렇게 읽혀야 합니다:

```text
Port/Air -> Customs -> WH(optional) -> MOSB(optional) -> Site
```

### 지도 안에서 삭제할 의미

* `모든 선이 중앙 WH처럼 보이는 구조`
* `Customs 생략`
* `DAS / AGI direct path`
* `Flow Code 기반 node grouping`

### 지도 안에서 강조할 의미

* `POD cluster`
* `Customs node`
* `MOSB as offshore hub`
* `SHU/MIR vs DAS/AGI routing 차이`

---

## 6) Site Health Matrix 교체

현재 카드 구조는 유지하고, 값만 `site delivery matrix` 기준으로 바꾸십시오. 

## 6-1) SHU 카드

```text
SHU
Assigned
Delivered
Customs Cleared / Dispatch Pending
Overdue ETA
Risk
```

추천 수치 행:

* Assigned
* Delivered
* Pending
* Overdue

하단 progress:

* Delivered / Assigned %

---

## 6-2) MIR 카드

```text
MIR
Assigned
Delivered
Customs Cleared / Dispatch Pending
Overdue ETA
Risk
```

---

## 6-3) DAS 카드

```text
DAS
Assigned
Delivered
MOSB Pending
Overdue ETA
Risk
```

**주의:** DAS는 `Warehouse`보다 `MOSB Pending`이 우선입니다.

---

## 6-4) AGI 대형 카드

현재 큰 카드 구조는 유지하고 제목만 아래로 교체하십시오.

```text
AGI OFFSHORE FOCUS
Assigned
Delivered
MOSB Pending
Overdue ETA
Last Milestone
```

큰 숫자 1개는:

* `Assigned` 또는
* `Delivered`
  중 하나만 크게

권장:

```text
AGI OFFSHORE FOCUS
1,027 Assigned
533 Delivered · 194 MOSB Pending
```

작은 inset map은 유지 가능
단, `AGI 단독 readiness`가 아니라 `offshore execution focus`로 해석되게 바꾸십시오.

---

## 7) Mission Control 우측 패널 교체

현재 우측 패널 3칸 구조는 유지하되, 전부 `hvdc all status` 기준으로 바꾸십시오.

### 7-1) Critical Alerts

```text
Critical Alerts
- Customs Hold > SLA
- ETA overdue > X days
- Final delivery missing after site milestone
- POD arrived but customs not started
```

### 7-2) Action Queue

```text
Action Queue
- Customs cleared / dispatch pending
- MOSB required / not staged
- Site assigned / no actual milestone
- Vendor shipment with missing ETA
```

### 7-3) Next 72 Hours

```text
Next 72 Hours
- ETA due
- ATA expected
- Customs close expected
- Site arrival planned
```

**삭제할 것**

* case/package worklist형 문구
* WH operator task 문구
* Flow Code/FC 상태

---

## 8) Bottom Strip 교체

현재 하단 glowing line strip은 유지하되, `Flow 1/2/3/4`를 전부 제거하십시오.

### 새 stage strip

```text
Shipping
Port / Air
Customs
Warehouse
MOSB
Site
```

각 단계 아래 값:

* shipment count
* share %
* overdue / risk badge

예:

```text
Shipping 781
Port/Air 592
Customs 2,593
Warehouse 1,652
MOSB 547
Site 3,262
```

즉 이 strip은 **Flow distribution**이 아니라 **Chain Funnel**이어야 합니다. 

---

## 9) 버튼/네비 문구

현재 하단 버튼은 유지:

* Logistics Chain
* Pipeline
* Sites
* Cargo

단, Overview에서 클릭 전 해석은 이렇게 고정합니다.

* `Logistics Chain` = 상세 chain narrative
* `Pipeline` = stage drilldown
* `Sites` = site execution detail
* `Cargo` = shipment / case drilldown

---

## 10) 박스별 데이터 계약

| 박스              | 데이터 소스          | 허용 필드                              |
| --------------- | --------------- | ---------------------------------- |
| Search/Toolbar  | hvdc all status | shipment/vendor/pol/pod/site       |
| KPI 6 cards     | hvdc all status | shipment/stage/customs/eta/wh/mosb |
| Map + legend    | hvdc all status | origin/pol/pod/customs/site/mosb   |
| Site cards      | hvdc all status | planned/actual/final delivery/mosb |
| Mission Control | hvdc all status | overdue/anomaly/customs/pending    |
| Bottom strip    | hvdc all status | milestone stage counts             |

### Overview에서 금지

* `FLOW_CODE`
* `case/package grain`
* `final warehouse stop`
* `warehouse route classifier`
* `FC0~FC5` 언어

---

## 11) 이 화면용 최종 문구 세트

### Header

```text
HVDC CONTROL TOWER
```

### Search

```text
Search HVDC / Vendor / POL / POD / Site...
```

### KPI

```text
TOTAL SHIPMENTS
FINAL DELIVERED
CUSTOMS ACTIVE
OVERDUE ETA
WH STAGING
MOSB PENDING
```

### Legend

```text
Origin Region
POD / Airport
Customs
Warehouse
MOSB Yard
HVDC Sites
```

### Site cards

```text
SHU
MIR
DAS
AGI OFFSHORE FOCUS
```

### Mission Control

```text
Critical Alerts
Action Queue
Next 72 Hours
```

### Bottom strip

```text
Shipping
Port / Air
Customs
Warehouse
MOSB
Site
```

---

## 12) 가장 중요한 한 줄

**지금 Overview는 “창고 운영판”이 아니라 “항차 중심 Control Tower”로 읽혀야 하므로, 모든 박스는 `warehouse-first`가 아니라 `voyage-first` 의미로 바뀌어야 합니다.**

원하시면 다음 단계로 바로 **`OverviewPageClient / KpiStripCards / SiteDeliveryMatrix / MissionControl / OverviewBottomPanel`용 실제 문구 patch 표**까지 이어서 드리겠습니다.
