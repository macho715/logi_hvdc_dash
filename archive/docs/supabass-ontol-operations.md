## ExecSummary (3–5L)

* 요청하신 2-레이어 운영(SSOT Status + Option-C Case)을 기준으로, **Supabase 최종 schema/table/view 네이밍**을 고정하고 **대시보드용 SQL 쿼리 세트(페이지/위젯 단위)** 를 묶었습니다.
* **Status 레이어는 `hvdc_code` 단위 전량(SSOT)**, **Case 레이어는 `(hvdc_code, case_no)` 단위 정밀(Flow/WH IN-OUT/SITE ARRIVAL/Customs)** 로 분리합니다.
* 대시보드는 기본적으로 **`public`의 뷰만 조회**하도록 고정(권한/RLS 단순화)하고, 두 레이어는 뷰에서 `hvdc_code`로 JOIN 합니다.

---

## Visual-first: 최종 스키마/테이블/뷰 맵

| 레이어      | schema    | 테이블(적재)                                                                             | 키                      | 뷰(대시보드 조회)                                                                          | 목적               |
| -------- | --------- | ----------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| SSOT(상위) | `status`  | `shipments_status`, `events_status`                                                 | `hvdc_code`            | `public.v_shipments_master`, `public.v_shipments_timeline`                          | 전량 상태/헤더/가벼운 이벤트 |
| Case(정밀) | `case`    | `shipments_case`, `cases`, `flows`, `locations`, `events_case`, `events_case_debug` | `(hvdc_code, case_no)` | `public.v_cases_kpi`, `public.v_flow_distribution`, `public.v_wh_inventory_current` | 케이스별 흐름/리드타임/리스크 |
| 운영/감사    | `ops`(옵션) | `etl_runs`                                                                          | `run_id`               | `public.v_etl_health`                                                               | 배치 품질/커버리지/이상치   |

---

## 1) Supabase 최종 테이블/뷰 이름 설계 (DDL 패키지)

### 1-A) 스키마 생성

```sql
create schema if not exists status;
create schema if not exists "case";
create schema if not exists ops;

create extension if not exists pgcrypto;
```

### 1-B) Status(SSOT) 테이블 (Untitled-4 출력 적재)

> `out/supabase/shipments.csv`, `out/supabase/logistics_events.csv` 기준

```sql
-- status.shipments_status
create table if not exists status.shipments_status (
  hvdc_code text primary key,
  status_no bigint,
  vendor text,
  band text,
  incoterms text,
  currency text,
  pol text,
  pod text,
  bl_awb text,
  vessel text,
  ship_mode text,
  pkg integer,
  qty_cntr integer,
  cbm numeric,
  gwt_kg numeric,
  etd date,
  eta date,
  ata date,
  warehouse_flag boolean not null default false,
  warehouse_last_location text,
  warehouse_last_date date,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ss_status_no on status.shipments_status(status_no);
create index if not exists idx_ss_vendor on status.shipments_status(vendor);
create index if not exists idx_ss_band on status.shipments_status(band);
create index if not exists idx_ss_whflag on status.shipments_status(warehouse_flag);

-- status.events_status
create table if not exists status.events_status (
  event_id text primary key,
  hvdc_code text not null references status.shipments_status(hvdc_code) on delete cascade,
  event_type text not null,      -- WH/SITE/PORT/GEN (스크립트 기준)
  location text not null,
  event_date date not null,
  source text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_es_hvdc on status.events_status(hvdc_code);
create index if not exists idx_es_date on status.events_status(event_date);
create index if not exists idx_es_loc on status.events_status(location);
```

### 1-C) Case(Option-C) 테이블 (Untitled-3 출력 적재)

> `supabase_csv_optionC_v3/{shipments,cases,flows,locations,events}.csv` 기준

