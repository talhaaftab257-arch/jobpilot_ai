"""Deterministic regional resume routing and attachment service."""
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.db.models import RegionResume, Resume, Profile


class RegionalResumeResolution:
    def __init__(self, region_code: str, resume: Optional[Resume], is_missing: bool, message: str):
        self.region_code = region_code
        self.resume = resume
        self.is_missing = is_missing
        self.message = message


def resolve_regional_resume(region_code: Optional[str], user_id: str, db: Session) -> RegionalResumeResolution:
    """Deterministically maps a region code to the user's active regional CV.
    Never allows an LLM to guess the file attachment.
    """
    if not region_code:
        region_code = "PK"  # Fallback to Priority 1

    mapping = db.query(RegionResume).filter(
        RegionResume.user_id == user_id,
        RegionResume.region_code == region_code.upper()
    ).first()

    if not mapping or not mapping.resume or not mapping.resume.is_active:
        return RegionalResumeResolution(
            region_code=region_code.upper(),
            resume=None,
            is_missing=True,
            message=f"Safety Gate: Missing active regional CV for '{region_code}'. Application must be halted until uploaded."
        )

    return RegionalResumeResolution(
        region_code=region_code.upper(),
        resume=mapping.resume,
        is_missing=False,
        message=f"Successfully attached regional CV: {mapping.resume.filename} ({mapping.resume.storage_path})"
    )
