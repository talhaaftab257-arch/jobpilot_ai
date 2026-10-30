from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.schemas.domain import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
def check_health(db: Session = Depends(get_db)):
    """Health and readiness check."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"degraded: {str(e)}"

    return HealthResponse(
        status="ok" if "degraded" not in db_status else "degraded",
        version=settings.VERSION,
        timestamp=datetime.utcnow(),
        database=db_status,
        emergency_paused=settings.EMERGENCY_PAUSED,
        dry_run_mode=settings.DRY_RUN_MODE
    )
