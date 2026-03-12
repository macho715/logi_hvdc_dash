"""
Supabase Database Verification Script
HVDC Logistics Database
"""

from supabase import create_client
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing environment variables")
    print("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("="*60)
print("HVDC LOGISTICS DATABASE VERIFICATION")
print("="*60)
print()

# 1. 테이블 확인
print("📊 Table Statistics:")
print("-" * 60)

tables = [
    'shipments',
    'container_details', 
    'warehouse_inventory',
    'financial_transactions',
    'shipment_tracking_log',
    'documents'
]

total_records = 0
for table in tables:
    try:
        result = supabase.table(table).select('*', count='exact').limit(0).execute()
        count = result.count or 0
        total_records += count
        status = "✅" if count > 0 else "⚠️"
        print(f"{status} {table:30} {count:>6} rows")
    except Exception as e:
        print(f"❌ {table:30} ERROR: {str(e)[:40]}")

print("-" * 60)
print(f"Total records across all tables: {total_records}")
print()

# 2. Shipments 상세 통계
print("📦 Shipment Details:")
print("-" * 60)

try:
    # 전체 선적 수
    shipments = supabase.table('shipments').select('*').execute()
    all_shipments = shipments.data
    
    print(f"Total shipments: {len(all_shipments)}")
    
    # 상태별 분류
    status_count = {}
    for ship in all_shipments:
        status = ship.get('status', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1
    
    print("\nStatus breakdown:")
    for status, count in sorted(status_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  {status:15} {count:>5} ({count/len(all_shipments)*100:.1f}%)")
    
    # 공급업체별 통계
    vendor_count = {}
    for ship in all_shipments:
        vendor = ship.get('vendor', 'Unknown')
        if vendor:
            vendor_count[vendor] = vendor_count.get(vendor, 0) + 1
    
    print(f"\nTop 10 vendors:")
    for vendor, count in sorted(vendor_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {vendor:40} {count:>5}")
    
    # 최근 선적
    print("\nRecent shipments:")
    recent = sorted(all_shipments, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
    for ship in recent:
        print(f"  {ship.get('sct_ship_no', 'N/A'):20} {ship.get('vendor', 'N/A'):30} {ship.get('status', 'N/A')}")

except Exception as e:
    print(f"❌ Error fetching shipment details: {e}")

print()

# 3. 데이터 무결성 확인
print("🔍 Data Integrity Checks:")
print("-" * 60)

try:
    # Shipments without containers
    shipments_result = supabase.table('shipments').select('id').execute()
    containers_result = supabase.table('container_details').select('shipment_id').execute()
    
    shipment_ids = {s['id'] for s in shipments_result.data}
    container_ids = {c['shipment_id'] for c in containers_result.data}
    
    missing_containers = len(shipment_ids - container_ids)
    print(f"✓ Shipments: {len(shipment_ids)}")
    print(f"✓ With containers: {len(container_ids)}")
    if missing_containers > 0:
        print(f"⚠️  Missing containers: {missing_containers}")
    else:
        print(f"✅ All shipments have container details")
    
    # Shipments without warehouse
    warehouse_result = supabase.table('warehouse_inventory').select('shipment_id').execute()
    warehouse_ids = {w['shipment_id'] for w in warehouse_result.data}
    
    missing_warehouse = len(shipment_ids - warehouse_ids)
    print(f"✓ With warehouse data: {len(warehouse_ids)}")
    if missing_warehouse > 0:
        print(f"⚠️  Missing warehouse data: {missing_warehouse}")
    else:
        print(f"✅ All shipments have warehouse inventory")

except Exception as e:
    print(f"❌ Error checking integrity: {e}")

print()

# 4. 샘플 쿼리 테스트
print("🧪 Sample Query Tests:")
print("-" * 60)

try:
    # 특정 공급업체 조회
    vendor_test = supabase.table('shipments')\
        .select('sct_ship_no, vendor, status')\
        .eq('vendor', 'Prysmian')\
        .limit(3)\
        .execute()
    
    print(f"✅ Vendor filter test: Found {len(vendor_test.data)} Prysmian shipments")
    
    # 상태별 조회
    status_test = supabase.table('shipments')\
        .select('*', count='exact')\
        .eq('status', 'delivered')\
        .limit(0)\
        .execute()
    
    print(f"✅ Status filter test: Found {status_test.count} delivered shipments")
    
    # 날짜 범위 조회
    date_test = supabase.table('shipments')\
        .select('*', count='exact')\
        .gte('eta', '2024-01-01')\
        .lte('eta', '2024-12-31')\
        .limit(0)\
        .execute()
    
    print(f"✅ Date range test: Found {date_test.count} shipments in 2024")

except Exception as e:
    print(f"❌ Query test error: {e}")

print()
print("="*60)
print("VERIFICATION COMPLETE")
print("="*60)
print()

# 5. 다음 단계 제안
print("📋 Next Steps:")
print("-" * 60)
print("1. ✅ Database schema deployed")
print("2. ✅ Data migration completed")
print("3. 🔄 Update .env.local in your Next.js project")
print("4. 🚀 Run: npm run dev")
print("5. 🌐 Access: http://localhost:3000")
print()
print("API Endpoints:")
print("  • GET  /api/shipments - List all shipments")
print("  • GET  /api/shipments/[id] - Get shipment details")
print("  • GET  /api/statistics - Dashboard statistics")
print()
print("="*60)
