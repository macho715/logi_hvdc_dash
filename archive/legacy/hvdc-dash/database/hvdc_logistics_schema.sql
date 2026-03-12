-- ============================================================
-- HVDC LOGISTICS DATABASE SCHEMA FOR SUPABASE
-- 설계: Samsung C&T HVDC Lightning Project
-- 작성일: 2025-01-08
-- ============================================================

-- Extensions 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색 최적화

-- ============================================================
-- 1. CORE SHIPMENT TABLE (선적 마스터)
-- ============================================================
CREATE TABLE shipments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 기본 식별 정보
    sct_ship_no VARCHAR(50) UNIQUE NOT NULL,
    mr_number VARCHAR(50),
    booking_order_date DATE,
    sequence_no INTEGER,
    
    -- 송장 정보
    commercial_invoice_no VARCHAR(100),
    invoice_date DATE,
    invoice_value NUMERIC(15,2),
    invoice_currency VARCHAR(10) DEFAULT 'EUR',
    
    -- 구매 정보
    po_number VARCHAR(100),
    vendor VARCHAR(200),
    category VARCHAR(50),
    
    -- 물품 설명
    main_description TEXT,
    sub_description TEXT,
    
    -- 프로젝트 분류 (SHU, DAS, MIR, AGI)
    project_shu BOOLEAN DEFAULT FALSE,
    project_das BOOLEAN DEFAULT FALSE,
    project_mir BOOLEAN DEFAULT FALSE,
    project_agi BOOLEAN DEFAULT FALSE,
    
    -- 무역 조건
    incoterms VARCHAR(10),
    
    -- 금액 정보
    freight_cost NUMERIC(12,2),
    insurance_cost NUMERIC(12,2),
    cif_value NUMERIC(15,2),
    coe VARCHAR(50), -- Country of Export
    
    -- 항구 정보
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    
    -- 선박/운송 정보
    bl_awb_no VARCHAR(100),
    vessel_name VARCHAR(200),
    vessel_imo_no VARCHAR(20),
    shipping_line VARCHAR(200),
    forwarder VARCHAR(200),
    ship_mode VARCHAR(10), -- B(Boat), A(Air)
    
    -- 중량 및 부피
    package_qty INTEGER,
    gross_weight_kg NUMERIC(12,2),
    cbm NUMERIC(10,3),
    revenue_ton NUMERIC(10,3),
    actual_weight_kg NUMERIC(12,2),
    
    -- 일정 (ETD/ATD/ETA/ATA)
    etd DATE,
    atd DATE,
    eta DATE,
    ata DATE,
    
    -- 증명 및 문서 날짜
    attestation_date DATE,
    do_collection_date DATE,
    
    -- 통관 정보
    customs_start_date DATE,
    customs_close_date DATE,
    custom_code VARCHAR(50),
    duty_amount_aed NUMERIC(12,2),
    vat_amount_aed NUMERIC(12,2),
    
    -- 최종 배송
    delivery_date DATE,
    
    -- 상태 추적
    status VARCHAR(50) DEFAULT 'pending',
    current_location VARCHAR(100),
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 비고
    remarks TEXT,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (
        (etd IS NULL OR atd IS NULL OR etd <= atd) AND
        (eta IS NULL OR ata IS NULL OR eta <= ata)
    ),
    CONSTRAINT valid_amounts CHECK (
        invoice_value >= 0 AND
        freight_cost >= 0 AND
        insurance_cost >= 0
    )
);

