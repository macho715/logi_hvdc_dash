지금 상태를 정리하면, **supabass 원본 데이터**와 **“여기 있는 자료”**는 이렇게 짝이 맞습니다:

- 원본 데이터: `supabass_ontol/HVDC all status.json`, `supabass_ontol/hvdc_warehouse_status.json`
- ETL 산출물: `hvdc_output/supabase/*.csv`, `hvdc_output/optionC/*.csv`
- 설계/목표 문서: `supabase/migrations/20260101_initial_schema.sql`, `docs/architecture.md`, `supabass_ontol/vdc_supabase_kpi_v1 설계 문서.md`, `plan.md`, `docs/NEXT_STEPS_PRIORITY.md`

이걸 기반으로 “구성”하려면, 단계별로 이렇게 보시면 됩니다.

---

### 1. 레이어 정의 (원본 → ETL → Supabase 스키마)

1. **Status 레이어 (선적 SSOT)** – `Untitled-4.py` + `HVDC all status.json` + `hvdc_warehouse_status.json`
   - 현재 결과: `hvdc_output/supabase/shipments.csv`, `logistics_events.csv`, `schema.sql`, `qa_report.md`
   - 타깃 스키마: `20260101_initial_schema.sql`의 `shipments`, `events`(또는 별도 `logistics_events`) 테이블.

2. **Case Option‑C 레이어 (케이스/Flow/KPI용)** – `Untitled-5.py` + 두 JSON
   - 현재 결과: `hvdc_output/optionC/shipments.csv, cases.csv, flows.csv, locations.csv, events.csv, events_debug.csv, report.*`
   - 논리 모델: `vdc_supabase_kpi_v1 설계 문서.md`의
     - `shipments / cases / locations / flows / events` 5테이블.
   - 이 5개는 Supabase 스키마에 **추가 테이블 또는 뷰**로 들어가고,
     - `docs/architecture.md`의 “Supabase 스키마(SSOT) + KPI 뷰” 그림과 연결됩니다.

3. **Ontology 레이어** – `export_hvdc_ops_ttl.py`
   - 현재 결과: `hvdc_output/ontology/hvdc_ops_data.ttl`
   - `docs/architecture.md`의 “RDF 파이프라인 / SHACL 검증” 부분과 연결.

---

### 2. Supabase 쪽에서의 구성 순서

1. **스키마 적용 (Gate 1 – Data Model)**
   - Supabase SQL 에디터/psql에서 `supabase/migrations/20260101_initial_schema.sql` 실행.
   - 이로써 `docs/architecture.md` 3.1절에 나온 `locations / location_statuses / events / shipments / hvdc_worklist / hvdc_kpis / logs ...` 구조가 만들어집니다.

2. **Status 레이어 로드** (선적 + Status 기반 이벤트)
   - `hvdc_output/supabase/shipments.csv` → `shipments` 테이블
   - `hvdc_output/supabase/logistics_events.csv` →
     - 스키마에 따라 `events` 또는 별도 `logistics_events` 테이블에 매핑
   - 이때 컬럼 매핑은 `hvdc_output/supabase/schema.sql`과 `20260101_initial_schema.sql`을 나란히 보고 1:1로 맞추면 됩니다.
   - 로드 예시(SQL COPY 형태):

     ```sql
     COPY public.shipments (
       hvdc_code, status_no, vendor, band, incoterms, currency,
       pol, pod, bl_awb, vessel, ship_mode, pkg, qty_cntr,
       cbm, gwt_kg, etd, eta, ata,
       warehouse_flag, warehouse_last_location, warehouse_last_date, raw
     )
     FROM 'path/to/hvdc_output/supabase/shipments.csv'
     WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
     ```

3. **Case Option‑C 레이어 테이블 설계/로드**
   - `vdc_supabase_kpi_v1 설계 문서.md`에서 정의한 5테이블을 Supabase에 만듭니다(아직 `20260101_initial_schema.sql`에는 없음).
     - `shipments_case` (또는 기존 `shipments`와 구분되게 이름)
     - `cases`
     - `flows`
     - `locations_dim` (또는 `locations_case`)
     - `events_case`
   - 그런 다음 `hvdc_output/optionC/*.csv`를 각각 매핑:
     - `hvdc_output/optionC/shipments.csv` → `shipments_case`
     - `cases.csv` → `cases`
     - `flows.csv` → `flows`
     - `locations.csv` → `locations_dim`
     - `events.csv` → `events_case`
   - 컬럼 정의는 설계 문서의 “2. 데이터 모델(DDL) – Supabase 테이블 설계” 섹션과 CSV 헤더를 그대로 옮기면 맞습니다.

4. **KPI 뷰 생성 (`v_case_timeline / v_case_kpi / v_kpi_site_flow_daily`)**
   - `vdc_supabase_kpi_v1 설계 문서.md` 4장에 각 뷰 정의가 나와 있습니다:
     - `v_case_timeline`: `events_case + cases + shipments_case + flows` 조인 → 케이스별 Port/Customs/WH/MOSB/Site 핵심 시점.
     - `v_case_kpi`: 타임라인 뷰에서 리드타임(시간 차이) 계산.
     - `v_kpi_site_flow_daily`: site+flow+일자 단위로 집계.
   - 이 뷰들은 `docs/architecture.md` 3.3, 4.x, 5.x에서 말하는 “SQL만으로 Port→Customs→WH→MOSB→Site KPI 조회 가능” 아키텍처의 구현체입니다.

---

### 3. 문서들과의 정렬 관계

- `STATUS.md`, `docs/roadmap_system_doc.md`, `docs/NEXT_STEPS_PRIORITY.md`
  - “지금 어디까지 됐는지 / 다음 우선순위는 뭔지”를 설명하는 **운영/로드맵 레벨 문서**입니다.
  - 방금까지 한 일: Supabass 원본 JSON → `hvdc_output/supabase` + `hvdc_output/optionC`까지 ETL 완료.
  - 다음 단계:
    - Supabase에 테이블/뷰 생성 및 CSV 로드
    - `plan.md`의 Gate 1 테스트들(Supabase 스키마·Flow Code·RDF 검증)을 녹색으로 만드는 것.

