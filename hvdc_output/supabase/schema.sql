-- Dashboard-Ready FULL (status schema)
create schema if not exists status;

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
  warehouse_last_location_code text,
  warehouse_last_date date,
  raw jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_status_no on status.shipments_status(status_no);
create index if not exists idx_shipments_vendor on status.shipments_status(vendor);
create index if not exists idx_shipments_band on status.shipments_status(band);
create index if not exists idx_shipments_whflag on status.shipments_status(warehouse_flag);

create table if not exists status.events_status (
  event_id text primary key,
  hvdc_code text not null references status.shipments_status(hvdc_code) on delete cascade,
  event_type text not null,
  location text not null,
  location_code text,
  location_match_method text,
  location_match_score numeric,
  event_date date not null,
  source text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_hvdc on status.events_status(hvdc_code);
create index if not exists idx_events_date on status.events_status(event_date);
create index if not exists idx_events_loc_code on status.events_status(location_code);

-- If you already created tables before, apply incremental alters:
alter table status.shipments_status add column if not exists warehouse_last_location_code text;
alter table status.events_status add column if not exists location_code text;
alter table status.events_status add column if not exists location_match_method text;
alter table status.events_status add column if not exists location_match_score numeric;
