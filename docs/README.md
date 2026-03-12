# 문서 인덱스

> **최종 업데이트**: 2026-02-07  
> 이 문서는 docs 폴더의 모든 문서에 대한 네비게이션 가이드입니다.

---

## 빠른 시작

### 프로젝트 이해
- [프로젝트 구조](./architecture/PROJECT_STRUCTURE.md) - 프로젝트 구조 온보딩 가이드
- [아키텍처 개요](./architecture/architecture.md) - 시스템 아키텍처
- [대시보드 레이아웃](./architecture/DASHBOARD_LAYOUT.md) - 대시보드 레이아웃 상세 사양
- [컴포넌트 상세 사양](./architecture/COMPONENT_DETAIL_SPEC.md) - 컴포넌트 구현 상세

---

## 데이터 로딩

### 계획 및 실행
- [데이터 로딩 계획](./data-loading/DATA_LOADING_PLAN.md) - Supabase 데이터 적재 단계별 실행 계획
- [데이터 로딩 Runbook](./data-loading/DATA_LOADING_RUNBOOK.md) - Phase 1~7 상세 실행 가이드
- [데이터 로딩 리포트 템플릿](./data-loading/DATA_LOADING_REPORT_TEMPLATE.md) - 실행 결과 기록 템플릿

### 진행 상황
- [데이터 통합 요약](./data-loading/DATA_INTEGRATION_SUMMARY.md) - 데이터 연동 요약 (흐름·확인·재실행)
- [대시보드 데이터 통합 진행](./data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - Phase 2~6 실행·진행 SSOT

### Phase별 계획
- [Phase 2: DDL 적용 계획](./data-loading/PHASE2_DDL_APPLICATION_PLAN.md) - Supabase CLI 사용
- [Phase 4: CSV 적재 계획](./data-loading/PHASE4_CSV_LOADING_PLAN.md) - Dashboard Import 또는 Python 스크립트
- [Phase 5: Gate 1 QA 계획](./data-loading/PHASE5_GATE1_QA_PLAN.md) - 데이터 무결성 검증
- [Phase 6: Realtime 활성화 계획](./data-loading/PHASE6_REALTIME_ACTIVATION_PLAN.md) - Realtime publication 활성화

### ETL 가이드
- [ETL 가이드](./data-loading/ETL_GUIDE.md) - ETL 스크립트 사용 가이드

### Q&A
- [데이터 로딩 Q&A](./data-loading/DATA_LOADING_QA.md) - 데이터 로딩 파이프라인, 시스템 통합, Realtime 구현 관련 주요 문의와 답변 종합

---

## 통합 로드맵

- [통합 로드맵](./integration/INTEGRATION_ROADMAP.md) - 통합 작업 계획
- [통합 상태](./integration/INTEGRATION_STATUS.md) - 컴포넌트별 상세 상태 문서
- [로드맵 & 시스템 문서](./integration/roadmap_system_doc.md) - 통합 단계별 로드맵 (Phase 1~5)
- [다음 단계 우선순위](./integration/NEXT_STEPS_PRIORITY.md) - 우선순위 및 실행 계획
- [V2 패치 통합 계획](./integration/V2_PATCH_INTEGRATION_PLAN.md) - realtime-kpi-dashboard_patch_v2 통합
- [Realtime KPI 패치 v2 문서](./integration/REALTIME_KPI_PATCH_V2.md) - realtime-kpi-dashboard_patch_v2 분석 문서

---

## Supabase

### 연결 및 설정
- [연결 문자열 가이드](./supabase/SUPABASE_CONNECTION_STRING_GUIDE.md) - Supabase 연결 문자열 찾기
- [연결 트러블슈팅](./supabase/SUPABASE_CONNECTION_TROUBLESHOOTING.md) - 연결 문제 종합 가이드

### 데이터 로딩
- [하이브리드 전략](./supabase/SUPABASE_LOADING_HYBRID_STRATEGY.md) - Bulk 및 Incremental 데이터 로딩 표준화
- [업로드 완전 플랜](./supabase/SUPABASE_UPLOAD_COMPLETE_PLAN.md) - Phase 2~6 통합 플랜
- [업로드 방법](./supabase/SUPABASE_UPLOAD_METHODS.md) - 업로드 방법 비교
- [데이터 위치](./supabase/SUPABASE_UPLOAD_DATA_LOCATIONS.md) - 데이터 파일 위치 가이드
- [Dashboard Import 가이드](./supabase/SUPABASE_DASHBOARD_IMPORT_GUIDE.md) - Supabase Dashboard에서 CSV Import

### 분석
- [Option C 빈 데이터 분석](./supabase/SUPABASE_OPTIONC_EMPTY_DATA_ANALYSIS.md) - Option C 데이터 분석

### 테이블 CSV
- [Supabase 테이블 CSV](./supabase/SUPABASE_TABLES_CSV.md) - Supabase 테이블 CSV 관련 정보

---

## 트러블슈팅

- [DNS 해결](./troubleshooting/FIX_DNS_RESOLUTION.md) - DNS 해석 실패 문제 해결 가이드 (상세)
- [빠른 DNS 해결](./troubleshooting/QUICK_FIX_DNS.md) - 빠른 해결 가이드 (Session Pooler 중심)
- [Session Pooler URL](./troubleshooting/GET_SESSION_POOLER_URL.md) - Session Pooler 연결 문자열 찾기

---

## 가이드

- [실행 가이드](./guides/RUN_ALL_EXECUTION_GUIDE.md) - run_all.ps1 스크립트 종합 가이드
- [데이터 로딩 실행 가이드](./guides/REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md) - 실제 레포 구조 기반 실행 가이드
- [테이블 스타일링](./guides/TABLE_STYLING_GUIDE.md) - 테이블 스타일링 가이드
- [Realtime KPI 개발 계획](./guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md) - Realtime KPI Dashboard 개발 계획
- [Realtime 구현 가이드](./guides/REALTIME_IMPLEMENTATION.md) - Supabase Realtime KPI Dashboard 구현 가이드
- [Realtime 설정 검토](./guides/realtime-config-review.md) - Realtime 설정 검토 문서

---

## 마이그레이션

- [마이그레이션 체크리스트](./migrations/MIGRATION_CHECKLIST.md) - 마이그레이션 체크리스트
- [마이그레이션 완료 리포트](./migrations/MIGRATION_COMPLETION_REPORT.md) - 마이그레이션 완료 리포트
- [Flow Code v3.5 마이그레이션](./migrations/FLOW_CODE_V35_MIGRATION_GUIDE.md) - Flow Code v3.5 마이그레이션 가이드

---

## 배포

- [Vercel 배포 성공](./deployment/VERCEL_DEPLOYMENT_SUCCESS.md) - Vercel 배포 성공 리포트
- [DASH 패치 계획](./deployment/DASH_PLAN.md) - dash 패치 적용 계획 (맵 POI·StageCardsStrip·GlobalSearch)
- [맵 패치](./deployment/MAP_PATCH.md) - 맵 패치 관련 정보
- [POI 맵 패치 실행 가이드](./deployment/POI_MAP_PATCH_RUNBOOK.md) - POI 맵 패치 실행 가이드

---

## 유지보수

- [루트 폴더 추가 정리 계획](./maintenance/ROOT_FOLDER_CLEANUP_PLAN.md) - 루트 폴더 정리 작업 계획 (빌드 캐시, src/ 폴더, reports/ 폴더 처리)

---

## 루트 문서

다음 문서는 프로젝트 루트에 위치합니다:

- [AGENTS.md](../AGENTS.md) - 코딩 규칙 SSOT
- [STATUS.md](../STATUS.md) - 통합 상태 SSOT
- [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) - 한눈에 보는 개발 현황
- [README.md](../README.md) - 프로젝트 README
- [constitution.md](./constitution.md) - 프로젝트 헌법

---

## 다국어 문서

- [한국어 문서](./kr/README.md) - 한국어 변경사항
- [English Documents](./en/README.md) - Recent Updates

---

---

## 문서 통계

- **총 문서 수**: 54개 (하위 폴더 포함)
- **카테고리 폴더**: 9개 (maintenance 추가)
- **이동된 파일**: 37개
- **최종 업데이트**: 2026-02-07

---

**문서 구조**: 이 폴더는 카테고리별로 하위 폴더로 구성되어 있습니다. 각 폴더의 문서는 관련 주제로 그룹화되어 있습니다.

**참고**: 루트에 위치한 `AGENTS.md`와 `constitution.md`는 프로젝트 전체 규칙 문서이므로 루트에 유지됩니다.
