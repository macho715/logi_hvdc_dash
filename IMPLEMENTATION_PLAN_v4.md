# HVDC 대시보드 — 통합 구현 플랜 (v4 최종)

> 작성일: 2026-03-13
> 기준 문서: `page payout plan.md` + `page payout plan_patch.md` + 도메인 보정

## Context

원본 설계 스펙 `page payout plan.md` + 기술 수정 `page payout plan_patch.md` + 도메인 보정을 통합하여 구현.

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
```

**공통 상단 KPI**: 총 화물 | 현장 도착 % | 창고 재고 % | SQM

---

## [A] Excel → Supabase 데이터 임포트

### A-1. Sheet "wh status" (10,694행) → `case.cases`

| Excel 컬럼 | DB 컬럼 | 변환 규칙 |
|-----------|---------|----------|
| `Case No.` | `case_no` | null이면 `CASE-{no.}` 생성 |
| `SCT SHIP NO.` | `sct_ship_no` | |
| `EQ No` | `hvdc_code` | HVDC 장비 ID. null 허용 |
| `Site` | `site` | 목적지. SHU/MIR/DAS/AGI만; 기타→null |
| `FLOW_CODE` | `flow_code` | INTEGER |
| `FLOW_DESCRIPTION` | `flow_description` | |
| `Status_Current` | `status_current` | site/warehouse/Pre Arrival |
| `Status_Location` | `status_location` | 현재 물리적 위치 |
| `Final_Location` | `final_location` | 실제 최종 도착지 |
| `SQM` | `sqm` | NUMERIC |
| `CBM` | `cbm` | NUMERIC |
| `Source_Vendor` | `source_vendor` | HITACHI→Hitachi, SIEMENS→Siemens |
| `Storage` | `storage_type` | normalizeStorage() 적용 |
| `Stack_Status` | `stack_status` | |
| `Status_Location_Date` | `site_arrival_date` | DATE |

**Storage 정규화**:
```python
def normalize_storage(val):
    if pd.isna(val): return None
    v = str(val).strip().lower()
    if v == 'indoor':                      return 'Indoor'
    if v in ('outdoor', 'outtdoor'):       return 'Outdoor'
    if v.startswith('outdoor cov') or v == 'outdoor covered' or v == 'open yard':
        return 'Outdoor Cov'
    return None
```

**Site 정규화**: VALID = {SHU, MIR, DAS, AGI}; 그 외 null

### A-2. Sheet "hvdc all status" (893행) → `status.shipments_status`

| Excel 컬럼 | DB 컬럼 | 변환 |
|-----------|---------|------|
| `SCT SHIP NO.` | `hvdc_code` | |
| `MR#` | `status_no` | |
| `VENDOR` | `vendor` | |
| `POL` | `pol` | 원산지 항구 코드 |
| `POD` | `pod` | |
| `VESSEL NAME/ FLIGHT No.` | `vessel` | |
| `B/L No./ AWB No.` | `bl_awb` | |
| `SHIP MODE` | `ship_mode` | |
| `ETD` (54) | `etd` | DATE |
| `ATD` (55) | `atd` | DATE |
| `ETA` (56) | `eta` | DATE |
| `ATA` (57) | `ata` | DATE |
| `INCOTERMS` | `incoterms` | |
| `FINAL DELIVERY` (80) | `final_delivery_date` | DATE — 최종 현장 배송 완료일 |
| ATA - ETA (계산) | `transit_days` | INTEGER — 해상 운송 기간 (일) |
| Customs Close - Attestation Date (계산) | `customs_days` | INTEGER — 통관 기간 (일) |
| FINAL DELIVERY - Customs Close (계산) | `inland_days` | INTEGER — 내륙 운송 기간. **≥30일이면 창고 경유 가능성** |
| `DOC_SHU` (K=10) | `doc_shu` | 'O'→true, null→false |
| `DOC_DAS` (L=11) | `doc_das` | 'O'→true, null→false |
| `DOC_MIR` (M=12) | `doc_mir` | 'O'→true, null→false |
| `DOC_AGI` (N=13) | `doc_agi` | 'O'→true, null→false |

