# HVDC Ops Option‑C ETL + TTL Export

### 개요 (3개 스크립트 + TTL Export)

- **Untitled‑3.py**  
  `hvdc_allshpt_status.json + hvdc_warehouse_status.json` → **케이스 단위(컨테이너/팔렛) Option‑C ETL**  
  (Supabase용 `shipments / cases / flows / locations / events` CSV 생성, 리포트 포함)

- **Untitled‑4.py**  
  `HVDC all status.json`(또는 `HVDC SATUS.JSON`) + `hvdc_warehouse_status.json` →  
  **선적(Status) SSOT + Warehouse Overlay**  
  (선적 단위 `shipments_status / logistics_events_status` + TTL 생성용 CSV)

- **Untitled‑5.py**  
  Untitled‑3을 정리한 **Option‑C ETL 완성본(운영용 메인)**  
  (ALL + WH (+ Customs) → Supabase CSV + 리포트 + 선택 TTL)

- **export_hvdc_ops_ttl.py + 본 README**  
  위 CSV 결과들을 **`hvdc_ops_ontology.ttl / hvdc_ops_shapes.ttl` 스키마에 맞는 인스턴스 TTL**로 내보내는 최종 단계.  
  ⇒ Supabase(SSOT) ↔ RDF/OWL(KG) 브리지.

> ⚠️ 원천 시간 필드(`ETD/ATD`, `ETA/ATA`, DSV/MOSB/MIR/SHU/DAS/AGI 등)는 **Unix epoch ms** 기준이며,  
> ETL에서 `timestamptz`로 변환(저장은 UTC, 조회 시 `AT TIME ZONE 'Asia/Dubai'` 권장).

---

## 1. Untitled‑3.py – Option‑C Case ETL (ALL + WH)

### 목적 (Purpose)

- `hvdc_allshpt_status.json`(ALL, Case No. 포함 Universe) +  
  `hvdc_warehouse_status.json`(창고/사이트 overlay)를 이용해,

  - **모든 화물(케이스/컨테이너/팔렛)** 에 대해  
  - Port/Airport → Warehouse → MOSB → Site 이벤트와 Flow Code v3.5(0–5)를 계산하고,  
  - Supabase용 **케이스 레이어 테이블**(`shipments / cases / flows / locations / events`) CSV를 생성합니다.

> SSOT 원칙:  
> `hvdc_allshpt_status.json`에 존재하는 **모든 `(HVDC CODE, Case No.)`**는  
> Supabase `cases / flows`에 **100% 생성**되어야 하며,  
> `hvdc_warehouse_status.json`은 **LEFT JOIN 보강(WH/handling/Status)** 용으로만 사용합니다.

### 입력 (Inputs)

- `hvdc_allshpt_status.json`  
  - 필수: `"HVDC CODE"`, `"Case No."` (또는 `no.` 기반 synthetic key)
- `hvdc_warehouse_status.json`  
  - 필수: `"HVDC CODE"` + DSV/MOSB/MIR/SHU/DAS/AGI 등 위치·날짜 컬럼(epoch ms)

### 실행 예시 (Run)

```bash
cd c:\logi_ontol\supabass_ontol

python Untitled-3.py ^
  --all "..\hvdc_allshpt_status.json" ^
  --wh  "..\hvdc_warehouse_status.json" ^
  --output-dir "..\supabase_csv_optionC_v3"
```

### 출력 (Outputs) – `supabase_csv_optionC_v3\`

- `shipments.csv`  
  - PK: `hvdc_code`  
  - 필드: `shipment_invoice_no, vendor, coe, pol, pod, vessel, hs_code, currency, price, ...`

- `cases.csv`  
  - PK: `(hvdc_code, case_no TEXT)` – 숫자/문자/NULL(→ `NA-<no>`) 모두 포함  
  - 필드: `site_code, eq_no, pkg, description, final_location, storage, l_cm, w_cm, h_cm, cbm, nw_kg, gw_kg, sqm, vendor, ...`

