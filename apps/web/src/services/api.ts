import {
  Region,
  Job,
  Resume,
  Application,
  DailyReport,
  JobProfileConfig,
  Integration,
  CrmLead,
  CrmDeal,
  CrmActivity,
  SubscriptionPlan,
  UserSubscription,
  Invoice,
  WorkspaceMember,
  Organization
} from '../types';

const API_BASE = '/api/v1';

// Initial demo/fallback data when backend is not connected
export const DEMO_REGIONS: Region[] = [
  {
    code: 'PK',
    name: 'Pakistan',
    priority: 1,
    is_active: true,
    active_resume_filename: 'Muhammad_Ali_CV_Pakistan.pdf',
    active_resume_id: 'res-1',
    countries: [{ code: 'PK', region_code: 'PK', name: 'Pakistan', is_active: true }]
  },
  {
    code: 'EU',
    name: 'Europe',
    priority: 2,
    is_active: true,
    active_resume_filename: 'Muhammad_Ali_CV_Europe.pdf',
    active_resume_id: 'res-2',
    countries: [
      { code: 'DE', region_code: 'EU', name: 'Germany', is_active: true },
      { code: 'NL', region_code: 'EU', name: 'Netherlands', is_active: true },
      { code: 'IE', region_code: 'EU', name: 'Ireland', is_active: true },
      { code: 'GB', region_code: 'EU', name: 'United Kingdom', is_active: true },
      { code: 'SE', region_code: 'EU', name: 'Sweden', is_active: true },
      { code: 'FR', region_code: 'EU', name: 'France', is_active: true },
      { code: 'PL', region_code: 'EU', name: 'Poland', is_active: true },
      { code: 'PT', region_code: 'EU', name: 'Portugal', is_active: true },
      { code: 'CH', region_code: 'EU', name: 'Switzerland', is_active: true }
    ]
  },
  {
    code: 'ASIA',
    name: 'Asia',
    priority: 3,
    is_active: true,
    active_resume_filename: null, // intentionally missing to display safety indicator
    active_resume_id: null,
    countries: [
      { code: 'SG', region_code: 'ASIA', name: 'Singapore', is_active: true },
      { code: 'MY', region_code: 'ASIA', name: 'Malaysia', is_active: true },
      { code: 'JP', region_code: 'ASIA', name: 'Japan', is_active: true },
      { code: 'KR', region_code: 'ASIA', name: 'South Korea', is_active: true },
      { code: 'ID', region_code: 'ASIA', name: 'Indonesia', is_active: true },
      { code: 'TH', region_code: 'ASIA', name: 'Thailand', is_active: true },
      { code: 'CN', region_code: 'ASIA', name: 'China', is_active: true }
    ]
  },
  {
    code: 'ARAB',
    name: 'Arab countries',
    priority: 4,
    is_active: true,
    active_resume_filename: 'Muhammad_Ali_CV_Gulf_Arab.pdf',
    active_resume_id: 'res-4',
    countries: [
      { code: 'AE', region_code: 'ARAB', name: 'United Arab Emirates', is_active: true },
      { code: 'SA', region_code: 'ARAB', name: 'Saudi Arabia', is_active: true },
      { code: 'QA', region_code: 'ARAB', name: 'Qatar', is_active: true },
      { code: 'OM', region_code: 'ARAB', name: 'Oman', is_active: true },
      { code: 'BH', region_code: 'ARAB', name: 'Bahrain', is_active: true },
      { code: 'KW', region_code: 'ARAB', name: 'Kuwait', is_active: true },
      { code: 'JO', region_code: 'ARAB', name: 'Jordan', is_active: true },
      { code: 'EG', region_code: 'ARAB', name: 'Egypt', is_active: true }
    ]
  }
];

