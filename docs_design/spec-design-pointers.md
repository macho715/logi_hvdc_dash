# 동일 적용용: 디자인 포인터 종합

**문서 세트:** 원본과 동일하게 적용하기 위한 명세 문서 세트의 종합 기준.  
**세트 구성:** [색상 적용 명세](spec-color.md) · [테두리 적용 명세](spec-border.md) · [컴포넌트 좌표 명세](spec-coordinates.md) · [구현 갭·체크리스트](spec-gaps-checklist.md)

**대상:** HVDC Dashboard Replica  
**기준:** `layout-spec.md`, `tailwind.config.ts`, `OverviewPage.tsx`  
**목적:** 확장·유지보수·동일 적용 시 공통 디자인 기준(아트보드, 토큰, 레이아웃, 컴포넌트 패턴) 정리.

---

## 1. 아트보드 및 스케일

| 항목 | 값 | 비고 |
|------|-----|------|
| **아트보드 크기** | 2048 × 1365 px | 모든 좌표/치수 기준 |
| **스케일 방식** | `useArtboardScale()` + ResizeObserver | 컨테이너 너비 ÷ 2048, `transform: scale(s)` |
| **기준점** | `origin-top-left` | 좌상단 고정 후 비율 축소/확대 |
| **외곽 프레임** | `max-w-[1700px]`, `aspect-[2048/1365]`, `rounded-[30px]` | 뷰포트 대비 비율 유지 |

**포인터:** 모든 레이아웃은 **artboard px**로 정의하고, 런타임에 한 번만 scale 적용. 퍼센트/em 혼용 금지.

---

## 2. 글로벌 토큰

### 2.1 색상

| 역할 | Hex | Tailwind |
|------|-----|----------|
| 배경 기본 | `#050A18` | `hud-bg` |
| 패널 | `#0E1427` | `hud-panel` |
| 패널 대체 | `#10192E` | `hud-panelAlt` |
| 웜(플럼) | `#221623` | `hud-panelWarm` |
| 핫(레드) | `#2B1721` | `hud-panelHot` |
| 구분선 | `#1D2744` | `hud-line` |
| 구분선 강조 | `#243256` | `hud-lineStrong` |
| 본문 | `#F2F5FF` | `hud-text` |
| 보조 | `#C7D0E8` | `hud-textSoft` |
| 비활성/메타 | `#7C89A8` | `hud-textMuted` |
| 액센트 블루 | `#2F76FF` | `hud-blue` |
| 틸 | `#58E1C9` | `hud-teal` |
| 앰버 | `#F5C366` | `hud-amber` |
| 바이올렛 | `#8A58FF` | `hud-violet` |
| 오렌지 | `#FF9157` | `hud-orange` |
| 레드 | `#FF6E63` | `hud-red` |

**Soft 변이 (밝은 액센트):**

| 역할 | Hex | Tailwind |
|------|-----|----------|
| 블루 소프트 | `#4F8EFF` | `hud-blueSoft` |
| 틸 소프트 | `#71EED7` | `hud-tealSoft` |
| 앰버 소프트 | `#FFC56E` | `hud-amberSoft` |
| 바이올렛 소프트 | `#AB7CFF` | `hud-violetSoft` |

**코드 내 하드코딩 색상 (용도):**

| Hex | 용도 |
|-----|------|
| `#040814` | 페이지 래퍼 배경 (min-h-screen) |
| `#1E2A48` | 검색 입력 테두리 |
| `#24314E` | 맵 레전드 내부 패널 테두리 |
| `#26345A` | 하단 탭 활성 시 아이콘 컨테이너 배경 |
| `#7080A7` | 맵 레전드 빈 원형 마커 테두리 |
| `#CFD8F4` | 칩 Voyage 아이콘 |
| `#FFD39A` | 칩 Next 72h 아이콘 |
| `#F4C7B8` | KPI Open Radar 메타 텍스트 |
| `#F7DF8F` | AGI Readiness 메타 퍼센트 |
| `#F3C562` | Mission 블록 배지 |
| `#F5D36F` | AGI 카드 라벨 |
| Flow SVG | flowLine 그라데이션 5 stop (F8D870→70EAD4→8A58FF→7EA2FF→D6D7EE); 원 스트로크 #6C5D42, #6AD9D0, #F4D26E 등 |

