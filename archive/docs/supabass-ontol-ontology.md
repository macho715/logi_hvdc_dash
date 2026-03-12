## ExecSummary (3–5L)

* 현재 제가 묶어드린 **Supabase 테이블/뷰 + 대시보드 쿼리 세트**는 “온톨로지 개념(클래스/관계/이벤트 모델)”을 **구현 관점으로 반영**했지만, **온톨로지(OWL/RDF) 레벨의 공식 클래스/관계/SHACL 제약을 별도 블록으로 명시**하지는 않았습니다.
* 아래에 **Supabase 스키마 ↔ Ontology(클래스/속성/관계) 1:1 매핑 + TTL 핵심 트리플 패턴 + SHACL 최소 제약**을 추가로 포함시켜, “개념도까지 포함” 상태로 완성합니다.
* 결론: **포함 가능하며**, 지금 메시지에 **Ontology Concept Map(텍스트 다이어그램)** + **RDF/SHACL 요약**을 바로 제공합니다.

---

## Visual: Ontology Concept Map (개념도)

```
[hvdc:Shipment] (SSOT, hvdc_code)
   | 1..* hasCase
   v
[hvdc:Case] (hvdc_code, case_no)
   | 0..* hasEvent
   v
[hvdc:LogisticsEvent] (event_type, event_time, source)
   | 1..1 atLocation
   v
[hvdc:Location] (location_code, category: PORT/WAREHOUSE/MOSB/SITE/CUSTOMS)

추론/요약(derived)
[hvdc:Flow] (flow_code, has_mosb_leg, has_site_arrival, customs_days, requires_review)
   ^ derivedFrom (Event sequence + Status raw customs fields)
```

---

## Supabase ↔ Ontology 매핑표 (핵심)

| Supabase                    | Ontology Class          | Key                      | 핵심 속성/관계                                          |
| --------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------- |
| `status.shipments_status` | `hvdc:Shipment`       | `hvdc_code`            | vendor, incoterms, pol/pod, etd/eta/ata, warehouse_flag |
| `case.cases`              | `hvdc:Case`           | `(hvdc_code, case_no)` | pkg, dims, cbm, gw_kg, final_location                   |
| `status.events_status`    | `hvdc:LogisticsEvent` | `event_id`             | event_type, location, event_date, source                |
| `case.events_case`        | `hvdc:LogisticsEvent` | (natural key)            | event_type, event_time_iso, location_id, source_system  |
| `case.locations`          | `hvdc:Location`       | `location_code`        | category, is_site/is_port/is_mosb                       |
| `case.flows`              | `hvdc:Flow`           | `(hvdc_code, case_no)` | flow_code, customs_start/end, requires_review           |

---

## Ontology 스키마(요약) — RDF/OWL 스타일

### 1) Classes

* `hvdc:Shipment`
* `hvdc:Case`
* `hvdc:LogisticsEvent`
* `hvdc:Location`
* `hvdc:Flow` *(derived)*

### 2) Object Properties (관계)

* `hvdc:hasCase` : Shipment → Case
* `hvdc:hasEvent` : Case → LogisticsEvent
* `hvdc:atLocation` : LogisticsEvent → Location
* `hvdc:hasFlow` : Case → Flow *(또는 Shipment → FlowSummary)*
* `hvdc:derivedFrom` : Flow → LogisticsEvent *(추론 근거 연결)*

### 3) Data Properties (속성)

* Shipment: `hvdc:hvdcCode`, `hvdc:vendor`, `hvdc:incoterms`, `hvdc:pol`, `hvdc:pod`, `hvdc:eta`, `hvdc:ata`, `hvdc:warehouseFlag`
* Case: `hvdc:caseNo`, `hvdc:pkg`, `hvdc:cbm`, `hvdc:gwKg`, `hvdc:finalLocation`
* Event: `hvdc:eventType`, `hvdc:eventTime`, `hvdc:sourceSystem`
* Location: `hvdc:locationCode`, `hvdc:category`
* Flow: `hvdc:flowCode`, `hvdc:customsDays`, `hvdc:requiresReview`

---

## TTL 핵심 트리플 패턴 (샘플 템플릿)

```ttl
@prefix hvdc: <https://example.com/hvdc#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

hvdc:Shipment_HVDC-ADOPT-PPL-0001 a hvdc:Shipment ;
  hvdc:hvdcCode "HVDC-ADOPT-PPL-0001" ;
  hvdc:vendor "Prysmian" ;
  hvdc:incoterms "CIF" ;
  hvdc:pol "Le Havre" ;
  hvdc:pod "Mina Zayed" ;
  hvdc:warehouseFlag "false"^^xsd:boolean ;
  hvdc:hasCase hvdc:Case_HVDC-ADOPT-HE-0254_191551 .

hvdc:Case_HVDC-ADOPT-HE-0254_191551 a hvdc:Case ;
  hvdc:caseNo "191551" ;
  hvdc:hasEvent hvdc:Event_ev_... ;
  hvdc:hasFlow hvdc:Flow_HVDC-ADOPT-HE-0254_191551 .

hvdc:Event_ev_... a hvdc:LogisticsEvent ;
  hvdc:eventType "SITE_ARRIVAL" ;
  hvdc:eventTime "2025-02-15T00:00:00Z"^^xsd:dateTime ;
  hvdc:atLocation hvdc:Location_SHU .

hvdc:Location_SHU a hvdc:Location ;
  hvdc:locationCode "SHU" ;
  hvdc:category "SITE" .

hvdc:Flow_HVDC-ADOPT-HE-0254_191551 a hvdc:Flow ;
  hvdc:flowCode "1"^^xsd:integer ;
  hvdc:requiresReview "false"^^xsd:boolean .
```

