-- ====================================================================
-- JobPilot AI: Database Verification Script
-- Run this in the Supabase SQL Editor after running 001_initial_schema.sql
-- ====================================================================

-- 1. Check all 17 tables existence
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'job_profiles', 'regions', 'countries', 'resumes',
    'region_resumes', 'job_profile_regions', 'job_sources', 'jobs',
    'job_contacts', 'job_matches', 'applications', 'email_logs',
    'application_events', 'daily_quotas', 'agent_runs', 'user_integrations'
  )
ORDER BY table_name;

-- 2. Verify Regions count and priority order (Expected: 4 rows: PK, EU, ASIA, ARAB)
SELECT code, name, priority, is_active 
FROM public.regions 
ORDER BY priority ASC;

-- 3. Verify Country counts by Region (Expected: PK=1, EU=9, ASIA=7, ARAB=8 -> Total = 25)
SELECT region_code, count(*) AS country_count
FROM public.countries
GROUP BY region_code
ORDER BY region_code;

-- Total countries check (Expected: 25)
SELECT count(*) AS total_countries FROM public.countries;

-- 4. Verify Job Sources seeded (Expected: 4 sources)
SELECT name, adapter_type, is_active FROM public.job_sources;

-- 5. Verify Storage Bucket existence (Expected: 1 row with id 'regional-resumes', public = false)
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'regional-resumes';

-- 6. Verify Row-Level Security is enabled on tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
