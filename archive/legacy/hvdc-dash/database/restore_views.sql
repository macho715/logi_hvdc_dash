-- ============================================================
-- RESTORE MISSING VIEWS & RELOAD CACHE
-- Purpose: Fix 'Failed to fetch' (500) error
-- ============================================================

-- 1. v_shipment_overview
DROP VIEW IF EXISTS v_shipment_overview;
CREATE OR REPLACE VIEW v_shipment_overview AS
SELECT 
    s.id,
    s.sct_ship_no,
    s.mr_number,
    s.commercial_invoice_no,
    s.vendor,
    s.main_description,
    s.port_of_loading,
    s.port_of_discharge,
    s.vessel_name,
    s.etd,
    s.eta,
    s.ata,
    s.status,
    s.invoice_value,
    s.invoice_currency,
    s.cif_value,
    c.total_containers,
    s.gross_weight_kg,
    s.cbm,
    s.customs_close_date,
    s.delivery_date,
    CASE 
        WHEN s.ata IS NOT NULL THEN 'Arrived'
        WHEN s.atd IS NOT NULL THEN 'In Transit'
        WHEN s.etd IS NOT NULL THEN 'Scheduled'
        ELSE 'Pending'
    END as transit_status
FROM shipments s
LEFT JOIN container_details c ON s.id = c.shipment_id
LEFT JOIN warehouse_inventory w ON s.id = w.shipment_id;

-- 2. v_warehouse_status
CREATE OR REPLACE VIEW v_warehouse_status AS
SELECT 
    s.sct_ship_no,
    s.main_description,
    w.dsv_indoor,
    w.dsv_outdoor,
    w.dsv_mzd,
    w.jdn_mzd,
    w.jdn_waterfront,
    w.mosb,
    w.aaa_storage,
    w.zener_wh,
    s.delivery_date
FROM warehouse_inventory w
JOIN shipments s ON w.shipment_id = s.id;

-- 3. v_financial_summary
CREATE OR REPLACE VIEW v_financial_summary AS
SELECT 
    s.sct_ship_no,
    s.vendor,
    s.invoice_value,
    s.invoice_currency,
    s.freight_cost,
    s.insurance_cost,
    s.cif_value,
    s.duty_amount_aed,
    s.vat_amount_aed,
    (COALESCE(s.duty_amount_aed, 0) + COALESCE(s.vat_amount_aed, 0)) as total_customs_fees,
    ft.transaction_type,
    ft.amount as transaction_amount,
    ft.status as payment_status
FROM shipments s
LEFT JOIN financial_transactions ft ON s.id = ft.shipment_id;

-- 4. Grant Permissions
GRANT SELECT ON v_shipment_overview TO anon, authenticated, service_role;
GRANT SELECT ON v_warehouse_status TO anon, authenticated, service_role;
GRANT SELECT ON v_financial_summary TO anon, authenticated, service_role;

-- 5. !!! IMPORTANT !!! RELOAD API CACHE
NOTIFY pgrst, 'reload schema';
