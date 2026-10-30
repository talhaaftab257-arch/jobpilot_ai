"""Pydantic v2 schemas for CRM, ERP, and Subscription SaaS modules."""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ── Subscription Plans & Billing Schemas ─────────────────────────────────────

class SubscriptionPlanSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: float
    max_applications_per_day: int
    max_team_seats: int
    max_scrapes_per_day: int
    features: List[str] = []
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class OrganizationSchema(BaseModel):
    id: UUID
    name: str
    slug: str
    owner_id: UUID
    current_plan_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceMemberSchema(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: Optional[UUID] = None
    name: str
    email: str
    role: str
    status: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceMemberCreateSchema(BaseModel):
    name: str
    email: EmailStr
    role: str = "recruiter"


class UserSubscriptionSchema(BaseModel):
    id: UUID
    organization_id: UUID
    plan_id: str
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    cancel_at_period_end: bool = False

    model_config = ConfigDict(from_attributes=True)


class UpgradeSubscriptionSchema(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"  # "monthly" or "yearly"
    payment_method_id: Optional[str] = None


class InvoiceSchema(BaseModel):
    id: UUID
    organization_id: UUID
    invoice_number: str
    amount: float
    currency: str
    status: str
    plan_name: str
    billing_period: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── CRM Leads, Deals & Pipeline Schemas ──────────────────────────────────────

class CrmLeadSchema(BaseModel):
    id: UUID
    organization_id: Optional[UUID] = None
    name: str
    company_name: str
    role: Optional[str] = None
    email: str
    phone: Optional[str] = None
    country_code: Optional[str] = None
    status: str
    source: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CrmLeadCreateSchema(BaseModel):
    name: str
    company_name: str
    role: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    country_code: Optional[str] = None
    status: str = "new"
    source: str = "ai_discovery"
    notes: Optional[str] = None


class CrmLeadUpdateSchema(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country_code: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CrmDealSchema(BaseModel):
    id: UUID
    organization_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    title: str
    stage: str
    deal_value: float
    currency: str
    candidate_name: str
    company_name: str
    expected_close_date: Optional[date] = None
    priority: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CrmDealCreateSchema(BaseModel):
    title: str
    stage: str = "screening"
    deal_value: float = 0.0
    currency: str = "USD"
    candidate_name: str = "Talha Aftab"
    company_name: str
    expected_close_date: Optional[date] = None
    priority: str = "medium"
    lead_id: Optional[UUID] = None


class CrmDealUpdateSchema(BaseModel):
    stage: Optional[str] = None
    deal_value: Optional[float] = None
    priority: Optional[str] = None
    expected_close_date: Optional[date] = None
    title: Optional[str] = None


class CrmActivitySchema(BaseModel):
    id: UUID
    organization_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    activity_type: str
    title: str
    details: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CrmActivityCreateSchema(BaseModel):
    deal_id: Optional[UUID] = None
    lead_id: Optional[UUID] = None
    activity_type: str = "note"
    title: str
    details: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool = False
