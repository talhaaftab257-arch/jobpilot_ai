"""Application email generator.

Populates email templates with verified data ONLY — no LLM hallucinations.
Variables come exclusively from:
  - Verified candidate profile (job_profile)
  - Verified job record (from DB, after freshness + score gating)
  - Explicitly verified contact email (from job_contacts)

Template variables supported:
  {{candidate_name}}      — from profiles.full_name
  {{job_title}}           — from jobs.title (as-published, never inferred)
  {{company_name}}        — from jobs.company (as-published)
  {{relevant_skills}}     — intersection of profile skills and job required_skills
  {{job_url}}             — from jobs.source_url (canonical published URL)
  {{region_name}}         — from regions.name

Never fabricate or guess any field.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import List, Optional

from backend.app.db.models import Job, JobContact, JobProfile, Profile, Region

logger = logging.getLogger(__name__)

TEMPLATE_VAR_PATTERN = re.compile(r"\{\{([^}]+)\}\}")


@dataclass
class ApplicationEmailDraft:
    """Immutable email draft ready to send."""
    subject: str
    body: str
    to_email: str
    candidate_name: str
    company_name: str
    job_title: str
    job_url: str
    variables_used: dict  # for audit logging

    def is_complete(self) -> bool:
        """Check all required fields are filled (no unreplaced placeholders)."""
        remaining = TEMPLATE_VAR_PATTERN.findall(self.subject) + TEMPLATE_VAR_PATTERN.findall(self.body)
        return len(remaining) == 0


def _pick_relevant_skills(
    profile_skills: List[str],
    job_skills: List[str],
    max_skills: int = 5,
) -> str:
    """
    Return a comma-separated list of skills that appear in BOTH the profile
    and the job posting.  Alphabetically sorted for determinism.
    Never fabricates — if no overlap, returns a non-empty fallback from profile.
    """
    profile_lower = {s.strip().lower(): s.strip() for s in profile_skills if s.strip()}
    job_lower = {s.strip().lower() for s in job_skills if s.strip()}

    # Case-insensitive intersection, display in original case from profile
    matched = sorted(
        [profile_lower[k] for k in profile_lower if k in job_lower],
        key=lambda s: s.lower()
    )

    if matched:
        return ", ".join(matched[:max_skills])

    # Fallback: top skills from profile (still never fabricated)
    return ", ".join(sorted(list(profile_lower.values()))[:max_skills])


def generate_application_email(
    profile: Profile,
    job_profile: JobProfile,
    job: Job,
    contact: JobContact,
    region: Optional[Region] = None,
) -> ApplicationEmailDraft:
    """
    Generate a complete application email draft using template substitution.

    Steps:
    1. Build the variable map from ONLY verified DB fields.
    2. Substitute into the subject and body templates.
    3. Verify no unreplaced placeholders remain.
    4. Return an ApplicationEmailDraft.

    Raises ValueError if any critical field is missing.
    """
    # ── Guard: required fields ─────────────────────────────────────────────
    if not profile.full_name or not profile.full_name.strip():
        raise ValueError("Cannot generate email: profiles.full_name is empty. Update your profile.")
    if not job.title or not job.title.strip():
        raise ValueError(f"Cannot generate email: job {job.id} has no title.")
    if not job.company or not job.company.strip():
        raise ValueError(f"Cannot generate email: job {job.id} has no company name.")
    if not job.source_url or not job.source_url.strip():
        raise ValueError(f"Cannot generate email: job {job.id} has no source URL.")
    if not contact.email or not contact.email.strip():
        raise ValueError(f"Cannot generate email: contact for job {job.id} has no email.")

    # ── Build variable map ─────────────────────────────────────────────────
    profile_skills: List[str] = job_profile.target_skills or []
    job_skills: List[str] = job.required_skills or []
    relevant_skills = _pick_relevant_skills(profile_skills, job_skills)
    region_name = region.name if region else "International"

    variables = {
        "candidate_name": profile.full_name.strip(),
        "job_title": job.title.strip(),
        "company_name": job.company.strip(),
        "relevant_skills": relevant_skills,
        "job_url": job.source_url.strip(),
        "region_name": region_name,
    }

    logger.debug("Email variable map for job %s: %s", job.id, variables)

    # ── Template substitution ──────────────────────────────────────────────
    subject_tpl = job_profile.email_template_subject or "Application for {{job_title}} - {{candidate_name}}"
    body_tpl = job_profile.email_template_body or _default_body_template()

    subject = _substitute(subject_tpl, variables)
    body = _substitute(body_tpl, variables)

    draft = ApplicationEmailDraft(
        subject=subject,
        body=body,
        to_email=contact.email.strip(),
        candidate_name=profile.full_name.strip(),
        company_name=job.company.strip(),
        job_title=job.title.strip(),
        job_url=job.source_url.strip(),
        variables_used=variables,
    )

    # ── Integrity check ────────────────────────────────────────────────────
    if not draft.is_complete():
        remaining = (
            TEMPLATE_VAR_PATTERN.findall(draft.subject)
            + TEMPLATE_VAR_PATTERN.findall(draft.body)
        )
        raise ValueError(
            f"Email draft for job {job.id} has unresolved template variables: {remaining}. "
            "Add them to your job_profile templates."
        )

    logger.info(
        "Email draft generated for job %s at %s → %s",
        job.id, job.company, contact.email
    )
    return draft


def _substitute(template: str, variables: dict) -> str:
    """Replace {{var}} placeholders with values from the variable map."""
    def replacer(match: re.Match) -> str:
        key = match.group(1).strip()
        if key in variables:
            return str(variables[key])
        # Leave unreplaced so is_complete() catches it
        return match.group(0)

    return TEMPLATE_VAR_PATTERN.sub(replacer, template)


def _default_body_template() -> str:
    return (
        "Dear Hiring Team at {{company_name}},\n\n"
        "I am writing to express my strong interest in the {{job_title}} role. "
        "With solid expertise in {{relevant_skills}}, I am confident in delivering "
        "high impact to your projects.\n\n"
        "You can view the original posting at: {{job_url}}\n\n"
        "Please find my regional CV attached.\n\n"
        "Best regards,\n"
        "{{candidate_name}}"
    )