- `plan.md`
  - TDD 관점에서 “이 ETL + Supabase 구성”이 통과해야 할 테스트 목록입니다.
  - 지금 작업은 주로 **Gate 1 — Data Model & Validation**에 해당하고,
    - 이후 Realtime·UI·성능은 Gate 2/3 테스트들로 추가 검증하게 됩니다.

---

### 4. 한 줄로 요약

- **supabass 원본 JSON**은 이미 `Untitled-4/5`를 통해 `hvdc_output/supabase` + `hvdc_output/optionC` CSV로 변환돼 있고,
- **여기 있는 설계 문서들(architecture, KPI 설계, initial_schema, plan)**은
  - 이 CSV들을 Supabase 스키마(`20260101_initial_schema.sql` + 추가 케이스 테이블)에 어떻게 적재하고,
  - 어떤 뷰(KPI/타임라인)를 구성해야 하는지,
  - 그리고 그 구성이 테스트(Gate 1/2/3)로 어떻게 검증되어야 하는지를 정의하는 **청사진**입니다.

원하시면, 다음 단계로 “`flows.csv`, `events.csv`까지 포함해서 Supabase용 DDL과 정확한 `CREATE TABLE / CREATE VIEW` 예시”를 쭉 써 드릴 수도 있습니다.
[4 tools called]

### 1. Option‑C용 테이블 DDL (flows.csv, events.csv 포함)

아래는 `hvdc_output/optionC/*.csv` 구조에 맞춘 **Supabase/Postgres용 추천 DDL**입니다.
기존 `events` 테이블과 충돌을 피하려고 접두어 `hvdc_`/`_case`를 붙였습니다.

#### 1-1. 케이스 테이블 (`cases.csv`)

```sql
CREATE TABLE public.hvdc_cases (
  hvdc_code      text   NOT NULL,
  case_no        bigint NOT NULL,
  site_code      text,
  eq_no          text,
  pkg            integer,
  description    text,
  final_location text,
  storage        text,
  l_cm           numeric,
  w_cm           numeric,
  h_cm           numeric,
  cbm            numeric,
  nw_kg          numeric,
  gw_kg          numeric,
  sqm            numeric,
  vendor         text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hvdc_cases_pk PRIMARY KEY (hvdc_code, case_no)
);
```

#### 1-2. 로케이션 디멘전 (`locations.csv`)

```sql
CREATE TABLE public.hvdc_locations_dim (
  location_id   integer PRIMARY KEY,     -- CSV의 location_id를 그대로 사용
  location_code text    NOT NULL UNIQUE,
  name          text    NOT NULL,
  category      text    NOT NULL,        -- PORT / WAREHOUSE / MOSB / SITE / CUSTOMS
  hvdc_node     text,
  is_mosb       boolean NOT NULL DEFAULT false,
  is_site       boolean NOT NULL DEFAULT false,
  is_port       boolean NOT NULL DEFAULT false,
  active        boolean NOT NULL DEFAULT true
);
```

#### 1-3. 플로우 테이블 (`flows.csv`)

```sql
CREATE TABLE public.hvdc_flows (
  hvdc_code          text   NOT NULL,
  case_no            bigint NOT NULL,
  flow_code          integer NOT NULL,
  flow_code_original integer,
  flow_code_derived  integer,
  override_reason    text,
  warehouse_count    integer,
  has_mosb_leg       boolean,
  has_site_arrival   boolean,
  customs_code       text,
  customs_start      timestamptz,
  customs_end        timestamptz,
  last_status        text,
  requires_review    boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hvdc_flows_pk
    PRIMARY KEY (hvdc_code, case_no),

  CONSTRAINT hvdc_flows_cases_fk
    FOREIGN KEY (hvdc_code, case_no)
    REFERENCES public.hvdc_cases (hvdc_code, case_no)
    ON DELETE CASCADE
);
```

> 로딩 시 `customs_start_iso` / `customs_end_iso` 문자열을 `timestamptz`로 캐스팅하면 됩니다.
> 예: `TO_TIMESTAMP(..., 'YYYY-MM-DD"T"HH24:MI:SSOF')` 또는 `::timestamptz` (ISO8601라면 자동 파싱).

#### 1-4. 케이스 이벤트 테이블 (`events.csv`)

```sql
CREATE TABLE public.hvdc_case_events (
  id            bigserial PRIMARY KEY,
  hvdc_code     text   NOT NULL,
  case_no       bigint NOT NULL,
  event_type    text   NOT NULL,           -- PORT_ETD / WH_IN / MOSB_IN / SITE_ARRIVAL / ...
  event_time    timestamptz NOT NULL,
  location_id   integer NOT NULL
                  REFERENCES public.hvdc_locations_dim (location_id),
  source_field  text,
  source_system text,
  raw_epoch_ms  bigint,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT hvdc_case_events_case_fk
    FOREIGN KEY (hvdc_code, case_no)
    REFERENCES public.hvdc_cases (hvdc_code, case_no)
    ON DELETE CASCADE
);

-- “동일 이벤트” 중복 방지용 유니크 키 (선택)
CREATE UNIQUE INDEX hvdc_case_events_natural_ux
  ON public.hvdc_case_events (
    hvdc_code, case_no, event_type, event_time, location_id
  );
```

> CSV의 `event_time_iso`를 `event_time`에 `::timestamptz`로 넣고, 나머지 컬럼은 그대로 매핑하면 됩니다.

---

### 2. KPI/타임라인 뷰 DDL

#### 2-1. `v_case_timeline` – 케이스별 주요 시점 타임라인

