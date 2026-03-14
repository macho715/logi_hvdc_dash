판정: **예 — 현재 스크린샷 기준으로 `대규모 구조 변경 없이` 적용 가능한 Tailwind patch 목록으로 바로 정리할 수 있습니다.**

근거: 이번 패치는 **레이아웃 재배치 없이** `spacing / color / type scale / badge / hover / panel tone`만 바꾸는 방식입니다. 스크린샷상 영향 구간은 `좌측 nav`, `상단 site cards`, `Open Radar`, `Operational Layer`, `status 표현`입니다.

다음행동: 아래 순서대로 적용하십시오 — **1) 토큰 추가 → 2) 카드/패널 공통 class 교체 → 3) Open Radar row class 교체 → 4) badge/chip 통일 → 5) 우측 패널 tone 수정**.

---

# 1) 디자인 토큰용 Tailwind class 세트

먼저 공통 class를 변수처럼 묶어두는 것을 권장합니다.

```tsx
// surface
const pageBg = "bg-[#F4F6F8]";
const panel = "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.05)]";
const panelSubtle = "rounded-2xl border border-slate-200 bg-[#F8FAFC]";
const panelFlat = "rounded-2xl border border-slate-200 bg-white";

// text
const titleMain = "text-[30px] leading-[1.1] font-bold text-slate-950";
const titleSection = "text-[15px] leading-6 font-semibold text-slate-950";
const textBody = "text-[14px] leading-6 font-medium text-slate-700";
const textMeta = "text-[12px] leading-5 font-medium text-slate-500";
const textLabel = "text-[12px] leading-5 font-medium text-slate-500";
const textMetric = "text-[34px] leading-none font-bold tracking-[-0.02em] text-slate-950";

// chip / badge
const chipBase = "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold";
const chipOutline = "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600";
const chipActive = "inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white shadow-sm";
const badgeRed = "inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200";
const badgeAmber = "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200";
const badgeGreen = "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200";
const badgeSlate = "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200";

// motion
const hoverCard = "transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(15,23,42,.06)]";
const hoverRow = "transition-colors duration-150 hover:bg-slate-50";
```

---

# 2) 페이지 루트 / 전체 배경 patch

현재 화면은 흰색과 어두운 sidebar 대비는 괜찮지만, 본문 영역이 약간 평평합니다.

## 적용

```tsx
// 기존 page wrapper
"className='min-h-screen bg-white'"

// 변경
className={`min-h-screen ${pageBg}`}
```

## 메인 content area

```tsx
// 기존
className="p-4"

// 변경
className="px-6 py-5"
```

## 섹션 간격

```tsx
// 기존
className="space-y-4"

// 변경
className="space-y-5"
```

---

# 3) 좌측 Sidebar patch

구조는 유지하고, 선택 메뉴만 더 세련되게 보이게 합니다.

## sidebar 컨테이너

```tsx
// 기존 추정
className="bg-slate-950 text-white"

// 변경 추천
className="bg-[#071225] text-slate-200 border-r border-white/5"
```

## 메뉴 item 기본

```tsx
className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-300 transition-colors duration-150 hover:bg-white/5 hover:text-white"
```

## 활성 메뉴

```tsx
className="flex items-center gap-3 rounded-xl bg-[#2563EB] px-4 py-3 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_6px_18px_rgba(37,99,235,.28)]"
```

## sidebar 브랜드 타이틀

```tsx
className="px-5 pt-5 pb-4 text-[18px] font-bold tracking-[-0.02em] text-white"
```

---

# 4) 상단 Header patch

현재 `Overview`, `Updated`, 언어 토글은 맞지만 여백/톤만 정리하면 됩니다.

## 헤더 wrapper

```tsx
className="mb-5 flex items-center justify-between"
```

## 좌측 타이틀

```tsx
className={titleMain}
```

## 우측 updated text

```tsx
className="text-[12px] font-medium text-slate-500"
```

## 언어 토글 wrapper

```tsx
className="ml-3 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
```

## 활성 언어 버튼

```tsx
className="rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white"
```

## 비활성 언어 버튼

```tsx
className="rounded-full px-3 py-1 text-[12px] font-semibold text-slate-500"
```

---

# 5) 상단 Site Cards patch

여기가 가장 효과가 큽니다. 구조 유지, 타이포만 재정렬합니다.

## 카드 wrapper

```tsx
// 기존 추정
className="rounded-2xl border bg-white p-4"

// 변경
className={`${panel} ${hoverCard} p-6`}
```

