판정: **맞습니다 — 지금 필요한 것은 `이미지 생성`이 아니라, 승인된 디자인 문법을 나머지 페이지에도 동일하게 적용하는 `실행용 패치`입니다.**

근거: 사용자가 올린 `Logistics Chain / Pipeline / Sites / Cargo`는 이미 구조가 있으므로, 필요한 작업은 새 시안 생성보다 **공통 UI 토큰 + 페이지별 Tailwind class 통일**입니다.

다음행동: 아래 기준으로 **4개 페이지 공통 디자인 시스템 + 페이지별 patch 포인트**를 바로 적용하십시오.

---

# 공통 원칙: 나머지 페이지 전부 동일 적용

## 1) 공통 UI 토큰

```tsx
export const ui = {
  page: "min-h-screen bg-[#071225] text-slate-100",
  content: "px-6 py-5 space-y-5",
  shell: "bg-[#071225]",
  topbar: "border-b border-white/5 bg-[#09162b]/90 backdrop-blur-md",
  title: "text-[20px] md:text-[22px] font-bold tracking-[-0.02em] text-white",
  meta: "text-[12px] font-medium text-slate-400",

  panel:
    "rounded-[24px] border border-white/8 bg-[#0B1730] shadow-[0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28)]",
  panelSoft:
    "rounded-[24px] border border-white/8 bg-[#0D1A35]",
  panelInner:
    "rounded-[18px] border border-white/8 bg-[#0A1428]",

  sectionTitle:
    "text-[15px] md:text-[16px] font-semibold tracking-[-0.01em] text-white",
  label:
    "text-[12px] font-medium text-slate-400",
  value:
    "text-[15px] font-semibold text-slate-100",
  metric:
    "text-[34px] leading-none font-bold tracking-[-0.03em] text-white",
  metricSm:
    "text-[16px] font-semibold text-white",

  chip:
    "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-semibold text-slate-300",
  chipActive:
    "inline-flex items-center rounded-full bg-[#2563EB] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,.28)]",

  badgeOk:
    "inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20",
  badgeWarn:
    "inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20",
  badgeRisk:
    "inline-flex items-center rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/20",
  badgeInfo:
    "inline-flex items-center rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-400/20",

  row:
    "rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-colors duration-150 hover:bg-white/[0.04]",
  tableHead:
    "text-[12px] font-semibold text-slate-400",
  tableCell:
    "text-[13px] font-medium text-slate-200",

  progressTrack:
    "h-2.5 overflow-hidden rounded-full bg-white/10",
  progressFillBlue:
    "h-full rounded-full bg-[#3B82F6]",
  progressFillEmerald:
    "h-full rounded-full bg-emerald-500",
  progressFillAmber:
    "h-full rounded-full bg-amber-500",
  progressFillRed:
    "h-full rounded-full bg-red-500",

  hoverCard:
    "transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]",
};
```

---

# 2) 좌측 Sidebar 전 페이지 공통

```tsx
// sidebar
className="bg-[#071225] text-slate-200 border-r border-white/5"

// menu default
className="group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-300 transition-colors duration-150 hover:bg-white/5 hover:text-white"

// menu active
className="flex items-center gap-3 rounded-xl bg-[#2563EB] px-4 py-3 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_6px_18px_rgba(37,99,235,.28)]"
```

---

# 3) 상단 Header 전 페이지 공통

```tsx
// top bar
className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#09162b]/90 px-6 py-4 backdrop-blur-md"

// title
className="text-[20px] md:text-[22px] font-bold tracking-[-0.02em] text-white"

// updated
className="text-[12px] font-medium text-slate-400"

// language toggle wrapper
className="ml-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1"

// active lang
className="rounded-full bg-[#2563EB] px-3 py-1 text-[12px] font-semibold text-white"

// inactive lang
className="rounded-full px-3 py-1 text-[12px] font-semibold text-slate-300"
```

---

# 4) 페이지별 적용 포인트

## A. Logistics Chain

현재 화면 기준 가장 잘 맞습니다.
바꿀 것은 **카드 품질 통일 + 표 가독성 + accent bar 정리**입니다.

### Top 5 Origins / Port-Airport / Site cards

```tsx
className={`${ui.panel} ${ui.hoverCard} p-5`}
```

### site accent line

```tsx
// SHU
className="h-3 rounded-t-[12px] bg-emerald-500/15"
// MIR
className="h-3 rounded-t-[12px] bg-violet-500/15"
// DAS
className="h-3 rounded-t-[12px] bg-orange-500/15"
// AGI
className="h-3 rounded-t-[12px] bg-red-500/15"
```

### voyage cards

```tsx
className={`${ui.panelInner} p-4`}
```

### Chain Stage Cases table wrapper

```tsx
className={`${ui.panel} overflow-hidden`}
```

### table header

```tsx
className="border-b border-white/8 bg-white/[0.02]"
```

### empty state

```tsx
className="py-12 text-center text-[14px] font-medium text-slate-500"
```

---

## B. Pipeline

이 페이지는 **중앙 pipeline metrics bar**가 핵심입니다.
가장 중요한 건 “각 stage가 같은 컴포넌트로 보이게” 하는 것입니다.

### pipeline stage bar wrapper

```tsx
className={`${ui.panel} px-6 py-5`}
```

### stage item