### 2.2 타이포그래피

**폰트 패밀리:** `fontFamily.display` = Inter / Segoe UI / system-ui (layout-spec §1, tailwind `font-display`).

| 용도 | 크기 | line-height | letter-spacing | 클래스 |
|------|------|-------------|----------------|--------|
| 캡션/메타 | 11px | 14px | 0.02em | `hud-2xs` |
| 라벨/작은 텍스트 | 12px | 16px | 0.015em | `hud-xs` |
| 본문 보조 | 13px | 18px | 0.01em | `hud-sm` |
| 본문 | 16px | 22px | -0.01em | `hud-md` |
| 소제목 | 20px | 26px | -0.015em | `hud-lg` |
| KPI/숫자 | 30px | 34px | -0.03em | `hud-xl` |
| 대형 숫자 | 44px | 48px | -0.04em | `hud-2xl` |

- **카드 타이틀:** 12px, uppercase, tracking 0.18em  
- **카드 값:** 30px, semibold, -0.05em  

**컴포넌트별 추가 타이포:**

| 컴포넌트 | 크기 | weight / 비고 |
|----------|------|----------------|
| 타이틀 바 | 26px | semibold, 0.06em |
| 섹션 헤더 | 18px | medium |
| Site 카드 라벨 | 34px | semibold, 0.02em |
| Site 카드 값 | 50px | semibold, -0.05em |
| Site 카드 캡션 | 13px | hud-sm (layout-spec §6) |
| AGI 카드 라벨 | 34px | semibold |
| AGI 카드 값 | 56px, 60px, 44px, 42px | semibold, -0.04~-0.05em |
| AGI 캡션 | 18px | medium |
| Flow Summary 라벨 | 18px | medium |
| Flow Summary 값 | 22px | semibold, -0.03em |
| Mission 타이틀 | 16px | medium |
| Mission row primary | 15px | medium |
| Mission/맵 레전드 메타 | 10px | uppercase, 0.18em |
| 칩/버튼 | 12px | hud-xs, medium |

### 2.3 간격·모서리

- **Safe padding:** 24px (layout-spec §1).

**Radius 체계:** layout-spec은 "Base 22px", "Outer frame 30px"를 기준으로 둔다. Tailwind에는 `hud: 24px`, `hud-lg: 28px`가 정의되어 있으며, 코드에서는 14~30px를 컴포넌트별로 혼용한다.

| 반경 | Tailwind | 사용처 |
|------|----------|--------|
| 14px | — | 맵 레전드 하단 필 등 |
| 16px | — | Mission 행 카드 |
| 18px | — | 검색, 칩 컨테이너, Flow Summary, 미니맵, 사이드바 검색 버튼 |
| 20px | — | 맵 레전드 내부 패널, AGI 우측 컬럼 |
| 22px | — | KPI 카드, Site 카드, Mission 패널 (base radius) |
| 24px | `hud` | 맵 이미지 우측만 (0_24px_24px_0) |
| 28px | `hud-lg` | 맵 컨테이너 |
| 30px | — | 외곽 프레임 |  

---

## 3. 시각 언어 (HUD)

### 3.1 배경

- **쉘:** `hud-shell` — 블루/마젠타 라디얼 그라데이션 + 다크 베이스 (`#060B19` → `#040915`)
- **그리드 오버레이:** 70×70px, 흰색 3.5% 투명도, 상단 55% → 하단 페이드 (mask)
- **추가 글로우:** 원형 그라데이션 3개 (블루·오렌지·블루), 하단 비네트

### 3.2 카드/패널 배경 (backgroundImage)

