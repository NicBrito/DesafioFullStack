import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    app_name: str = "Hub Inteligente de Recursos Educacionais"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data.db")
    api_prefix: str = os.getenv("API_PREFIX", "")
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    ai_mode: str = os.getenv("AI_MODE", "mock")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


@lru_cache
def get_settings() -> Settings:
    return Settings()
