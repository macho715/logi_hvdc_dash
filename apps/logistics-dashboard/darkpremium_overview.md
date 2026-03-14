판정: **예 — 이 Overview도 방금 확정한 dark premium 톤으로 동일 적용 가능합니다.**

근거: 현재 화면은 구조는 맞고, 문제는 **light 운영툴 톤**입니다. 즉 재배치보다 `surface / border / badge / table-row / right panel`만 바꾸면 다른 페이지와 같은 계열로 맞출 수 있습니다.

다음행동: 아래 **Overview 전용 Tailwind patch**를 적용하십시오. 우선순위는 `1) page/background 2) site cards 3) Open Radar 4) Operational Layer 5) badge/progress 통일`입니다.

---

# Overview 전용 적용안

## 1) 페이지 루트

```tsx
className="min-h-screen bg-[#071225] text-slate-100"
```

## 2) 메인 content

```tsx
className="px-6 py-5 space-y-5"
```

## 3) 상단 header

```tsx
// wrapper
className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#09162b]/90 px-6 py-4 backdrop-blur-md"

// title
className="text-[20px] md:text-[22px] font-bold tracking-[-0.02em] text-white"

// updated
className="text-[12px] font-medium text-slate-400"
```

---

# 공통 토큰

```tsx
export const ui = {
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
};
```

---

# 1. 상단 Site Cards patch

현재 가장 위 카드들이 흰색 운영툴 느낌입니다. 전부 dark card로 통일하십시오.

## 카드 grid

```tsx
className="grid grid-cols-1 gap-4 xl:grid-cols-4"
```

## 카드 wrapper

```tsx
className={`${ui.panel} p-5 transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]`}
```

## site chip

```tsx
// SHU
className="inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-[12px] font-semibold text-emerald-300"

// MIR
className="inline-flex w-fit items-center rounded-full border border-violet-400/20 bg-violet-500/12 px-3 py-1 text-[12px] font-semibold text-violet-300"

// DAS
className="inline-flex w-fit items-center rounded-full border border-orange-400/20 bg-orange-500/12 px-3 py-1 text-[12px] font-semibold text-orange-300"

// AGI
className="inline-flex w-fit items-center rounded-full border border-red-400/20 bg-red-500/12 px-3 py-1 text-[12px] font-semibold text-red-300"
```

## 내부 행

```tsx
className="mt-5 space-y-3"
```

## 라벨

```tsx
className="text-[12px] font-medium text-slate-400"
```

## 값

```tsx
className="text-[15px] font-semibold text-slate-100"
```

## Risk badge

```tsx
// 90%대
className={ui.badgeOk}

// 77.6%
className={ui.badgeWarn}
```

---

# 2. Open Radar 전체 패널

지금 흰 바탕이라 가장 이질적입니다.
이 영역을 다른 페이지와 같은 dark panel로 바꾸면 전체가 맞춰집니다.

## wrapper 2-column

```tsx
className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_.95fr]"
```

## 좌측 Open Radar 패널

```tsx
className={`${ui.panel} p-5`}
```

## 우측 Operational Layer 패널

```tsx
className={`${ui.panelSoft} p-5`}
```

## 섹션 제목

```tsx
className={ui.sectionTitle}
```

---

# 3. Open Radar filter chips

```tsx
// chip bar
className="mb-4 flex flex-wrap items-center gap-2"

// active
className={ui.chipActive}

// inactive
className={ui.chip}
```

---

# 4. Open Radar row patch

지금 row가 연한 blue border로 light-admin 느낌입니다.
dark row + subtle hover로 바꾸십시오.

## 스크롤 wrapper

```tsx
className="max-h-[560px] space-y-2 overflow-y-auto pr-1"
```

## row 기본

```tsx
className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.04]"
```

## selected row

```tsx
className="rounded-xl border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-4 py-3.5 ring-1 ring-[#3B82F6]/20"
```

## row layout

```tsx
className="flex items-start justify-between gap-4"
```

## shipment id

```tsx
className="truncate text-[16px] font-bold tracking-[-0.01em] text-white"
```

## subtitle / route

```tsx
className="mt-1 truncate text-[13px] font-medium text-slate-400"
```

## meta block

```tsx
className="flex shrink-0 items-center gap-2"
```

## site mini chip

```tsx
className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
```

## route pill

```tsx
className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/15"
```

## RED badge

```tsx
className={ui.badgeRisk}
```

## due text

```tsx
className="text-[12px] font-medium text-slate-400"
```

## overdue due text 강조

```tsx
className="text-[12px] font-semibold text-red-300"
```

