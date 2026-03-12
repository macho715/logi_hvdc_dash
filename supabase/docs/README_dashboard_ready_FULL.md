# Dashboard-Ready FULL 스크립트 (복사/붙여넣기용)

> **최종 업데이트**: 2026-02-07  
> **상태**: Phase 2~6 완료 (DDL 적용, CSV 적재 871+928, Gate 1 QA, Realtime 활성화)

## 1) Untitled-4_dashboard_ready_FULL.py (Status SSOT)
### 목표
- Status(SSOT) 전량(=HVDC S No 1~830xx) 기준으로 `status.shipments_status` 를 갱신
- Warehouse JSON(케이스 단위)은 hvdc_code 기준으로 **가볍게 집계**하여 `status.events_status`에 적재
- (옵션) Option-C `locations.csv`가 있으면 `events_status.location_code`를 채우고 TTL에 `hvdc:atLocation` 링크 생성

### 생성 파일(out/)
- supabase/schema.sql
- supabase/shipments_status.csv
- supabase/events_status.csv
- supabase/shipments.csv / supabase/logistics_events.csv (호환)
- ontology/hvdc_ops_status.ttl (기본 ON)
- ontology/hvdc.ttl (기본 ON)
- report/qa_report.md, report/orphan_wh.json
- (옵션) report/location_match_report.md 등

### 실행 예시
```bash
python Untitled-4_dashboard_ready_FULL.py \
  --status HVDC_all_status.json \
  --warehouse hvdc_warehouse_status.json \
  --outdir out \
  --base-iri https://example.com/hvdc \
  --case-locations supabase_csv_optionC_v3/locations.csv
```

## 2) Untitled-3_dashboard_ready_FULL.py (Option-C Case)
### 목표
- 케이스 단위 `(hvdc_code, case_no)` 정밀 흐름(Flow/WH IN-OUT/SITE ARRIVAL/Customs)을 `case.*` 적재용 CSV로 생성
- (옵션) `--export-ttl` 시 동일 규칙으로 `hvdc_ops_data.ttl` 생성
- (추가) 대시보드 alias 파일명도 함께 생성:
  - shipments_case.csv / events_case.csv / events_case_debug.csv

### 실행 예시
```bash
python Untitled-3_dashboard_ready_FULL.py \
  --all hvdc_allshpt_status.json \
  --wh hvdc_warehouse_status.json \
  --customs HVDC_STATUS.json \
  --output-dir supabase_csv_optionC_v3 \
  --export-ttl \
  --base-iri https://example.com/hvdc
```

## 3) Supabase 적재 순서(권장)
1) Status: shipments_status → events_status
2) Case: locations → shipments_case → cases → flows → events_case

## 4) 대시보드 JOIN 핵심
- StatusEvent.location_code ↔ case.locations.location_code
- Shipment(hvdc_code) ↔ Case(hvdc_code) (필요 시 뷰에서 JOIN)
