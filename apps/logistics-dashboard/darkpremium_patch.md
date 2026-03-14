# Dark Premium Color Patch — 전체 대시보드 (2026-03-14)

## 목표
`darkpremium.md` + `darkpremium_overview.md` 기반 dark premium 톤 전면 적용.
Overview의 `data-theme="light-ops"` 완전 제거 → 전 페이지 동일 dark premium 계열 통일.

## 디자인 토큰 기준

```
bg-page:       #071225
bg-panel:      #0B1730   (shadow: 0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28))
bg-panelSoft:  #0D1A35
bg-panelInner: #0A1428
border:        white/8   (border-white/8)
topbar:        #09162b/90 + backdrop-blur-md
text-strong:   white / slate-100
text-muted:    slate-400
accent-blue:   #2563EB
progress-blue: #3B82F6
row:           bg-white/[0.02]  hover:bg-white/[0.04]  border-white/8
```

## 병렬 실행 구조

```
Wave 1 (3 agent 병렬) ─ 기반 토큰 + 글로벌 레이아웃
  W1-A  lib/overview/ui.ts                  ← 다크 ui 토큰, gateClassLight, SITE_META.chipClass
  W1-B  components/layout/DashboardHeader   ← 다크 topbar
  W1-C  components/ui/LangToggle            ← 다크 pill

Wave 2 (9 agent 병렬, W1-A 완료 필수) ─ Overview 컴포넌트
  W2-A  OverviewPageClient                  ← data-theme 제거, bg-#071225
  W2-B  KpiStripCards                       ← dark panel
  W2-C  ProgramFilterBar                    ← dark surface + chips
  W2-D  ChainRibbonStrip                    ← dark nodes
  W2-E  MissionControl                      ← dark panels + alerts
  W2-F  SiteDeliveryMatrix                  ← dark cards + badges
  W2-G  OpenRadarTable                      ← dark rows + filter chips
  W2-H  OpsSnapshot                         ← dark SectionCard + rows
  W2-I  OverviewToolbar                     ← minor polish

Wave 3 (4 agent 병렬, Wave 2 완료 후) ─ 나머지 페이지
  W3-A  components/chain/FlowChain + OriginCountrySummary
  W3-B  components/pipeline/*
  W3-C  components/sites/SiteCards + SiteDetail
  W3-D  components/cargo/*
```

---

## Wave 1 상세

### W1-A: `lib/overview/ui.ts`

**변경 1 — `SITE_META.chipClass` 다크 변환**
```diff
  SHU: {
-   chipClass: 'bg-teal-50 text-teal-700 border border-teal-300',
+   chipClass: 'inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-[12px] font-semibold text-emerald-300',
  },
  MIR: {
-   chipClass: 'bg-violet-50 text-violet-700 border border-violet-300',
+   chipClass: 'inline-flex w-fit items-center rounded-full border border-violet-400/20 bg-violet-500/12 px-3 py-1 text-[12px] font-semibold text-violet-300',
  },
  DAS: {
-   chipClass: 'bg-orange-50 text-orange-700 border border-orange-300',
+   chipClass: 'inline-flex w-fit items-center rounded-full border border-orange-400/20 bg-orange-500/12 px-3 py-1 text-[12px] font-semibold text-orange-300',
  },
  AGI: {
-   chipClass: 'bg-red-50 text-red-700 border border-red-300',
+   chipClass: 'inline-flex w-fit items-center rounded-full border border-red-400/20 bg-red-500/12 px-3 py-1 text-[12px] font-semibold text-red-300',
  },
```

**변경 2 — `gateClassLight()` 다크 배지로 교체**
```diff
 export function gateClassLight(gate: WorklistRow['gate']): string {
   if (gate === 'ZERO' || gate === 'RED')
-    return 'inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200'
+    return 'inline-flex items-center rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/20'
   if (gate === 'AMBER')
-    return 'inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200'
+    return 'inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20'
-  return 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200'
+  return 'inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20'
 }
```

