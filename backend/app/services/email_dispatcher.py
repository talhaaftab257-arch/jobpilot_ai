"""Email dispatcher with 10-point pre-send safety gate.

This is the final guard before any email leaves the system.
ALL 10 checks from Prompt.txt §9 must pass or the send is aborted.

Safety Gates (in order):
  1. Job is still eligible (no disqualification reason in latest match)
  2. Job is within 72-hour freshness window
  3. Match score ≥ threshold (default 75)
  4. Contact email is explicitly verified (verified_at IS NOT NULL)
  5. Correct regional resume is active for this job's region
  6. Email body uses only verified info (no unreplaced placeholders)
  7. No duplicate application already exists (status not in sent states)
  8. Quota has capacity (transactional reserve via quota service)
  9. Emergency pause is OFF
  10. Contact not excluded

On success: sends via Gmail API, records email_log, updates application status.
On failure: logs reason, returns DispatchResult with which gate failed.
"""
from __future__ import annotations

import base64
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import List, Optional

import httpx
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.models import (
    Application,
    ApplicationEvent,
    EmailLog,
    Job,
    JobContact,
    JobMatch,
    JobProfile,
    Profile,
    Region,
    RegionResume,
    Resume,
)
from backend.app.integrations.gmail.oauth import get_valid_access_token
from backend.app.services.email_generator import ApplicationEmailDraft, generate_application_email
from backend.app.services.quota import QuotaResult, release_quota, reserve_quota
from backend.app.services.resumes import resolve_regional_resume

logger = logging.getLogger(__name__)

GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"

# Application statuses considered "already sent" — block re-send
TERMINAL_STATUSES = {"sent", "opened", "replied", "rejected", "bounced"}


# ──────────────────────────────────────────────────────────────────────────────
# Result types
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class GateResult:
    """Result of a single safety gate evaluation."""
    gate_number: int
    gate_name: str
    passed: bool
    reason: str


@dataclass
class DispatchResult:
    """Full result from the email dispatcher."""
    success: bool
    application_id: Optional[str]
    job_id: str
    gates: List[GateResult] = field(default_factory=list)
    email_log_id: Optional[str] = None
    provider_message_id: Optional[str] = None   # Gmail message ID
    dry_run: bool = False
    error: Optional[str] = None

    @property
    def failed_gate(self) -> Optional[GateResult]:
        return next((g for g in self.gates if not g.passed), None)


# ──────────────────────────────────────────────────────────────────────────────
# Core dispatcher
# ──────────────────────────────────────────────────────────────────────────────

