# 동일 적용용: 구현 갭·점검 체크리스트

**문서 세트:** 원본과 동일하게 적용하기 위한 명세 문서 세트 중 점검·갭 정리.  
**세트 구성:** [디자인 포인터 종합](spec-design-pointers.md) · [색상 적용 명세](spec-color.md) · [테두리 적용 명세](spec-border.md) · [컴포넌트 좌표 명세](spec-coordinates.md)

**목적:** 문서 세트만 보고 다른 프로젝트에 적용했을 때 원본과 다르게 나오는 원인·점검 순서 정리.  
**대상 URL 예:** 구현한 대시보드 `http://localhost:3004/overview`

**동일 적용 시 함께 참조:** 색상·테두리·좌표는 각 전용 문서([색상 적용 명세](spec-color.md), [테두리 적용 명세](spec-border.md), [컴포넌트 좌표 명세](spec-coordinates.md))를 참고하면 누락을 줄일 수 있음.

---

## 1. 스펙·문서 vs 코드 불일치

### 1.1 배경색

| 항목 | 문서(layout-spec §1) | 실제 코드(OverviewPage.tsx) | 영향 |
|------|----------------------|-----------------------------|------|
| Base background | `#050A18` | 페이지 래퍼 `#040814` 사용 | 문서대로 적용하면 원본보다 밝게 보임. 원본과 맞추려면 **#040814** 사용 필요. |

**권장:** 문서에 “실제 구현은 페이지 래퍼에 #040814 사용”이라고 명시하거나, layout-spec에 “(코드 기준: 래퍼 #040814)” 보충.

---

### 1.2 폰트 로딩

- **문서:** layout-spec §1·spec-design-pointers “Primary font: Inter / Segoe UI / system-ui”, tailwind `font-display`.
- **코드:** tailwind.config에만 `fontFamily.display: ['Inter', ...]` 정의. **Inter를 불러오는 코드 없음** (next/font, link 등).
- **영향:** Inter를 로드하지 않으면 시스템 폰트만 적용되어 원본과 글자 굵기·간격이 달라짐.

**권장:**  
- 적용하는 쪽에서 **Inter를 반드시 로드** (예: Next.js `next/font/google`의 Inter, 또는 Google Fonts link).  
- README 또는 spec-design-pointers에 “원본과 동일 시각을 위해 Inter 폰트 로드 필수” 문구 추가.

---

## 2. 문서만 보고 적용할 때 빠지기 쉬운 것

### 2.1 Tailwind 설정 누락

- **필수:** `tailwind.config.ts`를 **그대로** 프로젝트 루트에 두고, `theme.extend` 전체(hud 색상, fontSize, borderRadius, boxShadow, backgroundImage, backdropBlur, animation, keyframes)가 유지되어야 함.
- **content 경로:** `content`에 OverviewPage가 들어가는 경로가 포함되어야 함. 예: `'./app/**/*.{ts,tsx}'` 또는 컴포넌트를 둔 폴더.
- **영향:** config 미복사 또는 content 경로 오류 시 `hud-*`, `shadow-panel`, `bg-hud-shell` 등이 생성되지 않아 레이아웃·색이 깨짐.

**권장:** README에 “tailwind.config.ts를 수정하지 말고 복사한 뒤, content에 해당 페이지/컴포넌트 경로가 포함되는지 확인” 문구 추가.

---

### 2.2 PostCSS·globals.css

- **필수:** PostCSS에서 `tailwindcss` 사용, 전역 CSS에 `@tailwind base; components; utilities;` 포함.
- **영향:** 없으면 Tailwind 클래스가 적용되지 않아 화면이 비정상.

**권장:** README “Use” 절차에 “Tailwind + PostCSS 설정 및 @tailwind 디렉티브 적용” 단계 명시.

---

### 2.3 맵 에셋 경로·파일

- **코드:** `<img src="/assets/hvdc-map-main.png" />`, `/assets/hvdc-map-mini.png` (Next는 `public/` 기준).
- **문서:** layout-spec §9 “public/assets/hvdc-map-main.png, hvdc-map-mini.png”.
- **영향:**  
  - 파일 없음 → 맵 영역 빈칸/깨진 아이콘.  
  - 다른 경로(basePath, 다른 public 구조) → 404로 동일.

