# GitHub New Repo + Vercel 배포 구조 가이드

> **목적**: 새 GitHub 리포지토리에 올릴 파일 범위를 정확히 정의하고,
> Vercel 자동 배포까지의 전체 절차를 문서화한다.
>
> **로컬 프로젝트가 복잡한 이유**: ETL 스크립트, 분석 코드, 온톨로지 파일,
> Cursor IDE 설정 등 배포와 무관한 파일들이 혼재되어 있다.
> 새 리포에는 **Next.js 앱 실행에 필요한 파일만** 포함한다.

---

## 1. 새 리포지토리에 포함할 파일 트리

```
logi_hvdc_dash/                          ← GitHub 리포 루트
│
├── .gitignore                           ← 루트 gitignore
├── package.json                         ← 모노레포 루트 (pnpm workspace)
├── pnpm-workspace.yaml                  ← workspace 범위 정의
├── turbo.json                           ← Turborepo 태스크 정의
├── vercel.json                          ← Vercel 배포 설정
│
├── apps/
│   └── logistics-dashboard/             ← Next.js 16 앱 (배포 타깃)
│       ├── .gitignore
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── postcss.config.mjs
│       ├── components.json              ← shadcn/ui 설정
│       │
│       ├── app/                         ← Next.js App Router
│       │   ├── layout.tsx
│       │   ├── page.tsx                 ← root → /overview redirect
│       │   ├── globals.css
│       │   ├── api/
│       │   │   ├── cases/
│       │   │   │   ├── route.ts
│       │   │   │   └── summary/route.ts
│       │   │   ├── chain/
│       │   │   │   └── summary/route.ts  ← 공급망 요약 (origins, ports, stages, sites)
│       │   │   ├── stock/route.ts
│       │   │   ├── shipments/
│       │   │   │   ├── route.ts                 ← 선적 레코드 목록
│       │   │   │   ├── stages/
│       │   │   │   │   └── route.ts             ← 항차 단계별 집계 (NEW)
│       │   │   │   ├── vendors/
│       │   │   │   │   └── route.ts             ← 고유 벤더 목록 + 건수 (NEW)
│       │   │   │   └── origin-summary/
│       │   │   │       └── route.ts             ← 출발지 국가별 집계
│       │   │   ├── events/route.ts
│       │   │   ├── locations/route.ts
│       │   │   ├── location-status/route.ts
│       │   │   └── worklist/route.ts
│       │   └── (dashboard)/
│       │       ├── layout.tsx
│       │       ├── overview/page.tsx
│       │       ├── pipeline/page.tsx
│       │       ├── sites/page.tsx
│       │       ├── cargo/page.tsx
│       │       └── chain/page.tsx       ← 전체 물류 체인 시각화 (신규)
│       │
│       ├── components/
│       │   ├── theme-provider.tsx
│       │   ├── ui/                      ← shadcn 기본 컴포넌트
│       │   ├── layout/                  ← Sidebar, Header, KpiProvider
│       │   ├── overview/                ← KpiStripCards, OverviewMap, OverviewRightPanel
│       │   ├── pipeline/                ← FlowPipeline + 5 chart panels + 2 table components
│       │   ├── sites/                   ← SiteCards, SiteDetail, AgiAlertBanner, SiteTypeTag
│       │   ├── cargo/                   ← CargoTabs, CargoDrawer, 3 tables
│       │   ├── chain/                   ← FlowChain, OriginCountrySummary (신규)
│       │   └── map/                     ← deck.gl layers
│       │
│       ├── hooks/
│       │   ├── useBatchUpdates.ts
│       │   ├── useInitialDataLoad.ts
│       │   ├── useKpiRealtime.ts
│       │   ├── useKpiRealtimeWithFallback.ts
│       │   ├── useLiveFeed.ts
│       │   ├── useMultiTabSync.ts
│       │   └── useSupabaseRealtime.ts
│       │
│       ├── store/
│       │   ├── casesStore.ts
│       │   ├── stockStore.ts
│       │   └── logisticsStore.ts
│       │
│       ├── types/
│       │   ├── cases.ts
│       │   ├── chain.ts                 ← 공급망 타입 (신규)
│       │   └── logistics.ts
│       │
│       ├── lib/
│       │   ├── supabase.ts
│       │   ├── api.ts
│       │   ├── utils.ts
│       │   ├── time.ts
│       │   ├── worklist-utils.ts
│       │   ├── cases/                   ← cases 유틸리티 (신규)
│       │   ├── logistics/               ← logistics 유틸리티 (신규)
│       │   ├── data/ontology-locations.ts
│       │   ├── hvdc/buckets.ts
│       │   ├── map/
│       │   │   ├── hvdcPoiLocations.ts
│       │   │   ├── poiLocations.ts
│       │   │   ├── poiTypes.ts
│       │   │   └── flowLines.ts         ← 흐름 라인 레이어 (신규)
│       │   └── search/searchIndex.ts
│       │
│       ├── scripts/                     ← ETL 스크립트 (신규)
│       │   └── import-excel.mjs         ← Excel → Supabase ETL (Node.js)
│       │
│       ├── public/
│       │   ├── icon.svg
│       │   ├── icon-light-32x32.png
│       │   ├── icon-dark-32x32.png
│       │   ├── apple-icon.png
│       │   └── poi/
│       │       └── hvdc_poi_locations_v1.geojson
│       │
│       └── docs/                        ← 운영 문서
│           ├── DEPLOYMENT.md
│           ├── SUPABASE.md
│           ├── SYSTEM-ARCHITECTURE.md
│           ├── COMPONENTS.md
│           ├── LAYOUT.md
│           └── GITHUB-DEPLOY-STRUCTURE.md  ← 이 파일
│
├── packages/
│   └── shared/                          ← @repo/shared (앱 의존)
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── src/
│           ├── index.ts
│           ├── types/index.ts
│           ├── store/opsStore.ts
│           └── utils/buckets.ts
│
└── supabase/
    ├── migrations/                      ← DB 마이그레이션 (순서대로 실행)
    │   ├── 20260101_initial_schema.sql
    │   ├── 20260124_create_dashboard_views.sql
    │   ├── 20260124_enable_realtime.sql
    │   ├── 20260124_enable_realtime_layers.sql
    │   ├── 20260125_public_shipments_view.sql
    │   ├── 20260126_public_locations_seed_ontology.sql
    │   ├── 20260127_api_views.sql       ← ⭐ v_cases + v_flows + v_shipments_status + v_stock_onhand
    │   └── 20260313_add_shipment_columns.sql  ← ⭐ import-excel.mjs 전제조건
    └── scripts/
        ├── 20260124_hvdc_layers_status_case_ops.sql  ← ⭐ 핵심 스키마 (먼저 실행)
        └── hvdc_copy_templates.sql
```

