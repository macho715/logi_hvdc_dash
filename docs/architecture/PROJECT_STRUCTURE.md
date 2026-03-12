# 프로젝트 구조 온보딩 가이드

> **HVDC + Logistics 통합 대시보드 프로젝트 구조**  
> **최종 업데이트**: 2026-02-07  
> **목적**: 새 팀원 온보딩을 위한 프로젝트 구조 빠른 이해 (≤ 2분 읽기)

---

## 📐 프로젝트 구조 개요

### 핵심 디렉토리 트리

```
LOGI MASTER DASH/
├── apps/
│   ├── logistics-dashboard/     # 물류 대시보드 (포트 3000)
│   └── hvdc-dashboard/          # HVDC 대시보드 (포트 3001)
├── packages/
│   ├── ui-components/           # 공용 UI (UnifiedLayout 등)
│   ├── shared/                 # 공유 타입/유틸리티
│   └── doc-intelligence/        # 문서 인텔리전스
├── scripts/                     # ETL/온톨로지 파이프라인
│   ├── core/                   # json_to_ttl.py 등 핵심 스크립트
│   └── pipelines/              # 실행 파이프라인
├── supabase/
│   ├── migrations/              # DB 스키마 마이그레이션
│   ├── scripts/                 # SQL 스크립트 (DDL)
│   ├── data/
│   │   ├── raw/                 # 입력 데이터 (JSON/CSV)
│   │   └── output/optionC/      # ETL 출력 (Option-C CSV)
│   ├── docs/                    # Supabase 관련 문서
│   └── ontology/                # TTL 온톨로지 파일
├── scripts/
│   ├── etl/                     # ETL 스크립트 (status_etl.py, optionc_etl.py)
│   └── hvdc/                    # 실행 파이프라인
├── docs/                        # 프로젝트 문서 (SSOT)
├── configs/                     # 컬럼 매핑 SSOT
└── hvdc_output/                 # ETL 출력 (CSV/TTL)
```

---

## 🎯 주요 영역별 설명

### `apps/` - 프론트엔드 애플리케이션

#### `apps/logistics-dashboard/` (포트 3001)
- **역할**: 통합 대시보드 메인 앱 (MapView + RightPanel + HVDC Panel)
- **핵심 컴포넌트**:
  - `components/UnifiedLayout.tsx` - 3패널 통합 레이아웃
  - `components/map/MapView.tsx` - 지도 뷰 (deck.gl + maplibre-gl)
  - `components/dashboard/RightPanel.tsx` - 우측 상태 패널 (탭 UI: Status/Occupancy/Distribution)
  - `components/hvdc/KpiStrip.tsx`, `WorklistTable.tsx`, `DetailDrawer.tsx` - HVDC 패널
- **최신 기능** (2026-02-05~07):
  - 히트맵 강도 범례 표시
  - 줌 기반 레이어 가시성 (히트맵/상태/POI 동적 전환)
  - RightPanel 탭 UI로 섹션 분리
  - 타이포그래피 개선 (text-sm 기준)
  - KPI 요약 스트립 헤더 고정
  - HVDC 워크리스트 간소화 (핵심 컬럼만 표시)
- **API**: `/api/worklist`, `/api/locations`, `/api/location-status`, `/api/events` - Supabase 데이터 조회
- **Realtime**: `hooks/useKpiRealtime.ts` - Supabase Realtime 기반 KPI 업데이트 (5개 테이블 활성화)
- **기술**: Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3, Zustand 5.0.9, Tailwind CSS 4

#### `apps/hvdc-dashboard/` (포트 3001)
- **역할**: Legacy HVDC 대시보드 (회귀/비교용)
- **상태**: 독립 운영 중, 통합 완료 후 단계적 통합 예정

---

### `packages/` - 공유 패키지

#### `packages/ui-components/`
- **역할**: 공용 UI 컴포넌트
- **핵심**: `src/UnifiedLayout.tsx` - 통합 레이아웃 컴포넌트
- **사용**: `apps/logistics-dashboard`에서 import