| 토큰 | 용도 |
|------|------|
| `hud-card` | 쿨(네이비) KPI 카드 |
| `hud-card-hot` | 핫(레드) KPI 카드 |
| `hud-card-warm` | 웜(플럼) KPI 카드 |
| `hud-panel` | 사이드 레일, 맵 레전드 등 |
| `hud-divider` | 섹션 헤더 구분선 — 가로 그라데이션(90deg, rgba(84,110,186,0)→0.75→0.18) |
| `hud-grid` | 그리드 오버레이 — 1px 흰 3% 수평/수직 (토큰 정의; 실제 ArtboardBackground는 70×70 + mask 사용) |

공통(카드/패널): **라디얼 그라데이션(좌상단 또는 상단)** + **선형 그라데이션(위→아래)** + `inset` 하이라이트.

### 3.3 그림자·글로우

| 이름 | 용도 |
|------|------|
| `shadow-hud` | 큰 컨테이너 |
| `shadow-panel` | 카드/패널, inset 하이라이트 포함 |
| `shadow-glow-blue` | 활성 버튼·칩 |
| `shadow-glow-teal` | 틸 액센트 |
| `shadow-glow-amber` | 앰버/경고 포인트 |

**코드 내 커스텀 shadow:**  
- `0_0_12px_rgba(255,145,87,.45)` — 오버듀 ETA KPI 카드 오렌지 도트  
- `0_30px_100px_rgba(0,0,0,.6)` — 외곽 프레임

### 3.4 블러·애니메이션

- **backdropBlur:** `hud: 18px` — KPI 카드에 `backdrop-blur-hud` 적용.
- **animation:**  
  - `hud-pulse`: 2.8s ease-in-out infinite; keyframes: 0/100% opacity 0.7 scale(1), 50% opacity 1 scale(1.08).  
  - `hud-drift`: 16s linear infinite; keyframes: translateX 0 → 14px → 0.  
  (토큰은 tailwind에 정의되어 있으며, 현재 컴포넌트에서 `animate-*` 사용처는 없음.)

### 3.5 테마별 KPI 카드

- **cool:** 네이비 그라데이션, 블루 포인트  
- **hot:** 레드 톤 그라데이션, 오렌지/레드 포인트  
- **warm:** 플럼/앰버 그라데이션  
- **neutral:** 중립 패널

---

## 4. 레이아웃 구조

### 4.1 좌표 시스템

- **Box 컴포넌트:** `rect: { x, y, w, h }` (artboard px) → `position: absolute; left; top; width; height`
- 모든 블록이 동일 아트보드 내 절대 좌표로 배치되며, scale로만 전체가 축소/확대됨.

### 4.2 주요 영역 (artboard px)

| 영역 | x | y | w | h | 비고 |
|------|--|--|--|--|------|
| 사이드바 | 0 | 0 | 110 | 1365 | 검색(활성) y=78 |
| 타이틀 | 138 | 29 | 500 | 36 | "HVDC CONTROL TOWER" |
| 검색 | 145 | 84 | 865 | 50 | 왼쪽 아이콘 + 플레이스홀더 |
| 필터 칩 1 (Origin Arc) | 1030 | 88 | 115 | 38 | active |
| 필터 칩 2 (Voyage) | 1162 | 88 | 113 | 38 | inactive |
| 필터 칩 3 (Next 72h) | 1292 | 88 | 128 | 38 | active |
| 필터 칩 4 (Heatmap) | 1438 | 88 | 112 | 38 | inactive |
| Updated label | 1768 | 34 | 110 | 14 | 12px 메타 (예: Updated:06:45:23) |
| Language pill | 1881 | 26 | 123 | 40 | ENG 활성, 한국어 |
| KPI 행 | 146~1727 | 135 | 278~323 | 127 | 6개 카드 |
| 맵 컨테이너 | 132 | 293 | 1872 | 493 | rounded 28 |
| 맵 왼쪽 레전드 | 132 | 293 | 418 | 493 | 라우트/필터 레전드 |
| 맵 이미지 영역 | 550 | 293 | 1454 | 493 | left 418(컨테이너 내), width 1454; 우측만 rounded 0_24px_24px_0 |
| Site Health 헤더 | 145 | 806 | 1295 | 40 | |
| Mission Control 헤더 | 1476 | 806 | 472 | 40 | withChevron |
| Site 카드 | 145, 374, 604, 834 | 864 | 213 / 606 | 291 | SHU, MIR, DAS, AGI |
| Mission 블록 | 1476 | 866, 1018, 1178 | 472 | 138, 145, 144 | Critical Alerts, Action Queue, Next 72h |
| Flow 요약 | 145 | 1168 | 1295 | 101 | |
| 하단 탭 Logistics Chain | 145 | 1275 | 280 | 55 | active |
| 하단 탭 Pipeline | 430 | 1275 | 220 | 55 | |
| 하단 탭 Sites | 654 | 1275 | 206 | 55 | |
| 하단 탭 Cargo | 864 | 1275 | 230 | 55 | |

