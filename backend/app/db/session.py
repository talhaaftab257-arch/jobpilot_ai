"""Database session and connection engine for SQLAlchemy 2.0."""
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Base declarative class
Base = declarative_base()

# Resolve database URL: if not set, use SQLite for local development / testing fallback
db_url = settings.DATABASE_URL
if not db_url:
    logger.warning("DATABASE_URL not configured. Using local fallback SQLite database: sqlite:///./jobpilot_dev.db")
    db_url = "sqlite:///./jobpilot_dev.db"

# Engine configuration
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "postgresql" in db_url:
    connect_args = {"prepare_threshold": None}

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