## 카드 grid

```tsx
className="grid grid-cols-1 gap-4 xl:grid-cols-4"
```

## site chip

```tsx
// SHU
className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700"

// MIR
className="inline-flex w-fit items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700"

// DAS
className="inline-flex w-fit items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[12px] font-semibold text-orange-700"

// AGI
className="inline-flex w-fit items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-semibold text-red-700"
```

## 카드 내부 행 레이아웃

```tsx
className="mt-5 space-y-3"
```

## 라벨/값 행

```tsx
className="flex items-center justify-between"
```

### 라벨

```tsx
className={textLabel}
```

### 값

```tsx
className="text-[15px] font-semibold text-slate-900"
```

## Assigned 숫자만 강조하고 싶으면

상단에 별도 metric block 추가:

```tsx
<div className="mt-4">
  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
    Assigned
  </div>
  <div className="mt-2 text-[34px] leading-none font-bold tracking-[-0.02em] text-slate-950">
    2,857
  </div>
</div>
```

그리고 하단 세부 항목은 축소:

```tsx
className="mt-4 space-y-2.5"
```

## Risk badge

```tsx
className={badgeGreen}
// amber 상태일 때
className={badgeAmber}
```

---

# 6) 섹션 타이틀 / divider patch

Open Radar와 Operational Layer 사이 연결감을 주는 저비용 패치입니다.

## 섹션 wrapper

```tsx
className="rounded-[24px] border border-slate-200 bg-white/80 p-4 backdrop-blur-[2px]"
```

## 섹션 타이틀

```tsx
className="text-[15px] font-semibold text-slate-950"
```

## 섹션 상단 divider

```tsx
className="mb-4 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent"
```

---

# 7) Open Radar patch

현재 가장 체감 개선이 큰 영역입니다.

## 전체 패널

```tsx
className={`${panel} p-4 md:p-5`}
```

## 필터 chip bar

```tsx
className="mb-4 flex flex-wrap items-center gap-2"
```

## chip 기본

```tsx
className={chipOutline}
```

## chip 선택됨

```tsx
className={chipActive}
```

## list wrapper

```tsx
className="space-y-2"
```

## row wrapper

```tsx
className={`rounded-xl border border-slate-200 bg-white px-4 py-3.5 ${hoverRow}`}
```

## row selected / focused

```tsx
className="rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3.5 ring-1 ring-blue-100"
```

## row 내부 레이아웃

```tsx
className="flex items-start justify-between gap-4"
```

## 좌측 block

```tsx
className="min-w-0 flex-1"
```

## shipment ID

```tsx
className="truncate text-[16px] font-bold tracking-[-0.01em] text-slate-950"
```

## route/subtitle

```tsx
className="mt-1 truncate text-[13px] font-medium text-slate-500"
```

## 우측 meta block

```tsx
className="flex shrink-0 items-center gap-2"
```

## 상태 badge

```tsx
className={badgeRed}
```

## due text 일반

```tsx
className="text-[12px] font-medium text-slate-500"
```

## due overdue

```tsx
className="text-[12px] font-semibold text-red-600"
```

## 스크롤 영역

```tsx
className="max-h-[540px] overflow-y-auto pr-1"
```

## 스크롤바 튜닝

Tailwind 기본만으로 부족하면:

```tsx
className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
```

---

# 8) Operational Layer patch

핵심은 **베이지 톤 제거/약화**입니다.

## 외곽 wrapper

```tsx
// 기존 베이지 계열 제거
className={`${panelSubtle} p-4 md:p-5`}
```

## title

```tsx
className={titleSection}
```

## 내부 카드 grid

```tsx
className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2"
```

## 내부 카드

```tsx
className={`${panelFlat} p-4`}
```

## 카드 제목

```tsx
className="text-[14px] font-semibold text-slate-950"
```

## 카드 내부 body

```tsx
className="mt-3 space-y-3"
```

---

# 9) WH Pressure patch

progress bar만 정리해도 훨씬 좋아집니다.

## item row

```tsx
className="space-y-1.5"
```

## label line

```tsx
className="flex items-center justify-between text-[13px] font-medium text-slate-700"
```

## track

```tsx
className="h-2.5 overflow-hidden rounded-full bg-slate-200"
```

## fill 기본

```tsx
className="h-full rounded-full bg-amber-500"
```

## 고위험 fill

```tsx
className="h-full rounded-full bg-red-500"
```

## 정상 fill

```tsx
className="h-full rounded-full bg-emerald-500"
```

---

# 10) Worklist patch

