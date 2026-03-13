# page payout plan_patch

## 목적

이 문서는 [page payout plan.md](C:/Users/jichu/Downloads/LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ/page%20payout%20plan.md)의 UX 설계를 현재 `apps/logistics-dashboard` 코드베이스에 맞게 구현하기 위한 정정 스펙이다.

이전 초안의 문제는 다음과 같았다.

- 실제 DB/API 필드와 다른 `wh_storage_type`를 가정함
- `port`, `mosb` 스테이지를 `status_current`만으로 필터하려고 함
- pipeline 하단 테이블이 cargo 전역 필터 상태를 덮어씀
- pipeline 행 클릭이 실제로는 보이지 않는 drawer를 열도록 설계됨
- overview 지도에서 POI가 이중 렌더링되는 현재 구조를 고려하지 않음

이 문서는 위 문제를 제거하고, 현재 코드 기준으로 바로 구현 가능한 계약만 남긴다.

---

## 구현 범위

이번 패치의 목적은 기존 4개 페이지 구조를 유지하면서 물류 흐름 중심 설계를 정합화하는 것이다.

- `overview`: 지도 + 우측 패널 + KPI
- `pipeline`: 5단계 flow strip + KPI grid + 하단 케이스 테이블
- `sites`: 4개 현장 카드 + AGI 경보 + 상세 패널
- `cargo`: WH STATUS / SHIPMENTS / DSV STOCK + drawer

이번 패치에서 하지 않는 것:

- 새 라우트 추가
- 단일 통합 페이지로 레이아웃 재구성
- 집계형 동적 Arc 계산
- pipeline 페이지에서 drawer 직접 오픈

---

## 소스 오브 트루스

### 데이터 필드

`public.v_cases` 기준 실제 사용 필드는 아래와 같다.

```sql
id,
case_no,
site,
flow_code,
flow_description,
status_current,
status_location,
final_location,
sqm,
source_vendor,
storage_type,
stack_status,
category,
sct_ship_no,
site_arrival_date
```

중요:

- `wh_storage_type`는 존재하지 않는다.
- 저장소 타입 원천값은 `storage_type`이다.
- UI 표시 버킷은 `storage_type`에서 파생한다.

### 저장 타입 표시 규칙

원천값과 UI 버킷은 다음 규칙으로 고정한다.

| 원천값 `storage_type` | UI 표시 버킷 |
| --- | --- |
| `Indoor` | `Indoor` |
| `Outdoor` | `Outdoor` |
| `Open Yard` | `Outdoor Cov` |
| 그 외 / null | 집계 제외 |

이 규칙은 summary API와 sites 상세 패널에서 동일하게 사용한다.

---

## 핵심 계약

## 1. Pipeline stage 계약

파이프라인은 3단계가 아니라 5단계로 고정한다.

```ts
export type PipelineStage =
  | 'pre-arrival'
  | 'port'
  | 'warehouse'
  | 'mosb'
  | 'site'
```

### 스테이지 분류 규칙

우선순위는 아래 순서로 적용한다.

1. `site`
2. `mosb`
3. `warehouse`
4. `port`
5. `pre-arrival`

분류 규칙:

- `site`
  - `status_current === 'site'`
  - 또는 `status_location in ['SHU', 'MIR', 'DAS', 'AGI']`
- `mosb`
  - `status_location in ['MOSB', 'ADNOC L&S Yard']`
- `warehouse`
  - `status_current === 'warehouse'`
  - 또는 `status_location in ['DSV Indoor', 'DSV Outdoor', 'DSV Al Markaz', 'JDN MZD', 'AAA Storage', 'Hauler DG']`
- `port`
  - `status_location in ['Khalifa Port', 'Mina Zayed', 'Jebel Ali', 'AUH Airport']`
- `pre-arrival`
  - 위 규칙에 모두 해당하지 않는 값
  - `status_current === 'Pre Arrival'`
  - `status_location === 'Pre Arrival'`
  - `status_location === null`

이 분류 규칙은 다음 세 군데에서 반드시 동일해야 한다.

- `app/api/cases/summary/route.ts`
- `app/api/cases/route.ts`
- pipeline UI 표시 로직

권장 방식:

- `lib/cases/pipelineStage.ts` 같은 공통 helper 파일로 분리
- 상수와 분류 함수는 API와 클라이언트가 같이 사용

