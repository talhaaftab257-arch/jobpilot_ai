from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import Job, JobMatch, JobContact, JobProfile
from backend.app.schemas.domain import JobSchema, JobMatchSchema, JobContactSchema

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobSchema])
def list_jobs(
    region: Optional[str] = Query(None, description="Filter by region code: PK, EU, ASIA, ARAB"),
    region_code: Optional[str] = Query(None, description="Alias for region"),
    country: Optional[str] = Query(None, description="Filter by country code: e.g. DE, PK, SG"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum match score threshold"),
    max_age_hours: Optional[int] = Query(
        None,
        description="Maximum posting age in hours. Omit or 0 = no freshness filter (show all stored jobs).",
    ),
    search: Optional[str] = Query(None, description="Search keyword in title or company"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Retrieve discovered and qualified jobs with filtering by region, score, and freshness."""
    query = db.query(Job)

    region_filter = (region or region_code or "").strip().upper() or None
    if region_filter:
        query = query.filter(Job.region_code == region_filter)
    if country:
        query = query.filter(Job.country_code == country.upper())
    if search:
        search_filter = f"%{search}%"
        query = query.filter((Job.title.ilike(search_filter)) | (Job.company_name.ilike(search_filter)))

    # Only apply freshness when explicitly requested (> 0). UI needs PK/ASIA jobs that
    # may be older than the discovery pipeline's 72h intake window.
    if max_age_hours is not None and max_age_hours > 0:
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        query = query.filter(Job.published_at >= cutoff)

    jobs = query.order_by(Job.published_at.desc()).offset(offset).limit(limit).all()

    result = []
    for j in jobs:
        match = db.query(JobMatch).filter(JobMatch.job_id == j.id).first()
        if min_score is not None and match and match.overall_score < min_score:
            continue

        contacts = db.query(JobContact).filter(JobContact.job_id == j.id).all()

        match_schema = None
        if match:
            match_schema = JobMatchSchema(
                overall_score=float(match.overall_score),
                title_score=float(match.title_score),
                skills_score=float(match.skills_score),
                experience_score=float(match.experience_score),
                location_score=float(match.location_score),
                salary_score=float(match.salary_score),
                freshness_score=float(match.freshness_score),
                is_eligible=match.is_eligible,
                disqualification_reason=match.disqualification_reason,
                matching_skills=match.matching_skills or [],
                missing_skills=match.missing_skills or [],
                explanation=match.explanation
            )

        contact_schemas = [
            JobContactSchema(
                id=c.id,
                name=c.name,
                email=c.email,
                role=c.role,
                verification_status=c.verification_status,
                verification_method=c.verification_method
            ) for c in contacts
        ]

        result.append(JobSchema(
            id=j.id,
            canonical_url=j.canonical_url,
            company_name=j.company_name,
            title=j.title,
            location=j.location,
            country_code=j.country_code,
            region_code=j.region_code,
            description=j.description,
            work_arrangement=j.work_arrangement,
            salary_min=float(j.salary_min) if j.salary_min else None,
            salary_max=float(j.salary_max) if j.salary_max else None,
            salary_currency=j.salary_currency,
            published_at=j.published_at,
            source_name=j.source.name if j.source else "external_feed",
            match=match_schema,
            contacts=contact_schemas
        ))

    return result


import csv
from io import StringIO
from fastapi.responses import Response


@router.get("/export/excel")
@router.get("/export/csv")
def export_jobs_spreadsheet(
    region: Optional[str] = Query(None, description="Filter by region code: PK, EU, ASIA, ARAB"),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    db: Session = Depends(get_db)
):
    """Export qualified jobs as a CSV spreadsheet compatible with Microsoft Excel and Google Sheets."""
    query = db.query(Job)
    if region:
        query = query.filter(Job.region_code == region.upper())
    jobs = query.order_by(Job.published_at.desc()).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Job Title", "Company Name", "Location", "Country Code",
        "Work Arrangement", "Salary Range", "Match Score", "Source", "URL", "Published At"
    ])

    for j in jobs:
        match = db.query(JobMatch).filter(JobMatch.job_id == j.id).first()
        score = match.overall_score if match else 80
        if min_score is not None and score < min_score:
            continue
        salary = f"{j.salary_min or ''} - {j.salary_max or ''} {j.salary_currency or ''}".strip()
        writer.writerow([
            j.title, j.company_name, j.location or "Remote",
            j.country_code or j.region_code or "GLOBAL",
            j.work_arrangement or "onsite", salary or "Not Specified",
            f"{score}%", j.source.name if j.source else "Feed",
            j.canonical_url, str(j.published_at)
        ])

    csv_data = "\ufeff" + output.getvalue()
    filename = f"JobPilot_Jobs_Export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{id}", response_model=JobSchema)
def get_job_detail(id: UUID, db: Session = Depends(get_db)):
    """Fetch individual job details with matching breakdown and verified contacts."""
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    match = db.query(JobMatch).filter(JobMatch.job_id == job.id).first()
    contacts = db.query(JobContact).filter(JobContact.job_id == job.id).all()

    match_schema = None
    if match:
        match_schema = JobMatchSchema(
            overall_score=float(match.overall_score),
            title_score=float(match.title_score),
            skills_score=float(match.skills_score),
            experience_score=float(match.experience_score),
            location_score=float(match.location_score),
            salary_score=float(match.salary_score),
            freshness_score=float(match.freshness_score),
            is_eligible=match.is_eligible,
            disqualification_reason=match.disqualification_reason,
            matching_skills=match.matching_skills or [],
            missing_skills=match.missing_skills or [],
            explanation=match.explanation
        )

    return JobSchema(
        id=job.id,
        canonical_url=job.canonical_url,
        company_name=job.company_name,
        title=job.title,
        location=job.location,
        country_code=job.country_code,
        region_code=job.region_code,
        description=job.description,
        work_arrangement=job.work_arrangement,
        salary_min=float(job.salary_min) if job.salary_min else None,
        salary_max=float(job.salary_max) if job.salary_max else None,
        salary_currency=job.salary_currency,
        published_at=job.published_at,
        source_name=job.source.name if job.source else "external_feed",
        match=match_schema,
        contacts=[
            JobContactSchema(
                id=c.id,
                name=c.name,
                email=c.email,
                role=c.role,
                verification_status=c.verification_status,
                verification_method=c.verification_method
            ) for c in contacts
        ]
    )
