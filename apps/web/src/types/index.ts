export type RegionCode = 'PK' | 'EU' | 'ASIA' | 'ARAB';

export interface Country {
  code: string;
  region_code: RegionCode;
  name: string;
  is_active: boolean;
}

export interface Region {
  code: RegionCode;
  name: string;
  priority: number;
  is_active: boolean;
  countries: Country[];
  active_resume_filename?: string | null;
  active_resume_id?: string | null;
}

export interface Resume {
  id: string;
  filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  version: number;
  is_active: boolean;
  created_at: string;
  skills_extracted: string[];
}

export interface JobContact {
  id: string;
  name?: string;
  email: string;
  role?: string;
  verification_status: 'verified' | 'unverified' | 'failed';
  verification_method: string;
}

export interface JobMatch {
  overall_score: number;
  title_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  freshness_score: number;
  is_eligible: boolean;
  disqualification_reason?: string;
  matching_skills: string[];
  missing_skills: string[];
  explanation?: string;
}

export interface Job {
  id: string;
  canonical_url: string;
  company_name: string;
  title: string;
  location?: string;
  country_code?: string;
  region_code?: RegionCode;
  description: string;
  requirements?: string[];
  work_arrangement?: 'remote' | 'hybrid' | 'onsite';
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  published_at: string;
  source_name: string;
  match?: JobMatch;
  contacts: JobContact[];
}

export type ApplicationStatus =
  | 'discovered'
  | 'matched'
  | 'ready_for_review'
  | 'queued'
  | 'preparing'
  | 'ready'
  | 'sending'
  | 'sent'
  | 'submitted'
  | 'delivery_confirmed'
  | 'bounced'
  | 'replied'
  | 'interview'
  | 'rejected'
  | 'failed'
  | 'needs_manual_action'
  | 'skipped'
  | 'cancelled';

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  location?: string;
  match_score?: number;
  hr_email?: string;
  canonical_url?: string;
  region_code?: RegionCode;
  status: ApplicationStatus;
  channel: 'email' | 'portal' | 'manual';
  email_subject?: string;
  email_body?: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export interface DailyReport {
  date: string;
  timezone: string;
  used_quota: number;
  max_quota: number;
  jobs_discovered_today: number;
  eligible_matches_today: number;
  applications_sent_today: number;
  pending_manual_actions: number;
  failed_applications: number;
  region_breakdown: Record<string, { jobs_discovered: number; applications: number }>;
}

export interface JobProfileConfig {
  target_titles: string[];
  target_skills: string[];
  min_experience_years: number;
  work_arrangements: string[];
  min_salary?: number;
  salary_currency: string;
  min_match_score: number;
  max_job_age_hours: number;
  global_daily_cap: number;
  email_automation_mode: 'automatic' | 'approval' | 'manual';
  is_emergency_paused: boolean;
  is_dry_run_mode: boolean;
  email_template_subject: string;
  email_template_body: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'not_connected' | 'needs_attention' | 'configuration_required';
  account?: string | null;
  required_for: string;
}

// ── CRM & ERP Schemas ──────────────────────────────────────────────────────────

export interface CrmLead {
  id: string;
  organization_id?: string;
  name: string;
  company_name: string;
  role?: string;
  email: string;
  phone?: string;
  country_code?: string;
  status: 'new' | 'contacted' | 'qualified' | 'disqualified' | string;
  source: string;
  notes?: string;
  created_at: string;
}

export type DealStage = 'sourcing' | 'screening' | 'interview' | 'offer' | 'placed' | 'lost';

export interface CrmDeal {
  id: string;
  organization_id?: string;
  lead_id?: string;
  title: string;
  stage: DealStage;
  deal_value: number;
  currency: string;
  candidate_name: string;
  company_name: string;
  expected_close_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface CrmActivity {
  id: string;
  organization_id?: string;
  deal_id?: string;
  lead_id?: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'interview' | string;
  title: string;
  details?: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_applications_per_day: number;
  max_team_seats: number;
  max_scrapes_per_day: number;
  features: string[];
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  cancel_at_period_end: boolean;
}

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  plan_name: string;
  billing_period: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'recruiter' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  joined_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  current_plan_id: string;
  created_at: string;
}