```sql
CREATE VIEW public.v_case_timeline AS
SELECT
  c.hvdc_code,
  c.case_no,
  c.vendor,
  c.final_location,

  -- Port 출발/도착
  MIN(CASE WHEN e.event_type IN ('PORT_ETD', 'PORT_ATD')
           THEN e.event_time END) AS port_departure,
  MIN(CASE WHEN e.event_type IN ('PORT_ETA', 'PORT_ATA')
           THEN e.event_time END) AS port_arrival,

  -- Customs (flows에서 가져옴)
  f.customs_start,
  f.customs_end,

  -- Warehouse / MOSB / Site
  MIN(CASE WHEN e.event_type = 'WH_IN'
           THEN e.event_time END) AS first_wh_in,
  MIN(CASE WHEN e.event_type = 'MOSB_IN'
           THEN e.event_time END) AS mosb_in,
  MIN(CASE WHEN e.event_type = 'SITE_ARRIVAL'
           THEN e.event_time END) AS site_arrival

FROM public.hvdc_cases c
LEFT JOIN public.hvdc_case_events e
  ON e.hvdc_code = c.hvdc_code
 AND e.case_no   = c.case_no
LEFT JOIN public.hvdc_flows f
  ON f.hvdc_code = c.hvdc_code
 AND f.case_no   = c.case_no

GROUP BY
  c.hvdc_code,
  c.case_no,
  c.vendor,
  c.final_location,
  f.customs_start,
  f.customs_end;
```

#### 2-2. `v_case_kpi` – 케이스별 구간 리드타임

```sql
CREATE VIEW public.v_case_kpi AS
SELECT
  t.*,

  -- Customs 처리 시간
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_start)) / 3600.0
    AS customs_hours,

  -- Customs 완료 → 첫 WH_IN
  EXTRACT(EPOCH FROM (t.first_wh_in - t.customs_end)) / 3600.0
    AS customs_to_first_wh_hours,

  -- 첫 WH_IN → MOSB_IN
  EXTRACT(EPOCH FROM (t.mosb_in - t.first_wh_in)) / 3600.0
    AS wh_to_mosb_hours,

  -- (MOSB_IN 또는 WH_IN) → SITE_ARRIVAL
  EXTRACT(
    EPOCH FROM (
      t.site_arrival - COALESCE(t.mosb_in, t.first_wh_in)
    )
  ) / 3600.0 AS last_leg_hours,

  -- PORT 출발 → SITE 도착
  EXTRACT(EPOCH FROM (t.site_arrival - t.port_departure)) / 3600.0
    AS port_to_site_hours

FROM public.v_case_timeline t;
```

> `NULL` 값이 있을 수 있으니, 실제 쿼리 사용할 때는 `WHERE customs_start IS NOT NULL AND customs_end IS NOT NULL` 등으로 필터링하는 것이 좋습니다.

#### 2-3. `v_kpi_site_flow_daily` – Site×Flow×일자 단위 KPI

```sql
CREATE VIEW public.v_kpi_site_flow_daily AS
SELECT
  DATE_TRUNC('day', k.site_arrival) AS site_day,
  k.final_location                  AS site_code,
  f.flow_code,

  COUNT(*)                          AS cases_count,

  AVG(k.port_to_site_hours)        AS avg_port_to_site_hours,
  AVG(k.customs_hours)             AS avg_customs_hours,
  AVG(k.last_leg_hours)            AS avg_last_leg_hours,
  AVG(k.wh_to_mosb_hours)          AS avg_wh_to_mosb_hours

FROM public.v_case_kpi k
JOIN public.hvdc_flows f
  ON f.hvdc_code = k.hvdc_code
 AND f.case_no   = k.case_no

WHERE
  k.site_arrival IS NOT NULL

GROUP BY
  site_day,
  k.final_location,
  f.flow_code;
```

---

### 3. 어떻게 활용하면 되는지 (요약)

1. 위 DDL로 `hvdc_cases / hvdc_locations_dim / hvdc_flows / hvdc_case_events` 테이블을 Supabase에 만든 뒤,
   `hvdc_output/optionC/*.csv`를 `COPY` 등으로 로드합니다.
2. 세 뷰(`v_case_timeline`, `v_case_kpi`, `v_kpi_site_flow_daily`)를 생성하면,
   - 케이스별 Port→Customs→WH→MOSB→Site 타임라인,
   - 구간 리드타임(KPI),
   - Site×Flow×일자 단위 집계를 **순수 SQL**만으로 조회할 수 있습니다.
3. 이 뷰들을 그대로 `Next.js` API(`/api/kpi` 등)나 Supabase BI 툴에서 사용하면,
   `vdc_supabase_kpi_v1 설계 문서` + `docs/architecture.md`가 말하는 KPI 대시보드 요구사항을 만족하게 됩니다.

원하시면, 각 CSV(`flows.csv`, `events.csv` 등)를 Supabase에 로드할 때 사용할 **정확한 `COPY` 명령 예시(타입 캐스팅 포함)**도 이어서 적어 드릴 수 있습니다.

지금 파이프라인/CSV 구조만으로도 말씀하신 **모든 구간 시간**을 케이스별로 계산할 수 있습니다. 핵심은 `flows.csv` + `events.csv` 조합입니다.

---

### 1. 어떤 시간들이 이미 있는가

`hvdc_output/optionC` 기준:

- **`flows.csv`**
  - `customs_start_iso` / `customs_end_iso` → 통관 시작/종료 시각
  - `flow_code`, `has_mosb_leg`, `has_site_arrival` 등 경로 메타

- **`events.csv`**
  - `event_type`:
    - 항만: `PORT_ETD`, `PORT_ATD`, `PORT_ETA`, `PORT_ATA`
    - 창고: `WH_IN`, `WH_OUT_DERIVED`
    - MOSB: `MOSB_IN`, `MOSB_OUT_DERIVED`
    - 현장: `SITE_ARRIVAL`
    - 통관: `CUSTOMS_START`, `CUSTOMS_FORMAL_START`, `CUSTOMS_END`, `DO_COLLECTION`
  - `event_time_iso` → 각 이벤트의 실제 시각