```tsx
className="flex min-w-[140px] flex-col items-center justify-center gap-1"
```

### stage number

```tsx
className="text-[22px] md:text-[24px] font-bold tracking-[-0.02em] text-white"
```

### stage label

```tsx
className="text-[12px] font-medium text-slate-300 text-center"
```

### stage percentage

```tsx
className="text-[12px] font-semibold text-slate-400"
```

### stage arrow

```tsx
className="mx-2 text-slate-500"
```

### filter bar

```tsx
className={`${ui.panelSoft} flex flex-wrap items-center gap-3 px-4 py-3`}
```

### chart cards 5개 공통

```tsx
className={`${ui.panel} p-4`}
```

### chart title

```tsx
className="mb-3 text-[14px] font-semibold text-slate-200"
```

---

## C. Sites

이 페이지는 이미 방향이 좋습니다.
필요한 건 **상단 카드/탭/summary box 품질 통일**입니다.

### 상단 site progress cards

```tsx
className={`${ui.panel} ${ui.hoverCard} p-5`}
```

### percent

```tsx
className="text-[18px] md:text-[20px] font-bold text-white"
```

### bar track

```tsx
className="mt-3 h-2.5 rounded-full bg-white/10"
```

### bar fill

```tsx
className="h-full rounded-full bg-[#3B82F6]"
```

### selected site card

```tsx
className="rounded-[24px] border border-[#2563EB] bg-[#0D1A35] shadow-[0_0_0_1px_rgba(37,99,235,.25),0_12px_30px_rgba(0,0,0,.24)]"
```

### tab nav

```tsx
className="flex items-center gap-6 border-b border-white/8 px-4"
```

### active tab

```tsx
className="border-b-2 border-[#3B82F6] pb-3 text-[14px] font-semibold text-white"
```

### inactive tab

```tsx
className="pb-3 text-[14px] font-medium text-slate-400 transition-colors hover:text-slate-200"
```

### summary container

```tsx
className={`${ui.panel} p-4 md:p-5`}
```

### KPI small boxes

```tsx
className={`${ui.panelInner} p-4`}
```

---

## D. Cargo

이 페이지는 정보량이 많아 **filter strip + data table readability**가 핵심입니다.

### top tabs (WH STATUS / SHIPMENTS / DSV STOCK)

```tsx
className="flex items-center gap-8 border-b border-white/8 px-4"
```

### active tab

```tsx
className="border-b-2 border-[#3B82F6] pb-3 text-[14px] font-semibold text-white"
```

### filter group wrapper

```tsx
className={`${ui.panelSoft} space-y-3 px-4 py-4`}
```

### filter chips / vendor buttons

```tsx
className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
```

### selected vendor

```tsx
className="rounded-xl bg-[#2563EB] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,.28)]"
```

### data table wrapper

```tsx
className={`${ui.panel} overflow-hidden`}
```

### table row

```tsx
className="border-b border-white/6 bg-transparent transition-colors duration-150 hover:bg-white/[0.03]"
```

### table th

```tsx
className="px-4 py-3 text-left text-[12px] font-semibold text-slate-400"
```

### table td

```tsx
className="px-4 py-3 text-[13px] font-medium text-slate-200"
```

### delivered badge

```tsx
className={ui.badgeOk}
```

### route pill

```tsx
className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/15"
```

### nominated site pill

```tsx
className="inline-flex items-center rounded-md bg-slate-700/60 px-2 py-1 text-[11px] font-semibold text-slate-200"
```

---

# 5) 색상 규칙 통일

## site 색

* SHU: `emerald`
* MIR: `violet`
* DAS: `orange`
* AGI: `red`

## 상태 색

* OK: `emerald`
* In progress: `sky`
* Warning: `amber`
* Risk / missing / overdue: `red`

## 금지

* 페이지마다 임의 색 추가
* 동일 의미인데 다른 색 사용
* 카드 전체를 경고색으로 채우기

---

# 6) 즉시 적용 우선순위

1. **모든 페이지 panel class 통일**
2. **모든 header/topbar 통일**
3. **모든 tab/chip/badge class 통일**
4. **Logistics Chain 카드 accent line 통일**
5. **Pipeline stage bar typography 통일**
6. **Sites summary/selected card 강조 통일**
7. **Cargo table row/filters 통일**

---

# 7) 파일 기준으로 나누면

| 파일                   | 해야 할 일                                 |
| -------------------- | -------------------------------------- |
| `Layout.tsx`         | sidebar, topbar, language toggle 공통화   |
| `ui.ts`              | 공통 class token export                  |
| `LogisticsChain.tsx` | panel, stage cards, table wrapper 통일   |
| `Pipeline.tsx`       | stage bar, filter strip, chart card 통일 |
| `Sites.tsx`          | progress cards, tabs, summary card 통일  |
| `Cargo.tsx`          | tabs, vendor chips, table row/badge 통일 |

---

# 8) 최종 정리

지금 필요한 것은 **이미지 시안 추가 생성**이 아니라,
방금 승인된 어두운 프리미엄 톤을 기준으로

* `Logistics Chain`
* `Pipeline`
* `Sites`
* `Cargo`

전부에 **동일한 Tailwind design language**를 입히는 것입니다.

원하면 다음 답변에서 바로
**`ui.ts + 4개 페이지별 diff`** 형식으로 이어서 드리겠습니다.
