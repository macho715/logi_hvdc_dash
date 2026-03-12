from supabase import create_client
import sys

url = "https://vnoypalmmyiigxntfdxx.supabase.co"
key = "sb_publishable_0gB88eu7ieGHwVcx3gvrwg_bfaq4rUo"

print(f"Testing connection to {url} with key {key[:10]}...")

try:
    supabase = create_client(url, key)
    # Use table() instead of from() because from is a reserved keyword in Python
    response = supabase.table("shipments").select("*").limit(1).execute()
    print("Connection successful!")
    print(response)
except Exception as e:
    print(f"Connection failed: {e}")