-- ============================================================
-- 2. CONTAINER DETAILS TABLE (컨테이너 상세)
-- ============================================================
CREATE TABLE container_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- 컨테이너 타입별 수량
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
    
    -- 총 컨테이너 수
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
    
    -- Bulk 화물
    bulk_general NUMERIC(10,2),
    bulk_open NUMERIC(10,2),
    bulk_heavy NUMERIC(10,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. WAREHOUSE INVENTORY TABLE (창고 재고)
-- ============================================================
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

-- ============================================================
-- 4. FINANCIAL TRANSACTIONS TABLE (재무 트랜잭션)
-- ============================================================
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    transaction_type VARCHAR(50), -- invoice, payment, duty, vat, freight
    transaction_date DATE NOT NULL,
    
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount_aed NUMERIC(15,2), -- AED 환산 금액
    exchange_rate NUMERIC(10,4),
    
    reference_no VARCHAR(100),
    vendor VARCHAR(200),
    description TEXT,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
    payment_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- ============================================================
-- 5. SHIPMENT TRACKING LOG (선적 추적 로그)
-- ============================================================
CREATE TABLE shipment_tracking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL, -- departure, arrival, customs, warehouse_in, delivery
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(200),
    
    status_before VARCHAR(50),
    status_after VARCHAR(50),
    
    description TEXT,
    created_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. DOCUMENTS TABLE (문서 관리)
-- ============================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL, -- invoice, bl, packing_list, certificate, customs
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT, -- Supabase Storage path
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    upload_date TIMESTAMP DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    
    -- OCR 처리 상태
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_confidence NUMERIC(5,2),
    ocr_extracted_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES (성능 최적화)
-- ============================================================

-- Shipments 테이블 인덱스
CREATE INDEX idx_shipments_sct_ship_no ON shipments(sct_ship_no);
CREATE INDEX idx_shipments_mr_number ON shipments(mr_number);
CREATE INDEX idx_shipments_invoice_no ON shipments(commercial_invoice_no);
CREATE INDEX idx_shipments_po_number ON shipments(po_number);
CREATE INDEX idx_shipments_vendor ON shipments(vendor);
CREATE INDEX idx_shipments_bl_no ON shipments(bl_awb_no);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_etd ON shipments(etd);
CREATE INDEX idx_shipments_eta ON shipments(eta);
CREATE INDEX idx_shipments_ata ON shipments(ata);
CREATE INDEX idx_shipments_delivery_date ON shipments(delivery_date);

-- 텍스트 검색 인덱스 (GIN)
CREATE INDEX idx_shipments_main_desc_gin ON shipments USING gin(main_description gin_trgm_ops);
CREATE INDEX idx_shipments_vendor_gin ON shipments USING gin(vendor gin_trgm_ops);

-- Container Details 인덱스
CREATE INDEX idx_containers_shipment_id ON container_details(shipment_id);

-- Warehouse 인덱스
CREATE INDEX idx_warehouse_shipment_id ON warehouse_inventory(shipment_id);

-- Financial 인덱스
CREATE INDEX idx_financial_shipment_id ON financial_transactions(shipment_id);
CREATE INDEX idx_financial_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_status ON financial_transactions(status);

-- Tracking Log 인덱스
CREATE INDEX idx_tracking_shipment_id ON shipment_tracking_log(shipment_id);
CREATE INDEX idx_tracking_event_type ON shipment_tracking_log(event_type);
CREATE INDEX idx_tracking_event_date ON shipment_tracking_log(event_date);

-- Documents 인덱스
CREATE INDEX idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- 1. Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers 적용
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON container_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_updated_at BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. 선적 상태 변경 로그 자동 기록
CREATE OR REPLACE FUNCTION log_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO shipment_tracking_log (
            shipment_id,
            event_type,
            event_date,
            status_before,
            status_after,
            description
        ) VALUES (
            NEW.id,
            'status_change',
            NOW(),
            OLD.status,
            NEW.status,
            'Status automatically changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_status_changes AFTER UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION log_shipment_status_change();

-- 3. CIF 값 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_cif_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cif_value = COALESCE(NEW.invoice_value, 0) + 
                    COALESCE(NEW.freight_cost, 0) + 
                    COALESCE(NEW.insurance_cost, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_cif BEFORE INSERT OR UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION calculate_cif_value();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- RLS 활성화
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 정책: 인증된 사용자는 모든 데이터 읽기 가능
CREATE POLICY "Enable read access for authenticated users" ON shipments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON container_details
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON warehouse_inventory
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON financial_transactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON shipment_tracking_log
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON documents
    FOR SELECT TO authenticated USING (true);

-- 정책: 인증된 사용자는 모든 데이터 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON shipments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON container_details
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON warehouse_inventory
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON financial_transactions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON shipment_tracking_log
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON documents
    FOR INSERT TO authenticated WITH CHECK (true);

-- 정책: 인증된 사용자는 모든 데이터 수정 가능
CREATE POLICY "Enable update for authenticated users" ON shipments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON container_details
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON warehouse_inventory
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON financial_transactions
    FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- VIEWS (자주 사용하는 조회 쿼리)
-- ============================================================

-- 1. 전체 선적 현황 뷰
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
    w.total_inventory as warehouse_total,
    CASE 
        WHEN s.ata IS NOT NULL THEN 'Arrived'
        WHEN s.atd IS NOT NULL THEN 'In Transit'
        WHEN s.etd IS NOT NULL THEN 'Scheduled'
        ELSE 'Pending'
    END as transit_status
FROM shipments s
LEFT JOIN container_details c ON s.id = c.shipment_id
LEFT JOIN warehouse_inventory w ON s.id = w.shipment_id;

-- 2. 창고별 재고 현황 뷰
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
    w.total_inventory,
    s.delivery_date
FROM warehouse_inventory w
JOIN shipments s ON w.shipment_id = s.id
WHERE w.total_inventory > 0;

-- 3. 재무 요약 뷰
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

-- ============================================================
-- SAMPLE DATA INSERT (테스트용)
-- ============================================================

-- 스키마 검증용 샘플 데이터는 별도 파일로 제공
-- INSERT 스크립트는 실제 데이터 마이그레이션 시 작성

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- 1. 선적 상태 통계
CREATE OR REPLACE FUNCTION get_shipment_statistics()
RETURNS TABLE (
    total_shipments BIGINT,
    pending_shipments BIGINT,
    in_transit_shipments BIGINT,
    arrived_shipments BIGINT,
    delivered_shipments BIGINT,
    total_containers BIGINT,
    total_weight_kg NUMERIC,
    total_cbm NUMERIC,
    total_invoice_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_shipments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_shipments,
        COUNT(*) FILTER (WHERE atd IS NOT NULL AND ata IS NULL) as in_transit_shipments,
        COUNT(*) FILTER (WHERE ata IS NOT NULL AND delivery_date IS NULL) as arrived_shipments,
        COUNT(*) FILTER (WHERE delivery_date IS NOT NULL) as delivered_shipments,
        SUM(c.total_containers) as total_containers,
        SUM(s.gross_weight_kg) as total_weight_kg,
        SUM(s.cbm) as total_cbm,
        SUM(s.invoice_value) as total_invoice_value
    FROM shipments s
    LEFT JOIN container_details c ON s.id = c.shipment_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 지연 선적 조회
CREATE OR REPLACE FUNCTION get_delayed_shipments(days_threshold INTEGER DEFAULT 7)
RETURNS TABLE (
    sct_ship_no VARCHAR,
    vessel_name VARCHAR,
    eta DATE,
    days_delayed INTEGER,
    current_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.sct_ship_no,
        s.vessel_name,
        s.eta,
        (CURRENT_DATE - s.eta)::INTEGER as days_delayed,
        s.status
    FROM shipments s
    WHERE s.eta IS NOT NULL 
      AND s.ata IS NULL 
      AND CURRENT_DATE > s.eta + days_threshold;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS (테이블 및 컬럼 설명)
-- ============================================================

COMMENT ON TABLE shipments IS 'HVDC 프로젝트 선적 마스터 테이블';
COMMENT ON TABLE container_details IS '선적별 컨테이너 타입 및 수량 상세';
COMMENT ON TABLE warehouse_inventory IS '창고별 재고 현황';
COMMENT ON TABLE financial_transactions IS '선적 관련 재무 트랜잭션';
COMMENT ON TABLE shipment_tracking_log IS '선적 추적 이력 로그';
COMMENT ON TABLE documents IS '선적 관련 문서 관리';

-- ============================================================
-- END OF SCHEMA
-- ============================================================