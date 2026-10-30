-- ====================================================================
-- JobPilot AI: Complete Initial Database Schema (Supabase PostgreSQL)
-- Migration: 001_initial_schema.sql
-- Description: Creates 17 core tables, foreign keys, constraints, indexes,
--              triggers, RLS policies, storage bucket, and seed data.
-- ====================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. Helper Function: Automatic updated_at timestamp
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 2. Core Tables
-- ====================================================================

-- 1. PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    location TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. JOB PROFILES (User-configured search preferences & thresholds)
CREATE TABLE IF NOT EXISTS public.job_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_titles TEXT[] NOT NULL DEFAULT ARRAY[
        'AI Engineer', 'AI/ML Engineer', 'Agentic AI Engineer', 
        'LLM Engineer', 'Machine Learning Engineer', 'Generative AI Engineer', 
        'AI Automation Engineer', 'Python AI Engineer', 'RAG Engineer'
    ]::TEXT[],
    target_skills TEXT[] NOT NULL DEFAULT ARRAY[
        'Python', 'FastAPI', 'LLMs', 'RAG', 'LangChain', 'LangGraph', 
        'AI agents', 'multi-agent systems', 'NLP', 'vector databases', 
        'OpenAI API', 'AI automation'
    ]::TEXT[],
    min_experience_years INT NOT NULL DEFAULT 0,
    work_arrangements TEXT[] NOT NULL DEFAULT ARRAY['remote', 'hybrid']::TEXT[],
    min_salary NUMERIC(12, 2),
    salary_currency VARCHAR(10) DEFAULT 'USD',
    min_match_score INT NOT NULL DEFAULT 75 CHECK (min_match_score >= 0 AND min_match_score <= 100),
    max_job_age_hours INT NOT NULL DEFAULT 72,
    global_daily_cap INT NOT NULL DEFAULT 30 CHECK (global_daily_cap > 0 AND global_daily_cap <= 100),
    email_automation_mode TEXT NOT NULL DEFAULT 'approval' CHECK (email_automation_mode IN ('automatic', 'approval', 'manual')),
    is_emergency_paused BOOLEAN NOT NULL DEFAULT false,
    is_dry_run_mode BOOLEAN NOT NULL DEFAULT true,
    email_template_subject TEXT NOT NULL DEFAULT 'Application for {{job_title}} - {{candidate_name}}',
    email_template_body TEXT NOT NULL DEFAULT 'Dear Hiring Team at {{company_name}},\n\nI am writing to express my strong interest in the {{job_title}} role. With solid expertise in {{relevant_skills}}, I am confident in delivering high impact to your projects.\n\nPlease find my regional CV attached.\n\nBest regards,\n{{candidate_name}}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. REGIONS (4 Regional Priority buckets)
CREATE TABLE IF NOT EXISTS public.regions (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    priority INT NOT NULL UNIQUE CHECK (priority >= 1),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. COUNTRIES (Belonging to regions)
CREATE TABLE IF NOT EXISTS public.countries (
    code VARCHAR(5) PRIMARY KEY,
    region_code VARCHAR(10) NOT NULL REFERENCES public.regions(code) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RESUMES (Metadata for uploaded regional CVs)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    checksum_sha256 TEXT,
    version INT NOT NULL DEFAULT 1,
    parsed_text TEXT,
    skills_extracted TEXT[] DEFAULT '{}'::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. REGION RESUMES (Strict 1-to-1 mapping from region to active CV)
CREATE TABLE IF NOT EXISTS public.region_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    region_code VARCHAR(10) NOT NULL REFERENCES public.regions(code) ON DELETE RESTRICT,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_region_resume UNIQUE (user_id, region_code)
);

-- 7. JOB PROFILE REGIONS (User preference toggles per region)
CREATE TABLE IF NOT EXISTS public.job_profile_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_profile_id UUID NOT NULL REFERENCES public.job_profiles(id) ON DELETE CASCADE,
    region_code VARCHAR(10) NOT NULL REFERENCES public.regions(code) ON DELETE RESTRICT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    custom_priority INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_profile_region UNIQUE (job_profile_id, region_code)
);

-- 8. JOB SOURCES (Modular scrapers and source providers)
CREATE TABLE IF NOT EXISTS public.job_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    adapter_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_minute INT DEFAULT 30,
    requires_auth BOOLEAN NOT NULL DEFAULT false,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. JOBS (Canonical job listings)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.job_sources(id) ON DELETE SET NULL,
    external_id TEXT,
    canonical_url TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    country_code VARCHAR(5) REFERENCES public.countries(code) ON DELETE SET NULL,
    region_code VARCHAR(10) REFERENCES public.regions(code) ON DELETE SET NULL,
    description TEXT NOT NULL,
    employment_type TEXT,
    work_arrangement TEXT,
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(10),
    published_at TIMESTAMPTZ NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. JOB CONTACTS (Recruiter and hiring manager contact discovery)
