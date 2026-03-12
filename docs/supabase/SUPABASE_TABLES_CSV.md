


분석에 따라 구현 파일 작성 중입니다.

1. `raw_ingest` 테이블 마이그레이션
2. CSV + JSONB Hybrid 전략 문서

작성 중:


[1 tool called]


분석에 따라 다음 파일을 작성합니다:

1. `raw_ingest` 테이블 마이그레이션
2. CSV + JSONB Hybrid 전략 문서

## 1. Migration: `supabase/migrations/20260127_raw_ingest_table.sql`

```sql
-- ============================================================
-- raw_ingest: JSONB payload storage for audit/reprocessing
-- CSV + JSONB Hybrid Strategy (Option B)
-- 작성일: 2026-01-27
-- 참조: 사용자 분석 - CSV는 정규화 테이블, JSONB는 원문 보관용
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_jsonschema"; -- JSON Schema validation

-- ============================================================
-- raw_ingest: 원문 JSON payload 보관 (감사/재처리용)
-- ============================================================
CREATE TABLE IF NOT EXISTS ops.raw_ingest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 소스 식별
    source TEXT NOT NULL, -- 'HVDC_all_status.json', 'hvdc_warehouse_status.csv', etc.
    source_file_hash TEXT, -- 파일 해시 (SHA256) - 중복/버전 관리
    source_timestamp TIMESTAMPTZ, -- 원본 파일 수신/처리 시각

    -- Payload (JSONB)
    payload JSONB NOT NULL, -- 원문 JSON payload

    -- 파싱 상태
    parse_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'partial'
    parse_error TEXT, -- 파싱 오류 메시지 (parse_status='failed'일 때)
    parsed_at TIMESTAMPTZ, -- 파싱 완료 시각

    -- 정규화 테이블 매핑 (raw↔parsed 동기화)
    normalized_table_name TEXT, -- 'shipments', 'cases', 'events', etc.
    normalized_record_id UUID, -- 정규화 테이블의 레코드 ID (FK 참조)
    normalized_record_key TEXT, -- 비즈니스 키 (예: hvdc_code, case_no) - 조회용

    -- 메타데이터
    metadata JSONB, -- 추가 메타데이터 (버전, 스키마 버전 등)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_parse_status CHECK (parse_status IN ('pending', 'success', 'failed', 'partial'))
);

-- ============================================================
-- INDEXES (성능 최적화)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_raw_ingest_source ON ops.raw_ingest(source);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_source_hash ON ops.raw_ingest(source_file_hash);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_parse_status ON ops.raw_ingest(parse_status);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_normalized_table ON ops.raw_ingest(normalized_table_name);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_normalized_key ON ops.raw_ingest(normalized_record_key);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_created_at ON ops.raw_ingest(created_at);

-- GIN 인덱스 (JSONB 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_raw_ingest_payload_gin ON ops.raw_ingest USING gin(payload jsonb_path_ops);

-- ============================================================
-- JSON Schema Validation (pg_jsonschema)
-- ============================================================
-- HVDC_all_status.json 스키마 예시 (실제 스키마는 데이터 구조에 맞게 조정)
ALTER TABLE ops.raw_ingest ADD CONSTRAINT validate_hvdc_status_payload
    CHECK (
        CASE
            WHEN source LIKE '%HVDC_all_status.json%' THEN
                jsonb_matches_schema(
                    '{
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["SCT SHIP NO."],
                            "properties": {
                                "SCT SHIP NO.": {"type": "string"},
                                "VENDOR": {"type": "string"},
                                "INVOICE VALUE(A)": {"type": "string"}
                            }
                        }
                    }'::jsonb,
                    payload
                )
            ELSE true
        END
    );

-- ============================================================
-- FUNCTIONS
-- ============================================================
-- Updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_raw_ingest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_raw_ingest_updated_at
    BEFORE UPDATE ON ops.raw_ingest
    FOR EACH ROW
    EXECUTE FUNCTION update_raw_ingest_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE ops.raw_ingest ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 읽기 가능 (감사/재처리 목적)
CREATE POLICY "Allow read raw_ingest for authenticated users"
    ON ops.raw_ingest FOR SELECT
    TO authenticated
    USING (true);

-- 서비스 역할만 쓰기 가능 (ETL 파이프라인)
CREATE POLICY "Allow insert raw_ingest for service role"
    ON ops.raw_ingest FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================================
-- NOTES
-- ============================================================
-- 1. payload는 원문 JSONB로 보관 (변경 불가)
-- 2. source_file_hash로 중복 방지 (동일 파일 재처리 방지)
-- 3. normalized_record_key로 정규화 테이블과 조인 가능
-- 4. pg_jsonschema로 payload 검증 (스키마 변경 시 제약조건 업데이트 필요)
```

## 2. 문서: `docs/SUPABASE_CSV_JSONB_HYBRID_STRATEGY.md`