```sql
-- case.shipments_case (hvdc_code 레벨 보강 헤더)
create table if not exists "case".shipments_case (
  hvdc_code text primary key,
  shipment_invoice_no text,
  vendor text,
  coe text,
  pol text,
  pod text,
  vessel text,
  hs_code text,
  currency text,
  price numeric
);

-- case.cases (케이스 마스터)
create table if not exists "case".cases (
  hvdc_code text not null,
  case_no text not null,
  site_code text,
  eq_no text,
  pkg integer,
  description text,
  final_location text,
  storage text,
  l_cm numeric,
  w_cm numeric,
  h_cm numeric,
  cbm numeric,
  nw_kg numeric,
  gw_kg numeric,
  sqm numeric,
  vendor text,
  primary key (hvdc_code, case_no)
);

create index if not exists idx_cases_hvdc on "case".cases(hvdc_code);
create index if not exists idx_cases_final on "case".cases(final_location);
create index if not exists idx_cases_vendor on "case".cases(vendor);

-- case.flows (Flow Code v3.5 결과)
create table if not exists "case".flows (
  hvdc_code text not null,
  case_no text not null,
  flow_code integer not null,
  flow_code_original integer,
  flow_code_derived integer,
  override_reason text,
  warehouse_count integer,
  has_mosb_leg boolean not null default false,
  has_site_arrival boolean not null default false,
  customs_code text,
  customs_start_iso timestamptz,
  customs_end_iso timestamptz,
  last_status text,
  requires_review boolean not null default false,
  primary key (hvdc_code, case_no),
  foreign key (hvdc_code, case_no) references "case".cases(hvdc_code, case_no) on delete cascade
);

create index if not exists idx_flows_fc on "case".flows(flow_code);
create index if not exists idx_flows_review on "case".flows(requires_review);
create index if not exists idx_flows_customs on "case".flows(customs_start_iso, customs_end_iso);

-- case.locations (디멘전)
create table if not exists "case".locations (
  location_id integer primary key,
  location_code text unique not null,
  name text not null,
  category text not null,    -- WAREHOUSE/MOSB/SITE/PORT/CUSTOMS/TRANSIT
  hvdc_node text,
  is_mosb boolean not null default false,
  is_site boolean not null default false,
  is_port boolean not null default false,
  active boolean not null default true
);

-- case.events_case (이벤트 팩트) : CSV import 편의상 bigserial PK
create table if not exists "case".events_case (
  event_id bigserial primary key,
  hvdc_code text not null,
  case_no text not null,
  event_type text not null,          -- WH_IN, WH_OUT_DERIVED, MOSB_IN, SITE_ARRIVAL, CUSTOMS_END 등 :contentReference[oaicite:4]{index=4}
  event_time_iso timestamptz not null,
  location_id integer not null references "case".locations(location_id),
  source_field text not null,
  source_system text not null,
  raw_epoch_ms bigint,
  foreign key (hvdc_code, case_no) references "case".cases(hvdc_code, case_no) on delete cascade
);

create unique index if not exists uq_events_case_natural
on "case".events_case(hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system);

create index if not exists idx_events_case_hvdc on "case".events_case(hvdc_code, case_no);
create index if not exists idx_events_case_time on "case".events_case(event_time_iso);
create index if not exists idx_events_case_loc on "case".events_case(location_id);

-- (옵션) debug 테이블
create table if not exists "case".events_case_debug (
  debug_id bigserial primary key,
  hvdc_code text not null,
  case_no text not null,
  event_type text not null,
  event_time_iso timestamptz not null,
  location_code text not null,
  source_field text not null,
  source_system text not null,
  raw_epoch_ms bigint
);
```

### 1-D) 운영/감사(옵션) ETL Run 로그

```sql
create table if not exists ops.etl_runs (
  run_id uuid primary key default gen_random_uuid(),
  pipeline text not null,               -- 'status' | 'case'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  report jsonb,
  ok boolean not null default true
);

create index if not exists idx_etl_runs_pipeline on ops.etl_runs(pipeline, started_at desc);
```

---

## 2) 최종 뷰 설계 (대시보드가 직접 조회하는 “단일 API”)

### 2-A) Shipment 마스터(SSOT + Case 헤더 보강)

```sql
create or replace view public.v_shipments_master as
select
  ss.hvdc_code,
  ss.status_no,
  coalesce(ss.vendor, sc.vendor) as vendor,
  ss.band,
  ss.incoterms,
  coalesce(ss.currency, sc.currency) as currency,
  coalesce(ss.pol, sc.pol) as pol,
  coalesce(ss.pod, sc.pod) as pod,
  coalesce(ss.vessel, sc.vessel) as vessel,
  ss.bl_awb,
  ss.ship_mode,
  ss.pkg,
  ss.qty_cntr,
  ss.cbm,
  ss.gwt_kg,
  ss.etd, ss.eta, ss.ata,
  ss.warehouse_flag,
  ss.warehouse_last_location,
  ss.warehouse_last_date,
  sc.hs_code,
  sc.coe,
  sc.shipment_invoice_no,
  sc.price,
  ss.raw as status_raw
from status.shipments_status ss
left join "case".shipments_case sc
  on sc.hvdc_code = ss.hvdc_code;
```

### 2-B) Shipment 타임라인(상위 이벤트 + 케이스 이벤트 합본)

```sql
create or replace view public.v_shipments_timeline as
select
  'STATUS'::text as layer,
  es.hvdc_code,
  null::text as case_no,
  es.event_type,
  es.location,
  (es.event_date::timestamptz) as event_time,
  es.source
from status.events_status es
union all
select
  'CASE'::text as layer,
  ec.hvdc_code,
  ec.case_no,
  ec.event_type,
  l.name as location,
  ec.event_time_iso as event_time,
  ec.source_system as source
from "case".events_case ec
join "case".locations l on l.location_id = ec.location_id;
```