### 4.3 사이드바·섹션 헤더·플로우·탭 상세

**사이드바**
- 세로 아이콘 y 위치: 36, 94, 166, 229, 292, 355 (IconButton 5개 + 검색 1개).
- 검색 버튼: 68×68 at (8, 78), rounded 18, border `#2F76FF`/45, `shadow-glow-blue`.
- 우측 세로 라인: 1px 그라데이션 `rgba(59,86,165,.14)` → 0.

**섹션 헤더**
- 제목: 18px, medium, `hud-textSoft`.
- 구분선: left 204px, 높이 1px, `width: calc(100% - 220px)`, 그라데이션 `rgba(77,100,166,.65)` → `.12` → 0.
- Mission Control만 `withChevron`: 우측 "◐", "»" (text-hud-textMuted).

**Flow Summary**
- rect (145, 1168, 1295, 101); rounded 18.
- 상단 라벨 "Flow Summary": left 18px, top -40px(컨테이너 밖), 18px medium.
- flowStats: `{ value, label, x, width }[]` — 각 항목 text-center, x로 left 배치.
- SVG flowLine: linearGradient 5 stop (F8D870→70EAD4→8A58FF→7EA2FF→D6D7EE), path + 원 4개 stroke.
- "Sr / des": right 44px, top 66px, hud-2xs.

**하단 탭**
- 활성: border-white/8, 그라데이션 배경, `shadow-panel`; 아이콘 컨테이너 `bg-[#26345A]`.
- 비활성: border-white/6, 더 어두운 그라데이션; "▼" 표시.
- 탭별 아이콘: PIPELINE PipeIcon, SITES ArrowRightIcon, CARGO CubeIcon (hud-textMuted).

---

## 5. 컴포넌트 패턴

### 5.1 KPI 카드

- **데이터:** `id`, `rect`, `title`, `value`, `meta?`, `theme`
- **theme:** `cool` | `hot` | `warm` | `neutral` → 배경·테두리·포인트 색 결정
- **meta:** 보조 정보(도트, 퍼센트, 라벨 등) — 선택
- **내부:** `backdrop-blur-hud`; 반투명 라디얼 오버레이(opacity 55%); padding px-6 py-5; value mt-4. 오버듀(overdue) 전용 오렌지 도트는 커스텀 shadow `0_0_12px_rgba(255,145,87,.45)` 사용.

### 5.2 Site 카드

- **데이터:** `rect`, `label`, `value`, `accent`(hex), `theme`(그라데이션 문자열), `pending`, `warehouse`, `delta`, `deltaTrack`
- **하단 진행 바:** 높이 18px, accent 그라데이션(40→B3 hex), 좌측 delta / 우측 deltaTrack (11px).
- **AGI:** 단독 넓은 카드(606×291), 미니 맵 `/assets/hvdc-map-mini.png` 포함. 내부: 라벨 34px, 값 56px; 우측 컬럼 170px(60/44/42px 숫자); 미니맵 275×188 at (230,84); progress bar 높이 10px.

### 5.3 칩(Chip)

- **높이:** 38. **활성:** border `#2F76FF`/40, 블루 그라데이션 배경, `shadow-glow-blue`, 왼쪽 아이콘(도트/아이콘). **비활성:** border-white/6, 다크 그라데이션, `hud-textSoft`; 우측 "▼" 표시.

### 5.4 Mission 블록

