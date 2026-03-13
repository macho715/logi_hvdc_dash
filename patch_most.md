Context
무엇이 이상한가: Overview 화면의 Right Panel(예외 보드·경로 요약·현장 준비도·최근 활동)이 전혀 보이지 않음.
DOM 측정값 (JavaScript 직접 확인):
요소실제 height기대값중간 섹션 (flex min-h-0 flex-1)0px ← 버그~400px맵 컨테이너 (min-h-[360px] flex-1)360px (overflow 표시)360pxRight Panel aside32px (padding만)~400pxBottom Panel section609px~240px
Root Cause: OverviewBottomPanel(609px) + KPI strip(138px) = 747px > viewport(739px).
Flexbox flex-1이 남은 공간을 받아야 하나, 이미 총합이 viewport를 초과해 free space = 0 → 중간 섹션 height = 0px.
LAYOUT.md 설계 의도 (docs/LAYOUT.md §4):

맵 높이: h-[calc(100vh-280px)] 또는 flex-1로 viewport 채움
Right Panel: overflow-y-auto (4개 섹션 스크롤)
Bottom Panel: ~80px 내외의 컴팩트한 파이프라인 요약

Worklist가 609px가 된 이유:
Worklist 5개 항목 × 90px/항목 = ~450px + 헤더·패딩 = 609px (grid row = pipeline 140px vs worklist 547px의 max → 547px 사용)
수정 대상
파일변경 내용위치components/overview/OverviewBottomPanel.tsxworklist items div에 max-h-[160px] overflow-y-auto 추가line 88
수정 전:
tsx<div className="space-y-2">
수정 후:
tsx<div className="max-h-[160px] overflow-y-auto space-y-2">
```

## 높이 재계산 (수정 후)
```
Worklist items:    max-h 160px
Worklist section:  36px(header) + 12px(margin) + 160px = 208px
Grid row:          max(pipeline ~140px, worklist 208px) = 208px
Bottom Panel:      32px(p-4) + 208px = 240px
---
Total:             KPI(138) + Middle(flex-1) + Bottom(240) = 378px
Free space:        739 - 378 = 361px → 모두 Middle로
Middle section:    361px > 360px(map min-h) ✓
Right Panel:       361px - 32px(padding) = 329px content → 4개 섹션 overflow-auto로 스크롤 ✓
```

## 검증

수정 후 브라우저에서 확인:
1. Right Panel 4개 섹션 (예외 보드, 운송 경로 요약, 현장 준비도, 최근 활동) 모두 표시
2. Map 높이 ≥ 360px 유지
3. Bottom Panel worklist 스크롤바 표시 (5개 항목 스크롤 가능)
4. 파이프라인 5개 버튼 그대로 표시

## 대상 파일
```
apps/logistics-dashboard/components/overview/OverviewBottomPanel.tsx

HVDC 대시보드 — Cockpit Rework 코드 리뷰 플랜 (2026-03-13 v7)
Context
무엇을 구현했는가: Overview BFF + SSOT config + URL 복원 타겟 페이지 전반 재작성

overview API, overview page client, navigation contracts, route taxonomy SSOT, destination SSOT
Overview: map-first cockpit (KPI rail, right exception panel, bottom HVDC panel)
Flow Code → 평문 route label로 대체 (FlowCodeDonut, PipelineCasesTable, SiteDetail, WhStatusTable, ShipmentsTable, CargoDrawer, FlowChain)
URL 복원 context banner: pipeline, sites, cargo, chain 페이지
타입체크 통과, 브라우저에서 동작 확인

변경 규모: 40 files, +3380 -1211 (uncommitted)
HEAD: b994284 feat: full dashboard project upload
실행 계획
superpowers:code-reviewer 서브에이전트 1개 dispatch:

대상: git diff HEAD (working tree 전체)
핵심 검토 영역:

lib/navigation/contracts.ts — URL 계약 타입 정확성
lib/overview/routeTypes.ts — SSOT 정의 완결성
app/api/overview/route.ts — BFF 응답 구조
components/overview/OverviewPageClient.tsx — 상태 관리·사이드이펙트
configs/overview.*.json — SSOT config 내용
TypeScript 타입 안전성 (types/cases.ts, types/overview.ts)
페이지 URL 복원 로직 (pipeline/sites/cargo/chain page.tsx)



