"""Workspaces and Team Management API routes for Multi-Tenant ERP."""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import Organization, WorkspaceMember
from backend.app.schemas.crm_erp import (
    OrganizationSchema,
    WorkspaceMemberSchema,
    WorkspaceMemberCreateSchema
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Team ERP"])


@router.get("/current", response_model=dict)
def get_current_workspace(db: Session = Depends(get_db)):
    """Retrieve the primary workspace profile and team capacity."""
    org = db.query(Organization).first()
    if not org:
        org = Organization(
            name="Talha Aftab Talent & Tech Labs",
            slug="talha-tech-labs",
            owner_id=UUID("00000000-0000-0000-0000-000000000001"),
            current_plan_id="pro"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    members_count = db.query(WorkspaceMember).filter(WorkspaceMember.organization_id == org.id).count()

    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "current_plan_id": org.current_plan_id,
        "total_members": max(1, members_count),
        "max_seats": 3,
        "created_at": org.created_at.isoformat()
    }


@router.get("/members", response_model=List[WorkspaceMemberSchema])
def list_workspace_members(db: Session = Depends(get_db)):
    """List all team recruiters, admins, and members in current workspace."""
    org = db.query(Organization).first()
    if not org:
        return []

    members = db.query(WorkspaceMember).filter(WorkspaceMember.organization_id == org.id).all()
    if not members:
        # Seed owner
        owner = WorkspaceMember(
            organization_id=org.id,
            name="Talha Aftab",
            email="talha.aftab@example.com",
            role="owner",
            status="active"
        )
        db.add(owner)
        db.commit()
        members = [owner]

    return members


@router.post("/members", response_model=WorkspaceMemberSchema)
def invite_workspace_member(payload: WorkspaceMemberCreateSchema, db: Session = Depends(get_db)):
    """Invite a new recruiter or team manager to the workspace."""
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=400, detail="Organization not found")

    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.organization_id == org.id,
        WorkspaceMember.email == payload.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team member with this email already exists")

    new_member = WorkspaceMember(
        organization_id=org.id,
        name=payload.name,
        email=payload.email,
        role=payload.role,
        status="active"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@router.delete("/members/{member_id}")
def remove_workspace_member(member_id: UUID, db: Session = Depends(get_db)):
    """Remove a team seat or revoke recruiter access."""
    member = db.query(WorkspaceMember).filter(WorkspaceMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove workspace owner")

    db.delete(member)
    db.commit()
    return {"status": "success", "message": "Team member access revoked"}