export const DEMO_JOBS: Job[] = [
  {
    id: 'job-1',
    canonical_url: 'https://careers.techcorp.de/jobs/ai-agent-engineer',
    company_name: 'Synthetix AI Labs',
    title: 'Senior Agentic AI Engineer',
    location: 'Berlin / Remote',
    country_code: 'DE',
    region_code: 'EU',
    description: 'We are seeking an Agentic AI Engineer with deep knowledge of LangGraph, FastAPI, and multi-agent systems to build autonomous workflow agents.',
    work_arrangement: 'remote',
    salary_min: 85000,
    salary_max: 110000,
    salary_currency: 'EUR',
    published_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    source_name: 'arbeitnow',
    match: {
      overall_score: 92,
      title_score: 25,
      skills_score: 28,
      experience_score: 15,
      location_score: 10,
      salary_score: 5,
      freshness_score: 9,
      is_eligible: true,
      matching_skills: ['LangGraph', 'FastAPI', 'Python', 'Multi-Agent Systems', 'Vector DBs'],
      missing_skills: ['Kubernetes'],
      explanation: 'Exceptional match for Agentic AI requirements with full remote authorization in EU timezone.'
    },
    contacts: [
      {
        id: 'c-1',
        name: 'Elena Rostova',
        email: 'talent@synthetix.de',
        role: 'Head of Talent Acquisition',
        verification_status: 'verified',
        verification_method: 'authoritative_careers_page'
      }
    ]
  },
  {
    id: 'job-2',
    canonical_url: 'https://remotecorp.pk/careers/python-llm-engineer',
    company_name: 'NeuralPath Pakistan',
    title: 'Lead Python LLM & RAG Engineer',
    location: 'Lahore, Pakistan (Hybrid)',
    country_code: 'PK',
    region_code: 'PK',
    description: 'Looking for a Senior Python Developer with RAG pipeline and vector database experience to deploy production search systems.',
    work_arrangement: 'hybrid',
    salary_min: 450000,
    salary_max: 600000,
    salary_currency: 'PKR',
    published_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    source_name: 'remoteok',
    match: {
      overall_score: 88,
      title_score: 23,
      skills_score: 27,
      experience_score: 15,
      location_score: 10,
      salary_score: 5,
      freshness_score: 8,
      is_eligible: true,
      matching_skills: ['Python', 'RAG', 'OpenAI API', 'FastAPI', 'Vector Databases'],
      missing_skills: [],
      explanation: 'Priority 1 region match. Strong alignment on Python and RAG technical stack.'
    },
    contacts: [
      {
        id: 'c-2',
        name: 'Hamza Khan',
        email: 'careers@neuralpath.pk',
        role: 'Lead AI Architect',
        verification_status: 'verified',
        verification_method: 'official_listing'
      }
    ]
  },
  {
    id: 'job-3',
    canonical_url: 'https://emirates-ai.ae/jobs/generative-ai-engineer',
    company_name: 'Falcon AI Dynamics',
    title: 'Generative AI Solutions Engineer',
    location: 'Dubai, UAE (Remote-friendly)',
    country_code: 'AE',
    region_code: 'ARAB',
    description: 'Join our team developing LLM-driven automation applications for enterprise clients across the GCC region.',
    work_arrangement: 'remote',
    salary_min: 28000,
    salary_max: 35000,
    salary_currency: 'AED',
    published_at: new Date(Date.now() - 40 * 3600000).toISOString(),
    source_name: 'jobicy',
    match: {
      overall_score: 84,
      title_score: 22,
      skills_score: 26,
      experience_score: 14,
      location_score: 10,
      salary_score: 5,
      freshness_score: 7,
      is_eligible: true,
      matching_skills: ['LLMs', 'Generative AI', 'Python', 'FastAPI'],
      missing_skills: ['Arabic NLP'],
      explanation: 'Eligible role in Priority 4 Arab region. Gulf CV attached.'
    },
    contacts: [
      {
        id: 'c-3',
        name: 'Zaid Al-Mansoor',
        email: 'recruiting@falconai.ae',
        role: 'Talent Lead',
        verification_status: 'verified',
        verification_method: 'official_feed'
      }
    ]
  }
];

