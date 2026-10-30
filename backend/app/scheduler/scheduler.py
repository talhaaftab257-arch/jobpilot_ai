"""APScheduler background scheduler for JobPilot AI.

Schedules:
  - Discovery cron: every 6 hours — runs job discovery + scoring pipeline
  - Daily report:   once per day at 09:00 PKT — sends summary email to candidate

The scheduler attaches to the FastAPI lifespan (startup/shutdown), so it is
automatically started when the server starts and cleanly shut down on exit.

Usage in main.py:
    from backend.app.scheduler.scheduler import create_scheduler
    scheduler = create_scheduler()
    # Call scheduler.start() in startup, scheduler.shutdown() in shutdown.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

PKT = pytz.timezone("Asia/Karachi")


# ──────────────────────────────────────────────────────────────────────────────
# Scheduled job functions
# ──────────────────────────────────────────────────────────────────────────────

async def run_scheduled_discovery() -> None:
    """
    Runs the discovery pipeline as a background scheduled task.
    Always runs in dry_run mode unless explicitly configured otherwise.
    """
    from backend.app.core.config import settings
    from backend.app.db.session import SessionLocal
    from backend.app.db.models import AgentRun, Profile
    from backend.app.workflows.discovery_pipeline import run_discovery_pipeline

    logger.info("⏰ Scheduled discovery run started at %s", datetime.now(tz=PKT).isoformat())
    db = SessionLocal()
    try:
        user = db.query(Profile).first()
        if not user:
            logger.warning("No user profile found — skipping scheduled discovery.")
            return

        run = AgentRun(
            user_id=user.id,
            trigger_type="scheduled",
            status="running",
            jobs_discovered=0,
            jobs_matched=0,
            applications_sent=0,
            started_at=datetime.now(timezone.utc),
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        result = await run_discovery_pipeline(db, str(user.id), dry_run=settings.DRY_RUN_MODE)

        run.status = "completed"
        run.jobs_discovered = result.jobs_discovered
        run.jobs_matched = result.jobs_eligible
        run.errors = result.errors
        run.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            "✅ Scheduled discovery complete: %d discovered, %d eligible, %d errors",
            result.jobs_discovered, result.jobs_eligible, len(result.errors)
        )
    except Exception as exc:
        db.rollback()
        logger.error("Scheduled discovery FAILED: %s", exc, exc_info=True)
        try:
            run.status = "failed"
            run.errors = [str(exc)]
            run.completed_at = datetime.now(timezone.utc)
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


async def send_daily_report() -> None:
    """
    Sends the daily summary report to the candidate.
    Shows: jobs discovered, matched, applications sent, quota used.
    Skipped if no Gmail integration is connected.
    """
    from backend.app.core.config import settings
    from backend.app.db.session import SessionLocal
    from backend.app.db.models import Profile
    from backend.app.services.quota import get_quota_status

    logger.info("📊 Daily report job triggered at %s", datetime.now(tz=PKT).isoformat())
    db = SessionLocal()
    try:
        user = db.query(Profile).first()
        if not user:
            logger.warning("No user found — skipping daily report.")
            return

        quota = get_quota_status(db, str(user.id))
        logger.info(
            "Daily quota summary for %s: %d/%d used (%d remaining)",
            user.email,
            quota["applications_used"],
            quota["cap"],
            quota["remaining"],
        )

        # If Gmail is connected and not dry-run, could send actual report email here
        # For now: log the summary (extend to send email in a future iteration)
        logger.info(
            "Daily Report Summary | User: %s | Date (PKT): %s | Used: %d | Cap: %d | Remaining: %d",
            user.email,
            quota["date_pkt"],
            quota["applications_used"],
            quota["cap"],
            quota["remaining"],
        )
    except Exception as exc:
        logger.error("Daily report FAILED: %s", exc, exc_info=True)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────
# Scheduler factory
# ──────────────────────────────────────────────────────────────────────────────

def create_scheduler(
    discovery_interval_hours: int = 6,
    report_hour_pkt: int = 9,
) -> AsyncIOScheduler:
    """
    Create and configure the APScheduler instance.

    Args:
        discovery_interval_hours: How often to run the discovery pipeline (default 6h)
        report_hour_pkt:          Hour (24h, PKT) to send the daily report (default 09:00)

    Returns:
        Configured AsyncIOScheduler (not yet started).
    """
    scheduler = AsyncIOScheduler(timezone=PKT)

    # ── Job 1: Discovery pipeline every N hours ────────────────────────────
    scheduler.add_job(
        run_scheduled_discovery,
        trigger=IntervalTrigger(hours=discovery_interval_hours, timezone=PKT),
        id="discovery_pipeline",
        name="Scheduled Job Discovery Pipeline",
        replace_existing=True,
        max_instances=1,          # Never run two discoveries simultaneously
        coalesce=True,            # Skip missed runs if server was down
        misfire_grace_time=300,   # Allow up to 5 minutes late
    )
    logger.info(
        "Scheduled: discovery pipeline every %d hours", discovery_interval_hours
    )

    # ── Job 2: Daily report at 09:00 PKT ──────────────────────────────────
    scheduler.add_job(
        send_daily_report,
        trigger=CronTrigger(hour=report_hour_pkt, minute=0, timezone=PKT),
        id="daily_report",
        name="Daily Application Summary Report",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=600,
    )
    logger.info(
        "Scheduled: daily report at %02d:00 PKT", report_hour_pkt
    )

    return scheduler
