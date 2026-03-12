According to a document from **2025-01-08**, 현재 구성은 **HVDC_STATUS → Supabase(대시보드) / Ontology(TTL) / Flow Code**가 동시에 돌아가야 하므로, “스크립트 실행”의 핵심은 **컬럼 스펙 SSOT(단일 진실원천) + 스키마 패치(사이트 도착일) + used_cols 감사 로그**를 레포 구조로 고정하는 것입니다.

---

## ExecSummary (3–5L)

* **SHU2/MIR3/DAS4/AGI5 = 현장 도착일(Site Arrival Date)**이 확정된 만큼, 온톨로지에 **Date 속성(4개 site-specific + 1개 generic)**을 추가하고 기존 Boolean(hvdc:hasSiteArrival)은 **파생값**으로 유지해야 **Flow Code 5 / OTIF / 현장 리드타임**이 막히지 않습니다. (Add Site Arrival Date properties; keep boolean derived.)
* **컬럼명 변동(예: “DSV Indoor Indoor”)**과 부분매칭 리스크를 없애려면, 창고/사이트/alias를 **configs/columns.hvdc_status.json**으로 분리해 **JSON→TTL, 분석 리포트, (선택) Supabase 업서트**가 동일 규칙으로 동작하도록 고정해야 합니다. (SSOT column spec across all pipelines.)
* 대시보드에서는 **worklist API(/api/worklist)** 및 “현재 위치 추정 로직”이 **SHU2/MIR3/DAS4/AGI5**를 직접 사용하므로, 해당 필드가 TTL/DB에 모두 살아 있어야 합니다. (Dashboard depends on these fields.)
* 아래에 **레포 구조 + 패치 TTL + SHACL 게이트 + 실행 스캐폴드 ZIP**까지 같이 제공합니다. (Provided scaffold ZIP.)

---

## Schema (RDF/OWL + SHACL 요약)

### 1) 왜 “unionOf/equivalentProperty” 대신 “Generic + subPropertyOf + ETL materialize”인가

* 사용자가 제안한 `owl:equivalentProperty` + `owl:unionOf` 형태는 **프로퍼티 수준에서 의도대로 동작하기 어렵고**, 실제 운영(대시보드/집계)에서는 **reasoner가 없거나 제한**될 가능성이 큽니다.
* 따라서 **(a) generic 속성 1개 + (b) site-specific 4개**를 두고, **ETL에서 generic을 항상 materialize(실제 값으로 채움)** 하는 방식이 가장 안정적입니다.

### 2) 권장 TTL 패치 (핵심 요지만 발췌)

* 파일로는 `models/ttl/schema/patches/2026-01-23_site-arrival.ttl`로 분리 관리(패치 단위)하는 구성이 운영에 유리합니다. (패치 파일은 아래 스캐폴드에 포함)

```turtle
# Generic
hvdc:hasSiteArrivalDate a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:date .

# Specific (source-column aligned)
hvdc:hasSHUArrivalDate rdfs:subPropertyOf hvdc:hasSiteArrivalDate .
hvdc:hasMIRArrivalDate rdfs:subPropertyOf hvdc:hasSiteArrivalDate .
hvdc:hasDASArrivalDate rdfs:subPropertyOf hvdc:hasSiteArrivalDate .
hvdc:hasAGIArrivalDate rdfs:subPropertyOf hvdc:hasSiteArrivalDate .

# Derived convenience
hvdc:hasSiteArrival a owl:DatatypeProperty ; rdfs:range xsd:boolean .
```

### 3) 이벤트 기반(StockEvent) 병행 이유

운영 문서에서도 **Warehouse 컬럼과 Site 컬럼을 분리(“2-track date model”)**하여 추적성과 KPI 계산을 보장하는 방향이 정리되어 있습니다.
또한 대시보드 payload/현재 위치 추정 로직은 **각 위치별 날짜를 이벤트처럼 해석**합니다(예: SHU2/MIR3/DAS4/AGI5 포함).

---

## Integration (Foundry/Ontology ↔ ERP/WMS/ATLP/Invoice ↔ Supabase)

### 1) JSON → Ontology(TTL) 매핑 (Site Arrival Date)

* **JSON 필드**

  * `SHU2, MIR3, DAS4, AGI5` = “프로젝트 사이트 도착일”로 사용