---

## 2. `/api/cases` 계약

### 유지 파라미터

- `site`
- `flow_code`
- `vendor`
- `category`
- `location`
- `status_current`
- `page`
- `pageSize`

### 신규 파라미터

- `stage`
- `id`

### `stage` 계약

```txt
/api/cases?stage=pre-arrival
/api/cases?stage=port
/api/cases?stage=warehouse
/api/cases?stage=mosb
/api/cases?stage=site
```

설명:

- `stage`는 pipeline 페이지 전용 필터 계약이다.
- `port`와 `mosb`는 `status_location` 기반이다.
- `warehouse`와 `site`는 `status_current` 우선, location 보조다.
- `stage`는 기존 cargo 필터 UI 상태와 독립적으로 동작할 수 있어야 한다.

### `id` 계약

```txt
/api/cases?id=<case-row-id>
```

설명:

- cargo drawer deep link 용도다.
- 응답 형식은 기존 `CasesResponse`를 유지하되 `data` 길이 0 또는 1을 반환한다.
- query param으로 진입한 경우, 현재 table page에 선택된 케이스가 없어도 drawer를 복원할 수 있어야 한다.

---

## 3. `/api/cases/summary` 계약

### `CasesSummary` 확장

```ts
export interface CasesSummary {
  total: number
  byStatus: {
    site: number
    warehouse: number
    'Pre Arrival': number
    port: number
    mosb: number
  }
  bySite: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
    Unassigned: number
  }
  bySiteArrived: {
    SHU: number
    MIR: number
    DAS: number
    AGI: number
  }
  bySiteStorageType: {
    [site: string]: {
      Indoor: number
      Outdoor: number
      'Outdoor Cov': number
    }
  }
  byFlowCode: Record<string, number>
  byVendor: Record<string, number>
  bySqmByLocation: Record<string, number>
  totalSqm: number
}
```

### select 컬럼

`summary` API는 아래 컬럼을 읽는다.

```ts
.select('site, flow_code, status_current, status_location, sqm, source_vendor, storage_type')
```

### 집계 책임

- `byStatus`: 5단계 스테이지 버킷
- `bySite`: 현장별 총 건수
- `bySiteArrived`: 현장별 `site` 도착 건수
- `bySiteStorageType`: 현장별 보관유형 집계
- `byFlowCode`: FC0~FC5
- `byVendor`: Hitachi / Siemens / Other
- `bySqmByLocation`: warehouse location별 SQM
- `totalSqm`: 전체 SQM 합계

---

## 페이지별 구현 스펙

## 1. Overview

### KPI Strip

- 기존 KPI 4개 유지
- `총 케이스`
- `현장 도착`
- `창고 재고`
- `SQM 합계`

### 우측 패널

현장 납품률 목록 아래에 `WH` 행을 추가한다.

- `WH` 값은 `summary.byStatus.warehouse`
- bar width는 `warehouse / total`
- 색상은 yellow 계열

### 지도

현재 overview는 `createPoiLayers(POI_LOCATIONS)`와 `createHvdcPoiLayers()`를 동시에 렌더링한다.
이번 패치에서는 좌표 SSOT를 `POI_LOCATIONS`로 단일화한다.

정리 원칙:

- `POI_LOCATIONS`만 overview 지도에 사용
- `createHvdcPoiLayers()`는 overview에서 제거하거나 `createPoiLayers()`에 흡수
- 맵 노드 색상은 category 기준으로 재정의

권장 색상 규칙:

- port / airport: blue
- warehouse: yellow
- yard(MOSB): orange
- HVDC site: green
- office: muted slate

### ArcLayer

Arc는 정적 대표 흐름선만 추가한다.

중요:

- raw 좌표 하드코딩 금지
- `sourcePoiId`, `targetPoiId` 기반으로 정의
- 실제 좌표는 `POI_LOCATIONS`에서 resolve

예시 구조:

```ts
type FlowArcSpec = {
  id: string
  sourcePoiId: string
  targetPoiId: string
  flowCode: 1 | 2 | 3 | 4 | 5
  width: number
}
```

대표 Arc:

- Port -> Warehouse
- Warehouse -> MOSB
- MOSB -> DAS
- MOSB -> AGI
- Port -> SHU
- Port -> MIR

