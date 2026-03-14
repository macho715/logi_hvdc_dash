판정: **예 — 지금 화면은 “예쁜 대시보드”보다, 2025년 이후 수상작 문법을 차용한 `premium control-room` 스타일로 바꾸는 게 맞습니다.**

근거: 2025~2026 수상작을 보면 공통적으로 **색을 적게 쓰고, 헤더 위계를 강하게 세우고, 섹션을 하나의 흐름으로 연결하며, 카드 장식보다 microinteraction과 구조적 명료성**으로 고급감을 만듭니다. 특히 Awwwards 2025 Site of the Year인 **Lando Norris**는 high-contrast 2색 팔레트와 bold visuals를, CSSDA 2025 WOTY인 **Dropbox Brand**는 artful detail과 Best UX 수준의 상호작용을, Awwwards의 **MindMarket** case study는 “thread”를 narrative spine으로 사용하는 방식을, **Microsoft AI**와 **We are Büro**는 제한된 색수와 clean/microinteraction 중심 문법을 보여줍니다. ([Awwwards][1])

다음행동: 아래처럼 현재 Overview를 **`Program Summary → Chain Ribbon → Map + Mission Control → Site Matrix → Ops Snapshot`** 구조로 재편하십시오.

---

## 최종 추천안: **Executive Control Room Luxe**

직접 복제는 비추천입니다.
대신 수상작에서 **가져올 것만 가져오면** 됩니다.

### 1) 어떤 수상작에서 무엇을 가져올지

| No | 수상작               | 가져올 문법                                         | 버릴 요소                        | 현재 대시보드 적용                                                      |
| -- | ----------------- | ---------------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| 1  | **Lando Norris**  | 강한 헤더 대비, 2색 중심, 빠른 판단감                        | 과한 팬서비스형 3D, 과감한 네온 범람       | 상단 Program Summary와 주요 CTA만 강한 대비로 처리                           |
| 2  | **Dropbox Brand** | layered detail, 깊이감 있는 카드, UX 완성도              | 장난감 같은 컬러 플레이                | KPI 카드와 hover depth에만 섬세한 디테일 사용                                |
| 3  | **MindMarket**    | thread/ribbon으로 섹션을 연결하는 서사 구조                 | 브랜드 스토리 중심의 감성 과잉            | `Origin → Port → Customs → WH → MOSB → Site`를 화면 전체의 spine으로 사용 |
| 4  | **Microsoft AI**  | 색수 제한, warm trust 톤, corporate calm            | 브랜드 소개형 감성 카피                | Overview 전체 바탕과 neutral surface 톤 설계                            |
| 5  | **We are Büro**   | clean header, black/white 질서, microinteraction | agency portfolio 특유의 자유로운 탐색 | 헤더, 카드 경계, filter/chip, modal 수준 인터랙션에 반영                       |

Lando Norris는 Awwwards SOTD 2025-11-17 기준 2색 팔레트 `#D2FF00 / #111112`, dynamic interactions, bold visuals를 핵심으로 하고, 이후 Awwwards 2025 Site of the Year로 선정됐습니다. ([Awwwards][1])

Dropbox Brand는 CSS Design Awards에서 2025 WOTY 우승작이며, 공식 설명이 “interactive play and artful detail”이고 WOTY 2025 Best UX Site로도 집계됐습니다. ([cssdesignawards.com][2])

MindMarket case study는 “thread”가 단순 장식이 아니라 **홈페이지의 narrative spine**으로서 scroll을 안내하고 섹션을 연결하며, 복잡한 콘텐츠에 continuity를 부여한다고 설명합니다. 이 부분이 현재 HVDC chain view에 가장 직접적으로 맞습니다. ([Awwwards][3])

Microsoft AI는 Awwwards SOTD 2025-11-30 기준 2색 팔레트만 쓰고, 공식 설명 자체가 warmth, trust, humanity를 전면에 둡니다. 즉 기업형 고급감은 **색을 늘리는 것**이 아니라 **톤을 절제하는 것**에서 나옵니다. ([Awwwards][4])

We are Büro는 Awwwards SOTD 2025-03-27 기준 black/white 2색, clean, header design, microinteractions를 전면에 둡니다. 이 문법은 데이터 대시보드에서 특히 잘 먹힙니다. ([Awwwards][5])