export const DEMO_CONFIG: JobProfileConfig = {
  target_titles: [
    'AI Engineer',
    'AI/ML Engineer',
    'Agentic AI Engineer',
    'LLM Engineer',
    'Machine Learning Engineer',
    'Generative AI Engineer',
    'AI Automation Engineer',
    'Python AI Engineer',
    'RAG Engineer'
  ],
  target_skills: [
    'Python',
    'FastAPI',
    'LLMs',
    'RAG',
    'LangChain',
    'LangGraph',
    'AI agents',
    'multi-agent systems',
    'NLP',
    'vector databases',
    'OpenAI API',
    'AI automation'
  ],
  min_experience_years: 2,
  work_arrangements: ['remote', 'hybrid'],
  salary_currency: 'USD',
  min_match_score: 75,
  max_job_age_hours: 72,
  global_daily_cap: 30,
  email_automation_mode: 'approval',
  is_emergency_paused: false,
  is_dry_run_mode: true,
  email_template_subject: 'Application for {{job_title}} - {{candidate_name}}',
  email_template_body: `Dear Hiring Team at {{company_name}},

I am writing to express my strong enthusiasm for the {{job_title}} role. With practical experience deploying {{relevant_skills}}, I specialize in delivering reliable autonomous agents and enterprise RAG systems.

I have attached my tailored regional CV for your review: {{job_url}}

Best regards,
{{candidate_name}}`
};

export const DEMO_REPORT: DailyReport = {
  date: new Date().toISOString().split('T')[0],
  timezone: 'Asia/Karachi',
  used_quota: 0,
  max_quota: 30,
  jobs_discovered_today: 18,
  eligible_matches_today: 9,
  applications_sent_today: 0,
  pending_manual_actions: 2,
  failed_applications: 0,
  region_breakdown: {
    PK: { jobs_discovered: 5, applications: 0 },
    EU: { jobs_discovered: 7, applications: 0 },
    ASIA: { jobs_discovered: 2, applications: 0 },
    ARAB: { jobs_discovered: 4, applications: 0 }
  }
};

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    job_id: 'job-1',
    job_title: 'Senior Agentic AI Engineer',
    company_name: 'Synthetix AI Labs',
    region_code: 'EU',
    status: 'ready_for_review',
    channel: 'email',
    email_subject: 'Application for Senior Agentic AI Engineer - Muhammad Ali',
    email_body: 'Dear Hiring Team at Synthetix AI Labs,\n\nI am applying for the Senior Agentic AI Engineer position...',
    retry_count: 0,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'app-2',
    job_id: 'job-2',
    job_title: 'Lead Python LLM & RAG Engineer',
    company_name: 'NeuralPath Pakistan',
    region_code: 'PK',
    status: 'matched',
    channel: 'email',
    email_subject: 'Application for Lead Python LLM & RAG Engineer - Muhammad Ali',
    retry_count: 0,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'app-3',
    job_id: 'job-3',
    job_title: 'Generative AI Solutions Engineer',
    company_name: 'Falcon AI Dynamics',
    region_code: 'ARAB',
    status: 'needs_manual_action',
    channel: 'portal',
    error_message: 'Portal application required: No direct recruiter email available.',
    retry_count: 0,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const DEMO_RESUMES: Resume[] = [
  {
    id: 'res-1',
    filename: 'Muhammad_Ali_CV_Pakistan.pdf',
    storage_path: 'user-default/PK/Muhammad_Ali_CV_Pakistan.pdf',
    file_size_bytes: 245000,
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    skills_extracted: ['Python', 'FastAPI', 'RAG', 'Agentic Workflows']
  },
  {
    id: 'res-2',
    filename: 'Muhammad_Ali_CV_Europe.pdf',
    storage_path: 'user-default/EU/Muhammad_Ali_CV_Europe.pdf',
    file_size_bytes: 312000,
    mime_type: 'application/pdf',
    version: 2,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    skills_extracted: ['Python', 'LangGraph', 'FastAPI', 'Vector Databases', 'Docker']
  },
  {
    id: 'res-4',
    filename: 'Muhammad_Ali_CV_Gulf_Arab.pdf',
    storage_path: 'user-default/ARAB/Muhammad_Ali_CV_Gulf_Arab.pdf',
    file_size_bytes: 278000,
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    skills_extracted: ['Generative AI', 'FastAPI', 'LLMs', 'System Architecture']
  }
];

