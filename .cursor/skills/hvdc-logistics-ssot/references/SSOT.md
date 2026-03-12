# 통합 프로젝트 로드맵 및 시스템 문서 (SSOT)

> **단일 진실원(Single Source of Truth)** - 모든 설계/구현/검증의 기준이 되는 문서
> 
> 이 문서는 [AGENTS.md](../../../AGENTS.md)의 모든 규칙을 포함하며, 프로젝트 전반의 결정 기준이 됩니다.

## 프로젝트 개요

### Mission
HVDC 대시보드와 물류 대시보드를 **단일 웹 애플리케이션**으로 통합하여:
- HVDC 상태/KPI/워크리스트 기능
- 물류 위치/이벤트/지도 기반 상태 패널
을 하나의 통합된 UX로 제공

### 핵심 원칙
1. **Supabase as SSOT**: 모든 운영 데이터의 단일 저장소
2. **RDF 파이프라인 유지**: HVDC JSON → RDF(Turtle) 변환 보존
3. **정규화된 테이블**: 프론트엔드 친화적 접근을 위한 Supabase 테이블
4. **통합 UX**: 데스크톱 + 모바일(PWA) 최적화
5. **접근성**: WCAG 2.2 AA 준수

## Product Constraints / Definition of Done

변경사항이 "완료"로 간주되려면 다음을 모두 만족해야 함:

- [ ] 통합 레이아웃 준수 (Map + RightPanel + HVDC Panel)
- [ ] 모바일 인터랙션 회귀 없음 (하단 패널 드래그, 드로어 컨트롤)
- [ ] 접근성 기준 충족 (대비, 키보드, aria 레이블/라이브 영역)
- [ ] Supabase SSOT 사용 및 RLS/보안 경계 우회 없음
- [ ] 로직 변경 시 테스트 포함/업데이트 (unit/integration)
- [ ] 스키마/계약 변경 시 docs/migrations 업데이트

### 성능 목표 (Gate 3 기준)
- 평균 응답 시간 < 1s
- p95 < 3s (워크리스트 로드, 상태 패널 새로고침 등 핵심 플로우)

## 기술 스택

### 필수 스택
- **Frontend**: Next.js 15, TypeScript, React
- **Maps**: maplibre-gl + deck.gl
- **Backend**: Supabase (Postgres + Auth + Realtime + Edge Functions)
- **Testing**: jest + testing-library (또는 기존 repo 테스트 러너)
- **Deployment**: Vercel (로컬 vercel-like dev 허용)

### 규칙
- Repo가 다르면 기존 선택을 따름
- 승인 없이 새 프레임워크 도입 금지

## Repository Layout (Target)

### Monorepo 구조 (권장)
```
/apps
  /logistics-dashboard
  /hvdc-dashboard
/packages
  /ui-components
/scripts/
/supabase/ 또는 /migrations/
/configs/
/data/ 또는 /fixtures/
```

### 원칙
- 공유 컴포넌트 추출
- 앱 분리
- 실제 구조가 다르더라도 동일한 의도 유지

## Environment Variables

### 필수 변수 (root `.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 규칙
- 실제 키를 커밋하지 않음
- 클라이언트 코드에서 `SUPABASE_SERVICE_ROLE_KEY` 읽기 금지
- 환경 변수로만 관리

## 데이터 모델 (Supabase SSOT)

### Core Tables
- `locations`: 물류 위치 (포트, 창고, 현장)
- `location_statuses`: 위치별 실시간 상태
- `events`: 이벤트 로그
- `hvdc_kpis`: HVDC KPI 메트릭
- `hvdc_worklist`: HVDC 워크리스트
- `logs`: 시스템 로그

### 제약사항
- **RLS 필수**: 모든 테이블에 Row Level Security 적용
- **압력 한계**: pressure ≤ 4.0 t/m² (안전 기준)
- **서비스 키**: Edge Function에서만 사용, 클라이언트 금지
- **정규화 유지**: Supabase 테이블은 정규화 유지

## HVDC JSON → RDF(Turtle) Pipeline

### 원칙
- 컬럼 스펙(JSON)을 SSOT로 사용
- JSON → TTL 변환 보존
- 사용 컬럼 감사 로그 생성
- 관계형 데이터와 온톨로지 일관성 유지

### 필수 사항
- 파이프라인 유지 (교체 금지)
- 소스 데이터를 Supabase 테이블로 정규화 (프론트엔드 접근용)

## API / Edge Functions

### 인증 전략
- **클라이언트**: anon key + RLS
- **서버/Edge**: service role key만 사용

### 규칙
- RLS 정책 우선 설계
- 보안 경계 우회 금지

## UX Layout Invariants (불변)

