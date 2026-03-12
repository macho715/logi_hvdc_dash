# 스킬 참조 문서 전체 검토

**작성일**: 2026-01-23  
**최종 업데이트**: 2026-01-24  
**목적**: HVDC + Logistics 통합 프로젝트의 모든 Cursor 스킬 검토 및 요약

---

## Executive Summary

프로젝트에는 **7개의 핵심 스킬**이 정의되어 있으며, 각 스킬은 특정 도메인 작업을 지원합니다. 모든 스킬은 `AGENTS.md`와 `SSOT.md`를 최우선 참조로 사용합니다.

---

## 1. 핵심 스킬 목록

### 1.1 `hvdc-logistics-ssot`
**목적**: 통합 프로젝트의 단일 진실원(SSOT) 제공  
**참조 문서**:
- `references/SSOT.md`: 프로젝트 전반의 문제정의, 목표, UX, 컴포넌트, 검증 게이트
- `references/QUICK_SUMMARY.md`: 요약 및 핵심 제약사항

**주요 내용**:
- Mission: HVDC + Logistics 단일 웹 애플리케이션 통합
- Supabase as SSOT 원칙
- 레이아웃 불변: MapView (left) + RightPanel (right) + HVDC Panel (bottom)
- 성능 목표: avg < 1s, p95 < 3s

**사용 시점**: 요구사항 확인, 설계/구현/검증 기준 정리

---

### 1.2 `hvdc-logistics-planning`
**목적**: SSOT 기반 실행 가능한 계획과 문서 생성  
**참조 문서**:
- `references/DOC_OUTLINES.md`: README, ARCHITECTURE, SYSTEM_LAYOUT, Validation Gates 아웃라인

**출력**:
- `ROADMAP.md`: 통합 로드맵
- `ARCHITECTURE.md`: 시스템 아키텍처
- `SYSTEM_LAYOUT.md`: Monorepo 구조 및 파일 조직

**사용 시점**: 초기 설계, 중간 점검, Gate 통과 준비

---

### 1.3 `supabase-unified-schema`
**목적**: HVDC·물류 데이터를 단일 스키마로 통합  
**참조 문서**:
- `references/DATA_MODEL.md`: Core Tables (locations, location_statuses, events, hvdc_worklist, hvdc_kpis, logs)
- `assets/schema_v1.sql`: 초안 스키마

**출력**:
- SQL 스키마 파일
- RLS 정책 SQL
- Realtime 구독 설정 ✅ Realtime 마이그레이션 스크립트 생성 완료 (2026-01-24)

**제약사항**:
- pressure ≤ 4.0 t/m² (안전 기준)
- RLS 필수
- DROP/DELETE 금지
- 마이그레이션 전 검토 필수

**사용 시점**: 초기 스키마 설계, 마이그레이션 계획, RLS 정책 추가/수정

---

### 1.4 `unified-dashboard-ui`
**목적**: 일관된 UX의 통합 대시보드 구현  
**참조 문서**:
- `references/COMPONENT_SPEC.md`: MapView, RightPanel, HVDC Panel 사양
- `references/A11Y_CHECKLIST.md`: WCAG 2.2 AA 체크리스트

**레이아웃 불변**:
- 좌측: MapView (maplibre-gl + deck.gl)
- 우측: RightPanel (상태 정보)
- 하단: HVDC Panel (KPI/워크리스트)

**스타일 규칙**:
- 다크 모드 기본
- 상태 색상: OK/Warning/Critical
- 모바일 우선 제스처

**사용 시점**: UI 컴포넌트 구현, 레이아웃 통합, 접근성 검증

---

### 1.5 `rdf-ttl-pipeline`
**목적**: 관계형 데이터와 온톨로지 간 일관성 유지  
**참조 문서**:
- `references/RDF_MAPPING_GUIDE.md`: 컬럼 스펙 SSOT, TTL 변환 프로세스
- `assets/columns.hvdc_status.example.json`: 컬럼 스펙 예시
- `scripts/validate_used_cols.py`: 사용 컬럼 검증 스크립트

**절차**:
1. 컬럼 스펙(SSOT) 로드
2. JSON → TTL 변환 실행
3. 사용 컬럼 감사 로그 생성
4. 정합성 검증

**사용 시점**: JSON → TTL 변환, 컬럼 사용 검증, 온톨로지 정합성 확인

---

### 1.6 `realtime-perf-testing`
**목적**: 실시간 업데이트 성능 검증  
**참조 문서**:
- `references/PERF_TEST_PLAN.md`: 성능 테스트 계획
- `scripts/k6_api_smoke.js`: k6 부하 테스트 스크립트