**변경 3 — `uiTokens` → dark `ui` 토큰으로 교체 (파일 끝)**
```ts
// uiTokens (light-ops) 완전 제거 후 아래로 교체
export const ui = {
  panel:
    'rounded-[24px] border border-white/8 bg-[#0B1730] shadow-[0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28)]',
  panelSoft:
    'rounded-[24px] border border-white/8 bg-[#0D1A35]',
  panelInner:
    'rounded-[18px] border border-white/8 bg-[#0A1428]',
  sectionTitle:
    'text-[15px] md:text-[16px] font-semibold tracking-[-0.01em] text-white',
  label:
    'text-[12px] font-medium text-slate-400',
  value:
    'text-[15px] font-semibold text-slate-100',
  metric:
    'text-[34px] leading-none font-bold tracking-[-0.03em] text-white',
  chip:
    'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-semibold text-slate-300',
  chipActive:
    'inline-flex items-center rounded-full bg-[#2563EB] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,.28)]',
  badgeOk:
    'inline-flex items-center rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20',
  badgeWarn:
    'inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20',
  badgeRisk:
    'inline-flex items-center rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-semibold text-red-300 ring-1 ring-red-400/20',
  badgeInfo:
    'inline-flex items-center rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-400/20',
  row:
    'rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-colors duration-150 hover:bg-white/[0.04]',
  progressTrack:
    'h-2.5 overflow-hidden rounded-full bg-white/10',
  progressFillBlue:
    'h-full rounded-full bg-[#3B82F6]',
  progressFillEmerald:
    'h-full rounded-full bg-emerald-500',
  progressFillAmber:
    'h-full rounded-full bg-amber-500',
  progressFillRed:
    'h-full rounded-full bg-red-500',
  hoverCard:
    'transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]',
} as const
```

---

### W1-B: `components/layout/DashboardHeader.tsx`

```diff
- className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800"
+ className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#09162b]/90 px-6 py-4 backdrop-blur-md"

- className="text-lg font-semibold text-white"
+ className="text-[20px] font-bold tracking-[-0.02em] text-white"

- className="text-xs text-gray-500"
+ className="text-[12px] font-medium text-slate-400"
```

---

### W1-C: `components/ui/LangToggle.tsx`

```diff
# 컨테이너 (rounded-full wrapper)
- className="... border border-slate-200 bg-white p-1 shadow-sm ..."
+ className="... border border-white/10 bg-white/5 p-1 ..."

# 비활성 버튼
- className="... text-slate-500"
+ className="... text-slate-300"

# 활성 버튼 — 그대로 유지
# bg-[#2563EB] text-white
```

---

## Wave 2 상세 — Overview 컴포넌트

모든 컴포넌트에서 `var(--ops-*)` CSS 변수를 dark 하드코드값으로 교체:

| CSS 변수 | 교체값 |
|---|---|
| `var(--ops-canvas)` | `#071225` |
| `var(--ops-surface)` | `#0B1730` |
| `var(--ops-border)` | `white/8` (Tailwind: `border-white/8`) |
| `var(--ops-text-strong)` | `white` or `text-slate-100` |
| `var(--ops-text-muted)` | `text-slate-400` |
| `var(--ops-info)` | `#2563EB` |
| `var(--ops-warn)` | `amber-500` or `#D97706` |
| `var(--ops-risk)` | `red-500` or `#DC2626` |

---

### W2-A: `components/overview/OverviewPageClient.tsx`

```diff
- <div data-theme="light-ops" className="flex h-full flex-col overflow-auto bg-[var(--ops-canvas)] text-[var(--ops-text-strong)]">
+ <div className="flex h-full flex-col overflow-auto bg-[#071225] text-slate-100">
```
그 외 className 변경 없음 (자식 컴포넌트가 각자 처리).

---

### W2-B: `components/overview/KpiStripCards.tsx`

