/**
 * Mobile API client for JobPilot AI
 * Connects to FastAPI backend running on LAN (192.168.0.100:8000).
 * All API functions log errors to console for debugging.
 */

let customApiHost = 'http://192.168.0.100:8000';
const API_PREFIX = '/api/v1';

// Helper: relative time from ISO string
function timeAgo(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

// Helper: format salary from min/max + currency
function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min) return 'Competitive';
  const sym = currency === 'PKR' ? 'PKR ' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  const fmtMin = min >= 1000 ? `${Math.round(min / 1000)}k` : String(min);
  const fmtMax = max && max >= 1000 ? `${Math.round(max / 1000)}k` : max ? String(max) : '';
  return fmtMax ? `${sym}${fmtMin} – ${sym}${fmtMax}` : `${sym}${fmtMin}+`;
}

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'bypass-tunnel-reminder': 'true'
};

export const setApiHost = (host: string) => {
  customApiHost = host.replace(/\/$/, '');
};

export const getApiHost = () => customApiHost;

export interface MobileJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  country_code: string;
  region_code: 'PK' | 'EU' | 'ASIA' | 'ARAB' | 'GLOBAL';
  work_arrangement: 'remote' | 'hybrid' | 'onsite';
  salary?: string;
  match_score: number;
  published_at: string;
  description?: string;
  matching_skills?: string[];
  missing_skills?: string[];
  canonical_url?: string;
}

export interface MobileApplication {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  status: 'interview' | 'applied' | 'pending' | 'rejected';
  match_score: number;
  applied_date: string;
  channel: string;
}

export interface MobileResume {
  id: string;
  region_code: 'PK' | 'EU' | 'ASIA' | 'ARAB';
  region_name: string;
  flag: string;
  filename: string;
  is_active: boolean;
  skills: string[];
  updated_at: string;
}

export interface MobileReport {
  used_quota: number;
  max_quota: number;
  jobs_discovered_today: number;
  eligible_matches_today: number;
  applications_sent_today: number;
}

