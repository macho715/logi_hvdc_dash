# 동일 적용용: 색상 적용 명세

**문서 세트:** 원본과 동일하게 적용하기 위한 명세 문서 중 색상 적용 항목.  
**세트 구성:** [디자인 포인터 종합](spec-design-pointers.md) · [테두리 적용 명세](spec-border.md) · [컴포넌트 좌표 명세](spec-coordinates.md) · [구현 갭·체크리스트](spec-gaps-checklist.md)

**기준:** [app/overview/OverviewPage.tsx](app/overview/OverviewPage.tsx), [tailwind.config.ts](tailwind.config.ts)  
**목적:** 영역·컴포넌트별 배경·텍스트·그라데이션 등 색상 적용 내용 정리. 동일 적용 시 색 참조.

---

## 1. Tailwind HUD 팔레트 (참조)

| 토큰 | Hex | 용도 |
|------|-----|------|
| hud-bg | #050A18 | 배경 기본 |
| hud-panel | #0E1427 | 패널 |
| hud-panelAlt | #10192E | 패널 대체 |
| hud-panelWarm | #221623 | 웜(플럼) |
| hud-panelHot | #2B1721 | 핫(레드) |
| hud-line | #1D2744 | 구분선 |
| hud-lineStrong | #243256 | 구분선 강조 |
| hud-text | #F2F5FF | 본문 |
| hud-textSoft | #C7D0E8 | 보조 |
| hud-textMuted | #7C89A8 | 비활성/메타 |
| hud-blue | #2F76FF | 액센트 블루 |
| hud-blueSoft | #4F8EFF | 블루 소프트 |
| hud-teal | #58E1C9 | 틸 |
| hud-tealSoft | #71EED7 | 틸 소프트 |
| hud-amber | #F5C366 | 앰버 |
| hud-amberSoft | #FFC56E | 앰버 소프트 |
| hud-violet | #8A58FF | 바이올렛 |
| hud-violetSoft | #AB7CFF | 바이올렛 소프트 |
| hud-orange | #FF9157 | 오렌지 |
| hud-red | #FF6E63 | 레드 |

**배경 이미지 토큰:** hud-shell, hud-card, hud-card-hot, hud-card-warm, hud-panel (tailwind.config.ts backgroundImage 참조).  
**그림자:** shadow-hud, shadow-panel, shadow-glow-blue, shadow-glow-teal, shadow-glow-amber.

---

## 2. 페이지·외곽

| 대상 | 적용 색상 | 비고 |
|------|------------|------|
| 페이지 래퍼 | `bg-[#040814]` | min-h-screen, 문서 스펙 #050A18과 상이 |
| 기본 글자 | `text-hud-text` | #F2F5FF |
| 외곽 프레임 | `bg-hud-shell` | 블루/마젠타 라디얼 + #060B19→#040915 |
| 외곽 테두리 | `border-white/5` | |
| 외곽 그림자 | `shadow-[0_30px_100px_rgba(0,0,0,.6)]` | |

---

## 3. 아트보드 배경 (ArtboardBackground)

| 레이어 | 적용 | 비고 |
|--------|------|------|
| 1 | `bg-hud-shell` | 동일 |
| 2 | 그리드 70×70px | `rgba(255,255,255,.035)` 1px, mask `rgba(0,0,0,.55)`→transparent 75% |
| 3 | 라디얼 3개 | 14% 0%: rgba(53,110,255,.18); 76% 32%: rgba(255,118,92,.1); 88% 86%: rgba(53,110,255,.14) |
| 4 | 비네트 | `linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.22))` |

---

## 4. 사이드바 (SidebarRail)

| 대상 | 적용 | 비고 |
|------|------|------|
| 배경 | `linear-gradient(180deg, rgba(9,15,30,.95), rgba(5,10,24,.98))` | |
| 우측 세로선 | `linear-gradient(180deg, rgba(59,86,165,.14), rgba(59,86,165,0))` | 1px |
| 검색 버튼 테두리 | `border-[#2F76FF]/45` | |
| 검색 버튼 배경 | `linear-gradient(180deg, rgba(47,118,255,.95), rgba(36,94,216,.95))` | shadow-glow-blue |
| 검색 아이콘 | `text-white` | |

---

## 5. 상단 바 (TopBar)