---

## 2. 제외할 파일/폴더 (로컬에만 존재)

| 경로 | 제외 이유 |
|------|----------|
| `.cursor/` | IDE 전용 설정 (Cursor) |
| `.claude/` | IDE 전용 설정 (Claude Code) |
| `supabase/data/raw/` | JSON/CSV 원본 데이터 — .gitignore 권장 |
| `supabase/ontology/` | TTL 온톨로지 파일 — 배포 불필요 |
| `supabase/docs/` | 내부 Supabase 운영 문서 중복 |
| `packages/doc-intelligence/` | 앱이 import하지 않음 |
| `packages/ui-components/` | package.json 미완성, 앱이 import하지 않음 |
| `archive/`, `dash/`, `map/` | 레거시/작업 중 폴더 |
| `src/`, `tests/`, `tools/` | Python 코드 |
| `hvdc_output/` | ETL 출력 파일 |
| `*.md` (루트 잡파일들) | `page payout plan.md`, `패치내역.md` 등 작업 노트 |
| `typecheck-output.txt` | CI 임시 출력 |
| `apps/logistics-dashboard/recreate-tables.mjs` | 개발용 DB 초기화 스크립트 |
| `apps/logistics-dashboard/seed-data.mjs` | 개발용 시드 스크립트 |
| `apps/logistics-dashboard/test-insert.mjs` | 개발용 연결 테스트 |
| `.env.local` | Supabase 실제 키 (절대 업로드 금지) |
| `node_modules/`, `.next/` | 빌드 산출물 |