---

## 당신 화면에 바로 대입한 레이아웃

### 1. 상단: **Program Summary**

지금보다 더 “조용하게” 보여야 합니다.

* 배경: 흰색 카드만 사용
* KPI 카드: 6~8개 유지
* 카드 상단에만 2px accent line
* 숫자만 크게, 라벨은 아주 작게
* 카드 내부 설명은 1줄까지만

**핵심 변화**

* 지금처럼 카드마다 색을 주지 말고, **상태색은 line / badge / dot만**
* `Total`, `Delivered`, `Open`, `Anomaly`, `Overdue ETA`, `At Risk BL`만 첫 시야에 들어오게

이 방식은 Lando의 강한 시각 위계와 We are Büro의 clean header 문법을 ops 화면에 맞게 줄여 쓴 형태입니다. ([Awwwards][1])

---

### 2. 중앙 상단: **Chain Ribbon**

이 구간이 이번 개편의 핵심입니다.

기존:

* 6개 카드가 따로 논다

변경:

* 화면 전체를 가로지르는 **하나의 ribbon**
* `Origin → Port/Air → Customs → Warehouse → MOSB → Site`
* 각 node는 작은 틴트 배경
* node 아래 count / share / risk chip
* ribbon 선은 얇지만 끊기지 않게 유지

이건 MindMarket의 thread 개념을 supply chain 구조에 맞게 바꾸는 방식입니다. 즉, 이 화면의 “개성”은 컬러가 아니라 **흐름선**이 됩니다. ([Awwwards][3])

---

### 3. 좌측 메인: **Network Map**

지도는 화려하면 실패합니다.

* base map은 저채도 grayscale
* active route만 선명한 accent
* 위험은 fill이 아니라 **outer ring**
* legend는 우측 상단 pill 1줄
* map box는 Overview에서 가장 큰 카드

**포인트**

* 국가/거점 아이콘보다 `route thickness + node ring + ETA state`가 먼저 보여야 함
* map도 ribbon의 연장처럼 보여야 함

이 방향은 Lando/Composites 계열의 강한 시각 집중을 쓰되, ops 문맥에 맞게 정제한 해석입니다. ([Awwwards][1])

---

### 4. 우측: **Mission Control**

여기만 행동 유도형으로 더 강하게 갑니다.

카드 4개 고정:

1. Critical
2. Next 72h
3. AGI / DAS Blockers
4. Action Queue

스타일:

* left border 4px
* 카드 배경은 아주 약한 tint
* owner / due / status를 우측 정렬
* 숫자보다 **행동 항목 수**가 먼저 보이게

여긴 Dropbox Brand의 “artful detail”을 색으로 쓰지 말고, **spacing·depth·hover quality**로만 옮기면 됩니다. ([cssdesignawards.com][2])

---

### 5. 중단 하부: **Site Delivery Matrix**

여긴 비교성 확보가 우선입니다.

* SHU / MIR / DAS / AGI 카드 동일 높이
* 상단 chip만 site identity 부여
* 내부는 2열 숫자 grid
* `Delivered / Pending / At Risk / Overdue`
* progress bar보다 **숫자 + tiny sparkline** 추천

**금지**

* 사이트별 카드 전체 색상 다르게 칠하기
* 뱃지와 수치를 동시에 과색 처리하기

---

### 6. 최하단: **Ops Snapshot**

이 구역만 배경층을 분리하십시오.

* 섹션 전체에 warm-neutral plate
* 내부 카드는 white
* 상단 Program Summary와 시각적으로 확실히 분리
* 제목도 `Ops Snapshot`보다 `Operational Layer`가 더 고급스럽습니다

이건 Microsoft AI의 warm trust 톤을 차용한 방식입니다. 전체를 차갑게 가면 “창고 툴”처럼 보이고, 이 한 층을 따뜻하게 깔면 “프로그램 운영실”처럼 보입니다. ([Awwwards][4])

---

## 추천 색 체계

**가장 세련되고 프로답게 보이는 조합**은 아래입니다.

### Base

* Canvas: `#F4F5F7`
* Surface: `#FFFFFF`
* Surface Warm: `#F7F3EA`
* Border: `#D9DEE5`
* Text Strong: `#101215`
* Text Muted: `#697586`