```diff
# toneClass()
- 'border-t-2 border-t-[var(--ops-risk)] border border-[var(--ops-border)]'
+ 'border-t-2 border-t-red-500 border border-white/8'
- 'border-t-2 border-t-[var(--ops-warn)] border border-[var(--ops-border)]'
+ 'border-t-2 border-t-amber-500 border border-white/8'
- 'border border-[var(--ops-border)]'
+ 'border border-white/8'

# loading skeleton
- 'h-20 animate-pulse rounded-xl bg-[var(--ops-canvas)]'
+ 'h-20 animate-pulse rounded-xl bg-white/5'

# section wrapper
- 'border-b border-[var(--ops-border)]'
+ 'border-b border-white/8'

# card button
- 'rounded-xl bg-[var(--ops-surface)] px-4 py-3 text-left transition-shadow duration-[140ms] hover:shadow-md'
+ 'rounded-[20px] bg-[#0B1730] px-4 py-3 text-left transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(0,0,0,.28)]'

# label
- 'text-[11px] font-semibold uppercase tracking-wide text-[var(--ops-text-muted)]'
+ 'text-[11px] font-semibold uppercase tracking-wide text-slate-400'

# value
- 'mt-1 text-[35px] font-bold leading-none text-[var(--ops-text-strong)]'
+ 'mt-1 text-[35px] font-bold leading-none text-white'

# sublabel
- 'mt-1 text-[11px] text-[var(--ops-text-muted)]'
+ 'mt-1 text-[11px] text-slate-400'
```

---

### W2-C: `components/overview/ProgramFilterBar.tsx`

```diff
# 외부 wrapper
- 'border-b border-[var(--ops-border)] bg-[var(--ops-surface)]'
+ 'border-b border-white/8 bg-[#0B1730]'

# 제목
- text-[var(--ops-text-strong)]
+ text-white

# segmented control 배경
- bg-[var(--ops-canvas)]
+ bg-white/5

# mode 활성
- bg-[var(--ops-info)] text-white
+ bg-[#2563EB] text-white

# mode 비활성
- text-[var(--ops-text-muted)] hover:text-[var(--ops-text-strong)]
+ text-slate-400 hover:text-white

# site filter 활성
- bg-[var(--ops-info)] text-white border-[var(--ops-info)]
+ bg-[#2563EB] text-white border-[#2563EB]

# site filter 비활성
- text-[var(--ops-text-muted)] border-[var(--ops-border)] hover:border-[var(--ops-info)]
+ text-slate-400 border-white/8 hover:border-[#2563EB]

# updatedAt
- text-[var(--ops-text-muted)]
+ text-slate-400
```

---

### W2-D: `components/overview/ChainRibbonStrip.tsx`

```diff
# 외부 wrapper
- 'border-b border-[var(--ops-border)] bg-[var(--ops-surface)]'
+ 'border-b border-white/8 bg-[#0B1730]'

# ribbon line
- 'bg-[var(--ops-border)]'
+ 'bg-white/8'

# NODES 배열 색상 교체
  { labelKey: 'origin',    color: 'bg-gray-50 border-gray-200'    }
→ { labelKey: 'origin',    color: 'bg-white/5 border-white/8'     }
  { labelKey: 'portAir',   color: 'bg-sky-50 border-sky-200'      }
→ { labelKey: 'portAir',   color: 'bg-sky-500/10 border-sky-400/20' }
  { labelKey: 'customs',   color: 'bg-blue-50 border-blue-200'    }
→ { labelKey: 'customs',   color: 'bg-blue-500/10 border-blue-400/20' }
  { labelKey: 'warehouse', color: 'bg-amber-50 border-amber-200'  }
→ { labelKey: 'warehouse', color: 'bg-amber-500/10 border-amber-400/20' }
  { labelKey: 'mosb',      color: 'bg-orange-50 border-orange-200'}
→ { labelKey: 'mosb',      color: 'bg-orange-500/10 border-orange-400/20' }
  { labelKey: 'site',      color: 'bg-green-50 border-green-200'  }
→ { labelKey: 'site',      color: 'bg-emerald-500/10 border-emerald-400/20' }

# hover effect 유지, loading skeleton
- 'bg-gray-100'
+ 'bg-white/5'

# 텍스트 전체
- text-[var(--ops-text-muted)]  → text-slate-400
- text-[var(--ops-text-strong)] → text-white
```

---

### W2-E: `components/overview/MissionControl.tsx`

