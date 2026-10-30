"""SQLAlchemy 2.0 models for JobPilot AI.
Reflects the 17 core tables defined in backend/migrations/manual/001_initial_schema.sql.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    JSON,
    UniqueConstraint,
    CheckConstraint,
    BigInteger,
    ARRAY
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

# Universal UUID type generator that works with PostgreSQL and SQLite
import sqlalchemy.types as types

class GUID(types.TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's UUID type, otherwise uses String(36).
    """
    impl = types.String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(types.String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


class StringList(types.TypeDecorator):
    """Platform-independent string list type: ARRAY(Text) on PostgreSQL, JSON on SQLite."""
    impl = types.JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(ARRAY(Text))
        return dialect.type_descriptor(types.JSON)


class Profile(Base):
    """User profile table linked to Supabase Auth."""
    __tablename__ = "profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False, default="")
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    timezone = Column(String(50), nullable=False, default="Asia/Karachi")
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job_profiles = relationship("JobProfile", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    region_resumes = relationship("RegionResume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    daily_quotas = relationship("DailyQuota", back_populates="user", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="user", cascade="all, delete-orphan")
    integrations = relationship("UserIntegration", back_populates="user", cascade="all, delete-orphan")


class JobProfile(Base):
    """User's job search preferences and eligibility rules."""
    __tablename__ = "job_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    target_titles = Column(StringList, nullable=False, default=list)
    target_skills = Column(StringList, nullable=False, default=list)
    min_experience_years = Column(Integer, nullable=False, default=0)
    work_arrangements = Column(StringList, nullable=False, default=lambda: ["remote", "hybrid"])
    min_salary = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), nullable=False, default="USD")
    min_match_score = Column(Integer, nullable=False, default=75)
    max_job_age_hours = Column(Integer, nullable=False, default=72)
    global_daily_cap = Column(Integer, nullable=False, default=30)
    email_automation_mode = Column(String(50), nullable=False, default="approval")
    is_emergency_paused = Column(Boolean, nullable=False, default=False)
    is_dry_run_mode = Column(Boolean, nullable=False, default=True)
    email_template_subject = Column(String(255), nullable=False, default="Application for {{job_title}} - {{candidate_name}}")
    email_template_body = Column(Text, nullable=False, default="Dear Hiring Team at {{company_name}},\n\nI am writing to express my strong interest in the {{job_title}} role. With solid expertise in {{relevant_skills}}, I am confident in delivering high impact to your projects.\n\nPlease find my regional CV attached.\n\nBest regards,\n{{candidate_name}}")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="job_profiles")
    regional_preferences = relationship("JobProfileRegion", back_populates="job_profile", cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="job_profile", cascade="all, delete-orphan")