#### `packages/shared/`
- **역할**: 공유 타입 및 유틸리티
- **구조**:
  - `src/types/index.ts` - 공유 TypeScript 타입
  - `src/store/opsStore.ts` - Zustand 통합 스토어
- **사용**: 모든 앱에서 공유 타입/상태 관리

#### `packages/doc-intelligence/`
- **역할**: 문서 인텔리전스 유틸리티
- **기능**: 문서 동기화, diff 처리 등

---

### `scripts/` - ETL 및 데이터 파이프라인

#### `scripts/core/`
- **`json_to_ttl.py`**: HVDC JSON → RDF(Turtle) 변환 (보존 필수)
- **`flow_code_calc.py`**: Flow Code v3.5 계산 (0~5)
- **`column_audit.py`**: 컬럼 매핑 검증
- **입력**: `HVDC all status,JSON`, `hvdc_warehouse_status.json`
- **출력**: `hvdc_output/` (CSV/TTL/리포트)

#### `scripts/pipelines/`
- **`run_status_pipeline.py`**: 전체 파이프라인 실행 스크립트

---

### `supabase/` - 데이터베이스 스키마

#### `supabase/migrations/`
- **`20260101_initial_schema.sql`**: 통합 스키마 (Status/Case 레이어)
- **SSOT**: 모든 운영 데이터는 Supabase Postgres에 저장
- **RLS**: Row Level Security 정책 적용 (보안 필수)
- **Realtime**: Supabase Realtime으로 KPI/Worklist 자동 갱신

---

### `supabase/` - Supabase 관련 파일 통합

#### `supabase/scripts/`
- **SQL 스크립트**: `20260124_hvdc_layers_status_case_ops.sql` - Status/Case 레이어 DDL
- **역할**: 데이터베이스 스키마 생성 및 관리

#### `supabase/data/raw/`
- **입력 데이터**: `HVDC_all_status.json`, `hvdc_warehouse_status.json`, `hvdc_excel_reporter_final_sqm_rev_3.json`
- **역할**: ETL 스크립트의 입력 소스 데이터

#### `supabase/data/output/optionC/`
- **출력 데이터**: Option-C ETL 실행 시 생성되는 CSV 파일들
- **파일**: `locations.csv`, `shipments_case.csv`, `cases.csv`, `flows.csv`, `events_case.csv`

#### `supabase/docs/`
- **문서**: ETL 스크립트 사용 가이드, Supabase 설정 가이드
- **파일**: `README_dashboard_ready_FULL.md`, `RUNBOOK_HVDC_SUPABASE_SETUP.md` 등

#### `supabase/ontology/`
- **TTL 파일**: `hvdc_ops_ontology.ttl`, `hvdc_ops_shapes.ttl`
- **역할**: RDF 온톨로지 정의

### `scripts/etl/` - ETL 스크립트

#### Status SSOT 레이어
- **스크립트**: `status_etl.py` (이전: `scripts/etl/status_etl.py`)
- **목적**: `status.shipments_status`, `status.events_status` 생성
- **입력**: `supabase/data/raw/HVDC_all_status.json`, `hvdc_warehouse_status.json`
- **출력**: `hvdc_output/supabase/shipments_status.csv`, `events_status.csv`

#### Option-C Case 레이어
- **스크립트**: `optionc_etl.py` (이전: `scripts/etl/optionc_etl.py`)
- **목적**: `case.*` 테이블용 CSV 생성 (cases, flows, events_case)
- **입력**: `supabase/data/raw/hvdc_allshpt_status.json`, `hvdc_warehouse_status.json`, `HVDC_STATUS.json`
- **출력**: `supabase/data/output/optionC/*.csv`
- **특징**: Flow Code v3.5 계산 포함 (`flow_code_calculator.py`)

**상세 가이드**: [ETL_GUIDE.md](../data-loading/ETL_GUIDE.md), [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md)

---

### `docs/` - 프로젝트 문서 (SSOT)