```diff
# 컨테이너
- 'bg-[var(--ops-surface)] border-l border-[var(--ops-border)]'
+ 'bg-[#0B1730] border-l border-white/8'

# severityClass() — light → dark
- 'border-l-[var(--ops-risk)] bg-red-50'   → 'border-l-red-400/60 bg-red-500/10'
- 'border-l-[var(--ops-warn)] bg-amber-50' → 'border-l-amber-400/60 bg-amber-500/10'
- 'border-l-[var(--ops-info)] bg-blue-50'  → 'border-l-sky-400/60 bg-sky-500/10'

# ShipmentDetailCard
- 'border-[var(--ops-info)] bg-blue-50'   → 'border-[#3B82F6]/40 bg-[#3B82F6]/10'
- text-[var(--ops-info)]                  → text-[#3B82F6]

# 일반 row
- 'border border-[var(--ops-border)] bg-[var(--ops-surface)]'
+ 'border border-white/8 bg-white/[0.02]'

# progress bar
- 'h-1.5 rounded-full bg-[var(--ops-border)]'
+ 'h-2 rounded-full bg-white/10'
- 'h-1.5 rounded-full bg-[var(--ops-info)]'
+ 'h-full rounded-full bg-[#3B82F6]'

# 모든 텍스트
- text-[var(--ops-text-strong)] → text-white (제목) / text-slate-100
- text-[var(--ops-text-muted)]  → text-slate-400
- text-[var(--ops-risk)]        → text-red-400
```

---

### W2-F: `components/overview/SiteDeliveryMatrix.tsx`

```diff
# 섹션 wrapper
- 'border-t border-[var(--ops-border)] bg-[var(--ops-surface)]'
+ 'border-t border-white/8 bg-[#071225]'

# 제목
- text-[var(--ops-text-strong)] → text-white

# loading skeleton bg
- 'bg-gray-200' → 'bg-white/10'
- 'bg-gray-100' → 'bg-white/5'

# card button
- 'rounded-xl border border-[var(--ops-border)] bg-[var(--ops-surface)] p-6 ...'
+ 'rounded-[20px] border border-white/8 bg-[#0B1730] p-6 shadow-[0_1px_0_rgba(255,255,255,.03),0_16px_40px_rgba(0,0,0,.28)] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,.26)]'

# hero label
- text-[var(--ops-text-muted)] → text-slate-400

# hero value
- text-[var(--ops-text-strong)] → text-white

# 데이터 행 label
- text-[var(--ops-text-muted)] → text-slate-400

# 데이터 행 value
- text-[var(--ops-text-strong)] → text-slate-100

# riskBadgeClass() — light → dark
- 'bg-red-100 text-red-700 ring-red-200'       → 'bg-red-500/12 text-red-300 ring-red-400/20'
- 'bg-amber-100 text-amber-700 ring-amber-200'  → 'bg-amber-500/12 text-amber-300 ring-amber-400/20'
- 'bg-green-100 text-green-700 ring-emerald-200'→ 'bg-emerald-500/12 text-emerald-300 ring-emerald-400/20'

# siteMeta.chipClass — W1-A에서 처리 (inline-flex 포함하여 className 병합 방식 정리)
# 기존: cn('inline-block rounded-full px-3 py-1 text-[11px] font-semibold', siteMeta.chipClass)
# 변경: className={siteMeta.chipClass}  (chipClass 자체에 이미 padding/rounded 포함)
```

---

### W2-G: `components/overview/OpenRadarTable.tsx`

```diff
# wrapper
- 'border-t border-[var(--ops-border)] bg-[var(--ops-surface)]'
+ 'border-t border-white/8 bg-[#071225]'

# 제목
- text-[var(--ops-text-strong)] → text-white

# loading skeleton
- 'bg-gray-200' → 'bg-white/10'
- 'bg-gray-100' → 'bg-white/5'

# filter chip 비활성
- 'border-[var(--ops-border)] bg-[var(--ops-surface)] text-[var(--ops-text-muted)] hover:border-[var(--ops-info)]'
+ 'border-white/8 bg-white/5 text-slate-400 hover:border-[#2563EB]'

# empty state
- 'border-[var(--ops-border)] bg-[var(--ops-canvas)] ... text-[var(--ops-text-muted)]'
+ 'border-white/8 bg-white/[0.02] ... text-slate-400'

# row 기본
- 'border-[var(--ops-border)] bg-[var(--ops-surface)] hover:bg-slate-50'
+ 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'

# row highlighted
- 'border-blue-200 bg-blue-50/40 ring-blue-100'
+ 'border-[#3B82F6]/40 bg-[#3B82F6]/10 ring-[#3B82F6]/20'

# 제목 텍스트
- text-[var(--ops-text-strong)] → text-white font-bold text-[16px]

# subtitle/route
- text-[var(--ops-text-muted)] → text-slate-400

# due text
- text-[var(--ops-text-muted)] → text-slate-400
```