> **DB 스키마 확인**: `status.shipments_status`에 `final_delivery_date`, `transit_days`, `customs_days`, `inland_days`, `doc_shu/das/mir/agi` 컬럼 없으면 ALTER TABLE 먼저 실행.

> **inland_days ≥ 30**: 내륙 운송 중 창고 경유 가능성 표시. 대시보드에서 `창고 경유 의심` 플래그로 활용.

**기간 계산 로직** (import 스크립트에서):
```javascript
const daysDiff = (d1, d2) => {
  if (!d1 || !d2) return null
  return Math.round((new Date(d1) - new Date(d2)) / 86400000)
}
// transit_days  = ATA(57) - ETA(56)
// customs_days  = 'Customs Close'(61) - 'Attestation Date'(58)
// inland_days   = 'FINAL DELIVERY'(80) - 'Customs Close'(61)
// ⚠️ 'FINAL DELIVERY' = object 타입 → pd.to_datetime() 변환 필요
```

**확인된 날짜 컬럼 (hvdc all status)**:
```
54: ETD       55: ATD       56: ETA        57: ATA
58: Attestation Date        59: DO Collection
60: Customs Start           61: Customs Close
62: Custom Code             63: DUTY AMT    64: VAT AMT
65-79: 위치별 도착일 (SHU/MIR/DAS/AGI/DSV/JDN/MOSB/AAA/ZENER/Hauler/Vijay)
80: FINAL DELIVERY
```

### A-3. "wh status" → `case.flows` (case 단위)

```javascript
// case 단위 (shipment 단위 아님 — multi-site 배송 지원)
// case_no 기준으로 flow_code, flow_description, sct_ship_no 저장
```

### A-4. ETL 스크립트

**파일**: `apps/logistics-dashboard/scripts/import-excel.mjs`

```
Node.js + xlsx + @supabase/supabase-js
1. Excel 두 시트 읽기
2. ALTER TABLE 확인 (신규 컬럼)
3. wh_status → case.cases (TRUNCATE → batch INSERT, BATCH=200)
4. hvdc_all_status → status.shipments_status (기간 계산 포함)
5. flows → case.flows (case 단위)
6. 결과 로그
```

---

## [B] 대시보드 코드 Gap 수정

### B-1. 신규 helpers

**`lib/cases/pipelineStage.ts`**
```typescript
export type PipelineStage = 'pre-arrival' | 'port' | 'warehouse' | 'mosb' | 'site'

const SITE_LOCS  = new Set(['SHU','MIR','DAS','AGI'])
const MOSB_LOCS  = new Set(['MOSB','ADNOC L&S Yard'])
const WH_LOCS    = new Set(['DSV Indoor','DSV Outdoor','DSV Al Markaz','JDN MZD','AAA Storage',
                             'Hauler DG','ZENER','Hauler Indoor','DSV MZP'])
const PORT_LOCS  = new Set(['Khalifa Port','Mina Zayed','Jebel Ali','AUH Airport'])

export function classifyStage(status_current, status_location): PipelineStage { ... }
```

**`lib/cases/storageType.ts`**
```typescript
export type StorageBucket = 'Indoor' | 'Outdoor' | 'Outdoor Cov'
export function normalizeStorageType(raw): StorageBucket | null { ... }
```

### B-2. `types/cases.ts` 수정
- `wh_storage_type` 제거 (`storage_type: string | null` 유지)

### B-3. `app/api/cases/summary/route.ts` 수정
- `.select(... storage_type)` (wh_storage_type 제거)
- `normalizeStorageType()` 사용, `classifyStage()` helper 사용

### B-4. `app/api/cases/route.ts` 수정
- `stage` 파라미터 추가 (pre-arrival/port/warehouse/mosb/site)
- `id` 파라미터 추가 (단건 조회)