Open Radar와 같은 문법으로 맞추면 됩니다.

## list wrapper

```tsx
className="space-y-2"
```

## item row

```tsx
className={`flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 ${hoverRow}`}
```

## left text

```tsx
className="truncate text-[13px] font-medium text-slate-700"
```

## right status

```tsx
className={badgeRed}
```

---

# 11) Exceptions / Recent Activity patch

오른쪽 하단 2개는 너무 밋밋하면 안 되고, 너무 튀어도 안 됩니다.

## list row

```tsx
className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0"
```

## left marker

```tsx
className="mt-1 h-2 w-2 rounded-full bg-amber-500"
```

## left text

```tsx
className="text-[13px] font-medium text-slate-700"
```

## right value

```tsx
className="text-[12px] font-semibold text-slate-500"
```

## recent activity status

```tsx
className="text-[14px] font-semibold tracking-[-0.01em] text-slate-900"
```

## recent activity time

```tsx
className="text-[12px] font-medium text-slate-500"
```

---

# 12) 상태 표현 통일 patch

현재 `RED`가 텍스트처럼 보여서 구식 느낌이 납니다.

## 금지

```tsx
className="text-red-500 font-bold"
```

## 변경

```tsx
<span className={badgeRed}>RED</span>
<span className={badgeAmber}>AMBER</span>
<span className={badgeGreen}>OK</span>
```

## 숫자 앞 dot

```tsx
<span className="inline-block h-2 w-2 rounded-full bg-red-500" />
```

---

# 13) 카드 radius / border / shadow 통일

전체 화면에서 통일감이 생깁니다.

## 전역 원칙

* 큰 카드: `rounded-2xl`
* 작은 카드: `rounded-xl`
* border: `border-slate-200`
* shadow: 아주 약하게

## 예시 교체

```tsx
// 기존
className="rounded-lg border shadow-sm"

// 변경
className="rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.05)]"
```

---

# 14) 즉시 적용용 요약 패치

시간이 없으면 이것만 먼저 바꾸십시오.

## A. 베이지 Operational Layer 제거

```tsx
bg-[#EDE8DD] -> bg-[#F8FAFC]
```

## B. Open Radar row

```tsx
rounded-lg border -> rounded-xl border border-slate-200 px-4 py-3.5 hover:bg-slate-50 transition-colors
```

## C. 상태 표시

```tsx
text-red-500 -> bg-red-50 text-red-700 ring-1 ring-red-200 rounded-full px-2.5 py-1 text-[11px] font-semibold
```

## D. Site card

```tsx
p-4 -> p-6
text-sm -> text-[12px]
font-bold number -> text-[34px] leading-none font-bold tracking-[-0.02em]
```

## E. panel 공통

```tsx
rounded-xl -> rounded-2xl
shadow-sm -> shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.05)]
```

---

# 15) 추천 적용 순서

1. `Operational Layer` 배경 교체
2. `Open Radar` row/배지 교체
3. `Site Cards` padding + type scale 교체
4. 공통 `panel` radius/shadow 통일
5. `chip / badge` 시스템 통일
6. hover transition 추가

---

# 16) 복붙용 최소 class 세트

아래만 먼저 프로젝트에 넣어도 됩니다.

```tsx
export const ui = {
  panel:
    "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03),0_8px_24px_rgba(15,23,42,.05)]",
  panelSubtle:
    "rounded-2xl border border-slate-200 bg-[#F8FAFC]",
  sectionTitle:
    "text-[15px] leading-6 font-semibold text-slate-950",
  titleMain:
    "text-[30px] leading-[1.1] font-bold tracking-[-0.02em] text-slate-950",
  textMeta:
    "text-[12px] leading-5 font-medium text-slate-500",
  textLabel:
    "text-[12px] leading-5 font-medium text-slate-500",
  metric:
    "text-[34px] leading-none font-bold tracking-[-0.02em] text-slate-950",
  chip:
    "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600",
  chipActive:
    "inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white shadow-sm",
  badgeRed:
    "inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200",
  badgeAmber:
    "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200",
  badgeGreen:
    "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200",
  hoverCard:
    "transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(15,23,42,.06)]",
  hoverRow:
    "transition-colors duration-150 hover:bg-slate-50",
};
```

원하시면 다음 단계로 바로 **컴포넌트별 diff 형식**으로
`Overview.tsx / SiteCard.tsx / OpenRadar.tsx / OperationalLayer.tsx` 기준 patch까지 떨어뜨리겠습니다.