async def dispatch_application_email(
    db: Session,
    user_id: str,
    job_id: str,
    dry_run: Optional[bool] = None,
) -> DispatchResult:
    """
    Run all 10 safety gates, generate the email, send via Gmail API, and persist.

    dry_run: if True (or settings.DRY_RUN_MODE is True), skips actual send but
             records the log entry with status='dry_run'.
    """
    is_dry_run = dry_run if dry_run is not None else settings.DRY_RUN_MODE
    gates: List[GateResult] = []
    quota_reserved = False
    job_id_str = str(job_id)

    # ── Load required entities ─────────────────────────────────────────────
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    job_profile = db.query(JobProfile).filter(JobProfile.user_id == user_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()

    if not profile or not job_profile or not job:
        return DispatchResult(
            success=False,
            application_id=None,
            job_id=job_id_str,
            error=(
                f"Missing required records: "
                f"profile={bool(profile)}, "
                f"job_profile={bool(job_profile)}, "
                f"job={bool(job)}"
            ),
        )

    try:
        # ── GATE 1: Job is eligible (latest match has no disqualification) ─
        match = (
            db.query(JobMatch)
            .filter(JobMatch.job_id == job.id, JobMatch.job_profile_id == job_profile.id)
            .first()
        )
        job_eligible = match is not None and match.is_eligible
        g1 = GateResult(
            1, "Job Eligibility",
            job_eligible,
            f"Match eligible: {job_eligible}; reason: {match.disqualification_reason if match else 'no match record'}"
        )
        gates.append(g1)
        if not g1.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 2: 72-hour freshness ──────────────────────────────────────
        freshness_ok = False
        freshness_reason = "published_at is null (unknown age)"
        if job.published_at:
            pub = job.published_at
            if pub.tzinfo is None:
                pub = pub.replace(tzinfo=timezone.utc)
            age = datetime.now(timezone.utc) - pub
            freshness_ok = age <= timedelta(hours=settings.JOB_FRESHNESS_HOURS)
            freshness_reason = f"Job age: {age.total_seconds()/3600:.1f}h (limit {settings.JOB_FRESHNESS_HOURS}h)"
        g2 = GateResult(2, "72-hour Freshness", freshness_ok, freshness_reason)
        gates.append(g2)
        if not g2.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 3: Match score ≥ threshold ───────────────────────────────
        threshold = job_profile.min_match_score or settings.DEFAULT_MIN_MATCH_SCORE
        score = float(match.overall_score) if match else 0.0
        g3 = GateResult(3, "Match Score", score >= threshold, f"Score {score:.1f} / threshold {threshold}")
        gates.append(g3)
        if not g3.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 4: Verified contact ───────────────────────────────────────
        contact = (
            db.query(JobContact)
            .filter(
                JobContact.job_id == job.id,
                JobContact.verified_at.isnot(None),
            )
            .first()
        )
        g4 = GateResult(
            4, "Verified Contact",
            contact is not None,
            f"Contact {'found: ' + contact.email if contact else 'NOT FOUND (no verified email in job_contacts)'}"
        )
        gates.append(g4)
        if not g4.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 5: Correct regional resume active ─────────────────────────
        region_code = job.region_code or "PK"
        resume_resolution = resolve_regional_resume(region_code, str(user_id), db)
        g5 = GateResult(
            5, "Regional Resume Active",
            not resume_resolution.is_missing,
            resume_resolution.message
        )
        gates.append(g5)
        if not g5.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 6: Email draft integrity (no unreplaced placeholders) ────
        draft: Optional[ApplicationEmailDraft] = None
        g6_passed = False
        g6_reason = ""
        try:
            region = db.query(Region).filter(Region.code == region_code).first()
            # Build a lightweight proxy for generate_application_email which uses job.company, job.source_url
            # Map model fields to what the generator expects
            draft = _generate_draft(profile, job_profile, job, contact, region)
            g6_passed = draft.is_complete()
            g6_reason = "Draft complete — no unreplaced placeholders" if g6_passed else "Unreplaced template variables remain"
        except ValueError as e:
            g6_reason = str(e)
        g6 = GateResult(6, "Email Draft Integrity", g6_passed, g6_reason)
        gates.append(g6)
        if not g6.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 7: No duplicate application in terminal state ────────────
        existing_app = (
            db.query(Application)
            .filter(Application.user_id == user_id, Application.job_id == job.id)
            .first()
        )
        already_sent = existing_app is not None and existing_app.status in TERMINAL_STATUSES
        g7 = GateResult(
            7, "No Duplicate Application",
            not already_sent,
            f"Existing application status: {existing_app.status if existing_app else 'none'}"
        )
        gates.append(g7)
        if not g7.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 8: Quota has capacity (transactional) ────────────────────
        quota: QuotaResult = reserve_quota(db, str(user_id))
        quota_reserved = quota.granted
        g8 = GateResult(8, "Daily Quota", quota.granted, quota.reason)
        gates.append(g8)
        if not g8.passed:
            return _gate_fail(job_id_str, gates)

        # ── GATE 9: Emergency pause is OFF ────────────────────────────────
        paused = settings.EMERGENCY_PAUSED or bool(job_profile.is_emergency_paused)
        g9 = GateResult(
            9, "Emergency Pause OFF",
            not paused,
            "EMERGENCY PAUSED — all sends halted" if paused else "Not paused"
        )
        gates.append(g9)
        if not g9.passed:
            if quota_reserved:
                release_quota(db, str(user_id))
            return _gate_fail(job_id_str, gates)

        # ── GATE 10: Contact not excluded ─────────────────────────────────
        excluded_emails: List[str] = job_profile.excluded_contact_emails or []
        is_excluded = contact.email.lower() in [e.lower().strip() for e in excluded_emails]
        g10 = GateResult(
            10, "Contact Not Excluded",
            not is_excluded,
            f"Contact {contact.email} {'IS in exclusion list — skipping' if is_excluded else 'not excluded'}"
        )
        gates.append(g10)
        if not g10.passed:
            if quota_reserved:
                release_quota(db, str(user_id))
            return _gate_fail(job_id_str, gates)

        # ── All 10 gates PASSED ────────────────────────────────────────────
        logger.info(
            "✅ All 10 safety gates PASSED for job %s → %s (dry_run=%s)",
            job_id, draft.to_email, is_dry_run
        )

        # ── Upsert application record ──────────────────────────────────────
        resume_id = resume_resolution.resume.id if resume_resolution.resume else None
        if existing_app:
            app = existing_app
        else:
            app = Application(
                user_id=user_id,
                job_id=job.id,
                status="queued",
                resume_id=resume_id,
                contact_id=contact.id,
                channel="email",
                idempotency_key=str(uuid.uuid4()),
            )
            db.add(app)
            db.flush()

        # ── Send or dry-run ────────────────────────────────────────────────
        gmail_msg_id = None
        raw_resp = {}
        final_status = "dry_run" if is_dry_run else "sent"

        if not is_dry_run:
            access_token = await get_valid_access_token(db, str(user_id))
            if not access_token:
                if quota_reserved:
                    release_quota(db, str(user_id))
                return DispatchResult(
                    success=False,
                    application_id=str(app.id),
                    job_id=job_id_str,
                    gates=gates,
                    error=(
                        "Gmail not connected. Connect Gmail in Integrations → Gmail OAuth "
                        "before enabling live sending."
                    ),
                )
            try:
                gmail_msg_id, raw_resp = await _send_via_gmail_api(access_token, draft)
            except Exception as e:
                if quota_reserved:
                    release_quota(db, str(user_id))
                logger.error("Gmail send failed for job %s: %s", job_id, e)
                return DispatchResult(
                    success=False,
                    application_id=str(app.id),
                    job_id=job_id_str,
                    gates=gates,
                    error=f"Gmail API error: {e}",
                )

        # ── Persist email log ──────────────────────────────────────────────
        log_entry = EmailLog(
            application_id=app.id,
            recipient_email=draft.to_email,
            subject=draft.subject,
            provider_message_id=gmail_msg_id,
            status=final_status,
            raw_response=raw_resp if raw_resp else {"dry_run": is_dry_run, "subject": draft.subject},
            sent_at=datetime.now(timezone.utc),
        )
        db.add(log_entry)

        # ── Update application state ───────────────────────────────────────
        prev_status = app.status
        app.status = final_status
        app.email_subject = draft.subject
        app.email_body = draft.body
        if not is_dry_run:
            app.sent_at = datetime.now(timezone.utc)

        # ── Audit event ────────────────────────────────────────────────────
        event = ApplicationEvent(
            application_id=app.id,
            event_type="email_dispatched" if not is_dry_run else "email_dry_run",
            from_status=prev_status,
            to_status=final_status,
            details={
                "gates_passed": len(gates),
                "dry_run": is_dry_run,
                "recipient": draft.to_email,
                "quota_used": quota.used,
                "quota_cap": quota.cap,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(log_entry)

        logger.info(
            "Application email %s for job %s → %s (dry_run=%s, quota=%d/%d)",
            "DRY-RUN RECORDED" if is_dry_run else "SENT",
            job_id, draft.to_email, is_dry_run,
            quota.used, quota.cap
        )

        return DispatchResult(
            success=True,
            application_id=str(app.id),
            job_id=job_id_str,
            gates=gates,
            email_log_id=str(log_entry.id),
            provider_message_id=gmail_msg_id,
            dry_run=is_dry_run,
        )

    except Exception as exc:
        db.rollback()
        if quota_reserved:
            try:
                release_quota(db, str(user_id))
            except Exception:
                pass
        logger.error("Dispatcher unhandled error for job %s: %s", job_id, exc, exc_info=True)
        return DispatchResult(
            success=False,
            application_id=None,
            job_id=job_id_str,
            gates=gates,
            error=f"Unhandled dispatcher error: {exc}",
        )


# ──────────────────────────────────────────────────────────────────────────────
# Email generation adapter
# ──────────────────────────────────────────────────────────────────────────────

def _generate_draft(
    profile: Profile,
    job_profile: JobProfile,
    job: Job,
    contact: JobContact,
    region: Optional[Region],
) -> "ApplicationEmailDraft":
    """
    Adapter that bridges Job model field names (company_name, canonical_url)
    to the email generator's expectations (job.company, job.source_url).
    Uses a lightweight attribute proxy to avoid modifying the Job ORM class.
    """
    from backend.app.services.email_generator import (
        ApplicationEmailDraft,
        _default_body_template,
        _pick_relevant_skills,
        _substitute,
        TEMPLATE_VAR_PATTERN,
    )

    # Resolve verified fields from actual model columns
    candidate_name = (profile.full_name or "").strip()
    job_title = (job.title or "").strip()
    company_name = (job.company_name or "").strip()
    job_url = (job.canonical_url or "").strip()
    to_email = (contact.email or "").strip()
    region_name = region.name if region else "International"

    if not candidate_name:
        raise ValueError("profiles.full_name is empty")
    if not job_title:
        raise ValueError(f"Job {job.id} has no title")
    if not company_name:
        raise ValueError(f"Job {job.id} has no company_name")
    if not job_url:
        raise ValueError(f"Job {job.id} has no canonical_url")
    if not to_email:
        raise ValueError(f"Contact for job {job.id} has no email")

    profile_skills: List[str] = job_profile.target_skills or []
    # Job doesn't have required_skills; extract from raw_metadata if present
    job_skills: List[str] = (job.raw_metadata or {}).get("required_skills", [])
    relevant_skills = _pick_relevant_skills(profile_skills, job_skills)

    variables = {
        "candidate_name": candidate_name,
        "job_title": job_title,
        "company_name": company_name,
        "relevant_skills": relevant_skills,
        "job_url": job_url,
        "region_name": region_name,
    }

    subject_tpl = job_profile.email_template_subject or "Application for {{job_title}} - {{candidate_name}}"
    body_tpl = job_profile.email_template_body or _default_body_template()

    subject = _substitute(subject_tpl, variables)
    body = _substitute(body_tpl, variables)

    return ApplicationEmailDraft(
        subject=subject,
        body=body,
        to_email=to_email,
        candidate_name=candidate_name,
        company_name=company_name,
        job_title=job_title,
        job_url=job_url,
        variables_used=variables,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Gmail API sender
# ──────────────────────────────────────────────────────────────────────────────

async def _send_via_gmail_api(
    access_token: str,
    draft: "ApplicationEmailDraft",
) -> tuple[str, dict]:
    """
    Send the email via the Gmail REST API.

    Returns (message_id, raw_response_dict).
    Raises httpx.HTTPStatusError on API failure.
    """
    msg = MIMEText(draft.body, "plain", "utf-8")
    msg["To"] = draft.to_email
    msg["From"] = "me"
    msg["Subject"] = draft.subject

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            GMAIL_SEND_URL,
            json={"raw": raw},
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("id", ""), data


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _gate_fail(job_id: str, gates: List[GateResult]) -> DispatchResult:
    failed = next((g for g in gates if not g.passed), None)
    logger.warning(
        "🚫 Safety gate %d ('%s') FAILED for job %s: %s",
        failed.gate_number if failed else 0,
        failed.gate_name if failed else "unknown",
        job_id,
        failed.reason if failed else "unknown",
    )
    return DispatchResult(
        success=False,
        application_id=None,
        job_id=job_id,
        gates=gates,
        error=(
            f"Gate {failed.gate_number} '{failed.gate_name}' failed: {failed.reason}"
            if failed else "Unknown gate failure"
        ),
    )
