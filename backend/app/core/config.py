import os
from functools import lru_cache
from typing import Optional


class Settings:
    """
    Simple settings loader using environment variables.
    Avoids pydantic BaseSettings to work cleanly with Pydantic v2.
    """

    # App
    APP_NAME: str
    ENVIRONMENT: str

    # Database
    DATABASE_URL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Auth / Clerk
    CLERK_SECRET_KEY: Optional[str]

    # OpenAI / Grok (LLM)
    OPENAI_API_KEY: Optional[str]
    GROK_API_KEY: Optional[str]
    GROK_API_BASE_URL: Optional[str]
    GROK_MODEL: str

    def __init__(self) -> None:
        self.APP_NAME = os.getenv("APP_NAME", "Excel Killer API")
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "local")

        self.DATABASE_URL = os.getenv("DATABASE_URL", "")

        self.SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

        self.CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        self.GROK_API_KEY = os.getenv("GROK_API_KEY")
        self.GROK_API_BASE_URL = os.getenv("GROK_API_BASE_URL")
        self.GROK_MODEL = os.getenv("GROK_MODEL", "grok-2-latest")


@lru_cache()
def get_settings() -> Settings:
    return Settings()