> ⚠️ **recreate-tables.mjs, seed-data.mjs는 제외 권장**
> 실제 키가 하드코딩되어 있었으며 GitHub secret scanning에 걸림.
> Supabase 초기화는 직접 SQL Editor에서 실행하거나 별도 관리.
>
> ✅ **scripts/import-excel.mjs는 포함 권장**
> 환경변수로 키를 주입받으며, 실제 운영 데이터 임포트에 필요합니다.

---

## 3. 루트 .gitignore (새 리포용)

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.*

# Build outputs
.next/
out/
dist/
build/
*.tsbuildinfo

# Environment variables — 절대 커밋 금지
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Debug logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Next.js auto-generated
next-env.d.ts

# OS
.DS_Store
Thumbs.db

# IDE
.cursor/
.claude/
.vscode/

# Test coverage
coverage/
*.lcov

# Raw data (Supabase)
supabase/data/raw/
hvdc_output/
```

---

## 4. Vercel 설정 파일 (vercel.json)

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter @repo/logistics-dashboard build",
  "outputDirectory": "apps/logistics-dashboard/.next"
}
```

**동작 원리**:
- `pnpm --filter @repo/logistics-dashboard build` → Turborepo가 `@repo/shared` 의존성도 자동 처리
- `outputDirectory` → Vercel이 `.next/` 를 찾는 경로 명시

---

## 5. 필수 환경 변수 (Vercel Dashboard에서 설정)

| 변수명 | 설명 | 환경 | 공개 여부 |
|--------|------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://rkfffveonaskewwzghex.supabase.co`) | All | 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 (RLS 정책 적용) | All | 공개 가능 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (RLS 우회) | All | **민감 (Sensitive 체크)** |

**Vercel 설정 위치**: Project → Settings → Environment Variables

> `NEXT_PUBLIC_*` 변수는 브라우저 번들에 포함됨 (클라이언트 노출 허용).
> `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용(API routes) — 절대 `NEXT_PUBLIC_` 접두사 사용 금지.
> `SUPABASE_SERVICE_ROLE_KEY`는 `scripts/import-excel.mjs` 실행 시에도 필요합니다.

---

## 6. 새 리포 생성 → Vercel 배포 절차

### Step 1: GitHub 새 리포 생성

```bash
# GitHub에서 새 리포 생성 후 (예: macho715/hvdc-dashboard-clean)
git clone https://github.com/<owner>/hvdc-dashboard-clean.git
cd hvdc-dashboard-clean
```

### Step 2: 필요한 파일만 복사

로컬 프로젝트에서 위 트리 구조에 있는 파일만 복사한다.
제외 목록의 파일은 포함하지 않는다.

```
복사 대상:
- vercel.json
- package.json
- pnpm-workspace.yaml
- turbo.json
- apps/logistics-dashboard/ (전체, .env.local 제외)
- packages/shared/ (전체)
- supabase/migrations/ (8개 파일)
- supabase/scripts/ (2개 파일)
```

### Step 3: .gitignore 배치

위 Section 3의 내용으로 루트에 `.gitignore` 생성.

### Step 4: .env.example 생성 (선택)

```bash
# apps/logistics-dashboard/.env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 5: 커밋 & 푸시

```bash
git add .
git commit -m "feat: initial HVDC logistics dashboard"
git push origin main
```

### Step 6: Vercel 프로젝트 연결

1. Vercel Dashboard → New Project
2. GitHub 리포 선택
3. **Root Directory**: 그대로 `/` (루트)
   → vercel.json이 알아서 `apps/logistics-dashboard`를 빌드
4. **Framework Preset**: Next.js (자동 감지됨)
5. **Environment Variables** 3개 입력

### Step 7: 배포 확인

```
빌드 로그 확인 포인트:
✅ pnpm install 성공
✅ @repo/shared 트랜스파일 성공
✅ next build 성공
✅ Route /overview, /pipeline, /sites, /cargo, /chain 생성
```

---

## 7. Supabase DB 설정 순서 (Vercel 배포 전 완료)

Supabase SQL Editor에서 아래 순서로 실행:

