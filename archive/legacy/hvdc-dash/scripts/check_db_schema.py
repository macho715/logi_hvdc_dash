
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

print("Checking 'shipments' table columns:")
try:
    # We can't query information_schema directly easily via supabase-js/py unless we use rpc or just try to select
    # But we can try to select one row and see keys?
    # Or use the `rpc` if we had one.
    # Actually, we can assume if I select * limit 1, I get keys.
    
    res = supabase.table('shipments').select('*').limit(1).execute()
    if res.data:
        print("Columns found in data:", res.data[0].keys())
        if 'actual_weight_kg' in res.data[0]:
             print("✅ 'actual_weight_kg' exists in returned data.")
        else:
             print("❌ 'actual_weight_kg' NOT found in returned data.")
    else:
        # Table might be empty, try inserting a dummy to see if it accepts the column?
        # Or just trust the error message from before.
        print("Table is empty, cannot verify columns via SELECT *.")

    print("\nChecking 'warehouse_inventory' table columns via attempted insert (checking for schema mismatch):")
    # We want to check if date columns accept dates.
    # We won't insert, just relying on the previous check.
    
    # Let's try to reload schema cache via SQL if possible? 
    # We can't run raw SQL from here without a function.
    pass

except Exception as e:
    print(f"Error: {e}")
