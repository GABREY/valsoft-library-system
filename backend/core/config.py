import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

if not all([SUPABASE_URL, SUPABASE_KEY, COHERE_API_KEY]):
    raise ValueError("Missing critical environment variables. Check your .env file.")