### 2-C) 케이스 KPI(Flow/Customs/리드타임)

```sql
create or replace view public.v_cases_kpi as
select
  c.hvdc_code,
  c.case_no,
  c.site_code,
  c.eq_no,
  c.pkg,
  c.description,
  c.final_location,
  c.storage,
  c.cbm,
  c.gw_kg,
  c.sqm,
  f.flow_code,
  f.has_mosb_leg,
  f.has_site_arrival,
  f.customs_code,
  f.customs_start_iso,
  f.customs_end_iso,
  round(extract(epoch from (f.customs_end_iso - f.customs_start_iso)) / 86400.0, 2) as customs_days,
  f.last_status,
  f.requires_review
from "case".cases c
left join "case".flows f
  on f.hvdc_code = c.hvdc_code and f.case_no = c.case_no;
```

### 2-D) Flow 분포(관리자 대시보드 1줄 KPI용)

```sql
create or replace view public.v_flow_distribution as
select
  hvdc_code,
  flow_code,
  count(*)::bigint as case_cnt
from "case".flows
group by hvdc_code, flow_code;
```

### 2-E) WH 현재 재고(“마지막 이벤트” 기준)

```sql
create or replace view public.v_wh_inventory_current as
with last_ev as (
  select
    ec.hvdc_code, ec.case_no,
    max(ec.event_time_iso) as last_time
  from "case".events_case ec
  group by ec.hvdc_code, ec.case_no
),
last_rows as (
  select
    ec.hvdc_code, ec.case_no, ec.event_type, ec.event_time_iso, ec.location_id
  from "case".events_case ec
  join last_ev le
    on le.hvdc_code = ec.hvdc_code
   and le.case_no = ec.case_no
   and le.last_time = ec.event_time_iso
)
select
  lr.hvdc_code,
  lr.case_no,
  lr.event_type,
  l.location_code,
  l.name as location_name,
  l.category,
  lr.event_time_iso as last_event_time
from last_rows lr
join "case".locations l on l.location_id = lr.location_id
where l.category in ('WAREHOUSE','MOSB','TRANSIT','SITE','PORT','CUSTOMS');
```

---

## 3) 대시보드용 쿼리 세트 (페이지/위젯 단위)

### 3-A) “전체 현황(SSOT)” 페이지

1. 전체 리스트(기본 정렬: S No)

```sql
select *
from public.v_shipments_master
order by status_no nulls last, hvdc_code;
```

2. Vendor/Band별 선적 수(Top)

```sql
select
  vendor,
  band,
  count(*)::bigint as shipment_cnt
from public.v_shipments_master
group by vendor, band
order by shipment_cnt desc, vendor;
```

3. Port→Site 평균 리드타임(케이스 이벤트 기반, Flow 1~4)

```sql
with port_eta as (
  select hvdc_code, case_no, min(event_time_iso) as eta_time
  from "case".events_case
  where event_type in ('PORT_ETA','PORT_ATA','PORT_ETD','PORT_ATD')
  group by hvdc_code, case_no
),
site_arr as (
  select hvdc_code, case_no, min(event_time_iso) as site_time
  from "case".events_case
  where event_type = 'SITE_ARRIVAL'
  group by hvdc_code, case_no
)
select
  round(avg(extract(epoch from (s.site_time - p.eta_time)) / 86400.0), 2) as avg_port_to_site_days,
  count(*)::bigint as sample_cases
from port_eta p
join site_arr s using (hvdc_code, case_no);
```

4. Customs 리스크(기간 상위)

```sql
select
  hvdc_code, case_no, customs_code, customs_days
from public.v_cases_kpi
where customs_days is not null
order by customs_days desc nulls last
limit 50;
```

---

### 3-B) “Shipment 상세(hvdc_code)” 페이지

1. 헤더 1행

```sql
select *
from public.v_shipments_master
where hvdc_code = :hvdc_code;
```

2. 케이스 리스트 + Flow + 리뷰 플래그

```sql
select *
from public.v_cases_kpi
where hvdc_code = :hvdc_code
order by requires_review desc, flow_code desc, case_no;
```

3. 타임라인(상위+정밀 합본)

```sql
select *
from public.v_shipments_timeline
where hvdc_code = :hvdc_code
order by event_time, layer;
```

---

### 3-C) “Warehouse 운영” 페이지

1. WH/MOSB 재고 현황(현재 위치 기준)

```sql
select
  location_code,
  location_name,
  category,
  count(*)::bigint as case_cnt
from public.v_wh_inventory_current
where category in ('WAREHOUSE','MOSB')
group by location_code, location_name, category
order by case_cnt desc, location_code;
```

2. WH 체류일(Dwell) — 마지막 WH_IN부터 현재까지(단순)