---

### W2-H: `components/overview/OpsSnapshot.tsx`

```diff
# 외부 wrapper (2곳 — 로딩 + 메인)
- 'bg-[#F8FAFC] border-t border-[var(--ops-border)]'
+ 'bg-[#071225] border-t border-white/8'

# 제목
- text-[var(--ops-text-strong)] → text-white

# loading skeleton
- 'bg-gray-200' / 'bg-[var(--ops-surface)]' → 'bg-white/10' / 'bg-white/5'

# SectionCard 내부
- 'rounded-xl bg-[var(--ops-surface)] border border-[var(--ops-border)]'
+ 'rounded-[20px] bg-[#0B1730] border border-white/8'
- title: text-[var(--ops-text-strong)] → text-white

# WH 바 track
- 'bg-slate-200'  → 'bg-white/10'

# WH location text
- text-[var(--ops-text-strong)] → text-slate-300

# WH sqm text
- text-[var(--ops-text-muted)] → text-slate-400

# Worklist row
- 'border border-[var(--ops-border)] ... hover:bg-slate-50'
+ 'border border-white/8 bg-white/[0.02] ... hover:bg-white/[0.04]'

# Worklist id text
- text-[var(--ops-text-strong)] → text-slate-200

# Exceptions border-l (Tailwind arbitrary)
- 'border-l-[var(--ops-risk)]'  → 'border-l-red-400'
- 'border-l-[var(--ops-warn)]'  → 'border-l-amber-400'
- 'border-l-[var(--ops-info)]'  → 'border-l-sky-400'

# Exceptions text
- text-[var(--ops-text-strong)] → text-slate-200
- text-[var(--ops-text-muted)]  → text-slate-400

# Feed text
- text-[var(--ops-text-strong)] → text-white
- text-[var(--ops-text-muted)]  → text-slate-400
```

---

### W2-I: `components/overview/OverviewToolbar.tsx`

```diff
- className="flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-4 py-2"
+ className="flex items-center justify-between border-b border-white/5 bg-[#09162b]/90 px-4 py-2 backdrop-blur-md"
```

---

## Wave 3 상세 — 나머지 페이지

### W3-A: Chain components

**`components/chain/FlowChain.tsx`**
```
- panel/card wrapper → 'rounded-[24px] border border-white/8 bg-[#0B1730]'
- table header row → 'border-b border-white/8 bg-white/[0.02]'
- table data row → 'border-b border-white/6 hover:bg-white/[0.03]'
- th → 'text-[12px] font-semibold text-slate-400'
- td → 'text-[13px] font-medium text-slate-200'
- bg-gray-* → 대응 dark 값으로 교체
- stage node (PIPELINE_STAGE_META 관련) light 색상 → dark 색상
```

**`components/chain/OriginCountrySummary.tsx`**
```
- bg-gray-* / bg-white → dark panel 계열
- text-gray-* → text-slate-* dark 계열
```

---

### W3-B: Pipeline components

**`components/pipeline/FlowPipeline.tsx`**
```
- stage bar wrapper: ui.panel (rounded-[24px] border border-white/8 bg-[#0B1730])
- stage number: text-white font-bold
- stage label: text-slate-300
- stage percentage: text-slate-400
- stage arrow: text-slate-500
```

**`components/pipeline/PipelineFilterBar.tsx`**
```
- wrapper: ui.panelSoft (rounded-[24px] border border-white/8 bg-[#0D1A35])
- chip active: bg-[#2563EB] text-white
- chip inactive: border-white/8 bg-white/5 text-slate-300
```

