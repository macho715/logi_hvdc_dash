# Project Constitution

**Last Updated**: 2026-01-23  
**Reference**: [AGENTS.md](../AGENTS.md), [SSOT.md](../.cursor/skills/hvdc-logistics-ssot/references/SSOT.md)

---

## Executive Summary

이 문서는 HVDC + Logistics 통합 대시보드 프로젝트의 **비협상 가능한 규칙**과 **핵심 원칙**을 정의합니다. 이는 프로젝트의 "헌법"으로, 모든 결정과 구현의 기준이 됩니다.

**핵심 원칙**:
1. **Supabase as SSOT**: 모든 운영 데이터의 단일 저장소
2. **레이아웃 불변**: MapView (left) + RightPanel (right) + HVDC Panel (bottom)
3. **RDF 파이프라인 유지**: HVDC JSON → RDF(Turtle) 변환 보존
4. **접근성 필수**: WCAG 2.2 AA 준수
5. **보안 우선**: RLS 정책 강제, 비밀값 보호

---

## 1. 비협상 가능한 규칙 (Non-Negotiables)

### 1.1 데이터 모델

**Supabase as SSOT**:
- ✅ 모든 운영 데이터는 Supabase에 저장
- ❌ Supabase 외 추가 운영 데이터베이스 도입 금지
- ✅ 정규화된 테이블 + raw JSONB (audit/reprocessing용)

**RDF 파이프라인 유지**:
- ✅ HVDC JSON → RDF(Turtle) 변환 파이프라인 보존
- ✅ 컬럼 매핑 SSOT 유지 (`configs/columns.hvdc_status.json`)
- ✅ used_cols 감사 로그 생성 및 저장
- ❌ RDF/온톨로지 접근 방식 교체 금지

### 1.2 레이아웃 불변

**통합 레이아웃**:
```
┌─────────────────────────────────────────┐
│  MapView (좌, 60%)  │  RightPanel (우, 20%)  │
│                      │                       │
│                      │                       │
├─────────────────────────────────────────┤
│  HVDC Panel (하단, 20%) - KPI/워크리스트     │
└─────────────────────────────────────────┘
```

**규칙**:
- ❌ 이 레이아웃을 깨뜨리는 변경 금지
- ✅ 모바일 인터랙션 회귀 방지 (하단 패널 드래그, 드로어 컨트롤)
- ✅ 반응형 레이아웃 유지 (데스크톱/모바일)

### 1.3 보안 및 규정 준수

**RLS 정책**:
- ✅ 모든 테이블에 RLS 활성화 필수
- ✅ 명시적 정책 정의
- ❌ RLS 정책 약화 금지 (승인 없이)
- ✅ RLS 정책은 제품 계약으로 취급

**비밀값 보호**:
- ❌ service_role key 클라이언트 노출 금지
- ✅ 환경 변수로만 비밀값 관리
- ✅ 로그에서 비밀값 제거
- ✅ 문서 무결성: doc_hash + 엄격한 접근 제어

**규정 준수**:
- ✅ FANR/MOIAT 규정 준수 검증
- ✅ 문서 무결성 보장
- ✅ 불변 감사 로그 (who/when/why)

### 1.4 접근성

**WCAG 2.2 AA 준수**:
- ✅ 대비 ≥ 4.5:1
- ✅ 모든 인터랙티브 요소 키보드 접근 가능
- ✅ ESC로 드로어/모달 닫기
- ✅ aria-live 영역 (KPI 업데이트)
- ✅ 스크린 리더 지원

**컴포넌트별 요구사항**:
- MapView: focus hijack 방지 (tabindex -1 where appropriate)
- RightPanel: rows act as buttons with aria-label
- KpiStrip: aria-live="polite" for updates
- Charts: 항상 텍스트 요약/테이블 대안 제공
- DetailDrawer: focus trap, ESC closes, prevent background scroll

---

## 2. Definition of Done

변경사항이 "완료"로 간주되려면 다음을 모두 만족해야 합니다:

### 2.1 필수 조건

- [ ] 통합 레이아웃 준수 (Map + RightPanel + HVDC Panel)
- [ ] 모바일 인터랙션 회귀 없음 (하단 패널 드래그, 드로어 컨트롤)
- [ ] 접근성 기준 충족 (대비, 키보드, aria 레이블/라이브 영역)
- [ ] Supabase SSOT 사용 및 RLS/보안 경계 우회 없음
- [ ] 로직 변경 시 테스트 포함/업데이트 (unit/integration)
- [ ] 스키마/계약 변경 시 docs/migrations 업데이트

