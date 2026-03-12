# HVDC + Logistics 통합 작업 계획 (통합 로드맵)

**작성일**: 2026-01-23  
**최종 업데이트**: 2026-02-07  
**스킬**: `hvdc-logistics-planning`  
**참조**: 
- [AGENTS.md](../../AGENTS.md)
- [SSOT.md](../../.cursor/skills/hvdc-logistics-ssot/references/SSOT.md)
- [STATUS.md](../../STATUS.md)
- [roadmap_system_doc.md](../integration/roadmap_system_doc.md) - 통합 단계별 로드맵 (Phase 1~5)
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 컴포넌트별 상세 상태

---

## Executive Summary

HVDC 대시보드와 물류 대시보드를 **단일 웹 애플리케이션**으로 통합합니다. Supabase를 SSOT로 사용하며, 기존 RDF 파이프라인을 보존합니다.

**목표 레이아웃**: MapView (left) + RightPanel (right) + HVDC Panel (bottom)

**통합 원칙**:
- **SSOT:** 모든 운영 데이터는 **Supabase(Postgres)** 1곳에 적재
- **Date Canon:** `event_type(온톨로지 개념) + event_date_dubai`를 기준으로 KPI/Flow/ETA 산출
- **Realtime:** Supabase Realtime 채널을 통해 UI 갱신(초기에는 DB Changes 구독, 스케일 단계에서 Broadcast+Trigger)

---

## Phase 0 — 설계 고정 (0.5-2일) ✅

### Deliverables
- [x] `docs/LAYOUT.md` 초안 (통합 레이아웃 설계)
- [x] `docs/ARCHITECTURE.md` 초안 (데이터/Realtime)
- [x] `case_id`/`hvdc_code` 키 전략 확정
- [x] Date Canon 정의: `events(event_type, event_date_dubai)` ✅ `schema_v2_unified.sql`에 포함

### Acceptance Criteria
- [x] 팀 합의 문서가 남아 있고(SSOT), 이후 구현 PR은 이 문서를 기준으로 리뷰 가능

---

## Phase 1: Monorepo 설정 및 인프라 (Week 1-2)

### 1.1 Monorepo 구조 설정
- [x] `/apps/logistics-dashboard` 생성 (v0-logistics-dashboard-build-main 이관)
- [x] `/apps/hvdc-dashboard` 생성 (HVDC DASH/hvdc-dashboard 이관)
- [x] `/packages/ui-components` 생성 ✅ 존재 (`UnifiedLayout.tsx` 포함)
- [x] `/supabase/migrations` 생성 및 스키마 마이그레이션
- [x] `/scripts` 디렉토리 정리 (logiontology_scaffold_2026-01-23 이관)
- [x] `/configs` 디렉토리 정리

### 1.2 환경 변수 통합
- [ ] `.env.local` 템플릿 생성
- [ ] Supabase 연결 설정 통합
- [ ] 환경 변수 검증 스크립트 작성

### 1.3 빌드 시스템 설정
- [x] pnpm workspace 설정
- [x] 공유 TypeScript 설정
- [x] 공유 ESLint/Prettier 설정

**Gate 1 검증**: Monorepo 구조 검증, 환경 변수 설정 완료

---

## Phase 2: 데이터 모델 통합 (Week 3-4)

### 2.1 기존 스키마 분석
- [x] HVDC 스키마 분석 (`shipments`, `warehouse_inventory`, `container_details`, etc.)
- [x] 물류 스키마 분석 (`locations`, `location_statuses`, `events`)
- [ ] 스키마 충돌 지점 식별

### 2.2 통합 스키마 설계
- [x] `schema_v2_unified.sql` 작성 ✅ 완료
  - `events` 테이블 포함 (Date Canon 기반)
  - `locations`, `location_statuses` 테이블 포함
  - HVDC 테이블 통합
- [ ] Flow Code 필드 마이그레이션 ⚠️ 제안됨, 마이그레이션 대기
  - `shipments.flow_code`, `flow_code_original`, `flow_override_reason` 등
  - AGI/DAS 규칙 제약조건 (`flow_code >= 3` 필수)
- [ ] 기존 HVDC 테이블 통합 전략 수립
- [ ] 물류 테이블과의 관계 정의
- [ ] RLS 정책 설계 및 테스트

### 2.3 마이그레이션 계획
- [ ] 데이터 마이그레이션 스크립트 작성
- [ ] 롤백 계획 수립
- [ ] 테스트 데이터 준비

**Gate 1 검증**: 통합 스키마 승인, 마이그레이션 계획 검토

---

## Phase 3: 레이아웃 통합 (Week 5-6)

