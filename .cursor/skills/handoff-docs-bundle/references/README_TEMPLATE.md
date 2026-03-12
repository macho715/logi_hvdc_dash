# HVDC + Logistics 통합 대시보드

## 개요
HVDC 대시보드와 물류 대시보드를 단일 웹 애플리케이션으로 통합한 프로젝트입니다.

## 기술 스택
- **Frontend**: Next.js 15, TypeScript, React
- **Maps**: maplibre-gl + deck.gl
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Testing**: jest + testing-library
- **Deployment**: Vercel

## 설치

### 필수 요구사항
- Node.js 18+
- pnpm (또는 npm/yarn)

### 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 키 입력
```

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버/Edge Function 전용)

### 의존성 설치
```bash
pnpm install
```

## 실행

### 개발 서버
```bash
pnpm dev
```

### 빌드
```bash
pnpm build
```

### 테스트
```bash
pnpm test
```

## 프로젝트 구조
```
/apps
  /logistics-dashboard
  /hvdc-dashboard
/packages
  /ui-components
/supabase
  /migrations
```

## 주요 기능
- 지도 기반 위치 추적
- 실시간 상태 모니터링
- HVDC 워크리스트 관리
- KPI 대시보드

## 참고 문서
- [AGENTS.md](./AGENTS.md) - 프로젝트 규칙
- [docs/architecture.md](./docs/architecture.md) - 아키텍처 문서