export const DEMO_INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail (OAuth 2.0)',
    description: 'Sends personalized application emails via authorized Google API.',
    status: 'not_connected',
    account: null,
    required_for: 'Automated Application Emails'
  },
  {
    id: 'supabase',
    name: 'Supabase PostgreSQL & Storage',
    description: 'PostgreSQL database and private resume file bucket.',
    status: 'connected',
    account: 'https://swsgkfhcqeujbkrngzss.supabase.co',
    required_for: 'Data Persistence & CV Vault'
  },
  {
    id: 'ai_provider',
    name: 'AI Match Engine (OpenAI)',
    description: 'Evaluates candidate-to-job match scores and generates tailored messages.',
    status: 'configuration_required',
    account: 'gpt-4o-mini',
    required_for: 'Scoring & Personalization'
  },
  {
    id: 'job_sources',
    name: 'Multi-Source Job Connectors',
    description: 'NaukriGulf (Gulf/UAE), Rozee.pk (PK), LinkedIn, Indeed, Google Jobs, Arbeitnow, RemoteOK, and Jobicy.',
    status: 'connected',
    account: '8 Active Feed & Browser Collectors',
    required_for: 'Job Discovery Pipeline'
  }
];

// Helper wrapper around fetch with error handling and fallback
async function request<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

// Gmail OAuth types
export interface GmailStatus {
  connected: boolean;
  account_email?: string | null;
  scopes?: string[];
  last_synced_at?: string | null;
  quota_used?: number;
  quota_max?: number;
}

export interface GmailQuota {
  date: string;
  timezone: string;
  used_count: number;
  max_limit: number;
  remaining: number;
  is_exhausted: boolean;
}

export interface TestEmailResult {
  success: boolean;
  message: string;
  dry_run: boolean;
  to?: string;
}



export const DEMO_PLANS: SubscriptionPlan[] = [

  {

    id: 'starter',

    name: 'Starter Recruiter',

    description: 'Perfect for freelance recruiters and solo talent hunters.',

    price_monthly: 29,

    price_yearly: 290,

    max_applications_per_day: 15,

    max_team_seats: 1,

    max_scrapes_per_day: 100,

    features: ['1 Seat', '15 Daily AI Applications', 'Standard Job Scraping', 'CSV Export', 'Basic CRM Pipeline'],

    is_active: true

  },

  {

    id: 'pro',

    name: 'Pro Agency',

    description: 'Ideal for scaling boutique recruitment firms and HR consultancies.',

    price_monthly: 79,

    price_yearly: 790,

    max_applications_per_day: 50,

    max_team_seats: 5,

    max_scrapes_per_day: 500,

    features: ['5 Team Seats', '50 Daily AI Applications', 'High-Speed Priority Scraper', 'Full Deal CRM & Stages', 'Email Template Auto-Pilot', 'Priority Support'],

    is_active: true

  },

  {

    id: 'agency',

    name: 'Enterprise ERP',

    description: 'Complete recruitment enterprise operating system with unlimited power.',

    price_monthly: 199,

    price_yearly: 1990,

    max_applications_per_day: 200,

    max_team_seats: 25,

    max_scrapes_per_day: 2500,

    features: ['25 Team Seats', '200 Daily Applications', 'Unlimited AI Pipelines', 'Custom ATS / ERP Integrations', 'Dedicated Account Manager', 'SLA 99.9%'],

    is_active: true

  }

];



export const DEMO_LEADS: CrmLead[] = [

  {

    id: 'lead-1',

    name: 'Elena Rostova',

    company_name: 'TechWave Berlin',

    role: 'VP of Engineering',

    email: 'elena.rostova@techwave.de',

    phone: '+49 30 1234567',

    country_code: 'DE',

    status: 'qualified',

    source: 'ai_discovery',

    notes: 'Looking for 3 Senior Staff ML / Distributed Systems Engineers in Berlin & Remote.',

    created_at: new Date(Date.now() - 86400000 * 2).toISOString()

  },

  {

    id: 'lead-2',

    name: 'Tariq Al-Mansoor',

    company_name: 'Falcon Cloud Dubai',

    role: 'Chief Talent Officer',

    email: 'tariq@falconcloud.ae',

    phone: '+971 4 9876543',

    country_code: 'AE',

    status: 'contacted',

    source: 'linkedin',

    notes: 'Fast-growing cloud infrastructure team in DIFC. Visa sponsorship available.',

    created_at: new Date(Date.now() - 86400000 * 4).toISOString()

  },

  {

    id: 'lead-3',

    name: 'Sarah Jenkins',

    company_name: 'FinLeap London',

    role: 'Director of Talent',

    email: 's.jenkins@finleap.co.uk',

    phone: '+44 20 7946 0192',

    country_code: 'GB',

    status: 'new',

    source: 'ai_discovery',

    notes: 'Series B FinTech looking to expand full-stack React and Python backend teams.',

    created_at: new Date(Date.now() - 86400000 * 1).toISOString()

  },

  {

    id: 'lead-4',

    name: 'Zubair Ahmed',

    company_name: 'Systems Apex Lahore',

    role: 'Engineering Lead',

    email: 'zubair.ahmed@systemapex.pk',

    phone: '+92 42 35870000',

    country_code: 'PK',

    status: 'qualified',

    source: 'referral',

    notes: 'Enterprise ERP modernization and AI Agent automation squad expansion.',

    created_at: new Date(Date.now() - 86400000 * 5).toISOString()

  }

];