이 조합으로 한 케이스(`hvdc_code + case_no`)에 대해:

- **UAE 입항 시점**: `MIN(event_time) WHERE event_type IN ('PORT_ETA','PORT_ATA')`
- **통관 시작/종료 시점**: `flows.customs_start_iso`, `flows.customs_end_iso` (또는 `CUSTOMS_*` 이벤트)
- **창고 입·출고 시점**: `WH_IN`, `WH_OUT_DERIVED`
- **MOSB 입·출고 시점**: `MOSB_IN`, `MOSB_OUT_DERIVED`
- **현장 입고 시점**: `SITE_ARRIVAL`
- **서류 준비/완료 시점**: `CUSTOMS_START`/`CUSTOMS_FORMAL_START` ↔ `CUSTOMS_END`

---

### 2. 비즈니스 질문별로 어떤 차이를 쓰면 되는가

케이스별(`hvdc_code, case_no`)로 보면:

- **입항 → 통관 종료**
  \[
  \text{customs\_end} - \text{port\_arrival}
  \]
  - `port_arrival` = 첫 `PORT_ETA/PORT_ATA`
  - `customs_end` = `flows.customs_end_iso` 또는 `CUSTOMS_END` 이벤트

- **창고에서 머문 시간 (총 WH Dwell)**
  - 각 창고 로케이션별로 `WH_IN` → `WH_OUT_DERIVED` 차이를 다 더함
  - 최소 정의:
    - `first_wh_in` = `MIN(event_time WHERE event_type='WH_IN')`
    - `last_wh_out` = `MAX(event_time WHERE event_type='WH_OUT_DERIVED')`
    - \[
      \text{wh\_dwell\_hours} = (\text{last\_wh\_out} - \text{first\_wh\_in}) / 3600
      \]

- **MOSB에서 AGI/DAS 대기한 시간**
  - MOSB 기준:
    - `mosb_in` = `MIN(event_time WHERE event_type='MOSB_IN')`
    - `mosb_out` = `MIN(event_time WHERE event_type='MOSB_OUT_DERIVED')`
    - `site_arrival` = `MIN(event_time WHERE event_type='SITE_ARRIVAL')`
  - MOSB 내부 대기: `mosb_out - mosb_in`
  - MOSB → 현장(AGI/DAS) 리드타임: `site_arrival - COALESCE(mosb_out, mosb_in)`

- **통관 서류 준비부터 완료까지**
  - 서류 준비 시작:
    - 보수적으로 `customs_doc_start` = `MIN(event_time WHERE event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION'))`
  - 완료: `customs_end` (위와 동일)
  - \[
    \text{customs\_doc\_hours} = (\text{customs\_end} - \text{customs\_doc\_start}) / 3600
    \]

- **UAE 항구 입항 → 현장 입고 (전체 리드타임)**
  \[
  \text{site\_arrival} - \text{port\_arrival}
  \]

---

### 3. 예시 SQL 뷰 (모든 구간 시간 한 번에 보기)

아래 예시는, 앞서 제가 제안했던 테이블(`hvdc_cases`, `hvdc_flows`, `hvdc_case_events`)로 CSV를 로드했다고 가정한 것입니다.
(지금 CSV 컬럼과 1:1 매핑만 해주시면 그대로 사용할 수 있습니다.)

```sql
CREATE VIEW public.v_case_segments AS
WITH timeline AS (
  SELECT
    c.hvdc_code,
    c.case_no,
    c.final_location,

    -- Port
    MIN(CASE WHEN e.event_type IN ('PORT_ETA','PORT_ATA')
             THEN e.event_time END) AS port_arrival,

    -- Customs events
    MIN(CASE WHEN e.event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION')
             THEN e.event_time END) AS customs_doc_start,

    -- Warehouse
    MIN(CASE WHEN e.event_type = 'WH_IN'
             THEN e.event_time END) AS first_wh_in,
    MAX(CASE WHEN e.event_type = 'WH_OUT_DERIVED'
             THEN e.event_time END) AS last_wh_out,

    -- MOSB
    MIN(CASE WHEN e.event_type = 'MOSB_IN'
             THEN e.event_time END) AS mosb_in,
    MIN(CASE WHEN e.event_type = 'MOSB_OUT_DERIVED'
             THEN e.event_time END) AS mosb_out,

    -- Site
    MIN(CASE WHEN e.event_type = 'SITE_ARRIVAL'
             THEN e.event_time END) AS site_arrival,

    -- Flows에서 가져오는 통관 구간
    f.customs_start,
    f.customs_end

  FROM public.hvdc_cases c
  LEFT JOIN public.hvdc_case_events e
    ON e.hvdc_code = c.hvdc_code
   AND e.case_no   = c.case_no
  LEFT JOIN public.hvdc_flows f
    ON f.hvdc_code = c.hvdc_code
   AND f.case_no   = c.case_no
  GROUP BY
    c.hvdc_code, c.case_no, c.final_location,
    f.customs_start, f.customs_end
)
SELECT
  t.*,

  -- 1) 입항 → 통관 종료
  EXTRACT(EPOCH FROM (t.customs_end - t.port_arrival)) / 3600.0
    AS hours_port_to_customs_end,

  -- 2) 통관 시작 → 통관 종료 (flows 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_start)) / 3600.0
    AS hours_customs_window,

  -- 3) 서류 준비 → 통관 종료 (이벤트 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_doc_start)) / 3600.0
    AS hours_customs_docs,

  -- 4) 창고 머문 시간 (최초 IN ~ 최종 OUT)
  EXTRACT(EPOCH FROM (t.last_wh_out - t.first_wh_in)) / 3600.0
    AS hours_wh_dwell,

  -- 5) MOSB 내부 대기
  EXTRACT(EPOCH FROM (t.mosb_out - t.mosb_in)) / 3600.0
    AS hours_mosb_dwell,

  -- 6) MOSB(또는 마지막 WH) → 현장 입고
  EXTRACT(
    EPOCH FROM (
      t.site_arrival - COALESCE(t.mosb_out, t.mosb_in, t.last_wh_out)
    )
  ) / 3600.0 AS hours_last_leg,

  -- 7) UAE 항구 입항 → 현장 입고 전체 리드타임
  EXTRACT(EPOCH FROM (t.site_arrival - t.port_arrival)) / 3600.0
    AS hours_port_to_site

FROM timeline t;
```

