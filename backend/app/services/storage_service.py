from supabase import Client, create_client

from app.core.config import get_settings

settings = get_settings()


def get_supabase_client() -> Client:
  return create_client(
      str(settings.SUPABASE_URL),
      settings.SUPABASE_SERVICE_KEY,
  )



