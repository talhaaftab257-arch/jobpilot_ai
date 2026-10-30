"""Main FastAPI application entrypoint for JobPilot AI."""
import sys
import asyncio
import logging
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.config import router as config_router
from backend.app.api.v1.regions import router as regions_router
from backend.app.api.v1.resumes import router as resumes_router
from backend.app.api.v1.jobs import router as jobs_router
from backend.app.api.v1.applications import router as applications_router
from backend.app.api.v1.agent import router as agent_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.integrations import router as integrations_router
from backend.app.api.v1.crm import router as crm_router
from backend.app.api.v1.billing import router as billing_router
from backend.app.api.v1.workspaces import router as workspaces_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("jobpilot")

# Initialize tables if using SQLite dev fallback
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.info(f"Database table sync note: {e}")


# ── Lifespan: start/stop background scheduler ─────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start APScheduler on startup, shut it down on exit."""
    scheduler = None
    try:
        from backend.app.scheduler.scheduler import create_scheduler
        scheduler = create_scheduler(
            discovery_interval_hours=6,
            report_hour_pkt=9,
        )
        scheduler.start()
        logger.info("✅ APScheduler started — discovery every 6h, daily report at 09:00 PKT")
    except Exception as e:
        logger.warning(f"Scheduler could not start (APScheduler may not be installed): {e}")

    yield  # ← Application runs here

    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Autonomous AI Job Hunting Agent backend with regional prioritization, "
        "deterministic CV mapping, 10-point safety gates, and transactional 30/day quota."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(config_router, prefix=settings.API_V1_PREFIX)
app.include_router(regions_router, prefix=settings.API_V1_PREFIX)
app.include_router(resumes_router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs_router, prefix=settings.API_V1_PREFIX)
app.include_router(applications_router, prefix=settings.API_V1_PREFIX)
app.include_router(agent_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(integrations_router, prefix=settings.API_V1_PREFIX)
app.include_router(crm_router, prefix=settings.API_V1_PREFIX)
app.include_router(billing_router, prefix=settings.API_V1_PREFIX)
app.include_router(workspaces_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "dry_run_mode": settings.DRY_RUN_MODE,
        "emergency_paused": settings.EMERGENCY_PAUSED,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
