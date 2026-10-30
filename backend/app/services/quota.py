"""Transactional daily quota reservation service.

Enforces the hard cap of 30 applications/day (configurable via job_profile.global_daily_cap).
Uses Asia/Karachi timezone to determine the current quota-day boundary.
All reservation operations use SELECT FOR UPDATE to prevent race conditions.

DailyQuota DB columns used:
  - used_count   : Number of quota slots used today
  - max_limit    : Configured daily cap for this day
  - reserved_count: Slots atomically reserved but not yet confirmed
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Optional

import pytz
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.models import Application, DailyQuota, JobProfile, Profile

logger = logging.getLogger(__name__)

PKT = pytz.timezone("Asia/Karachi")


def _today_pkt() -> date:
    """Return the current date in Asia/Karachi timezone."""
    return datetime.now(tz=PKT).date()


@dataclass
class QuotaResult:
    """Result of a quota reservation attempt."""
    granted: bool
    reason: str
    used: int
    cap: int
    remaining: int


def get_daily_cap(db: Session) -> int:
    """Read the configured global daily cap from job_profile, fallback to settings."""
    profile = db.query(JobProfile).first()
    if profile and profile.global_daily_cap:
        return int(profile.global_daily_cap)
    return settings.GLOBAL_DAILY_APPLICATION_LIMIT


def get_today_usage(db: Session, user_id: str) -> int:
    """
    Count how many applications were sent TODAY (PKT) for this user.
    Uses the applications table as the ground truth.
    """
    today = _today_pkt()
    sent_today = (
        db.query(func.count(Application.id))
        .filter(
            Application.user_id == user_id,
            Application.status.in_(["sent", "opened", "replied", "rejected", "bounced"]),
            func.date(Application.sent_at) == today,
        )
        .scalar()
        or 0
    )
    return int(sent_today)


def reserve_quota(db: Session, user_id: str) -> QuotaResult:
    """
    Atomically reserve one application slot for today.

    Algorithm:
    1. Lock the DailyQuota row for this user+date (SELECT FOR UPDATE).
    2. If row doesn't exist, create it with used_count=0.
    3. Check used_count < max_limit.
    4. Increment used_count and commit.
    5. Return QuotaResult indicating success or failure.

    Concurrency-safe: only one worker holds the row lock at a time.
    """
    today = _today_pkt()
    cap = get_daily_cap(db)

    try:
        # Attempt to lock an existing row for this user+date
        quota = (
            db.execute(
                select(DailyQuota)
                .where(DailyQuota.user_id == user_id, DailyQuota.date == today)
                .with_for_update(skip_locked=False)
            )
            .scalars()
            .first()
        )

        if quota is None:
            # Create a fresh quota row for today
            quota = DailyQuota(
                user_id=user_id,
                date=today,
                used_count=0,
                reserved_count=0,
                max_limit=cap,
            )
            db.add(quota)
            db.flush()

        # Use the higher of the DB counter or the ground-truth count
        actual_used = get_today_usage(db, user_id)
        used = max(int(quota.used_count or 0), actual_used)
        effective_cap = int(quota.max_limit or cap)

        if used >= effective_cap:
            logger.warning(
                "Quota exhausted for user %s: used=%d cap=%d date=%s",
                user_id, used, effective_cap, today
            )
            return QuotaResult(
                granted=False,
                reason=(
                    f"Daily application cap of {effective_cap} reached for {today} (PKT). "
                    "Resets at midnight Asia/Karachi time."
                ),
                used=used,
                cap=effective_cap,
                remaining=0,
            )

        # Reserve the slot
        quota.used_count = used + 1
        db.commit()

        logger.info(
            "Quota slot reserved for user %s: %d/%d for %s",
            user_id, used + 1, effective_cap, today
        )
        return QuotaResult(
            granted=True,
            reason="Quota slot reserved successfully.",
            used=used + 1,
            cap=effective_cap,
            remaining=effective_cap - (used + 1),
        )

    except Exception as exc:
        db.rollback()
        logger.error(
            "Quota reservation failed for user %s: %s", user_id, exc, exc_info=True
        )
        return QuotaResult(
            granted=False,
            reason=f"Quota reservation error: {exc}",
            used=0,
            cap=cap,
            remaining=0,
        )


def release_quota(db: Session, user_id: str) -> bool:
    """
    Release a previously reserved quota slot (e.g., if send failed after reservation).
    Decrements used_count but never below zero.
    """
    today = _today_pkt()
    try:
        quota = (
            db.query(DailyQuota)
            .filter(DailyQuota.user_id == user_id, DailyQuota.date == today)
            .with_for_update()
            .first()
        )
        if quota and quota.used_count and quota.used_count > 0:
            quota.used_count = quota.used_count - 1
            db.commit()
            logger.info(
                "Quota slot released for user %s — now at %d", user_id, quota.used_count
            )
            return True
    except Exception as exc:
        db.rollback()
        logger.error("Quota release failed for user %s: %s", user_id, exc)
    return False


def get_quota_status(db: Session, user_id: str) -> dict:
    """Return the current quota status for the dashboard/API."""
    today = _today_pkt()
    cap = get_daily_cap(db)
    used = get_today_usage(db, user_id)
    return {
        "date_pkt": today.isoformat(),
        "applications_used": used,
        "cap": cap,
        "remaining": max(0, cap - used),
        "exhausted": used >= cap,
        "timezone": "Asia/Karachi",
    }
