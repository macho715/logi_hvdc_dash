import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to {url}...")

try:
    supabase = create_client(url, key)
    # Check if 'shipments' table exists by selecting 1 row
    # If the table doesn't exist, this should raise an APIError
    response = supabase.table("shipments").select("id").limit(1).execute()
    print("Table 'shipments' exists.")
    print(f"Current row count (approx): {len(response.data)}")
except Exception as e:
    print(f"Error accessing table 'shipments': {e}")
    # Common error message for missing table is looking like "relation ... does not exist" or 404