```
① supabase/scripts/20260124_hvdc_layers_status_case_ops.sql
   → case, status, wh, ops 스키마 + 핵심 테이블 생성

② supabase/migrations/20260101_initial_schema.sql
   → public 스키마 테이블 (locations, events, shipments 등)

③ supabase/migrations/20260124_create_dashboard_views.sql
   → public.v_shipments_master 뷰

④ supabase/migrations/20260124_enable_realtime.sql
   → Realtime Publication 설정

⑤ supabase/migrations/20260124_enable_realtime_layers.sql
   → 레이어 Realtime 추가

⑥ supabase/migrations/20260125_public_shipments_view.sql
   → public.shipments 뷰 (API /api/shipments용)

⑦ supabase/migrations/20260126_public_locations_seed_ontology.sql
   → public.locations 테이블 + 10개 위치 시드 데이터

⑧ supabase/migrations/20260127_api_views.sql    ← ⭐ API 뷰 (필수)
   → public.v_cases + public.v_flows + public.v_shipments_status + public.v_stock_onhand + public.shipments
   → API /api/cases, /api/cases/summary, /api/shipments, /api/stock 정상 작동 조건

⑨ supabase/migrations/20260313_add_shipment_columns.sql    ← ⭐ import-excel.mjs 전제조건
   → case.cases, case.flows 테이블에 Excel 임포트용 컬럼 추가
   → 이 파일 실행 전에는 import-excel.mjs 실행 불가
```

---

## 8. 배포 후 동작 검증 쿼리

Supabase SQL Editor에서 실행:

```sql
-- ① 핵심 뷰 존재 확인
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('v_cases', 'v_flows', 'v_shipments_status', 'v_stock_onhand',
                   'shipments', 'v_shipments_master');
-- 예상: 6행

-- ② 데이터 건수 확인
SELECT
  (SELECT COUNT(*) FROM public.v_cases)        AS cases,
  (SELECT COUNT(*) FROM public.v_stock_onhand) AS stock,
  (SELECT COUNT(*) FROM public.shipments)      AS shipments,
  (SELECT COUNT(*) FROM public.locations)      AS locations;
-- import-excel.mjs 실행 후: cases=10,694 / shipments=890
-- seed-data.mjs 실행 후: cases≈300 / stock≈150 / shipments≈300

-- ③ API 접근 권한 확인
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('v_cases', 'v_stock_onhand', 'shipments');
-- 예상: anon + authenticated 각각 SELECT 권한
```

---

## 9. 로컬 개발 환경 설정

```bash
# 1. 리포 클론
git clone https://github.com/<owner>/hvdc-dashboard-clean.git
cd hvdc-dashboard-clean

# 2. 의존성 설치 (pnpm 10.28.0+ 필요)
pnpm install

# 3. 환경변수 설정
cd apps/logistics-dashboard
cp .env.example .env.local
# → .env.local 편집: 실제 Supabase 키 입력

# 4. 개발 서버 실행
pnpm dev
# → http://localhost:3001

# 5. DB 초기화 (최초 1회, .env.local 설정 후)
# → Supabase SQL Editor에서 migration 파일 순서대로 실행 (Section 7 참조)

# 6. 데이터 임포트 (실제 운영 데이터)
node apps/logistics-dashboard/scripts/import-excel.mjs --dry-run  # 검증
node apps/logistics-dashboard/scripts/import-excel.mjs             # 실제 임포트
```

---

## 10. 의존성 트리 요약 (배포 영향)

```
Vercel 빌드
  └─ pnpm --filter @repo/logistics-dashboard build
       ├─ @repo/shared (packages/shared)     ← workspace 내부 패키지
       │   └─ zustand@5.x
       └─ apps/logistics-dashboard
           ├─ next@16.x (16.0.10)
           ├─ react@19.x
           ├─ @supabase/supabase-js@2.x
           ├─ deck.gl 스택 (9.x)            ← 번들 크기 주의 (~1.5MB)
           ├─ maplibre-gl@5.x
           ├─ recharts@2.x
           ├─ zustand@5.x
           └─ @radix-ui/* (Shadcn UI)
```

**번들 크기 주의**:
- deck.gl + maplibre-gl 조합이 큰 편 → Vercel Edge 함수 한도 초과 없음 (정적 배포)
- 동적 import 적용된 Map 컴포넌트 확인 권장

---

## 11. 컴포넌트 구조 상세 (현재 구현)

### 신규 추가 컴포넌트 (2026-03-13 기준)

