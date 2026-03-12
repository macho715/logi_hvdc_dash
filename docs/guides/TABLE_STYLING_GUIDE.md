# 테이블 스타일 변경 가이드

> 대시보드 테이블(WorklistTable, RightPanel 등)의 스타일을 변경하는 방법

---

## 📋 현재 테이블 컴포넌트

### 1. WorklistTable
- **위치**: `apps/logistics-dashboard/components/hvdc/WorklistTable.tsx`
- **용도**: HVDC Worklist 테이블 (Gate, Flow, Title, ETA 등)

### 2. RightPanel Location Status
- **위치**: `apps/logistics-dashboard/components/dashboard/RightPanel.tsx`
- **용도**: Location Status 목록

---

## 🎨 스타일 변경 방법

### 방법 1: 컴포넌트에서 직접 Tailwind 클래스 수정 (권장)

**WorklistTable.tsx** 파일을 열고 원하는 클래스를 수정:

```tsx
// 현재 (line 26)
<table className="min-w-full text-xs">

// 예시: 더 큰 텍스트, 배경색 추가
<table className="min-w-full text-sm bg-card border border-border rounded-md">

// 현재 헤더 (line 27)
<thead className="sticky top-0 bg-muted/70 text-muted-foreground">

// 예시: 더 진한 헤더 배경
<thead className="sticky top-0 bg-muted text-foreground font-semibold border-b border-border">

// 현재 행 (line 46)
className={`cursor-pointer border-t border-border/60 hover:bg-accent/40 ${
  active ? "bg-accent/60" : "bg-background"
}`}

// 예시: 더 강한 hover 효과
className={`cursor-pointer border-t border-border hover:bg-accent/60 transition-colors ${
  active ? "bg-accent border-l-4 border-l-primary" : "bg-background"
}`}
```

### 방법 2: globals.css에 커스텀 스타일 추가

**`apps/logistics-dashboard/app/globals.css`** 파일에 추가:

```css
/* WorklistTable 커스텀 스타일 */
.worklist-table {
  @apply min-w-full text-sm;
}

.worklist-table thead {
  @apply sticky top-0 bg-muted/90 text-foreground font-semibold;
  backdrop-filter: blur(8px);
}

.worklist-table tbody tr {
  @apply border-t border-border/60 transition-colors;
}

.worklist-table tbody tr:hover {
  @apply bg-accent/50;
}

.worklist-table tbody tr.active {
  @apply bg-accent border-l-4 border-l-primary;
}

.worklist-table td {
  @apply px-4 py-2.5;
}

.worklist-table th {
  @apply px-4 py-2.5 text-left font-semibold;
}
```

그리고 **WorklistTable.tsx**에서 사용:

```tsx
<table className="worklist-table">
  <thead>
    {/* ... */}
  </thead>
  <tbody>
    <tr className={active ? "active" : ""}>
      {/* ... */}
    </tr>
  </tbody>
</table>
```

### 방법 3: 테마 변수 수정 (전역 색상 변경)

**`apps/logistics-dashboard/app/globals.css`**의 CSS 변수 수정:

```css
:root {
  /* 테이블 관련 색상 커스터마이징 */
  --muted: oklch(0.95 0 0);        /* 헤더 배경 (밝게) */
  --muted-foreground: oklch(0.3 0 0); /* 헤더 텍스트 (어둡게) */
  --accent: oklch(0.95 0 0);        /* hover 배경 */
  --border: oklch(0.85 0 0);       /* 테두리 (더 진하게) */
}
```

---

## 🎯 일반적인 스타일 변경 예시

### 1. 테이블 크기/간격 조정

```tsx
// 텍스트 크기
<table className="min-w-full text-sm">  // text-xs → text-sm

// 패딩 증가
<th className="px-4 py-3 text-left">    // px-3 py-2 → px-4 py-3
<td className="px-4 py-3">              // px-3 py-2 → px-4 py-3
```

### 2. 헤더 스타일 변경

```tsx
// 더 진한 헤더
<thead className="sticky top-0 bg-muted text-foreground font-semibold border-b-2 border-border">

// 그라데이션 헤더
<thead className="sticky top-0 bg-gradient-to-r from-muted to-muted/80 text-foreground">
```

### 3. 행 스타일 변경

