"""Automated testing suite for Phase 3: Collectors, Normalization, Freshness, Scoring, and Contacts."""
from datetime import datetime, timedelta, timezone
import pytest
from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.services.matching import evaluate_job_match
from backend.app.services.contacts import extract_verified_contacts
from backend.app.services.resumes import resolve_regional_resume
from backend.app.db.models import JobProfile, Profile, Resume, RegionResume
from backend.app.db.session import SessionLocal


def test_url_normalization_and_deduplication():
    """Verify that tracking query parameters (utm_*, ref, etc.) are stripped cleanly for deduplication."""
    dirty_url = "https://careers.example.com/jobs/ai-engineer?utm_source=linkedin&utm_medium=feed&ref=jobboard"
    clean_url = BaseCollector.normalize_url(dirty_url)
    assert clean_url == "https://careers.example.com/jobs/ai-engineer"

    trailing_slash_url = "https://example.com/jobs/123/?"
    assert BaseCollector.normalize_url(trailing_slash_url) == "https://example.com/jobs/123"


def test_region_resolution():
    """Verify that country codes and keywords resolve deterministically to PK, EU, ASIA, and ARAB."""
    assert BaseCollector.resolve_region("PK", "") == "PK"
    assert BaseCollector.resolve_region("DE", "") == "EU"
    assert BaseCollector.resolve_region("SG", "") == "ASIA"
    assert BaseCollector.resolve_region("AE", "") == "ARAB"

    # Text fallback
    assert BaseCollector.resolve_region(None, "Remote position based in Berlin, Germany") == "EU"
    assert BaseCollector.resolve_region(None, "Exciting opportunity in Lahore, Pakistan") == "PK"
    assert BaseCollector.resolve_region(None, "Riyadh, Saudi Arabia office") == "ARAB"


def test_72_hour_freshness_filter():
    """Verify that listings older than 72 hours are disqualified from automated processing."""
    profile = JobProfile(
        target_titles=["AI Engineer"],
        target_skills=["Python", "FastAPI"],
        max_job_age_hours=72,
        min_match_score=75
    )

    now = datetime.now(timezone.utc)

    # 1. Fresh job (24h old)
    fresh_job = NormalizedJob(
        canonical_url="https://example.com/fresh-job",
        company_name="AI Labs",
        title="AI Engineer",
        description="We need an AI Engineer proficient in Python and FastAPI.",
        published_at=now - timedelta(hours=24),
        source_name="test"
    )
    res_fresh = evaluate_job_match(fresh_job, profile)
    assert res_fresh.freshness_score >= 8.0
    assert res_fresh.is_eligible is True

    # 2. Expired job (80h old)
    stale_job = NormalizedJob(
        canonical_url="https://example.com/stale-job",
        company_name="AI Labs",
        title="AI Engineer",
        description="We need an AI Engineer proficient in Python and FastAPI.",
        published_at=now - timedelta(hours=80),
        source_name="test"
    )
    res_stale = evaluate_job_match(stale_job, profile)
    assert res_stale.freshness_score == 0.0
    assert res_stale.is_eligible is False
    assert "exceeds freshness limit" in res_stale.disqualification_reason


def test_match_score_calculation():
    """Verify 100-point score dimensions: Title, Skills, Seniority, Location, Salary, Freshness."""
    profile = JobProfile(
        target_titles=["Agentic AI Engineer", "LLM Engineer"],
        target_skills=["Python", "LangGraph", "FastAPI", "Vector Databases"],
        min_experience_years=2,
        work_arrangements=["remote"],
        max_job_age_hours=72,
        min_match_score=75
    )

    now = datetime.now(timezone.utc)
    strong_job = NormalizedJob(
        canonical_url="https://example.com/strong-job",
        company_name="Synthetix Labs",
        title="Senior Agentic AI Engineer",
        description="Looking for an Agentic AI Engineer with deep Python, LangGraph, FastAPI, and Vector Databases experience.",
        work_arrangement="remote",
        published_at=now - timedelta(hours=10),
        source_name="test"
    )

    match = evaluate_job_match(strong_job, profile)
    assert match.overall_score >= 80.0
    assert match.title_score == 25.0
    assert match.skills_score >= 25.0
    assert match.is_eligible is True
    assert "Langgraph" in match.matching_skills or "LangGraph" in [s.title() for s in match.matching_skills]


def test_contact_verification_no_hallucinations():
    """Verify that contacts are only extracted if explicitly published in text, rejecting guessed emails."""
    text_with_recruiter = "Please send your CV and portfolio to careers@synthetix.de. Our hiring team reviews all submissions."
    contacts = extract_verified_contacts(text_with_recruiter, "https://synthetix.de/job/1")
    assert len(contacts) == 1
    assert contacts[0].email == "careers@synthetix.de"
    assert contacts[0].verification_status == "verified"

    # Ignored system emails (e.g. noreply@...)
    text_with_noreply = "Notifications are sent from noreply@synthetix.de. Do not reply to this email."
    no_contacts = extract_verified_contacts(text_with_noreply, "https://synthetix.de/job/2")
    assert len(no_contacts) == 0


def test_deterministic_regional_resume_missing_gate():
    """Verify that an application is halted if the specific regional resume is missing."""
    db = SessionLocal()
    try:
        user = db.query(Profile).first()
        if not user:
            user = Profile(full_name="Muhammad Ali", email="ali@example.com")
            db.add(user)
            db.commit()

        # Check for unmapped region to verify safety gate
        resolution = resolve_regional_resume("NON_EXISTENT_REGION", str(user.id), db)
        assert resolution.is_missing is True
        assert "Missing active regional CV" in resolution.message
    finally:
        db.close()