검증
리뷰어가 직접 실행:
bashcd C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ
git diff HEAD --stat
git diff HEAD -- apps/logistics-dashboard/lib/navigation/contracts.ts
# 주요 파일 read + diff
```

---

---
# [이전 플랜] docs/ 문서 업데이트 플랜 (2026-03-13 v6)

## Context

이전 세션에서 VENDOR 필터 구현 완료:
- **신규**: `app/api/shipments/vendors/route.ts` — `{vendors:[{vendor,count}]}` 반환
- **수정**: `components/cargo/ShipmentsTable.tsx` — 벤더 pill 필터 행 추가 (42개, 가로 스크롤)

**목표**: 이 변경사항을 `docs/` 문서에 반영 (v1.1.0 → v1.2.0)

---

## 수정 대상 3개 파일

### 파일 1: `docs/COMPONENTS.md` — §5.2 ShipmentsTable 재작성

**현재 상태**: 구식 mermaid(Toolbar/Header/Body/Footer), 6컬럼만 기재
**변경 내용**:

mermaid 다이어그램 — 4개 필터 행 + 9컬럼 구조 반영:
```
FilterRow1: 항차단계 (전체|출항전|항해중|통관중|내륙/창고|납품완료)
FilterRow2: 노미현장 (전체|SHU|MIR|DAS|AGI)
FilterRow3: 벤더    (전체 + 42개 pill, overflow-x-auto)  ← NEW
FilterRow4: 통관상태 (통관완료|진행중|대기)
```

9컬럼 테이블:
```
SCT SHIP NO / 벤더 / POL→POD / ETD / ATA / 항차단계 / FC / 노미현장 / 통관
State 추가 문서화:
typescriptvendors: { vendor: string; count: number }[]
// mount 시 /api/shipments/vendors 에서 fetch
```

Data Sources 업데이트:
```
/api/shipments         — paginated list (기존)
/api/shipments/vendors — vendor list + counts (NEW)
```

---

### 파일 2: `docs/SYSTEM-ARCHITECTURE.md` — §5 API Routes 업데이트

**현재 상태**: R10(`/api/shipments/origin-summary`)까지만 기재, vendors/stages 없음
**변경 내용**:

Routes mermaid에 추가:
```
R11["/api/shipments/vendors\nGET · 고유 벤더 목록 + 건수"]
R12["/api/shipments/stages\nGET · 항차 단계별 집계"]
```

Response Schemas classDiagram에 추가:
```
class VendorsResponse {
  +vendors: Array~vendor: string, count: number~
}
class ShipmentStagesResponse {
  +pre_departure: number
  +in_transit: number
  +port_customs: number
  +delivered: number
  +total: number
  +nominated_shu/das/mir/agi: number
  +agi_das_no_mosb_alert: number
}
```

페이지네이션 전략 테이블 행 추가:
```
/api/shipments/vendors | 전체 로드(loop) | 벤더 distinct + 건수 집계
/api/shipments/stages  | 전체 로드(loop) | 항차 단계 집계 전체 rows
```

---

### 파일 3: `docs/GITHUB-DEPLOY-STRUCTURE.md` — api/shipments/ 트리 업데이트

**현재 상태**: `shipments/route.ts` 1개만 기재
**변경 내용**:
```
├── shipments/
│   ├── route.ts               ← 선적 레코드 목록
│   ├── stages/route.ts        ← 항차 단계별 집계  (NEW)
│   ├── vendors/route.ts       ← 고유 벤더 목록 + 건수  (NEW)
│   └── origin-summary/route.ts ← 출발지 국가별 집계
```

---

## 무변경 문서 (3개)

| 문서 | 이유 |
|------|------|
| `SUPABASE.md` | DB 스키마 변경 없음; vendor 컬럼 이미 문서화됨 |
| `DEPLOYMENT.md` | 배포 절차 변경 없음 |
| `LAYOUT.md` | 레이아웃 계층 변경 없음 |

---

## 버전 범프 (3개 문서 공통)
```
> **Version:** 1.1.0 → 1.2.0 | **Last Updated:** 2026-03-13
```

---

## 병렬 실행 계획

3개 파일이 서로 독립적이므로 **동시에 3개 Agent 병렬 실행**:
```
┌────────────────────────────────────┐
│  Agent A: COMPONENTS.md            │
│  → §5.2 ShipmentsTable 재작성     │
│  → 4필터행 mermaid, 9컬럼, state  │
│  → v1.2.0 버전 범프               │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│  Agent B: SYSTEM-ARCHITECTURE.md  │
│  → R11/R12 Routes mermaid 추가     │
│  → VendorsResponse, StagesResponse │
│  → 페이지네이션 테이블 행 추가     │
│  → v1.2.0 버전 범프               │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│  Agent C: GITHUB-DEPLOY-STRUCTURE  │
│  → api/shipments/ 트리 확장        │
│  → stages/, vendors/ 서브디렉토리  │
│  → v1.2.0 버전 범프               │
└────────────────────────────────────┘
실행 방법: 단일 메시지에 3개 Agent tool call 동시 발행

검증
bash# 각 문서에 새 내용 반영 확인
grep -n "vendors\|1.2.0" docs/COMPONENTS.md
grep -n "vendors\|1.2.0" docs/SYSTEM-ARCHITECTURE.md
grep -n "vendors\|1.2.0" docs/GITHUB-DEPLOY-STRUCTURE.md


[이전 플랜] SHIPMENTS 벤더 필터 추가 플랜 (2026-03-13 v5)
Context
요청: "엑셀 hvdc all status시트 다시 확인하라. 전체 항차가 포함되어야 한다. VENDOR"
분석 결과:

Excel hvdc all status 시트: 893행, 42개 고유 VENDOR (Hitachi 570건, Siemens 66건 등)
SCT SHIP NO. null값: 0개 (100% 완전)
3개 중복 SCT SHIP NO → deduplication → DB: 890건 (정상)
문제: ShipmentsTable에 벤더 필터 UI가 없음 (vendor 상태는 선언됐으나 UI 버튼 미구현)
API /api/shipments는 이미 ?vendor= 파라미터 지원함

목표: SHIPMENTS 탭에 벤더 필터 UI 추가 (42개 벤더 동적 로드)

수정 파일
파일 1: app/api/shipments/vendors/route.ts (신규)
public.shipments 뷰에서 고유 벤더 목록 반환:
typescript// GET /api/shipments/vendors
// → { vendors: ['Hitachi', 'Siemens', 'LS Cable', ...] } (건수 기준 내림차순)
export async function GET() {
  const { data } = await supabase
    .from('shipments')
    .select('vendor')
  // 클라이언트 측 distinct + 건수 정렬
  const countMap: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.vendor) countMap[row.vendor] = (countMap[row.vendor] ?? 0) + 1
  }
  const vendors = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .map(([vendor, count]) => ({ vendor, count }))
  return NextResponse.json({ vendors })
}
파일 2: components/cargo/ShipmentsTable.tsx (수정)
현재 filter.vendor 상태는 있지만 UI가 없음. 다음을 추가:
1. 벤더 목록 fetch (useEffect):
typescriptconst [vendors, setVendors] = useState<string[]>([])
useEffect(() => {
  fetch('/api/shipments/vendors')
    .then(r => r.json())
    .then(j => setVendors(j.vendors?.map((v: {vendor: string}) => v.vendor) ?? []))
}, [])
2. 벤더 필터 행 추가 (항차단계 필터 바로 위):

전체 + 각 벤더명 FilterPill 버튼
선택 시 setFilter(f => ({ ...f, vendor: f.vendor === v ? 'all' : v })) 호출
벤더가 많으므로 가로 스크롤 overflow-x-auto 적용
건수 표시: Hitachi (570) 형태

3. 벤더 필터 page reset 포함 (이미 filter 의존성에 포함됨)

데이터 수치 확인 (변경 없음)
항목ExcelDB상태hvdc all status 행 수893890✅ 중복 3건 제거 정상SCT SHIP NO null0-✅ 완전VENDOR 종류42개42개✅ 원본 그대로 저장

검증
bash# 1. vendors API 확인
curl http://localhost:3001/api/shipments/vendors
# → { vendors: [{ vendor: 'Hitachi', count: 570 }, { vendor: 'Siemens', count: 66 }, ...] }

# 2. vendor 필터 동작
curl "http://localhost:3001/api/shipments?vendor=Hitachi&pageSize=5"
# → { total: 570, data: [...] }

