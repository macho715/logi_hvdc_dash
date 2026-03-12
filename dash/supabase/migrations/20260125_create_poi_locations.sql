-- 20260125_create_poi_locations.sql
-- Purpose: Create a small, ops-safe POI table to render fixed locations on the dashboard map.
-- Notes:
-- - This is OPTIONAL. v1 of the UI can use a frontend constant list.
-- - Table is intentionally separate from ETL-managed tables to avoid drift.

begin;

create table if not exists public.poi_locations (
  id text primary key,
  code text not null unique,
  name text not null,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  summary text not null,
  priority integer not null default 500,
  source text,
  assumptions text[]
);

alter table public.poi_locations enable row level security;

-- Safe default: allow read for anon/authenticated.
-- Adjust if you want to hide any points.
create policy if not exists "poi_locations_read" on public.poi_locations
  for select
  using (true);

-- Seed data (id/code/name/category/lat/lng/address/summary/priority/source/assumptions)
insert into public.poi_locations (id, code, name, category, latitude, longitude, address, summary, priority, source, assumptions)
values
  ('agi-jetty','AGI','Al Ghallan Island (Jetty · Representative)','HVDC_SITE',24.841096,53.658619,'Al Ghallan Island Jetty, Abu Dhabi, UAE (representative point)','HVDC Site · Jetty (rep.)',950,'map.md',array['Breakwater W/E midpoint used as operational representative.']),
  ('das-island','DAS','Das Island (Center)','HVDC_SITE',25.147700,52.875000,'Das Island, Al Dhafra Region, Abu Dhabi, UAE','HVDC Site · Island',940,'map.md',null),
  ('mirfa-iwpp','MIR','Mirfa IWPP (Plant)','HVDC_SITE',24.118850,53.444360,'Mirfa IWPP, Al Marfa, Abu Dhabi, UAE','HVDC Site · IWPP',940,'map.md',null),
  ('shuweihat-complex','SHU','Shuweihat Complex (Center)','HVDC_SITE',24.160170,52.572920,'Shuweihat Complex, Jabel Al Dhannah, Abu Dhabi, UAE','HVDC Site · Complex',940,'map.md',null),
  ('dsv-mussafah-office-m19','DSV-M19','DSV Mussafah Office (M-19)','OFFICE',24.366698,54.476102,'M-19, Mussafah Industrial Area, Abu Dhabi, UAE','Office · DSV (M-19)',820,'map.md',null),
  ('dsv-mussafah-warehouse-m44','DSV-M44','DSV Inland Warehouse (M-44 · Representative)','WAREHOUSE',24.344700,54.581830,'M-44, Mussafah Industrial Area, Abu Dhabi, UAE (representative point)','Warehouse · DSV (M-44)',840,'map.md',array['Public source indicates M-44 locality center; replace with gate/block when confirmed.']),
  ('mosb-esnaad','MOSB','MOSB (Mussafah Offshore Support Base · ESNAAD)','YARD',24.324790,54.466850,'MOSB, Mussafah, Abu Dhabi, UAE','Yard · MOSB (ESNAAD)',780,'map.md',null),
  ('mosb-samsung-yard','MOSB-SAM','MOSB Samsung Yard (Representative)','YARD',24.324790,54.466850,'MOSB Samsung Yard, Abu Dhabi, UAE (representative point)','Yard · Samsung (rep.)',770,'map.md',array['Uses MOSB representative coordinate; replace with gate when confirmed.']),
  ('zayed-port','MZP','Mina Zayed (Zayed) Port (Representative)','PORT',24.524890,54.377980,'Zayed Port, Abu Dhabi, UAE','Port · Zayed',900,'map.md',null),
  ('khalifa-port-kpct','KPP','Khalifa Port (KPCT · Container Terminal)','PORT',24.809500,54.648420,'Khalifa Port, Abu Dhabi, UAE','Port · Khalifa (KPCT)',910,'map.md',null),
  ('auh-airport','AUH','Abu Dhabi (Zayed) International Airport (AUH)','AIRPORT',24.441000,54.649200,'Zayed International Airport (AUH), Abu Dhabi, UAE','Airport · AUH',860,'map.md',null)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  summary = excluded.summary,
  priority = excluded.priority,
  source = excluded.source,
  assumptions = excluded.assumptions;

commit;