* **Ontology 속성**

  * `hvdc:hasSHUArrivalDate` ← SHU2
  * `hvdc:hasMIRArrivalDate` ← MIR3
  * `hvdc:hasDASArrivalDate` ← DAS4
  * `hvdc:hasAGIArrivalDate` ← AGI5
  * `hvdc:hasSiteArrivalDate` = (ETL에서) **최종 목적지 기준 1개로 materialize** 권장

### 2) JSON → Supabase 매핑 (대시보드용 SSOT)

Supabase 매핑 스펙에 따르면 `warehouse_inventory`에 아래 컬럼들이 존재하며, **“project sites 도착/출발 날짜”**로 정의되어 있습니다.

* `warehouse_inventory.project_shu2`  ← SHU2
* `warehouse_inventory.project_mir3`  ← MIR3
* `warehouse_inventory.project_das4`  ← DAS4
* `warehouse_inventory.project_agi5`  ← AGI5

즉, **온톨로지 스키마 확장(사이트 도착일) + Supabase 컬럼 매핑**이 같이 맞물려야 **대시보드/리포트가 동시에 정합**됩니다.

### 3) 대시보드 API/구조 연결 포인트

* Next.js 프로젝트 구조는 `app/api/worklist/route.ts` 기반으로 API를 제공하는 것으로 문서에 명시되어 있습니다.
* 시스템 아키텍처 문서에서도 `/api/worklist` 응답 구조와 Dubai TZ 처리 등 동작이 정리되어 있습니다.

---

## Validation (SPARQL/RAG/Human-gate)

### 1) SHACL 게이트 (최소 3종)

* `hasSiteArrivalDate` datatype = `xsd:date`
* `hasSiteArrival(Boolean)` ↔ `hasSiteArrivalDate` 존재 여부 일치
* **AGI/DAS** 목적지는 **Flow ≥ 3**(MOSB leg 필수) 위반 탐지

  * 이 규칙은 Flow Code 산출 로직/문서에도 명시적으로 존재합니다.

(스캐폴드에 `rules/shacl/hvdc-quality-gates.ttl`로 포함)

### 2) 운영 점검용 SPARQL (예시)

**(a) MOSB는 있는데 Site Arrival Date가 없는 케이스(Flow 5 후보)**
Flow 5의 대표 상황으로 “MOSB 도착했으나 Site 미할당”이 운영 문서에 명시되어 있어, 이 리스트는 **주간 액션 큐**로 바로 쓸 수 있습니다.

```sparql
PREFIX hvdc: <http://samsung.com/project-logistics#>
SELECT ?case ?mosb
WHERE {
  ?case a hvdc:Case .
  ?case hvdc:hasInboundEvent ?e .
  ?e hvdc:hasLocationAtEvent "MOSB" ;
     hvdc:hasEventDate ?mosb .
  FILTER NOT EXISTS { ?case hvdc:hasSiteArrivalDate ?d . }
}
```

**(b) AGI/DAS 목적지인데 Flow < 3** (강제 MOSB 위반)

```sparql
PREFIX hvdc: <http://samsung.com/project-logistics#>
SELECT ?case ?loc ?fc
WHERE {
  ?case hvdc:hasFinalLocation ?loc ;
        hvdc:hasFlowCode ?fc .
  FILTER(STR(?loc) IN ("AGI","DAS"))
  FILTER(xsd:integer(?fc) < 3)
}
```

### 3) used_cols 감사 로그 (부분매칭/컬럼명 변경 방어)

* 변환 실행 시 `output/ttl/*.used_cols.json`에 **실제로 매칭되어 사용된 컬럼 목록**을 남기면, 컬럼명 변경/오매칭이 즉시 탐지됩니다.
* 이 방식은 core framework 문서의 권장 디렉토리 구조(/models, /rules, /mappings) 및 운영 감사성 요구와도 정합합니다.

---

## Compliance (Incoterms/MOIAT/FANR/DCD/ADNOC)

* 이번 변경은 **통관 규정(예: MOIAT/FANR/DCD) 자체 로직을 바꾸는 작업이 아니라**, “도착 이벤트/일자”의 **추적 가능성(traceability)**을 강화하는 성격입니다.
* 다만 Supabase 매핑 스펙에서도 **Date Validation(chronological constraints)**을 요구하고 있으므로, SHACL/ETL에서 **ETD ≤ ATD ≤ ATA** 같은 순서 검증을 “품질 게이트”로 넣는 것이 안전합니다.

---

## Options ≥3 (Pros/Cons/Cost/Risk/Effort)