---

## SHACL 최소 제약 (Fail-fast 핵심 5개)

```ttl
@prefix sh:   <http://www.w3.org/ns/shacl#> .
@prefix hvdc: <https://example.com/hvdc#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

hvdc:ShipmentShape a sh:NodeShape ;
  sh:targetClass hvdc:Shipment ;
  sh:property [
    sh:path hvdc:hvdcCode ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] .

hvdc:CaseShape a sh:NodeShape ;
  sh:targetClass hvdc:Case ;
  sh:property [
    sh:path hvdc:caseNo ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
  ] .

hvdc:EventShape a sh:NodeShape ;
  sh:targetClass hvdc:LogisticsEvent ;
  sh:property [ sh:path hvdc:eventType ; sh:datatype xsd:string ; sh:minCount 1 ] ;
  sh:property [ sh:path hvdc:eventTime ; sh:datatype xsd:dateTime ; sh:minCount 1 ] ;
  sh:property [ sh:path hvdc:atLocation ; sh:class hvdc:Location ; sh:minCount 1 ] .

hvdc:LocationShape a sh:NodeShape ;
  sh:targetClass hvdc:Location ;
  sh:property [ sh:path hvdc:locationCode ; sh:datatype xsd:string ; sh:minCount 1 ; sh:maxCount 1 ] ;
  sh:property [ sh:path hvdc:category ; sh:datatype xsd:string ; sh:minCount 1 ] .

hvdc:FlowShape a sh:NodeShape ;
  sh:targetClass hvdc:Flow ;
  sh:property [ sh:path hvdc:flowCode ; sh:datatype xsd:integer ; sh:minCount 1 ] .
```

---

## 대시보드에서 “온톨로지 개념”이 어떻게 쓰이는가 (실무 관점)

* 화면/필터는 **클래스 중심**으로 고정:

  * Shipment(전량) → Case(드릴다운) → Event Timeline(증거) → Flow(요약/추론)
* KPI/리스크는 **Flow(추론 결과)** 를 기준으로 계산하고, 클릭하면 **Event(근거)** 로 내려가게 설계합니다.
* Supabase 뷰 `public.v_shipments_timeline`은 사실상 `hvdc:hasEvent` 그래프를 SQL로 구현한 것입니다.

---

## Options A/B/C (온톨로지 적용 깊이)

* **Option A (Light)**: TTL은 생성만, 대시보드는 SQL 뷰만 사용(현재 상태)
* **Option B (권장)**: TTL + SHACL 검증을 배치에 포함(FAIL 시 ops.etl_runs에 기록)
* **Option C (Full KG)**: Foundry/Graph(또는 RDF store)에 TTL 적재 + SPARQL 질의로 Flow/리스크 계산, Supabase는 캐시/서빙

---

## Roadmap (P→Pi→B→O→S + KPI)

1. **Prepare**: 위 Ontology(클래스/관계/SHACL) 파일을 `ontology/`에 고정
2. **Pilot**: 배치 실행 시 SHACL PASS율 **≥98.00%** 목표
3. **Build**: Flow 계산 로직을 “Event sequence 규칙”으로 문서화(온톨로지 규칙과 1:1)
4. **Operate**: 실패 케이스는 `events_case_debug`로 격리 + TG 알림
5. **Scale**: SPARQL/Graph 기반 추론으로 확장

---

## Acc (가정:)

