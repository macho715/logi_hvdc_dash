-- hvdc_copy_templates.sql
-- NOTE: Supabase hosted does not allow server-side COPY FROM local path.
-- Use psql \copy (client-side) OR Supabase Table Editor Import.

------------------------------------------------------------
-- Status shipments load (staging + upsert)
------------------------------------------------------------
create temporary table if not exists staging_shipments_status (like status.shipments_status including defaults);

-- psql example:
-- \copy staging_shipments_status(
--   hvdc_code,status_no,vendor,band,incoterms,currency,pol,pod,bl_awb,vessel,ship_mode,
--   pkg,qty_cntr,cbm,gwt_kg,etd,eta,ata,warehouse_flag,warehouse_last_location,warehouse_last_date,raw
-- )
-- from 'hvdc_output/supabase/shipments.csv' with (format csv, header true, encoding 'UTF8');

insert into status.shipments_status as t
select * from staging_shipments_status
on conflict (hvdc_code) do update set
  status_no=excluded.status_no,
  vendor=excluded.vendor,
  band=excluded.band,
  incoterms=excluded.incoterms,
  currency=excluded.currency,
  pol=excluded.pol,
  pod=excluded.pod,
  bl_awb=excluded.bl_awb,
  vessel=excluded.vessel,
  ship_mode=excluded.ship_mode,
  pkg=excluded.pkg,
  qty_cntr=excluded.qty_cntr,
  cbm=excluded.cbm,
  gwt_kg=excluded.gwt_kg,
  etd=excluded.etd,
  eta=excluded.eta,
  ata=excluded.ata,
  warehouse_flag=excluded.warehouse_flag,
  warehouse_last_location=excluded.warehouse_last_location,
  warehouse_last_date=excluded.warehouse_last_date,
  raw=excluded.raw,
  updated_at=now();

------------------------------------------------------------
-- Status events load (staging + upsert)
------------------------------------------------------------
create temporary table if not exists staging_events_status (like status.events_status including defaults);

-- \copy staging_events_status(event_id,hvdc_code,event_type,location,event_date,source,raw)
-- from 'hvdc_output/supabase/logistics_events.csv' with (format csv, header true, encoding 'UTF8');

insert into status.events_status as t
select * from staging_events_status
on conflict (event_id) do update set
  hvdc_code=excluded.hvdc_code,
  event_type=excluded.event_type,
  location=excluded.location,
  event_date=excluded.event_date,
  source=excluded.source,
  raw=excluded.raw;

------------------------------------------------------------
-- Option-C load (case.*) - recommended order: locations -> shipments_case -> cases -> flows -> events_case
------------------------------------------------------------
-- \copy "case".locations(location_id,location_code,name,category,hvdc_node,is_mosb,is_site,is_port,active)
-- from 'hvdc_output/optionC/locations.csv' with (format csv, header true, encoding 'UTF8');

-- \copy "case".shipments_case(hvdc_code,shipment_invoice_no,vendor,coe,pol,pod,vessel,hs_code,currency,price)
-- from 'hvdc_output/optionC/shipments.csv' with (format csv, header true, encoding 'UTF8');

-- \copy "case".cases(hvdc_code,case_no,site_code,eq_no,pkg,description,final_location,storage,l_cm,w_cm,h_cm,cbm,nw_kg,gw_kg,sqm,vendor)
-- from 'hvdc_output/optionC/cases.csv' with (format csv, header true, encoding 'UTF8');

-- \copy "case".flows(hvdc_code,case_no,flow_code,flow_code_original,flow_code_derived,override_reason,warehouse_count,has_mosb_leg,has_site_arrival,customs_code,customs_start_iso,customs_end_iso,last_status,requires_review)
-- from 'hvdc_output/optionC/flows.csv' with (format csv, header true, encoding 'UTF8');

-- \copy "case".events_case(hvdc_code,case_no,event_type,event_time_iso,location_id,source_field,source_system,raw_epoch_ms)
-- from 'hvdc_output/optionC/events.csv' with (format csv, header true, encoding 'UTF8');

-- \copy "case".events_case_debug(hvdc_code,case_no,event_type,event_time_iso,location_code,source_field,source_system,raw_epoch_ms)
-- from 'hvdc_output/optionC/events_debug.csv' with (format csv, header true, encoding 'UTF8');

