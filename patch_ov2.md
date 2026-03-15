판정: **예 — `AGENTS.md`에 맞는 최종안은 하나로 확정할 수 있습니다. `Overview`는 `Map First + Bottom Collapse` 구조로 가십시오.**
근거: Overview는 `shipment/voyage grain`의 `voyage map`이어야 하고, 보여줄 핵심도 `Origin/POD/Customs/WH hint/MOSB/Site`로 제한됩니다. 따라서 창고/worklist/case 성격 블록은 아래로 내리고, 메인 맵을 페이지의 주연으로 키우는 것이 맞습니다.
다음행동: **상단은 얇게, 중단 맵은 크게, 하단은 접힘으로 바꾸십시오. 아래 구조 하나로 확정하십시오.**

# 최종 확정안

## **Overview = Map First + Bottom Collapse**

### 1) 구조

```text
ROW 0  Header / Search / Global-UAE Ops / Vendor-Site filter
ROW 1  Slim KPI Strip
ROW 2  Slim Stage Chain
ROW 3  Large Main Map + Floating Mission Control
ROW 4  Bottom Tabs (collapsed by default)
        [ Site Matrix | Voyage Radar | Hidden ]
ROW 5  Bottom Nav
```

---

## 2) 왜 이 안이 맞는가

### A. `AGENTS.md`와 가장 잘 맞음

Overview는 `hvdc all status only`의 `shipment/voyage grain`으로 유지해야 하고, main language도 `Flow Code`가 아니라 `Origin → POD → Customs → WH hint → MOSB hint → Site`여야 합니다. 맵을 크게 두는 것이 이 계약에 가장 직접적으로 부합합니다.

### B. 지금 화면의 가장 큰 문제를 바로 해결

현재는

* KPI가 높고
* Stage chain이 크고
* 하단 site/radar/worklist가 항상 열려 있어

맵이 주연이 되지 못합니다.

### C. detail과 overview를 분리하기 쉬움

`wh status + Flow Code`는 detail/drilldown 전용이므로, 하단 블록을 기본 접힘으로 두면 Overview 계약을 덜 침범합니다.

---

# 3) 각 영역 최종 규칙

## ROW 0 — Header

유지:

* `HVDC CONTROL TOWER`
* 검색
* `Global / UAE Ops`
* `All Vendors`
* `전체 / SHU / MIR / DAS / AGI`

변경:

* 설명 문구 1줄만 유지
* 불필요한 보조 토글 최소화

---

## ROW 1 — Slim KPI Strip

현재 6카드는 유지하되 **높이를 줄입니다.**

최종 KPI:

* `TOTAL SHIPMENTS`
* `FINAL DELIVERED`
* `CUSTOMS ACTIVE`
* `OVERDUE ETA`
* `WH STAGING`
* `MOSB PENDING`

금지:

* warehouse sqm
* case count
* Flow mix

이 6개만 남기는 것이 Overview grain에 맞습니다.

---

## ROW 2 — Slim Stage Chain

현재 FC 체인은 유지하지 않고, 사용자 라벨만 바꿉니다.

최종 라벨:

* `Shipping`
* `Port / Air`
* `Customs`
* `Warehouse`
* `MOSB`
* `Site`

핵심:

* 높이 축소
* 수치 + %만 남김
* `FC0~FC5`, `Flow 1~4` 전면 노출 금지

`AGENTS.md`는 stage를 쓰라고 하고 Flow Code를 main logic에 쓰지 말라고 규정합니다.

---

## ROW 3 — Large Main Map

이게 핵심입니다.

### 비율

* **Map 10**
* **Mission Control 2** 또는 **floating overlay**

### 권장

Mission Control은 고정 우측 패널보다 **맵 위 우상단 floating card**가 더 좋습니다.

### 맵 내부 규칙

* `Global` = `origin_region → pol → pod → site_cluster` 
* `UAE Ops` = `POD → Customs → WH(optional) → MOSB(optional) → Site`
* Customs는 backbone
* WH는 optional staging
* AGI/DAS는 MOSB path 강조
* Flow Code를 primary edge/label로 사용 금지

### 크기 목표

* **overview viewport의 55~65%를 map이 차지**
* 지금 대비 **최소 1.7배 이상 체감 확대**

---

## ROW 4 — Bottom Collapse

이게 이 안의 핵심 차별점입니다.

기본 상태:

```text
[ Site Matrix | Voyage Radar | Hidden ]
default = Hidden
```

### 열었을 때만 보임

* `Site Matrix`
* `Voyage Radar`

### 기본 숨김 이유

Overview는 voyage-first surface이고, site/detail/radar는 보조 레이어입니다. 항상 열려 있으면 맵이 다시 작아집니다.

---

## ROW 5 — Bottom Nav

유지:

* `Logistics Chain`
* `Pipeline`
* `Sites`
* `Cargo`

이건 drilldown entry로 두면 충분합니다.

---

# 4) 구현 아이디어 3개

이 최종안 안에서 바로 적용할 기능은 딱 3개입니다.

## 1. **Map Focus 버튼**

버튼명:

* `Map Focus`
* `Expand Map`

동작:

* KPI strip 얇게
* Stage chain 얇게
* Bottom tabs 자동 접힘
* Map 최대화

## 2. **Legend Mini Mode**

기본:

* 접힌 상태
* 아이콘 + 제목만 보임

클릭 시:

* full legend 펼침

## 3. **Mission Control Floating**

고정 옆판 대신:

* 우상단 2~3카드 overlay
* `Critical / Queue / Next 72h`만 보임

---

# 5) 숫자로 고정하는 최종 가이드

## 높이 비율

* Header: `72~84px`
* KPI row: `96~110px`
* Stage row: `72~88px`
* Main Map row: **`520~680px`**
* Bottom collapse open: `220~320px`
* Bottom collapse closed: `40~56px`

## 데스크탑 기준

* 1440p에서는 맵이 첫 화면에서 거의 다 보여야 함
* 스크롤 없이 **Map + KPI + Stage**까지는 보여야 함

---

# 6) 최종 한 줄

**`AGENTS.md`에 맞는 최종안은 `Map First + Bottom Collapse` 하나입니다.**
즉, **Overview는 “큰 항차 맵”이 먼저 보이고, site/radar/detail은 아래에서 필요할 때만 펼치는 구조**로 확정하는 것이 맞습니다.