### 3.1 통합 레이아웃 컴포넌트
- [x] `UnifiedLayout.tsx` 프로토타입 작성 ✅ 완료
- [ ] MapView 통합 (기존 물류 MapView 재사용)
- [ ] RightPanel 통합 (기존 물류 RightPanel 재사용)
- [ ] HVDC Panel 통합 (기존 HVDC Dashboard 하단 배치)
  - [ ] `packages/hvdc-workbench` 패키지 생성
  - [ ] `KpiStrip`, `WorklistTable`, `DetailDrawer` 추출

### 3.2 상태 관리 통합
- [ ] 통합 Zustand store 설계 (`OpsStore` 인터페이스)
  - `selected_case_id`, `selected_location_id`
  - `filters` (gate, site, vendor, timeWindowH)
  - `ui` (bottomOpen, rightOpen, liveEnabled)
- [ ] `useLogisticsStore`와 `useDashboardStore` 통합
- [ ] 공유 상태 인터페이스 정의

### 3.3 모바일 대응
- [x] 하단 패널 드래그 제스처 구현 ⚠️ 부분 구현
- [ ] 모바일 드로어 오버레이 모드 구현
- [ ] 터치 인터랙션 최적화

### 3.4 동기화 이벤트
- [ ] Worklist row 클릭 → Map highlight + Detail open
- [ ] Map marker 클릭 → Worklist filter + Detail open
- [ ] Gate 토글 → Map 색상/Worklist/KPI 동시 반영

**Gate 2 검증**: 통합 레이아웃 프로토타입, ≥80% 사용자 테스트 피드백

---

## Phase 4: API 및 데이터 흐름 통합 (Week 7-8)

### 4.1 Supabase 클라이언트 통합
- [x] 공유 Supabase 클라이언트 설정 ✅ `lib/supabase.ts` 구현 완료
- [ ] RLS 정책 테스트
- [x] Realtime 구독 설정 (초기: DB Changes) ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
  - `useSupabaseRealtime`, `useKpiRealtime` 훅 구현
  - Realtime 마이그레이션 스크립트 생성 (`supabase/migrations/20260124_enable_realtime.sql`)
  - 폴백 폴링 메커니즘 구현

### 4.2 API 엔드포인트 통합
- [x] `/api/worklist` 통합 (HVDC) ✅ Flow Code v3.5 포함, KPI 계산 로직 구현
- [ ] `/api/worklist` → Supabase RPC/뷰로 이관 (향후)
- [ ] `/api/locations` 통합 (물류)
- [ ] `/api/events` 통합 (물류)
- [ ] 공통 에러 처리

### 4.3 데이터 동기화
- [x] 실시간 업데이트 통합 (Supabase Realtime) ✅ KPI Realtime 구현 완료 (2026-01-24)
  - Option A+ 전략 (클라이언트 측 KPI 재계산)
  - 배치 업데이트 및 성능 모니터링
  - 연결 상태 UI 표시
- [ ] WebSocket 연결 관리 (Phase 2: 나머지 피드 마이그레이션)
- [ ] 오프라인 지원 (PWA)

### 4.4 집계 레이어(View/RPC)
- [ ] `worklist_v` 또는 `worklist_mv` 생성
- [ ] `rpc_get_worklist(filters jsonb)` 생성 (향후 API → RPC 전환)
- [ ] `rpc_get_kpis(filters jsonb)` 생성
- [ ] `rpc_get_case_detail(case_id uuid)` 생성
- [ ] `rpc_get_map_locations(filters jsonb)` 생성

---

## Phase 5: 접근성 및 성능 최적화 (Week 9-10)

### 5.1 접근성 검증
- [ ] WCAG 2.2 AA 체크리스트 검증
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트
- [ ] 색상 대비 검증

### 5.2 성능 최적화
- [ ] Map 번들 동적 import (최우선) ⚠️ AGENTS.md 우선순위
- [ ] 코드 스플리팅
- [ ] 이미지 최적화
- [ ] API 응답 시간 최적화 (서버 병렬 fetch: `Promise.all`)
- [x] Realtime 구독 최적화 (필터링, debounce, virtualization) ✅ 구현 완료 (2026-01-24)
  - 배치 업데이트 (300-500ms desktop, 1s mobile)
  - React.useTransition으로 비차단 업데이트
  - 성능 모니터링 (commit_timestamp 추적)

### 5.3 성능 테스트
- [ ] k6 부하 테스트 실행
- [ ] 평균 응답 시간 < 1s 검증
- [ ] p95 < 3s 검증 (핵심 플로우)
- [ ] 상호작용 p95 ≤ 200ms 검증

**Gate 3 검증**: 성능 목표 달성, 접근성 기준 충족

---

## Phase 6: RDF 파이프라인 통합 (Week 11-12)

### 6.1 RDF 파이프라인 보존
- [x] 기존 JSON → RDF(Turtle) 변환 스크립트 통합 ✅ `logiontology_scaffold_2026-01-23`
- [x] 컬럼 스펙 SSOT 유지 ✅ `configs/columns.hvdc_status.json`
- [x] 사용 컬럼 감사 로그 생성 ✅ `*.used_cols.json` 출력
- [ ] used_cols 감사 로그를 DB에 저장 (`logs` 테이블)

