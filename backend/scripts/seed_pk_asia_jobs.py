"""Fetch Pakistan (Rozee) + ensure Asia-tagged jobs exist; persist into DB."""
import asyncio
from datetime import datetime, timezone
from backend.app.db.session import SessionLocal
from backend.app.db.models import Job, JobSource, JobMatch, JobProfile
from backend.app.collectors.rozee import RozeeCollector
from backend.app.collectors.base import BaseCollector
from backend.app.services.matching import evaluate_job_match


async def run():
    db = SessionLocal()
    try:
        profile = db.query(JobProfile).first()
        keywords = (profile.target_titles + profile.target_skills) if profile else ["AI Engineer", "Python"]

        source = db.query(JobSource).filter(JobSource.name == "rozee_pk").first()
        if not source:
            source = JobSource(
                name="rozee_pk",
                adapter_type="browser",
                is_active=True,
                rate_limit_per_minute=15,
                config={"base_url": "https://www.rozee.pk"},
            )
            db.add(source)
            db.flush()

        collector = RozeeCollector()
        raw_jobs = await collector.fetch_jobs(keywords)
        print(f"Rozee fetched: {len(raw_jobs)}")

        inserted = 0
        for raw in raw_jobs:
            existing = db.query(Job).filter(Job.canonical_url == raw.canonical_url).first()
            if existing:
                existing.region_code = "PK"
                existing.country_code = existing.country_code or "PK"
                if existing.location and "pakistan" not in existing.location.lower():
                    existing.location = f"{existing.location}, Pakistan"
                continue

            title = (raw.title or "").strip() or "Pakistan Tech Role"
            job = Job(
                source_id=source.id,
                external_id=raw.external_id,
                canonical_url=raw.canonical_url,
                company_name=raw.company_name or "Pakistan Employer",
                title=title[:255],
                location=raw.location or "Pakistan",
                country_code="PK",
                region_code="PK",
                description=raw.description or title,
                work_arrangement=raw.work_arrangement,
                published_at=raw.published_at or datetime.now(timezone.utc),
                raw_metadata=raw.raw_metadata or {},
            )
            db.add(job)
            db.flush()
            inserted += 1

            if profile:
                match_result = evaluate_job_match(raw, profile)
                db.add(
                    JobMatch(
                        job_id=job.id,
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
                        explanation=match_result.explanation,
                    )
                )

        # Re-tag Asia/EU with fixed word-boundary resolver (location+title only)
        retagged = 0
        for j in db.query(Job).all():
            text = f"{j.location or ''} {j.title or ''}"
            resolved = BaseCollector.resolve_region(j.country_code, text)
            # Keep explicit PK from Rozee / country
            if j.country_code == "PK" or (j.region_code == "PK" and j.source_id == source.id):
                resolved = "PK"
            if resolved != j.region_code:
                j.region_code = resolved
                retagged += 1

        db.commit()

        from collections import Counter
        counts = Counter((j.region_code or "null") for j in db.query(Job).all())
        print(f"inserted={inserted} retagged={retagged}")
        print("region counts:", dict(counts))
        print("PK:")
        for j in db.query(Job).filter(Job.region_code == "PK").limit(10):
            print(" -", j.title[:60], "|", j.location)
        print("ASIA:")
        for j in db.query(Job).filter(Job.region_code == "ASIA").limit(10):
            print(" -", j.title[:60], "|", j.location)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(run())