| 대상 | 적용 | 비고 |
|------|------|------|
| 타이틀 "HVDC CONTROL TOWER" | `text-white` | 26px semibold |
| 검색 입력 테두리 | `border-[#1E2A48]` | |
| 검색 입력 배경 | `linear-gradient(180deg, rgba(14,21,40,.96), rgba(11,16,31,.98))` | shadow-panel |
| 검색 아이콘 | `text-[#2F76FF]` | |
| 플레이스홀더 | `text-hud-textMuted` | |
| Updated 라벨 | `text-hud-xs text-hud-textMuted` | |
| 언어 pill 배경 | `linear-gradient(180deg, rgba(12,18,34,.96), rgba(8,13,26,.98))` | border-white/6 |
| ENG 활성 pill | `linear-gradient(180deg, rgba(47,118,255,.92), rgba(56,125,255,.8))` | text-white, shadow-glow-blue |
| 한국어 텍스트 | `text-hud-textMuted` | |
| 필터 칩 Origin Arc 도트 | Dot `color="#6EB2FF"` | active |
| 필터 칩 Voyage 아이콘 | `text-[#CFD8F4]` | |
| 필터 칩 Next 72h 아이콘 | `text-[#FFD39A]` | active |
| 필터 칩 Heatmap 도트 | Dot `color="#FF8B45"` | |

---

## 6. 맵 영역 (MainMapPanel, MapLegendRail)

| 대상 | 적용 | 비고 |
|------|------|------|
| 맵 컨테이너 배경 | `linear-gradient(180deg, rgba(10,16,30,.6), rgba(7,12,25,.4))` | border-white/6 |
| 맵 이미지 위 오버레이 | `linear-gradient(180deg, rgba(8,12,21,.04), rgba(8,12,21,.18))` | |
| 레전드 rail 배경 | `linear-gradient(180deg, rgba(11,17,31,.96), rgba(8,13,25,.98))` | border-r white/5 |
| 레전드 rail 라디얼 | `radial-gradient(150% 150% at 0% 0%, rgba(70,113,250,.14), transparent 55%)` | |
| 레전드 메인 패널 테두리 | `border-[#24314E]` | |
| 레전드 메인 패널 배경 | `linear-gradient(180deg, rgba(18,27,49,.88), rgba(12,19,34,.9))` | |
| Hode 마커 | `border-[#7080A7]` bg-transparent | |
| 레전드 라벨/메타 | `text-hud-textMuted`, `text-hud-textSoft` | |
| LegendItem Annor | color="#4C5A9B" | |
| LegendItem Warehous / MOSB Yard | color="#D1BE72" | |
| LegendItem HVDC Sites | color="#6170C8" bulb | |
| LegendItem Origin, MOSB Yard, Flow.t | #D1BE72, #FFC56E, #6B87FF (small) | |
| LegendItem Rose, Warehoss | color="#A8AEB8" hollow | |
| 내부 박스 배경 | `rgba(24,31,56,.94)`, `rgba(16,22,39,.98)` | border-white/5 |
| Gate Voyared 박스 배경 | `rgba(14,21,38,.9)`, `rgba(10,15,28,.96)` | border-white/5 |
| Gate Voyared 원 3개 | bg #5EE3CB, #FFC56E, #5C87FF | |
| Gate Voyared 사각 2개 | bg #5C87FF, #FFC56E | |
| Gate Voyared 텍스트 | text-hud-textMuted, text-hud-textSoft | |

---

## 7. KPI 카드 (KpiCard)

| 대상 | 적용 | 비고 |
|------|------|------|
| cool | `bg-hud-card` | 블루 계열 라디얼 + 다크 베이스 |
| hot | `bg-hud-card-hot` | 레드 계열 라디얼 |
| warm | `bg-hud-card-warm` | 플럼/앰버 계열 |
| 내부 오버레이 | radial 22% 28% rgba(87,126,255,.2); 74% 40% rgba(255,115,91,.16); 48% 78% rgba(255,255,255,.045) | opacity 55% |
| 제목 | `text-hud-textMuted` | |
| 값 | `text-white` | |
| Open Radar 메타 | `text-[#F4C7B8]`, 도트 `bg-hud-red` shadow-glow-amber, `text-hud-red` | |
| Overdue 메타 | `text-hud-red`, 도트 `bg-hud-orange` shadow rgba(255,145,87,.45) | |
| MOSB 메타 | `text-hud-amber`, 아이콘 `border-hud-amber/40` | |
| AGI Readiness 메타 | Dot #51606F, `text-hud-amber`, `text-[#F7DF8F]`, text-hud-textMuted | |

