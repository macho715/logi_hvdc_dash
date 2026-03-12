-- ============================================================
-- FINAL WAREHOUSE SCHEMA FIX
-- Purpose: Recreate warehouse_inventory table with DATE types
-- Reason: Excel data contains dates (e.g. 2024-01-26), not quantities.
-- ============================================================

-- 1. Drop existing table (Data will be re-imported via migration script)
DROP TABLE IF EXISTS warehouse_inventory CASCADE;

-- 2. Create table with correct DATE types
CREATE TABLE warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- Project Tracking Dates (Changed from INTEGER to DATE)
    project_shu2 DATE,
    project_mir3 DATE,
    project_das4 DATE,
    project_agi5 DATE,
    
    -- DSV Warehouse Dates (Changed from NUMERIC to DATE)
    dsv_indoor DATE,
    dsv_outdoor DATE,
    dsv_mzd DATE,
    
    -- JDN Warehouse Dates (Changed from NUMERIC to DATE)
    jdn_mzd DATE,
    jdn_waterfront DATE,
    
    -- Other Storage Dates (Changed from NUMERIC to DATE)
    mosb DATE,
    aaa_storage DATE,
    zener_wh DATE,
    hauler_dg_storage DATE,
    vijay_tanks DATE,
    
    -- Note: Removed 'total_inventory' generated column as these are now dates, not quantities.
    
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Restore RLS Policies
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON warehouse_inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON warehouse_inventory
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON warehouse_inventory
    FOR UPDATE TO authenticated USING (true);

-- 4. Restore Indexes
CREATE INDEX idx_warehouse_shipment_id ON warehouse_inventory(shipment_id);

-- 5. Restore Trigger
CREATE TRIGGER update_warehouse_updated_at BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE warehouse_inventory IS '창고/프로젝트 단계별 추적 날짜 (Corrected Schema)';
