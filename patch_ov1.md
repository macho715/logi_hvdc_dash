판정: **예 — `Overview 3.0`은 지금 화면을 `항차 중심 Control Tower`로 재배치해야 합니다.**
근거: `AGENTS.md`는 Overview를 `shipment/voyage grain`으로 제한하고, `Origin·POL/POD·ETA/ATA·customs·WH hint·MOSB hint·planned/actual site`만 보여야 하며, `Flow Code`를 main language로 쓰지 말라고 규정합니다. 또한 UAE Ops는 `POD → Customs → WH(optional) → MOSB(optional) → Site` backbone이어야 합니다.  
다음행동: **아래 와이어프레임대로 `상태 → 체인 → 맵 → 현장 → 예외` 순서로 고정하고, 현재 하단 warehouse/worklist 성격 블록은 detail로 내리십시오.** 

# Overview 3.0 와이어프레임

기준: **현재 다크 톤/카드 스타일 유지**, 구조만 재배치

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 0 — HEADER / CONTROL BAR                                                                              │
│                                                                                                              │
│  HVDC CONTROL TOWER                                                                                         │
│                                                                                                              │
│  [ Search SCT / HVDC / Vendor / POL / POD / Site ... ]                                                      │
│                                                                                                              │
│                                  [ Global ○ ] [ UAE Ops ● ]                                                 │
│                                                                                                              │
│                                                      [ All Vendors ▼ ] [ 전체 | SHU | MIR | DAS | AGI ]     │
│                                                                                                              │
│  설명: Overview는 voyage-first surface                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 1 — KPI STRIP 6                                                                                         │
│                                                                                                              │
│  [ TOTAL SHIPMENTS ] [ FINAL DELIVERED ] [ CUSTOMS ACTIVE ] [ OVERDUE ETA ] [ WH STAGING ] [ MOSB PENDING ]│
│                                                                                                              │
│  890                 883                 1,395              888             224            77.60%           │
│  All Vendors         Delivered share     In Progress/Hold   ETA overdue     Optional       Offshore watch    │
│                                                                                                              │
│  규칙: 숫자는 shipment/voyage 기준만 사용                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 2 — STAGE CHAIN STRIP                                                                                   │
│                                                                                                              │
│  [ Shipping ]  →  [ Port / Air ]  →  [ Customs ]  →  [ Warehouse ]  →  [ MOSB ]  →  [ Site ]              │
│                                                                                                              │
│    277               0                  0                 3                0             2,577               │
│    10.00%            0.00%              0.00%             0.00%            0.00%         90.00%             │
│                                                                                                              │
│  주의: FC0~FC5 / Flow 1~4 대신 stage language 사용                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 3 — MAIN MAP + MISSION CONTROL                                                                          │
│                                                                                                              │
│  ┌───────────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ MAIN MAP (8 cols)                                             │  │ MISSION CONTROL (4 cols)            │ │
│  │                                                               │  │                                      │ │
│  │  MAP MODE                                                     │  │  [ Critical Alerts ]                │ │
│  │  Global 공급망과 UAE 실행 네트워크를 전환합니다.              │  │   - Customs hold beyond SLA         │ │
│  │  UAE Ops는 Entry → Customs → WH / MOSB → Site 흐름 표시       │  │   - ETA overdue without delivery    │ │
│  │                                                               │  │                                      │ │
│  │  [ Voyages ] [ Customs ] [ WH ] [ MOSB ] [ Sites ]           │  │  [ Action Queue ]                   │ │
│  │                                                               │  │   - Cleared / dispatch pending      │ │
│  │  ┌──────────────────────────────┐                             │  │   - MOSB required / not staged      │ │
│  │  │ LEGEND                       │                             │  │                                      │ │
│  │  │ Port / Airport               │                             │  │  [ Next 72 Hours ]                  │ │
│  │  │ Customs Stage                │                             │  │   - ETA due                         │ │
│  │  │ Warehouse                    │                             │  │   - Customs close expected          │ │
│  │  │ MOSB Hub                     │                             │  │   - Site arrival planned            │ │
│  │  │ HVDC Site                    │                             │  │                                      │ │
│  │  │                              │                             │  └──────────────────────────────────────┘ │
│  │  │ Entry → Customs              │                             │                                           │
│  │  │ Customs → WH                 │                             │                                           │
│  │  │ Customs → Site               │                             │                                           │
│  │  │ WH → MOSB                    │                             │                                           │
│  │  │ WH → Site                    │                             │                                           │
│  │  │ MOSB → DAS / AGI             │                             │                                           │
│  │  └──────────────────────────────┘                             │                                           │
│  │                                                               │                                           │
│  │                    [ GLOBAL ]                                 │                                           │
│  │      Origin Region → POL → POD → Site split                   │                                           │
│  │                                                               │                                           │
│  │                    [ UAE OPS ]                                │                                           │
│  │      POD → Customs → WH(optional) → MOSB(optional) → Site     │                                           │
│  │                                                               │                                           │
│  │  Footer: Customs Hold | WH Staging | MOSB Pending | Site Ready│                                           │
│  └───────────────────────────────────────────────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 4 — SITE DELIVERY MATRIX                                                                                │
│                                                                                                              │
│  [ SHU ]                  [ MIR ]                  [ DAS ]                  [ AGI ]                          │
│                                                                                                              │
│  Assigned 2,857           Assigned 2,753           Assigned 2,364           Assigned 2,634                   │
│  Delivered 2,577          Delivered 2,494          Delivered 2,174          Delivered 2,043                  │
│  Pending 280              Pending 259              MOSB Pending 190         MOSB Pending xxx                 │
│  Overdue 0                Overdue 0                Overdue 0                Overdue / Risk xxx               │
│                                                                                                              │
│  Progress bar             Progress bar             Offshore bar             Offshore bar                      │
│                                                                                                              │
│  규칙: 4개 카드 동등 비중. AGI만 giant card 금지.                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 5 — VOYAGE EXCEPTION RADAR + NEXT MILESTONES                                                            │
│                                                                                                              │
│  ┌───────────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │ VOYAGE EXCEPTION RADAR (8 cols)                              │  │ NEXT MILESTONES (4 cols)             │ │
│  │                                                               │  │                                      │ │
│  │ [전체] [긴급] [주의] [초과]                                   │  │  ETA Due                             │ │
│  │                                                               │  │  Customs Close Due                   │ │
│  │ HVDC-ADOPT-HE-0344   Hitachi   Shanghai→Khalifa   SHU  RED    │  │  Site Arrival Due                    │ │
│  │ Current Stage: customs_in_progress         ETA: 2026-03-19    │  │  MOSB Dispatch Due                   │ │
│  │                                                               │  │                                      │ │
│  │ HVDC-ADOPT-PPL-0001  Prysmian  Le Havre→Mina Zayed  RED       │  └──────────────────────────────────────┘ │
│  │ Current Stage: overdue_eta                  ETA: 2023-12-05   │                                           │
│  │                                                               │                                           │
│  │ ... voyage rows only                                           │                                           │
│  └───────────────────────────────────────────────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 6 — BOTTOM NAV                                                                                          │
│                                                                                                              │
│  [ Logistics Chain ]   [ Pipeline ]   [ Sites ]   [ Cargo ]                                                  │
│                                                                                                              │
│  의미:                                                                                                       │
│  Logistics Chain = 체인 drilldown                                                                            │
│  Pipeline        = stage drilldown                                                                           │
│  Sites           = site execution detail                                                                     │
│  Cargo           = shipment / case 상세                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