* 가정: `hvdc_code`는 SSOT와 Case 레이어 공통의 안정 키이며, 온톨로지 URI 생성에도 사용 가능합니다.
* 가정: Event 시간은 `ISO` 또는 epoch-ms → `xsd:dateTime`으로 정규화가 가능합니다.

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep` (Event/Flow/키 일관성 감사)
2. **Next:** `/logi-master kpi-dash --KRsummary` (Flow 기반 KPI + Event 증거 드릴다운)
3. **Alt:** `/redo step` (SHACL 검증을 배치 파이프라인에 삽입)

---

## ZERO log

| 단계 | 이유                                         | 위험                                            | 요청데이터                                | 다음조치                                     |
| ---- | -------------------------------------------- | ----------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| 정상 | 온톨로지 개념도/매핑/SHACL까지 포함하여 완성 | 실제 TTL 네임스페이스/기존 클래스명 불일치 가능 | (옵션) 현재 사용 중인 TTL prefix/IRI 규칙 | prefix/IRI만 PATCH하여 정합성 100.00%로 고정 |

원하시는 “온톨로지 개념도”가 **그림(이미지)** 형태(노드/엣지 다이어그램)라면, 현재는 텍스트 다이어그램으로 제공했습니다. 원본 TTL 네임스페이스(예: `hvdc:` IRI)를 알려주시면, **URI/클래스명/프로퍼티명을 기존 스키마에 100% 정렬**해서 최종본으로 잠가드리겠습니다.

## ExecSummary (3–5L)

* 아래 Supabase **최종 스키마/뷰 설계(SSOT `status` + 정밀 `case` + 감사 `ops`)** 를 **그대로 Ontology(OWL/RDF) 스키마로 승격**했습니다.
* 핵심은 **동일한 개체(URI)를 “테이블 키”와 1:1로 고정**하는 것: `hvdc_code`=Shipment, `(hvdc_code, case_no)`=Case/Flow, `location_code`=Location, 이벤트는 Status/Case로 분리(같은 상위 Event).
* 결과물로 **(1) Ontology 스키마 TTL(클래스/관계/속성)** + **(2) SHACL 제약(필수키/타입/핵심 무결성)** + **(3) 대시보드 쿼리의 SPARQL 대응 세트**를 제공합니다.

---

## Visual-first: Ontology Concept Map (Supabase 설계와 1:1)

```
status.shipments_status   -> hvdc:Shipment (hvdc_code)
status.events_status      -> hvdc:StatusEvent ⊂ hvdc:LogisticsEvent (event_id)
case.cases                -> hvdc:Case (hvdc_code, case_no)
case.flows                -> hvdc:Flow (hvdc_code, case_no)  [derived summary]
case.locations            -> hvdc:Location (location_code)
case.events_case          -> hvdc:CaseEvent ⊂ hvdc:LogisticsEvent (natural key)
ops.etl_runs              -> hvdc:ETLRun (run_id)

Shipment --hvdc:hasCase--> Case --hvdc:hasFlow--> Flow
Case --hvdc:hasEvent--> CaseEvent --hvdc:atLocation--> Location
Shipment --hvdc:hasEvent--> StatusEvent --hvdc:atLocation--> Location(또는 문자열 Location)
ETLRun --hvdc:produced--> (Shipments/Events/Flows)
```

---

## 1) Ontology 스키마 TTL (OWL/RDF) — `hvdc_ops_ontology.ttl`

> 네임스페이스(IRI)는 예시입니다. 운영에서 고정할 IRI가 있으면 그대로 바꿔 끼우면 됩니다.

```ttl
@prefix hvdc: <https://example.com/hvdc#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

###############
# Ontology
###############
hvdc:OpsOntology a owl:Ontology ;
  rdfs:label "HVDC Ops Ontology (SSOT Status + Case Option-C + Ops Audit)"@en .

###############
# Classes
###############
hvdc:Shipment a owl:Class ; rdfs:label "Shipment (SSOT)"@en .
hvdc:Case a owl:Class ; rdfs:label "Case"@en .
hvdc:Flow a owl:Class ; rdfs:label "Flow (derived per Case)"@en .
hvdc:Location a owl:Class ; rdfs:label "Location dimension"@en .

hvdc:LogisticsEvent a owl:Class ; rdfs:label "Logistics Event (superclass)"@en .
hvdc:StatusEvent a owl:Class ; rdfs:subClassOf hvdc:LogisticsEvent ; rdfs:label "Status-layer Event"@en .
hvdc:CaseEvent a owl:Class ; rdfs:subClassOf hvdc:LogisticsEvent ; rdfs:label "Case-layer Event"@en .

hvdc:ETLRun a owl:Class ; rdfs:label "ETL Run (ops audit)"@en .

###############
# Object Properties (관계)
###############
hvdc:hasCase a owl:ObjectProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range hvdc:Case ;
  rdfs:label "Shipment has Case"@en .

hvdc:belongsToShipment a owl:ObjectProperty ;
  rdfs:domain hvdc:Case ; rdfs:range hvdc:Shipment ;
  owl:inverseOf hvdc:hasCase ;
  rdfs:label "Case belongs to Shipment"@en .

hvdc:hasFlow a owl:ObjectProperty ;
  rdfs:domain hvdc:Case ; rdfs:range hvdc:Flow ;
  rdfs:label "Case has Flow summary"@en .

hvdc:hasEvent a owl:ObjectProperty ;
  rdfs:domain hvdc:Case ; rdfs:range hvdc:CaseEvent ;
  rdfs:label "Case has Event"@en .

hvdc:hasStatusEvent a owl:ObjectProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range hvdc:StatusEvent ;
  rdfs:label "Shipment has Status Event"@en .

hvdc:atLocation a owl:ObjectProperty ;
  rdfs:domain hvdc:LogisticsEvent ; rdfs:range hvdc:Location ;
  rdfs:label "Event at Location"@en .