```sql
with last_wh_in as (
  select
    hvdc_code, case_no,
    max(event_time_iso) as wh_in_time
  from "case".events_case
  where event_type in ('WH_IN','MOSB_IN')
  group by hvdc_code, case_no
)
select
  round(avg(extract(epoch from (now() - wh_in_time)) / 86400.0), 2) as avg_dwell_days,
  count(*)::bigint as sample_cases
from last_wh_in;
```

---

### 3-D) “예외/리스크” 페이지

1. Flow Code 5 (대기/혼합/불완전) 케이스

```sql
select hvdc_code, case_no, flow_code, last_status
from "case".flows
where flow_code = 5
order by hvdc_code, case_no;
```

2. Site 도착 누락(최종 목적지가 AGI/DAS인데 has_site_arrival=false)

```sql
select
  c.hvdc_code, c.case_no, c.final_location, f.flow_code, f.has_site_arrival
from "case".cases c
join "case".flows f using (hvdc_code, case_no)
where upper(coalesce(c.final_location,'')) in ('AGI','DAS')
  and f.has_site_arrival = false
order by c.hvdc_code, c.case_no;
```

3. WH 매칭 품질(Orphan WH는 파일 리포트 + ops.etl_runs에 적재 권장)

* 운영 권장: `orphan_wh.json`을 `ops.etl_runs.report`에 넣고 `public.v_etl_health`로 보여주기

---

## Options A/B/C (운영 형태)

* **Option A (단순)**: 대시보드가 `status.*`만 조회 + 필요 시 케이스 상세만 `case.*`로 Drill-down

  * Cost 낮음 / Risk 중(페이지별 JOIN 분산) / Time 빠름
* **Option B (권장)**: 대시보드는 **`public.v_*` 뷰만** 조회(권한/성능/일관성 최적)

  * Cost 중 / Risk 중하 / Time 중
* **Option C (대규모/고성능)**: `public.v_wh_inventory_current`, `public.v_cases_kpi`를 **Materialized View**로 전환 + 인덱스/리프레시 스케줄

  * Cost 중상 / Risk 낮음 / Time 중상

---

## Roadmap (Prepare→Pilot→Build→Operate→Scale + KPI)

1. **Prepare**: 스키마/테이블/뷰 DDL 적용, Import 경로 확정(`status` → `case` 순)
2. **Pilot**: 1회 배치 후 KPI 확인

   * KPI: **SSOT Coverage 100.00%**, `flows_missing_case_fk = 0.00`, `events_missing_case_fk = 0.00`
3. **Build**: 대시보드 데이터 소스는 `public.v_*`로 고정(프론트 JOIN 금지)
4. **Operate**: `ops.etl_runs`에 report.json 적재 + 예외 알림(Flow5, Orphan, Customs 장기)
5. **Scale**: Materialized View + Refresh 정책(예: daily 1회)

---

## Automation notes (RPA/LLM/Sheets/TG)

* 배치 실행:

  * Status: `Untitled-4.py` → `status.shipments_status`, `status.events_status` 적재
  * Case: `Untitled-3.py` → `"case".*` 적재
* 적재 방식: 초기에는 CSV Import, 안정화 후 `COPY` 또는 Supabase Storage+Edge Function ingest로 전환(권장).

---

## QA 체크리스트

* **SSOT Gate**: `count(status.shipments_status) == count(input all status)`
* **키 무결성**: `events_case` / `flows`의 FK 누락 0.00
* **중복 이벤트**: `uq_events_case_natural` 위반 0.00
* **Flow 이상치**: `flow_code=5` 비율 추이 모니터링

---

## Acc (가정:)

* 가정: 대시보드 “전체 현황”은 `status_no(S No)` 정렬이 최우선이며, `hvdc_code`는 SSOT/Case 공통 조인 키입니다.
* 가정: Case 이벤트 시간은 `timestamptz`로 저장(스크립트에서 ISO+TZ 생성)합니다.

---

## 🔧 /cmd3

1. **Now:** `/switch_mode LATTICE + /logi-master report --deep` (커버리지/Orphan/Flow5 현황 리포트 고정)
2. **Next:** `/logi-master kpi-dash --KRsummary` (Vendor/Band/Flow 분포 위젯 세팅)
3. **Alt:** `/redo step` (Materialized View 전환/인덱스 튜닝)

---

## ZERO log

| 단계 | 이유                             | 위험                          | 요청데이터                | 다음조치                 |
| -- | ------------------------------ | --------------------------- | -------------------- | -------------------- |
| 정상 | 설계/DDL/쿼리 세트는 내부 구조 기반으로 확정 가능 | 실제 컬럼/CSV 헤더가 변하면 Import 실패 | (옵션) 실제 CSV 헤더 1회 캡처 | 헤더 변형 시 DDL/뷰만 PATCH |