# 3. UI: /cargo?tab=shipments
# → 벤더 필터 행 표시 (전체 | Hitachi(570) | Siemens(66) | ...)
# → 클릭 시 해당 벤더 항차만 표시
```

---

## 이전 구현 상태 (참고)
✅ 완료: 5개 페이지, 890 shipments, 항차단계/노미현장 필터, 동적 카운트, /chain 물류체인


**소스 디렉토리**:
`C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ\apps\logistics-dashboard`

**Excel 파일**:
`C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ\Logi ontol core doc\HVDC STATUS1.xlsx`

---

## 도메인 핵심 정리

### 컬럼 의미
| Excel 컬럼 | 의미 |
|-----------|------|
| `SITE` (wh status) | **선적서류 기준 최종 목적지** (현재 위치 아님) |
| `Status_Location` | **현재 물리적 위치** |
| `Final_Location` | **실제 최종 도착지** (`hvdc:hasFinalLocation`) |
| `EQ No` | HVDC 장비 코드 (`hvdc:hasHVDCCode`) |
| `DOC_SHU/DAS/MIR/AGI` (K,L,M,N열) | 해당 사이트 선적서류 완료 여부 ('O') |
| `FINAL DELIVERY` (hvdc all status) | 실제 현장 최종 배송 완료일 |

### 추적 가능성
- **Hitachi/Siemens**: 개별 CASE 단위 추적 가능
- **SCT/기타**: 추적 제한적 (`hvdc_code` null 다수)
- 한 SCT SHIP NO. 내 개별 CASE가 **서로 다른 현장**으로 배송 가능 (multi-site)

### Flow Code v3.5
| Flow | 경로 | MOSB | 주요 목적지 |
|------|------|------|------------|
| 0 | Pre Arrival | N/A | N/A |
| 1 | Port→Site | ❌ | SHU/MIR (육상) |
| 2 | Port→WH→Site | ❌ | SHU/MIR (육상) |
| 3 | Port→MOSB→Site | ✅ 필수 | DAS/AGI (해상) |
| 4 | Port→WH→MOSB→Site | ✅ 필수 | DAS/AGI (해상) |
| 5 | Mixed | 검토 | 검토 |

**AGI/DAS**: Flow ≥ 3 필수 (MOSB 없으면 자동 업그레이드)

---

## ⚠️ 이전 Task 1+2 구현 오류 (즉시 수정 필요)

| 잘못된 구현 | 올바른 구현 |
|------------|------------|
| `wh_storage_type` 필드 추가 | `storage_type` 사용 (이미 DB에 있음) |
| `.select(..., wh_storage_type)` | `.select(..., storage_type)` |
| `wh_storage_type === 'Indoor'` | `normalizeStorageType(row.storage_type)` |

---

## 4페이지 구조 (원본 스펙 기준)
```
🗺️ /overview  — UAE 전체 물류 노드 지리적 시각화
🔄 /pipeline  — 단계별 화물 현황 (Flow 0→5)
🏗️ /sites     — 4개 사이트 납품 달성률
📋 /cargo     — 전체 화물 드릴다운 테이블 (3탭)
🔗 /chain     — 전체 물류 체인 시각화 (신규)
공통 상단 KPI: 총 화물 | 현장 도착 % | 창고 재고 % | SQM

[A] Excel → Supabase 데이터 임포트
A-1. Sheet "wh status" (10,694행) → case.cases
Excel 컬럼DB 컬럼변환 규칙Case No.case_nonull이면 CASE-{no.} 생성SCT SHIP NO.sct_ship_noEQ Nohvdc_codeHVDC 장비 ID. null 허용Sitesite목적지. SHU/MIR/DAS/AGI만; 기타→nullFLOW_CODEflow_codeINTEGERFLOW_DESCRIPTIONflow_descriptionStatus_Currentstatus_currentsite/warehouse/Pre ArrivalStatus_Locationstatus_location현재 물리적 위치Final_Locationfinal_location실제 최종 도착지SQMsqmNUMERICCBMcbmNUMERICSource_Vendorsource_vendorHITACHI→Hitachi, SIEMENS→SiemensStoragestorage_typenormalizeStorage() 적용Stack_Statusstack_statusStatus_Location_Datesite_arrival_dateDATE
Storage 정규화:
pythondef normalize_storage(val):
    if pd.isna(val): return None
    v = str(val).strip().lower()
    if v == 'indoor':                      return 'Indoor'
    if v in ('outdoor', 'outtdoor'):       return 'Outdoor'
    if v.startswith('outdoor cov') or v == 'outdoor covered' or v == 'open yard':
        return 'Outdoor Cov'
    return None
Site 정규화: VALID = {SHU, MIR, DAS, AGI}; 그 외 null
A-2. Sheet "hvdc all status" (893행) → status.shipments_status
Excel 컬럼DB 컬럼변환SCT SHIP NO.hvdc_codeMR#status_noVENDORvendorPOLpol원산지 항구 코드PODpodVESSEL NAME/ FLIGHT No.vesselB/L No./ AWB No.bl_awbSHIP MODEship_modeETDetdDATEATDatdDATEETAetaDATEATAataDATEINCOTERMSincotermsFINAL DELIVERYfinal_delivery_dateDATE — 최종 현장 배송 완료일ATA - ETA (계산)transit_daysINTEGER — 해상 운송 기간 (일)Customs Close - Attestation Date (계산)customs_daysINTEGER — 통관 기간 (일)FINAL DELIVERY - Customs Close (계산)inland_daysINTEGER — 내륙 운송 기간 (일). ≥30일이면 창고 경유 가능성DOC_SHU (K열)doc_shu'O'→true, null→falseDOC_DAS (L열)doc_das'O'→true, null→falseDOC_MIR (M열)doc_mir'O'→true, null→falseDOC_AGI (N열)doc_agi'O'→true, null→false

DB 스키마 확인: status.shipments_status에 final_delivery_date, transit_days, customs_days, inland_days, doc_shu/das/mir/agi 컬럼 없으면 ALTER TABLE 먼저 실행.


inland_days ≥ 30: 내륙 운송 중 창고 경유 가능성 표시. 대시보드에서 창고 경유 의심 플래그로 활용.