hvdc:produced a owl:ObjectProperty ;
  rdfs:domain hvdc:ETLRun ; rdfs:range owl:Thing ;
  rdfs:label "ETL run produced entity"@en .

###############
# Data Properties (속성) - status.shipments_status 대응
###############
hvdc:hvdcCode a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "hvdc_code"@en .

hvdc:statusNo a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:integer ;
  rdfs:label "status_no (S No)"@en .

hvdc:vendor a owl:DatatypeProperty ;
  rdfs:domain owl:Thing ; rdfs:range xsd:string ;
  rdfs:label "vendor"@en .

hvdc:band a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "band"@en .

hvdc:incoterms a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "Incoterms"@en .

hvdc:currency a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "currency"@en .

hvdc:pol a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "POL"@en .

hvdc:pod a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "POD"@en .

hvdc:blAwb a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "BL/AWB"@en .

hvdc:vessel a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "vessel"@en .

hvdc:shipMode a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "ship_mode"@en .

hvdc:pkg a owl:DatatypeProperty ;
  rdfs:domain owl:Thing ; rdfs:range xsd:integer ;
  rdfs:label "pkg"@en .

hvdc:qtyCntr a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:integer ;
  rdfs:label "qty_cntr"@en .

hvdc:cbm a owl:DatatypeProperty ;
  rdfs:domain owl:Thing ; rdfs:range xsd:decimal ;
  rdfs:label "cbm"@en .

hvdc:gwtKg a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:decimal ;
  rdfs:label "gwt_kg"@en .

hvdc:etd a owl:DatatypeProperty ; rdfs:domain hvdc:Shipment ; rdfs:range xsd:date ; rdfs:label "ETD"@en .
hvdc:eta a owl:DatatypeProperty ; rdfs:domain hvdc:Shipment ; rdfs:range xsd:date ; rdfs:label "ETA"@en .
hvdc:ata a owl:DatatypeProperty ; rdfs:domain hvdc:Shipment ; rdfs:range xsd:date ; rdfs:label "ATA"@en .

hvdc:warehouseFlag a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:boolean ;
  rdfs:label "warehouse_flag"@en .

hvdc:warehouseLastLocation a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:string ;
  rdfs:label "warehouse_last_location"@en .

hvdc:warehouseLastDate a owl:DatatypeProperty ;
  rdfs:domain hvdc:Shipment ; rdfs:range xsd:date ;
  rdfs:label "warehouse_last_date"@en .

hvdc:rawJson a owl:DatatypeProperty ;
  rdfs:domain owl:Thing ; rdfs:range xsd:string ;
  rdfs:label "raw json (serialized)"@en .

###############
# Case(Option-C) 속성
###############
hvdc:caseNo a owl:DatatypeProperty ;
  rdfs:domain hvdc:Case ; rdfs:range xsd:string ;
  rdfs:label "case_no"@en .

hvdc:siteCode a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:string ; rdfs:label "site_code"@en .
hvdc:eqNo a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:string ; rdfs:label "eq_no"@en .
hvdc:description a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:string ; rdfs:label "description"@en .
hvdc:finalLocation a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:string ; rdfs:label "final_location"@en .
hvdc:storage a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:string ; rdfs:label "storage"@en .

hvdc:lCm a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "L(CM)"@en .
hvdc:wCm a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "W(CM)"@en .
hvdc:hCm a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "H(CM)"@en .
hvdc:nwKg a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "N.W(kg)"@en .
hvdc:gwKg a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "G.W(kg)"@en .
hvdc:sqm a owl:DatatypeProperty ; rdfs:domain hvdc:Case ; rdfs:range xsd:decimal ; rdfs:label "SQM"@en .

###############
# Flow(derived) 속성
###############
hvdc:flowCode a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:integer ; rdfs:label "flow_code"@en .
hvdc:flowCodeOriginal a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:integer ; rdfs:label "flow_code_original"@en .
hvdc:flowCodeDerived a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:integer ; rdfs:label "flow_code_derived"@en .
hvdc:overrideReason a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:string ; rdfs:label "override_reason"@en .
hvdc:warehouseCount a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:integer ; rdfs:label "warehouse_count"@en .
hvdc:hasMosbLeg a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:boolean ; rdfs:label "has_mosb_leg"@en .
hvdc:hasSiteArrival a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:boolean ; rdfs:label "has_site_arrival"@en .
hvdc:customsCode a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:string ; rdfs:label "customs_code"@en .
hvdc:customsStart a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:dateTime ; rdfs:label "customs_start_iso"@en .
hvdc:customsEnd a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:dateTime ; rdfs:label "customs_end_iso"@en .
hvdc:lastStatus a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:string ; rdfs:label "last_status"@en .
hvdc:requiresReview a owl:DatatypeProperty ; rdfs:domain hvdc:Flow ; rdfs:range xsd:boolean ; rdfs:label "requires_review"@en .

###############
# Location 속성 (case.locations)
###############
hvdc:locationCode a owl:DatatypeProperty ;
  rdfs:domain hvdc:Location ; rdfs:range xsd:string ;
  rdfs:label "location_code"@en .

