import os
from pathlib import Path
from dotenv import load_dotenv

def load_env_variables():
    """Load environment variables from .env.local file or environment"""
    env_path = Path(__file__).parent.parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    # Also check environment variables directly (for CI/test environments)
    return {
        "NEXT_PUBLIC_SUPABASE_URL": os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "test_url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or "test_anon_key",
        "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "test_service_key",
    }