### 데스크톱 레이아웃
```
┌─────────────────────────────────────────┐
│  MapView (좌)  │  RightPanel (우)      │
│                │                        │
│                │                        │
├─────────────────────────────────────────┤
│  HVDC Panel (하단) - KPI/워크리스트     │
└─────────────────────────────────────────┘
```

### 모바일 레이아웃
- 지도 전체 화면
- 우측 패널: 슬라이드 드로어
- 하단 패널: 드래그 가능한 KPI/워크리스트

### 규칙
- 이 레이아웃을 깨뜨리지 않음
- 모바일 인터랙션 회귀 없음

## UI Style / Interaction Rules

### 스타일
- **다크 모드 기본**
- **상태 색상**: OK/Warning/Critical
- **모바일 우선 제스처**

### 인터랙션
- 하단 패널 드래그
- 드로어 컨트롤
- 키보드 접근성

## Accessibility (WCAG 2.2 AA)

### 필수 기준
- 키보드 접근성
- 대비 ≥4.5:1
- aria-live 영역 (KPI용)
- ESC로 드로어 닫기

### 검증
- 접근성 기준 충족 확인
- 스크린 리더 테스트
- 키보드만으로 전체 플로우 테스트

## Key User Flows (회귀 방지)

### 핵심 플로우
1. **위치 상태 확인**: 지도에서 위치 선택 → 상태 패널 표시
2. **HVDC 워크리스트 관리**: 워크리스트 항목 생성/수정/완료

### 규칙
- 이 플로우들의 회귀 방지
- 변경 시 기존 동작 유지 확인

## Testing / QA Expectations

### 필수 사항
- 로직 변경 시 테스트 포함/업데이트
- Typecheck 통과
- Lint 통과
- 터치한 영역에 대한 테스트

### 테스트 범위
- Unit tests
- Integration tests
- 접근성 테스트

## Security / Gotchas

### 보안 규칙
- 코드/로그에 비밀값 포함 금지
- RLS 정책 강제
- 환경 변수로만 비밀값 관리

### 주의사항
- 서비스 role 키는 서버/Edge에서만 사용
- 클라이언트에서 서비스 키 읽기 금지

## Safety & Permissions

### 파괴적 작업
- DROP/DELETE 등 파괴적 작업 전 **반드시 계획·확인**
- 마이그레이션 전 검토 필수

### 변경 승인 필요
- Breaking changes
- 의존성 업그레이드
- 보안 약화

## PR / Change Management

### PR 요구사항
- 명확한 설명
- 스크린샷 (UI 변경 시)
- 테스트 포함
- 마이그레이션 노트 (스키마 변경 시)

### 커밋 규칙
- 논리적 단위로 분리
- 명확한 커밋 메시지

## 검증 게이트

### Gate 1: 데이터 모델
- [ ] Supabase 스키마 통합 완료
- [ ] RLS 정책 정의 및 테스트
- [ ] 마이그레이션 계획 수립
- [ ] 정규화 유지 확인

### Gate 2: UI·UX 통합
- [ ] 레이아웃 불변 준수 (Map + Panel + HVDC)
- [ ] 모바일 인터랙션 구현
- [ ] WCAG 2.2 AA 검증 완료
- [ ] 핵심 사용자 플로우 회귀 없음

### Gate 3: 성능
- [ ] 평균 응답 시간 < 1s
- [ ] p95 < 3s (워크리스트 로드, 상태 패널 새로고침)
- [ ] Realtime 구독 성능 검증
- [ ] 부하 테스트 통과

## Non-goals

다음은 명시적 요청이 없는 한 포함하지 않음:
- RDF/온톨로지 접근 방식 교체
- Supabase 외 추가 데이터베이스 도입
- 처음부터 새 디자인 시스템 구축 (기존 컴포넌트 재사용 우선)

## Setup / Common Commands

### 패키지 매니저
- Lockfile로 패키지 매니저 감지
- Repo 스크립트를 SSOT로 사용 (install/dev/build/test)

### 규칙
- Repo 스크립트 우선 사용
- 표준 명령어 사용

## 참조 문서

- [AGENTS.md](../../../AGENTS.md) - 프로젝트 규칙 상세 (이 문서의 소스)
- [docs/architecture/architecture.md](../../../docs/architecture/architecture.md) - 아키텍처 문서
- [docs/integration/roadmap_system_doc.md](../../../docs/integration/roadmap_system_doc.md) - 로드맵
- [docs/constitution.md](../../../docs/constitution.md) - 프로젝트 헌법

## Nested AGENTS.md (선택사항)

앱별로 중첩된 AGENTS.md 허용:
- 루트 규칙이 기본값
- 앱별 오버라이드 허용