기간 계산 로직 (import 스크립트에서):
javascriptconst daysDiff = (d1, d2) => {
  if (!d1 || !d2) return null
  return Math.round((new Date(d1) - new Date(d2)) / 86400000)
}
// transit_days  = ATA(57) - ETA(56)
// customs_days  = 'Customs Close'(61) - 'Attestation Date'(58)
// inland_days   = 'FINAL DELIVERY'(80) - 'Customs Close'(61)
// ⚠️ 'FINAL DELIVERY' = object 타입 → pd.to_datetime() 변환 필요
추가 확인된 컬럼 (hvdc all status 인덱스 65~79):
위치별 도착 날짜 컬럼들 (SHU=65, MIR=66, DAS=67, AGI=68, DSV Indoor=69, DSV Outdoor=70, DSV MZD=71, DSV Kizad=72, JDN MZD=73, JDN Waterfront=74, MOSB=75, AAA=76, ZENER=77, Hauler DG=78, Vijay Tanks=79).
→ 각 노드 도착일 데이터로 물류 타임라인 구성 가능. 현재 임포트 스코프에서는 제외 (후순위).
A-3. "wh status" → case.flows (case 단위)
python# case 단위 (shipment 단위 아님 — multi-site 배송 지원)
flows_df = df[['Case No.', 'SCT SHIP NO.', 'FLOW_CODE', 'FLOW_DESCRIPTION']].copy()
flows_df = flows_df.rename(columns={
    'Case No.': 'case_no', 'SCT SHIP NO.': 'sct_ship_no',
    'FLOW_CODE': 'flow_code', 'FLOW_DESCRIPTION': 'flow_description'
}).drop_duplicates(subset=['case_no'])
A-4. ETL 스크립트
파일: apps/logistics-dashboard/scripts/import-excel.mjs
javascript// Node.js + xlsx + @supabase/supabase-js
// 1. Excel 두 시트 읽기
// 2. ALTER TABLE 확인 (doc_shu/das/mir/agi, final_delivery_date)
// 3. wh_status → case.cases (TRUNCATE → batch INSERT, BATCH=200)
// 4. hvdc_all_status → status.shipments_status
// 5. flows → case.flows
// 6. 결과 로그

[B] 대시보드 코드 Gap 수정
B-1. 신규 helpers
lib/cases/pipelineStage.ts
typescriptexport type PipelineStage = 'pre-arrival' | 'port' | 'warehouse' | 'mosb' | 'site'

const SITE_LOCS  = new Set(['SHU','MIR','DAS','AGI'])
const MOSB_LOCS  = new Set(['MOSB','ADNOC L&S Yard'])
const WH_LOCS    = new Set(['DSV Indoor','DSV Outdoor','DSV Al Markaz','JDN MZD','AAA Storage','Hauler DG','ZENER','Hauler Indoor','DSV MZP'])
const PORT_LOCS  = new Set(['Khalifa Port','Mina Zayed','Jebel Ali','AUH Airport'])

export function classifyStage(status_current, status_location): PipelineStage { ... }
export { SITE_LOCS, MOSB_LOCS, WH_LOCS, PORT_LOCS }
lib/cases/storageType.ts
typescriptexport type StorageBucket = 'Indoor' | 'Outdoor' | 'Outdoor Cov'
export function normalizeStorageType(raw): StorageBucket | null { ... }
B-2. types/cases.ts 수정

wh_storage_type 제거 (storage_type: string | null 유지)

B-3. app/api/cases/summary/route.ts 수정

.select(... storage_type) (wh_storage_type 제거)
normalizeStorageType() 사용
classifyStage() helper 사용

B-4. app/api/cases/route.ts 수정

stage 파라미터 추가 (pre-arrival/port/warehouse/mosb/site)
id 파라미터 추가 (단건 조회)

B-5. FlowPipeline.tsx 수정 — 5단계
스펙 기준 단계 및 건수:
typescriptconst STAGES = [
  { key: 'pre-arrival', label: 'Pre-Arrival', sublabel: '선적 전/해상 운송 중', color: 'gray' },
  { key: 'port',        label: 'Port / 통관', sublabel: 'Khalifa·MZD·JAFZ·AUH', color: 'blue' },
  { key: 'warehouse',   label: '창고',         sublabel: 'DSV·JDN·AAA·ZENER', color: 'yellow' },
  { key: 'mosb',        label: 'MOSB',        sublabel: 'DAS·AGI 경유 필수', color: 'orange' },
  { key: 'site',        label: '현장 도착',    sublabel: 'SHU·MIR(육상) / DAS·AGI(해상)', color: 'green' },
]
B-6. PipelineCasesTable.tsx 신규 (독립 fetch)

casesStore 의존성 없음 → /api/cases?stage=... 직접 호출
8컬럼: # / Case No / Site / 현재위치 / FC / SQM / Status / 벤더
행 클릭 → router.push('/cargo?tab=wh&caseId=...')

B-7. PipelineTableWrapper.tsx 신규
typescript'use client'
import { useCasesStore } from '@/store/casesStore'
import { PipelineCasesTable } from './PipelineCasesTable'
export function PipelineTableWrapper() {
  const stage = useCasesStore(s => s.activePipelineStage)
  return <PipelineCasesTable stage={stage} />
}
B-8. pipeline/page.tsx 수정
<PipelineTableWrapper /> 추가
B-9. lib/map/flowLines.ts 신규
POI ID 기반 ArcLayer 스펙:
typescript// Flow Code별 색상: 1=파랑, 2=초록, 3=주황, 4=빨강, 5=회색
export const FLOW_ARC_SPECS: FlowArcSpec[] = [
  { id:'p-wh',    sourcePoiId:'khalifa-port', targetPoiId:'dsv-indoor', flowCode:2 },
  { id:'wh-mosb', sourcePoiId:'dsv-indoor',   targetPoiId:'mosb',       flowCode:3 },
  { id:'mosb-das',sourcePoiId:'mosb',          targetPoiId:'das',        flowCode:4 },
  { id:'mosb-agi',sourcePoiId:'mosb',          targetPoiId:'agi',        flowCode:4 },
  { id:'p-shu',   sourcePoiId:'khalifa-port',  targetPoiId:'shu',        flowCode:1 },
  { id:'p-mir',   sourcePoiId:'khalifa-port',  targetPoiId:'mir',        flowCode:1 },
]
```

### B-10. `OverviewMap.tsx` 수정
- ArcLayer 추가 (FLOW_ARC_SPECS)
- 노드 색상: 🔵항구 / 🟡창고 / 🟠MOSB / 🟢현장

### B-11. `SiteDetail.tsx` 수정
- 보관유형 3버킷 (Indoor/Outdoor/Outdoor Cov) 표시
- `SiteTypeTag` 연동 (육상/해상 배지)

### B-12. `AgiAlertBanner.tsx` 수정
스펙: `⚠️ AGI 미납 N건 — MOSB 경유 필수 (Flow Code ≥ 3) | MOSB 대기 N건 | 창고 대기 N건 | Pre-Arrival N건`

### B-13. `OverviewRightPanel.tsx` 수정
우측 패널에 WH 재고 행 추가 (스펙: `WH █████ 1,999`)

### B-14. Cargo page URL 복원
- `cargo/page.tsx`: `?tab=wh&caseId=...` 파라미터 읽기
- `CargoDrawer.tsx`: caseId fallback → `/api/cases?id=...` 단건 조회

---

## [C] /cargo 페이지 3탭 확장 (원본 스펙)

스펙 기준 3탭:
1. **WH STATUS** (8,680건) — 현재 구현된 케이스 테이블
2. **SHIPMENTS** (874건 BL) — hvdc all status 데이터
3. **DSV STOCK** (791건) — 별도 재고 데이터 (후순위)

**SHIPMENTS 탭 컬럼**: SCT SHIP NO / 벤더·카테고리 / POL→POD / ETD·ATD / ETA·ATA / CIF VALUE / 통관 / 컨테이너

**상세 드로어** (행 클릭):
```
Case No. / Site / Vendor / Flow Code / Storage / SQM
물류 타임라인: ETD → ETA → ATA
치수: L×W×H cm / G.W / HS Code
```

---

## [D] /chain 신규 페이지 (전체 물류 체인)

### D-1. `app/(dashboard)/chain/page.tsx` 신규

### D-2. `FlowChain.tsx` 신규
전체 물류 체인 수평 시각화:
```
[🌏 원산지]  →  [⚓ 항구]          →  [🏭 창고]    →  [⛴ MOSB]  →  [현장]
KR·FR·IT       Khalifa·MZD·JAFZ·AUH    DSV·JDN·AAA     ADNOC L&S    SHU·MIR·DAS·AGI
  N건              N건                    N건             N건(DAS/AGI)   N건