```tsx
// 줄무늬 (zebra striping)
<tr className={`border-t border-border ${
  index % 2 === 0 ? "bg-background" : "bg-muted/30"
}`}>

// 더 강한 hover 효과
<tr className="hover:bg-accent/60 transition-all duration-150">

// 선택된 행 강조
<tr className={active ? "bg-primary/20 border-l-4 border-l-primary shadow-sm" : ""}>
```

### 4. 셀 스타일 변경

```tsx
// 숫자 컬럼 정렬 및 폰트
<td className="px-3 py-2 text-right tabular-nums font-mono text-foreground">

// 중요 컬럼 강조
<td className="px-3 py-2 font-semibold text-primary">
```

### 5. 테이블 컨테이너 스타일

```tsx
// 그림자 추가
<div className="h-full overflow-auto rounded-lg border border-border shadow-lg">

// 배경색 추가
<div className="h-full overflow-auto rounded-lg border border-border bg-card">
```

---

## 📝 실제 적용 예시

### 예시 1: 더 큰 텍스트와 간격

```tsx
// WorklistTable.tsx 수정
<table className="min-w-full text-sm">  // text-xs → text-sm
  <thead className="sticky top-0 bg-muted/90 text-foreground font-semibold">
    <tr>
      <th className="px-4 py-3 text-left">Gate</th>  // px-3 py-2 → px-4 py-3
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    <tr className="border-t border-border hover:bg-accent/50 transition-colors">
      <td className="px-4 py-3">  // px-3 py-2 → px-4 py-3
        {/* ... */}
      </td>
    </tr>
  </tbody>
</table>
```

### 예시 2: 줄무늬 테이블

```tsx
{visible.map((row, index) => {
  const active = row.id === selectedCaseId
  return (
    <tr
      key={row.id}
      className={`border-t border-border ${
        active 
          ? "bg-primary/20 border-l-4 border-l-primary" 
          : index % 2 === 0 
            ? "bg-background" 
            : "bg-muted/20"
      } hover:bg-accent/50 transition-colors`}
    >
      {/* ... */}
    </tr>
  )
})}
```

### 예시 3: 더 진한 헤더와 테두리

```tsx
<div className="h-full overflow-auto rounded-lg border-2 border-border bg-card shadow-md">
  <table className="min-w-full text-sm">
    <thead className="sticky top-0 bg-muted border-b-2 border-border">
      <tr>
        <th className="px-4 py-3 text-left font-bold text-foreground">Gate</th>
        {/* ... */}
      </tr>
    </thead>
    {/* ... */}
  </table>
</div>
```

---

## 🎨 Tailwind CSS 클래스 참고

### 색상
- `bg-background` / `bg-card` / `bg-muted` / `bg-accent`
- `text-foreground` / `text-muted-foreground` / `text-primary`

### 간격
- `px-3 py-2` → `px-4 py-3` (더 넓은 패딩)
- `gap-1` → `gap-2` (요소 간 간격)

### 텍스트
- `text-xs` → `text-sm` → `text-base` (크기)
- `font-medium` → `font-semibold` → `font-bold` (굵기)

### 효과
- `hover:bg-accent/40` → `hover:bg-accent/60` (hover 강도)
- `transition-colors` (색상 전환 애니메이션)
- `shadow-sm` → `shadow-md` → `shadow-lg` (그림자)

---

## 📚 관련 파일

- **테이블 컴포넌트**: `apps/logistics-dashboard/components/hvdc/WorklistTable.tsx`
- **전역 스타일**: `apps/logistics-dashboard/app/globals.css`
- **테마 변수**: `globals.css`의 `:root` 및 `.dark` 섹션

---

## 💡 팁

1. **Tailwind IntelliSense**: VSCode에서 Tailwind 클래스 자동완성 지원
2. **브라우저 DevTools**: 개발자 도구로 실시간 스타일 확인
3. **Hot Reload**: Next.js가 변경사항을 자동으로 반영

---

**Last updated**: 2026-02-07

**최근 변경사항** (2026-02-05~2026-02-07):
- 타이포그래피 개선: 기본 폰트 크기 16px, 주요 라벨 text-sm 기준, 대비 향상
- HVDC 워크리스트 간소화: 핵심 컬럼만 표시 (Gate/Title/Due/Score), 상세는 DetailDrawer
- RightPanel 탭 UI: Status/Occupancy/Distribution 분리
- KPI 요약 스트립 헤더 고정: 2행 구조, `aria-live="polite"`