- `flows.csv`  
  - PK: `(hvdc_code, case_no)`  
  - 필드:  
    - `flow_code(0~5), flow_code_original, override_reason`  
    - `warehouse_count, has_mosb_leg, has_site_arrival`  
    - `customs_code, customs_start_iso, customs_end_iso, last_status, requires_review`

- `locations.csv`  
  - PK: `location_code` (`location_id`는 로딩 시 생성)  
  - PORT / WAREHOUSE / MOSB / SITE / CUSTOMS 카테고리 포함

- `events.csv`  
  - PK: `event_id` (내부)  
  - 논리 키: `(hvdc_code, case_no, event_type, event_time_iso)`  
  - 이벤트 타입 예:  
    - `PORT_ETD / PORT_ATD / PORT_ETA / PORT_ATA`  
    - `WH_IN / WH_OUT_DERIVED`  
    - `MOSB_IN / MOSB_OUT_DERIVED`  
    - `SITE_ARRIVAL`  
    - `CUSTOMS_START / CUSTOMS_FORMAL_START / CUSTOMS_END / DO_COLLECTION`  
  - 시간 필드: epoch ms → `timestamptz` → ISO8601 문자열

- `events_debug.csv` – `location_code` 그대로 들어간 디버그용  
- `report.md / report.json` – SSOT 커버리지, Flow 분포, Flow5·AGI/DAS 룰 체크, QA 결과  
- (선택) `hvdc_supabase.ttl` – 케이스/이벤트/Flow 인스턴스 TTL

---

## 2. Untitled‑4.py – Status SSOT + Warehouse Overlay

### 목적

- `HVDC all status.json` (또는 `HVDC SATUS.JSON`) + `hvdc_warehouse_status.json` 을 사용해

  - 선적(hvdc_code) 단위 **Status SSOT(`shipments_status`)**와  
  - WH/SITE/PORT 이벤트(`logistics_events_status`)를 만들고,  
  - `hvdc_ops_ontology.ttl` 기반 TTL export의 **Status 레이어 입력**을 생성합니다.

### 입력 & 실행 예시

```bash
python Untitled-4.py ^
  --status "..\HVDC SATUS.JSON" ^
  --warehouse "..\hvdc_warehouse_status.json" ^
  --outdir "..\out"
```

### 출력 – `out\`

- `out/supabase/schema.sql`  
  - `public.shipments` / `public.logistics_events` DDL  
  - **실제 Supabase DB DDL과 1:1로 매핑**(컬럼명/타입 일치)

- `out/supabase/shipments.csv`  
  - PK: `hvdc_code` (Status의 `"SCT SHIP NO."` 등 매핑)  
  - 선적 단위 Status·통관·운송 메타데이터

- `out/supabase/logistics_events.csv`  
  - PK: `event_id`  
  - 필드: `hvdc_code, event_type, location, event_date, source, raw`  
  - Status + WH에서 **날짜/epoch ms로 인식된 필드만 이벤트로 추출** (Port/WH/Site)

- `out/ontology/hvdc.ttl`  
  - `hvdc:Shipment / hvdc:LogisticsEvent / hvdc:Location` 인스턴스 (Status 온톨로지 뷰)

- `out/report/qa_report.md`  
  - Status 입력 수 = Shipments 출력 수 → Coverage 100%  
  - WH 매칭 / orphan WH 등 품질 리포트

- `out/report/orphan_wh.json`  
  - Status에는 없고 WH에만 있는 HVDC CODE 리스트

---

## 3. Untitled‑5.py – Option‑C ETL 완성본 (운영 메인)

### 목적

- `Untitled‑3.py`의 Option‑C ETL을 재구성한 **단일 실행 스크립트(운영용 메인)**입니다.
- `supabase.md`의 설계대로 **ALL + WH (+ Customs)**를 받아

  - `shipments / cases / flows / locations / events` CSV  
  - QA 리포트  
  - (옵션) TTL 까지 **한 번에 생성**합니다.

### 실행 예시

