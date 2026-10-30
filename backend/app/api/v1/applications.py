from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import Application, ApplicationEvent, Job, Profile
from backend.app.schemas.domain import ApplicationSchema

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationSchema])
def list_applications(
    status: Optional[str] = Query(None, description="Filter by status: e.g. queued, sent, failed, needs_manual_action"),
    channel: Optional[str] = Query(None, description="Filter by channel: email, portal, manual"),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """List applications with current lifecycle status and timeline."""
    query = db.query(Application)

    if status:
        query = query.filter(Application.status == status.lower())
    if channel:
        query = query.filter(Application.channel == channel.lower())

    apps = query.order_by(Application.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for a in apps:
        job = a.job
        result.append(ApplicationSchema(
            id=a.id,
            job_id=a.job_id,
            job_title=job.title if job else "Unknown Position",
            company_name=job.company_name if job else "Unknown Employer",
            region_code=job.region_code if job else None,
            status=a.status,
            channel=a.channel,
            email_subject=a.email_subject,
            email_body=a.email_body,
            sent_at=a.sent_at,
            error_message=a.error_message,
            retry_count=a.retry_count,
            created_at=a.created_at
        ))
    return result


@router.get("/{id}", response_model=ApplicationSchema)
def get_application_detail(id: UUID, db: Session = Depends(get_db)):
    """Fetch single application with generated email and event audit trail."""
    a = db.query(Application).filter(Application.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found")

    job = a.job
    return ApplicationSchema(
        id=a.id,
        job_id=a.job_id,
        job_title=job.title if job else "Unknown Position",
        company_name=job.company_name if job else "Unknown Employer",
        region_code=job.region_code if job else None,
        status=a.status,
        channel=a.channel,
        email_subject=a.email_subject,
        email_body=a.email_body,
        sent_at=a.sent_at,
        error_message=a.error_message,
        retry_count=a.retry_count,
        created_at=a.created_at
    )


@router.post("/{id}/retry")
def retry_application(id: UUID, db: Session = Depends(get_db)):
    """Safely reset and retry a failed or queued application."""
    a = db.query(Application).filter(Application.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found")

    if a.status not in ["failed", "needs_manual_action"]:
        raise HTTPException(status_code=400, detail=f"Cannot retry application in '{a.status}' status")

    previous_status = a.status
    a.status = "queued"
    a.retry_count += 1
    a.error_message = None

    # Record audit event
    event = ApplicationEvent(
        application_id=a.id,
        event_type="retry_requested",
        from_status=previous_status,
        to_status="queued",
        details={"retry_number": a.retry_count}
    )
    db.add(event)
    db.commit()
    db.refresh(a)

    return {"status": "success", "message": "Application requeued for sending", "application_id": str(a.id)}
