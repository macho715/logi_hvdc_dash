Context
원본 설계 스펙 page payout plan.md + 기술 수정 page payout plan_patch.md + 도메인 보정을 통합하여 구현.
소스 디렉토리:
C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ\apps\logistics-dashboard
Excel 파일:
C:\Users\jichu\Downloads\LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ\Logi ontol core doc\HVDC STATUS1.xlsx

도메인 핵심 정리
컬럼 의미
Excel 컬럼의미SITE (wh status)선적서류 기준 최종 목적지 (현재 위치 아님)Status_Location현재 물리적 위치Final_Location실제 최종 도착지 (hvdc:hasFinalLocation)EQ NoHVDC 장비 코드 (hvdc:hasHVDCCode)DOC_SHU/DAS/MIR/AGI (K,L,M,N열)해당 사이트 선적서류 완료 여부 ('O')FINAL DELIVERY (hvdc all status)실제 현장 최종 배송 완료일
추적 가능성

Hitachi/Siemens: 개별 CASE 단위 추적 가능
SCT/기타: 추적 제한적 (hvdc_code null 다수)
한 SCT SHIP NO. 내 개별 CASE가 서로 다른 현장으로 배송 가능 (multi-site)

Flow Code v3.5
Flow경로MOSB주요 목적지0Pre ArrivalN/AN/A1Port→Site❌SHU/MIR (육상)2Port→WH→Site❌SHU/MIR (육상)3Port→MOSB→Site✅ 필수DAS/AGI (해상)4Port→WH→MOSB→Site✅ 필수DAS/AGI (해상)5Mixed검토검토
AGI/DAS: Flow ≥ 3 필수 (MOSB 없으면 자동 업그레이드)

⚠️ 이전 Task 1+2 구현 오류 (즉시 수정 필요)
잘못된 구현올바른 구현wh_storage_type 필드 추가storage_type 사용 (이미 DB에 있음).select(..., wh_storage_type).select(..., storage_type)wh_storage_type === 'Indoor'normalizeStorageType(row.storage_type)

4페이지 구조 (원본 스펙 기준)
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

## 작업 순서

### 단계 A (먼저 — DB 데이터 세팅)
1. DB 스키마 확인: shipments_status에 신규 컬럼 여부 체크
2. `scripts/import-excel.mjs` 작성 및 실행
3. 검증: `SELECT COUNT(*) FROM "case".cases` ~10,694 / `SELECT status_current, COUNT(*) FROM public.v_cases GROUP BY 1`

### 단계 B (코드 수정 — 기존 오류 수정)
순서대로: pipelineStage.ts → storageType.ts → types/cases.ts → summary/route.ts → cases/route.ts → FlowPipeline.tsx → PipelineCasesTable.tsx → PipelineTableWrapper.tsx → pipeline/page.tsx → flowLines.ts → OverviewMap.tsx → SiteDetail.tsx → AgiAlertBanner.tsx → OverviewRightPanel.tsx → cargo/page.tsx → CargoDrawer.tsx

### 단계 C (cargo 3탭 확장)
SHIPMENTS 탭 컴포넌트 구현 (DSV STOCK은 후순위)

### 단계 D (/chain 신규)
chain/summary API → FlowChain.tsx → OriginCountrySummary.tsx → SiteTypeTag.tsx → chain/page.tsx → 사이드바 메뉴

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

검증
bashpnpm --filter @repo/logistics-dashboard typecheck
cd apps/logistics-dashboard && pnpm dev

# ✅ /overview  — 지도 노드(🔵항구/🟡창고/🟠MOSB/🟢현장) + flow arcs + WH 행
# ✅ /pipeline  — 5단계(Pre-Arrival/Port/WH/MOSB/Site) + 클릭 시 하단 테이블 갱신
# ✅ /sites     — 4카드 (SHU·MIR 육상 / DAS·AGI 해상) + AGI 경보
# ✅ /cargo     — ?tab=wh&caseId=... 직접 진입 + SHIPMENTS 탭
# ✅ /chain     — 전체 물류 체인 시각화 + 원산지 집계