```bash
cd c:\logi_ontol\supabass_ontol

python Untitled-5.py ^
  --all "..\hvdc_allshpt_status.json" ^       # Case No. Universe
  --wh  "..\hvdc_warehouse_status.json" ^
  --output-dir "..\supabase_csv_optionC_v3" ^
  --export-ttl
  # --customs "..\HVDC SATUS.JSON"           # (옵션) 통관/Status JSON 추가 시
```

> **권장**: 운영/배치에서는 Untitled‑5.py를 메인으로 사용하고, Untitled‑3.py는 구조 참고/디버깅용으로 사용합니다.

---

## 4. export_hvdc_ops_ttl.py – HVDC Ops Ontology TTL Export

### 목적

- Supabase CSV들(Status + Case Option‑C)을  
  **`hvdc_ops_ontology.ttl` / `hvdc_ops_shapes.ttl`** 스키마에 맞는 **Instance TTL**로 변환합니다.
- Supabase(SSOT) → RDF/OWL(KG) 브리지로, **SHACL 검증/감사/추론**에 사용합니다.

### 입력 (Inputs)

- Status 레이어 (Untitled‑4 결과)

  - `out/supabase/shipments.csv`  또는 `shipments_status.csv`  
  - `out/supabase/logistics_events.csv` 또는 `events_status.csv`

- Case 레이어 (Untitled‑3/5 결과, 선택)

  - `supabase_csv_optionC_v3/cases.csv`  
  - `supabase_csv_optionC_v3/flows.csv`  
  - `supabase_csv_optionC_v3/locations.csv`  
  - `supabase_csv_optionC_v3/events.csv` (또는 `events_case.csv`)

> **전제**: Supabase DDL(`schema.sql`)과 CSV 컬럼은 실제 DB 테이블과 **1:1 매칭**됩니다.

### 실행 (Run)

```bash
python export_hvdc_ops_ttl.py ^
  --status-dir out/supabase ^
  --case-dir   supabase_csv_optionC_v3 ^
  --schema-ttl hvdc_ops_ontology.ttl ^
  --shapes-ttl hvdc_ops_shapes.ttl ^
  --out out/ontology/hvdc_ops_data.ttl ^
  --base-iri https://example.com/hvdc
```

### 출력 (Outputs)

- `out/ontology/hvdc_ops_data.ttl`  
  - Shipment / Case / Flow / LogisticsEvent / Location / ETLRun 인스턴스 TTL  
  - `hvdc_ops_ontology.ttl`에 정의된 클래스/관계/속성 이름 사용
- (옵션 복사)
  - `out/ontology/hvdc_ops_ontology.ttl`  
  - `out/ontology/hvdc_ops_shapes.ttl`

### 키/URI 규칙 (고정)

- Shipment:   `{base}/Shipment/{hvdc_code}`  
- Case:       `{base}/Case/{hvdc_code}/{case_no}`  
- Flow:       `{base}/Flow/{hvdc_code}/{case_no}`  
- Location:   `{base}/Location/{location_code}`  
- StatusEvent:`{base}/StatusEvent/{event_id}`  
- CaseEvent:  `{base}/CaseEvent/{hvdc_code}/{case_no}/{hash20}`  (자연키 기반 deterministic)

---

## 5. 운영 팁 / QA

- **SSOT 원칙**

  - `hvdc_allshpt_status.json`의 유니크 `(HVDC CODE, Case No.)` = Supabase `cases` = `flows`  
  - `hvdc_warehouse_status.json`에 없는 케이스도 **삭제 금지** (이벤트/WH 정보만 결측)

- **ETL 재실행 안전**

  - `events`는 `(hvdc_code, case_no, event_type, location_id, event_time)` 유니크 제약으로 중복 방지  
  - `flows`는 `(hvdc_code, case_no)` PK로 1:1 보장

- **시간 품질 게이트**

  - 핵심 애로: `CUSTOMS_END < CUSTOMS_START` 등 시간 역전 → FAIL  
  - Port/WH/MOSB/Site 구간별 리드타임은 v_case_kpi / v_kpi_site_flow_daily 뷰에서 집계

---

이 README는 **Supabase SSOT + Option‑C ETL + Ops Ontology TTL Export** 전체 파이프라인의 “최종 사용 설명서”로 사용 가능합니다.