| Option | 요약                                             | Pros                      | Cons                       | Risk    | Effort   |
| ------ | ---------------------------------------------- | ------------------------- | -------------------------- | ------- | -------- |
| A      | **Property-only**: Case에 `has*ArrivalDate`만 추가 | 대시보드/집계 쿼리 단순             | 이벤트 추적/감사성 약함              | Low     | Low      |
| B      | **Hybrid(권장)**: Property + `StockEvent` 병행     | OTIF/Flow/KPI + 감사성 동시 확보 | 이중 모델(속성+이벤트) 관리           | Low–Med | Med      |
| C      | **Event-only**: 모든 도착을 이벤트로만 유지                | 정규화 극대화                   | 대시보드/쿼리에서 derived 계산 부담 증가 | Med     | Med–High |

---

## Roadmap (Prepare→Pilot→Build→Operate→Scale + KPI)

* **Prepare**: 스키마 패치(사이트 도착일) + SSOT 컬럼 스펙(config) 확정

  * KPI: Schema 커버리지 **100.00%**, NumericIntegrity **1.00**
* **Pilot**: used_cols 기반으로 컬럼 매칭 누락/오매칭 0건 확인 + Flow 5 후보 리스트 산출

  * KPI: hasSiteArrival 불일치 **0.00**
* **Build**: SHACL 게이트 배포 + 리포트/대시보드에서 `Site Arrival Date` 필드 소비 고정

  * KPI: OTIF 산출 커버리지 목표 **≥95.00%**
* **Operate**: 주간 배치 실행 + Flow 5(“MOSB 있으나 Site 없음”) 자동 알림

  * KPI: Flow 5 조치 완료율 목표 **≥90.00%**
* **Scale**: Foundry Ontology Object/Action로 연결(Worklist/Exception queue)

---

## Automation notes (RPA/LLM/Sheets/TG hooks)

* **주간 배치**: `used_cols.json`을 지난 실행본과 diff → 컬럼명 변경/신규 컬럼 자동 탐지(운영 리스크 조기 감지).
* **대시보드 연계**: `/api/worklist`가 반환하는 WorklistItem 구조 및 Dubai TZ 처리 요건을 고정(서버/ETL timezone 일관성 유지).
* **현장 액션 큐**: Flow 5 후보(“MOSB 있음 + Site 없음”)은 담당자에게 자동 발송(메일/Teams/Telegram 등).

---

## QA checklist & Assumptions(가정:)

### QA 체크리스트

1. `SHU2/MIR3/DAS4/AGI5`가 들어오면 TTL에 **site-specific + generic**이 모두 생성되는가
2. `hasSiteArrival(Boolean)`이 날짜 존재 여부와 **항상 일치**하는가
3. `Final_Location ∈ {AGI,DAS}`인데 Flow < 3인 레코드가 **0건**인가(오버라이드/경고)
4. `output/ttl/*.used_cols.json`에 **실제 사용 컬럼**이 남고, “DSV Indoor Indoor” 같은 실컬럼이 잡히는가
5. 대시보드 “현재 위치 추정”에 SHU2/MIR3/DAS4/AGI5가 반영되는가

### 가정:

* SHU2/MIR3/DAS4/AGI5 값은 `YYYY-MM-DD` 또는 파싱 가능한 문자열이며, `"O"`, `"0"` 등은 미도착(null)로 정규화한다.
* `warehouse_inventory.project_shu2` 등 Supabase 컬럼은 매핑 스펙대로 존재한다.

---

## 실행 가능한 “파일 구성” 제공

### 1) 스캐폴드 ZIP 다운로드

아래 ZIP에는 **권장 디렉토리 구조(/models /rules /mappings /scripts)**, Site Arrival 스키마 패치 TTL, SHACL 게이트, JSON→TTL/리포트 스크립트가 포함되어 있습니다.

[Download the scaffold](sandbox:/mnt/data/logiontology_scaffold_2026-01-23.zip)

### 2) 스캐폴드가 반영한 레포 구조 핵심

* core framework 문서에서 권장하는 `/models`, `/rules`, `/mappings` 패턴을 그대로 따릅니다.
* `configs/columns.hvdc_status.json`을 SSOT로 두고, 모든 스크립트가 이를 로드하도록 구성했습니다.

---

## CmdRec (1–3)

* `/switch_mode LATTICE + /logi-master report --deep`
* `/logi-master kpi-dash --KRsummary`
* `/logi-master invoice-audit --AEDonly`

---

## 참고 파일(링크)

*
*
*
*
