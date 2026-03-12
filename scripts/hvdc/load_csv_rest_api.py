#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Load CSV files into Supabase using REST API (HTTP 방식, psql 불필요)

Requirements:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - supabase-py 패키지: pip install supabase

이 방법은:
- 네트워크 연결 문제 없음 (HTTP REST API 사용)
- psql 불필요
- Python만 있으면 실행 가능
"""

import csv
import os
import sys
from pathlib import Path
from typing import Optional

try:
    from supabase import create_client, Client
except ImportError:
    print("[load_csv_rest_api] ERROR: supabase-py is required. Install with: pip install supabase", file=sys.stderr)
    sys.exit(1)

DEFAULT_BATCH_SIZE = 100  # 한 번에 업로드할 행 수


def redact_url(url: str) -> str:
    """URL에서 민감한 정보 마스킹"""
    try:
        if "@" in url:
            parts = url.split("@")
            if len(parts) == 2:
                return f"***@{parts[1]}"
        return "***"
    except Exception:
        return "***"


def parse_args() -> tuple[bool, bool]:
    """명령줄 인자 파싱"""
    do_truncate = "--truncate" in sys.argv or "-t" in sys.argv
    status_only = "--status-only" in sys.argv or "-s" in sys.argv
    return do_truncate, status_only


def create_supabase_client() -> Optional[Client]:
    """Supabase 클라이언트 생성"""
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("[load_csv_rest_api] ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) required", file=sys.stderr)
        print("[load_csv_rest_api] Usage: python scripts/hvdc/load_csv_rest_api.py [--truncate] [--status-only]", file=sys.stderr)
        sys.exit(1)
    
    print(f"[load_csv_rest_api] Connecting to Supabase: {redact_url(supabase_url)}")
    return create_client(supabase_url, supabase_key)


def load_csv_via_rest_api(
    client: Client,
    schema: str,
    table: str,
    csv_path: Path,
    columns: list[str],
    do_truncate: bool = False,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> int:
    """CSV 파일을 읽어서 Supabase REST API로 업로드"""
    if not csv_path.exists():
        print(f"[load_csv_rest_api] WARNING: CSV file not found: {csv_path}, skipping...", file=sys.stderr)
        return 0
    
    print(f"[load_csv_rest_api] Loading {schema}.{table} from {csv_path.name}...")
    
    # Truncate는 SQL 직접 실행이 필요하므로 REST API로는 불가능
    # 대신 기존 데이터를 삭제하려면 Dashboard에서 수동으로 하거나
    # SQL Editor에서 TRUNCATE 실행 필요
    if do_truncate:
        print(f"[load_csv_rest_api] WARNING: --truncate is not supported via REST API. Please truncate manually in Dashboard SQL Editor.", file=sys.stderr)
        print(f"[load_csv_rest_api] SQL: TRUNCATE TABLE \"{schema}\".\"{table}\" RESTART IDENTITY CASCADE;", file=sys.stderr)
    
    # CSV 읽기
    rows_to_insert = []
    with csv_path.open('r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 컬럼 순서대로 값 추출
            values = {col: row.get(col, None) for col in columns}
            # None 값은 제거 (Supabase가 자동으로 NULL 처리)
            values = {k: v if v != '' else None for k, v in values.items()}
            rows_to_insert.append(values)
    
    total_rows = len(rows_to_insert)
    print(f"[load_csv_rest_api] Read {total_rows} rows from CSV")
    
    # 배치로 업로드
    total_loaded = 0
    errors = []
    
    for i in range(0, total_rows, batch_size):
        batch = rows_to_insert[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_rows + batch_size - 1) // batch_size
        
        print(f"[load_csv_rest_api] Uploading batch {batch_num}/{total_batches} ({len(batch)} rows)...")
        
        try:
            # Supabase REST API로 업로드 (UPSERT 모드)
            # 스키마가 public이 아니면 테이블명에 스키마 포함 불가능하므로
            # RPC 함수를 사용하거나 public 스키마만 지원
            if schema == "public":
                response = client.table(table).upsert(batch, on_conflict="hvdc_code" if "hvdc_code" in columns else None).execute()
            else:
                # status, case 스키마는 REST API로 직접 접근 불가능할 수 있음
                # 이 경우 SQL 함수를 통해 접근하거나 Dashboard Import 사용 권장
                print(f"[load_csv_rest_api] ERROR: Schema '{schema}' is not exposed via REST API. Use Dashboard Import or psql method.", file=sys.stderr)
                print(f"[load_csv_rest_api] For {schema}.{table}, please use Dashboard Table Editor Import instead.", file=sys.stderr)
                return 0
            
            if hasattr(response, 'data') and response.data:
                total_loaded += len(response.data)
            else:
                total_loaded += len(batch)  # 성공으로 간주
            
        except Exception as e:
            error_msg = f"Batch {batch_num}: {str(e)}"
            errors.append(error_msg)
            print(f"[load_csv_rest_api] ERROR: {error_msg}", file=sys.stderr)
    
    if errors:
        print(f"[load_csv_rest_api] WARNING: {len(errors)} batches failed. Total loaded: {total_loaded}/{total_rows}")
    else:
        print(f"[load_csv_rest_api] Successfully loaded {total_loaded} rows into {schema}.{table}")
    
    return total_loaded


def main():
    do_truncate, status_only = parse_args()
    
    repo_root = Path.cwd()
    
    # Supabase 클라이언트 생성
    client = create_supabase_client()
    if not client:
        sys.exit(1)
    
    print(f"[load_csv_rest_api] do_truncate = {do_truncate}")
    print(f"[load_csv_rest_api] status_only = {status_only}")
    
    total_rows = 0
    
    # Status 레이어 적재
    print("\n=== Loading Status Layer ===")
    
    status_shipments_csv = repo_root / "hvdc_output" / "supabase" / "shipments_status.csv"
    if status_shipments_csv.exists():
        rows = load_csv_via_rest_api(
            client, "status", "shipments_status", status_shipments_csv,
            columns=[
                "hvdc_code", "status_no", "vendor", "band", "incoterms", "currency",
                "pol", "pod", "bl_awb", "vessel", "ship_mode", "pkg", "qty_cntr",
                "cbm", "gwt_kg", "etd", "eta", "ata",
                "warehouse_flag", "warehouse_last_location", "warehouse_last_date", "raw"
            ],
            do_truncate=do_truncate,
        )
        total_rows += rows
    else:
        print(f"[load_csv_rest_api] ERROR: Required file not found: {status_shipments_csv}", file=sys.stderr)
        sys.exit(1)
    
    status_events_csv = repo_root / "hvdc_output" / "supabase" / "events_status.csv"
    if status_events_csv.exists():
        rows = load_csv_via_rest_api(
            client, "status", "events_status", status_events_csv,
            columns=[
                "event_id", "hvdc_code", "event_type", "location", "event_date", "source", "raw"
            ],
            do_truncate=False,
        )
        total_rows += rows
    else:
        print(f"[load_csv_rest_api] ERROR: Required file not found: {status_events_csv}", file=sys.stderr)
        sys.exit(1)
    
    # Case 레이어는 status_only가 아니면 적재 (하지만 REST API 제한으로 Dashboard Import 권장)
    if not status_only:
        print("\n=== Case Layer ===")
        print("[load_csv_rest_api] WARNING: Case layer (status/case schemas) may not be exposed via REST API.")
        print("[load_csv_rest_api] Please use Dashboard Table Editor Import for case layer tables.", file=sys.stderr)
    
    print(f"\n[load_csv_rest_api] Done. Total rows loaded: {total_rows}")
    print("\n[load_csv_rest_api] NOTE: If status/case schema tables failed, use Dashboard Table Editor Import instead.")


if __name__ == "__main__":
    main()
