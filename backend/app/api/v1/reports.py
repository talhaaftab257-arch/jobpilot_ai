from datetime import date, datetime
import pytz
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import DailyQuota, Application, Job, Profile, Region
from backend.app.schemas.domain import DailyReportSchema

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily", response_model=DailyReportSchema)
def get_daily_report(db: Session = Depends(get_db)):
    """Fetch daily application metrics, quota usage in Asia/Karachi, and regional breakdown."""
    user = db.query(Profile).first()

    # Calculate local date in Asia/Karachi timezone
    local_tz = pytz.timezone(settings.TIMEZONE)
    local_now = datetime.now(local_tz)
    today_date = local_now.date()

    used_quota = 0
    max_quota = settings.GLOBAL_DAILY_APPLICATION_LIMIT

    if user:
        quota_record = db.query(DailyQuota).filter(
            DailyQuota.user_id == user.id,
            DailyQuota.date == today_date
        ).first()
        if quota_record:
            used_quota = quota_record.used_count
            max_quota = quota_record.max_limit

    # Count jobs discovered today
    start_of_day = datetime(today_date.year, today_date.month, today_date.day)
    jobs_today = db.query(Job).filter(Job.created_at >= start_of_day).count()

    # Applications sent today
    sent_today = db.query(Application).filter(
        Application.status.in_(["sent", "submitted", "delivery_confirmed"]),
        Application.sent_at >= start_of_day
    ).count()

    # Pending manual actions & failures
    pending_actions = db.query(Application).filter(Application.status == "needs_manual_action").count()
    failed_apps = db.query(Application).filter(Application.status == "failed").count()

    # Region breakdown
    region_breakdown = {}
    for r in ["PK", "EU", "ASIA", "ARAB"]:
        jobs_in_region = db.query(Job).filter(Job.region_code == r).count()
        apps_in_region = db.query(Application).join(Job).filter(Job.region_code == r).count()
        region_breakdown[r] = {
            "jobs_discovered": jobs_in_region,
            "applications": apps_in_region
        }

    return DailyReportSchema(
        date=today_date,
        timezone=settings.TIMEZONE,
        used_quota=used_quota,
        max_quota=max_quota,
        jobs_discovered_today=jobs_today,
        eligible_matches_today=jobs_today,
        applications_sent_today=sent_today,
        pending_manual_actions=pending_actions,
        failed_applications=failed_apps,
        region_breakdown=region_breakdown
    )
