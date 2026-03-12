According to a document from 2026-01-23, Supabase는 **Postgres 직접/풀링 연결**, **RLS 기반 REST API**, **Logical Replication(=CDC)**, **DB 이벤트 Webhook**을 제공하므로, Palantir Foundry/Ontology와는 “DB Pull / API Pull / CDC / Webhook Push” 4가지 패턴 중 하나로 연동하는 것이 가장 실무적입니다. ([Supabase][1])

---

## 1) ExecSummary (3–5줄)

* **운영(현장 입력/포털)**은 Supabase(Postgres+RLS+API)로, **의미/검증(Trust·SHACL·CostGuard)**은 Foundry/Ontology로 분리하면, “입력은 가볍게·검증은 강하게” 구조가 됩니다. ([Supabase][2])
* 연동은 **(A) Postgres 직접 연결**, **(B) Supabase REST API**, **(C) Logical Replication CDC**, **(D) Database Webhooks 이벤트 푸시** 중 환경/보안 제약에 맞춰 선택합니다. ([Supabase][1])
* KPI 권장: **동기화 지연 p95 ≤ 300.00s**, 검증 **p95 < 5.00s**, 문서 OCR 파이프라인은 **MeanConf≥0.92 / TableAcc≥0.98 / NumericIntegrity=1.00** 게이트로 ZERO-fail-safe.

(ENG-KR one-liner) **Operational DB ↔ Semantic Validation Layer** — 운영 DB ↔ 의미 검증 계층.

---

## 2) Schema (RDF/OWL + SHACL 요약)

### 2.1 Supabase(Postgres) 쪽 “연동 친화” 최소 스키마

Foundry/Ontology로 올릴 데이터를 Supabase에 “정규화 테이블 + 원본(JSONB)”로 같이 두면, 추후 재처리/감사에 유리합니다.

* `core_entity` (실체)

  * `entity_id uuid PK`
  * `entity_type text` (Case/Shipment/Invoice/Document/TransportEvent 등)
  * `source_system text` (e.g., “field-app”, “vendor-portal”)
  * `created_at timestamptz`, `updated_at timestamptz`

* `core_entity_key` (멀티키 아이덴티티)

  * `entity_id uuid FK`
  * `key_type text` (BL_NO, INVOICE_NO, HVDC_CODE, ROTATION_NO…)
  * `key_value text`
  * `UNIQUE(key_type, key_value)`

* `log_transport_event`

  * `event_id uuid PK`
  * `case_id uuid FK`
  * `event_ts timestamptz`
  * `location_code text`
  * `flow_code int` (0–5)
  * `qty numeric(18,2)`, `weight numeric(18,2)`, `cbm numeric(18,2)`
  * `raw_payload jsonb` (원본 이벤트)

* `doc_registry`

  * `doc_id uuid PK`
  * `doc_type text` (CI/PL/BL/Invoice/DO 등)
  * `doc_hash text` (sha256 등)
  * `storage_ref text`
  * `extraction jsonb` (OCR 결과)
  * `mean_conf numeric(4,2)`, `table_acc numeric(4,2)`, `numeric_integrity numeric(4,2)`

### 2.2 Foundry/Ontology 쪽 핵심 제약(요약)

* **Flow Code 0–5 범위 + 목적지/경유(MOSB) 규칙**은 문서/이벤트에서 추출된 값으로 교차검증.
* **Invoice 검증**: `EA×Rate=Amount(±0.01)`, `Σ라인=Invoice Total(±2.00%)` 같은 회계 정합 규칙을 SHACL/집계로 강제.

---

## 3) Integration (Foundry↔Supabase 연계 포인트)

아래 4개 중 **하나만 선택**해도 되고, 보통은 **(A)+(D)** 또는 **(B)+(D)** 조합이 가장 깔끔합니다.

### A) Foundry가 Supabase Postgres를 “직접 Pull” (권장: 내부 분석/대량 적재)

* Supabase는 **직접 연결(connection string)** 을 제공하며, 장시간 유지되는 서버/컨테이너에 적합하다고 명시합니다. ([Supabase][1])
* 실무 포인트

  * **Read-only DB Role** 생성 → `SELECT` 최소권한
  * 증분 적재: `updated_at` + 단조 증가 PK(또는 `event_ts`) 인덱스
  * 네트워크 제약(IPv6/방화벽 등)이 있으면 Supabase 문서에서 언급하는 연결 옵션(예: pooler/세션 모드)을 고려 ([Supabase][1])

> Foundry 쪽 구체 메뉴/커넥터명은 인스턴스별 차이가 있으니, 원칙은 “JDBC/SQL 가능한 커넥터면 Postgres로 Pull”입니다.

### B) Foundry가 Supabase “REST API로 Pull” (권장: 네트워크/권한 제약이 강한 경우)