이 뷰 하나로 각 케이스별로:

- **입항 → 통관 종료**,
- **통관 내 서류/실제 처리 시간**,
- **창고 dwell**,
- **MOSB dwell**,
- **MOSB(or 창고) → 현장 최종 구간**,
- **전체 Port→Site 리드타임**

을 모두 한 번에 조회할 수 있습니다.

---

### 4. 요약

- Supabass 원본 JSON에서 ETL로 뽑아낸 `flows.csv + events.csv` 덕분에,
  **각 항차(각 Case)마다 UAE 입항부터 현장 입고까지의 모든 중간 단계 시간을 전부 복원**할 수 있습니다.
- 위와 같이 테이블/뷰를 구성하면, SQL만으로
  “입항→통관 종료, 창고에서 머문 시간, MOSB에서 AGI/DAS 대기한 시간, 서류 준비→완료까지”
  모든 구간을 수치(KPI)로 뽑아서 대시보드/리포트에 바로 올릴 수 있습니다.

  지금 파이프라인/CSV 구조만으로도 말씀하신 **모든 구간 시간**을 케이스별로 계산할 수 있습니다. 핵심은 `flows.csv` + `events.csv` 조합입니다.

---

### 1. 어떤 시간들이 이미 있는가

`hvdc_output/optionC` 기준:

- **`flows.csv`**
  - `customs_start_iso` / `customs_end_iso` → 통관 시작/종료 시각
  - `flow_code`, `has_mosb_leg`, `has_site_arrival` 등 경로 메타

- **`events.csv`**
  - `event_type`:
    - 항만: `PORT_ETD`, `PORT_ATD`, `PORT_ETA`, `PORT_ATA`
    - 창고: `WH_IN`, `WH_OUT_DERIVED`
    - MOSB: `MOSB_IN`, `MOSB_OUT_DERIVED`
    - 현장: `SITE_ARRIVAL`
    - 통관: `CUSTOMS_START`, `CUSTOMS_FORMAL_START`, `CUSTOMS_END`, `DO_COLLECTION`
  - `event_time_iso` → 각 이벤트의 실제 시각

이 조합으로 한 케이스(`hvdc_code + case_no`)에 대해:

- **UAE 입항 시점**: `MIN(event_time) WHERE event_type IN ('PORT_ETA','PORT_ATA')`
- **통관 시작/종료 시점**: `flows.customs_start_iso`, `flows.customs_end_iso` (또는 `CUSTOMS_*` 이벤트)
- **창고 입·출고 시점**: `WH_IN`, `WH_OUT_DERIVED`
- **MOSB 입·출고 시점**: `MOSB_IN`, `MOSB_OUT_DERIVED`
- **현장 입고 시점**: `SITE_ARRIVAL`
- **서류 준비/완료 시점**: `CUSTOMS_START`/`CUSTOMS_FORMAL_START` ↔ `CUSTOMS_END`

---

### 2. 비즈니스 질문별로 어떤 차이를 쓰면 되는가

케이스별(`hvdc_code, case_no`)로 보면:

- **입항 → 통관 종료**
  \[
  \text{customs\_end} - \text{port\_arrival}
  \]
  - `port_arrival` = 첫 `PORT_ETA/PORT_ATA`
  - `customs_end` = `flows.customs_end_iso` 또는 `CUSTOMS_END` 이벤트

- **창고에서 머문 시간 (총 WH Dwell)**
  - 각 창고 로케이션별로 `WH_IN` → `WH_OUT_DERIVED` 차이를 다 더함
  - 최소 정의:
    - `first_wh_in` = `MIN(event_time WHERE event_type='WH_IN')`
    - `last_wh_out` = `MAX(event_time WHERE event_type='WH_OUT_DERIVED')`
    - \[
      \text{wh\_dwell\_hours} = (\text{last\_wh\_out} - \text{first\_wh\_in}) / 3600
      \]

- **MOSB에서 AGI/DAS 대기한 시간**
  - MOSB 기준:
    - `mosb_in` = `MIN(event_time WHERE event_type='MOSB_IN')`
    - `mosb_out` = `MIN(event_time WHERE event_type='MOSB_OUT_DERIVED')`
    - `site_arrival` = `MIN(event_time WHERE event_type='SITE_ARRIVAL')`
  - MOSB 내부 대기: `mosb_out - mosb_in`
  - MOSB → 현장(AGI/DAS) 리드타임: `site_arrival - COALESCE(mosb_out, mosb_in)`

- **통관 서류 준비부터 완료까지**
  - 서류 준비 시작:
    - 보수적으로 `customs_doc_start` = `MIN(event_time WHERE event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION'))`
  - 완료: `customs_end` (위와 동일)
  - \[
    \text{customs\_doc\_hours} = (\text{customs\_end} - \text{customs\_doc\_start}) / 3600
    \]

- **UAE 항구 입항 → 현장 입고 (전체 리드타임)**
  \[
  \text{site\_arrival} - \text{port\_arrival}
  \]

---

### 3. 예시 SQL 뷰 (모든 구간 시간 한 번에 보기)