```markdown
# CSV + JSONB Hybrid Strategy (Option B)

> **권장 전략**: CSV는 정규화 테이블 적재용(운영/분석), JSONB는 원문 보관용(감사/재처리)
> Last updated: 2026-01-27
> Related: [SUPABASE_LOADING_HYBRID_STRATEGY.md](../supabase/SUPABASE_LOADING_HYBRID_STRATEGY.md)

---

## Executive Summary

**결론**: Supabase(Postgres)에서는 **"운영/분석용 정규화 테이블은 CSV가 가장 효율적"**이고, **"원문 보존/유연 스키마용은 JSONB"**가 적합합니다.

HVDC처럼 `TransportEvent / StockSnapshot / InvoiceLine` 중심의 **행(row) 단위 이벤트 데이터**는 Supabase 테이블에 바로 적재되므로 **CSV → COPY/대시보드 Import**가 비용·속도·검증(제약/RLS) 측면에서 유리합니다.

JSONB는 테이블에 넣기 위한 기본 포맷이라기보다, **(1) 스키마가 자주 바뀌는 속성**을 담는 보조 채널로 쓰는 게 정석입니다 (과용 금지).

---

## Visual: CSV vs JSONB (Supabase 적재 관점)

| 포맷 | 가장 적합한 용도 | 장점 | 단점/리스크 |
|------|----------------|------|------------|
| **CSV** | 정규화 테이블 적재<br>(Shipments/Events/Cases/Locations/InvoiceLines) | `COPY` 기반 대량 적재 용이<br>스키마/타입 고정 → 대시보드·조인·RLS·검증에 강함 | NULL/빈값 구분 애매(CSV 특성) → **NULL 정책** 사전 고정 필요 |
| **JSON (API payload)** | 실시간/증분 Upsert(소량), 외부 시스템에서 JSON으로 들어올 때 | 앱/ETL에서 다루기 편함 | "테이블 import" 관점에서는 **JSON→컬럼 매핑**이 추가 작업 |
| **JSONB(테이블 컬럼)** | raw 보관, 가변 속성, 증빙 payload | Supabase가 **jsonb 권장**, 조회·인덱싱 유리 | 입력 시 파싱/변환 오버헤드 존재<br>(대량 적재는 CSV보다 불리해질 수 있음) |

---

## Schema 구조 (HVDC 운영 데이터 기준)

### 정규화 테이블 (권장: CSV 적재)

- `status.shipments_status` / `status.events_status`
- `case.cases` / `case.flows` / `case.events_case`
- `public.locations` / `public.shipments`
- `warehouse_inventory` / `container_details`

### Raw 보관 테이블 (권장: JSONB)

- `ops.raw_ingest` (source, file_hash, received_at, **payload jsonb**, parse_status…)

### 검증/거버넌스

- jsonb payload는 **pg_jsonschema**로 스키마 검증 가능 ("가변이지만 규칙은 강제"가 가능)

---

## Implementation Roadmap

### Prepare (1.00주)

- [ ] 테이블 스키마 고정(키/타입/NULL 규칙), CSV 헤더 표준화
- [ ] `ops.raw_ingest` 테이블 생성 (마이그레이션 적용)
- [ ] KPI: 적재 실패율 ≤ **1.00%**, 타입 캐스팅 오류 0건

### Pilot (1.00–2.00주)

- [ ] Supabase에 **CSV Import(소량)**로 빠르게 검증
- [ ] 대량은 **COPY/pgloader**로 전환 (대시보드 CSV는 100MB 제한 참고)
- [ ] KPI: 핵심 테이블(Shipments/Events) 조인 성공률 ≥ **99.00%**

### Build (2.00–4.00주)

- [ ] Hybrid(B) 적용: `ops.raw_ingest(payload jsonb)` + 정규화 테이블 upsert 파이프라인
- [ ] JSON → raw_ingest + 정규화 테이블 upsert 스크립트 작성
- [ ] KPI: 감사 재현성(원문→재처리) **100.00%**, KPI 질의 p95 < **5.00s**

### Operate (지속)

- [ ] 데이터 품질 게이트(FlowCode 범위, 합계 검증 등) 자동 리포트
- [ ] raw↔parsed 동기화 규칙(해시/버전) 모니터링

---

## Data Pipeline

### CSV → 정규화 테이블 (기존 파이프라인 활용)

```bash
# 1. ETL: JSON → CSV 변환
python supabase/data/raw/scripts/etl/status_etl.py \
  --status supabase/data/raw/HVDC_all_status.json \
  --warehouse supabase/data/raw/hvdc_warehouse_status.json \
  --outdir hvdc_output

# 2. CSV 적재 (COPY 방식)
psql $SUPABASE_DB_URL -f scripts/hvdc/load_csv.psql
```

### JSON → raw_ingest + 정규화 테이블 (신규 파이프라인)

```python
# scripts/hvdc/load_jsonb_raw_ingest.py
# 1. JSON 파일 읽기
# 2. 파일 해시 계산 (SHA256)
# 3. raw_ingest에 payload 저장 (중복 체크)
# 4. 정규화 테이블 upsert (기존 ETL 파이프라인 활용)
# 5. raw_ingest.normalized_record_key 업데이트
```

---

## QA Checklist

- [ ] CSV NULL/빈값 규칙 고정 (예: 빈값=NULL, `"0"`는 숫자 0)
- [ ] 날짜: ISO(YYYY-MM-DD 또는 ISO 8601), 숫자 2자리(금액/요율)
- [ ] PK/FK: `shipment_id / case_id / event_id` 등 **안정 키** 고정
- [ ] pg_jsonschema 제약조건 업데이트 (스키마 변경 시)
- [ ] raw↔parsed 동기화 검증 (해시/버전 일치 확인)

---

## 가정 (Assumptions)

- Supabase를 **운영 SSOT(Postgres)**로 두고, 온톨로지(RDF/TTL)는 별도 계층에서 병행 운용
- JSONB payload는 **과용 금지** (정규화 테이블 우선, 필요 최소로만 사용)
- raw_ingest는 **감사/재처리 목적**으로만 사용 (대시보드 조회는 정규화 테이블 사용)

---

## References

- [Supabase: Import data](https://supabase.com/docs/guides/database/import-data)
- [Supabase: Managing JSON and unstructured data](https://supabase.com/docs/guides/database/json)
- [Supabase: pg_jsonschema](https://supabase.com/docs/guides/database/extensions/pg_jsonschema)
- [PostgreSQL COPY](https://postgrespro.com/docs/postgresql/current/sql-copy)

---