class Region(Base):
    """The 4 Regional buckets: PK, EU, ASIA, ARAB."""
    __tablename__ = "regions"

    code = Column(String(10), primary_key=True)  # 'PK', 'EU', 'ASIA', 'ARAB'
    name = Column(String(100), nullable=False)
    priority = Column(Integer, nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    countries = relationship("Country", back_populates="region")
    region_resumes = relationship("RegionResume", back_populates="region")


class Country(Base):
    """Countries mapped to regions."""
    __tablename__ = "countries"

    code = Column(String(5), primary_key=True)  # ISO code
    region_code = Column(String(10), ForeignKey("regions.code", ondelete="RESTRICT"), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    region = relationship("Region", back_populates="countries")
    jobs = relationship("Job", back_populates="country")


class Resume(Base):
    """Uploaded resumes stored in private storage."""
    __tablename__ = "resumes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False, default="application/pdf")
    checksum_sha256 = Column(String(64), nullable=True)
    version = Column(Integer, nullable=False, default=1)
    parsed_text = Column(Text, nullable=True)
    skills_extracted = Column(StringList, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="resumes")
    region_mappings = relationship("RegionResume", back_populates="resume")
    applications = relationship("Application", back_populates="resume")


class RegionResume(Base):
    """Strict mapping between a user's region and their regional CV."""
    __tablename__ = "region_resumes"
    __table_args__ = (UniqueConstraint("user_id", "region_code", name="uq_user_region_resume"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    region_code = Column(String(10), ForeignKey("regions.code", ondelete="RESTRICT"), nullable=False)
    resume_id = Column(GUID(), ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="region_resumes")
    region = relationship("Region", back_populates="region_resumes")
    resume = relationship("Resume", back_populates="region_mappings")


class JobProfileRegion(Base):
    """User preference overrides per region."""
    __tablename__ = "job_profile_regions"
    __table_args__ = (UniqueConstraint("job_profile_id", "region_code", name="uq_profile_region"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_profile_id = Column(GUID(), ForeignKey("job_profiles.id", ondelete="CASCADE"), nullable=False)
    region_code = Column(String(10), ForeignKey("regions.code", ondelete="RESTRICT"), nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)
    custom_priority = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    job_profile = relationship("JobProfile", back_populates="regional_preferences")


class JobSource(Base):
    """Scrapers and job source connectors."""
    __tablename__ = "job_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    adapter_type = Column(String(50), nullable=False)  # 'api', 'browser', 'feed'
    is_active = Column(Boolean, nullable=False, default=True)
    rate_limit_per_minute = Column(Integer, nullable=False, default=30)
    requires_auth = Column(Boolean, nullable=False, default=False)
    config = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    jobs = relationship("Job", back_populates="source")


class Job(Base):
    """Canonical job postings collected across sources."""
    __tablename__ = "jobs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    source_id = Column(GUID(), ForeignKey("job_sources.id", ondelete="SET NULL"), nullable=True)
    external_id = Column(String(255), nullable=True)
    canonical_url = Column(Text, nullable=False, unique=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    country_code = Column(String(5), ForeignKey("countries.code", ondelete="SET NULL"), nullable=True)
    region_code = Column(String(10), ForeignKey("regions.code", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    employment_type = Column(String(50), nullable=True)
    work_arrangement = Column(String(50), nullable=True)  # 'remote', 'hybrid', 'onsite'
    salary_min = Column(Numeric(12, 2), nullable=True)
    salary_max = Column(Numeric(12, 2), nullable=True)
    salary_currency = Column(String(10), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    first_seen_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    raw_metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = relationship("JobSource", back_populates="jobs")
    country = relationship("Country", back_populates="jobs")
    contacts = relationship("JobContact", back_populates="job", cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job")


class JobContact(Base):
    """Authoritative recruiters or hiring contacts found for jobs."""
    __tablename__ = "job_contacts"
    __table_args__ = (UniqueConstraint("job_id", "email", name="uq_job_contact_email"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)
    source_url = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    verification_method = Column(String(50), nullable=False)
    verification_status = Column(String(50), nullable=False, default="unverified")
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="contacts")
    applications = relationship("Application", back_populates="contact")


class JobMatch(Base):
    """Scoring results of a job against a user's job profile."""
    __tablename__ = "job_matches"
    __table_args__ = (UniqueConstraint("job_id", "job_profile_id", name="uq_job_profile_match"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    job_profile_id = Column(GUID(), ForeignKey("job_profiles.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    title_score = Column(Numeric(5, 2), nullable=False, default=0)
    skills_score = Column(Numeric(5, 2), nullable=False, default=0)
    experience_score = Column(Numeric(5, 2), nullable=False, default=0)
    location_score = Column(Numeric(5, 2), nullable=False, default=0)
    salary_score = Column(Numeric(5, 2), nullable=False, default=0)
    freshness_score = Column(Numeric(5, 2), nullable=False, default=0)
    is_eligible = Column(Boolean, nullable=False, default=True)
    disqualification_reason = Column(Text, nullable=True)
    matching_skills = Column(StringList, nullable=False, default=list)
    missing_skills = Column(StringList, nullable=False, default=list)
    explanation = Column(Text, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="matches")
    job_profile = relationship("JobProfile", back_populates="matches")


class Application(Base):
    """Job application state machine and record."""
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_user_job_application"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="RESTRICT"), nullable=False)
    resume_id = Column(GUID(), ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=False)
    contact_id = Column(GUID(), ForeignKey("job_contacts.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(50), nullable=False, default="email")
    status = Column(String(50), nullable=False, default="discovered")
    email_subject = Column(String(255), nullable=True)
    email_body = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    idempotency_key = Column(String(255), unique=True, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    contact = relationship("JobContact", back_populates="applications")
    email_logs = relationship("EmailLog", back_populates="application", cascade="all, delete-orphan")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")


class EmailLog(Base):
    """Audited email dispatch records."""
    __tablename__ = "email_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    application_id = Column(GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    provider_message_id = Column(String(255), nullable=True)
    provider_thread_id = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False)
    raw_response = Column(JSON, nullable=False, default=dict)
    error_details = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="email_logs")


class ApplicationEvent(Base):
    """Audit timeline events for application state transitions."""
    __tablename__ = "application_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    application_id = Column(GUID(), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=True)
    details = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="events")


class DailyQuota(Base):
    """Tracks daily application usage against the global 30/day limit."""
    __tablename__ = "daily_quotas"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_quota_date"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)  # In Asia/Karachi timezone
    used_count = Column(Integer, nullable=False, default=0)
    reserved_count = Column(Integer, nullable=False, default=0)
    max_limit = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="daily_quotas")


class AgentRun(Base):
    """Logs agent execution runs and outcomes."""
    __tablename__ = "agent_runs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    trigger_type = Column(String(50), nullable=False, default="manual")
    status = Column(String(50), nullable=False, default="running")
    jobs_discovered = Column(Integer, nullable=False, default=0)
    jobs_matched = Column(Integer, nullable=False, default=0)
    applications_sent = Column(Integer, nullable=False, default=0)
    errors = Column(JSON, nullable=False, default=list)
    started_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("Profile", back_populates="agent_runs")


class UserIntegration(Base):
    """OAuth connections and provider states."""
    __tablename__ = "user_integrations"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_user_provider"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # 'gmail', 'supabase', 'openai', etc.
    status = Column(String(50), nullable=False, default="not_connected")
    account_email = Column(String(255), nullable=True)
    scopes = Column(StringList, nullable=False, default=list)
    encrypted_credentials = Column(JSON, nullable=False, default=dict)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="integrations")


# ── CRM & ERP SaaS Subscription Models ───────────────────────────────────────

class SubscriptionPlan(Base):
    """SaaS pricing plans: Starter, Pro, Agency, Enterprise."""
    __tablename__ = "subscription_plans"

    id = Column(String(50), primary_key=True)  # 'starter', 'pro', 'agency', 'enterprise'
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price_monthly = Column(Numeric(10, 2), nullable=False, default=0.0)
    price_yearly = Column(Numeric(10, 2), nullable=False, default=0.0)
    max_applications_per_day = Column(Integer, nullable=False, default=30)
    max_team_seats = Column(Integer, nullable=False, default=1)
    max_scrapes_per_day = Column(Integer, nullable=False, default=50)
    features = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)


class Organization(Base):
    """Multi-tenant Workspace / Company account."""
    __tablename__ = "organizations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    owner_id = Column(GUID(), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    current_plan_id = Column(String(50), ForeignKey("subscription_plans.id"), nullable=False, default="starter")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkspaceMember(Base):
    """Team members and role-based permissions within an Organization."""
    __tablename__ = "workspace_members"
    __table_args__ = (UniqueConstraint("organization_id", "email", name="uq_org_member_email"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID(), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="recruiter")  # owner, admin, recruiter, member
    status = Column(String(50), nullable=False, default="active")  # active, invited, suspended
    joined_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class UserSubscription(Base):
    """Active subscription status, Stripe metadata, and billing lifecycle."""
    __tablename__ = "user_subscriptions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String(50), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(50), nullable=False, default="active")  # trial, active, past_due, canceled
    billing_cycle = Column(String(20), nullable=False, default="monthly")  # monthly, yearly
    current_period_start = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class CrmLead(Base):
    """Recruitment leads, hiring managers, company contacts."""
    __tablename__ = "crm_leads"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    country_code = Column(String(10), nullable=True)
    status = Column(String(50), nullable=False, default="new")  # new, contacted, qualified, unresponsive, closed
    source = Column(String(100), nullable=False, default="ai_discovery")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CrmDeal(Base):
    """Candidate placement pipeline and opportunity stages."""
    __tablename__ = "crm_deals"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    lead_id = Column(GUID(), ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    stage = Column(String(50), nullable=False, default="screening")  # lead, contacted, screening, technical_interview, final_interview, offer, placed, lost
    deal_value = Column(Numeric(12, 2), nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="USD")
    candidate_name = Column(String(255), nullable=False, default="Talha Aftab")
    company_name = Column(String(255), nullable=False)
    expected_close_date = Column(Date, nullable=True)
    priority = Column(String(20), nullable=False, default="medium")  # high, medium, low
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class CrmActivity(Base):
    """CRM Touchpoints: calls, notes, interviews, tasks, and follow-ups."""
    __tablename__ = "crm_activities"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    deal_id = Column(GUID(), ForeignKey("crm_deals.id", ondelete="CASCADE"), nullable=True)
    lead_id = Column(GUID(), ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True)
    activity_type = Column(String(50), nullable=False, default="note")  # call, email, interview, task, note
    title = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Invoice(Base):
    """ERP Invoices and Subscription Billing History."""
    __tablename__ = "invoices"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default="paid")  # paid, pending, failed
    plan_name = Column(String(100), nullable=False)
    billing_period = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
