---
name: unified-dashboard-ui
description: 지도 기반 통합 대시보드 UI(MapView·RightPanel·Worklist)를 구현하는 스킬.
---

## 목적
일관된 UX의 통합 대시보드를 구현한다.

## 사용 시점
- UI 컴포넌트 구현
- 레이아웃 통합
- 접근성 검증

## 입력
- references/COMPONENT_SPEC.md
- references/A11Y_CHECKLIST.md
- AGENTS.md (UX 레이아웃 불변)

## 출력
- React 컴포넌트
- 레이아웃 구현
- 접근성 검증 리포트

## 절차
1. 레이아웃(좌 지도 / 우 패널 / 하단 KPI)
2. 모바일 슬라이드 패널 적용
3. 접근성 점검(WCAG 2.2)

## 레이아웃 불변
- 좌측: MapView (maplibre-gl + deck.gl)
- 우측: RightPanel (상태 정보)
- 하단: HVDC Panel (KPI/워크리스트)

## 스타일 규칙
- 다크 모드 기본
- 상태 색상: OK/Warning/Critical
- 모바일 우선 제스처

## 필수 참조
- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 (최우선)
- [SSOT.md](../hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원 (hvdc-logistics-ssot 스킬 참조)

## 참조
- references/COMPONENT_SPEC.md
- references/A11Y_CHECKLIST.md