**권장:**  
- README에 “원본과 동일하게 보이려면 `public/assets/`에 `hvdc-map-main.png`, `hvdc-map-mini.png`를 반드시 둘 것” 명시.  
- 적용 프로젝트의 static 경로(예: Next `public`, Vite `public`)와 맞춰서 경로 설명.

---

### 2.4 스케일 컨테이너 구조

- **코드:** `useArtboardScale(ref, 2048)`로 `scale = container.clientWidth / 2048` 적용. ref는 `max-w-[1700px]`, `aspect-[2048/1365]`, `rounded-[30px]`인 div에 걸려 있음.
- **영향:**  
  - 이 div 바깥에 padding/margin을 크게 주거나, max-width를 바꾸면 비율이 달라짐.  
  - ref가 걸린 요소에 width가 없으면 scale이 0 또는 잘못된 값이 될 수 있음.

**권장:** spec-design-pointers 또는 README에 “OverviewPage 최상위 래퍼 구조와 클래스(max-w-[1700px], aspect-[2048/1365])를 유지할 것” 문구 추가.

---

### 2.5 path alias (@/)

- **README 예시:** `import OverviewPage from '@/app/overview/OverviewPage'`.
- **영향:** 적용 프로젝트의 `@`가 다른 루트를 가리키면 import 경로를 프로젝트에 맞게 바꿔야 함. 문서만 보고 그대로 쓰면 빌드 에러.

**권장:** README에 “@/는 프로젝트별 alias이므로, 실제 경로에 맞게 수정” 문구 추가.

---

## 3. 문서에 없는 구현 디테일

- 그라데이션·테두리·일부 색상은 **코드에만** 있고 layout-spec/spec-design-pointers에는 수치가 빠져 있음(예: ArtboardBackground의 여러 겹 그라데이션, 맵 레전드 내부 색, Mission 행 카드 배경 등).
- **영향:** 문서만 보고 “똑같이” 재구현하면 디테일에서 차이가 남.

**권장:** “픽셀 단위 동일을 원하면 OverviewPage.tsx를 그대로 사용하고, Tailwind 설정·에셋·폰트만 프로젝트에 맞춰 적용하는 방식을 권장” 문구를 README 또는 spec-design-pointers에 추가.

---

## 4. 원본과 똑같이 안 나올 때 점검 순서

1. **배경:** 페이지 래퍼 배경이 **#040814**인지 확인 (문서의 #050A18이 아니라 코드 기준).
2. **폰트:** Inter가 실제로 로드되는지(Network 탭 또는 개발자도구 폰트 패널) 확인.
3. **Tailwind:** `hud-text`, `bg-hud-shell`, `shadow-panel` 등이 적용되는지 확인. 미적용 시 tailwind.config 복사·content 경로·PostCSS·@tailwind 확인.
4. **맵 이미지:** `/assets/hvdc-map-main.png`, `/assets/hvdc-map-mini.png`가 200으로 응답하는지 확인. 404면 public 경로 및 파일명 확인.
5. **스케일:** 아트보드가 창 너비에 맞게 비율로 줄어드는지 확인. ref가 걸린 div에 `max-w-[1700px]`, `aspect-[2048/1365]` 유지 여부 확인.
6. **구성요소 누락:** README “Use” 1~4단계( tailwind.config, OverviewPage.tsx, public/assets, 렌더 방식)가 모두 적용되었는지 확인.

---

## 5. 문서 보완 제안 요약

| 문서 | 보완 제안 |
|------|-----------|
| layout-spec.md | §1에 “(구현: 페이지 래퍼 배경 #040814)” 보충. §9에 “Inter 폰트 로드 권장” 추가. |
| spec-design-pointers.md | “원본 동일 시 Inter 로드 필수, 스케일용 래퍼 구조 유지” 문구 추가. |
| README.md | “Tailwind content 경로·PostCSS·@tailwind 확인”, “public/assets 맵 이미지 필수”, “@/ alias는 프로젝트에 맞게 수정”, “픽셀 동일은 OverviewPage.tsx 그대로 사용 권장” 추가. |

---

**문서 버전:** 1.0  
**기준:** layout-spec.md, spec-design-pointers.md, README.md, OverviewPage.tsx