### 2.2 성능 목표 (Gate 3)

- [ ] 평균 응답 시간 < 1s
- [ ] p95 < 3s (워크리스트 로드, 상태 패널 새로고침 등 핵심 플로우)
- [ ] Sync lag p95 ≤ 300s
- [ ] Validation latency p95 < 5s

### 2.3 품질 게이트

**OCR 게이트**:
- [ ] MeanConf ≥ 0.92
- [ ] TableAcc ≥ 0.98
- [ ] NumericIntegrity = 1.00
- [ ] Fail-safe: 게이트 실패 시 ZERO 모드 (downstream automation 중지 + 티켓)

**SHACL 검증**:
- [ ] Flow Code ∈ [0..5] + domain routing rules
- [ ] Invoice math integrity (EA×Rate = Amount, ΣLine = InvoiceTotal)
- [ ] Site Arrival Date datatype (xsd:date)
- [ ] Boolean-date consistency
- [ ] AGI/DAS Flow ≥ 3 constraint
- [ ] Chronology (ETD ≤ ATD ≤ ATA)

---

## 3. 검증 게이트

### Gate 1: 데이터 모델

**목표**: Supabase 스키마 통합 완료 및 RLS 정책 정의

**검증 항목**:
- [ ] Supabase 스키마 통합 완료
- [ ] RLS 정책 정의 및 테스트
- [ ] 마이그레이션 계획 수립
- [ ] 정규화 유지 확인
- [ ] 데이터 일관성 확인

**승인 기준**:
- 모든 테이블에 RLS 활성화
- 명시적 정책 정의 및 테스트 통과
- 마이그레이션 계획 검토 완료

### Gate 2: UI·UX 통합

**목표**: 레이아웃 불변 준수 및 사용자 경험 검증

**검증 항목**:
- [ ] 레이아웃 불변 준수 (Map + Panel + HVDC)
- [ ] 모바일 인터랙션 구현
- [ ] WCAG 2.2 AA 검증 완료
- [ ] 핵심 사용자 플로우 회귀 없음
- [ ] ≥80% positive user test feedback

**승인 기준**:
- 레이아웃 불변 준수 확인
- 접근성 검증 통과
- 사용자 테스트 피드백 ≥80% 긍정

### Gate 3: 성능

**목표**: 성능 목표 달성 및 부하 테스트 통과

**검증 항목**:
- [ ] 평균 응답 시간 < 1s
- [ ] p95 < 3s (워크리스트 로드, 상태 패널 새로고침)
- [ ] Realtime 구독 성능 검증
- [ ] 부하 테스트 통과

**승인 기준**:
- 모든 성능 목표 달성
- 부하 테스트 통과
- 성능 모니터링 설정 완료

---

## 4. 기술 스택 제약

### 4.1 필수 스택

**Frontend**:
- Next.js 15+ (App Router)
- React 19, TypeScript
- Zustand (상태 관리)
- Tailwind CSS 4

**Maps**:
- maplibre-gl 5.15.0
- deck.gl 9.2.5

**Backend**:
- Supabase (PostgreSQL + RLS + Auth + Realtime + Edge Functions)

**Testing**:
- jest + testing-library

**Deployment**:
- Vercel

### 4.2 규칙

- ✅ Repo가 다르면 기존 선택을 따름
- ❌ 승인 없이 새 프레임워크 도입 금지
- ✅ 표준 라이브러리 우선 사용

---

## 5. Repository Layout

### 5.1 Monorepo 구조 (권장)

```
/apps
  /hvdc-dashboard
  /logistics-dashboard
/packages
  /ui-components
/scripts/
/supabase/ 또는 /migrations/
/configs/
/data/ 또는 /fixtures/
```

### 5.2 원칙

- ✅ 공유 컴포넌트 추출
- ✅ 앱 분리
- ✅ 실제 구조가 다르더라도 동일한 의도 유지

---

## 6. 보안 및 규정 준수

### 6.1 보안 규칙

**비밀값 관리**:
- ❌ 코드/로그에 비밀값 포함 금지
- ✅ 환경 변수로만 비밀값 관리
- ✅ 서비스 role 키는 서버/Edge에서만 사용
- ❌ 클라이언트에서 서비스 키 읽기 금지

