-- ============================================================
-- HVDC + Logistics 통합 스키마 v2 (Unified)
-- Supabase SSOT 기준
-- 작성일: 2026-01-23
-- 참조: [AGENTS.md](../../../../AGENTS.md), [SSOT.md](../../hvdc-logistics-ssot/references/SSOT.md)
-- ============================================================

-- Extensions 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색 최적화

-- ============================================================
-- 1. LOGISTICS: Locations (물류 위치)
-- ============================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    type TEXT, -- 'port', 'warehouse', 'site', etc.
    address TEXT,
    country TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. LOGISTICS: Location Statuses (위치별 실시간 상태)
-- ============================================================
CREATE TABLE location_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'ok', 'warning', 'critical'
    pressure DOUBLE PRECISION, -- t/m² (≤4.0 constraint)
    occupancy_rate NUMERIC(5,2), -- 0-100%
    capacity INTEGER,
    current_load INTEGER,
    metadata JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_pressure CHECK (pressure IS NULL OR pressure <= 4.0),
    CONSTRAINT valid_occupancy CHECK (occupancy_rate IS NULL OR (occupancy_rate >= 0 AND occupancy_rate <= 100))
);

-- ============================================================
-- 3. LOGISTICS: Events (물류 이벤트 로그)
-- ============================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    shipment_id UUID, -- Optional reference to shipments
    event_type TEXT NOT NULL, -- 'arrival', 'departure', 'status_change', etc.
    description TEXT,
    metadata JSONB,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. HVDC: Shipments (선적 마스터) - 기존 스키마 통합
-- ============================================================
CREATE TABLE shipments (
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
    current_location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- 통합: locations 참조
    
    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
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
-- 5. HVDC: Warehouse Inventory (창고 재고)
-- ============================================================
CREATE TABLE warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- Project Tracking Dates (Site Arrival Dates)
    project_shu2 DATE,
    project_mir3 DATE,
    project_das4 DATE,
    project_agi5 DATE,
    
    -- DSV Warehouse Dates
    dsv_indoor DATE,
    dsv_outdoor DATE,
    dsv_mzd DATE,
    
    -- JDN Warehouse Dates
    jdn_mzd DATE,
    jdn_waterfront DATE,
    
    -- Other Storage Dates
    mosb DATE,
    aaa_storage DATE,
    zener_wh DATE,
    hauler_dg_storage DATE,
    vijay_tanks DATE,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. HVDC: Container Details (컨테이너 상세)
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
    
    -- 총 컨테이너 수 (computed)
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
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. HVDC: Financial Transactions (재무 트랜잭션)
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
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100)
);

-- ============================================================
-- 8. HVDC: Shipment Tracking Log (선적 추적 로그)
-- ============================================================
CREATE TABLE shipment_tracking_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL, -- departure, arrival, customs, warehouse_in, delivery
    event_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(200),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- 통합: locations 참조
    
    status_before VARCHAR(50),
    status_after VARCHAR(50),
    
    description TEXT,
    created_by VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. HVDC: Worklist (워크리스트)
-- ============================================================
CREATE TABLE hvdc_worklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'red', 'amber', 'green', 'zero'
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    gate_status TEXT, -- 'RED', 'AMBER', 'GREEN', 'ZERO'
    
    eta TIMESTAMPTZ,
    due_date DATE,
    
    assigned_to VARCHAR(100),
    created_by VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. HVDC: KPIs (KPI 메트릭)
-- ============================================================
CREATE TABLE hvdc_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    category TEXT, -- 'dri', 'wsi', 'overdue', 'recoverable', etc.
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- ============================================================
-- 11. SYSTEM: Logs (시스템 로그)
-- ============================================================
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL, -- 'info', 'warning', 'error'
    message TEXT NOT NULL,
    metadata JSONB,
    source TEXT, -- 'pipeline', 'audit', 'api', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (성능 최적화)
-- ============================================================

