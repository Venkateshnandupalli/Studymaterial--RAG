import os
from dotenv import load_dotenv

# Load .env from the rag_app root (one level up from backend/)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("❌  SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")

if not OPENAI_API_KEY:
    raise RuntimeError("❌  OPENAI_API_KEY must be set in .env")