export const DEMO_DEALS: CrmDeal[] = [

  {

    id: 'deal-1',

    title: 'Lead AI Engineer - Falcon Cloud',

    stage: 'interview',

    deal_value: 12500,

    currency: 'USD',

    candidate_name: 'Talha Aftab',

    company_name: 'Falcon Cloud Dubai',

    priority: 'urgent',

    created_at: new Date(Date.now() - 86400000 * 3).toISOString()

  },

  {

    id: 'deal-2',

    title: 'Senior Distributed Systems Architect',

    stage: 'screening',

    deal_value: 9500,

    currency: 'EUR',

    candidate_name: 'Talha Aftab',

    company_name: 'TechWave Berlin',

    priority: 'high',

    created_at: new Date(Date.now() - 86400000 * 2).toISOString()

  },

  {

    id: 'deal-3',

    title: 'Full Stack Tech Lead',

    stage: 'sourcing',

    deal_value: 7000,

    currency: 'GBP',

    candidate_name: 'Talha Aftab',

    company_name: 'FinLeap London',

    priority: 'medium',

    created_at: new Date(Date.now() - 86400000 * 1).toISOString()

  },

  {

    id: 'deal-4',

    title: 'Enterprise ERP AI Consultant',

    stage: 'offer',

    deal_value: 15000,

    currency: 'USD',

    candidate_name: 'Talha Aftab',

    company_name: 'Systems Apex Lahore',

    priority: 'urgent',

    created_at: new Date(Date.now() - 86400000 * 7).toISOString()

  }

];



export const DEMO_MEMBERS: WorkspaceMember[] = [

  {

    id: 'mem-1',

    organization_id: 'org-1',

    name: 'Talha Aftab',

    email: 'talha.aftab@jobpilot.io',

    role: 'owner',

    status: 'active',

    joined_at: new Date(Date.now() - 86400000 * 30).toISOString()

  },

  {

    id: 'mem-2',

    organization_id: 'org-1',

    name: 'Hamza Malik',

    email: 'hamza@talentedge.io',

    role: 'recruiter',

    status: 'active',

    joined_at: new Date(Date.now() - 86400000 * 14).toISOString()

  },

  {

    id: 'mem-3',

    organization_id: 'org-1',

    name: 'Ayesha Noor',

    email: 'ayesha.recruiting@talentedge.io',

    role: 'recruiter',

    status: 'invited',

    joined_at: new Date(Date.now() - 86400000 * 3).toISOString()

  }

];



export const DEMO_INVOICES: Invoice[] = [

  {

    id: 'inv-1',

    organization_id: 'org-1',

    invoice_number: 'INV-2026-0042',

    amount: 79.0,

    currency: 'USD',

    status: 'paid',

    plan_name: 'Pro Agency',

    billing_period: 'Oct 01, 2026 - Nov 01, 2026',

    created_at: '2026-10-01T00:00:00Z'

  },

  {

    id: 'inv-2',

    organization_id: 'org-1',

    invoice_number: 'INV-2026-0031',

    amount: 79.0,

    currency: 'USD',

    status: 'paid',

    plan_name: 'Pro Agency',

    billing_period: 'Sep 01, 2026 - Oct 01, 2026',

    created_at: '2026-09-01T00:00:00Z'

  }

];