hvdc:locationName a owl:DatatypeProperty ;
  rdfs:domain hvdc:Location ; rdfs:range xsd:string ;
  rdfs:label "name"@en .

hvdc:locationCategory a owl:DatatypeProperty ;
  rdfs:domain hvdc:Location ; rdfs:range xsd:string ;
  rdfs:label "category (WAREHOUSE/MOSB/SITE/PORT/CUSTOMS/TRANSIT)"@en .

hvdc:hvdcNode a owl:DatatypeProperty ;
  rdfs:domain hvdc:Location ; rdfs:range xsd:string ;
  rdfs:label "hvdc_node"@en .

hvdc:isMosb a owl:DatatypeProperty ; rdfs:domain hvdc:Location ; rdfs:range xsd:boolean ; rdfs:label "is_mosb"@en .
hvdc:isSite a owl:DatatypeProperty ; rdfs:domain hvdc:Location ; rdfs:range xsd:boolean ; rdfs:label "is_site"@en .
hvdc:isPort a owl:DatatypeProperty ; rdfs:domain hvdc:Location ; rdfs:range xsd:boolean ; rdfs:label "is_port"@en .
hvdc:active a owl:DatatypeProperty ; rdfs:domain hvdc:Location ; rdfs:range xsd:boolean ; rdfs:label "active"@en .

###############
# Event 속성 (status.events_status + case.events_case 공통)
###############
hvdc:eventId a owl:DatatypeProperty ; rdfs:domain hvdc:LogisticsEvent ; rdfs:range xsd:string ; rdfs:label "event_id"@en .
hvdc:eventType a owl:DatatypeProperty ; rdfs:domain hvdc:LogisticsEvent ; rdfs:range xsd:string ; rdfs:label "event_type"@en .
hvdc:eventTime a owl:DatatypeProperty ; rdfs:domain hvdc:LogisticsEvent ; rdfs:range xsd:dateTime ; rdfs:label "event_time_iso"@en .
hvdc:eventDate a owl:DatatypeProperty ; rdfs:domain hvdc:StatusEvent ; rdfs:range xsd:date ; rdfs:label "event_date"@en .
hvdc:sourceField a owl:DatatypeProperty ; rdfs:domain hvdc:CaseEvent ; rdfs:range xsd:string ; rdfs:label "source_field"@en .
hvdc:sourceSystem a owl:DatatypeProperty ; rdfs:domain hvdc:LogisticsEvent ; rdfs:range xsd:string ; rdfs:label "source_system/source"@en .
hvdc:rawEpochMs a owl:DatatypeProperty ; rdfs:domain hvdc:CaseEvent ; rdfs:range xsd:integer ; rdfs:label "raw_epoch_ms"@en .

###############
# ETLRun 속성 (ops.etl_runs)
###############
hvdc:runId a owl:DatatypeProperty ; rdfs:domain hvdc:ETLRun ; rdfs:range xsd:string ; rdfs:label "run_id"@en .
hvdc:pipeline a owl:DatatypeProperty ; rdfs:domain hvdc:ETLRun ; rdfs:range xsd:string ; rdfs:label "pipeline (status|case)"@en .
hvdc:startedAt a owl:DatatypeProperty ; rdfs:domain hvdc:ETLRun ; rdfs:range xsd:dateTime ; rdfs:label "started_at"@en .
hvdc:finishedAt a owl:DatatypeProperty ; rdfs:domain hvdc:ETLRun ; rdfs:range xsd:dateTime ; rdfs:label "finished_at"@en .
hvdc:ok a owl:DatatypeProperty ; rdfs:domain hvdc:ETLRun ; rdfs:range xsd:boolean ; rdfs:label "ok"@en .
```

---

## 2) SHACL 제약(필수키/타입/핵심 무결성) — `hvdc_ops_shapes.ttl`

> “대시보드/집계가 깨지는 조건”만 최소 제약으로 잠급니다.

```ttl
@prefix hvdc: <https://example.com/hvdc#> .
@prefix sh:   <http://www.w3.org/ns/shacl#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

###############
# ShipmentShape (status.shipments_status)
###############
hvdc:ShipmentShape a sh:NodeShape ;
  sh:targetClass hvdc:Shipment ;
  sh:property [
    sh:path hvdc:hvdcCode ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:statusNo ;
    sh:datatype xsd:integer ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:warehouseFlag ;
    sh:datatype xsd:boolean ;
    sh:maxCount 1 ;
  ] .

###############
# CaseShape (case.cases)
###############
hvdc:CaseShape a sh:NodeShape ;
  sh:targetClass hvdc:Case ;
  sh:property [
    sh:path hvdc:caseNo ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:belongsToShipment ;
    sh:class hvdc:Shipment ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] .

