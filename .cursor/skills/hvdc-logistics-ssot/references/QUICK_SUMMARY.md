## 핵심 요약
- 단일 웹 앱에서 HVDC + 물류 통합
- Supabase 단일 저장소
- 지도(좌) + 상태 패널(우) + KPI/워크리스트(하)
- Gate1: 데이터 모델 / Gate2: UI·UX / Gate3: 성능

## 주요 제약사항
- Next.js 15 + TypeScript
- Supabase as SSOT (RLS 필수)
- WCAG 2.2 AA 준수
- 평균 응답 시간 < 1s, p95 < 3s

## 레이아웃 불변
- 좌측: MapView
- 우측: RightPanel
- 하단: HVDC Panel (KPI/워크리스트)