- **데이터:** `rect`, `title`, `badge?`, `rows: [{ accent, primary, secondary }]`
- **accent:** 행 좌측 세로 바(4px×42px) 및 라벨 색(hex).
- 행 카드: min-h 64px, rounded 16, border-white/5; 배지 색 `#F3C562`. "Next 72 Hours" 블록 우측 "Incoming Chocket" hud-2xs.

### 5.5 IconButton, LegendItem, Dot

- **IconButton:** 26×26, rounded-full. 활성: border `#2F76FF`/60, bg `#2F76FF`/18, text white. 비활성: border-white/10, bg transparent, hud-textMuted.
- **LegendItem:** `color`, `title`, `subtitle`; 옵션 `bulb` | `hollow` | `square` | `small`. 크기 small 시 10, 기본 12. 형태: square(rounded-sm), hollow(테두리만), bulb(내부 작은 원), 기본(채운 원).
- **Dot:** `color`, `size`(기본 10), rounded-full; 인라인 인디케이터.

### 5.6 Box·useArtboardScale

- **Box:** `rect: { x, y, w, h }` → style `left`, `top`, `width`, `height`. 선택 `className`, `style`(rect 스타일과 merge), `children`.
- **useArtboardScale:** 인자 `ref`(HTMLElement), `designWidth`(2048). 반환 scale = `node.clientWidth / designWidth`. ResizeObserver로 컨테이너 크기 변경 시 재계산; cleanup에서 observer.disconnect().

---

## 6. 에셋 및 데이터

| 에셋 | 경로 | 용도 |
|------|------|------|
| 메인 맵 | `/assets/hvdc-map-main.png` | 중앙 맵 영역 (1454×493 영역) |
| 미니 맵 | `/assets/hvdc-map-mini.png` | AGI 카드 내 미니 맵 |

- 레이아웃 **지오메트리(rect, padding, radius)** 는 고정.
- 숫자·라벨·행 데이터는 **정적 배열 → API 응답으로 교체** 가능하도록 유지 (구조 변경 없이 데이터만 교체).

**데이터 구조 요약:**
- **flowStats:** `{ value: string, label: string, x: number, width: number }[]` — Flow Summary 내 항목 배치.
- **tabs:** `{ label: string, active: boolean, x: number, y: number, w: number, h: number }[]` — 하단 탭 4개.

---

## 7. 구현 시 체크리스트

- [ ] 모든 위치/크기는 artboard px로만 정의
- [ ] 스케일은 `useArtboardScale(ref, 2048)` 한 곳에서만 적용
- [ ] 색상/타이포/그림자는 `tailwind.config.ts`의 `hud-*` 토큰 사용
- [ ] 새 카드/패널은 `Box` + `rect` + theme 그라데이션 패턴 따름
- [ ] KPI 테마(cool/hot/warm/neutral)에 맞는 배경·글로우 선택
- [ ] 맵·미니맵 교체 시 비율 유지 (같은 rect에 `object-cover`)
- [ ] 폰트 패밀리(Inter / Segoe UI) 적용
- [ ] Soft 색상·하드코딩 색상 용도 유지
- [ ] radius 체계(14~30px) 컴포넌트별 준수
- [ ] backdrop-blur-hud, hud-divider/hud-grid 사용처 확인
- [ ] Section header 구분선·withChevron 옵션
- [ ] Flow Summary SVG·flowStats 좌표
- [ ] 칩/탭/IconButton 활성·비활성 스타일

---

## 8. Fidelity 및 참고

- **픽셀 일치:** 동일 폰트(Inter 등), 이미지 압축, 브라우저 앨리어싱, 에셋 파이프라인에 따라 시각 차이가 발생할 수 있음.
- **재구현 방식:** `public/assets` 맵 이미지는 원본 스크린샷에서 추출; 나머지 패널은 그라데이션·테두리·블러·글로우 토큰으로 코드 재구현됨 (layout-spec §9).

---

**문서 버전:** 1.1  
**기준 파일:** `app/overview/layout-spec.md`, `tailwind.config.ts`, `app/overview/OverviewPage.tsx`  
**최종 검증:** 2026-03-15 (tailwind·layout-spec·OverviewPage.tsx 3원 대조 완료)
