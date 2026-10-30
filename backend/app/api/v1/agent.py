from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import get_db, SessionLocal
from backend.app.db.models import AgentRun, JobProfile, Profile
from backend.app.workflows.discovery_pipeline import run_discovery_pipeline

router = APIRouter(prefix="/agent", tags=["Agent Controls"])


async def execute_pipeline_task(run_id: UUID, user_id: UUID):
    """Background task to run discovery pipeline and update run metrics."""
    db = SessionLocal()
    try:
        run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
        if not run:
            return

        pipeline_result = await run_discovery_pipeline(db, str(user_id), dry_run=settings.DRY_RUN_MODE)
        run.status = "completed"
        run.jobs_discovered = pipeline_result.jobs_discovered
        run.jobs_matched = pipeline_result.jobs_eligible
        run.errors = pipeline_result.errors
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        db.rollback()
        run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.errors = [str(e)]
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


@router.post("/pause")
def pause_agent(db: Session = Depends(get_db)):
    """Global emergency pause to instantly stop all outbound applications."""
    settings.EMERGENCY_PAUSED = True
    profile = db.query(JobProfile).first()
    if profile:
        profile.is_emergency_paused = True
        db.commit()
    return {"status": "success", "is_emergency_paused": True, "message": "Global agent pause activated. All outbound applications halted."}


@router.post("/resume")
def resume_agent(db: Session = Depends(get_db)):
    """Resume agent processing and application queue."""
    settings.EMERGENCY_PAUSED = False
    profile = db.query(JobProfile).first()
    if profile:
        profile.is_emergency_paused = False
        db.commit()
    return {"status": "success", "is_emergency_paused": False, "message": "Agent resumed."}


@router.post("/runs")
async def trigger_agent_run(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger a new job discovery, evaluation, and application workflow run."""
    user = db.query(Profile).first()
    if not user:
        user = Profile(full_name="Default Candidate", email="candidate@example.com")
        db.add(user)
        db.flush()

    run = AgentRun(
        user_id=user.id,
        trigger_type="manual",
        status="running",
        jobs_discovered=0,
        jobs_matched=0,
        applications_sent=0,
        started_at=datetime.now(timezone.utc)
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Launch background task
    background_tasks.add_task(execute_pipeline_task, run.id, user.id)

    return {
        "run_id": str(run.id),
        "status": run.status,
        "jobs_discovered": run.jobs_discovered,
        "jobs_matched": run.jobs_matched,
        "applications_sent": run.applications_sent,
        "started_at": run.started_at
    }


@router.get("/runs/{id}")
def get_run_status(id: UUID, db: Session = Depends(get_db)):
    """Get status and metrics of a specific agent run."""
    run = db.query(AgentRun).filter(AgentRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return {
        "run_id": str(run.id),
        "status": run.status,
        "jobs_discovered": run.jobs_discovered,
        "jobs_matched": run.jobs_matched,
        "applications_sent": run.applications_sent,
        "errors": run.errors,
        "started_at": run.started_at,
        "completed_at": run.completed_at
    }