#### 필수 읽기 문서
1. **[AGENTS.md](../AGENTS.md)** - 코딩 규칙 SSOT (레이아웃 불변, RLS, 접근성)
2. **[PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md)** - 한눈에 보는 개발 현황 (80% 완료, Phase 6 완료)
3. **[DASHBOARD_LAYOUT.md](../architecture/DASHBOARD_LAYOUT.md)** - 대시보드 레이아웃 사양 (3패널 구조)

#### 데이터 통합 문서
4. **[ETL_GUIDE.md](./ETL_GUIDE.md)** - ETL 스크립트 사용 가이드
5. **[DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md)** - 데이터 적재 단계별 실행 계획
6. **[architecture.md](../architecture/architecture.md)** - 시스템 아키텍처 (데이터 흐름, Realtime)

#### 통합 로드맵
7. **[INTEGRATION_ROADMAP.md](../integration/INTEGRATION_ROADMAP.md)** - 통합 로드맵 (Phase별 작업)
8. **[STATUS.md](../STATUS.md)** - 통합 상태 SSOT (현재 진행 상황)

---

### `configs/` - 설정 파일 (SSOT)

#### `configs/columns.hvdc_status.json`
- **역할**: 컬럼 매핑 SSOT (`json_to_ttl.py`에서 사용)
- **중요**: 매핑 변경 시 스크립트 + 문서 동시 업데이트 필수

#### `configs/namespaces.json`
- **역할**: RDF 네임스페이스 정의

---

## 🚀 빠른 시작 체크리스트

### 1. 환경 설정
```bash
# 의존성 설치
pnpm install

# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 개발 서버 실행
```bash
# 모든 앱 실행
pnpm dev

# 특정 앱만 실행
pnpm --filter logistics-dashboard dev  # 포트 3000
pnpm --filter hvdc-dashboard dev       # 포트 3001
```

### 3. ETL 실행 (데이터 적재)
- [ETL_GUIDE.md](./ETL_GUIDE.md) 참조
- [DATA_LOADING_PLAN.md](../data-loading/DATA_LOADING_PLAN.md) 참조

### 4. 레이아웃 확인
- `apps/logistics-dashboard/components/UnifiedLayout.tsx` 확인
- [DASHBOARD_LAYOUT.md](../architecture/DASHBOARD_LAYOUT.md) 참조

### 5. 문서 읽기 순서
1. [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) - 전체 현황 파악
2. [AGENTS.md](../AGENTS.md) - 코딩 규칙 이해
3. [DASHBOARD_LAYOUT.md](../architecture/DASHBOARD_LAYOUT.md) - 레이아웃 구조 이해
4. [architecture.md](../architecture/architecture.md) - 시스템 아키텍처 이해

---

## 🔑 핵심 원칙 (기억하기)

### 레이아웃 불변
- **MapView** (좌측) + **RightPanel** (우측) + **HVDC Panel** (하단)
- 이 구조는 변경 금지 (AGENTS.md 참조)

### Supabase SSOT
- 모든 운영 데이터는 **Supabase**에 저장
- RLS 정책 필수, 서비스 키 노출 금지

### RDF 파이프라인 보존
- `scripts/core/json_to_ttl.py` 유지 필수
- 온톨로지 변환 기능 보존

### 접근성
- WCAG 2.2 AA 준수
- ESC 키 닫기, 키보드 네비게이션 필수

---

## 📚 추가 참조

- [README.md](../README.md) - 프로젝트 메인 README
- [SETUP.md](../SETUP.md) - 로컬/CI 설정 가이드
- [INTEGRATION_ROADMAP.md](../integration/INTEGRATION_ROADMAP.md) - 통합 로드맵
- [NEXT_STEPS_PRIORITY.md](../integration/NEXT_STEPS_PRIORITY.md) - 우선순위 및 실행 계획

---

**최종 업데이트**: 2026-02-07 — Phase 2~6 완료 상태 반영, UI/UX 개선사항 반영 (히트맵, 줌 기반 레이어, RightPanel 탭 UI, 타이포그래피, KPI 스트립 고정, 워크리스트 간소화)
