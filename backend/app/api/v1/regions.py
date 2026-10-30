from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import Region, Country, RegionResume, Resume, Profile
from backend.app.schemas.domain import RegionSchema, RegionUpdateSchema, RegionResumeAssignSchema

router = APIRouter(prefix="/regions", tags=["Regions"])


@router.get("", response_model=List[RegionSchema])
def list_regions(db: Session = Depends(get_db)):
    """List all regions sorted by priority with countries and active resumes."""
    regions = db.query(Region).order_by(Region.priority.asc()).all()
    user = db.query(Profile).first()

    result = []
    for reg in regions:
        # Fetch active resume mapping
        active_resume = None
        if user:
            mapping = db.query(RegionResume).filter(
                RegionResume.user_id == user.id,
                RegionResume.region_code == reg.code
            ).first()
            if mapping and mapping.resume:
                active_resume = mapping.resume

        countries = db.query(Country).filter(Country.region_code == reg.code).all()

        result.append(RegionSchema(
            code=reg.code,
            name=reg.name,
            priority=reg.priority,
            is_active=reg.is_active,
            countries=countries,
            active_resume_filename=active_resume.filename if active_resume else None,
            active_resume_id=active_resume.id if active_resume else None
        ))

    return result


@router.put("/{code}", response_model=RegionSchema)
def update_region(code: str, payload: RegionUpdateSchema, db: Session = Depends(get_db)):
    """Update region active status or priority."""
    reg = db.query(Region).filter(Region.code == code.upper()).first()
    if not reg:
        raise HTTPException(status_code=404, detail=f"Region '{code}' not found")

    if payload.is_active is not None:
        reg.is_active = payload.is_active
    if payload.priority is not None:
        reg.priority = payload.priority

    db.commit()
    db.refresh(reg)

    countries = db.query(Country).filter(Country.region_code == reg.code).all()
    return RegionSchema(
        code=reg.code,
        name=reg.name,
        priority=reg.priority,
        is_active=reg.is_active,
        countries=countries
    )


@router.put("/{code}/resume")
def assign_regional_resume(code: str, payload: RegionResumeAssignSchema, db: Session = Depends(get_db)):
    """Assign or update the deterministic resume assigned to a regional slot."""
    code_upper = code.upper()
    reg = db.query(Region).filter(Region.code == code_upper).first()
    if not reg:
        raise HTTPException(status_code=404, detail=f"Region '{code}' not found")

    resume = db.query(Resume).filter(Resume.id == payload.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail=f"Resume '{payload.resume_id}' not found")

    user = db.query(Profile).first()
    if not user:
        raise HTTPException(status_code=400, detail="User profile not initialized")

    mapping = db.query(RegionResume).filter(
        RegionResume.user_id == user.id,
        RegionResume.region_code == code_upper
    ).first()

    if mapping:
        mapping.resume_id = resume.id
        mapping.notes = payload.notes
    else:
        mapping = RegionResume(
            user_id=user.id,
            region_code=code_upper,
            resume_id=resume.id,
            notes=payload.notes
        )
        db.add(mapping)

    db.commit()
    return {
        "status": "success",
        "region_code": code_upper,
        "resume_id": str(resume.id),
        "filename": resume.filename
    }
