"""Pydantic v2 schemas for request and response models."""
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Health Check
class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    database: str
    emergency_paused: bool
    dry_run_mode: bool


# Region & Country Schemas
class CountrySchema(BaseModel):
    code: str
    region_code: str
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class RegionSchema(BaseModel):
    code: str
    name: str
    priority: int
    is_active: bool
    countries: List[CountrySchema] = []
    active_resume_filename: Optional[str] = None
    active_resume_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class RegionUpdateSchema(BaseModel):
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class RegionResumeAssignSchema(BaseModel):
    resume_id: UUID
    notes: Optional[str] = None


# Job Profile / Config Schemas
class JobProfileConfigSchema(BaseModel):
    target_titles: List[str]
    target_skills: List[str]
    min_experience_years: int = 0
    work_arrangements: List[str] = ["remote", "hybrid"]
    min_salary: Optional[float] = None
    salary_currency: str = "USD"
    min_match_score: int = Field(default=75, ge=0, le=100)
    max_job_age_hours: int = 72
    global_daily_cap: int = Field(default=30, ge=1, le=100)
    email_automation_mode: str = Field(default="approval", pattern="^(automatic|approval|manual)$")
    is_emergency_paused: bool = False
    is_dry_run_mode: bool = True
    email_template_subject: str
    email_template_body: str

    model_config = ConfigDict(from_attributes=True)


class JobProfileConfigUpdateSchema(BaseModel):
    target_titles: Optional[List[str]] = None
    target_skills: Optional[List[str]] = None
    min_experience_years: Optional[int] = None
    work_arrangements: Optional[List[str]] = None
    min_salary: Optional[float] = None
    salary_currency: Optional[str] = None
    min_match_score: Optional[int] = Field(default=None, ge=0, le=100)
    max_job_age_hours: Optional[int] = None
    global_daily_cap: Optional[int] = Field(default=None, ge=1, le=100)
    email_automation_mode: Optional[str] = Field(default=None, pattern="^(automatic|approval|manual)$")
    is_emergency_paused: Optional[bool] = None
    is_dry_run_mode: Optional[bool] = None
    email_template_subject: Optional[str] = None
    email_template_body: Optional[str] = None


# Resume Schemas
class ResumeSchema(BaseModel):
    id: UUID
    filename: str
    storage_path: str
    file_size_bytes: int
    mime_type: str
    version: int
    is_active: bool
    created_at: datetime
    skills_extracted: List[str] = []

    model_config = ConfigDict(from_attributes=True)


# Job Contact & Match Schemas
class JobContactSchema(BaseModel):
    id: UUID
    name: Optional[str] = None
    email: str
    role: Optional[str] = None
    verification_status: str
    verification_method: str

    model_config = ConfigDict(from_attributes=True)


class JobMatchSchema(BaseModel):
    overall_score: float
    title_score: float
    skills_score: float
    experience_score: float
    location_score: float
    salary_score: float
    freshness_score: float
    is_eligible: bool
    disqualification_reason: Optional[str] = None
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobSchema(BaseModel):
    id: UUID
    canonical_url: str
    company_name: str
    title: str
    location: Optional[str] = None
    country_code: Optional[str] = None
    region_code: Optional[str] = None
    description: str
    work_arrangement: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    published_at: datetime
    source_name: Optional[str] = "public_source"
    match: Optional[JobMatchSchema] = None
    contacts: List[JobContactSchema] = []

    model_config = ConfigDict(from_attributes=True)


# Application Schemas
class ApplicationSchema(BaseModel):
    id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    region_code: Optional[str]
    status: str
    channel: str
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Daily Report & Quota
class DailyReportSchema(BaseModel):
    date: date
    timezone: str
    used_quota: int
    max_quota: int
    jobs_discovered_today: int
    eligible_matches_today: int
    applications_sent_today: int
    pending_manual_actions: int
    failed_applications: int
    region_breakdown: Dict[str, Dict[str, int]]