아래 예시는, 앞서 제가 제안했던 테이블(`hvdc_cases`, `hvdc_flows`, `hvdc_case_events`)로 CSV를 로드했다고 가정한 것입니다.
(지금 CSV 컬럼과 1:1 매핑만 해주시면 그대로 사용할 수 있습니다.)

```sql
CREATE VIEW public.v_case_segments AS
WITH timeline AS (
  SELECT
    c.hvdc_code,
    c.case_no,
    c.final_location,

    -- Port
    MIN(CASE WHEN e.event_type IN ('PORT_ETA','PORT_ATA')
             THEN e.event_time END) AS port_arrival,

    -- Customs events
    MIN(CASE WHEN e.event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION')
             THEN e.event_time END) AS customs_doc_start,

    -- Warehouse
    MIN(CASE WHEN e.event_type = 'WH_IN'
             THEN e.event_time END) AS first_wh_in,
    MAX(CASE WHEN e.event_type = 'WH_OUT_DERIVED'
             THEN e.event_time END) AS last_wh_out,

    -- MOSB
    MIN(CASE WHEN e.event_type = 'MOSB_IN'
             THEN e.event_time END) AS mosb_in,
    MIN(CASE WHEN e.event_type = 'MOSB_OUT_DERIVED'
             THEN e.event_time END) AS mosb_out,

    -- Site
    MIN(CASE WHEN e.event_type = 'SITE_ARRIVAL'
             THEN e.event_time END) AS site_arrival,

    -- Flows에서 가져오는 통관 구간
    f.customs_start,
    f.customs_end

  FROM public.hvdc_cases c
  LEFT JOIN public.hvdc_case_events e
    ON e.hvdc_code = c.hvdc_code
   AND e.case_no   = c.case_no
  LEFT JOIN public.hvdc_flows f
    ON f.hvdc_code = c.hvdc_code
   AND f.case_no   = c.case_no
  GROUP BY
    c.hvdc_code, c.case_no, c.final_location,
    f.customs_start, f.customs_end
)
SELECT
  t.*,

  -- 1) 입항 → 통관 종료
  EXTRACT(EPOCH FROM (t.customs_end - t.port_arrival)) / 3600.0
    AS hours_port_to_customs_end,

  -- 2) 통관 시작 → 통관 종료 (flows 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_start)) / 3600.0
    AS hours_customs_window,

  -- 3) 서류 준비 → 통관 종료 (이벤트 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_doc_start)) / 3600.0
    AS hours_customs_docs,

  -- 4) 창고 머문 시간 (최초 IN ~ 최종 OUT)
  EXTRACT(EPOCH FROM (t.last_wh_out - t.first_wh_in)) / 3600.0
    AS hours_wh_dwell,

  -- 5) MOSB 내부 대기
  EXTRACT(EPOCH FROM (t.mosb_out - t.mosb_in)) / 3600.0
    AS hours_mosb_dwell,

  -- 6) MOSB(또는 마지막 WH) → 현장 입고
  EXTRACT(
    EPOCH FROM (
      t.site_arrival - COALESCE(t.mosb_out, t.mosb_in, t.last_wh_out)
    )
  ) / 3600.0 AS hours_last_leg,

  -- 7) UAE 항구 입항 → 현장 입고 전체 리드타임
  EXTRACT(EPOCH FROM (t.site_arrival - t.port_arrival)) / 3600.0
    AS hours_port_to_site

FROM timeline t;
```

이 뷰 하나로 각 케이스별로:

- **입항 → 통관 종료**,
- **통관 내 서류/실제 처리 시간**,
- **창고 dwell**,
- **MOSB dwell**,
- **MOSB(or 창고) → 현장 최종 구간**,
- **전체 Port→Site 리드타임**

을 모두 한 번에 조회할 수 있습니다.

---

### 4. 요약

- Supabass 원본 JSON에서 ETL로 뽑아낸 `flows.csv + events.csv` 덕분에,
  **각 항차(각 Case)마다 UAE 입항부터 현장 입고까지의 모든 중간 단계 시간을 전부 복원**할 수 있습니다.
- 위와 같이 테이블/뷰를 구성하면, SQL만으로
  “입항→통관 종료, 창고에서 머문 시간, MOSB에서 AGI/DAS 대기한 시간, 서류 준비→완료까지”
  모든 구간을 수치(KPI)로 뽑아서 대시보드/리포트에 바로 올릴 수 있습니다.

  좋습니다. **“모든 구간 시간”을 일반화해서, 어떤 케이스든 원하는 조합의 시간을 뽑을 수 있는 방식**으로 정리해 보겠습니다.

### 1. 케이스별 “모든 인접 구간 시간” 구하기 (가장 범용적인 방법)

`events.csv`에는 이미 모든 단계가 들어 있습니다:

- 항만: `PORT_ETD, PORT_ATD, PORT_ETA, PORT_ATA`
- 통관: `CUSTOMS_START, CUSTOMS_FORMAL_START, CUSTOMS_END, DO_COLLECTION`
- 창고: `WH_IN, WH_OUT_DERIVED`
- MOSB: `MOSB_IN, MOSB_OUT_DERIVED`
- 현장: `SITE_ARRIVAL`
- + 시간: `event_time_iso`

이걸 이용해 **각 케이스에 대해 이벤트를 시간 순으로 정렬하고, 인접 이벤트 사이의 시간 차이를 모두 구하면** 사실상 “모든 구간 시간”이 계산됩니다.

