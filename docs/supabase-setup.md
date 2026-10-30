# Supabase PostgreSQL Setup & Verification Guide

This guide walks you through executing the initial schema and verifying your database on Supabase.

---

## 1. Prerequisites
- Access to your Supabase Project Dashboard: [https://supabase.com/dashboard/project/swsgkfhcqeujbkrngzss](https://supabase.com/dashboard/project/swsgkfhcqeujbkrngzss)
- Supabase Project Reference: `swsgkfhcqeujbkrngzss`

---

## 2. Execute the Initial Migration

1. Log into your **Supabase Dashboard**.
2. Select your project: `swsgkfhcqeujbkrngzss`.
3. In the left navigation, click on **SQL Editor**.
4. Click **New query** (or `+`).
5. Open [`backend/migrations/manual/001_initial_schema.sql`](file:///C:/Users/Acer/Desktop/Autonomous%20AI%20Job%20Search%20application/backend/migrations/manual/001_initial_schema.sql) in your editor, copy the entire content, and paste it into the Supabase SQL Editor.
6. Click **Run** (green button or press `Ctrl + Enter` / `Cmd + Enter`).
7. Confirm that the status reports `Success. No rows returned` or a completed execution message.

---

## 3. Verify the Migration

1. In the **SQL Editor**, open another query tab.
2. Copy and run the script from [`docs/database-verification.sql`](file:///C:/Users/Acer/Desktop/Autonomous%20AI%20Job%20Search%20application/docs/database-verification.sql).

### Expected Results:

#### 1. Table Count
You should see all 17 public tables:
`agent_runs`, `application_events`, `applications`, `countries`, `daily_quotas`, `email_logs`, `job_contacts`, `job_matches`, `job_profile_regions`, `job_profiles`, `job_sources`, `jobs`, `profiles`, `region_resumes`, `regions`, `resumes`, `user_integrations`.

#### 2. Regions (4 rows)
- `PK` — Pakistan (Priority 1)
- `EU` — Europe (Priority 2)
- `ASIA` — Asia (Priority 3)
- `ARAB` — Arab countries (Priority 4)

#### 3. Country Counts by Region (Total: 25)
- `ARAB`: 8 countries (`AE`, `SA`, `QA`, `OM`, `BH`, `KW`, `JO`, `EG`)
- `ASIA`: 7 countries (`SG`, `MY`, `JP`, `KR`, `ID`, `TH`, `CN`)
- `EU`: 9 countries (`DE`, `NL`, `IE`, `GB`, `SE`, `FR`, `PL`, `PT`, `CH`)
- `PK`: 1 country (`PK`)

#### 4. Job Sources (4 rows)
- `remoteok`, `arbeitnow`, `jobicy`, `company_career_page`

#### 5. Storage Bucket
- `regional-resumes` bucket present with `public = false` and 10MB file limit.

---

## 4. Rollback Plan

If you ever need to reset the public schema in a local or development environment without affecting Supabase internal system tables:

```sql
DROP TABLE IF EXISTS public.application_events CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.job_matches CASCADE;
DROP TABLE IF EXISTS public.job_contacts CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.job_sources CASCADE;
DROP TABLE IF EXISTS public.region_resumes CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.job_profile_regions CASCADE;
DROP TABLE IF EXISTS public.daily_quotas CASCADE;
DROP TABLE IF EXISTS public.agent_runs CASCADE;
DROP TABLE IF EXISTS public.user_integrations CASCADE;
DROP TABLE IF EXISTS public.job_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;
```

---

## 5. Storage Verification in Dashboard

1. In Supabase Dashboard, go to **Storage** -> **Buckets**.
2. Confirm the `regional-resumes` bucket is listed and marked **Private**.
3. Storage policies are automatically created to restrict read and write access to files matching the folder structure `USER_ID/*`.