---

# 5. Operational Layer patch

현재 회색-베이지 plate 느낌이 남아 있습니다.
다른 페이지처럼 dark panel 안에 small card 4개 구조로 통일하면 됩니다.

## wrapper

```tsx
className={`${ui.panelSoft} p-5`}
```

## 내부 grid

```tsx
className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2"
```

## 내부 카드

```tsx
className={`${ui.panelInner} p-4`}
```

## 카드 제목

```tsx
className="text-[14px] font-semibold text-white"
```

## 카드 body

```tsx
className="mt-3 space-y-3"
```

---

# 6. WH Pressure patch

지금 흰 카드 안에 컬러 bar가 떠 있습니다. dark 계열에서는 아래처럼.

## item row

```tsx
className="space-y-1.5"
```

## label row

```tsx
className="flex items-center justify-between text-[13px] font-medium text-slate-300"
```

## track

```tsx
className={ui.progressTrack}
```

## fill

```tsx
// DSV Indoor 위험
className={ui.progressFillRed}

// DSV Outdoor 경고
className={ui.progressFillAmber}

// Hauler Indoor 정상
className={ui.progressFillEmerald}
```

## sqm value

```tsx
className="text-[12px] font-medium text-slate-400"
```

---

# 7. Worklist patch

지금 가장 light-theme 흔적이 남는 곳입니다.

## list wrapper

```tsx
className="max-h-[184px] space-y-2 overflow-y-auto pr-1"
```

## item row

```tsx
className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 transition-colors duration-150 hover:bg-white/[0.04]"
```

## id text

```tsx
className="truncate text-[13px] font-medium text-slate-200"
```

## due text

```tsx
className="text-[12px] font-medium text-slate-400"
```

## status badge

```tsx
className={ui.badgeRisk}
```

---

# 8. Exceptions patch

## list row

```tsx
className="flex items-start justify-between gap-3 border-b border-white/6 py-2 last:border-b-0"
```

## left marker

```tsx
// 위험
className="mt-1 h-2 w-2 rounded-full bg-red-400"

// 경고
className="mt-1 h-2 w-2 rounded-full bg-amber-400"
```

## left text

```tsx
className="text-[13px] font-medium text-slate-200"
```

## right value

```tsx
className="text-[12px] font-semibold text-slate-400"
```

---

# 9. Recent Activity patch

## item row

```tsx
className="border-b border-white/6 py-2 last:border-b-0"
```

## status text

```tsx
className="text-[14px] font-semibold tracking-[-0.01em] text-white"
```

## time text

```tsx
className="mt-1 text-[12px] font-medium text-slate-400"
```

---

# 10. 좌측 Sidebar도 동일 톤 확인

Overview만 light고 나머지가 dark면 어색합니다.
sidebar/topbar는 이미 맞으니 그대로 유지하십시오.

```tsx
// sidebar
className="bg-[#071225] text-slate-200 border-r border-white/5"

// active menu
className="flex items-center gap-3 rounded-xl bg-[#2563EB] px-4 py-3 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_6px_18px_rgba(37,99,235,.28)]"
```

---

# 11. 즉시 적용 우선순위

## 1차

* Open Radar wrapper `white -> dark panel`
* Operational Layer `gray -> dark panelSoft`
* row border `slate/light -> white/8`
* RED badge `light red -> dark theme badgeRisk`

## 2차

* Site cards 전체 dark panel화
* WH Pressure progress track/fill 통일
* Worklist / Exceptions / Recent Activity small card 통일

## 3차

* scrollbar / hover / selected row polish
* section spacing 정리
* subtle shadow 통일

---

# 12. 가장 짧은 교체 요약

```tsx
bg-white            -> bg-[#0B1730]
bg-gray-50          -> bg-[#0D1A35]
border-slate-200    -> border-white/8
text-slate-900      -> text-white
text-slate-500      -> text-slate-400
hover:bg-slate-50   -> hover:bg-white/[0.04]
rounded-2xl border  -> rounded-[24px] border border-white/8
```

---

# 최종 적용 방향

이 Overview는 새로 디자인할 필요 없습니다.
지금 필요한 건 **현재 정보 구조를 그대로 둔 채** 아래만 통일하는 것입니다.

* 상단 site cards → dark premium cards
* Open Radar → dark worklist panel
* Operational Layer → dark 4-card module
* badge/progress → 다른 페이지와 동일 rule
* typography/border/shadow → 전 페이지 통일

원하시면 바로 다음 답변에서
**`Overview.tsx 기준 diff 형식`**으로만 잘라서 드리겠습니다.
