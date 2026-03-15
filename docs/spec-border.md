# 동일 적용용: 테두리(border) 적용 명세

**문서 세트:** 원본과 동일하게 적용하기 위한 명세 문서 중 테두리 적용 항목.  
**세트 구성:** [디자인 포인터 종합](spec-design-pointers.md) · [색상 적용 명세](spec-color.md) · [컴포넌트 좌표 명세](spec-coordinates.md) · [구현 갭·체크리스트](spec-gaps-checklist.md)

**기준 파일:** `app/overview/OverviewPage.tsx`  
**목적:** 박스/컴포넌트별 border 적용 내용 정리. 동일 적용 시 테두리 클래스·위치 참조.

---

## 1. 전체 프레임·메인 영역

| 위치(행) | 요소 | 테두리 클래스 | 비고 |
|----------|------|----------------|------|
| 233 | 외곽 프레임 (아트보드 컨테이너) | `border border-white/5` | 전체 대시보드 감싸는 박스 |
| 279 | 사이드바 rail | `border-r border-white/5` | 우측만 세로 테두리 |
| 352 | 맵 컨테이너 | `border border-white/6` | 메인 맵 + 레전드 감싸는 박스 |
| 371 | 맵 레전드 rail (왼쪽) | `border-r border-white/5` | 우측만 세로 테두리 |

---

## 2. 상단 바 (TopBar)

| 위치(행) | 요소 | 테두리 클래스 | 비고 |
|----------|------|----------------|------|
| 284 | 검색 버튼 (사이드바) | `border border-[#2F76FF]/45` | 블루 톤 |
| 312 | 검색 입력 | `border border-[#1E2A48]` | 네이비 톤 |
| 328 | 언어 pill (ENG/한국어) | `border border-white/6` | 둥근 pill |

---

## 3. 맵 레전드 내부

| 위치(행) | 요소 | 테두리 클래스 | 비고 |
|----------|------|----------------|------|
| 374 | 레전드 메인 패널 (321×380) | `border border-[#24314E]` | 네이비 계열 |
| 376 | 레전드 라벨 "Hode" 원형 마커 | `border border-[#7080A7]` | 회색 톤, 배경 투명 |
| 387 | 레전드 내부 박스 (LegendItem 그룹) | `border border-white/5` | |
| 397 | 레전드 하단 "Gate Voyared" 박스 | `border border-white/5` | |

---

## 4. KPI·Site·Mission·Flow

| 위치(행) | 요소 | 테두리 클래스 | 비고 |
|----------|------|----------------|------|
| 431 | AGI 카드 (큰 Site 카드) | `border border-white/6` | |
| 482 | Flow Summary 박스 | `border border-white/5` | |
| 545–548 | 하단 탭 (4개) | 활성 `border-white/8`, 비활성 `border-white/6` | rounded-full |
| 600 | KPI 카드 (6개) | `border border-white/6` | themeClass와 함께 |
| 619 | Site 카드 (SHU, MIR, DAS) | `border border-white/6` | |
| 668 | Mission 패널 (3개) | `border border-white/6` | |
| 684 | Mission 행 카드 (각 블록 내 row) | `border border-white/5` | min-h-64px |
| 691 | Mission 행 내 자물쇠 아이콘 셀 | `border border-white/6` | 8×8 그리드 셀 |

---

## 5. 칩·아이콘 버튼·레전드 아이템

| 위치(행) | 요소 | 테두리 클래스 | 비고 |
|----------|------|----------------|------|
| 91 | KPI MOSB "×" 아이콘 | `border border-hud-amber/40` | 앰버 톤 |
| 719–722 | 필터 칩 (Origin Arc, Voyage 등) | 활성 `border-[#2F76FF]/40`, 비활성 `border-white/6` | |
| 743–746 | 사이드바 IconButton | 활성 `border-[#2F76FF]/60`, 비활성 `border-white/10` | 26×26 원형 |
| 782 | LegendItem (hollow 등) | `style={{ borderColor: color }}` | 인라인, color prop |
| 784 | LegendItem (bulb) | `style={{ border: \`1px solid ${color}55\` }}` | 인라인, hex+55 투명도 |

---

## 6. 요약

- **흰색 계열:** `border-white/5`(가장 옅음), `border-white/6`, `border-white/8`, `border-white/10`.
- **컬러 고정:** `#1E2A48`(검색), `#24314E`(레전드 패널), `#7080A7`(레전드 마커), `#2F76FF`(활성 칩·검색 버튼·아이콘), `hud-amber/40`(MOSB 메타).
- **동적:** LegendItem은 `color` prop으로 테두리 색 결정, 일부는 인라인 `style`.

---

**문서 버전:** 1.0