이번 단계에서는 Arc 두께를 데이터량에 연동하지 않는다.

---

## 2. Pipeline

### 상단 스테이지 스트립

5개 단계로 교체한다.

| key | label | count source |
| --- | --- | --- |
| `pre-arrival` | `Pre-Arrival` | `summary.byStatus['Pre Arrival']` |
| `port` | `Port / 통관` | `summary.byStatus.port` |
| `warehouse` | `창고` | `summary.byStatus.warehouse` |
| `mosb` | `MOSB` | `summary.byStatus.mosb` |
| `site` | `현장 도착` | `summary.byStatus.site` |

### 하단 케이스 테이블

이 테이블은 cargo의 전역 `casesStore.filters`를 수정하면 안 된다.

정책:

- pipeline 전용 client component에서 독립 fetch 수행
- fetch URL은 `/api/cases?stage=...&pageSize=...`
- 로딩, empty, table rows 상태를 로컬로 관리
- cargo `WH STATUS` 필터/페이지 상태와 공유하지 않음

### 행 클릭

pipeline 페이지에서는 drawer를 직접 열지 않는다.

행 클릭 동작:

```txt
/cargo?tab=wh&caseId=<id>
```

설명:

- 파이프라인은 read-only drilldown entry
- 실제 상세 drawer는 cargo 페이지에서만 보여준다.

---

## 3. Sites

### 상단 카드

기존 4개 카드 구조 유지:

- SHU
- MIR
- DAS
- AGI

### AGI 경보

기존 경보는 `warehouse`만 보여주고 있다.
이번 패치에서는 아래 수치를 함께 보여준다.

- 미납 총량
- `warehouse`
- `mosb`
- `Pre Arrival`

표시 예시:

```txt
AGI 미납 1,681건
창고 846건 / MOSB 304건 / Pre-Arrival 59건
```

### 상세 패널

`SiteDetail`은 현재 site별 cases만 fetch하고 summary를 직접 읽지 않는다.
이번 패치에서는 store summary를 함께 읽는 방식으로 고정한다.

구현 원칙:

- 상세 차트와 pending/vendor/monthly는 기존 site별 cases fetch 유지
- summary 탭의 보관유형 박스는 `summary.bySiteStorageType[site]` 사용

표시 버킷:

- `Indoor`
- `Outdoor`
- `Outdoor Cov`

### pending row 클릭

sites의 pending table row는 아래로 이동한다.

```txt
/cargo?tab=wh&caseId=<id>
```

이 동작은 문서에 명시적으로 포함한다.

---

## 4. Cargo

### URL 복원 계약

cargo 페이지는 search param을 읽어 초기 상태를 복원해야 한다.

- `tab=wh|shipments|stock`
- `caseId=<id>`

규칙:

- `tab`이 없으면 기본값은 `wh`
- `caseId`가 있으면 drawer를 자동 오픈
- `caseId`가 있으나 현재 목록에 없으면 단건 조회로 보강

### Drawer 계약

drawer는 cargo 페이지 안에서만 마운트한다.

기존 구조 유지:

- `CargoTabs`가 `CargoDrawer`를 포함

필요 보강:

- `CargoDrawer`는 `selectedCaseId`가 목록에 없을 경우 `/api/cases?id=...` 호출
- 성공 시 해당 row를 로컬 fallback state로 렌더링
- 실패 시 drawer를 닫거나 not found 상태 표시

이번 패치에서는 pipeline이나 sites 페이지에 drawer를 직접 마운트하지 않는다.

---

## 파일별 작업 대상

필수 수정 파일:

- `apps/logistics-dashboard/types/cases.ts`
- `apps/logistics-dashboard/app/api/cases/route.ts`
- `apps/logistics-dashboard/app/api/cases/summary/route.ts`
- `apps/logistics-dashboard/components/pipeline/FlowPipeline.tsx`
- `apps/logistics-dashboard/components/pipeline/PipelineCasesTable.tsx`
- `apps/logistics-dashboard/components/pipeline/PipelineTableWrapper.tsx`
- `apps/logistics-dashboard/app/(dashboard)/pipeline/page.tsx`
- `apps/logistics-dashboard/components/sites/SiteDetail.tsx`
- `apps/logistics-dashboard/components/sites/AgiAlertBanner.tsx`
- `apps/logistics-dashboard/components/overview/OverviewRightPanel.tsx`
- `apps/logistics-dashboard/components/overview/OverviewMap.tsx`
- `apps/logistics-dashboard/components/cargo/CargoTabs.tsx`
- `apps/logistics-dashboard/components/cargo/CargoDrawer.tsx`
- `apps/logistics-dashboard/app/(dashboard)/cargo/page.tsx`
- `apps/logistics-dashboard/lib/map/flowLines.ts`

