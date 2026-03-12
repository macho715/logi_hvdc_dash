# SETUP

## 목적
로컬 개발 및 CI 환경을 빠르게 구성하기 위한 체크리스트입니다.

## 사전 요구사항
- Node.js 20+
- pnpm 9+
- Supabase 프로젝트

## 빠른 시작
1. 환경 변수 예시 복사:
   - `cp .env.example .env.local`
2. `.env.local`에 Supabase 키 입력
3. 의존성 설치:
   - `pnpm install`
4. 개발 서버 실행:
   - `pnpm dev`
   - 특정 앱만 실행:
     - `pnpm --filter hvdc-dashboard dev`
     - `pnpm --filter logistics-dashboard dev`

## 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버/Edge 전용)

## 주요 명령어
- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`

## 트러블슈팅
- Supabase 키 누락: `.env.local`에 값을 입력했는지 확인하세요.
- 포트 충돌: 기존 프로세스를 종료하거나 포트를 변경하세요.
