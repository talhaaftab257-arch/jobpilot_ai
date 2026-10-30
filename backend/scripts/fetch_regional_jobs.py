"""One-shot: pull Pakistan + Asia jobs from LinkedIn/Indeed location searches into DB."""
import asyncio
from collections import Counter
from datetime import datetime, timezone

from backend.app.db.session import SessionLocal
from backend.app.db.models import Job, JobSource, JobMatch, JobProfile
from backend.app.collectors.linkedin import LinkedInCollector
from backend.app.collectors.indeed import IndeedCollector
from backend.app.collectors.base import BaseCollector
from backend.app.services.matching import evaluate_job_match


async def persist(db, raw_jobs, profile):
    inserted = 0
    for raw in raw_jobs:
        existing = db.query(Job).filter(Job.canonical_url == raw.canonical_url).first()
        if existing:
            # Strengthen region if we have a better forced tag
            text = f"{raw.location or ''} {raw.title or ''}"
            resolved = raw.region_code or BaseCollector.resolve_region(raw.country_code, text)
            if resolved and existing.region_code != resolved:
                existing.region_code = resolved
                existing.country_code = existing.country_code or raw.country_code
            continue

        title = (raw.title or "").strip()
        if not title:
            continue

        source = db.query(JobSource).filter(JobSource.name == raw.source_name).first()
        if not source:
            source = JobSource(
                name=raw.source_name or "external_feed",
                adapter_type="browser",
                is_active=True,
            )
            db.add(source)
            db.flush()

        job = Job(
            source_id=source.id,
            external_id=raw.external_id,
            canonical_url=raw.canonical_url,
            company_name=(raw.company_name or "Unknown")[:255],
            title=title[:255],
            location=raw.location,
            country_code=raw.country_code,
            region_code=raw.region_code
            or BaseCollector.resolve_region(raw.country_code, f"{raw.location or ''} {title}"),
            description=raw.description or title,
            work_arrangement=raw.work_arrangement,
            published_at=raw.published_at or datetime.now(timezone.utc),
            raw_metadata=raw.raw_metadata or {},
        )
        db.add(job)
        db.flush()
        inserted += 1

        if profile:
            m = evaluate_job_match(raw, profile)
            db.add(
                JobMatch(
                    job_id=job.id,
                    job_profile_id=profile.id,
                    overall_score=m.overall_score,
                    title_score=m.title_score,
                    skills_score=m.skills_score,
                    experience_score=m.experience_score,
                    location_score=m.location_score,
                    salary_score=m.salary_score,
                    freshness_score=m.freshness_score,
                    is_eligible=m.is_eligible,
                    disqualification_reason=m.disqualification_reason,
                    matching_skills=m.matching_skills,
                    missing_skills=m.missing_skills,
                    explanation=m.explanation,
                )
            )
    return inserted


async def main():
    db = SessionLocal()
    try:
        profile = db.query(JobProfile).first()
        keywords = (profile.target_titles[:2] if profile and profile.target_titles else ["AI Engineer", "Python"])

        print("Fetching LinkedIn (incl. Pakistan / Asia locations)...")
        linkedin_jobs = await LinkedInCollector().fetch_jobs(keywords)
        print(f"  LinkedIn raw: {len(linkedin_jobs)}")

        print("Fetching Indeed (pk.indeed.com + Singapore)...")
        indeed_jobs = await IndeedCollector().fetch_jobs(keywords)
        print(f"  Indeed raw: {len(indeed_jobs)}")

        all_jobs = linkedin_jobs + indeed_jobs
        by_region = Counter((j.region_code or "null") for j in all_jobs)
        print("  fetched by region:", dict(by_region))

        inserted = await persist(db, all_jobs, profile)
        db.commit()

        counts = Counter((j.region_code or "null") for j in db.query(Job).all())
        print(f"inserted={inserted}")
        print("DB region counts:", dict(counts))
        print("PK samples:")
        for j in db.query(Job).filter(Job.region_code == "PK").order_by(Job.published_at.desc()).limit(8):
            print(" -", j.title[:60], "|", j.location)
        print("ASIA samples:")
        for j in db.query(Job).filter(Job.region_code == "ASIA").order_by(Job.published_at.desc()).limit(8):
            print(" -", j.title[:60], "|", j.location)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
