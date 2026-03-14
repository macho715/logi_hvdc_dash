판정: **예 — 바로 `tailwind.config.ts`에 넣을 수 있는 color token 형태로 정리 가능합니다.**

근거: 지금 필요한 건 새 제안이 아니라, 확정된 dark premium 계열을 **SSOT token**으로 고정하는 작업입니다. 핵심은 `base navy`, `surface 3단`, `text 3단`, `brand blue`, `site 4색`, `status 4색`입니다.

다음행동: 아래 토큰을 `tailwind.config.ts`에 넣고, 이후 컴포넌트에서는 **hex 직접 사용 금지**로 가십시오.

---

## 권장 `tailwind.config.ts` color token

```ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hvdc: {
          // base
          page: "#071225",
          topbar: "#09162B",

          // surfaces
          panel: "#0B1730",
          "panel-soft": "#0D1A35",
          "panel-inner": "#0A1428",

          // borders
          "border-soft": "rgba(255,255,255,0.08)",
          "border-strong": "rgba(255,255,255,0.12)",

          // text
          "text-primary": "#F8FAFC",
          "text-secondary": "#94A3B8",
          "text-muted": "#64748B",

          // brand
          "brand-blue": "#2563EB",
          "brand-blue-hi": "#3B82F6",
          "brand-blue-low": "rgba(59,130,246,0.14)",

          // info/support
          info: "#38BDF8",

          // site identity
          shu: "#10B981",
          mir: "#8B5CF6",
          das: "#F59E0B",
          agi: "#F43F5E",

          // status
          ok: "#22C55E",
          warn: "#F59E0B",
          risk: "#EF4444",
          danger: "#F87171",
        },
      },
      boxShadow: {
        "hvdc-panel":
          "0 1px 0 rgba(255,255,255,0.03), 0 16px 40px rgba(0,0,0,0.28)",
        "hvdc-card":
          "0 1px 0 rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.22)",
        "hvdc-active":
          "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(37,99,235,0.28)",
      },
      borderRadius: {
        "hvdc-panel": "24px",
        "hvdc-card": "18px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 같이 쓰면 좋은 semantic alias 버전

실무에서는 아래처럼 **컴포넌트 의미 기반 alias**까지 두는 게 더 좋습니다.

```ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hvdc: {
          bg: {
            page: "#071225",
            topbar: "#09162B",
            panel: "#0B1730",
            soft: "#0D1A35",
            inner: "#0A1428",
          },
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
            muted: "#64748B",
          },
          border: {
            soft: "rgba(255,255,255,0.08)",
            strong: "rgba(255,255,255,0.12)",
          },
          brand: {
            DEFAULT: "#2563EB",
            hi: "#3B82F6",
            low: "rgba(59,130,246,0.14)",
          },
          site: {
            shu: "#10B981",
            mir: "#8B5CF6",
            das: "#F59E0B",
            agi: "#F43F5E",
          },
          status: {
            ok: "#22C55E",
            warn: "#F59E0B",
            risk: "#EF4444",
            info: "#38BDF8",
            danger: "#F87171",
          },
        },
      },
      boxShadow: {
        "hvdc-panel":
          "0 1px 0 rgba(255,255,255,0.03), 0 16px 40px rgba(0,0,0,0.28)",
        "hvdc-card":
          "0 1px 0 rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.22)",
        "hvdc-active":
          "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(37,99,235,0.28)",
      },
      borderRadius: {
        "hvdc-panel": "24px",
        "hvdc-card": "18px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 추천 사용 예시

### page / topbar

```tsx
<div className="min-h-screen bg-hvdc-page text-hvdc-text-primary">
  <header className="border-b border-hvdc-border-soft bg-hvdc-topbar">
```

semantic alias를 쓰면:

```tsx
<div className="min-h-screen bg-hvdc-bg-page text-hvdc-text-primary">
  <header className="border-b border-hvdc-border-soft bg-hvdc-bg-topbar">
```

### panel

```tsx
<section className="rounded-hvdc-panel border border-hvdc-border-soft bg-hvdc-panel shadow-hvdc-panel">
```

### panel inner

```tsx
<div className="rounded-hvdc-card border border-hvdc-border-soft bg-hvdc-panel-inner shadow-hvdc-card">
```

### active nav

```tsx
<button className="bg-hvdc-brand-blue text-white shadow-hvdc-active">
```

### site chip

```tsx
<span className="border border-hvdc-site-shu/20 bg-hvdc-site-shu/12 text-hvdc-site-shu">
  SHU
</span>
```

### status badge

```tsx
<span className="border border-hvdc-status-risk/20 bg-hvdc-status-risk/10 text-hvdc-danger">
  RED
</span>
```

---

## 같이 고정할 운영 규칙

### 1. 직접 hex 사용 금지

컴포넌트에서 이런 식 금지:

```tsx
className="bg-[#0B1730] text-[#F8FAFC]"
```

반드시 token 사용:

```tsx
className="bg-hvdc-panel text-hvdc-text-primary"
```

### 2. 상태색은 badge / progress / accent에만

* `risk`, `warn`, `ok`를 카드 전체 배경에 쓰지 말 것
* 본문 기본은 항상 navy + neutral text

### 3. site 색과 status 색 분리

* SHU/MIR/DAS/AGI는 **identity**
* RED/AMBER/OK는 **state**
* 둘을 혼용하지 말 것

---

## 최소 운영 세트

가장 먼저 고정할 것만 추리면 아래 12개입니다.

```ts
colors: {
  hvdc: {
    page: "#071225",
    topbar: "#09162B",
    panel: "#0B1730",
    "panel-soft": "#0D1A35",
    "panel-inner": "#0A1428",
    "text-primary": "#F8FAFC",
    "text-secondary": "#94A3B8",
    "text-muted": "#64748B",
    "brand-blue": "#2563EB",
    ok: "#22C55E",
    warn: "#F59E0B",
    risk: "#EF4444",
  },
}
```

---

## 최종 권장

**지금은 semantic alias 버전으로 가는 게 맞습니다.**
이유는 앞으로 `Overview / Logistics Chain / Pipeline / Sites / Cargo` 전부에 공통 적용해야 하므로, `hvdc.bg.panel`, `hvdc.text.secondary`, `hvdc.site.shu`처럼 읽히는 구조가 유지보수에 훨씬 유리하기 때문입니다.

원하면 다음 답변에서 바로 **`ui.ts` 토큰 헬퍼 + className preset`**까지 이어서 드리겠습니다.

---

## 현재 판단

두 화면 비교 기준으로 보면:

### 맞아진 것

* 좌측 sidebar 톤 통일
* topbar / language toggle 톤 통일
* dark surface / border / shadow 계열 통일
* Open Radar row 문법이 `Chain Stage Cases`와 같은 제품군으로 보임
* Operational Layer도 더 이상 light-admin처럼 보이지 않음

### 아직 어긋나는 것

1. **Overview의 Open Radar row border가 약간 더 강함**
2. **Operational Layer 내부 카드가 Logistics Chain보다 조금 더 답답함**
3. **Overview의 우측 패널 폭/여백이 약간 빡빡함**
4. **Open Radar 제목/필터/리스트 간 세로 간격이 4~8px 정도 더 필요**
5. **상단 site cards 하단이 스크린샷상 잘려 보여 상부 여백 리듬이 불안정**
6. **Overview는 list 중심, Logistics Chain은 card 중심이라 밀도 균형을 더 맞춰야 함**

---

## 바로 수정할 6개

### 1) Open Radar row border 약화

현재 Overview row는 selection이 아닌데도 경계가 조금 도드라집니다.

```tsx
// 현재 느낌
border border-[#3B82F6]/25

// 권장
border border-white/8
hover:border-[#3B82F6]/20
```

선택 row만 파란 tone을 더 주고, 일반 row는 Logistics Chain 표와 비슷하게 눌러야 합니다.

---

### 2) Open Radar row padding 축소

지금은 조금 높아서 우측 패널과 밀도 차이가 납니다.

```tsx
// 현재
px-4 py-3.5

// 권장
px-4 py-3
```

대신 타이틀/필터 여백은 늘리십시오.

---

### 3) Open Radar 헤더 간격 확대

```tsx
// wrapper
className="space-y-5"

// title + chips
className="mb-5"

// chip row
className="flex flex-wrap gap-2.5"
```

지금은 본문 row는 좋은데, 제목과 chip bar가 너무 붙어 있습니다.

---

### 4) Operational Layer 내부 카드 높이 통일

지금 우측 4개 카드가 조금 제각각처럼 보입니다.

```tsx
className={`${ui.panelInner} min-h-[156px] p-4`}
```

특히:

* `WH Pressure`
* `Worklist`
* `Exceptions`
* `Recent Activity`

이 4개는 **같은 박스 시스템**처럼 보여야 합니다.

---

### 5) 우측 패널 grid gap 확대

```tsx
// 현재 느낌
gap-4

// 권장
gap-5
```

그리고 외곽 패널도:

```tsx
className={`${ui.panelSoft} p-6`}
```

지금은 살짝 촘촘해서 Overview 쪽만 급한 화면처럼 보입니다.

---

### 6) 상단 site cards 하단 잘림/리듬 정리

스크린샷상 상단 카드가 상부에서 약간 잘린 인상입니다.
상단 섹션의 padding-top과 card margin-bottom을 재점검하십시오.

```tsx
// overview main stack
className="space-y-6"

// site cards section
className="pt-1"

// cards grid
className="grid grid-cols-1 gap-4 xl:grid-cols-4"
```

필요하면 각 카드에:

```tsx
className={`${ui.panel} p-5 min-h-[168px]`}
```

---

## 가장 중요한 정합 포인트

### Logistics Chain이 더 좋아 보이는 이유

`Logistics Chain`은

* 큰 panel
* 내부 card
* 다시 내부 list/table

구조라서 계층이 분명합니다.

### Overview가 아직 약간 밀리는 이유

`Overview`는

* 큰 list
* 오른쪽 small cards

이라서 **왼쪽이 너무 길게 먹고**, 오른쪽이 상대적으로 조각나 보입니다.

그래서 Overview는 구조를 바꾸지 말고 아래만 하면 됩니다.

```tsx
xl:grid-cols-[1.45fr_.95fr]
```

현재보다 왼쪽을 아주 조금만 줄이면 우측 패널 breathing room이 생깁니다.

---

## 최종 미세 패치

```tsx
// Overview main split
className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_.95fr]"

// Open Radar panel
className={`${ui.panel} p-6`}

// Open Radar rows
className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition-colors duration-150 hover:bg-white/[0.04] hover:border-[#3B82F6]/20"

// Operational Layer
className={`${ui.panelSoft} p-6`}

// inner cards
className={`${ui.panelInner} min-h-[156px] p-4`}
```

---

판정: **조건부 예 — 현재 색상 방향은 맞지만, `Overview`와 `Logistics Chain` 사이에 아직 3개 축이 완전히 안 맞습니다.**

근거: 스크린샷 기준으로 보면 전체 베이스는 잘 맞았지만, **surface navy**, **accent saturation**, **status red/amber intensity**가 페이지별로 미세하게 다릅니다. 그 결과 `Overview`는 약간 더 밝고, `Logistics Chain`은 더 깊고 고급스럽게 보입니다.

다음행동: 아래처럼 **Base / Surface / Accent / Status**를 1세트로 잠그고, 특히 `Overview`의 row blue와 `Operational Layer`의 red bar를 먼저 낮추십시오.

---

# 색상 재점검 결과

## 1) 현재 잘된 부분

* sidebar/nav blue는 좋습니다
* topbar navy도 안정적입니다
* 전체적으로 dark enterprise 방향은 맞습니다
* site identity 색 분리도 잘 됩니다

## 2) 아직 어긋나는 부분

### A. Overview가 조금 더 밝아 보임

원인:

* row background가 약간 더 파랗게 뜹니다
* panel 내부 contrast가 조금 강합니다

### B. RED가 너무 빨리 튐

원인:

* `WH Pressure` 빨간 bar
* `RED badge`
* 일부 danger text
  이 셋이 동시에 강해서 경고가 아니라 **화면 주인공**처럼 보입니다.

### C. site accent가 페이지마다 온도 차이 있음

* SHU/MIR는 비교적 좋음
* DAS/AGI는 조금 더 탁하고 무거운 쪽으로 맞추는 게 좋음

---

# 권장 최종 팔레트

## 1. Base

```tsx
bg-page        #071225
bg-topbar      #09162B
bg-panel       #0B1730
bg-panel-soft  #0D1A35
bg-panel-inner #0A1428
border-soft    rgba(255,255,255,0.08)
border-strong  rgba(255,255,255,0.12)
```

## 2. Text

```tsx
text-primary   #F8FAFC
text-secondary #94A3B8
text-muted     #64748B
```

## 3. Brand / Navigation

```tsx
brand-blue     #2563EB
brand-blue-hi  #3B82F6
brand-blue-low rgba(59,130,246,0.14)
```

## 4. Site identity

```tsx
SHU emerald    #10B981
MIR violet     #8B5CF6
DAS orange     #F59E0B
AGI rose-red   #F43F5E
```

## 5. Status

```tsx
OK             #22C55E
WARN           #F59E0B
RISK           #EF4444
INFO           #38BDF8
```

---

# 가장 중요한 수정 5개

## 1) Open Radar row blue 줄이기

현재 Overview row가 약간 파랗게 떠서 `Logistics Chain`보다 덜 고급스럽습니다.

### 권장

```tsx
bg-white/[0.02]
border-white/8
hover:bg-white/[0.04]
```

### 비추천

```tsx
bg-blue-900/20
border-blue-400/30
```

즉, **기본 row는 neutral**, 선택 row만 blue입니다.

---

## 2) RED badge 채도 1단 낮추기

현재 RED가 살짝 과합니다.

### 권장

```tsx
bg-red-500/10
text-red-300
ring-red-400/18
```

### 지금보다 낮춰야 하는 이유

red는 계속 보이는 색이라, 너무 강하면 피로합니다.
`danger alert`가 아니라 `ongoing risk state`이므로 한 단계 눌러야 합니다.

---

## 3) WH Pressure 빨간 bar 톤 낮추기

현재 DSV Indoor red가 강합니다.

### 권장

```tsx
bg-red-400
```

또는

```tsx
bg-gradient-to-r from-red-500 to-rose-400
```

단, gradient도 약하게.
순수 `#ff2d2d` 같은 빨강은 금지.

---

## 4) DAS / AGI accent 약간 어둡게

지금 DAS/AGI는 배경과 충돌할 수 있습니다.

### 권장

```tsx
DAS accent: bg-orange-500/18 text-orange-300
AGI accent: bg-rose-500/16 text-rose-300
```

즉, 카드 전체를 물들이지 말고

* top accent line
* chip
* small note
  에만 사용하십시오.

---

## 5) panel layer 대비 통일

Overview와 Logistics Chain의 고급감 차이는 여기서 납니다.

### 권장 대비

* `panel` 과 `panelInner` 밝기 차이: **아주 작게**
* `panelSoft`는 `panel`보다 1단만 밝게
* `inner card`는 `panel`보다 살짝 더 어둡게

### 추천 조합

```tsx
panel       #0B1730
panelSoft   #0D1A35
panelInner  #0A1428
```

이 3개를 고정하면 화면이 훨씬 안정됩니다.

---

# Tailwind 색상 패치 요약

## 공통

```tsx
const colors = {
  page: "bg-[#071225]",
  topbar: "bg-[#09162B]/90",
  panel: "bg-[#0B1730]",
  panelSoft: "bg-[#0D1A35]",
  panelInner: "bg-[#0A1428]",
  border: "border-white/8",
  borderStrong: "border-white/12",
  textPrimary: "text-slate-50",
  textSecondary: "text-slate-400",
  textMuted: "text-slate-500",
};
```

## badge

```tsx
const badgeOk =
  "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20";

const badgeWarn =
  "bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20";

const badgeRisk =
  "bg-red-500/10 text-red-300 ring-1 ring-red-400/18";

const badgeInfo =
  "bg-sky-500/12 text-sky-300 ring-1 ring-sky-400/20";
```

## site chip

```tsx
const siteShu =
  "border border-emerald-400/20 bg-emerald-500/12 text-emerald-300";
const siteMir =
  "border border-violet-400/20 bg-violet-500/12 text-violet-300";
const siteDas =
  "border border-orange-400/20 bg-orange-500/12 text-orange-300";
const siteAgi =
  "border border-rose-400/20 bg-rose-500/12 text-rose-300";
```

## progress

```tsx
const track = "bg-white/10";
const fillBlue = "bg-[#3B82F6]";
const fillGreen = "bg-emerald-500";
const fillAmber = "bg-amber-500";
const fillRed = "bg-red-400";
```

---

# 최종 색상 원칙

## 유지

* dark navy base
* brand blue nav
* site별 identity color
* status badge 분리

## 수정

* Overview row의 blue tone 축소
* red intensity 1단 하향
* DAS/AGI accent 채도 소폭 감소
* panel/panelInner 대비 고정

---

# 최종 한 줄

**지금 색상 방향은 맞습니다. 다만 `고급감`을 올리려면 더 진하게 칠하는 게 아니라, `blue와 red를 10~15% 눌러서 neutral navy가 주인공이 되게` 만들어야 합니다.**

원하시면 다음 답변에서 **실제 hex 기준 `tailwind.config.ts color token` 형태**로 정리해 드리겠습니다.