* Supabase는 DB 스키마 기반으로 **자동 생성 REST API**를 제공하며, API는 **RLS(Row Level Security)와 연동**되도록 설계돼 있다고 설명합니다. ([Supabase][3])
* 실무 포인트

  * **서비스 간 연동**은 RLS를 우회하는 키를 무조건 쓰기보다, 서버 사이드에서만 제한적으로 사용(아래 Compliance 참고)
  * 데이터 페이지네이션/필터 기준(예: `updated_at >= last_cursor`)을 표준화

### C) CDC(변경데이터캡처) — Supabase Logical Replication → Foundry 스트리밍 적재

* Supabase 문서에 **Logical replication 출력 포맷이 pgoutput, wal2json** 형태라고 명시합니다. ([Supabase][4])
* 또한 Realtime 아키텍처가 **replication slot을 획득**해 WAL을 스트리밍한다고 설명합니다. ([Supabase][5])
* 실무 포인트

  * “Outbox 테이블”을 두고(INSERT/UPDATE 이벤트를 outbox에 적재) → CDC 소비자가 outbox만 읽도록 하면 스키마 변경/잡음이 줄어듭니다.
  * CDC는 운영 난이도가 급상승하므로(모니터링/재시도/중복제거), 운영 성숙도가 낮으면 (A)나 (D)로 시작하는 편이 안전합니다. (이 부분은 일반적 아키텍처 판단)

### D) 이벤트 기반 — Supabase Database Webhooks → Foundry 파이프라인 트리거

* Supabase **Database Webhooks**는 테이블 이벤트 `INSERT/UPDATE/DELETE` 발생 후 외부 시스템으로 페이로드를 보낼 수 있다고 명시합니다. ([Supabase][6])
* 실무 포인트

  * Webhook payload에는 최소 `table`, `pk`, `operation`, `occurred_at`만 넣고, 실제 데이터는 (A) 또는 (B)로 재조회(“thin webhook, fat pull”)하면 재처리/재시도에 강합니다.

---

## 4) Validation (SPARQL/RAG/Human-gate)

### 4.1 Supabase(운영DB) 레벨

* **Postgres CHECK/UNIQUE/FK**로 “형식 오류”를 1차 차단

  * 예: `flow_code BETWEEN 0 AND 5`
  * 예: `UNIQUE(key_type, key_value)`로 멀티키 중복 방지
* RLS로 “데이터 접근 범위” 제한 (아래 Compliance)

### 4.2 Foundry/Ontology(신뢰/검증) 레벨

* SHACL로 **수치/합계/교차문서 일치성** 강제:

  * `EA×Rate=Amount(±0.01)`
  * `Σ라인=Invoice Total(±2.00%)`

* OCR/문서 파이프라인은 KPI 게이트(MeanConf≥0.92 등) 미달 시 ZERO-fail-safe로 중단.

### 4.3 Human-gate(필수)

* **고가/규제/불일치** 케이스는 HITL 승인:

  * 예: FANR/MOIAT 관련 문서 누락, Invoice 합계 불일치 등

---

## 5) Compliance (Incoterms/MOIAT/FANR/DCD/ADNOC + 보안)

Supabase 연동에서 가장 흔한 사고는 “키 관리”입니다.

* Supabase의 **RLS는 Postgres 원시 기능**으로, 외부 툴/제3자 접근에서도 방어선을 제공한다고 설명합니다. ([Supabase][2])
* Supabase **service_role 키는 프로젝트 데이터에 full access**이며 **BYPASSRLS**로 RLS 정책을 건너뛴다고 명시돼 있으므로, **절대 클라이언트(브라우저/모바일)에 넣지 말고 서버 보관**이 원칙입니다. ([Supabase][7])
* API가 RLS 기반으로 동작하도록 설계돼 있으며, 정책(Policies)로 통제한다고 안내합니다. ([Supabase][3])

HVDC/UAE 규정 관점에서는:

* **FANR/MOIAT/DCD/ADNOC 관련 증빙 문서**는 “원본 저장소 + 해시(무결성) + 접근통제(RLS/역할)” 3요소를 함께 운영하는 쪽이 감사 대응이 쉽습니다(문서 해시/증빙 트레일은 내부 LDG/Trust Layer 접근과 정합).

---

## 6) Options ≥3 (Pros/Cons/Cost/Risk/Time)