```
components/
├── chain/                               ← 공급망 시각화 (신규)
│   ├── FlowChain.tsx                    ← 수평 공급망 시각화 (원산지 → 항구 → 거점 → 현장)
│   └── OriginCountrySummary.tsx         ← 원산지 국가별 케이스 집계
│
├── pipeline/
│   ├── FlowPipeline.tsx                 ← 기존
│   ├── PipelineFilterBar.tsx            ← 기존
│   ├── PipelineCasesTable.tsx           ← 파이프라인 케이스 테이블 (신규)
│   └── PipelineTableWrapper.tsx         ← casesStore 연동 wrapper (신규)
│
└── sites/
    ├── SiteCards.tsx                    ← 기존
    ├── SiteDetail.tsx                   ← 기존
    ├── AgiAlertBanner.tsx               ← 기존
    └── SiteTypeTag.tsx                  ← 육상/해상 사이트 배지 컴포넌트 (신규)
```

### 신규 API 라우트

```
app/api/
├── chain/
│   └── summary/route.ts                 ← 공급망 요약 (origins, ports, stages, sites) (신규)
└── shipments/
    └── route.ts                         ← 선적 레코드 목록 API (신규)
```

### 신규 페이지

```
app/(dashboard)/
└── chain/
    └── page.tsx                         ← 전체 물류 체인 시각화 페이지 (신규)
```

### 신규 타입

```
types/
└── chain.ts                             ← 공급망 관련 TypeScript 타입 정의 (신규)
```

---

## 12. 구현 상태 (2026-03-13 기준)

| 항목 | 상태 | 비고 |
|------|------|------|
| TypeScript 타입 체크 | ✅ 통과 | `pnpm typecheck` 오류 없음 |
| 실제 데이터 임포트 | ✅ 검증 완료 | cases 10,694 / flows 7,564 / shipments 890 (dry-run 확인) |
| React Hydration 경고 | ✅ 해결됨 | `suppressHydrationWarning` 적용 (Kapture 브라우저 확장 충돌) |
| KPI pagination 버그 | ✅ 해결됨 | `fetchAllCases()` loop (PostgREST db-max-rows=1000 workaround) |
| ESLint | ⚠️ 비차단 | workspace eslint binary 미설정 (빌드에 영향 없음) |
| /overview 페이지 | ✅ 완성 | KPI strip + deck.gl 지도 + 우측 패널 |
| /pipeline 페이지 | ✅ 완성 | FlowPipeline + 필터바 + 케이스 테이블 |
| /sites 페이지 | ✅ 완성 | SiteCards + SiteDetail + AgiAlertBanner |
| /cargo 페이지 | ✅ 완성 | CargoTabs + CargoDrawer + WH 테이블 |
| /chain 페이지 | ✅ 완성 | FlowChain + OriginCountrySummary |
| Supabase Realtime | ✅ 설정됨 | v_cases, v_stock_onhand publication |

---

## 13. 알려진 이슈 및 주의사항

| 이슈 | 설명 | 해결 방법 |
|------|------|----------|
| `ignoreBuildErrors: true` | TS 에러 무시됨 | `tsc --noEmit`은 별도 lint 단계에서 실행 |
| `images: { unoptimized: true }` | 이미지 최적화 비활성 | 필요시 제거하고 next/image 설정 |
| `@deck.gl/core: "latest"` | 버전 미고정 | 안정된 버전(^9.0.x)으로 고정 권장 |
| `SUPABASE_SERVICE_ROLE_KEY` 하드코딩 | .mjs 스크립트에 있었음 | 새 리포에는 해당 .mjs 미포함, 환경변수로 처리 |
| `packages/ui-components/` | package.json 없음 | 새 리포 제외 |
| React Hydration Mismatch | Kapture 확장이 DOM 속성 추가 | `suppressHydrationWarning` 적용 — ✅ 해결됨 |
| KPI 1,000 표시 | PostgREST db-max-rows 한계 | `fetchAllCases()` pagination loop — ✅ 해결됨 |
| ESLint workspace binary | `pnpm lint` 실패 | Non-blocking, `pnpm typecheck`로 대체 |

---

*문서 작성: 2026-03-13*
*버전: 1.2.0 — scripts/ 디렉토리, chain/ 페이지, 신규 API 라우트, 신규 컴포넌트, 구현 상태 업데이트*
*기준 프로젝트: LOGI-MASTER-DASH-claude-improve-dashboard-layout*
