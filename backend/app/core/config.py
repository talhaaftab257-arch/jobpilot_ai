"""Core configuration module for JobPilot AI."""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "JobPilot AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "insecure-development-secret-key-change-in-production"

    # Job Hunting Agent operational defaults
    TIMEZONE: str = "Asia/Karachi"
    GLOBAL_DAILY_APPLICATION_LIMIT: int = 30
    DEFAULT_MIN_MATCH_SCORE: int = 75
    JOB_FRESHNESS_HOURS: int = 72
    EMERGENCY_PAUSED: bool = False
    DRY_RUN_MODE: bool = True

    # Database
    DATABASE_URL: Optional[str] = None

    # Supabase credentials (optional for backend if using direct DB, or for storage/auth)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "regional-resumes"

    # AI / LLM
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Gmail OAuth 2.0
    GMAIL_CLIENT_ID: Optional[str] = None
    GMAIL_CLIENT_SECRET: Optional[str] = None
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/gmail/callback"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