권장 신규 공통 파일:

- `apps/logistics-dashboard/lib/cases/pipelineStage.ts`
- `apps/logistics-dashboard/lib/cases/storageType.ts`

---

## 구현 순서

### 1단계

- 공통 helper 작성
- `PipelineStage` 타입 확장
- `CasesSummary` 타입 확장
- `/api/cases/summary` 5버킷 집계 반영
- `/api/cases`에 `stage`, `id` 파라미터 추가

### 2단계

- `FlowPipeline` 5단계 UI 적용
- pipeline 전용 하단 테이블 구현
- pipeline 행 클릭을 cargo deep link로 변경

### 3단계

- `SiteDetail` 보관유형 표시
- `AgiAlertBanner` 수치 확장
- sites pending row -> cargo drilldown 연결

### 4단계

- cargo `tab`, `caseId` URL 복원
- drawer 단건 조회 fallback 추가

### 5단계

- overview 우측 패널 `WH` 추가
- overview map POI 단일화
- ArcLayer 추가

---

## 테스트 계획

문서 검증 항목은 아래 기준으로 고정한다.

### 정적 검사

```bash
pnpm --filter @repo/logistics-dashboard typecheck
pnpm --filter @repo/logistics-dashboard lint
```

### 단위 테스트

필수 추가 테스트:

- stage 분류 helper
  - `pre-arrival`
  - `port`
  - `warehouse`
  - `mosb`
  - `site`
- storage type 정규화 helper
  - `Indoor -> Indoor`
  - `Outdoor -> Outdoor`
  - `Open Yard -> Outdoor Cov`
  - null/unknown 제외

### API 테스트

필수 확인:

- `/api/cases/summary`
  - `byStatus.port`
  - `byStatus.mosb`
  - `bySiteStorageType`
- `/api/cases`
  - `stage=port`
  - `stage=mosb`
  - `stage=site`
  - `id=<row-id>`

### 수동 UI 확인

- `/pipeline`
  - 5개 스테이지 표시
  - stage 클릭 시 하단 테이블 반영
  - cargo 필터 상태 오염 없음
- `/sites`
  - 보관유형 3버킷 표시
  - AGI 경보 수치 확장
  - pending row 클릭 시 `/cargo?tab=wh&caseId=...`
- `/cargo`
  - query param으로 탭 복원
  - `caseId`로 drawer 자동 오픈
  - 목록에 없는 케이스도 단건 조회 fallback 동작
- `/overview`
  - 중복 POI 제거
  - Arc 표시
  - 노드 색상 재분류
  - 우측 패널 `WH` 행 표시

---

## 완료 기준

이 문서는 다음 조건을 만족해야 정정 완료로 본다.

- 실제 코드/DB 필드명과 불일치하는 지시가 없다.
- `stage` 필터 계약이 명시돼 있다.
- pipeline table이 cargo 전역 필터와 분리된다고 명시돼 있다.
- drawer는 cargo 페이지에서만 열린다고 명시돼 있다.
- overview 지도 좌표 SSOT와 POI 중복 처리 규칙이 명시돼 있다.
- 테스트 계획이 `typecheck`, `lint`, helper/API/UI 검증까지 포함한다.

---

## 문서 상태

이 문서는 정정된 구현 스펙이다.

- 설계 원문: [page payout plan.md](C:/Users/jichu/Downloads/LOGI-MASTER-DASH-claude-improve-dashboard-layout-lnNFJ/page%20payout%20plan.md)
- 구현 스펙: `page payout plan_patch.md`

역할 구분:

- `page payout plan.md`는 UX/제품 설계 원본
- `page payout plan_patch.md`는 현재 코드 기준 실행 가능한 패치 명세
