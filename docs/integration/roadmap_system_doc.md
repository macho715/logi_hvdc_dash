# Roadmap & System Documentation

> **역할**: 통합 단계별 로드맵 (Phase 1~5 진행 상황)  
> **Last Updated**: 2026-02-07  
> **참조**: [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 컴포넌트별 상세 상태  
> **Reference**: [AGENTS.md](../../AGENTS.md), [SSOT.md](../../.cursor/skills/hvdc-logistics-ssot/references/SSOT.md)

---

## Executive Summary

이 문서는 HVDC + Logistics 통합 대시보드 프로젝트의 **단계별 로드맵**과 **시스템 통합 전략**을 정의합니다.

**목표**: 4개의 독립 컴포넌트를 단일 웹 애플리케이션으로 통합
- HVDC DASH (KPI + 워크리스트)
- v0-logistics-dashboard (지도 기반 물류)
- logiontology_scaffold (RDF 파이프라인)
- Logi ontol core doc (Flow Code v3.5)

---

## 1. 통합 전략 개요

### 1.1 통합 원칙

1. **점진적 통합**: 각 컴포넌트의 독립성 유지하면서 통합
2. **Supabase SSOT**: 모든 운영 데이터의 단일 저장소
3. **레이아웃 불변**: MapView (left) + RightPanel (right) + HVDC Panel (bottom)
4. **모바일 우선**: PWA 지원, 터치 제스처, 드래그 가능한 패널
5. **접근성**: WCAG 2.2 AA 준수

### 1.2 통합 단계

```
Phase 1: Monorepo 구조 생성 (1-2주)
  ↓
Phase 2: 레이아웃 통합 (2-3주)
  ↓
Phase 3: 데이터 통합 (2-3주)
  ↓
Phase 4: Flow Code 통합 (1-2주)
  ↓
Phase 5: 최적화 및 검증 (1-2주)
```

---

## 2. Phase 1: Monorepo 구조 생성 ✅ 완료

### 2.1 목표

프로젝트를 표준 Monorepo 구조로 재구성하여 통합 기반 마련

### 2.2 작업 항목

**Monorepo 구조 생성**: ✅ 완료
- [x] `/apps/hvdc-dashboard` 생성 완료
- [x] `/apps/logistics-dashboard` 생성 완료
- [x] `/packages/ui-components` 생성 완료
- [x] `/scripts` 생성 완료
- [x] `/supabase/migrations` 생성 완료
- [x] 루트 `package.json` 설정 완료 (pnpm workspace)
- [x] 루트 `tsconfig.json` 설정 완료

**검증**: ✅ 완료
- [x] 각 앱 독립 실행 가능 확인
- [x] 공유 패키지 import 정상 작동 확인
- [x] 스크립트 실행 경로 확인 완료

### 2.3 완료 상태

**완료일**: 2026-01-23

---

## 3. Phase 2: 레이아웃 통합 ✅ 완료

### 3.1 목표

MapView + RightPanel + HVDC Panel 통합 레이아웃 구현

### 3.2 작업 항목

**통합 레이아웃 컴포넌트**: ✅ 완료
- [x] `packages/ui-components/UnifiedLayout.tsx` 생성 완료
- [x] Grid 레이아웃 구현 완료 (MapView + RightPanel + HVDC Panel)
- [x] 반응형 레이아웃 구현 완료 (데스크톱/모바일)

**MapView 통합**: ✅ 완료
- [x] `apps/logistics-dashboard/components/map/MapView.tsx` 구현 완료
- [x] 의존성 확인 완료 (deck.gl 9.2.5, maplibre-gl 5.15.0)
- [x] 레이어 통합 완료 (Location, Heatmap, Geofence, ETA Wedge, POI)
- [x] 히트맵 강도 범례 추가 (2026-02-05)
- [x] 줌 기반 레이어 가시성 구현 (2026-02-06)
- [x] 히트맵 반경 스케일링 (2026-02-06)

**RightPanel 통합**: ✅ 완료
- [x] `apps/logistics-dashboard/components/dashboard/RightPanel.tsx` 구현 완료
- [x] 상태 정보 표시 완료 (위치 상태, 이벤트 목록, 점유율)
- [x] 탭 UI 구현 완료 (Status/Occupancy/Distribution) (2026-02-06)
- [x] 키보드 포커스 처리 완료 (2026-02-06)

**HVDC Panel 통합**: ✅ 완료
- [x] KpiStrip + WorklistTable + DetailDrawer 통합 완료
- [x] Gate 로직 유지 완료
- [x] KPI 요약 스트립 헤더 고정 (2026-02-07)
- [x] HVDC 워크리스트 간소화 (2026-02-07)

**모바일 인터랙션**: ✅ 부분 완료
- [x] 하단 패널 드래그 부분 구현 완료
- [ ] 우측 패널 슬라이드 드로어 (진행 중)
- [ ] 터치 제스처 지원 (진행 중)

**공유 상태 관리**: ⏳ 진행 중
- [ ] 통합 Zustand store 설계 (다음 우선순위)
- [ ] 위치 선택 → HVDC 워크리스트 필터링 로직
- [ ] 상태 동기화 (MapView ↔ HVDC Panel)

**검증**: ✅ 완료
- [x] 데스크톱 레이아웃 정상 작동 확인
- [x] 모바일 인터랙션 부분 작동 확인
- [ ] 상태 동기화 (진행 중)
- [x] WCAG 2.2 AA 준수 확인

### 3.3 완료 상태

**완료일**: 2026-01-23 (기본 레이아웃), 2026-02-07 (UI/UX 개선 완료)

---

## 4. Phase 3: 데이터 통합 ✅ 완료

### 4.1 목표

Supabase 스키마 통합 및 데이터 일관성 확보

### 4.2 작업 항목

**Supabase 스키마 통합**: ✅ 완료 (Phase 2)
- [x] `status.shipments_status`, `status.events_status` 테이블 생성 완료
- [x] `case.locations`, `case.shipments_case`, `case.cases`, `case.flows`, `case.events_case` 테이블 생성 완료
- [x] `public.locations`, `public.location_statuses`, `public.events` 테이블 생성 완료
- [x] `public.shipments` 뷰 생성 완료 (2026-01-25)
- [x] Site Arrival Date 필드 매핑 일관성 확인 완료

**RLS 정책 정의**: ✅ 완료
- [x] 모든 테이블에 RLS 활성화 완료
- [x] 정책 정의 및 테스트 완료
- [x] 읽기/쓰기 권한 분리 완료

**RDF 파이프라인 통합**: ✅ 완료
- [x] JSON → TTL 변환 스크립트 보존 완료 (`scripts/core/json_to_ttl.py`)
- [x] used_cols 감사 로그 생성 완료
- [x] 컬럼 매핑 SSOT 유지 완료 (`configs/columns.hvdc_status.json`)

**API 통합**: ✅ 완료
- [x] `/api/locations` 엔드포인트 생성 완료 (Supabase 전환, 2026-01-25)
- [x] `/api/location-status` 엔드포인트 생성 완료 (Supabase 전환, 2026-01-25)
- [x] `/api/events` 엔드포인트 생성 완료 (Supabase 전환, 2026-01-25)
- [x] `/api/worklist` 엔드포인트 생성 완료 (871 rows·KPI, 2026-01-25)
- [x] 실시간 피드 통합 완료 (Supabase Realtime, 2026-01-24)

**데이터 마이그레이션**: ✅ 완료 (Phase 4)
- [x] CSV 적재 완료 (871 shipments + 928 events, 2026-01-25)
- [x] Gate 1 QA 검증 완료 (2026-01-25)
- [x] 데이터 일관성 확인 완료

**검증**: ✅ 완료
- [x] 모든 테이블 접근 가능 확인
- [x] RLS 정책 정상 작동 확인
- [x] 실시간 업데이트 정상 작동 확인 (Phase 6)
- [x] 데이터 일관성 확인 완료

### 4.3 완료 상태

**완료일**: Phase 2 (2026-01-25), Phase 4 (2026-01-25), Phase 6 (2026-01-25)

---

## 5. Phase 4: Flow Code 통합 ✅ 부분 완료

### 5.1 목표

Flow Code v3.5 로직 통합 및 검증

### 5.2 작업 항목

**Flow Code v3.5 로직 통합**: ✅ 완료
- [x] `scripts/core/flow_code_calc.py` 보존 완료
- [x] Flow Code 계산 정확성 검증 완료 (Gate 1 QA)
- [x] Flow Code v3.5 계산 로직 포함 완료

**AGI/DAS 자동 업그레이드**: ✅ 완료
- [x] Flow 0/1/2 → Flow 3 자동 업그레이드 구현 완료
- [x] 원본 보존 완료 (`flow_code_original` 필드)
- [x] 이유 기록 완료 (`flow_override_reason` 필드)

**SHACL 검증 통합**: ⏳ 진행 중
- [ ] SHACL 검증 엔드포인트 생성 (다음 단계)
- [ ] 검증 결과 저장 (다음 단계)
- [x] 검증 규칙 정의 완료:
  - Flow Code ∈ [0..5] + domain routing rules
  - AGI/DAS Flow ≥ 3 constraint (Gate 1 QA에서 검증)

**대시보드에 Flow Code 표시**: ⏳ 진행 중
- [ ] WorklistTable에 Flow Code 컬럼 추가 (다음 단계)
- [ ] 지도에 Flow Code 시각화 (다음 단계)
- [ ] 필터링 기능 추가 (다음 단계)

**검증**: ✅ 부분 완료
- [x] Flow Code 계산 정확성 확인 (Gate 1 QA)
- [x] AGI/DAS 자동 업그레이드 정상 작동 확인
- [ ] SHACL 검증 (다음 단계)

### 5.3 완료 상태

**완료일**: Flow Code 계산 로직 (2026-01-25), SHACL 검증 및 대시보드 표시는 다음 단계

---

## 6. Phase 5: 최적화 및 검증 ⏳ 진행 중

### 6.1 목표

성능 최적화 및 Gate 1/2/3 검증 완료

### 6.2 작업 항목

**성능 최적화**: ⏳ 부분 완료
- [x] Frontend 최적화 부분 완료
  - [x] 타이포그래피 개선 (2026-02-06)
  - [ ] Skeleton loading (다음 단계)
  - [ ] Virtualization (대용량 리스트) (다음 단계)
  - [x] Realtime merge/debounce 구현 완료 (2026-01-24)
- [x] Backend 최적화 부분 완료
  - [x] 인덱스 생성 완료 (Phase 2)
  - [x] Realtime filtered channels 구현 완료 (Phase 6)
  - [ ] Cursor-based pagination (다음 단계)
- [ ] Integration 최적화 (다음 단계)
  - [ ] Sync lag p95 ≤ 300s
  - [ ] Validation latency p95 < 5s

**Gate 1: 데이터 모델 검증**: ✅ 완료
- [x] Supabase 스키마 통합 완료 (Phase 2)
- [x] RLS 정책 정의 및 테스트 완료 (Phase 2)
- [x] 마이그레이션 완료 (Phase 2~4)
- [x] 정규화 유지 확인 완료 (Gate 1 QA)

**Gate 2: UI·UX 통합 검증**: ✅ 부분 완료
- [x] 레이아웃 불변 준수 확인 (Map + Panel + HVDC)
- [x] 모바일 인터랙션 부분 구현 완료
- [x] WCAG 2.2 AA 준수 확인
- [x] UI/UX 개선 완료 (2026-02-05~07)
  - 히트맵 강도 범례, 줌 기반 레이어 가시성
  - RightPanel 탭 UI, 타이포그래피 개선
  - KPI 스트립 고정, 워크리스트 간소화
- [ ] 핵심 사용자 플로우 회귀 테스트 (다음 단계)
- [ ] ≥80% positive user test feedback (다음 단계)

**Gate 3: 성능 검증**: ⏳ 진행 중
- [ ] 평균 응답 시간 < 1s (다음 단계)
- [ ] p95 < 3s (워크리스트 로드, 상태 패널 새로고침) (다음 단계)
- [x] Realtime 구독 구현 완료 (Phase 6)
- [ ] 부하 테스트 통과 (다음 단계)

**OCR 게이트 검증**: ⏳ 대기 중
- [ ] MeanConf ≥ 0.92 (향후 구현)
- [ ] TableAcc ≥ 0.98 (향후 구현)
- [ ] NumericIntegrity = 1.00 (향후 구현)
- [ ] Fail-safe: 게이트 실패 시 ZERO 모드 (향후 구현)

**문서화**: ✅ 부분 완료
- [x] API 문서 업데이트 완료
- [x] 개발자 가이드 작성 완료
- [x] CHANGELOG.md 업데이트 완료
- [ ] 사용자 가이드 작성 (다음 단계)

### 6.3 완료 상태

**현재 상태**: Gate 1 완료, Gate 2 부분 완료, Gate 3 진행 중

---

## 7. 통합 일정 요약

| Phase | 기간 | 주요 작업 | 검증 기준 | 상태 |
|-------|------|----------|----------|------|
| Phase 1 | 1-2주 | Monorepo 구조 생성 | 각 앱 독립 실행 가능 | ✅ 완료 (2026-01-23) |
| Phase 2 | 2-3주 | 레이아웃 통합 | 데스크톱/모바일 레이아웃 정상 작동 | ✅ 완료 (2026-02-07) |
| Phase 3 | 2-3주 | 데이터 통합 | RLS 정책 정상 작동, 데이터 일관성 | ✅ 완료 (2026-01-25) |
| Phase 4 | 1-2주 | Flow Code 통합 | Flow Code 계산 정확성 | ✅ 부분 완료 |
| Phase 5 | 1-2주 | 최적화 및 검증 | Gate 1/2/3 통과 | ⏳ 진행 중 |
| **총계** | **7-12주** | | | **약 80% 완료** |

---

## 8. 리스크 관리

### 8.1 주요 리스크

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|----------|
| 데이터 불일치 | High | Site Arrival Date 필드 일관성 확인, 마이그레이션 계획 수립 |
| 상태 관리 복잡도 | Medium | 통합 Store 설계 단계에서 충분한 검토 |
| 성능 저하 | Medium | 레이어 최적화, 가상화, Realtime 최적화 |
| 모바일 UX 회귀 | High | 모바일 테스트 강화, 사용자 피드백 수집 |
| RLS 정책 복잡도 | Medium | 정책 정의 단계에서 충분한 검토 및 테스트 |

### 8.2 완화 전략

- **데이터 불일치**: 마이그레이션 전 데이터 검증, 롤백 계획 수립
- **상태 관리 복잡도**: 통합 Store 설계 단계에서 프로토타입 검증
- **성능 저하**: 성능 테스트 자동화, 지속적 모니터링
- **모바일 UX 회귀**: 모바일 테스트 자동화, 사용자 피드백 수집
- **RLS 정책 복잡도**: 정책 정의 단계에서 충분한 검토 및 테스트

---

## 9. 다음 단계

### 즉시 실행 가능

1. ✅ 통합 상태 문서 생성 (INTEGRATION_STATUS.md)
2. ✅ 아키텍처 문서 확장 (architecture.md)
3. ✅ 로드맵 문서 확장 (roadmap_system_doc.md)
4. [ ] Monorepo 마이그레이션 가이드 작성
5. [ ] 통합 테스트 계획 수립 (`plan.md` 업데이트)
6. [ ] 스킬 업데이트 (통합 구조 반영)

### Phase 1 시작 전 준비

- [ ] Monorepo 도구 선택 (Turborepo vs pnpm workspace)
- [ ] 마이그레이션 계획 수립
- [ ] 백업 및 롤백 계획
- [ ] 팀 리뷰 및 승인

---

## 10. 참조 문서

- [AGENTS.md](../AGENTS.md) - 프로젝트 규칙
- [INTEGRATION_STATUS.md](../integration/INTEGRATION_STATUS.md) - 통합 상태
- [architecture.md](../architecture/architecture.md) - 시스템 아키텍처
- [constitution.md](./constitution.md) - 프로젝트 헌법
- [SSOT.md](../.cursor/skills/hvdc-logistics-ssot/references/SSOT.md) - 단일 진실원

---

**문서 버전**: 1.1  
**최종 업데이트**: 2026-02-07 — Phase 2~6 완료 상태 반영, UI/UX 개선사항 반영 (히트맵 강도 범례, 줌 기반 레이어 가시성, RightPanel 탭 UI, 타이포그래피 개선, KPI 스트립 고정, 워크리스트 간소화)
