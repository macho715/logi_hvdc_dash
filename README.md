# LOGI MASTER DASH — HVDC + Logistics Integrated Dashboard

> **Monorepo 통합 프로젝트**: HVDC Dashboard와 Logistics Dashboard를 단일 웹 애플리케이션으로 통합

**SSOT 문서**:
- 📊 **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 한눈에 보는 개발 현황 및 다음 단계
- ✅ **[docs/deployment/VERCEL_DEPLOYMENT_SUCCESS.md](./docs/deployment/VERCEL_DEPLOYMENT_SUCCESS.md)** - Vercel 배포 성공 리포트
- [STATUS.md](./STATUS.md) - 통합 상태 SSOT
- [docs/README.md](./docs/README.md) - 📚 문서 인덱스 및 네비게이션 가이드 (카테고리별 정리)
- [DASHBOARD_DATA_INTEGRATION_PROGRESS](./docs/data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - Phase 2~6 실행·진행 SSOT
- [DATA_INTEGRATION_SUMMARY](./docs/data-loading/DATA_INTEGRATION_SUMMARY.md) - 데이터 연동 요약 (흐름·확인·재실행)
- [dash/reakmapping.md](./dash/reakmapping.md) - 맵 POI 좌표·레이어 SSOT
- [dash/docs/APPLY_PATCH.md](./dash/docs/APPLY_PATCH.md) - dash 패치 통합 절차
- [AGENTS.md](./AGENTS.md) - 코딩 규칙 SSOT
- [docs/integration/INTEGRATION_ROADMAP.md](./docs/integration/INTEGRATION_ROADMAP.md) - 통합 로드맵

---

## 🚀 빠른 시작

### 배포 상태

✅ **Vercel 배포 성공**
- 프로덕션 URL: https://logimasterdash-rkz2dqsc8-chas-projects-08028e73.vercel.app/
- 프로젝트: [logimasterdash](https://vercel.com/chas-projects-08028e73/logimasterdash)
- Monorepo 구조에서 Next.js 감지 및 빌드 정상 동작 확인

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Supabase 계정 및 프로젝트

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (모든 앱)
pnpm dev

# 특정 앱만 실행
cd apps/logistics-dashboard && pnpm dev   # Logistics 대시보드 (포트 3001)
pnpm --filter hvdc-dashboard dev          # HVDC 대시보드 (포트 3001, 동시 실행 시 충돌 주의)
```

### 환경 변수 설정

로컬 대시보드 `/api/worklist` 연동을 위해 `apps/logistics-dashboard/.env.local` 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

설정 후 `pnpm dev` → `http://localhost:3001/api/worklist` 에서 871 rows·KPI 확인 가능.

---

## 📁 프로젝트 구조

```
/
├── apps/
│   ├── hvdc-dashboard/          # HVDC Dashboard (포트 3001)
│   └── logistics-dashboard/     # Logistics Dashboard (포트 3001)
├── packages/
│   ├── ui-components/           # 공용 UI 컴포넌트
│   └── shared/                 # 공유 타입/유틸리티
├── scripts/                     # ETL/온톨로지 파이프라인
│   └── hvdc/                    # Phase 2~6 DDL·CSV·QA·Realtime 검증 스크립트
├── configs/                     # 컬럼 SSOT 등 설정 파일
├── dash/                        # 대시보드 맵/스테이지/검색 enhancement 패치 번들
│   └── docs/                    # dash 패치 문서 (APPLY_PATCH.md, FEATURE_SPEC_*.md)
├── supabase/
│   └── migrations/              # Supabase 마이그레이션
└── docs/                        # 프로젝트 문서 (카테고리별 정리)
    ├── architecture/            # 아키텍처 및 컴포넌트 사양
    ├── data-loading/            # 데이터 적재 계획 및 실행 가이드
    ├── integration/             # 통합 로드맵 및 상태
    ├── supabase/                # Supabase 설정 및 가이드
    ├── troubleshooting/         # 문제 해결 가이드
    ├── guides/                  # 실행 가이드 및 튜토리얼
    ├── migrations/              # 마이그레이션 체크리스트
    └── deployment/              # 배포 관련 문서
```

---

## Phase 2~6 데이터 적재 (scripts/hvdc)

| 스크립트 | 용도 |
|----------|------|
| `apply_ddl.py` | DDL 적용 (Phase 2) |
| `load_csv.py` | CSV 적재 (Phase 4, `--status-only`, UPSERT+FK 필터) |
| `gate1_qa.py` | Gate 1 QA 검증 (Phase 5) |
| `verify_phase2_ddl.py` | Phase 2 스키마·테이블·뷰 검증 |
| `verify_realtime_publication.py` | Phase 6 Realtime 활성화 검증 |
| `check_dashboard_data.py` | `public.shipments` 뷰·Worklist 연동 검증 |

**실행**: `SUPABASE_DB_URL` (Session pooler :5432) 설정 후 `run_phase2_ddl.ps1` 또는 개별 스크립트 실행.  
자세한 순서·옵션은 [DASHBOARD_DATA_INTEGRATION_PROGRESS](docs/data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) 및 [PHASE2/4/5/6 계획](docs/data-loading/PHASE2_DDL_APPLICATION_PLAN.md) 참조.

---

## dash 패치 적용 (맵 POI·StageCardsStrip·GlobalSearch)

**dash 패치**는 대시보드 맵/스테이지/검색 enhancement를 제공합니다:
- **맵 POI 레이어**: 11개 고정 POI (AGI/DAS/MIR/SHU, DSV, MOSB, Port, Airport)
- **StageCardsStrip**: HVDC Panel 내 KpiStrip 상단 3카드, 라우팅 연동
- **GlobalSearch**: locations·worklist 검색

**상태**: 적용 완료 (검증 체크리스트는 [docs/deployment/DASH_PLAN.md](./docs/deployment/DASH_PLAN.md) §4).  
**POI 좌표 SSOT**: [dash/reakmapping.md](./dash/reakmapping.md) (DASH Phase A와 함께 구현)

---

## 🛠️ 개발 가이드

### Monorepo 이관

기존 프로젝트를 Monorepo로 이관하려면:

```bash
# Windows (PowerShell)
.\scripts\migrate-to-monorepo.ps1

# Linux/Mac (Bash)
bash scripts/migrate-to-monorepo.sh
```

### 빌드

```bash
# 모든 앱 빌드
pnpm build

# 특정 앱만 빌드
pnpm --filter hvdc-dashboard build
```

### 테스트

```bash
pnpm test
```

---

## ✨ 주요 기능

### 실시간 KPI 대시보드
- ✅ **Supabase Realtime** 기반 실시간 KPI 업데이트 (2026-01-24)
- ✅ **5개 테이블 Realtime 활성화** (2026-01-25): status.shipments_status, status.events_status, case.events_case, case.flows, case.cases
- ✅ 클라이언트 측 KPI 재계산 (Option A+ 전략)
- ✅ 배치 업데이트 및 성능 모니터링
- ✅ 폴백 폴링 메커니즘 (Realtime 실패 시 자동 전환)
- ✅ 연결 상태 UI 표시

### 통합 레이아웃
- ✅ MapView (좌측) + RightPanel (우측) + HVDC Panel (하단)
- ✅ 모바일 드래그 제스처 지원
- ✅ 접근성 개선 (WCAG 2.2 AA 준수)
- ✅ RightPanel 탭 UI: Status/Occupancy/Distribution 섹션 분리 및 키보드 포커스 처리 (2026-02-06)
- ✅ KPI 요약 스트립 헤더 고정 및 레이아웃 간격 조정 (2026-02-07)
- ✅ HVDC 워크리스트 간소화: 핵심 상태 컬럼만 표시, 트리거/상세는 Detail Drawer로 이동 (2026-02-07)

### 지도 레이어 & 히트맵
- ✅ Heatmap 토글 + 강도 범례 표시 (낮음~높음) (2026-02-05)
- ✅ 지오펜스 내부 이벤트 가중치 반영 (2026-02-05)
- ✅ 줌 기반 레이어 전환: Heatmap(<9.5) ↔ Status(≥9.5), POI 마커/라벨(≥7.5) (2026-02-06)
- ✅ 히트맵 반경 줌 레벨에 따른 스케일링 (2026-02-06)
- ✅ 타이포그래피 개선: 기본 텍스트 크기 및 계층 구조 최적화 (2026-02-06)

### 맵 POI (고정 11개)
- ✅ **맵 POI 레이어** (reakmapping SSOT): AGI/DAS/MIR/SHU, DSV M-19/M-44, MOSB YARD/MOSB-SCT, Mina Zayed, Khalifa(KPCT), AUH
- ✅ deck.gl ScatterplotLayer + TextLayer (CollisionFilter)로 라벨 겹침 최소화
- ✅ 줌 기반 가시성: 마커 ≥7.5, 라벨 7.5~10.5(코드), 10.5+(상세)
- 참조: [dash/reakmapping.md](./dash/reakmapping.md)

### StageCardsStrip
- ✅ HVDC Panel KpiStrip 상단 3카드 (라우팅 연동)
- ✅ Worklist 필터 연동

### GlobalSearch
- ✅ locations·worklist 검색 (`searchIndex` 연동)
- ✅ 키보드 네비게이션 (↑/↓/Enter/Esc)

### 데이터 통합
- ✅ Supabase 단일 DB (SSOT)
- ✅ Phase 2~6 완료: DDL 적용, CSV 적재 (871 shipments + 928 events), Gate 1 QA, Realtime 활성화
- ✅ `public.shipments` 뷰 생성, Worklist API 연동 — 로컬 테스트 완료 (871 rows·KPI)
- ✅ 맵 레이어 API 라우트 Supabase 전환: `/api/locations`, `/api/location-status`, `/api/events`를 Mock에서 실제 데이터 조회로 전환 (스키마 매핑, Fallback 로직 포함)
- ✅ Flow Code v3.5 계산 및 검증
- ✅ RLS (Row Level Security) 정책 적용
- ✅ JSON → RDF(Turtle) 파이프라인

---

## 📚 주요 문서

> **📖 전체 문서 인덱스**: [docs/README.md](./docs/README.md) - 카테고리별로 정리된 모든 문서 목록

### 핵심 문서
- 📊 **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 한눈에 보는 개발 현황 및 다음 단계
- ✅ **[docs/deployment/VERCEL_DEPLOYMENT_SUCCESS.md](./docs/deployment/VERCEL_DEPLOYMENT_SUCCESS.md)** - Vercel 배포 성공 리포트
- [STATUS.md](./STATUS.md) - 통합 상태 SSOT
- [docs/integration/INTEGRATION_STATUS.md](./docs/integration/INTEGRATION_STATUS.md) - 상세 통합 상태
- [docs/integration/NEXT_STEPS_PRIORITY.md](./docs/integration/NEXT_STEPS_PRIORITY.md) - 우선순위 및 실행 계획

### 아키텍처 및 구조
- [docs/architecture/architecture.md](./docs/architecture/architecture.md) - 시스템 아키텍처
- [docs/architecture/DASHBOARD_LAYOUT.md](./docs/architecture/DASHBOARD_LAYOUT.md) - 통합 대시보드 레이아웃 상세 사양
- [docs/architecture/COMPONENT_DETAIL_SPEC.md](./docs/architecture/COMPONENT_DETAIL_SPEC.md) - 컴포넌트 구현 상세
- [docs/architecture/PROJECT_STRUCTURE.md](./docs/architecture/PROJECT_STRUCTURE.md) - 프로젝트 구조 온보딩 가이드

### 데이터 로딩 및 통합
- [docs/data-loading/DATA_LOADING_PLAN.md](./docs/data-loading/DATA_LOADING_PLAN.md) - Supabase 데이터 적재 단계별 실행 계획
- [docs/data-loading/DATA_LOADING_RUNBOOK.md](./docs/data-loading/DATA_LOADING_RUNBOOK.md) - Phase 1~7 상세 실행 가이드
- [docs/data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md](./docs/data-loading/DASHBOARD_DATA_INTEGRATION_PROGRESS.md) - Phase 2~6 실행·진행 SSOT
- [docs/data-loading/DATA_INTEGRATION_SUMMARY.md](./docs/data-loading/DATA_INTEGRATION_SUMMARY.md) - 데이터 연동 요약
- [docs/data-loading/ETL_GUIDE.md](./docs/data-loading/ETL_GUIDE.md) - ETL 스크립트 사용 가이드
- [docs/data-loading/DATA_LOADING_QA.md](./docs/data-loading/DATA_LOADING_QA.md) - 데이터 로딩 Q&A 종합

### Realtime 및 개발 가이드
- [docs/guides/REALTIME_IMPLEMENTATION.md](./docs/guides/REALTIME_IMPLEMENTATION.md) - Supabase Realtime KPI Dashboard 구현 가이드
- [docs/guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md](./docs/guides/DEVELOPMENT_PLAN_REALTIME_KPI_DASHBOARD.md) - Realtime KPI 개발 계획
- [docs/guides/REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md](./docs/guides/REPO_EXECUTION_GUIDE_HVDC_DATA_LOADING.md) - 실제 레포 구조 기반 실행 가이드

### 배포 및 패치
- [docs/deployment/DASH_PLAN.md](./docs/deployment/DASH_PLAN.md) - dash 패치 적용 계획 (맵 POI·StageCardsStrip·GlobalSearch)
- [docs/deployment/POI_MAP_PATCH_RUNBOOK.md](./docs/deployment/POI_MAP_PATCH_RUNBOOK.md) - POI 맵 패치 실행 가이드
- [dash/reakmapping.md](./dash/reakmapping.md) - 맵 POI 좌표·레이어 SSOT
- [dash/docs/APPLY_PATCH.md](./dash/docs/APPLY_PATCH.md) - dash 패치 통합 절차

### 기타
- [SETUP.md](./SETUP.md) - 로컬/CI 설정 가이드
- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력
- [AGENTS.md](./AGENTS.md) - 코딩 규칙 SSOT

---

## 🔧 기술 스택

- **Frontend**: Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3
- **상태 관리**: Zustand 5.0.9
- **스타일링**: Tailwind CSS 4
- **지도**: MapLibre GL 5.15.0, deck.gl 9.2.5
- **Backend**: Supabase (PostgreSQL + RLS + Realtime)
- **패키지 관리**: pnpm 9 (workspace)
- **빌드 도구**: Turbo

---

## 📝 라이선스

Private

---

**최종 업데이트**: 2026-02-07

**최근 주요 변경사항** (2026-02-05 ~ 2026-02-07):
- ✅ **docs 폴더 카테고리별 정리 완료**: 37개 문서를 8개 카테고리 폴더로 이동, 문서 인덱스 생성
- ✅ 히트맵 강도 범례 및 지오펜스 가중치 적용
- ✅ 줌 기반 레이어 가시성 및 히트맵 반경 스케일링
- ✅ RightPanel 탭 UI 개선 및 타이포그래피 최적화
- ✅ KPI 요약 스트립 고정 및 HVDC 워크리스트 간소화

**문서 구조**: 모든 문서는 [docs/README.md](./docs/README.md)에서 카테고리별로 정리되어 있습니다.