# 박스별 설계 규칙

## 1. Row 1 KPI Strip

* 유지: 카드 톤, glow, 숫자 강조
* 변경: 모두 `shipment/voyage grain`
* 금지: warehouse sqm, case count, Flow mix

## 2. Row 2 Stage Chain

* 현재 `FC0~FC5`를 사용자 언어에서 제거
* 내부 계산은 유지 가능
* 외부 라벨은 `Shipping / Port-Air / Customs / Warehouse / MOSB / Site`

## 3. Row 3 Main Map

* Overview의 주연
* Map 폭을 지금보다 키우고, Mission Control은 4열로 축소
* UAE Ops는 `Customs backbone`이 먼저 읽혀야 함
* WH는 optional staging
* AGI/DAS는 MOSB path 강조
* `Flow Code`를 primary edge/label에 쓰면 안 됨 

## 4. Row 4 Site Matrix

* `SHU/MIR/DAS/AGI` 동등 카드
* AGI giant hero 금지
* 오프쇼어 차이만 지표로 반영

## 5. Row 5 Voyage Exception Radar

* `case/worklist`가 아니라 `voyage radar`
* 한 줄은 `shipment id + vendor + lane + stage + ETA + risk`
* `wh status + Flow Code` 기반 case/operator 작업목록은 detail로 분리

# 현재 화면에서 빼야 할 것

```text
창고 압박 sqm card
작업 목록
예외 항목(warehouse/operator 중심)
최근 활동
FC0~FC5를 사용자 라벨로 전면 노출
특정 site giant hero
```

이유는 모두 동일합니다. Overview는 `voyage-first`, detail은 `case/package-first`여야 하기 때문입니다.

# 최종 설계 한 줄

**Overview 3.0은 `상태(KPI) → 흐름(Stage Chain) → 공간(Map) → 현장(Site Matrix) → 예외(Voyage Radar)` 순서로 읽히는, 한 장짜리 항차 상황판이어야 합니다.**

원하시면 다음 단계로 **이 와이어프레임을 `Tailwind/React div 구조`로 바로 변환해서** 드리겠습니다.