export const DEMO_MOBILE_JOBS: MobileJob[] = [
  {
    id: 'job-1',
    title: 'Senior AI Engineer / LLM Agent Architect',
    company_name: 'Synthetix AI Lab',
    location: 'Berlin, Germany',
    country_code: 'DE',
    region_code: 'EU',
    work_arrangement: 'remote',
    salary: '€85,000 - €110,000',
    match_score: 96,
    published_at: '2h ago',
    description: 'Looking for a Senior AI Engineer experienced in building multi-agent autonomous workflows and LLM pipelines using FastAPI and Python.',
    matching_skills: ['Python', 'FastAPI', 'Agentic AI', 'Docker', 'AWS'],
    missing_skills: ['Kubernetes']
  },
  {
    id: 'job-2',
    title: 'Distributed Systems & Cloud Engineer',
    company_name: 'Falcon Cloud Technologies',
    location: 'Dubai, UAE',
    country_code: 'AE',
    region_code: 'ARAB',
    work_arrangement: 'hybrid',
    salary: '$90,000 - $120,000',
    match_score: 94,
    published_at: '5h ago',
    description: 'Build high-throughput distributed microservices for enterprise cloud infrastructure across the GCC region.',
    matching_skills: ['FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
    missing_skills: ['Terraform']
  },
  {
    id: 'job-3',
    title: 'Principal Software Automation Engineer',
    company_name: 'Systems Apex',
    location: 'Lahore, Pakistan',
    country_code: 'PK',
    region_code: 'PK',
    work_arrangement: 'onsite',
    salary: 'PKR 450k - 650k',
    match_score: 92,
    published_at: '1d ago',
    description: 'Lead backend automation and workflow optimization pipelines for enterprise SaaS clients.',
    matching_skills: ['Python', 'FastAPI', 'PostgreSQL', 'CI/CD']
  },
  {
    id: 'job-4',
    title: 'Staff Python / Backend AI Architect',
    company_name: 'FinLeap Global',
    location: 'London, United Kingdom',
    country_code: 'GB',
    region_code: 'EU',
    work_arrangement: 'remote',
    salary: '£80,000 - £100,000',
    match_score: 91,
    published_at: '1d ago',
    description: 'Architect scalable AI backend services and automated evaluation pipelines.',
    matching_skills: ['Python', 'FastAPI', 'REST APIs', 'Supabase']
  },
  {
    id: 'job-5',
    title: 'Full Stack AI Solutions Developer',
    company_name: 'Nexus Tech Asia',
    location: 'Singapore',
    country_code: 'SG',
    region_code: 'ASIA',
    work_arrangement: 'remote',
    salary: '$100,000 - $130,000',
    match_score: 88,
    published_at: '2d ago',
    description: 'Develop next-generation AI interfaces with React, TypeScript, and FastAPI.',
    matching_skills: ['React', 'TypeScript', 'Python', 'TailwindCSS']
  }
];

export const DEMO_MOBILE_APPLICATIONS: MobileApplication[] = [
  {
    id: 'app-1',
    job_title: 'Senior AI Engineer',
    company_name: 'TechSolutions Inc.',
    location: 'Berlin, Germany',
    status: 'interview',
    match_score: 95,
    applied_date: 'Oct 24, 2026',
    channel: 'Email (Europe CV)'
  },
  {
    id: 'app-2',
    job_title: 'Staff Backend Architect',
    company_name: 'Synthetix AI Lab',
    location: 'Remote',
    status: 'interview',
    match_score: 96,
    applied_date: 'Oct 23, 2026',
    channel: 'Email (Europe CV)'
  },
  {
    id: 'app-3',
    job_title: 'Distributed Cloud Engineer',
    company_name: 'Falcon Cloud Dubai',
    location: 'Dubai, UAE',
    status: 'applied',
    match_score: 94,
    applied_date: 'Oct 22, 2026',
    channel: 'Email (Arab CV)'
  },
  {
    id: 'app-4',
    job_title: 'Principal Software Engineer',
    company_name: 'Systems Apex',
    location: 'Lahore, Pakistan',
    status: 'pending',
    match_score: 92,
    applied_date: 'Oct 21, 2026',
    channel: 'Email (Pakistan CV)'
  },
  {
    id: 'app-5',
    job_title: 'Lead Python Developer',
    company_name: 'DataWeave Global',
    location: 'Singapore',
    status: 'rejected',
    match_score: 82,
    applied_date: 'Oct 15, 2026',
    channel: 'Portal'
  }
];

export const DEMO_MOBILE_RESUMES: MobileResume[] = [
  {
    id: 'res-pk',
    region_code: 'PK',
    region_name: 'Pakistan',
    flag: '🇵🇰',
    filename: 'Talha_Aftab_Alam_Resume_PK.pdf',
    is_active: true,
    skills: ['Python', 'FastAPI', 'Agentic AI', 'PostgreSQL'],
    updated_at: 'Oct 2026'
  },
  {
    id: 'res-eu',
    region_code: 'EU',
    region_name: 'Europe',
    flag: '🇪🇺',
    filename: 'Talha_Aftab_Alam_CV_Europass.pdf',
    is_active: true,
    skills: ['Python', 'FastAPI', 'Docker', 'AWS', 'LLMs'],
    updated_at: 'Oct 2026'
  },
  {
    id: 'res-asia',
    region_code: 'ASIA',
    region_name: 'Asia',
    flag: '🌏',
    filename: 'Talha_Aftab_Alam_Resume_Asia.pdf',
    is_active: true,
    skills: ['Full Stack', 'Python', 'React', 'FastAPI'],
    updated_at: 'Oct 2026'
  },
  {
    id: 'res-arab',
    region_code: 'ARAB',
    region_name: 'Arab Region',
    flag: '🇦🇪',
    filename: 'Talha_Aftab_Alam_CV_Gulf.pdf',
    is_active: true,
    skills: ['Cloud Architecture', 'Python', 'FastAPI', 'Microservices'],
    updated_at: 'Oct 2026'
  }
];

export const mobileApi = {
  /**
   * Fetch jobs from backend. Falls back to DEMO only if network fails.
   * Backend response: array of job objects with nested `match` object.
   */
  getJobs: async (region?: string): Promise<MobileJob[]> => {
    try {
      const url = region && region !== 'ALL'
        ? `${customApiHost}${API_PREFIX}/jobs?limit=50&region=${region}`
        : `${customApiHost}${API_PREFIX}/jobs?limit=50`;
      console.log('[API] getJobs →', url);
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      console.log('[API] getJobs status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();
      console.log('[API] getJobs count:', data.length);
      return data.map((j: any) => ({
        id: j.id,
        title: j.title,
        company_name: j.company_name,
        location: j.location || 'Remote',
        country_code: j.country_code || '',
        region_code: (j.region_code as any) || 'GLOBAL',
        work_arrangement: (j.work_arrangement as any) || 'remote',
        salary: formatSalary(j.salary_min, j.salary_max, j.salary_currency),
        match_score: Math.round(j.match?.overall_score ?? 0),
        published_at: j.published_at ? timeAgo(j.published_at) : 'Recently',
        description: j.description || '',
        matching_skills: j.match?.matching_skills ?? [],
        missing_skills: j.match?.missing_skills ?? [],
        canonical_url: j.canonical_url,
      }));
    } catch (err) {
      console.error('[API] getJobs FAILED:', err);
    }
    console.warn('[API] getJobs → using DEMO data');
    return DEMO_MOBILE_JOBS;
  },

  /**
   * Fetch applications from backend.
   * Backend response: array with id, job_title, company_name, status, channel, sent_at, etc.
   */
  getApplications: async (): Promise<MobileApplication[]> => {
    try {
      const url = `${customApiHost}${API_PREFIX}/applications?limit=100`;
      console.log('[API] getApplications →', url);
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      console.log('[API] getApplications status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();
      console.log('[API] getApplications count:', data.length);
      // Backend may return wrapped {value: [...]} or raw array
      const list = Array.isArray(data) ? data : (data as any).value ?? [];
      if (list.length === 0) {
        console.warn('[API] getApplications → empty array from backend → using DEMO');
        return DEMO_MOBILE_APPLICATIONS;
      }
      return list.map((a: any) => ({
        id: a.id,
        job_title: a.job_title || 'Untitled',
        company_name: a.company_name || 'Unknown',
        location: a.location || a.region_code || 'Remote',
        status: a.status === 'sent' ? 'applied'
               : a.status === 'failed' ? 'rejected'
               : a.status === 'interview' ? 'interview'
               : 'pending',
        match_score: a.match_score ?? 0,
        applied_date: a.sent_at
          ? new Date(a.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : a.created_at
          ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent',
        channel: a.channel === 'email' ? `Email (${a.region_code ?? ''} CV)` : a.channel || 'Portal',
      }));
    } catch (err) {
      console.error('[API] getApplications FAILED:', err);
    }
    console.warn('[API] getApplications → using DEMO data');
    return DEMO_MOBILE_APPLICATIONS;
  },

  /**
   * Fetch resumes from backend. Falls back to DEMO if none found.
   */
  getResumes: async (): Promise<MobileResume[]> => {
    try {
      const url = `${customApiHost}${API_PREFIX}/resumes`;
      console.log('[API] getResumes →', url);
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      console.log('[API] getResumes status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any[] = await res.json();
      const list = Array.isArray(data) ? data : (data as any).value ?? [];
      if (list.length > 0) {
        return list.map((r: any) => ({
          id: r.id,
          region_code: r.region_code,
          region_name: r.region_name || r.region_code,
          flag: r.flag || '📄',
          filename: r.filename || r.file_name || 'resume.pdf',
          is_active: r.is_active ?? true,
          skills: r.skills ?? [],
          updated_at: r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent',
        }));
      }
    } catch (err) {
      console.error('[API] getResumes FAILED:', err);
    }
    console.warn('[API] getResumes → using DEMO data');
    return DEMO_MOBILE_RESUMES;
  },

  /**
   * Fetch daily quota report.
   * Backend: GET /api/v1/reports/daily → {date, used_quota, max_quota, jobs_discovered_today, ...}
   */
  getQuota: async (): Promise<MobileReport> => {
    try {
      const url = `${customApiHost}${API_PREFIX}/reports/daily`;
      console.log('[API] getQuota →', url);
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      console.log('[API] getQuota status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[API] getQuota data:', JSON.stringify(data));
      // Compute total jobs discovered across all regions if field is 0
      const regionJobs = data.region_breakdown
        ? Object.values(data.region_breakdown as Record<string, any>).reduce((sum: number, r: any) => sum + (r.jobs_discovered || 0), 0)
        : 0;
      return {
        used_quota: data.used_quota ?? 0,
        max_quota: data.max_quota ?? 30,
        jobs_discovered_today: data.jobs_discovered_today || regionJobs,
        eligible_matches_today: data.eligible_matches_today ?? 0,
        applications_sent_today: data.applications_sent_today ?? 0,
      };
    } catch (err) {
      console.error('[API] getQuota FAILED:', err);
    }
    return { used_quota: 0, max_quota: 30, jobs_discovered_today: 0, eligible_matches_today: 0, applications_sent_today: 0 };
  },

  /**
   * Trigger job discovery agent run.
   */
  triggerDiscovery: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${customApiHost}${API_PREFIX}/agent/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_type: 'full_discovery' })
      });
      console.log('[API] triggerDiscovery status:', res.status);
      return res.ok;
    } catch (err) {
      console.error('[API] triggerDiscovery FAILED:', err);
      return false;
    }
  },

  /**
   * Health check — ping backend.
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${customApiHost}${API_PREFIX}/health`, { headers: DEFAULT_HEADERS });
      console.log('[API] healthCheck status:', res.status);
      return res.ok;
    } catch (err) {
      console.error('[API] healthCheck FAILED:', err);
      return false;
    }
  },
};