CREATE TABLE IF NOT EXISTS public.job_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    role TEXT,
    source_url TEXT,
    evidence TEXT,
    verification_method TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'failed')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_contact_email UNIQUE (job_id, email)
);

-- 11. JOB MATCHES (Deterministic and AI scoring engine results)
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    job_profile_id UUID NOT NULL REFERENCES public.job_profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    title_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    skills_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    experience_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    location_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    salary_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    freshness_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    disqualification_reason TEXT,
    matching_skills TEXT[] DEFAULT '{}'::TEXT[],
    missing_skills TEXT[] DEFAULT '{}'::TEXT[],
    explanation TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_profile_match UNIQUE (job_id, job_profile_id)
);

-- 12. APPLICATIONS (Application execution and status tracker)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE RESTRICT,
    contact_id UUID REFERENCES public.job_contacts(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'portal', 'manual')),
    status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN (
        'discovered', 'matched', 'ready_for_review', 'queued', 'preparing',
        'ready', 'sending', 'sent', 'submitted', 'delivery_confirmed',
        'bounced', 'replied', 'interview', 'rejected', 'failed',
        'needs_manual_action', 'skipped', 'cancelled'
    )),
    email_subject TEXT,
    email_body TEXT,
    sent_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_job_application UNIQUE (user_id, job_id)
);

-- 13. EMAIL LOGS (Audit trail for outgoing messages)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    provider_message_id TEXT,
    provider_thread_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
    raw_response JSONB DEFAULT '{}'::jsonb,
    error_details TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. APPLICATION EVENTS (State transition history)
CREATE TABLE IF NOT EXISTS public.application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. DAILY QUOTAS (Atomic reservation for the 30 apps/day limit)
CREATE TABLE IF NOT EXISTS public.daily_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0 AND used_count <= 30),
    reserved_count INT NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
    max_limit INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_quota_date UNIQUE (user_id, date)
);

-- 16. AGENT RUNS (Workflow execution sessions)
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('scheduled', 'manual', 'retry')),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused', 'cancelled')),
    jobs_discovered INT NOT NULL DEFAULT 0,
    jobs_matched INT NOT NULL DEFAULT 0,
    applications_sent INT NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 17. USER INTEGRATIONS (OAuth credentials and integration state)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gmail', 'supabase', 'openai', 'anthropic', 'groq')),
    status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('connected', 'not_connected', 'needs_attention', 'configuration_required')),
    account_email TEXT,
    scopes TEXT[] DEFAULT '{}'::TEXT[],
    encrypted_credentials JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