```
- 각 노드 클릭 → 해당 단계 케이스 목록
- DAS/AGI 경로 강조 (MOSB 필수)
- SHU/MIR (육상) vs DAS/AGI (해상) 시각적 구분

### D-3. `OriginCountrySummary.tsx` 신규
POL 기반 원산지 국가별 집계 바 차트:
```
KR (한국)  ████████████  N건
FR (프랑스) ████████      N건
IT (이탈리아) ██████      N건
...
API: /api/chain/summary → origins[], ports[], stages{}, sites{land, island}, mosbTransit
D-4. SiteTypeTag.tsx 신규
typescript// SHU/MIR → 🏗 육상 (green badge)
// DAS/AGI → 🏝 해상 (blue badge, "MOSB 경유")
```

### D-5. 사이드바 "물류 체인" 메뉴 추가

---

## 병렬 작업 계획 (Parallel Execution)

### Wave 1 — 기반 작업 (병렬 3개)
```
┌─────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────┐
│  Agent A: Excel Import      │  │  Agent B: Helpers + Types     │  │  Agent C: API Routes         │
│  ─────────────────────────  │  │  ──────────────────────────   │  │  ──────────────────────────  │
│  scripts/import-excel.mjs   │  │  lib/cases/pipelineStage.ts  │  │  api/cases/route.ts          │
│  → case.cases (10,694)      │  │  lib/cases/storageType.ts    │  │  api/cases/summary/route.ts  │
│  → shipments_status (893)   │  │  types/cases.ts (수정)       │  │  api/chain/summary/route.ts  │
│  → case.flows (case 단위)   │  │  lib/logistics/normalizers   │  │  api/shipments/route.ts      │
│  기간 계산 (transit/customs/│  │  lib/map/flowLines.ts        │  │                              │
│  inland_days)               │  │  lib/map/poiLocations.ts     │  │                              │
└─────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────┘
```

### Wave 2 — UI 컴포넌트 (Agent A 완료 후 병렬 2개)
```
┌────────────────────────────────────────┐  ┌────────────────────────────────────────┐
│  Agent D: Pipeline + Overview          │  │  Agent E: Sites + Chain + Cargo        │
│  ────────────────────────────────────  │  │  ────────────────────────────────────  │
│  FlowPipeline.tsx (5단계)              │  │  SiteDetail.tsx (보관유형)              │
│  PipelineCasesTable.tsx (독립 fetch)   │  │  SiteTypeTag.tsx (육상/해상)            │
│  PipelineTableWrapper.tsx              │  │  AgiAlertBanner.tsx (수치 확장)         │
│  pipeline/page.tsx                     │  │  FlowChain.tsx (/chain 시각화)          │
│  OverviewMap.tsx (ArcLayer)            │  │  OriginCountrySummary.tsx              │
│  OverviewRightPanel.tsx (WH 행)        │  │  chain/page.tsx (신규)                 │
│                                        │  │  cargo/page.tsx (URL + 3탭)            │
│                                        │  │  CargoDrawer.tsx (fallback)            │
│                                        │  │  Sidebar.tsx (/chain 메뉴)             │
└────────────────────────────────────────┘  └────────────────────────────────────────┘
```

### Wave 3 — 통합 검증 (Wave 2 완료 후)
```
Agent F: TypeScript + 통합 테스트
  → pnpm typecheck
  → 개발 서버 기동 확인
  → 각 페이지 기능 동작 확인
