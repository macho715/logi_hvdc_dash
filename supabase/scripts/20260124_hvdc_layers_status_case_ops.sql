-- 20260124_hvdc_layers_status_case_ops.sql
-- HVDC SSOT(Status) + Option-C(Case/Flow/KPI) + Ops(Audit) layer setup
-- Safe naming: create schemas status / case / ops, and public views v_* for dashboard reads.
-- NOTE: This migration does NOT assume existence of public.shipments/public.events in 20260101_initial_schema.sql.
--       It creates separate tables and views. If you want to map into existing public tables, see RUNBOOK.

create schema if not exists status;
create schema if not exists "case";
create schema if not exists ops;

create extension if not exists pgcrypto;

------------------------------------------------------------
-- 1) Status layer (SSOT)
------------------------------------------------------------
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
create index if not exists idx_ss_eta on status.shipments_status(eta);
create index if not exists idx_ss_pod on status.shipments_status(pod);

create table if not exists status.events_status (
  event_id text primary key,
  hvdc_code text not null references status.shipments_status(hvdc_code) on delete cascade,
  event_type text not null,      -- WH/SITE/PORT/GEN (ETL 기준)
  location text not null,
  event_date date not null,
  source text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_es_hvdc on status.events_status(hvdc_code);
create index if not exists idx_es_date on status.events_status(event_date);
create index if not exists idx_es_type on status.events_status(event_type);
create index if not exists idx_es_loc on status.events_status(location);

------------------------------------------------------------
-- 2) Case layer (Option-C)
------------------------------------------------------------
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

create index if not exists idx_sc_vendor on "case".shipments_case(vendor);
create index if not exists idx_sc_pod on "case".shipments_case(pod);

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
  created_at timestamptz not null default now(),
  constraint cases_pk primary key (hvdc_code, case_no)
);

create index if not exists idx_cases_hvdc on "case".cases(hvdc_code);
create index if not exists idx_cases_final on "case".cases(final_location);
create index if not exists idx_cases_vendor on "case".cases(vendor);

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
  created_at timestamptz not null default now(),
  constraint flows_pk primary key (hvdc_code, case_no),
  constraint flows_cases_fk foreign key (hvdc_code, case_no)
    references "case".cases(hvdc_code, case_no) on delete cascade
);

create index if not exists idx_flows_fc on "case".flows(flow_code);
create index if not exists idx_flows_review on "case".flows(requires_review);
create index if not exists idx_flows_customs on "case".flows(customs_start_iso, customs_end_iso);

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

create index if not exists idx_loc_category on "case".locations(category);
create index if not exists idx_loc_code on "case".locations(location_code);

create table if not exists "case".events_case (
  event_id bigserial primary key,
  hvdc_code text not null,
  case_no text not null,
  event_type text not null,          -- PORT_ETD/WH_IN/MOSB_IN/SITE_ARRIVAL/CUSTOMS_END...
  event_time_iso timestamptz not null,
  location_id integer not null references "case".locations(location_id),
  source_field text not null,
  source_system text not null,
  raw_epoch_ms bigint,
  created_at timestamptz not null default now(),
  constraint events_case_fk foreign key (hvdc_code, case_no)
    references "case".cases(hvdc_code, case_no) on delete cascade
);

create unique index if not exists uq_events_case_natural
on "case".events_case(hvdc_code, case_no, event_type, event_time_iso, location_id, source_field, source_system);

create index if not exists idx_events_case_hvdc on "case".events_case(hvdc_code, case_no);
create index if not exists idx_events_case_time on "case".events_case(event_time_iso);
create index if not exists idx_events_case_type on "case".events_case(event_type);
create index if not exists idx_events_case_loc on "case".events_case(location_id);

create table if not exists "case".events_case_debug (
  debug_id bigserial primary key,
  hvdc_code text not null,
  case_no text not null,
  event_type text not null,
  event_time_iso timestamptz not null,
  location_code text not null,
  source_field text not null,
  source_system text not null,
  raw_epoch_ms bigint,
  created_at timestamptz not null default now()
);

------------------------------------------------------------
-- 3) Ops layer (Audit)
------------------------------------------------------------
create table if not exists ops.etl_runs (
  run_id uuid primary key default gen_random_uuid(),
  pipeline text not null,               -- 'status' | 'case' | 'ontology'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  report jsonb,
  ok boolean not null default true
);