**목표**:
- 평균 응답 시간 < 1s
- p95 < 3s
- 동시 구독자 처리 능력 검증

**테스트 시나리오**:
1. 단일 구독자: 기본 성능 측정
2. 동시 구독자 (10명): 부하 테스트
3. 동시 구독자 (50명): 스트레스 테스트
4. 장기 실행: 메모리 누수 확인

**사용 시점**: Realtime 구독 성능 측정, 부하 테스트, Gate 3 성능 검증

**현재 상태**: ✅ Realtime 구현 완료 (2026-01-24), 성능 테스트 대기 중

---

### 1.7 `handoff-docs-bundle`
**목적**: 운영·유지보수를 위한 문서 일괄 생성  
**참조 문서**:
- `references/README_TEMPLATE.md`: README 템플릿
- `references/CHANGELOG_TEMPLATE.md`: CHANGELOG 템플릿
- `assets/env.example`: 환경 변수 예시

**출력**:
- `README.md`: 프로젝트 개요 및 설치/실행 가이드
- `.env.example`: 환경 변수 예시
- `CHANGELOG.md`: 변경 이력
- `SETUP.md`: 설정 가이드

**사용 시점**: 프로젝트 핸드오프, 새 팀원 온보딩, 배포 준비

---

## 2. 스킬 간 의존성

```
hvdc-logistics-ssot (최우선)
    ↓
    ├─→ hvdc-logistics-planning
    ├─→ supabase-unified-schema
    ├─→ unified-dashboard-ui
    ├─→ rdf-ttl-pipeline
    ├─→ realtime-perf-testing
    └─→ handoff-docs-bundle
```

**원칙**: 모든 스킬은 `AGENTS.md`와 `SSOT.md`를 최우선 참조로 사용합니다.

---

## 3. 통합 작업 시 스킬 활용 순서

### Phase 1: 계획 및 설계
1. `hvdc-logistics-ssot`: 요구사항 및 제약사항 확인
2. `hvdc-logistics-planning`: 통합 로드맵 및 아키텍처 문서 생성

### Phase 2: 데이터 통합
3. `supabase-unified-schema`: 통합 스키마 설계 및 마이그레이션 계획
4. `rdf-ttl-pipeline`: RDF 파이프라인 통합 및 검증

### Phase 3: UI 통합
5. `unified-dashboard-ui`: 통합 레이아웃 구현 및 접근성 검증

### Phase 4: 성능 검증
6. `realtime-perf-testing`: 성능 테스트 및 Gate 3 검증 ✅ Realtime 구현 완료 (2026-01-24)

### Phase 5: 문서화
7. `handoff-docs-bundle`: 최종 문서 생성

---

## 4. 주요 제약사항 및 원칙

### 데이터 모델
- **Supabase as SSOT**: 모든 운영 데이터의 단일 저장소
- **RLS 필수**: 모든 테이블에 Row Level Security 적용
- **압력 한계**: pressure ≤ 4.0 t/m² (안전 기준)
- **서비스 키**: Edge Function에서만 사용, 클라이언트 금지

### UI/UX
- **레이아웃 불변**: MapView (left) + RightPanel (right) + HVDC Panel (bottom)
- **접근성**: WCAG 2.2 AA 준수
- **성능**: avg < 1s, p95 < 3s (핵심 플로우)

### RDF 파이프라인
- **컬럼 스펙 SSOT**: JSON 컬럼 스펙을 진실원으로 사용
- **감사 로그**: TTL 변환 시 사용된 컬럼 로그 생성
- **정합성 유지**: 관계형 데이터와 온톨로지 일관성 유지

### Realtime 구현
- **Option A+ 전략**: 클라이언트 측 KPI 재계산 (2026-01-24 완료)
- **배치 업데이트**: 300-500ms desktop, 1s mobile
- **폴백 폴링**: Realtime 실패 시 자동 전환
- **성능 모니터링**: commit_timestamp 추적

---

## 5. 다음 단계

1. ✅ 스킬 참조 문서 검토 완료
2. ✅ 통합 작업 계획 수립 (`hvdc-logistics-planning` 스킬 활용)
3. ✅ 통합 스키마 초안 작성 (`supabase-unified-schema` 스킬 활용)
4. ✅ 통합 UI 레이아웃 프로토타입 (`unified-dashboard-ui` 스킬 활용)
5. ✅ Realtime KPI Dashboard 구현 완료 (2026-01-24)
6. ⏭️ Realtime 성능 테스트 (`realtime-perf-testing` 스킬 활용)

---

**참고**: 모든 스킬의 상세 내용은 `.cursor/skills/{skill-name}/SKILL.md` 및 `references/` 디렉토리에서 확인할 수 있습니다.