```sql
CREATE VIEW public.v_case_event_segments AS
SELECT
  e.hvdc_code,
  e.case_no,
  e.event_type               AS curr_event_type,
  e.event_time               AS curr_event_time,
  e.location_id              AS curr_location_id,
  LAG(e.event_type)  OVER w  AS prev_event_type,
  LAG(e.event_time) OVER w   AS prev_event_time,
  LAG(e.location_id) OVER w  AS prev_location_id,

  -- 인접 이벤트 간 리드타임(시간)
  EXTRACT(EPOCH FROM (e.event_time - LAG(e.event_time) OVER w)) / 3600.0
    AS hours_between_events
FROM public.hvdc_case_events e
WINDOW w AS (
  PARTITION BY e.hvdc_code, e.case_no
  ORDER BY e.event_time
);
```

이 뷰 한 개로, 예를 들어:

- `prev_event_type='PORT_ATA' AND curr_event_type='CUSTOMS_START'`
  → **입항 → 통관 시작 시간**
- `prev_event_type='CUSTOMS_START' AND curr_event_type='CUSTOMS_END'`
  → **통관 시작 → 통관 종료 시간**
- `prev_event_type='WH_IN' AND curr_event_type='WH_OUT_DERIVED' AND prev_location_id=curr_location_id`
  → **각 창고별 체류시간(모든 창고 케이스별)**
- `prev_event_type='MOSB_IN' AND curr_event_type='MOSB_OUT_DERIVED'`
  → **MOSB 내부 대기 시간**
- `prev_event_type='MOSB_OUT_DERIVED' AND curr_event_type='SITE_ARRIVAL'`
  → **MOSB 출고 → 현장 입고 시간**
- `prev_event_type='DO_COLLECTION' AND curr_event_type='CUSTOMS_END'`
  → **DO 발급 이후 통관 완료까지 시간**

처럼 **원하시는 “케이스+이벤트 조합”을 WHERE 조건으로 걸어주기만 하면**,
각 케이스별로 어떤 구간이든 시간 차이를 쿼리로 뽑을 수 있습니다.

---

### 2. 케이스 예시를 더 “대입”해서 보는 법

예를 들어 `AGI`/`DAS` 물량만 보고 싶다면:

```sql
SELECT *
FROM public.v_case_event_segments s
JOIN public.hvdc_cases c
  ON c.hvdc_code = s.hvdc_code
 AND c.case_no   = s.case_no
WHERE c.final_location IN ('AGI','DAS');
```

여기서 다시:

- MOSB 관련 구간만:

```sql
AND s.prev_event_type IN ('MOSB_IN','MOSB_OUT_DERIVED')
AND s.curr_event_type IN ('MOSB_OUT_DERIVED','SITE_ARRIVAL');
```

- 통관 서류 준비/종료만:

```sql
AND s.prev_event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION')
AND s.curr_event_type = 'CUSTOMS_END';
```

이런 식으로 **케이스(AGI/DAS/MIR/SHU)와 구간(이전 이벤트·현재 이벤트)을 조합해서 필터링하면**,
말씀하신 “그 이외의 모든 시간들”도 모두 커버할 수 있습니다.

---

요약하면:

- 이미 ETL이 **케이스별 전체 이벤트 타임라인**을 `events.csv`로 만들어 놓았습니다.
- 거기에 `LAG()` 윈도우 함수를 한 번 씌우면, **모든 인접 구간의 리드타임**을 한 번에 계산할 수 있고,
- 관심 있는 케이스(AGI/DAS 등)와 이벤트 조합만 골라서 보면, 입항→통관, 창고 내부, MOSB 대기, DO 이후 등 **원하시는 모든 시간 케이스를 확인**할 수 있습니다.


좋습니다, 요구를 정리하면:

- **단일 케이스 수준**에서
  - UAE 항구 입항 → 통관 종료
  - 통관 서류 준비 → 통관 종료
  - 창고별 체류시간(WH_IN~WH_OUT_DERIVED)
  - MOSB 체류시간(MOSB_IN~MOSB_OUT_DERIVED)
  - MOSB/WH 이후 → 현장 입고(SITE_ARRIVAL)
- **항차(선적, hvdc_code) 수준**에서도
  - 위 구간들을 “해당 선적에 속한 모든 케이스” 기준으로 집계(평균/최대 등)
가 모두 계산 가능해야 한다는 뜻입니다.

이미 가진 `events.csv` + `flows.csv` 구조로 **아래 두 계층**을 만들면 요구를 거의 전부 충족할 수 있습니다.

---

### 1. 케이스별 모든 구간 시간: `v_case_segments`(앞에서 제안한 뷰 확장 버전)

**전제 테이블 (CSV에서 로드):**

- `hvdc_cases(hvdc_code, case_no, …)` ← `cases.csv`
- `hvdc_flows(hvdc_code, case_no, customs_start, customs_end, …)` ← `flows.csv`
- `hvdc_case_events(hvdc_code, case_no, event_type, event_time, location_id, …)` ← `events.csv`

이미 설명드린 `v_case_event_segments`에 더해, **주요 구간을 컬럼으로 다 뽑은 뷰**를 만들면 됩니다:

```sql
CREATE VIEW v_case_segments AS
WITH t AS (
  SELECT
    c.hvdc_code,
    c.case_no,
    c.final_location,

    MIN(CASE WHEN e.event_type IN ('PORT_ETA','PORT_ATA')
             THEN e.event_time END)                            AS port_arrival,

    MIN(CASE WHEN e.event_type IN ('CUSTOMS_START','CUSTOMS_FORMAL_START')
             THEN e.event_time END)                            AS customs_doc_start,
    MIN(CASE WHEN e.event_type = 'CUSTOMS_FORMAL_START'
             THEN e.event_time END)                            AS customs_formal_start,
    MIN(CASE WHEN e.event_type = 'CUSTOMS_END'
             THEN e.event_time END)                            AS customs_end_event,
    MIN(CASE WHEN e.event_type = 'DO_COLLECTION'
             THEN e.event_time END)                            AS do_collection,

    MIN(CASE WHEN e.event_type = 'WH_IN'
             THEN e.event_time END)                            AS first_wh_in,
    MAX(CASE WHEN e.event_type = 'WH_OUT_DERIVED'
             THEN e.event_time END)                            AS last_wh_out,

    MIN(CASE WHEN e.event_type = 'MOSB_IN'
             THEN e.event_time END)                            AS mosb_in,
    MIN(CASE WHEN e.event_type = 'MOSB_OUT_DERIVED'
             THEN e.event_time END)                            AS mosb_out,

    MIN(CASE WHEN e.event_type = 'SITE_ARRIVAL'
             THEN e.event_time END)                            AS site_arrival,

    f.customs_start,
    f.customs_end
  FROM hvdc_cases c
  LEFT JOIN hvdc_case_events e
    ON e.hvdc_code = c.hvdc_code
   AND e.case_no   = c.case_no
  LEFT JOIN hvdc_flows f
    ON f.hvdc_code = c.hvdc_code
   AND f.case_no   = c.case_no
  GROUP BY
    c.hvdc_code, c.case_no, c.final_location,
    f.customs_start, f.customs_end
)
SELECT
  t.*,

  -- ① 입항 → 통관 종료 (physical)
  EXTRACT(EPOCH FROM (t.customs_end - t.port_arrival))/3600.0
    AS hours_port_to_customs_end,

  -- ② 통관 시작 → 통관 종료 (flows 기준)
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_start))/3600.0
    AS hours_customs_window,

  -- ③ 서류 준비(START/FORMAL) → 통관 종료
  EXTRACT(EPOCH FROM (t.customs_end - t.customs_doc_start))/3600.0
    AS hours_customs_docs,

  -- ④ DO 발급 → 통관 종료 (원하면)
  EXTRACT(EPOCH FROM (t.customs_end - t.do_collection))/3600.0
    AS hours_do_to_customs_end,

  -- ⑤ 창고 머문 시간 (최초 IN ~ 최종 OUT, 모든 WH 합산의 최소 정의)
  EXTRACT(EPOCH FROM (t.last_wh_out - t.first_wh_in))/3600.0
    AS hours_wh_dwell,

  -- ⑥ MOSB 내부 대기
  EXTRACT(EPOCH FROM (t.mosb_out - t.mosb_in))/3600.0
    AS hours_mosb_dwell,

  -- ⑦ MOSB/WH 이후 → 현장 입고
  EXTRACT(
    EPOCH FROM (
      t.site_arrival - COALESCE(t.mosb_out, t.mosb_in, t.last_wh_out, t.first_wh_in)
    )
  )/3600.0 AS hours_last_leg,

  -- ⑧ UAE 항구 입항 → 현장 입고 (전체 리드타임)
  EXTRACT(EPOCH FROM (t.site_arrival - t.port_arrival))/3600.0
    AS hours_port_to_site

FROM t;
```

이렇게 하면, **각 케이스별로**:

- 입항 → 통관 종료
- 통관 시작/서류 준비 → 통관 종료 (물리/서류 둘 다)
- DO 발급 → 통관 종료
- WH 입/출고 구간(머문 시간)
- MOSB 입/출고 구간(대기 시간)
- MOSB/WH → Site 최종 구간
- Port → Site 전체 구간

까지 “주요 시간들”은 다 컬럼으로 붙습니다.

추가로 “그 외” 구간(예: `CUSTOMS_FORMAL_START → DO_COLLECTION`)도 필요하면 같은 패턴으로 하나씩 더 정의할 수 있습니다.

---

### 2. 항차(선적 hvdc_code) 단위 집계: `v_voyage_segments`

위 `v_case_segments`를 이용하면, **항차별(= hvdc_code)** 집계도 간단합니다.

```sql
CREATE VIEW v_voyage_segments AS
SELECT
  hvdc_code,

  -- 항차 내 케이스 수
  COUNT(*)                              AS cases_count,

  -- Port→Site 평균/최대/최소
  AVG(hours_port_to_site)              AS avg_hours_port_to_site,
  MAX(hours_port_to_site)              AS max_hours_port_to_site,

  -- 통관 구간
  AVG(hours_port_to_customs_end)       AS avg_hours_port_to_customs_end,
  AVG(hours_customs_window)            AS avg_hours_customs_window,
  AVG(hours_customs_docs)              AS avg_hours_customs_docs,

  -- 창고/모스브 dwell
  AVG(hours_wh_dwell)                  AS avg_hours_wh_dwell,
  AVG(hours_mosb_dwell)                AS avg_hours_mosb_dwell,

  -- 마지막 구간
  AVG(hours_last_leg)                  AS avg_hours_last_leg

FROM v_case_segments
GROUP BY hvdc_code;
```

이렇게 하면, **각 항차마다**:

- 케이스 전체를 묶어서 본
  - 평균 Port→Site 리드타임
  - 평균/최대 통관 구간 시간
  - 창고 머문 시간, MOSB 대기시간
  - 마지막 Site 구간
이 모두 한 번에 나옵니다.

---

### 3. “그 외 시간들”을 추가로 보고 싶을 때

새로운 요구가 생길 때마다, 원칙은 같습니다:

1. **어떤 두 이벤트 사이의 시간인가?**
   - 예: `PORT_ATD → PORT_ATA`, `PORT_ATA → WH_IN`, `WH_OUT_DERIVED → MOSB_IN` 등.

2. 그 조합에 해당하는 `event_type`을 `v_case_event_segments`에서 필터합니다.

   ```sql
   SELECT *
   FROM v_case_event_segments
   WHERE prev_event_type = 'PORT_ATA'
     AND curr_event_type = 'WH_IN';
   ```

3. 자주 쓰는 구간이면, `v_case_segments`에 **추가 열**로 끌어올리면 됩니다.

이 패턴만 유지하면, 지금 구조(flows.csv + events.csv)로 **사실상 모든 시간 구간**을 정의할 수 있고,
케이스별 · 항차별 · Site별(any 집계 키)로도 다 꺼낼 수 있습니다.