create index if not exists idx_etl_runs_pipeline on ops.etl_runs(pipeline, started_at desc);

------------------------------------------------------------
-- 4) Dashboard views (public.v_*)
------------------------------------------------------------

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

create or replace view public.v_flow_distribution as
select
  hvdc_code,
  flow_code,
  count(*)::bigint as case_cnt
from "case".flows
group by hvdc_code, flow_code;

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

create or replace view public.v_case_event_segments as
select
  e.hvdc_code,
  e.case_no,
  e.event_type as curr_event_type,
  e.event_time_iso as curr_event_time,
  e.location_id as curr_location_id,
  lag(e.event_type) over w as prev_event_type,
  lag(e.event_time_iso) over w as prev_event_time,
  lag(e.location_id) over w as prev_location_id,
  round(extract(epoch from (e.event_time_iso - lag(e.event_time_iso) over w)) / 3600.0, 2) as hours_between_events
from "case".events_case e
window w as (
  partition by e.hvdc_code, e.case_no
  order by e.event_time_iso
);

create or replace view public.v_case_segments as
with timeline as (
  select
    c.hvdc_code,
    c.case_no,
    c.final_location,

    min(case when e.event_type in ('PORT_ETA','PORT_ATA') then e.event_time_iso end) as port_arrival,
    min(case when e.event_type in ('CUSTOMS_START','CUSTOMS_FORMAL_START','DO_COLLECTION') then e.event_time_iso end) as customs_doc_start,

    min(case when e.event_type = 'WH_IN' then e.event_time_iso end) as first_wh_in,
    max(case when e.event_type = 'WH_OUT_DERIVED' then e.event_time_iso end) as last_wh_out,

    min(case when e.event_type = 'MOSB_IN' then e.event_time_iso end) as mosb_in,
    min(case when e.event_type = 'MOSB_OUT_DERIVED' then e.event_time_iso end) as mosb_out,

    min(case when e.event_type = 'SITE_ARRIVAL' then e.event_time_iso end) as site_arrival,

    f.customs_start_iso as customs_start,
    f.customs_end_iso as customs_end

  from "case".cases c
  left join "case".events_case e
    on e.hvdc_code = c.hvdc_code
   and e.case_no   = c.case_no
  left join "case".flows f
    on f.hvdc_code = c.hvdc_code
   and f.case_no   = c.case_no
  group by c.hvdc_code, c.case_no, c.final_location, f.customs_start_iso, f.customs_end_iso
)
select
  t.*,
  round(extract(epoch from (t.customs_end - t.port_arrival)) / 3600.0, 2) as hours_port_to_customs_end,
  round(extract(epoch from (t.customs_end - t.customs_start)) / 3600.0, 2) as hours_customs_window,
  round(extract(epoch from (t.customs_end - t.customs_doc_start)) / 3600.0, 2) as hours_customs_docs,
  round(extract(epoch from (t.last_wh_out - t.first_wh_in)) / 3600.0, 2) as hours_wh_dwell,
  round(extract(epoch from (t.mosb_out - t.mosb_in)) / 3600.0, 2) as hours_mosb_dwell,
  round(extract(epoch from (t.site_arrival - coalesce(t.mosb_out, t.mosb_in, t.last_wh_out))) / 3600.0, 2) as hours_last_leg,
  round(extract(epoch from (t.site_arrival - t.port_arrival)) / 3600.0, 2) as hours_port_to_site
from timeline t;

create or replace view public.v_kpi_site_flow_daily as
select
  date_trunc('day', k.site_arrival) as site_day,
  k.final_location as site_code,
  f.flow_code,
  count(*)::bigint as cases_count,
  round(avg(k.hours_port_to_site), 2) as avg_port_to_site_hours,
  round(avg(k.hours_customs_window), 2) as avg_customs_hours,
  round(avg(k.hours_last_leg), 2) as avg_last_leg_hours,
  round(avg(k.hours_wh_dwell), 2) as avg_wh_dwell_hours,
  round(avg(k.hours_mosb_dwell), 2) as avg_mosb_dwell_hours
from public.v_case_segments k
join "case".flows f
  on f.hvdc_code = k.hvdc_code and f.case_no = k.case_no
where k.site_arrival is not null
group by site_day, k.final_location, f.flow_code;

