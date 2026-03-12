-- Enable Supabase Realtime (Postgres Changes) for HVDC dashboard tables
--
-- References:
-- - Supabase Docs: Postgres Changes (enable via Publications or SQL)
--   https://supabase.com/docs/guides/realtime/postgres-changes
--
-- Notes:
-- - This migration is idempotent: it adds tables only if they exist and are not already in the publication.
-- - It supports both the *layered* schema (status/case) and legacy/public tables if present.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('status', 'shipments_status'),
      ('status', 'events_status'),
      ('case', 'events_case'),
      ('case', 'flows'),
      ('case', 'cases'),
      -- optional/legacy tables (only if they exist)
      ('public', 'shipments'),
      ('public', 'events'),
      ('public', 'location_statuses'),
      ('public', 'hvdc_worklist'),
      ('public', 'hvdc_kpis')
    ) AS t(schemaname, tablename)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = rec.schemaname
        AND table_name = rec.tablename
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = rec.schemaname
          AND tablename = rec.tablename
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I.%I;', rec.schemaname, rec.tablename);
      END IF;
    END IF;
  END LOOP;
END $$;