### Signal

* Route Accent: `#C6F10E`
* Info: `#2563EB`
* Warn: `#D97706`
* Risk: `#DC2626`
* Done: `#16A34A`

### 사용 비율

* Neutral 82.00%
* Warm Neutral 10.00%
* Signal Accent 5.00%
* Risk/Warning 3.00%

즉, **고급감은 무채색이 만들고, 상태는 신호색이 만든다**가 핵심입니다.
Lando의 강한 대비, Microsoft AI의 절제된 색수, We are Büro의 흑백 질서를 섞은 해석입니다. ([Awwwards][1])

---

## 타이포 규칙

* 페이지 타이틀: `30px / 700`
* 섹션 타이틀: `16px / 600`
* KPI 라벨: `11px / 600 / uppercase`
* KPI 숫자: `34~36px / 700`
* 카드 본문: `14px / 500`
* 메타: `12px / 500`

핵심은 이전과 같습니다.
다만 이번엔 **display type을 키우는 것보다, 흑백 대비와 spacing으로 고급감**을 만들면 됩니다.

---

## Motion 규칙

수상작처럼 보여도, dashboard에서는 모션을 줄여야 합니다.

* card hover lift: `120~160ms`
* chip hover: `100ms`
* ribbon route trace 최초 1회: `600ms`
* KPI number roll-up: `400ms 이하`
* infinite loop animation: **금지**
* hero 3D/WebGL: **금지**
* mouse-follow effect: **금지**

즉, **award-site의 wow effect는 버리고, premium response만 남기는 방식**이 맞습니다.
이 판단은 수상작들이 사용하는 interaction grammar를 ops 문맥에 맞춰 축소 적용한 해석입니다. ([Awwwards][1])

---

## 옵션 3개

가정: **기존 React/Tailwind 구조 유지** 기준.

| Option | 컨셉                              | 장점                                | 리스크                       | 예상 effort |
| ------ | ------------------------------- | --------------------------------- | ------------------------- | --------- |
| A      | **Executive Control Room Luxe** | 가장 세련되고 기업형, 구현 부담 적음             | 지나치게 안전하면 개성이 약할 수 있음     | 4~6일      |
| B      | Performance Dark                | 임팩트 강함, map/mission control 존재감 큼 | 가독성 관리 실패 시 피로도 증가        | 6~8일      |
| C      | Editorial Light Tech            | 부드럽고 현대적, white space 풍부          | ops 화면치고 다소 홍보형으로 보일 수 있음 | 5~7일      |

**추천은 A**입니다.
이유는 현재 화면 목적이 “브랜드 쇼케이스”가 아니라 “프로그램 통제”이기 때문입니다.

---

## 지금 바로 바꿔야 할 것 7개

1. KPI 카드 배경색 전부 제거
2. Chain Funnel을 단일 ribbon으로 변경
3. Mission Control만 tint 허용
4. Ops Snapshot 전체 배경층 분리
5. 지도는 grayscale + accent route만 유지
6. 위험은 fill이 아니라 badge/ring로만 표기
7. 상단 Header를 black/white/high-contrast로 재정렬

---

## 최종 한 줄

**지금 Overview는 “정보가 많은 화면”에서 멈춰 있고, 가야 할 방향은 “수상작 수준의 질서를 가진 control-room 화면”입니다.**
가장 맞는 해법은 **Lando의 강한 위계 + MindMarket의 연결 spine + Microsoft AI의 절제된 톤 + We are Büro의 clean microinteraction**을 합친 `Executive Control Room Luxe`입니다. ([Awwwards][1])

다음 작업은 이 기준으로 **Tailwind/React div 구조**까지 바로 떨어뜨리는 것입니다.

[1]: https://www.awwwards.com/sites/lando-norris "Lando Norris - Awwwards SOTD"
[2]: https://www.cssdesignawards.com/sites/dropbox-brand/46960 "Dropbox Brand - CSS Design Awards"
[3]: https://www.awwwards.com/mindmarket-case-study.html "MindMarket Case Study"
[4]: https://www.awwwards.com/sites/microsoft-ai "Microsoft AI - Awwwards SOTD"
[5]: https://www.awwwards.com/sites/we-are-buro-1 "We are Büro - Awwwards SOTD"