```

---

## 작업 순서 (병렬 실행 기준)

### Wave 1 동시 실행
**Agent A** (Excel Import):
1. DB ALTER TABLE (신규 컬럼)
2. `scripts/import-excel.mjs` 작성 및 실행
3. 검증: `SELECT COUNT(*) FROM "case".cases`

**Agent B** (Helpers + Types):
1. `lib/cases/pipelineStage.ts` 신규
2. `lib/cases/storageType.ts` 신규
3. `types/cases.ts` 수정 (wh_storage_type 제거)
4. `lib/map/flowLines.ts` 신규

**Agent C** (API Routes):
1. `app/api/cases/summary/route.ts` 수정 (storage_type)
2. `app/api/cases/route.ts` 수정 (stage/id 파라미터)
3. `app/api/chain/summary/route.ts` 신규
4. `app/api/shipments/route.ts` 신규

### Wave 2 동시 실행 (Wave 1 완료 후)
**Agent D** (Pipeline + Overview):
1. `FlowPipeline.tsx` 5단계 수정
2. `PipelineCasesTable.tsx` 신규
3. `PipelineTableWrapper.tsx` 신규
4. `pipeline/page.tsx` 수정
5. `OverviewMap.tsx` ArcLayer 추가
6. `OverviewRightPanel.tsx` WH 행 추가

**Agent E** (Sites + Chain + Cargo):
1. `SiteDetail.tsx` 보관유형 수정
2. `SiteTypeTag.tsx` 신규
3. `AgiAlertBanner.tsx` 수정
4. `FlowChain.tsx` 신규
5. `OriginCountrySummary.tsx` 신규
6. `chain/page.tsx` 신규
7. `cargo/page.tsx` URL 복원 + 3탭
8. `CargoDrawer.tsx` fallback 수정
9. `Sidebar.tsx` /chain 메뉴 추가

### Wave 3: 통합 검증
`pnpm --filter @repo/logistics-dashboard typecheck`

---

## 수정/신규 파일 목록
```
scripts/import-excel.mjs                     (신규 — Excel ETL)
lib/cases/pipelineStage.ts                   (신규)
lib/cases/storageType.ts                     (신규)
lib/map/flowLines.ts                         (신규)
types/cases.ts                               (수정)
app/api/cases/summary/route.ts               (수정)
app/api/cases/route.ts                       (수정)
app/api/chain/summary/route.ts               (신규)
app/(dashboard)/pipeline/page.tsx            (수정)
app/(dashboard)/cargo/page.tsx               (수정 — URL + 3탭)
app/(dashboard)/chain/page.tsx               (신규)
components/pipeline/FlowPipeline.tsx         (수정)
components/pipeline/PipelineCasesTable.tsx   (신규)
components/pipeline/PipelineTableWrapper.tsx (신규)
components/overview/OverviewMap.tsx          (수정)
components/overview/OverviewRightPanel.tsx   (수정)
components/sites/SiteDetail.tsx             (수정)
components/sites/SiteTypeTag.tsx            (신규)
components/sites/AgiAlertBanner.tsx         (수정)
components/chain/FlowChain.tsx              (신규)
components/chain/OriginCountrySummary.tsx   (신규)
components/cargo/CargoDrawer.tsx            (수정)
components/layout/Sidebar.tsx               (수정 — /chain 메뉴)

구현 상태 (2026-03-13)
✅ 완료 (37 파일, +2337 -308)

TypeScript 검사 통과 (pnpm typecheck)
dry-run 통과: cases 10,694 / flows 7,564 / shipments 890
모든 코드 파일 구현 완료

❌ 잔여 작업

ESLint 실패: 워크스페이스에 eslint 바이너리 없음 → pnpm add -D eslint 또는 경로 확인
Supabase 실제 쓰기: 환경변수가 placeholder(NEXT_PUBLIC_SUPABASE_URL=True) → 실제 값 필요

bash   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
   node apps/logistics-dashboard/scripts/import-excel.mjs
검증
bash# TypeScript ✅
pnpm --filter @repo/logistics-dashboard typecheck

# ESLint ❌ (수정 필요)
pnpm --filter @repo/logistics-dashboard lint

# dry-run ✅
node apps/logistics-dashboard/scripts/import-excel.mjs --dry-run

# 실제 임포트 (환경변수 설정 후)
NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
  node apps/logistics-dashboard/scripts/import-excel.mjs

# 개발 서버
cd apps/logistics-dashboard && pnpm dev

# ✅ /overview  — 지도 노드(🔵항구/🟡창고/🟠MOSB/🟢현장) + flow arcs + WH 행
# ✅ /pipeline  — 5단계(Pre-Arrival/Port/WH/MOSB/Site) + 클릭 시 하단 테이블 갱신
# ✅ /sites     — 4카드 (SHU·MIR 육상 / DAS·AGI 해상) + AGI 경보
# ✅ /cargo     — ?tab=wh&caseId=... 직접 진입 + SHIPMENTS 탭
# ✅ /chain     — 전체 물류 체인 시각화 + 원산지 집계

[현재 작업] 문서 업데이트 플랜 (2026-03-13)
요청: docs/ 폴더 6개 문서 전체를 현재 구현 상태로 병렬 갱신
대상 디렉토리: C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ\apps\logistics-dashboard\docs
대상 파일 6개:

SUPABASE.md — DB 스키마, 뷰, RLS, API 패턴
SYSTEM-ARCHITECTURE.md — 기술 스택, 5레이어 아키텍처, 데이터 흐름
COMPONENTS.md — 37개 컴포넌트, 훅, 통신 패턴
DEPLOYMENT.md — GitHub/Vercel 배포 가이드, 마이그레이션 순서
LAYOUT.md — 레이아웃 계층, 반응형, CSS
GITHUB-DEPLOY-STRUCTURE.md — 레포 구조, gitignore, 배포 절차

공통 반영 사항 (모든 문서)
변경 항목상세실제 데이터 볼륨cases 10,694 / flows 7,564 / shipments 890Supabase 페이지네이션db-max-rows=1000 한계 → fetchAllCases() 루프 패턴 적용suppressHydrationWarning<html>, <body> 양쪽에 추가 (Kapture 브라우저 확장 충돌 방지)AgiAlertBannertypeof window 가드 제거 (useEffect 내부에서 불필요)신규 /chain 페이지전체 물류 체인 시각화신규 API/api/chain/summary, /api/shipments신규 컴포넌트SiteTypeTag, FlowChain, OriginCountrySummary, PipelineCasesTable, PipelineTableWrapper임포트 스크립트scripts/import-excel.mjs
병렬 실행 구성 (3 Agent)
Agent 1: SUPABASE.md + SYSTEM-ARCHITECTURE.md
SUPABASE.md 주요 변경:

시드 데이터 수치: ~1,050 rows → cases 10,694 / flows 7,564 / shipments 890
페이지네이션 패턴 섹션 신규 추가:

typescript  // db-max-rows=1000 한계 우회 — fetchAllCases() 루프 패턴
  async function fetchAllCases() {
    const PAGE = 1000; let offset = 0; const allRows = []
    while (true) {
      const { data } = await supabase.from('v_cases').select(cols).range(offset, offset+PAGE-1).order('id')
      if (!data?.length) break
      allRows.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }
    return allRows
  }

case.cases 신규 컬럼 문서화: hvdc_code, sct_ship_no, final_location, cbm, stack_status, storage_type
status.shipments_status 신규 컬럼: final_delivery_date, transit_days, customs_days, inland_days, doc_shu/das/mir/agi
뷰 목록: v_cases, v_flows, v_shipments_status, v_stock_onhand, shipments (complex LEFT JOIN)
환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

SYSTEM-ARCHITECTURE.md 주요 변경:

데이터 볼륨 섹션: 실제 수치 반영 (10,694 cases)
API Routes 목록에 추가: /api/chain/summary, /api/shipments
5페이지 구조: /chain 신규 추가
아키텍처 레이어에 페이지네이션 패턴 설명 추가
scripts/import-excel.mjs ETL 스크립트 언급

Agent 2: COMPONENTS.md + LAYOUT.md
COMPONENTS.md 주요 변경:

KpiProvider: useKpiRealtime 훅 설명, Supabase Postgres Changes 실시간 구독
AgiAlertBanner: typeof window 가드 제거, stage별 건수 (창고/MOSB/Pre-Arrival) 표시
신규 컴포넌트 추가 문서화:

SiteTypeTag.tsx — 육상(SHU/MIR) / 해상(DAS/AGI) 배지
FlowChain.tsx — /chain 페이지 수평 시각화
OriginCountrySummary.tsx — 원산지 국가별 집계 바 차트
PipelineCasesTable.tsx — Pipeline 페이지 하단 케이스 테이블 (독립 fetch)
PipelineTableWrapper.tsx — casesStore.activePipelineStage 연동 wrapper



LAYOUT.md 주요 변경:

Root Layout (app/layout.tsx): suppressHydrationWarning 속성 추가 설명
5페이지 라우트 목록: /chain 추가
사이드바 메뉴 업데이트 (물류 체인 항목)

Agent 3: DEPLOYMENT.md + GITHUB-DEPLOY-STRUCTURE.md
DEPLOYMENT.md 주요 변경:

환경변수 목록: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
데이터 임포트 단계 추가:

bash  # Excel → Supabase 임포트
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  node apps/logistics-dashboard/scripts/import-excel.mjs
```
- 마이그레이션 순서: `20260127_api_views.sql` (v_cases, shipments 뷰 포함)
- 실제 데이터 수치 반영

**GITHUB-DEPLOY-STRUCTURE.md 주요 변경**:
- `scripts/` 디렉토리 추가 (`import-excel.mjs`)
- 신규 컴포넌트 파일 목록: `chain/`, `SiteTypeTag`, `FlowChain`, `OriginCountrySummary`, `PipelineCasesTable`, `PipelineTableWrapper`
- 신규 API 라우트: `/api/chain/`, `/api/shipments/`
- 신규 페이지: `(dashboard)/chain/`
- 알려진 이슈 해결 현황: 수화 오류 수정, 1,000행 제한 수정 완료

## 검증
- 각 문서 Write 완료 후 파일 크기/줄수 확인
- 핵심 수치 (10,694 / 7,564 / 890) 포함 여부 확인
- 페이지네이션 코드 예시 포함 여부 확인

---

# [현재 작업] 항차 누락 수정 + 레이아웃 패치 (2026-03-13 v2)

## Context (문제 배경)

현재 대시보드는 **창고 중심(WH STATUS 시트 기반)**으로 설계되어 있음.

| 구분 | 현재 데이터 소스 | 문제 |
|------|----------------|------|
| Pipeline 단계 카운트 | `case.cases` (wh_status 기반) | 창고 미도착 항차(Pre-Arrival, In-Transit)는 케이스가 없으므로 파이프라인에서 보이지 않음 |
| FlowChain 단계 카운트 | `v_cases` (wh_status 기반) | 동일 |
| SHIPMENTS 탭 카운트 | **하드코딩 '874'** | 실제 DB 수치(890)와 불일치 |
| CargoTabs 전체 카운트 | 하드코딩 '8,680'·'874'·'791' | 전부 구버전 수치 |
| 항차(Voyage) 스테이지 | **없음** | hvdc_all_status의 ETD/ATA/Customs 날짜 기반 분류 미구현 |

**"창고중심"의 핵심 원인**: `FlowChain`, `FlowPipeline`, KPI 모두 wh_status를 기반으로 하므로, 아직 창고에 없는 항차(선박 이동 중, 사전도착 등)는 전혀 집계되지 않음.

## ⚠️ 도메인 보정 (K·L·M·N열 의미)

| 열 | DB 컬럼 | 실제 의미 |
|----|--------|----------|
| K열 `DOC_SHU` | `doc_shu` | 발주 시 **SHU 납품 지정** ('O' = SHU로 노미네이트됨) |
| L열 `DOC_DAS` | `doc_das` | 발주 시 **DAS 납품 지정** ('O' = DAS로 노미네이트됨) |
| M열 `DOC_MIR` | `doc_mir` | 발주 시 **MIR 납품 지정** ('O' = MIR로 노미네이트됨) |
| N열 `DOC_AGI` | `doc_agi` | 발주 시 **AGI 납품 지정** ('O' = AGI로 노미네이트됨) |

**핵심**: 이 열은 "서류 완료 여부"가 아니라 **"발주 시 지정된 입고 현장"**이다.
- 하나의 항차(SCT SHIP NO)가 여러 현장에 동시 노미네이트 가능 (부분 납품)
- `doc_agi=true` 또는 `doc_das=true`이면 → **MOSB 경유 필수 (Flow Code ≥ 3)**

**영향 범위**:
1. `ShipmentsTable` 필터에 "노미네이션 현장" 필터 추가 (SHU/DAS/MIR/AGI)
2. `FlowChain` 사이트 노드: 노미네이션 기준 항차 수 표시 (wh_status final_location 대신)
3. DAS/AGI 노미네이션 항차 중 Flow Code < 3인 건 → 이상 플래그

## 근본 구조 이해
```
hvdc all status (893행) = 항차 단위 (SCT SHIP NO = B/L 번호)
   ↓ 항차별 ETD/ATD/ETA/ATA/customs/delivery 날짜로 현재 스테이지 판별 가능
   ↓ 890행 → status.shipments_status

wh status (10,694행) = 케이스/장비 단위
   ↓ 창고 도착 후 개별 장비 추적 (status_current, status_location)
   ↓ 10,694행 → case.cases
항차가 창고에 도착하기 전(Pre-Arrival, In-Transit, 통관 중)에는 wh_status에 케이스가 없음.
따라서 항차 단위 현황은 hvdc_all_status 날짜로 독립 계산해야 함.
항차 스테이지 분류 기준 (hvdc_all_status 날짜 기반)
typescriptfunction classifyVoyageStage(row): VoyageStage {
  if (!row.atd)                           return 'pre-departure'   // ETD 예정, 미출항
  if (row.atd && !row.ata)               return 'in-transit'       // 출항 완료, 미도착
  if (row.ata && !row.customs_close_date) return 'port-customs'    // 도착, 통관 진행 중
  if (row.customs_close_date && !row.final_delivery_date)
                                          return 'inland'           // 통관 완료, 내륙운송/창고
  return 'delivered'                                               // 최종 납품 완료
}
수정 파일 목록 (5개 파일 + 1개 신규)
파일 1: app/api/shipments/route.ts (수정)
변경: 응답에 voyage_stage, flow_code, transit_days, customs_days, inland_days 추가
typescript// SELECT에 추가
flow_code, transit_days, customs_days, inland_days,
doc_shu, doc_das, doc_mir, doc_agi,
final_delivery_date, customs_start_date, customs_close_date, atd