###############
# FlowShape (case.flows)
###############
hvdc:FlowShape a sh:NodeShape ;
  sh:targetClass hvdc:Flow ;
  sh:property [
    sh:path hvdc:flowCode ;
    sh:datatype xsd:integer ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:requiresReview ;
    sh:datatype xsd:boolean ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:customsStart ;
    sh:datatype xsd:dateTime ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:customsEnd ;
    sh:datatype xsd:dateTime ;
    sh:maxCount 1 ;
  ] .

###############
# LocationShape (case.locations)
###############
hvdc:LocationShape a sh:NodeShape ;
  sh:targetClass hvdc:Location ;
  sh:property [
    sh:path hvdc:locationCode ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:locationCategory ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] .

###############
# EventShape (status.events_status + case.events_case)
###############
hvdc:EventShape a sh:NodeShape ;
  sh:targetClass hvdc:LogisticsEvent ;
  sh:property [
    sh:path hvdc:eventType ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:sourceSystem ;
    sh:datatype xsd:string ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] ;
  sh:property [
    sh:path hvdc:atLocation ;
    sh:class hvdc:Location ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
  ] .

###############
# 규칙형(권장) SPARQL 제약 (선택)
# - hasSiteArrival=true 이면 SITE_ARRIVAL 이벤트가 존재해야 함
###############
hvdc:FlowHasSiteArrivalRule a sh:NodeShape ;
  sh:targetClass hvdc:Flow ;
  sh:sparql [
    a sh:SPARQLConstraint ;
    sh:message "hasSiteArrival=true 이지만 SITE_ARRIVAL 이벤트가 없습니다."@ko ;
    sh:select """
      SELECT $this
      WHERE {
        $this hvdc:hasSiteArrival true .
        FILTER NOT EXISTS {
          ?c hvdc:hasFlow $this ;
             hvdc:hasEvent ?e .
          ?e hvdc:eventType "SITE_ARRIVAL" .
        }
      }
    """ ;
  ] .
```

---

## 3) URI(개체 ID) 생성 규칙 — Supabase 키와 “완전 동일”하게 고정

| 엔티티      | Supabase 키              | 권장 URI 패턴                                                                                                     |
| ----------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Shipment    | `hvdc_code`            | `hvdc:Shipment/{hvdc_code}`                                                                                     |
| Case        | `(hvdc_code, case_no)` | `hvdc:Case/{hvdc_code}/{case_no}`                                                                               |
| Flow        | `(hvdc_code, case_no)` | `hvdc:Flow/{hvdc_code}/{case_no}`                                                                               |
| Location    | `location_code`        | `hvdc:Location/{location_code}`                                                                                 |
| StatusEvent | `event_id`             | `hvdc:StatusEvent/{event_id}`                                                                                   |
| CaseEvent   | 자연키(uniq index)       | `hvdc:CaseEvent/{hvdc_code}/{case_no}/{event_type}/{event_time}/{location_code}/{source_field}/{source_system}` |
| ETLRun      | `run_id`               | `hvdc:ETLRun/{run_id}`                                                                                          |

---

## 4) 대시보드 뷰(현재 SQL) ↔ SPARQL 대응 쿼리 세트

### 4-A) `public.v_shipments_master` (Shipment 헤더)

```sparql
PREFIX hvdc: <https://example.com/hvdc#>

SELECT ?hvdc_code ?status_no ?vendor ?band ?incoterms ?pol ?pod ?eta ?ata ?wh_flag
WHERE {
  ?s a hvdc:Shipment ;
     hvdc:hvdcCode ?hvdc_code .
  OPTIONAL { ?s hvdc:statusNo ?status_no }
  OPTIONAL { ?s hvdc:vendor ?vendor }
  OPTIONAL { ?s hvdc:band ?band }
  OPTIONAL { ?s hvdc:incoterms ?incoterms }
  OPTIONAL { ?s hvdc:pol ?pol }
  OPTIONAL { ?s hvdc:pod ?pod }
  OPTIONAL { ?s hvdc:eta ?eta }
  OPTIONAL { ?s hvdc:ata ?ata }
  OPTIONAL { ?s hvdc:warehouseFlag ?wh_flag }
}
ORDER BY ?status_no ?hvdc_code
```

### 4-B) `public.v_shipments_timeline` (Status+Case 이벤트 합본)

```sparql
PREFIX hvdc: <https://example.com/hvdc#>