### B-5. `FlowPipeline.tsx` 수정 — 5단계
```typescript
const STAGES = [
  { key: 'pre-arrival', label: 'Pre-Arrival', sublabel: '선적 전/해상 운송 중', color: 'gray' },
  { key: 'port',        label: 'Port / 통관', sublabel: 'Khalifa·MZD·JAFZ·AUH', color: 'blue' },
  { key: 'warehouse',   label: '창고',         sublabel: 'DSV·JDN·AAA·ZENER', color: 'yellow' },
  { key: 'mosb',        label: 'MOSB',        sublabel: 'DAS·AGI 경유 필수', color: 'orange' },
  { key: 'site',        label: '현장 도착',    sublabel: 'SHU·MIR(육상) / DAS·AGI(해상)', color: 'green' },
]
```

### B-6. `PipelineCasesTable.tsx` 신규 (독립 fetch)
- casesStore 의존성 없음 → `/api/cases?stage=...` 직접 호출
- 8컬럼: # / Case No / Site / 현재위치 / FC / SQM / Status / 벤더
- 행 클릭 → `router.push('/cargo?tab=wh&caseId=...')`

### B-7~8. `PipelineTableWrapper.tsx` + `pipeline/page.tsx` 수정

### B-9. `lib/map/flowLines.ts` 신규
```typescript
// Flow Code별 색상: 1=파랑, 2=초록, 3=주황, 4=빨강, 5=회색
export const FLOW_ARC_SPECS = [
  { id:'p-wh',    sourcePoiId:'khalifa-port', targetPoiId:'dsv-indoor', flowCode:2 },
  { id:'wh-mosb', sourcePoiId:'dsv-indoor',   targetPoiId:'mosb',       flowCode:3 },
  { id:'mosb-das',sourcePoiId:'mosb',          targetPoiId:'das',        flowCode:4 },
  { id:'mosb-agi',sourcePoiId:'mosb',          targetPoiId:'agi',        flowCode:4 },
  { id:'p-shu',   sourcePoiId:'khalifa-port',  targetPoiId:'shu',        flowCode:1 },
  { id:'p-mir',   sourcePoiId:'khalifa-port',  targetPoiId:'mir',        flowCode:1 },
]
```

### B-10~14. 나머지 수정
- `OverviewMap.tsx`: ArcLayer + 노드 색상 (🔵항구/🟡창고/🟠MOSB/🟢현장)
- `SiteDetail.tsx`: 보관유형 3버킷 + SiteTypeTag
- `AgiAlertBanner.tsx`: `⚠️ AGI 미납 N건 | MOSB N건 | 창고 N건 | Pre-Arrival N건`
- `OverviewRightPanel.tsx`: WH 재고 행 추가
- `cargo/page.tsx`: `?tab=wh&caseId=...` URL 복원
- `CargoDrawer.tsx`: caseId fallback 단건 조회

---

## [C] /cargo 페이지 3탭 확장 (원본 스펙)

1. **WH STATUS** (10,694건) — Case No / Site / 현재위치 / Flow / SQM / Status / 벤더
2. **SHIPMENTS** (893건 BL) — SCT SHIP NO / 벤더·카테고리 / POL→POD / ETD·ATD / ETA·ATA / CIF / transit_days / inland_days
3. **DSV STOCK** (후순위)

**상세 드로어**: Case No / Site / Vendor / Flow / Storage / SQM / 타임라인(ETD→ETA→ATA) / 치수 / HS Code

---

## [D] /chain 신규 페이지 (전체 물류 체인)

### FlowChain 시각화
```
[🌏 원산지]  →  [⚓ 항구/공항]       →  [🏭 창고]    →  [⛴ MOSB]      →  [현장]
KR·FR·IT·BE     Khalifa·MZD·JAFZ·AUH    DSV·JDN·AAA     ADNOC L&S Yard    SHU·MIR·DAS·AGI
  N건BL             N건                    N건             N건(DAS/AGI)       N건
```
- 각 노드 클릭 → 해당 단계 케이스 목록
- DAS/AGI 경로 강조: MOSB 경유 필수 (Flow ≥ 3)
- SHU/MIR (🏗 육상) vs DAS/AGI (🏝 해상) 시각적 구분

