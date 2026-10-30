from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import JobProfile, Profile
from backend.app.schemas.domain import JobProfileConfigSchema, JobProfileConfigUpdateSchema

router = APIRouter(prefix="/config", tags=["Configuration"])


def get_or_create_default_profile(db: Session) -> JobProfile:
    """Helper to retrieve or initialize the default user configuration."""
    profile = db.query(JobProfile).first()
    if not profile:
        # Check if a user profile exists
        user = db.query(Profile).first()
        if not user:
            user = Profile(
                full_name="Default Candidate",
                email="candidate@example.com",
                timezone=settings.TIMEZONE
            )
            db.add(user)
            db.flush()

        profile = JobProfile(
            user_id=user.id,
            target_titles=[
                "AI Engineer", "AI/ML Engineer", "Agentic AI Engineer", 
                "LLM Engineer", "Machine Learning Engineer", "Generative AI Engineer", 
                "AI Automation Engineer", "Python AI Engineer", "RAG Engineer"
            ],
            target_skills=[
                "Python", "FastAPI", "LLMs", "RAG", "LangChain", "LangGraph", 
                "AI agents", "multi-agent systems", "NLP", "vector databases", 
                "OpenAI API", "AI automation"
            ],
            min_experience_years=0,
            work_arrangements=["remote", "hybrid"],
            min_match_score=settings.DEFAULT_MIN_MATCH_SCORE,
            max_job_age_hours=settings.JOB_FRESHNESS_HOURS,
            global_daily_cap=settings.GLOBAL_DAILY_APPLICATION_LIMIT,
            email_automation_mode="approval",
            is_emergency_paused=settings.EMERGENCY_PAUSED,
            is_dry_run_mode=settings.DRY_RUN_MODE
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=JobProfileConfigSchema)
def get_config(db: Session = Depends(get_db)):
    """Fetch current system configuration and job preferences."""
    profile = get_or_create_default_profile(db)
    return JobProfileConfigSchema.model_validate(profile)


@router.put("", response_model=JobProfileConfigSchema)
def update_config(update_data: JobProfileConfigUpdateSchema, db: Session = Depends(get_db)):
    """Update job search preferences, limits, and email templates."""
    profile = get_or_create_default_profile(db)
    update_dict = update_data.model_dump(exclude_unset=True)

    for field, value in update_dict.items():
        setattr(profile, field, value)

    # Keep settings synchronized
    if "is_emergency_paused" in update_dict:
        settings.EMERGENCY_PAUSED = update_dict["is_emergency_paused"]
    if "is_dry_run_mode" in update_dict:
        settings.DRY_RUN_MODE = update_dict["is_dry_run_mode"]

    db.commit()
    db.refresh(profile)
    return JobProfileConfigSchema.model_validate(profile)