// 응답 가공에서 voyage_stage 계산
const voyage_stage = deriveVoyageStage(row)

// voyage_stage 필터 파라미터 추가
if (voyage_stage) query = query.eq('voyage_stage_computed', ...)
// → 실제로는 클라이언트 사이드 필터(뷰에 컬럼 없음) OR 날짜 조건 WHERE 추가
voyage_stage 파라미터 쿼리 변환:
typescript// voyage_stage 별 WHERE 조건
'pre-departure':  atd IS NULL
'in-transit':     atd IS NOT NULL AND ata IS NULL
'port-customs':   ata IS NOT NULL AND customs_close_date IS NULL
'inland':         customs_close_date IS NOT NULL AND final_delivery_date IS NULL
'delivered':      final_delivery_date IS NOT NULL
파일 2: app/api/shipments/stages/route.ts (신규)
목적: 항차 단계별 건수 반환 → FlowChain/Pipeline에서 사용
typescriptGET /api/shipments/stages
→ {
    pre_departure: 12,
    in_transit: 45,
    port_customs: 28,
    inland: 234,
    delivered: 571,
    total: 890
  }
쿼리:
sqlSELECT
  COUNT(*) FILTER (WHERE atd IS NULL) as pre_departure,
  COUNT(*) FILTER (WHERE atd IS NOT NULL AND ata IS NULL) as in_transit,
  COUNT(*) FILTER (WHERE ata IS NOT NULL AND customs_close_date IS NULL) as port_customs,
  COUNT(*) FILTER (WHERE customs_close_date IS NOT NULL AND final_delivery_date IS NULL) as inland,
  COUNT(*) FILTER (WHERE final_delivery_date IS NOT NULL) as delivered,
  COUNT(*) as total
FROM status.shipments_status

필요: supabase.rpc() 또는 raw query → Supabase의 supabase.from().select('...') 집계 방식 사용

파일 3: components/cargo/CargoTabs.tsx (수정)
변경: 하드코딩 카운트 제거 → API fetch로 동적 카운트
typescript// 현재 (하드코딩)
{ key: 'wh',        label: 'WH STATUS',  count: '8,680' }
{ key: 'shipments', label: 'SHIPMENTS',  count: '874'   }
{ key: 'stock',     label: 'DSV STOCK',  count: '791'   }

// 변경 후 (동적)
const [counts, setCounts] = useState({ wh: null, shipments: null, stock: null })
useEffect(() => {
  // /api/cases/summary → total
  // /api/shipments → total (from pagination meta)
  // /api/stock → total
}, [])
/api/shipments 엔드포인트에 ?pageSize=1 요청으로 total 값만 받아오거나,
또는 신규 /api/shipments/stages 에서 total 사용.
파일 4: components/cargo/ShipmentsTable.tsx (수정)
변경 1: 항차 스테이지 필터 탭 추가
typescriptconst VOYAGE_STAGES = [
  { key: 'all',          label: '전체' },
  { key: 'pre-departure',label: '출항 전' },
  { key: 'in-transit',   label: '항해 중' },
  { key: 'port-customs', label: '통관 중' },
  { key: 'inland',       label: '내륙/창고' },
  { key: 'delivered',    label: '납품 완료' },
]
변경 2: 노미네이션 현장 필터 추가 (doc_shu/das/mir/agi 기반)
typescriptconst NOMINATED_SITES = ['전체', 'SHU', 'MIR', 'DAS', 'AGI']
// doc_agi=true → AGI 노미네이션 항차만 표시
```

**변경 3**: 컬럼에 Flow Code, 항차 단계, 노미네이션 현장 추가
| # | SCT SHIP NO | 벤더 | POL → POD | ETD | ATA | 항차단계 | FC | 노미현장 |

**변경 4**: 총 건수 동적 표시 (`total` from API response)

### 파일 5: `components/chain/FlowChain.tsx` (수정)
**변경**: 단계 카운트를 **케이스 수(wh_status 기반)** + **항차 수(shipments 기반)** 병렬 표시
```
현재:  [ Pre-Arrival: 1,234건 ]  (케이스 단위)
변경 후: [ Pre-Arrival: 1,234 케이스 | 57 항차 ]
/api/shipments/stages 에서 voyage counts 가져와서 각 ChainNode에 voyageCount prop 추가.
매핑:
FlowChain 노드shipments_stages 필드pre-arrivalpre_departure + in_transitportport_customswarehouseinlandsitedelivered
노미네이션 기반 사이트 분류 (ChainNode 우측 패널):
typescript// 현재: wh_status final_location 기반 (case 단위)
// 변경: doc_* 기반 (항차 단위 노미네이션)
SHU: shipments where doc_shu = true
MIR: shipments where doc_mir = true
DAS: shipments where doc_das = true  → MOSB 필수 체크
AGI: shipments where doc_agi = true  → MOSB 필수 체크
AGI/DAS 이상 플래그: stages API에 agi_das_without_mosb 카운트 추가
sqlCOUNT(*) FILTER (
  WHERE (doc_agi = true OR doc_das = true)
  AND flow_code < 3
) AS agi_das_no_mosb_alert
병렬 실행 구성 (2 Agent)
Agent A: API 레이어

app/api/shipments/route.ts 수정 (voyage_stage 추가, SELECT 확장)
app/api/shipments/stages/route.ts 신규 생성
TypeScript 타입 types/shipments.ts (존재 시) 업데이트

Agent B: UI 레이어

components/cargo/CargoTabs.tsx — 동적 카운트
components/cargo/ShipmentsTable.tsx — 항차 스테이지 필터 + 컬럼 추가
components/chain/FlowChain.tsx — 항차 카운트 추가

검증
bash# 1. TypeScript
pnpm --filter @repo/logistics-dashboard typecheck

# 2. API 동작 확인
curl http://localhost:3001/api/shipments/stages
# → { pre_departure: N, in_transit: N, port_customs: N, inland: N, delivered: N, total: 890 }

curl http://localhost:3001/api/shipments?pageSize=5
# → rows[0] must have voyage_stage, flow_code fields

# 3. UI 확인
# /cargo?tab=shipments → 탭 카운트가 실제 DB 수치(890) 표시
# 항차 스테이지 필터 클릭 시 해당 단계 항차만 표시
# /chain → 각 노드에 케이스 수 + 항차 수 병렬 표시