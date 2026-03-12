from src.core.env import load_env_variables

def test_env_variables_loaded():
    """Test that required environment variables are loaded"""
    env = load_env_variables()
    assert env.get("NEXT_PUBLIC_SUPABASE_URL") is not None
    assert env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") is not None
    assert env.get("SUPABASE_SERVICE_ROLE_KEY") is not None
