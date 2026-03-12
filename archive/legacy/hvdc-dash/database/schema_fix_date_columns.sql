-- ============================================================
-- SCHEMA REPAIR SCRIPT
-- Purpose: Fix warehouse_inventory columns from NUMERIC/INTEGER to DATE
-- Reason: Excel data contains dates for these fields, not quantities
-- ============================================================

-- 1. Disable RLS temporarily to avoid permission issues during alteration
ALTER TABLE warehouse_inventory DISABLE ROW LEVEL SECURITY;

-- 2. Drop the generated column 'total_inventory' first because it depends on these columns
ALTER TABLE warehouse_inventory DROP COLUMN IF EXISTS total_inventory;

-- 3. Alter columns to DATE type
-- We use 'USING NULL' because the current data (if any) might be garbage or empty.
-- Since migration failed, table is likely empty or has invalid data.
-- If you have data, you might want to truncate the table first: TRUNCATE TABLE warehouse_inventory CASCADE;

ALTER TABLE warehouse_inventory 
    ALTER COLUMN project_shu2 TYPE DATE USING NULL,
    ALTER COLUMN project_shu2 DROP DEFAULT,
    
    ALTER COLUMN project_mir3 TYPE DATE USING NULL,
    ALTER COLUMN project_mir3 DROP DEFAULT,
    
    ALTER COLUMN project_das4 TYPE DATE USING NULL,
    ALTER COLUMN project_das4 DROP DEFAULT,
    
    ALTER COLUMN project_agi5 TYPE DATE USING NULL,
    ALTER COLUMN project_agi5 DROP DEFAULT,
    
    ALTER COLUMN dsv_indoor TYPE DATE USING NULL,
    ALTER COLUMN dsv_outdoor TYPE DATE USING NULL,
    ALTER COLUMN dsv_mzd TYPE DATE USING NULL,
    
    ALTER COLUMN jdn_mzd TYPE DATE USING NULL,
    ALTER COLUMN jdn_waterfront TYPE DATE USING NULL,
    
    ALTER COLUMN mosb TYPE DATE USING NULL,
    ALTER COLUMN aaa_storage TYPE DATE USING NULL,
    ALTER COLUMN zener_wh TYPE DATE USING NULL,
    ALTER COLUMN hauler_dg_storage TYPE DATE USING NULL;

-- 4. Re-enable RLS
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- 5. Note: We removed 'total_inventory' as it was calculating sum of quantities. 
-- Since these are now dates, a 'total sum' doesn't make sense.
-- If you need a different logic for inventory status, we can add a new column later.

COMMENT ON TABLE warehouse_inventory IS '창고별 입고/보관 날짜 (Updated to DATE types)';