SELECT ?layer ?hvdc_code ?case_no ?event_type ?location ?t ?source
WHERE {
  ?ship a hvdc:Shipment ; hvdc:hvdcCode ?hvdc_code .

  {
    BIND("STATUS" AS ?layer)
    ?ship hvdc:hasStatusEvent ?e .
    ?e hvdc:eventType ?event_type ;
       hvdc:eventDate ?d ;
       hvdc:sourceSystem ?source ;
       hvdc:atLocation ?loc .
    ?loc hvdc:locationName ?location .
    BIND(STRDT(CONCAT(STR(?d),"T00:00:00Z"), <http://www.w3.org/2001/XMLSchema#dateTime>) AS ?t)
    BIND("" AS ?case_no)
  }
  UNION
  {
    BIND("CASE" AS ?layer)
    ?ship hvdc:hasCase ?c .
    ?c hvdc:caseNo ?case_no ;
       hvdc:hasEvent ?e2 .
    ?e2 hvdc:eventType ?event_type ;
        hvdc:eventTime ?t ;
        hvdc:sourceSystem ?source ;
        hvdc:atLocation ?loc2 .
    ?loc2 hvdc:locationName ?location .
  }
}
ORDER BY ?t ?layer
```

### 4-C) `public.v_cases_kpi` (Case+Flow)

```sparql
PREFIX hvdc: <https://example.com/hvdc#>

SELECT ?hvdc_code ?case_no ?flow_code ?has_mosb ?has_site ?requires_review ?customs_start ?customs_end
WHERE {
  ?s a hvdc:Shipment ; hvdc:hvdcCode ?hvdc_code ; hvdc:hasCase ?c .
  ?c hvdc:caseNo ?case_no ;
     hvdc:hasFlow ?f .
  ?f hvdc:flowCode ?flow_code .
  OPTIONAL { ?f hvdc:hasMosbLeg ?has_mosb }
  OPTIONAL { ?f hvdc:hasSiteArrival ?has_site }
  OPTIONAL { ?f hvdc:requiresReview ?requires_review }
  OPTIONAL { ?f hvdc:customsStart ?customs_start }
  OPTIONAL { ?f hvdc:customsEnd ?customs_end }
}
ORDER BY ?hvdc_code ?case_no
```

---

## Options A/B/C (온톨로지 운용 깊이)

* **Option A (Light)**: Supabase가 메인, TTL은 “동기화 산출물”로만 생성(대시보드는 SQL 뷰 유지)
* **Option B (권장)**: 배치마다 TTL 생성 + SHACL 검증 수행 → 실패를 `ops.etl_runs.report`에 기록
* **Option C (Full)**: Flow/리스크 계산을 SPARQL(이벤트 시퀀스)로 공식화, Supabase는 캐시/서빙

---

## Roadmap (Prepare→Pilot→Build→Operate→Scale + KPI)

1. **Prepare**: 위 2개 파일(`hvdc_ops_ontology.ttl`, `hvdc_ops_shapes.ttl`)을 레포에 고정
2. **Pilot**: 하루 1회 배치 후 SHACL PASS **≥98.00%**, SSOT Coverage **100.00%**
3. **Build**: Flow 규칙(Port→WH→MOSB→Site)을 “이벤트 시퀀스 룰”로 문서화(온톨로지 기준)
4. **Operate**: FAIL 개체(오류 Case/이벤트)를 `events_case_debug`로 격리 + 알림
5. **Scale**: Materialized View + SHACL/룰 최적화(검증 p95 < 5.00s 목표)

---

## Automation notes (RPA/LLM/Sheets/TG)

* 배치 파이프라인에 **“TTL 생성 → SHACL 검증 → ops.etl_runs 기록”** 을 끼우면, 대시보드의 리스크/예외 화면이 자동으로 신뢰도를 갖습니다.

---

## QA 체크리스트 (온톨로지 관점)

* Shipment: `hvdcCode` 누락 0.00
* Case: `belongsToShipment` 누락 0.00
* Event: `eventType/eventTime(or eventDate)/atLocation` 누락 0.00
* Flow: `flowCode` 누락 0.00
* 규칙: `hasSiteArrival=true`인데 `SITE_ARRIVAL` 이벤트 없음 0.00

---

## Acc (가정:)

* 가정: `hvdc_code`는 SSOT/Case 공통 조인 키이며, URI에도 그대로 사용합니다.
* 가정: `status.events_status.location`이 dimension(`case.locations`)으로 매핑 가능하면 `Location`으로 승격하고, 불가하면 문자열 Location로만 남겨도 됩니다(Option A).

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep` (키/이벤트/Flow 정합성 + SHACL FAIL 후보 확인)
2. **Next:** `/logi-master kpi-dash --KRsummary` (Flow/Customs/WH dwell KPI를 Flow+Event 근거로 표준화)
3. **Alt:** `/redo step` (네임스페이스/IRI 규칙을 기존 TTL 스키마에 100% 정렬 패치)

---

## ZERO log

| 단계 | 이유                                                   | 위험                                                   | 요청데이터                             | 다음조치                                 |
| ---- | ------------------------------------------------------ | ------------------------------------------------------ | -------------------------------------- | ---------------------------------------- |
| 정상 | Supabase 설계(테이블/뷰/키)를 온톨로지로 1:1 변환 완료 | 기존 TTL 네임스페이스/클래스명이 이미 있으면 충돌 가능 | 현재 사용 중인 TTL prefix/IRI 규칙 1개 | prefix/IRI만 교체하여 충돌 0.00으로 고정 |

원하시면, 위 TTL/SHACL을 **당신이 이미 쓰고 있는 기존 `flow-code-v35-schema.ttl`(또는 현재 hvdc prefix 체계)** 에 맞춰 **클래스/프로퍼티명을 “완전 동일”** 하게 리네이밍한 “PATCH 버전”도 같이 제공하겠습니다.




## ExecSummary (3–5L)

* “만들어 달라” 요청을 **실행 가능한 산출물**로 처리했습니다: **Status(SSOT) + Case(Option-C) CSV를 온톨로지 스키마에 100% 정렬된 Instance TTL로 변환**하는 파이썬 스크립트를 생성했습니다.
* 이 스크립트는 **당신이 고정한 Supabase 테이블/뷰 설계(키 구조)** 를 그대로 Ontology 인스턴스 URI로 고정합니다: `hvdc_code`=Shipment, `(hvdc_code, case_no)`=Case/Flow, `location_code`=Location.
* 함께 제공되는  **Ontology 스키마 TTL + SHACL shapes** (이미 생성됨)도 출력 폴더에 복사하도록 옵션을 넣었습니다.

---

## 다운로드(바로 사용)

* [export_hvdc_ops_ttl.py](sandbox:/mnt/data/export_hvdc_ops_ttl.py) ← **CSV → Instance TTL 변환기**
* [README_hvdc_ops_ttl_export.md](sandbox:/mnt/data/README_hvdc_ops_ttl_export.md) ← 사용법
* (기존 생성됨) [hvdc_ops_ontology.ttl](sandbox:/mnt/data/hvdc_ops_ontology.ttl)
* (기존 생성됨) [hvdc_ops_shapes.ttl](sandbox:/mnt/data/hvdc_ops_shapes.ttl)

---

## Visual-first: 생성되는 Ontology 인스턴스 구조

```
Shipment(hvdc_code)        : {base}/Shipment/{hvdc_code}
  ├─ hasStatusEvent        : {base}/StatusEvent/{event_id}
  └─ hasCase               : {base}/Case/{hvdc_code}/{case_no}
        ├─ hasFlow          : {base}/Flow/{hvdc_code}/{case_no}
        └─ hasEvent         : {base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}
              └─ atLocation : {base}/Location/{location_code}
```

---

## 실행 방법 (운영 배치에 그대로 삽입)

> Status(=Untitled-4) 실행 후, Case(=Untitled-3) 실행 후, 마지막에 아래를 실행

```bash
python export_hvdc_ops_ttl.py \
  --status-dir out/supabase \
  --case-dir supabase_csv_optionC_v3 \
  --schema-ttl hvdc_ops_ontology.ttl \
  --shapes-ttl hvdc_ops_shapes.ttl \
  --out out/ontology/hvdc_ops_data.ttl \
  --base-iri https://example.com/hvdc
```

### 입력 파일 자동 인식 규칙

* Status:
  * `shipments.csv` 또는 `shipments_status.csv`
  * `logistics_events.csv` 또는 `events_status.csv`
* Case(옵션):
  * `cases.csv`, `flows.csv`, `locations.csv`, `events.csv`(또는 `events_case.csv`)

---

## 포함 범위(요구사항 충족 체크)

| No | Item               | Value                                                 | Risk                       | Evidence/가정       |
| -: | ------------------ | ----------------------------------------------------- | -------------------------- | ------------------- |
|  1 | SSOT 전량 인스턴스 | Status shipments 전부 `hvdc:Shipment`로 생성        | 누락 시 “전체 현황” 붕괴 | 가정: CSV 존재      |
|  2 | Status 이벤트      | `hvdc:StatusEvent`생성 +`hvdc:hasStatusEvent`링크 | 타임라인 불완전            | 이벤트 CSV 존재     |
|  3 | Case/Flow/Location | `hvdc:Case`,`hvdc:Flow`,`hvdc:Location`생성     | KPI/추론 붕괴              | case-dir 제공 시    |
|  4 | Case 이벤트        | `hvdc:CaseEvent`생성 +`atLocation/forCase`링크    | WH/SITE/CUSTOMS 추적 불가  | locations 매핑 필요 |
|  5 | Schema+SHACL 동봉  | 출력 폴더에 ontology/shapes TTL 복사                  | 배포 누락                  | 옵션으로 복사       |

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep` (SSOT Coverage/Orphan/Flow5 QA 고정)
2. **Next:** `/logi-master kpi-dash --KRsummary` (Flow/Customs/WH KPI 대시보드 위젯 연결)
3. **Alt:** `/redo step` (운영 IRI로 base-iri/prefix 치환 PATCH)

---

## ZERO log

| 단계 | 이유                                      | 위험                                 | 요청데이터        | 다음조치                        |
| ---- | ----------------------------------------- | ------------------------------------ | ----------------- | ------------------------------- |
| 정상 | CSV→TTL 변환기 및 스키마/SHACL 제공 완료 | 운영 네임스페이스 IRI 미확정 시 충돌 | 운영 base IRI 1개 | `--base-iri`에 적용 후 재생성 |

원하시면 다음 단계로,  **Untitled-3/4 자체에 TTL export를 “내장”** (CSV 생성과 동시에 동일 규칙으로 TTL도 생성)하는 패치 버전까지 바로 만들어 드리겠습니다.