/** Empty defaults used only while waiting for the API — never fake demo records. */
export const EMPTY_CONFIG: JobProfileConfig = {
  target_titles: [],
  target_skills: [],
  min_experience_years: 0,
  work_arrangements: ['remote'],
  salary_currency: 'USD',
  min_match_score: 75,
  max_job_age_hours: 72,
  global_daily_cap: 30,
  email_automation_mode: 'approval',
  is_emergency_paused: false,
  is_dry_run_mode: true,
  email_template_subject: '',
  email_template_body: '',
};

export const EMPTY_REPORT: DailyReport = {
  date: new Date().toISOString().slice(0, 10),
  timezone: 'Asia/Karachi',
  used_quota: 0,
  max_quota: 30,
  jobs_discovered_today: 0,
  eligible_matches_today: 0,
  applications_sent_today: 0,
  pending_manual_actions: 0,
  failed_applications: 0,
  region_breakdown: {},
};

export const api = {
  getHealth: () => request('/health'),
  getConfig: () => request<JobProfileConfig>('/config'),
  updateConfig: (data: Partial<JobProfileConfig>) =>
    request<JobProfileConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  getRegions: () => request<Region[]>('/regions'),
  updateRegion: (code: string, is_active: boolean) =>
    request(`/regions/${code}`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  getResumes: () => request<Resume[]>('/resumes'),
  getJobs: (params?: string) =>
    request<Job[]>(`/jobs${params ? `?${params}` : '?limit=100'}`).then((data) =>
      Array.isArray(data) ? data : []
    ),
  getApplications: () => request<Application[]>('/applications'),
  retryApplication: (id: string) => request(`/applications/${id}/retry`, { method: 'POST' }),
  getDailyReport: () => request<DailyReport>('/reports/daily'),
  getIntegrations: () => request<Integration[]>('/integrations'),
  pauseAgent: () => request('/agent/pause', { method: 'POST' }),
  resumeAgent: () => request('/agent/resume', { method: 'POST' }),
  uploadResume: async (regionCode: string, file: File): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('region_code', regionCode);
    const res = await fetch(`${API_BASE}/resumes`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }
    return (await res.json()) as Resume;
  },
  triggerRun: () => request<{ run_id: string; status: string; jobs_discovered: number; jobs_matched: number; started_at: string }>('/agent/runs', { method: 'POST' }),

  getRunStatus: (runId: string) =>
    request<{ run_id: string; status: string; jobs_discovered: number; jobs_matched: number; errors: string[]; completed_at?: string }>(`/agent/runs/${runId}`),

  triggerRunAndPoll: async (onProgress?: (msg: string) => void): Promise<{ jobs_discovered: number; jobs_matched: number; errors: string[] }> => {
    try {
      const run = await api.triggerRun();
      const runId = run?.run_id;
      if (!runId) return { jobs_discovered: 0, jobs_matched: 0, errors: [] };
      onProgress?.(`Discovery started (${runId.slice(0, 8)}…)`);

      const maxWait = 120_000;
      const pollInterval = 3_000;
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const status = await api.getRunStatus(runId);
        onProgress?.(`${status.status} — found ${status.jobs_discovered} jobs…`);
        if (status.status === 'completed' || status.status === 'failed') {
          return {
            jobs_discovered: status.jobs_discovered,
            jobs_matched: status.jobs_matched,
            errors: status.errors ?? []
          };
        }
      }
    } catch (e) {
      console.warn('Pipeline run error', e);
    }
    return { jobs_discovered: 0, jobs_matched: 0, errors: [] };
  },

  // ── Gmail OAuth ──────────────────────────────────────────────────────────────
  /** Fetch live Gmail connection status from backend */
  getGmailStatus: () =>
    request<GmailStatus>('/integrations/gmail/status', undefined, { connected: false }),

  /** Kick off Google OAuth consent flow — redirects the browser to Google */
  connectGmail: () => {
    // The backend issues a redirect to Google; open in same tab so we handle the callback
    window.location.href = `${API_BASE}/integrations/gmail/connect`;
  },

  /** Disconnect Gmail (revoke tokens + clear DB record) */
  disconnectGmail: () =>
    request<{ success: boolean; message: string }>('/integrations/gmail/disconnect', { method: 'DELETE' }),

  /** Send a test email to verify the connection is working */
  sendTestEmail: () =>
    request<TestEmailResult>('/integrations/gmail/test-email', { method: 'POST' }),

  /** Get today's quota usage for the connected account */
  getGmailQuota: () =>
    request<GmailQuota>('/integrations/quota/status'),


  // ── CRM Leads, Deals & Pipeline ───────────────────────────────────────────

  getLeads: () => request<CrmLead[]>('/crm/leads', undefined, DEMO_LEADS),

  createLead: (data: Partial<CrmLead>) => request<CrmLead>('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),

  updateLead: (id: string, data: Partial<CrmLead>) => request<CrmLead>('/crm/leads/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  deleteLead: (id: string) => request<{ status: string; deleted: string }>('/crm/leads/' + id, { method: 'DELETE' }),



  getDeals: () => request<CrmDeal[]>('/crm/deals', undefined, DEMO_DEALS),

  createDeal: (data: Partial<CrmDeal>) => request<CrmDeal>('/crm/deals', { method: 'POST', body: JSON.stringify(data) }),

  updateDeal: (id: string, data: Partial<CrmDeal>) => request<CrmDeal>('/crm/deals/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  deleteDeal: (id: string) => request<{ status: string; deleted: string }>('/crm/deals/' + id, { method: 'DELETE' }),



  getActivities: (leadId?: string, dealId?: string) => {

    let q = '';

    if (leadId) q += '?lead_id=' + leadId;

    else if (dealId) q += '?deal_id=' + dealId;

    return request<CrmActivity[]>('/crm/activities' + q, undefined, []);

  },

  createActivity: (data: Partial<CrmActivity>) => request<CrmActivity>('/crm/activities', { method: 'POST', body: JSON.stringify(data) }),



  // ── Billing & Subscriptions ───────────────────────────────────────────────

  getBillingPlans: () => request<SubscriptionPlan[]>('/billing/plans', undefined, DEMO_PLANS),

  getCurrentBilling: () => request<{

    plan: SubscriptionPlan;

    subscription: UserSubscription;

    usage: {

      applications_used_today: number;

      applications_daily_limit: number;

      active_team_members: number;

      max_team_seats: number;

      days_remaining_in_cycle: number;

    };

  }>('/billing/current', undefined, {

    plan: DEMO_PLANS[1],

    subscription: {

      id: 'sub-demo-1',

      organization_id: 'org-demo-1',

      plan_id: 'pro',

      status: 'active',

      billing_cycle: 'monthly',

      current_period_start: new Date(Date.now() - 86400000 * 10).toISOString(),

      current_period_end: new Date(Date.now() + 86400000 * 20).toISOString(),

      cancel_at_period_end: false

    },

    usage: {

      applications_used_today: 12,

      applications_daily_limit: 50,

      active_team_members: 3,

      max_team_seats: 5,

      days_remaining_in_cycle: 20

    }

  }),

  upgradePlan: (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') =>

    request<{ success: boolean; message: string; plan_id: string; billing_cycle: string }>(

      '/billing/upgrade',

      { method: 'POST', body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }) }

    ),

  getInvoices: () => request<Invoice[]>('/billing/invoices', undefined, DEMO_INVOICES),



  // ── Workspaces & Team Seats ───────────────────────────────────────────────

  getWorkspace: () => request<{ organization: Organization; members: WorkspaceMember[]; seat_usage: { used: number; max: number } }>(

    '/workspaces/current',

    undefined,

    {

      organization: {

        id: 'org-demo-1',

        name: 'Apex Talent Recruitment ERP',

        slug: 'apex-talent',

        owner_id: 'user-talha-1',

        current_plan_id: 'pro',

        created_at: new Date().toISOString()

      },

      members: DEMO_MEMBERS,

      seat_usage: { used: 3, max: 5 }

    }

  ),

  getWorkspaceMembers: () => request<WorkspaceMember[]>('/workspaces/members', undefined, DEMO_MEMBERS),

  inviteWorkspaceMember: (name: string, email: string, role: string = 'recruiter') =>

    request<WorkspaceMember>('/workspaces/members', { method: 'POST', body: JSON.stringify({ name, email, role }) }),

  removeWorkspaceMember: (memberId: string) =>

    request<{ status: string; removed: string }>('/workspaces/members/' + memberId, { method: 'DELETE' }),

};