### 6.2 데이터 정합성 검증
- [ ] 관계형 데이터와 온톨로지 일관성 확인
- [ ] 필수 컬럼 누락 확인
- [ ] 데이터 타입 일치 확인

### 6.3 Flow Code v3.5 통합
- [x] Flow Code v3.5 로직 ✅ `logiontology_scaffold/scripts/core/flow_code_calc.py`
- [ ] Flow Code 필드 DB 적재 (또는 RPC 계산)
- [ ] AGI/DAS 자동 업그레이드 로직
- [ ] SHACL 검증 통합 (CI/배치)

---

## Phase 7: 테스트 및 문서화 (Week 13-14)

### 7.1 테스트 작성
- [ ] Unit 테스트 (로직 변경 영역)
  - Flow Code 계산
  - Gate 계산 (RED/AMBER/GREEN/ZERO)
  - 날짜 파싱 (Asia/Dubai 기준)
- [ ] Integration 테스트 (API 통합)
  - `rpc_get_worklist(filters)` 결과 스키마/행 개수
  - `/api/worklist` vs RPC 결과 동등성
- [ ] E2E 테스트 (핵심 사용자 플로우)
  - Map marker 클릭 → Worklist 필터 적용 → Detail 열림
  - Worklist row 클릭 → Map 하이라이트 → Detail 열림
  - Gate 토글 → Map 색상/Worklist/KPI 동시 반영

### 7.2 문서화
- [ ] README.md 업데이트
- [x] ARCHITECTURE.md 작성 ✅ `docs/architecture.md` 존재
- [x] SYSTEM_LAYOUT.md 작성 ✅ `logi-cockpit-docs/docs/LAYOUT.md` 참조
- [x] 마이그레이션 가이드 작성 ✅ `logi-cockpit-docs/docs/MIGRATION_GUIDE.md` 참조

---

## 리스크 및 대응 방안

### 리스크 1: 스키마 충돌
- **대응**: 기존 데이터 보존, 점진적 마이그레이션, 롤백 계획

### 리스크 2: 성능 저하
- **대응**: 조기 성능 테스트, 최적화 우선순위 설정 (Async Waterfall 제거 최우선), Gate 3 검증

### 리스크 3: 모바일 UX 회귀
- **대응**: 모바일 우선 테스트, 사용자 피드백 수집, Gate 2 검증

### 리스크 4: Date Canon 혼재
- **대응**: `events` 기반으로만 계산하도록 규정 + 뷰/RPC 단일화

---

## 검증 게이트

### Gate 1: 데이터 모델 검증
- [x] 통합 스키마/Flow Code v3.5 스펙 승인 ✅ `schema_v2_unified.sql` 및 Flow Code 필드/파일명 설계 완료
- [ ] Flow Code v3.5 마이그레이션 실행 (SQL 파일 생성 + DB 적용 + 검증)
- [ ] RLS 정책 검증

### Gate 2: UI·UX 통합 검증
- [x] 통합 레이아웃 프로토타입 ✅ `UnifiedLayout.tsx` 완료
- [ ] ≥80% 사용자 테스트 피드백
- [ ] 모바일 인터랙션 검증

### Gate 3: 성능 목표 달성
- [ ] avg < 1s (핵심 플로우)
- [ ] p95 < 3s (핵심 플로우)
- [ ] 접근성 기준 충족 (WCAG 2.2 AA)

---

## 다음 즉시 실행 작업

1. ✅ 스킬 참조 문서 검토 완료
2. ✅ 통합 작업 계획 수립 완료
3. ✅ 통합 스키마 초안 작성 (`schema_v2_unified.sql`)
4. ✅ 통합 UI 레이아웃 프로토타입 (`UnifiedLayout.tsx`)
5. ✅ STATUS.md 생성 및 로드맵 동기화
6. ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
7. ⏭️ Flow Code 필드 마이그레이션
8. ⏭️ 통합 Store 설계 (`OpsStore`)
9. ✅ Monorepo 구조 마이그레이션 (MIGRATION_COMPLETION_REPORT.md 참조)

---

## 참조 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 규칙
- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 상세 통합 상태
- [roadmap_system_doc.md](../integration/roadmap_system_doc.md) - 통합 단계별 로드맵 (Phase 1~5)
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 컴포넌트별 상세 상태
- [logi-cockpit-docs/docs/ARCHITECTURE.md](../logi-cockpit-docs/docs/ARCHITECTURE.md) - 아키텍처 문서
- [logi-cockpit-docs/docs/LAYOUT.md](../logi-cockpit-docs/docs/LAYOUT.md) - 레이아웃 문서
- [logi-cockpit-docs/docs/COMPONENTS.md](../logi-cockpit-docs/docs/COMPONENTS.md) - 컴포넌트 문서