-- Locations 인덱스
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_coords ON locations(lat, lng);

-- Location Statuses 인덱스
CREATE INDEX idx_location_statuses_location_id ON location_statuses(location_id);
CREATE INDEX idx_location_statuses_status ON location_statuses(status);
CREATE INDEX idx_location_statuses_updated_at ON location_statuses(updated_at);

-- Events 인덱스
CREATE INDEX idx_events_location_id ON events(location_id);
CREATE INDEX idx_events_shipment_id ON events(shipment_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_ts ON events(ts);

-- Shipments 인덱스 (기존 유지)
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
CREATE INDEX idx_shipments_current_location_id ON shipments(current_location_id);

-- 텍스트 검색 인덱스 (GIN)
CREATE INDEX idx_shipments_main_desc_gin ON shipments USING gin(main_description gin_trgm_ops);
CREATE INDEX idx_shipments_vendor_gin ON shipments USING gin(vendor gin_trgm_ops);

-- Warehouse 인덱스
CREATE INDEX idx_warehouse_shipment_id ON warehouse_inventory(shipment_id);
CREATE INDEX idx_warehouse_shu2 ON warehouse_inventory(project_shu2);
CREATE INDEX idx_warehouse_mir3 ON warehouse_inventory(project_mir3);
CREATE INDEX idx_warehouse_das4 ON warehouse_inventory(project_das4);
CREATE INDEX idx_warehouse_agi5 ON warehouse_inventory(project_agi5);

-- Worklist 인덱스
CREATE INDEX idx_worklist_shipment_id ON hvdc_worklist(shipment_id);
CREATE INDEX idx_worklist_status ON hvdc_worklist(status);
CREATE INDEX idx_worklist_gate_status ON hvdc_worklist(gate_status);
CREATE INDEX idx_worklist_priority ON hvdc_worklist(priority);

-- KPIs 인덱스
CREATE INDEX idx_kpis_metric_name ON hvdc_kpis(metric_name);
CREATE INDEX idx_kpis_timestamp ON hvdc_kpis(timestamp);
CREATE INDEX idx_kpis_category ON hvdc_kpis(category);

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
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_statuses_updated_at BEFORE UPDATE ON location_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON container_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_updated_at BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worklist_updated_at BEFORE UPDATE ON hvdc_worklist
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

-- RLS 활성화 (모든 테이블)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvdc_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvdc_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 정책: 인증된 사용자는 모든 데이터 읽기 가능 (예시 - 실제 권한은 프로젝트 요구사항에 맞게 조정)
CREATE POLICY "Enable read access for authenticated users" ON locations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON location_statuses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON events
    FOR SELECT TO authenticated USING (true);

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

CREATE POLICY "Enable read access for authenticated users" ON hvdc_worklist
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON hvdc_kpis
    FOR SELECT TO authenticated USING (true);

-- ============================================================
-- REALTIME SUBSCRIPTIONS (필요시 활성화)
-- ============================================================
-- Realtime 구독은 필요한 테이블만 활성화
-- 예시:
-- ALTER PUBLICATION supabase_realtime ADD TABLE location_statuses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE events;
-- ALTER PUBLICATION supabase_realtime ADD TABLE hvdc_worklist;
-- ALTER PUBLICATION supabase_realtime ADD TABLE hvdc_kpis;

-- ============================================================
-- NOTES
-- ============================================================
-- 1. 이 스키마는 HVDC와 Logistics 데이터를 통합합니다.
-- 2. shipments.current_location_id는 locations 테이블을 참조합니다.
-- 3. events.shipment_id는 shipments 테이블을 선택적으로 참조합니다.
-- 4. 모든 테이블에 RLS가 활성화되어 있습니다.
-- 5. pressure ≤ 4.0 t/m² 제약조건이 location_statuses에 적용됩니다.
-- 6. 마이그레이션 전 반드시 검토 및 승인이 필요합니다.
