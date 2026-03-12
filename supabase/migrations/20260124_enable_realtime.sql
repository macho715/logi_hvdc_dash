-- 20260124_enable_realtime.sql
-- Enable Supabase Realtime (Postgres Changes) for required tables.
-- Idempotent: only adds tables not already present in the publication.
-- Note: Use schema-qualified names for Option-C layer tables.

-- ============================================================
-- Enable Realtime Publication for Public Schema Tables
-- ============================================================

do $$
declare
  t text;
  tables text[] := array[
    'public.shipments',
    'public.location_statuses',
    'public.hvdc_kpis'
    -- Note: public.events and public.hvdc_worklist can be added if needed
    -- 'public.events',
    -- 'public.hvdc_worklist'
  ];
begin
  foreach t in array tables loop
    -- Parse schema and table name
    declare
      schema_name text;
      table_name text;
    begin
      if position('.' in t) > 0 then
        schema_name := split_part(t, '.', 1);
        table_name := split_part(t, '.', 2);
        -- Remove quotes from schema if present
        schema_name := trim(both '"' from schema_name);
      else
        schema_name := 'public';
        table_name := t;
      end if;

      -- Check if table exists
      if exists (
        select 1
        from information_schema.tables
        where table_schema = schema_name and table_name = table_name
      ) then
        -- Check if already in publication
        if not exists (
          select 1
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = schema_name
            and tablename = table_name
        ) then
          execute format('alter publication supabase_realtime add table %I.%I', schema_name, table_name);
          raise notice 'Added table to Realtime publication: %.%', schema_name, table_name;
        else
          raise notice 'Table already in Realtime publication: %.%', schema_name, table_name;
        end if;
      else
        raise notice 'Table does not exist, skipping: %.%', schema_name, table_name;
      end if;
    end;
  end loop;
end $$;

-- ============================================================
-- Enable Realtime Publication for Status Schema Tables
-- ============================================================
-- Only add if status schema exists and tables are populated

do $$
declare
  t text;
  tables text[] := array[
    'status.shipments_status',
    'status.events_status'
  ];
begin
  foreach t in array tables loop
    declare
      schema_name text;
      table_name text;
    begin
      if position('.' in t) > 0 then
        schema_name := split_part(t, '.', 1);
        table_name := split_part(t, '.', 2);
        schema_name := trim(both '"' from schema_name);
      else
        schema_name := 'public';
        table_name := t;
      end if;

      if exists (
        select 1
        from information_schema.tables
        where table_schema = schema_name and table_name = table_name
      ) then
        if not exists (
          select 1
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = schema_name
            and tablename = table_name
        ) then
          execute format('alter publication supabase_realtime add table %I.%I', schema_name, table_name);
          raise notice 'Added table to Realtime publication: %.%', schema_name, table_name;
        else
          raise notice 'Table already in Realtime publication: %.%', schema_name, table_name;
        end if;
      else
        raise notice 'Table does not exist, skipping: %.%', schema_name, table_name;
      end if;
    end;
  end loop;
end $$;

-- ============================================================
-- Enable Realtime Publication for Case Schema Tables (Option-C)
-- ============================================================
-- Only add if case schema exists and tables are populated
-- These are critical for Option C KPI strategy (segment-level KPIs)

do $$
declare
  t text;
  tables text[] := array[
    '"case".events_case',
    '"case".flows',
    '"case".cases'
    -- Optional: add if needed for location updates
    -- '"case".locations',
    -- '"case".shipments_case'
  ];
begin
  foreach t in array tables loop
    declare
      schema_name text;
      table_name text;
    begin
      if position('.' in t) > 0 then
        -- Handle quoted schema names like "case"
        if t like '"%.%' then
          schema_name := split_part(split_part(t, '.', 1), '"', 2);
          table_name := split_part(t, '.', 2);
        else
          schema_name := split_part(t, '.', 1);
          table_name := split_part(t, '.', 2);
          schema_name := trim(both '"' from schema_name);
        end if;
      else
        schema_name := 'public';
        table_name := t;
      end if;

      if exists (
        select 1
        from information_schema.tables
        where table_schema = schema_name and table_name = table_name
      ) then
        if not exists (
          select 1
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = schema_name
            and tablename = table_name
        ) then
          execute format('alter publication supabase_realtime add table %I.%I', schema_name, table_name);
          raise notice 'Added table to Realtime publication: %.%', schema_name, table_name;
        else
          raise notice 'Table already in Realtime publication: %.%', schema_name, table_name;
        end if;
      else
        raise notice 'Table does not exist, skipping: %.%', schema_name, table_name;
      end if;
    end;
  end loop;
end $$;

-- ============================================================
-- Verify Realtime Publication Status
-- ============================================================
-- Run this query to see which tables are enabled for Realtime

-- SELECT 
--   schemaname,
--   tablename
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
-- ORDER BY schemaname, tablename;

-- ============================================================
-- Notes
-- ============================================================
-- 1. This migration is idempotent - safe to run multiple times
-- 2. Tables are only added if they exist in the database
-- 3. Schema-qualified names are used for status.* and "case".* schemas
-- 4. Ensure RLS policies exist before enabling Realtime (see docs/guides/realtime-config-review.md)
-- 5. Realtime subscriptions require SELECT permissions via RLS policies