---

## 8. Site 카드 (SiteCard, AGI)

| 대상 | 적용 | 비고 |
|------|------|------|
| SHU accent | #58E1C9 | 라벨, 진행바 |
| SHU theme | rgba(55,198,171,.18); 베이스 rgba(15,31,44)~rgba(11,21,34) | |
| MIR accent | #5C87FF | |
| MIR theme | rgba(67,117,246,.2); rgba(17,26,52)~rgba(12,18,37) | |
| DAS accent | #8A58FF | |
| DAS theme | rgba(138,88,255,.18); rgba(28,23,49)~rgba(16,14,32) | |
| 카드 상단 하이라이트 | `linear-gradient(180deg, rgba(255,255,255,.02), transparent)` | |
| 라벨 | `style={{ color: data.accent }}` | 34px |
| 값 | `text-white` | 50px |
| Pending/Warehouse 라벨 | text-hud-textMuted | |
| 진행 바 트랙 | `linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.08))` | |
| 진행 바 채움 | `linear-gradient(90deg, ${accent}40, ${accent}B3)` | |
| delta 텍스트 | `style={{ color: data.accent }}` | |
| AGI 카드 배경 | `linear-gradient(rgba(16,21,39), rgba(10,14,28))` | |
| AGI 라디얼 | rgba(255,193,94,.14), rgba(45,118,255,.12) | |
| AGI 라벨 | `text-[#F5D36F]` | 34px |
| AGI 값 | `text-white` 56px | |
| AGI 캡션 53%·16.9% | text-hud-textMuted | |
| AGI progress 바 | `bg-white/8`, 채움 `linear-gradient(90deg,#FFCC69,#F5A948)` shadow-glow-amber | |
| AGI 우측 컬럼 배경 | `rgba(12,18,35,.85)`, `rgba(9,13,26,.92)` | |
| AGI 우측 숫자 | text-white, `text-[#5C87FF]`, text-hud-textMuted | 60/44/42px 등 |
| 미니맵 오버레이 | `rgba(8,11,22,.02)`~`.18` | |

---

## 9. Mission Control (MissionPanel)

| 대상 | 적용 | 비고 |
|------|------|------|
| 패널 배경 | `linear-gradient(180deg, rgba(12,18,34,.95), rgba(8,13,26,.98))` | border-white/6 |
| 타이틀 | `text-white` | 16px |
| 배지 | `bg-white/6`, `text-[#F3C562]` | |
| "Incoming Chocket" | text-hud-textMuted | |
| 행 카드 배경 | `linear-gradient(180deg, rgba(17,23,42,.9), rgba(10,14,28,.95))` | border-white/5 |
| 행 accent 바 | `style={{ backgroundColor: row.accent }}` | 4×42px, hex: #FF9C4D, #F5C366, #FF7D52, #4E88FF |
| 행 primary | `text-white` | 15px |
| 행 secondary | text-hud-textMuted | |
| 자물쇠 셀 | border-white/6, `bg-white/[0.03]`, text-hud-textMuted | |

---

## 10. Flow Summary

