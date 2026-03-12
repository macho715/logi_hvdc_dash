## 문서 아웃라인

### README.md
- 목적: 프로젝트 개요 및 통합 목표
- 설치: 환경 변수 설정, 의존성 설치
- 실행: 개발 서버, 빌드, 테스트

### ARCHITECTURE.md
- 데이터 구조: Supabase 스키마, RLS 정책
- UI 구조: 컴포넌트 계층, 레이아웃
- API 구조: Edge Functions, Realtime 구독

### SYSTEM_LAYOUT.md
- Monorepo 구조: apps, packages 분리
- 파일 조직: 공유 컴포넌트, 앱별 코드
- 통합 포인트: HVDC ↔ Logistics 데이터 흐름

### Validation Gates
- Gate 1: 데이터 모델 검증
- Gate 2: UI·UX 통합 검증
- Gate 3: 성능 목표 달성
