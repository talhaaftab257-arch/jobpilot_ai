"""CRM API routes for Talent & Recruitment SaaS (Leads, Pipeline Deals, Activities)."""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import CrmLead, CrmDeal, CrmActivity
from backend.app.schemas.crm_erp import (
    CrmLeadSchema,
    CrmLeadCreateSchema,
    CrmLeadUpdateSchema,
    CrmDealSchema,
    CrmDealCreateSchema,
    CrmDealUpdateSchema,
    CrmActivitySchema,
    CrmActivityCreateSchema
)

router = APIRouter(prefix="/crm", tags=["CRM"])


# ── Leads & Contacts ─────────────────────────────────────────────────────────

@router.get("/leads", response_model=List[CrmLeadSchema])
def list_leads(
    status: Optional[str] = Query(None, description="Filter by status: new, contacted, qualified, unresponsive, closed"),
    search: Optional[str] = Query(None, description="Search by name, company, or email"),
    db: Session = Depends(get_db)
):
    """Retrieve recruitment leads and hiring contacts."""
    query = db.query(CrmLead)
    if status and status != "all":
        query = query.filter(CrmLead.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter((CrmLead.name.ilike(s)) | (CrmLead.company_name.ilike(s)) | (CrmLead.email.ilike(s)))

    leads = query.order_by(CrmLead.created_at.desc()).all()
    if not leads:
        # Provide clean initial mock leads if table is empty
        _seed_initial_crm_data(db)
        leads = query.order_by(CrmLead.created_at.desc()).all()

    return leads


@router.post("/leads", response_model=CrmLeadSchema)
def create_lead(payload: CrmLeadCreateSchema, db: Session = Depends(get_db)):
    """Create a new hiring manager / recruiter contact."""
    lead = CrmLead(
        name=payload.name,
        company_name=payload.company_name,
        role=payload.role,
        email=payload.email,
        phone=payload.phone,
        country_code=payload.country_code,
        status=payload.status,
        source=payload.source,
        notes=payload.notes
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.put("/leads/{lead_id}", response_model=CrmLeadSchema)
def update_lead(lead_id: UUID, payload: CrmLeadUpdateSchema, db: Session = Depends(get_db)):
    """Update lead information or qualification status."""
    lead = db.query(CrmLead).filter(CrmLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, val)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: UUID, db: Session = Depends(get_db)):
    """Remove a contact from CRM database."""
    lead = db.query(CrmLead).filter(CrmLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"status": "success", "message": "Lead deleted successfully"}


# ── Pipeline Deals (Recruitment Kanban Stages) ───────────────────────────────

@router.get("/deals", response_model=List[CrmDealSchema])
def list_deals(
    stage: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve recruitment placement deals across all stages."""
    query = db.query(CrmDeal)
    if stage and stage != "all":
        query = query.filter(CrmDeal.stage == stage)
    if priority and priority != "all":
        query = query.filter(CrmDeal.priority == priority)

    deals = query.order_by(CrmDeal.created_at.desc()).all()
    if not deals:
        _seed_initial_crm_data(db)
        deals = query.order_by(CrmDeal.created_at.desc()).all()

    return deals


@router.post("/deals", response_model=CrmDealSchema)
def create_deal(payload: CrmDealCreateSchema, db: Session = Depends(get_db)):
    """Create a new candidate submission / placement deal."""
    deal = CrmDeal(
        title=payload.title,
        stage=payload.stage,
        deal_value=payload.deal_value,
        currency=payload.currency,
        candidate_name=payload.candidate_name,
        company_name=payload.company_name,
        expected_close_date=payload.expected_close_date,
        priority=payload.priority,
        lead_id=payload.lead_id
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.put("/deals/{deal_id}", response_model=CrmDealSchema)
def update_deal(deal_id: UUID, payload: CrmDealUpdateSchema, db: Session = Depends(get_db)):
    """Update deal properties or drag-and-drop stage change."""
    deal = db.query(CrmDeal).filter(CrmDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(deal, field, val)

    db.commit()
    db.refresh(deal)
    return deal


@router.delete("/deals/{deal_id}")
def delete_deal(deal_id: UUID, db: Session = Depends(get_db)):
    """Remove deal from pipeline."""
    deal = db.query(CrmDeal).filter(CrmDeal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"status": "success", "message": "Deal removed"}


# ── Activities (Calls, Notes, Tasks) ─────────────────────────────────────────

@router.get("/activities", response_model=List[CrmActivitySchema])
def list_activities(
    deal_id: Optional[UUID] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """List activity timeline and touchpoints."""
    query = db.query(CrmActivity)
    if deal_id:
        query = query.filter(CrmActivity.deal_id == deal_id)
    return query.order_by(CrmActivity.created_at.desc()).limit(limit).all()


@router.post("/activities", response_model=CrmActivitySchema)
def create_activity(payload: CrmActivityCreateSchema, db: Session = Depends(get_db)):
    """Log an interaction: call, meeting, interview, or follow-up task."""
    activity = CrmActivity(
        deal_id=payload.deal_id,
        lead_id=payload.lead_id,
        activity_type=payload.activity_type,
        title=payload.title,
        details=payload.details,
        due_date=payload.due_date,
        is_completed=payload.is_completed
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def _seed_initial_crm_data(db: Session):
    """Seed sample CRM contacts and deals for instant turnkey SaaS operation."""
    sample_leads = [
        CrmLead(
            name="Elena Rostova",
            company_name="Synthetix AI Labs (Berlin)",
            role="Head of AI Recruitment",
            email="elena.rostova@synthetix.de",
            phone="+49 30 901820",
            country_code="DE",
            status="qualified",
            source="arbeitnow",
            notes="Interested in senior LangGraph & multi-agent engineers. Fast-track screening."
        ),
        CrmLead(
            name="Tariq Al-Mansoor",
            company_name="Falcon Dynamics (Dubai)",
            role="VP of Engineering & Talent",
            email="t.almansoor@falcondynamics.ae",
            phone="+971 4 362 7000",
            country_code="AE",
            status="contacted",
            source="naukrigulf",
            notes="Discussed GCC visa sponsorship and AI automation pipeline delivery."
        ),
        CrmLead(
            name="Sarah Jenkins",
            company_name="NeuraFlow UK (London)",
            role="Lead Technical Sourcer",
            email="s.jenkins@neuraflow.co.uk",
            phone="+44 20 7946 0912",
            country_code="GB",
            status="new",
            source="linkedin",
            notes="Direct LinkedIn recruiter outreach. High response probability."
        ),
        CrmLead(
            name="Zubair Ahmed",
            company_name="NeuralPath Pakistan (Lahore)",
            role="Chief Technology Officer",
            email="zubair.cto@neuralpath.pk",
            phone="+92 42 3587 9000",
            country_code="PK",
            status="qualified",
            source="rozee_pk",
            notes="Senior AI Engineer vacancy. Technical interview scheduled."
        )
    ]
    for lead in sample_leads:
        db.add(lead)
    db.commit()

    sample_deals = [
        CrmDeal(
            title="Senior Agentic AI Engineer Placement",
            stage="technical_interview",
            deal_value=95000.0,
            currency="EUR",
            candidate_name="Talha Aftab",
            company_name="Synthetix AI Labs (Berlin)",
            priority="high",
            expected_close_date=date(2026, 11, 15)
        ),
        CrmDeal(
            title="Generative AI Solutions Architect",
            stage="screening",
            deal_value=110000.0,
            currency="USD",
            candidate_name="Talha Aftab",
            company_name="Falcon Dynamics (Dubai)",
            priority="high",
            expected_close_date=date(2026, 11, 20)
        ),
        CrmDeal(
            title="Principal AI Automation Consultant",
            stage="offer",
            deal_value=85000.0,
            currency="GBP",
            candidate_name="Talha Aftab",
            company_name="NeuraFlow UK (London)",
            priority="high",
            expected_close_date=date(2026, 11, 5)
        ),
        CrmDeal(
            title="Staff Full-Stack AI Engineer",
            stage="contacted",
            deal_value=3500000.0,
            currency="PKR",
            candidate_name="Talha Aftab",
            company_name="NeuralPath Pakistan (Lahore)",
            priority="medium",
            expected_close_date=date(2026, 11, 30)
        )
    ]
    for deal in sample_deals:
        db.add(deal)
    db.commit()