| 대상 | 적용 | 비고 |
|------|------|------|
| 박스 배경 | `linear-gradient(180deg, rgba(11,17,31,.88), rgba(8,12,25,.95))` | border-white/5 |
| "Flow Summary" 라벨 | `text-hud-textSoft` | 18px |
| SVG flowLine 그라데이션 | #F8D870 0% → #70EAD4 28% → #8A58FF 57% → #7EA2FF 80% → #D6D7EE 100% | |
| SVG 원 fill | #171D30 | |
| SVG 원 stroke | [#6C5D42, #6AD9D0, #F4D26E, #6AD9D0] | 인덱스별 |
| Flow 값 | `text-white` | 22px |
| Flow 라벨 | text-hud-textMuted | hud-2xs |
| "Sr / des" | text-hud-textMuted | |

---

## 11. 하단 탭 (BottomTabs)

| 대상 | 적용 | 비고 |
|------|------|------|
| 활성 탭 배경 | `linear-gradient(180deg, rgba(17,24,46,.96), rgba(10,16,31,.98))` | border-white/8 |
| 비활성 탭 배경 | `linear-gradient(180deg, rgba(14,20,37,.82), rgba(10,14,27,.94))` | border-white/6 |
| 활성 아이콘 컨테이너 | `bg-[#26345A]` | |
| 탭 텍스트 | text-hud-textSoft, text-hud-textMuted(아이콘·›) | hud-md |

---

## 12. 섹션 헤더 (SectionHeader)

| 대상 | 적용 | 비고 |
|------|------|------|
| 제목 | `text-hud-textSoft` | 18px medium |
| 구분선 | `linear-gradient(90deg, rgba(77,100,166,.65), .12, 0)` | 1px |
| Mission Control 우측 | text-hud-textMuted (◐ ») | |

---

## 13. 칩·아이콘 버튼 (Chip, IconButton)

| 대상 | 적용 | 비고 |
|------|------|------|
| 칩 활성 테두리 | `border-[#2F76FF]/40` | |
| 칩 활성 배경 | `linear-gradient(180deg, rgba(47,118,255,.92), rgba(35,95,218,.84))` | shadow-glow-blue |
| 칩 비활성 | border-white/6, `rgba(18,23,39,.92)`~`rgba(11,16,29,.95)` | |
| 칩 텍스트 | text-white(활성), text-hud-textSoft(비활성), text-hud-textMuted(▼) | |
| IconButton 활성 | border-[#2F76FF]/60, bg-[#2F76FF]/18, text-white | |
| IconButton 비활성 | border-white/10, bg-transparent, text-hud-textMuted | |

---

## 14. LegendItem·Dot

| 대상 | 적용 | 비고 |
|------|------|------|
| Dot | `style={{ backgroundColor: color }}` | size, color prop |
| LegendItem 제목 | `text-white` | |
| LegendItem 부제 | text-hud-textMuted | |
| square | backgroundColor: color | |
| hollow | borderColor: color, 배경 없음 | |
| bulb | backgroundColor: `${color}22`, border: `1px solid ${color}55`, 내부 원 color | |

---

## 15. 하드코딩 HEX 요약 (문서 대조용)

| Hex | 사용처 |
|-----|--------|
| #040814 | 페이지 래퍼 |
| #050A18, #060B19, #040915 | hud-shell·배경 계열 |
| #1E2A48 | 검색 입력 테두리 |
| #24314E | 맵 레전드 패널 테두리 |
| #26345A | 하단 탭 활성 아이콘 영역 |
| #2F76FF | 검색 아이콘, 칩/버튼 활성, ENG pill (그라데이션 내) |
| #4C5A9B | LegendItem Annor |
| #51606F | AGI Readiness Dot |
| #5C87FF | AGI 우측 숫자, 레전드 원/사각, Site MIR accent |
| #5EE3CB | Gate Voyared 원 |
| #6170C8 | LegendItem HVDC Sites |
| #6AD9D0 | Flow SVG 원 stroke |
| #6B87FF | LegendItem Flow.t |
| #6C5D42 | Flow SVG 원 stroke |
| #6EB2FF | 칩 Origin Arc Dot |
| #7080A7 | 레전드 Hode 마커 테두리 |
| #7EA2FF | Flow SVG stop |
| #8A58FF | Flow SVG stop, Site DAS accent |
| #A8AEB8 | LegendItem Rose, Warehoss |
| #CFD8F4 | 칩 Voyage 아이콘 |
| #D1BE72 | LegendItem Warehous, MOSB Yard, Origin |
| #D6D7EE | Flow SVG stop |
| #F3C562 | Mission 배지 |
| #F4C7B8 | KPI Open Radar 메타 |
| #F4D26E | Flow SVG 원 stroke |
| #F5D36F | AGI 카드 라벨 |
| #F7DF8F | AGI Readiness 메타 88.1% |
| #F8D870 | Flow SVG stop |
| #FF8B45 | 칩 Heatmap Dot |
| #FFC56E | LegendItem MOSB Yard, Gate Voyared 원/사각 |
| #FFCC69, #F5A948 | AGI progress 바 그라데이션 |
| #FFD39A | 칩 Next 72h 아이콘 |
| #70EAD4 | Flow SVG stop |
| #171D30 | Flow SVG 원 fill |

---

**문서 버전:** 1.0