**RLS 정책**:
- ✅ 모든 테이블에 RLS 활성화 필수
- ✅ 명시적 정책 정의
- ❌ RLS 정책 약화 금지 (승인 없이)
- ✅ RLS 정책은 제품 계약으로 취급

**문서 무결성**:
- ✅ doc_hash + 엄격한 접근 제어
- ✅ 불변 감사 로그 (who/when/why)
- ✅ 원본 문서 보안 저장소 보관

### 6.2 규정 준수

**FANR/MOIAT**:
- ✅ FANR 규정 준수 검증 (핵심 물질)
- ✅ MOIAT 규정 준수 검증 (수출입)
- ✅ 인증서 유효성 검증 (30일 전 경고)

**감사 로그**:
- ✅ 모든 검증 결정 기록 (who/when/why)
- ✅ 불변 감사 로그 유지
- ✅ 7년 보관 (규정 준수)

---

## 7. 접근성 요구사항

### 7.1 WCAG 2.2 AA 기준

**전역 요구사항**:
- ✅ 대비 ≥ 4.5:1
- ✅ 모든 인터랙티브 요소 키보드 접근 가능
- ✅ ESC로 드로어/모달 닫기
- ✅ 스크린 리더 지원

**컴포넌트별 요구사항**:
- MapView: focus hijack 방지 (tabindex -1 where appropriate)
- RightPanel: rows act as buttons with aria-label
- KpiStrip: aria-live="polite" for updates
- Charts: 항상 텍스트 요약/테이블 대안 제공
- DetailDrawer: focus trap, ESC closes, prevent background scroll

### 7.2 검증

- [ ] 접근성 기준 충족 확인
- [ ] 스크린 리더 테스트
- [ ] 키보드만으로 전체 플로우 테스트

---

## 8. 테스트 및 QA

### 8.1 필수 사항

- [ ] 로직 변경 시 테스트 포함/업데이트
- [ ] Typecheck 통과
- [ ] Lint 통과
- [ ] 터치한 영역에 대한 테스트

### 8.2 테스트 범위

- Unit tests
- Integration tests
- 접근성 테스트
- 성능 테스트

### 8.3 핵심 사용자 플로우 검증

1. **위치 상태 확인**: 지도에서 위치 선택 → 상태 패널 표시
2. **HVDC 워크리스트 관리**: 워크리스트 항목 생성/수정/완료
3. **실시간 업데이트**: Realtime 구독 정상 작동
4. **모바일 인터랙션**: 하단 패널 드래그, 드로어 컨트롤

---

## 9. 변경 관리

### 9.1 파괴적 작업

- ❌ DROP/DELETE 등 파괴적 작업 전 **반드시 계획·확인**
- ✅ 마이그레이션 전 검토 필수
- ✅ 롤백 계획 수립

### 9.2 변경 승인 필요

- Breaking changes
- 의존성 업그레이드
- 보안 약화
- RLS 정책 변경

### 9.3 PR 요구사항

- 명확한 설명
- 스크린샷 (UI 변경 시)
- 테스트 포함
- 마이그레이션 노트 (스키마 변경 시)
- 롤백 계획 (필요 시)

---

## 10. Non-Goals

다음은 명시적 요청이 없는 한 포함하지 않습니다:

- ❌ RDF/온톨로지 접근 방식 교체
- ❌ Supabase 외 추가 데이터베이스 도입
- ❌ 처음부터 새 디자인 시스템 구축 (기존 컴포넌트 재사용 우선)
- ❌ 대규모 UI 재설계 (기존 컴포넌트 재사용 우선)

---

## 11. 참조 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 규칙 상세 (이 문서의 소스)
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 통합 상태
- [architecture.md](../architecture/architecture.md) - 시스템 아키텍처
- [roadmap_system_doc.md](../integration/roadmap_system_doc.md) - 로드맵
- [SSOT.md](../.cursor/skills/hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원

---

## 12. 문서 버전 관리

**문서 버전**: 1.0  
**최종 업데이트**: 2026-01-23

**변경 이력**:
- 2026-01-23: 초기 버전 생성 (AGENTS.md 기반)

---

**이 문서는 프로젝트의 "헌법"으로, 모든 결정과 구현의 기준이 됩니다. 변경 시 반드시 팀 리뷰 및 승인이 필요합니다.**
