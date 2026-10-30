"""End-to-end Job Discovery and Matching Orchestration Pipeline."""
import asyncio
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.collectors.arbeitnow import ArbeitnowCollector
from backend.app.collectors.remoteok import RemoteOKCollector
from backend.app.collectors.jobicy import JobicyCollector
from backend.app.collectors.naukrigulf import NaukriGulfCollector
from backend.app.collectors.linkedin import LinkedInCollector
from backend.app.collectors.indeed import IndeedCollector
from backend.app.collectors.google_jobs import GoogleJobsCollector
from backend.app.collectors.rozee import RozeeCollector
from backend.app.services.matching import evaluate_job_match
from backend.app.services.contacts import extract_verified_contacts
from backend.app.services.resumes import resolve_regional_resume
from backend.app.db.models import Job, JobMatch, JobContact, JobProfile, Region, Profile, AgentRun, Application

logger = logging.getLogger(__name__)


class PipelineRunResult:
    def __init__(self):
        self.jobs_discovered = 0
        self.jobs_eligible = 0
        self.jobs_deduplicated = 0
        self.errors: List[str] = []
        self.eligible_jobs: List[Dict[str, Any]] = []


async def run_discovery_pipeline(db: Session, user_id: str, dry_run: bool = True) -> PipelineRunResult:
    """Executes multi-source collection, normalization, deduplication, 72h filtering, and matching."""
    result = PipelineRunResult()

    # 1. Load User Job Profile & Enabled Regions
    profile = db.query(JobProfile).filter(JobProfile.user_id == user_id).first()
    if not profile:
        profile = db.query(JobProfile).first()
    if not profile:
        result.errors.append("No active job profile found.")
        return result

    # Regions sorted by priority (PK=1, EU=2, ASIA=3, ARAB=4)
    regions = db.query(Region).filter(Region.is_active == True).order_by(Region.priority.asc()).all()
    enabled_region_codes = {r.code for r in regions}

    # 2. Collect from all active source adapters
    collectors: List[BaseCollector] = [
        NaukriGulfCollector(),
        RozeeCollector(),
        ArbeitnowCollector(),
        RemoteOKCollector(),
        JobicyCollector(),
        LinkedInCollector(),
        IndeedCollector(),
        GoogleJobsCollector()
    ]

    all_raw_jobs: List[NormalizedJob] = []
    keywords = profile.target_titles + profile.target_skills

    for collector in collectors:
        try:
            logger.info(f"Running collector: {collector.name}")
            jobs = await collector.fetch_jobs(keywords)
            all_raw_jobs.extend(jobs)
        except Exception as e:
            err = f"Collector '{collector.name}' error: {e}"
            logger.error(err)
            result.errors.append(err)

    result.jobs_discovered = len(all_raw_jobs)

    # 3. Process, Deduplicate, and Filter Listings
    seen_urls = set()
    for raw_job in all_raw_jobs:
        # Canonical URL deduplication
        if raw_job.canonical_url in seen_urls:
            result.jobs_deduplicated += 1
            continue
        seen_urls.add(raw_job.canonical_url)

        # Check existing database persistence
        existing = db.query(Job).filter(Job.canonical_url == raw_job.canonical_url).first()
        if existing:
            result.jobs_deduplicated += 1
            continue

        # Evaluate match score & 72h freshness
        match_result = evaluate_job_match(raw_job, profile)

        # Ensure region is set from location/title when collectors leave it blank
        region_code = raw_job.region_code
        if not region_code:
            from backend.app.collectors.base import BaseCollector
            region_code = BaseCollector.resolve_region(
                raw_job.country_code,
                f"{raw_job.location or ''} {raw_job.title or ''}",
            )

        # Persist new Job record
        job_record = Job(
            canonical_url=raw_job.canonical_url,
            external_id=raw_job.external_id,
            company_name=raw_job.company_name,
            title=raw_job.title,
            location=raw_job.location,
            country_code=raw_job.country_code,
            region_code=region_code,
            description=raw_job.description,
            work_arrangement=raw_job.work_arrangement,
            salary_min=raw_job.salary_min,
            salary_max=raw_job.salary_max,
            salary_currency=raw_job.salary_currency,
            published_at=raw_job.published_at,
            raw_metadata=raw_job.raw_metadata
        )
        db.add(job_record)
        db.flush()

        # Persist JobMatch record
        match_record = JobMatch(
            job_id=job_record.id,
            job_profile_id=profile.id,
            overall_score=match_result.overall_score,
            title_score=match_result.title_score,
            skills_score=match_result.skills_score,
            experience_score=match_result.experience_score,
            location_score=match_result.location_score,
            salary_score=match_result.salary_score,
            freshness_score=match_result.freshness_score,
            is_eligible=match_result.is_eligible,
            disqualification_reason=match_result.disqualification_reason,
            matching_skills=match_result.matching_skills,
            missing_skills=match_result.missing_skills,
            explanation=match_result.explanation
        )
        db.add(match_record)

        # Contact discovery from posting content
        contacts = extract_verified_contacts(raw_job.description, raw_job.canonical_url)
        for c in contacts:
            contact_record = JobContact(
                job_id=job_record.id,
                name=c.name,
                email=c.email,
                role=c.role,
                source_url=c.source_url,
                evidence=c.evidence,
                verification_method=c.verification_method,
                verification_status=c.verification_status,
                verified_at=c.verified_at
            )
            db.add(contact_record)

        if match_result.is_eligible:
            result.jobs_eligible += 1
            result.eligible_jobs.append({
                "job_id": str(job_record.id),
                "title": job_record.title,
                "company": job_record.company_name,
                "score": match_result.overall_score,
                "region": raw_job.region_code
            })

    db.commit()
    return result