**`components/pipeline/VendorBar.tsx`**, **`TransportModeBar.tsx`**, **`WarehouseSqmBar.tsx`**, **`CustomsStatusCard.tsx`**
```
- 카드 wrapper → ui.panel
- bar track → bg-white/10
- bar fill → bg-[#3B82F6] / 상태별 색상
- text-gray-* → dark 계열
```

**`components/pipeline/PipelineTableWrapper.tsx`**
```
- wrapper: ui.panel + overflow-hidden
- 내부 Tailwind dark table 스타일
```

---

### W3-C: Sites components

**`components/sites/SiteCards.tsx`**
```diff
# card button
- 'bg-gray-800 rounded-lg p-4 text-left transition-all border-2'
+ className 교체 → {cn('rounded-[20px] border-2 p-5 text-left transition-all duration-150', ui.hoverCard, isSelected ? 'border-[#2563EB] bg-[#0D1A35] shadow-[0_0_0_1px_rgba(37,99,235,.25)]' : 'border-white/8 bg-[#0B1730] hover:border-white/15')}

# percent text
- 'text-2xl font-bold text-white'
+ 'text-[20px] font-bold text-white'

# progress track
- 'w-full bg-gray-700 rounded-full h-1.5'
+ 'w-full rounded-full h-2.5 bg-white/10'

# progress fill (JSX style attribute 유지, 배경색만)
  isAlert ? '#ef4444' : '#3b82f6'  (변경 없음 — 이미 좋음)

# count text
- 'text-xs text-gray-400'
+ 'text-[12px] text-slate-400'
```

**`components/sites/SiteDetail.tsx`**
```
- tab nav: 'flex items-center gap-6 border-b border-white/8 px-4'
- active tab: 'border-b-2 border-[#3B82F6] pb-3 text-[14px] font-semibold text-white'
- inactive tab: 'pb-3 text-[14px] font-medium text-slate-400 hover:text-slate-200'
- summary container: rounded-[24px] border border-white/8 bg-[#0B1730]
- KPI small boxes: rounded-[18px] border border-white/8 bg-[#0A1428] p-4
- gray 계열 → dark 계열
```

---

### W3-D: Cargo components

**`components/cargo/CargoTabs.tsx`**
```
- top tabs wrapper: 'flex items-center gap-8 border-b border-white/8 px-4'
- active tab: 'border-b-2 border-[#3B82F6] pb-3 text-[14px] font-semibold text-white'
- inactive tab: 'pb-3 text-[14px] font-medium text-slate-400 hover:text-slate-200'
```

**`components/cargo/WhStatusTable.tsx`**, **`ShipmentsTable.tsx`**, **`DsvStockTable.tsx`**
```
- table wrapper: ui.panel + overflow-hidden
- filter group: ui.panelSoft
- filter chip active: 'rounded-xl bg-[#2563EB] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,.28)]'
- filter chip inactive: 'rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white'
- table header: 'border-b border-white/8 bg-white/[0.02]'
- th: 'px-4 py-3 text-left text-[12px] font-semibold text-slate-400'
- table row: 'border-b border-white/6 bg-transparent hover:bg-white/[0.03]'
- td: 'px-4 py-3 text-[13px] font-medium text-slate-200'
- badge delivered: ui.badgeOk
```

---

## Wave 3 후 검증

```bash
pnpm --filter @repo/logistics-dashboard typecheck   # 0 errors
grep -rn "bg-white\b\|bg-gray-[0-9]" apps/logistics-dashboard/components/overview/
# → 결과 없어야 함 (Overview에 light bg 잔존 없음)
```

## 유지보수 포인트

| 항목 | 변경 위치 |
|---|---|
| gate badge 색상 | `lib/overview/ui.ts` gateClassLight() |
| site chip 색상 | `lib/overview/ui.ts` SITE_META.chipClass |
| 패널 토큰 전체 | `lib/overview/ui.ts` ui 상수 |
| topbar 배경 | DashboardHeader + OverviewToolbar |
| progress bar 색상 | OpsSnapshot pressureClass |