-- ====================================================================
-- 3. Indexes for Performance & Deduplication
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON public.jobs (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_region_country ON public.jobs (region_code, country_code);
CREATE INDEX IF NOT EXISTS idx_jobs_canonical_url ON public.jobs (canonical_url);
CREATE INDEX IF NOT EXISTS idx_job_matches_scores ON public.job_matches (overall_score DESC, is_eligible);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON public.applications (user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_date ON public.daily_quotas (user_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON public.agent_runs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_contacts_job_id ON public.job_contacts (job_id);

-- ====================================================================
-- 4. Triggers for updated_at
-- ====================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t);
    END LOOP;
END;
$$;

-- ====================================================================
-- 5. Seed Initial Regions (4) and Countries (25)
-- ====================================================================

-- 4 Regional Priority Buckets
INSERT INTO public.regions (code, name, priority, is_active)
VALUES
    ('PK', 'Pakistan', 1, true),
    ('EU', 'Europe', 2, true),
    ('ASIA', 'Asia', 3, true),
    ('ARAB', 'Arab countries', 4, true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, priority = EXCLUDED.priority, is_active = EXCLUDED.is_active;

-- 25 Configured Countries
INSERT INTO public.countries (code, region_code, name, is_active)
VALUES
    -- Priority 1: Pakistan (1)
    ('PK', 'PK', 'Pakistan', true),

    -- Priority 2: Europe (9)
    ('DE', 'EU', 'Germany', true),
    ('NL', 'EU', 'Netherlands', true),
    ('IE', 'EU', 'Ireland', true),
    ('GB', 'EU', 'United Kingdom', true),
    ('SE', 'EU', 'Sweden', true),
    ('FR', 'EU', 'France', true),
    ('PL', 'EU', 'Poland', true),
    ('PT', 'EU', 'Portugal', true),
    ('CH', 'EU', 'Switzerland', true),

    -- Priority 3: Asia (7)
    ('SG', 'ASIA', 'Singapore', true),
    ('MY', 'ASIA', 'Malaysia', true),
    ('JP', 'ASIA', 'Japan', true),
    ('KR', 'ASIA', 'South Korea', true),
    ('ID', 'ASIA', 'Indonesia', true),
    ('TH', 'ASIA', 'Thailand', true),
    ('CN', 'ASIA', 'China', true),

    -- Priority 4: Arab countries (8)
    ('AE', 'ARAB', 'United Arab Emirates', true),
    ('SA', 'ARAB', 'Saudi Arabia', true),
    ('QA', 'ARAB', 'Qatar', true),
    ('OM', 'ARAB', 'Oman', true),
    ('BH', 'ARAB', 'Bahrain', true),
    ('KW', 'ARAB', 'Kuwait', true),
    ('JO', 'ARAB', 'Jordan', true),
    ('EG', 'ARAB', 'Egypt', true)
ON CONFLICT (code) DO UPDATE
SET region_code = EXCLUDED.region_code, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Seed default job source entries
INSERT INTO public.job_sources (name, adapter_type, is_active, rate_limit_per_minute, requires_auth, config)
VALUES
    ('remoteok', 'api', true, 20, false, '{"url": "https://remoteok.com/api"}'::jsonb),
    ('arbeitnow', 'api', true, 30, false, '{"url": "https://www.arbeitnow.com/api/job-board-api"}'::jsonb),
    ('jobicy', 'api', true, 20, false, '{"url": "https://jobicy.com/api/v2/remote-jobs"}'::jsonb),
    ('company_career_page', 'browser', true, 10, false, '{"headless": true}'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET adapter_type = EXCLUDED.adapter_type, is_active = EXCLUDED.is_active;

-- ====================================================================
-- 6. Row-Level Security (RLS) Configuration
-- ====================================================================

-- Enable RLS on user-specific tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_profile_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on catalog tables (public read-only)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Catalog tables: authenticated users can read
DROP POLICY IF EXISTS "Allow read access to regions" ON public.regions;
CREATE POLICY "Allow read access to regions" ON public.regions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to countries" ON public.countries;
CREATE POLICY "Allow read access to countries" ON public.countries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to job_sources" ON public.job_sources;
CREATE POLICY "Allow read access to job_sources" ON public.job_sources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to jobs" ON public.jobs;
CREATE POLICY "Allow read access to jobs" ON public.jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to job_contacts" ON public.job_contacts;
CREATE POLICY "Allow read access to job_contacts" ON public.job_contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to job_matches" ON public.job_matches;
CREATE POLICY "Allow read access to job_matches" ON public.job_matches FOR SELECT TO authenticated USING (true);

-- User-owned tables: policies restricted to auth.uid()
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own job_profiles" ON public.job_profiles;
CREATE POLICY "Users manage own job_profiles" ON public.job_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
CREATE POLICY "Users manage own resumes" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own region_resumes" ON public.region_resumes;
CREATE POLICY "Users manage own region_resumes" ON public.region_resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own job_profile_regions" ON public.job_profile_regions;
CREATE POLICY "Users manage own job_profile_regions" ON public.job_profile_regions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.job_profiles jp WHERE jp.id = job_profile_id AND jp.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.job_profiles jp WHERE jp.id = job_profile_id AND jp.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own applications" ON public.applications;
CREATE POLICY "Users manage own applications" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own email_logs" ON public.email_logs;
CREATE POLICY "Users manage own email_logs" ON public.email_logs FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own application_events" ON public.application_events;
CREATE POLICY "Users manage own application_events" ON public.application_events FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own daily_quotas" ON public.daily_quotas;
CREATE POLICY "Users manage own daily_quotas" ON public.daily_quotas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own agent_runs" ON public.agent_runs;
CREATE POLICY "Users manage own agent_runs" ON public.agent_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own integrations" ON public.user_integrations;
CREATE POLICY "Users manage own integrations" ON public.user_integrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 7. Supabase Storage Setup (private bucket: regional-resumes)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'regional-resumes',
    'regional-resumes',
    false,
    10485760, -- 10 MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = 10485760, allowed_mime_types = ARRAY['application/pdf']::text[];

-- Storage Policies: authenticated users can only view and upload to their own folder: USER_ID/*
DROP POLICY IF EXISTS "Users access own resume files" ON storage.objects;
CREATE POLICY "Users access own resume files" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'regional-resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'regional-resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