### OriginCountrySummary
POL 기반 원산지 국가별 집계 바 차트 (KR/FR/IT/BE/DE 등)

### API: `/api/chain/summary`
```typescript
{
  origins: { country: string; count: number }[]
  stages: Record<PipelineStage, number>
  sites: { land: {SHU,MIR}; island: {DAS,AGI} }
  mosbTransit: number  // Flow 3+4
}
```

---

## 작업 순서

### 단계 A — Excel Import (먼저)
1. DB 스키마 확인 및 ALTER TABLE
2. `scripts/import-excel.mjs` 작성
3. 실행 및 검증 (`COUNT(*)` 확인)

### 단계 B — 코드 수정 (기존 오류 수정)
pipelineStage.ts → storageType.ts → types/cases.ts → summary/route.ts → cases/route.ts → FlowPipeline.tsx → PipelineCasesTable.tsx → PipelineTableWrapper.tsx → pipeline/page.tsx → flowLines.ts → OverviewMap.tsx → SiteDetail.tsx → AgiAlertBanner.tsx → OverviewRightPanel.tsx → cargo/page.tsx → CargoDrawer.tsx

### 단계 C — cargo 3탭 확장
SHIPMENTS 탭 (DSV STOCK 후순위)

### 단계 D — /chain 신규
chain/summary API → FlowChain.tsx → OriginCountrySummary.tsx → SiteTypeTag.tsx → chain/page.tsx → 사이드바 메뉴

---

## 수정/신규 파일 목록

```
apps/logistics-dashboard/
├── scripts/import-excel.mjs                     (신규)
├── lib/
│   ├── cases/pipelineStage.ts                   (신규)
│   ├── cases/storageType.ts                     (신규)
│   └── map/flowLines.ts                         (신규)
├── types/cases.ts                               (수정)
├── app/
│   ├── api/
│   │   ├── cases/route.ts                       (수정)
│   │   ├── cases/summary/route.ts               (수정)
│   │   └── chain/summary/route.ts               (신규)
│   └── (dashboard)/
│       ├── pipeline/page.tsx                    (수정)
│       ├── cargo/page.tsx                       (수정 — URL + 3탭)
│       └── chain/page.tsx                       (신규)
└── components/
    ├── pipeline/
    │   ├── FlowPipeline.tsx                     (수정)
    │   ├── PipelineCasesTable.tsx               (신규)
    │   └── PipelineTableWrapper.tsx             (신규)
    ├── overview/
    │   ├── OverviewMap.tsx                      (수정)
    │   └── OverviewRightPanel.tsx               (수정)
    ├── sites/
    │   ├── SiteDetail.tsx                       (수정)
    │   ├── SiteTypeTag.tsx                      (신규)
    │   └── AgiAlertBanner.tsx                   (수정)
    ├── chain/
    │   ├── FlowChain.tsx                        (신규)
    │   └── OriginCountrySummary.tsx             (신규)
    ├── cargo/CargoDrawer.tsx                    (수정)
    └── layout/Sidebar.tsx                       (수정 — /chain 메뉴)
```

---

## 검증

```bash
pnpm --filter @repo/logistics-dashboard typecheck
cd apps/logistics-dashboard && pnpm dev

# ✅ /overview  — 지도 노드(🔵항구/🟡창고/🟠MOSB/🟢현장) + flow arcs + WH 행
# ✅ /pipeline  — 5단계(Pre-Arrival/Port/WH/MOSB/Site) + 클릭 시 하단 테이블 갱신
# ✅ /sites     — 4카드 (SHU·MIR 육상 / DAS·AGI 해상) + AGI 경보
# ✅ /cargo     — ?tab=wh&caseId=... 직접 진입 + SHIPMENTS 탭
# ✅ /chain     — 전체 물류 체인 시각화 + 원산지 집계
```
