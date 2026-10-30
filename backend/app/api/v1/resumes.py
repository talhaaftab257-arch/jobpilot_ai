import hashlib
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import Resume, RegionResume, Profile, Region
from backend.app.schemas.domain import ResumeSchema

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get("", response_model=List[ResumeSchema])
def list_resumes(db: Session = Depends(get_db)):
    """List all resumes uploaded by the current user."""
    resumes = db.query(Resume).filter(Resume.is_active == True).order_by(Resume.created_at.desc()).all()
    return resumes


@router.post("", response_model=ResumeSchema)
async def upload_resume(
    file: UploadFile = File(...),
    region_code: str = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a new regional PDF CV and optionally assign it directly to a region."""
    # Ensure PDF format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    file_size = len(content)
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB")

    # Compute checksum
    checksum = hashlib.sha256(content).hexdigest()

    user = db.query(Profile).first()
    if not user:
        user = Profile(full_name="Default Candidate", email="candidate@example.com")
        db.add(user)
        db.flush()

    storage_path = f"{user.id}/{region_code or 'general'}/{file.filename}"

    resume = Resume(
        user_id=user.id,
        filename=file.filename,
        storage_path=storage_path,
        file_size_bytes=file_size,
        mime_type="application/pdf",
        checksum_sha256=checksum,
        is_active=True,
        skills_extracted=["Python", "FastAPI", "AI Agents", "LLMs", "RAG"]
    )
    db.add(resume)
    db.flush()

    # If region_code is provided, map it immediately
    if region_code:
        reg_code = region_code.upper()
        reg = db.query(Region).filter(Region.code == reg_code).first()
        if reg:
            mapping = db.query(RegionResume).filter(
                RegionResume.user_id == user.id,
                RegionResume.region_code == reg_code
            ).first()
            if mapping:
                mapping.resume_id = resume.id
            else:
                mapping = RegionResume(
                    user_id=user.id,
                    region_code=reg_code,
                    resume_id=resume.id
                )
                db.add(mapping)

    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/{id}")
def delete_resume(id: UUID, db: Session = Depends(get_db)):
    """Safely archive/delete a resume."""
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Check if assigned to any region
    mappings = db.query(RegionResume).filter(RegionResume.resume_id == id).all()
    if mappings:
        regions_assigned = [m.region_code for m in mappings]
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete resume while assigned to regions: {', '.join(regions_assigned)}. Unassign first."
        )

    resume.is_active = False
    db.commit()
    return {"status": "success", "message": f"Resume '{resume.filename}' archived successfully"}