| 옵션       | 방식                            | Pros                    | Cons                  | Risk                      |
| -------- | ----------------------------- | ----------------------- | --------------------- | ------------------------- |
| Option 1 | **DB Pull** (Postgres 직접 연결)  | 대량 적재/재처리 용이, 단순        | 네트워크/방화벽·연결수 관리 필요    | 연결/권한 설계 미흡 시 과다 권한       |
| Option 2 | **API Pull** (Supabase REST)  | 네트워크 제약 완화, RLS 적용 쉬움   | 대량 적재 성능/페이지네이션 설계 필요 | service_role 오용 시 데이터 노출  |
| Option 3 | **Webhook Push + Thin Pull**  | 이벤트 기반, 즉시성↑, 재시도 구조 깔끔 | 운영 설계(재시도/중복제거) 필요    | 웹훅 실패 시 누락 위험(보완: outbox) |
| Option 4 | **CDC** (Logical Replication) | 준실시간·정합, 변경 추적 강함       | 운영 난이도 최고             | 슬롯/오프셋/재처리 관리 실패 시 장애     |

(근거: Supabase는 직접 연결, RLS 기반 API, replication, DB Webhooks를 공식 문서로 제공) ([Supabase][1])

---

## 7) Roadmap (Prepare→Pilot→Build→Operate→Scale + KPI)

* **Prepare**: Supabase 테이블(운영) ↔ Ontology 클래스(의미) 매핑표 확정, 멀티키 규격(키 타입/포맷) 확정
* **Pilot**: (A) 또는 (B)로 1개 도메인(예: TransportEvent)만 end-to-end 적재 + SHACL 1차 룰 적용
* **Build**: Webhook(outbox) 추가, 문서/OCR 결과까지 확장, CostGuard/FlowCode 교차검증 룰 확장
* **Operate**: 모니터링(적재 지연, 실패 재시도, 데이터 품질 FAIL율), HITL 큐 운영
* **Scale**: 도메인 확장(Invoice/PortOps/Warehouse), 정책/규정 업데이트 자동화(RAG 근거 포함)

KPI 예시(권장):

* 동기화 지연 p95 ≤ **300.00s**
* 검증 p95 < **5.00s**
* NumericIntegrity = **1.00**(문서/비용 핵심)

---

## 8) Automation notes (RPA/LLM/Sheets/TG hooks)

* **Supabase Database Webhooks**로 `INSERT/UPDATE/DELETE` 이벤트 발생 시 → Foundry 파이프라인 트리거(또는 큐 적재) ([Supabase][6])
* 파이프라인 내에서 **SHACL 검증 FAIL**이면 즉시 ZERO 처리(중단 로그 + 보완요청 티켓)

---

## 9) QA checklist & Assumptions

가정:

* Supabase를 “운영 입력/포털”로 쓰고, Foundry/Ontology를 “검증/정합/리포팅” 계층으로 둔다.
* 네트워크/보안 정책상 Supabase DB 직접 연결이 불가할 수 있다(이 경우 Option 2/3 선택).

체크리스트:

* [ ] Supabase **service_role 키**가 클라이언트에 노출되지 않는가? ([Supabase][7])
* [ ] RLS 정책이 “업무 단위(현장/벤더/케이스)”로 정확히 분리되는가? ([Supabase][2])
* [ ] 멀티키(Invoice/BL/HVDC Code 등) 유일성/정규화 규칙이 있는가?
* [ ] Foundry 측 SHACL에서 합계/수치/교차문서 검증이 걸리는가?
* [ ] Webhook/CDC 선택 시 재시도·중복제거·재처리 전략(outbox/cursor)이 정의됐는가?

---

## 10) CmdRec (1–3)

* **/switch_mode LATTICE** — Supabase→Ontology 적재 후 정합성(필드/단위/키) 검증 파이프라인 모드
* **/logi-master report --deep** — 연동 후 “문서/이벤트/비용” 교차검증 리포트 생성(FAIL 원인까지)
* **/logi-master invoice-audit --AEDonly** — Supabase에서 들어온 청구 데이터를 COST-GUARD 기준으로 라인별 Δ% 산출

---

### 참고(내부 온톨로지/검증 설계 연결 문서)

*  (LDG/OCR·Trust Layer·Flow Code 검증 구조)
*  (Port Ops/Invoice 검증 규칙, EA×Rate/ΣTotals 등)

원하시면, 현재 Supabase에 **이미 존재하는 테이블 목록(스키마 덤프)** 기준으로 “Supabase 테이블 → Ontology 클래스/속성 매핑표(컬럼 단위)”를 바로 만들어 드리겠습니다.

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres?utm_source=chatgpt.com "Connect to your database | Supabase Docs"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[3]: https://supabase.com/docs/guides/api?utm_source=chatgpt.com "REST API | Supabase Docs"
[4]: https://supabase.com/docs/guides/database/replication?utm_source=chatgpt.com "Database Replication | Supabase Docs"
[5]: https://supabase.com/docs/guides/realtime/architecture?utm_source=chatgpt.com "Realtime Architecture | Supabase Docs"
[6]: https://supabase.com/docs/guides/database/webhooks?utm_source=chatgpt.com "Database Webhooks | Supabase Docs"
[7]: https://supabase.com/docs/guides/api/api-keys?utm_source=chatgpt.com "Understanding API keys | Supabase Docs"
