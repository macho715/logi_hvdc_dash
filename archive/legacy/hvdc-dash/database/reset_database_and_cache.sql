-- ============================================================
-- FULL DATABASE RESET & FIX SCRIPT
-- Purpose: Drop all tables, Recreate with Correct Schema, Reload Cache
-- ============================================================

-- 1. Drop existing objects (CASCADE will drop dependent tables/views)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS shipment_tracking_log CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS warehouse_inventory CASCADE;
DROP TABLE IF EXISTS container_details CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

-- 2. CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 3. CREATE TABLES

-- [Shipments Table]
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sct_ship_no VARCHAR(50) UNIQUE NOT NULL,
    mr_number VARCHAR(50),
    booking_order_date DATE,
    sequence_no INTEGER,
    commercial_invoice_no VARCHAR(100),
    invoice_date DATE,
    invoice_value NUMERIC(15,2),
    invoice_currency VARCHAR(10) DEFAULT 'EUR',
    po_number VARCHAR(100),
    vendor VARCHAR(200),
    category VARCHAR(50),
    main_description TEXT,
    sub_description TEXT,
    project_shu BOOLEAN DEFAULT FALSE,
    project_das BOOLEAN DEFAULT FALSE,
    project_mir BOOLEAN DEFAULT FALSE,
    project_agi BOOLEAN DEFAULT FALSE,
    incoterms VARCHAR(10),
    freight_cost NUMERIC(12,2),
    insurance_cost NUMERIC(12,2),
    cif_value NUMERIC(15,2),
    coe VARCHAR(50),
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    bl_awb_no VARCHAR(100),
    vessel_name VARCHAR(200),
    vessel_imo_no VARCHAR(20),
    shipping_line VARCHAR(200),
    forwarder VARCHAR(200),
    ship_mode VARCHAR(10),
    package_qty INTEGER,
    gross_weight_kg NUMERIC(12,2),
    cbm NUMERIC(10,3),
    revenue_ton NUMERIC(10,3),
    actual_weight_kg NUMERIC(12,2), -- Confirmed presence
    etd DATE,
    atd DATE,
    eta DATE,
    ata DATE,
    attestation_date DATE,
    do_collection_date DATE,
    customs_start_date DATE,
    customs_close_date DATE,
    custom_code VARCHAR(50),
    duty_amount_aed NUMERIC(12,2),
    vat_amount_aed NUMERIC(12,2),
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    current_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    remarks TEXT
);

-- [Container Details Table]
CREATE TABLE container_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    qty_20dc INTEGER DEFAULT 0,
    qty_40dc INTEGER DEFAULT 0,
    qty_40hq INTEGER DEFAULT 0,
    qty_45hq INTEGER DEFAULT 0,
    qty_20ot_in INTEGER DEFAULT 0,
    qty_20ot_oh INTEGER DEFAULT 0,
    qty_40ot_in INTEGER DEFAULT 0,
    qty_40ot_oh INTEGER DEFAULT 0,
    qty_20fr_in INTEGER DEFAULT 0,
    qty_40fr_in INTEGER DEFAULT 0,
    qty_20fr_fv INTEGER DEFAULT 0,
    qty_40fr_ow INTEGER DEFAULT 0,
    qty_20fr_ow_oh INTEGER DEFAULT 0,
    qty_40fr_ow_oh INTEGER DEFAULT 0,
    qty_40fr_ow_ol INTEGER DEFAULT 0,
    qty_lcl INTEGER DEFAULT 0,
    total_containers INTEGER GENERATED ALWAYS AS (
        COALESCE(qty_20dc, 0) + COALESCE(qty_40dc, 0) + 
        COALESCE(qty_40hq, 0) + COALESCE(qty_45hq, 0) +
        COALESCE(qty_20ot_in, 0) + COALESCE(qty_20ot_oh, 0) +
        COALESCE(qty_40ot_in, 0) + COALESCE(qty_40ot_oh, 0) +
        COALESCE(qty_20fr_in, 0) + COALESCE(qty_40fr_in, 0) +
        COALESCE(qty_20fr_fv, 0) + COALESCE(qty_40fr_ow, 0) +
        COALESCE(qty_20fr_ow_oh, 0) + COALESCE(qty_40fr_ow_oh, 0) +
        COALESCE(qty_40fr_ow_ol, 0) + COALESCE(qty_lcl, 0)
    ) STORED,
    bulk_general NUMERIC(10,2),
    bulk_open NUMERIC(10,2),
    bulk_heavy NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- [Warehouse Inventory Table] (FIXED: Using DATE for tracking columns)
CREATE TABLE warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    project_shu2 DATE,
    project_mir3 DATE,
    project_das4 DATE,
    project_agi5 DATE,
    dsv_indoor DATE,
    dsv_outdoor DATE,
    dsv_mzd DATE,
    jdn_mzd DATE,
    jdn_waterfront DATE,
    mosb DATE,
    aaa_storage DATE,
    zener_wh DATE,
    hauler_dg_storage DATE,
    vijay_tanks DATE,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- [Other Tables]
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50),
    transaction_date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount_aed NUMERIC(15,2),
    exchange_rate NUMERIC(10,4),
    reference_no VARCHAR(100),
    vendor VARCHAR(200),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100)
);

CREATE TABLE shipment_tracking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(200),
    status_before VARCHAR(50),
    status_after VARCHAR(50),
    description TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_confidence NUMERIC(5,2),
    ocr_extracted_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICIES (Simplified for dev: Allow ALL for authenticated)
CREATE POLICY "Allow all for authenticated" ON shipments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON container_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON warehouse_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON financial_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON shipment_tracking_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. RELOAD SCHEMA CACHE (Critical for PGRST204 error)
NOTIFY pgrst, 'reload schema';
