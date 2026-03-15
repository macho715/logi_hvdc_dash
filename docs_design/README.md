# 동일 적용용 문서 세트 (HVDC Dashboard Replica)

다른 프로젝트에서 이 대시보드를 **원본과 동일하게** 적용할 때 참조하는 명세 문서 모음입니다.  
적용 시 아래 문서를 함께 사용하면 색상·테두리·좌표·디자인 기준·점검 항목을 누락 없이 맞출 수 있습니다.

| 문서 | 역할 |
|------|------|
| [spec-design-pointers.md](spec-design-pointers.md) | **디자인 포인터 종합** — 아트보드, 글로벌 토큰(색·타이포·간격·radius), HUD 시각 언어, 레이아웃·컴포넌트 패턴 |
| [spec-color.md](spec-color.md) | **색상 적용 명세** — 영역·컴포넌트별 배경·텍스트·그라데이션·HEX 정리 |
| [spec-border.md](spec-border.md) | **테두리 적용 명세** — 박스/컴포넌트별 border 클래스·위치 |
| [spec-coordinates.md](spec-coordinates.md) | **컴포넌트 좌표 명세** — 아트보드 2048×1365 기준 x,y,w,h |
| [spec-gaps-checklist.md](spec-gaps-checklist.md) | **구현 갭·점검 체크리스트** — 스펙 vs 코드 차이, 적용 시 자주 빠지는 항목, 원본과 다를 때 점검 순서 |

**권장 적용 순서:** spec-design-pointers → spec-color / spec-border / spec-coordinates(필요 시 병렬 참조) → spec-gaps-checklist로 점검.

**기준 코드:** `app/overview/OverviewPage.tsx`, `app/overview/layout-spec.md`, `tailwind.config.ts`
