import { Job, Application, Resume, Region, Integration, DailyReport } from '../types';

export const FIGMA_CANDIDATE = {
  name: 'Talha Aftab Alam',
  email: 'talha@jobpilot.ai',
  role: 'Candidate • Global',
  initials: 'TA'
};

export const FIGMA_DESIGN_SYSTEM = {
  colors: [
    { name: 'Maroon (Primary)', hex: '#641E32', text: '#FFFFFF', desc: 'Primary CTAs, Active Nav, Badges' },
    { name: 'Maroon (Secondary)', hex: '#87364F', text: '#FFFFFF', desc: 'Hover states, Accents' },
    { name: 'Deep Maroon', hex: '#431321', text: '#FFFFFF', desc: 'Headers, High Contrast' },
    { name: 'Black', hex: '#171717', text: '#FFFFFF', desc: 'Dark Sidebar, Primary Text' },
    { name: 'White', hex: '#FFFFFF', text: '#202020', desc: 'Card Backgrounds' },
    { name: 'Background', hex: '#F6F3F4', text: '#202020', desc: 'Main Surface Canvas' },
    { name: 'Border', hex: '#E7E0E3', text: '#202020', desc: 'Card and Divider Borders' },
    { name: 'Subtle Maroon', hex: '#F5E9ED', text: '#641E32', desc: 'Soft Accent Highlights' },
  ],
  statusColors: [
    { name: 'Success', hex: '#16845B', bg: '#ECFDF5' },
    { name: 'Warning', hex: '#B7791F', bg: '#FEF3C7' },
    { name: 'Error', hex: '#C53030', bg: '#FEE2E2' },
  ],
  typography: [
    { level: 'H1', spec: '32/40 Bold', role: 'Headline' },
    { level: 'H2', spec: '24/32 Semibold', role: 'Section Title' },
    { level: 'H3', spec: '18/26 Semibold', role: 'Card Title' },
    { level: 'Body', spec: '14/22 Regular', role: 'Body Text' },
    { level: 'Small', spec: '12/18 Regular', role: 'Secondary Text' },
    { level: 'Caption', spec: '11/16 Regular', role: 'Labels / Metadata' },
  ],
  spacing: ['4px', '8px', '12px', '16px', '24px', '32px']
};

export const FIGMA_TASKS = {
  inProgress: [
    {
      id: 't-1',
      title: 'Job searches running',
      subtitle: '3 active searches (EU, Germany, US)',
      priority: 'High',
      priorityColor: 'bg-red-50 text-red-700 border-red-200',
      actionTab: 'jobs'
    },
    {
      id: 't-2',
      title: 'Matches awaiting review',
      subtitle: '12 new high-affinity matches detected',
      priority: 'High',
      priorityColor: 'bg-red-50 text-red-700 border-red-200',
      actionTab: 'jobs'
    },
    {
      id: 't-3',
      title: 'Applications ready to send',
      subtitle: '4 customized emails queued for review',
      priority: 'Med',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      actionTab: 'applications'
    },
    {
      id: 't-4',
      title: 'Follow-ups due',
      subtitle: '2 follow-ups require response',
      priority: 'Med',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      actionTab: 'calendar'
    },
    {
      id: 't-5',
      title: 'Failed actions',
      subtitle: '1 application sync error resolved',
      priority: '',
      priorityColor: '',
      actionTab: 'applications'
    }
  ],
  toDo: [
    {
      id: 't-6',
      title: 'Follow-ups due',
      subtitle: '2 follow-ups require response',
      priority: 'Med',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      actionTab: 'calendar'
    },
    {
      id: 't-7',
      title: 'Failed actions',
      subtitle: '1 application sync error resolved',
      priority: 'Low',
      priorityColor: 'bg-gray-100 text-gray-700 border-gray-200',
      actionTab: 'applications'
    }
  ],
  upcoming: [
    {
      id: 't-8',
      title: 'Technical Interview (TechSolutions)',
      subtitle: 'Oct 1 at 2:00 PM (Remote)',
      priority: 'High',
      priorityColor: 'bg-purple-50 text-purple-700 border-purple-200',
      actionTab: 'calendar'
    },
    {
      id: 't-9',
      title: 'Recruiter Call (NextGen)',
      subtitle: 'Oct 5 at 10:00 AM',
      priority: 'Med',
      priorityColor: 'bg-blue-50 text-blue-700 border-blue-200',
      actionTab: 'calendar'
    }
  ]
};

export const FIGMA_GOALS = [
  { label: 'Jobs discovered', current: 12, max: 50, percent: 24 },
  { label: 'Qualified matches', current: 8, max: 30, percent: 27 },
  { label: 'Applications sent', current: 5, max: 30, percent: 17 },
  { label: 'Profile completion', current: 100, max: 100, percent: 100 }
];

export const FIGMA_PROJECTS = [
  { name: 'German Opportunities', subtitle: '126 matches, 4 position', count: '124 matches' },
  { name: 'Europe Careers', subtitle: '82 matches, 2 positions', count: '67 matches' },
  { name: 'Asia Opportunities', subtitle: '48 matches, 1 position', count: '52 matches' },
  { name: 'Global Remote Jobs', subtitle: '38 matches, 1 position', count: '36 matches' },
];

export const FIGMA_CALENDAR_ITEMS = [
  { dateMonth: 'Apr', dateDay: '14', title: 'Interview', meta: 'TechSolutions (Senior Dev)', time: '2:00 PM' },
  { dateMonth: 'Apr', dateDay: '18', title: 'Follow-up', meta: 'ABC Solutions (Email)', time: '10:00 AM' },
  { dateMonth: 'Apr', dateDay: '23', title: 'Recruiter Call', meta: 'City Tech (Phone)', time: '3:30 PM' },
  { dateMonth: 'Apr', dateDay: '28', title: 'Deadline', meta: 'Global Solutions (Portal)', time: '11:59 PM' }
];

export const FIGMA_RECENT_ACTIVITY = [
  { type: 'match', title: 'New match found', detail: 'Senior Python Developer at TechSolutions', time: '10m ago', dotColor: 'bg-[#16845B]' },
  { type: 'sync', title: 'Database sync completed', detail: '48 new jobs indexed from LinkedIn', time: '1h ago', dotColor: 'bg-blue-500' },
  { type: 'email', title: 'Email follow-up sent', detail: 'Follow-up sent to NextGen recruiter', time: '3h ago', dotColor: 'bg-purple-500' }
];

export const FIGMA_JOBS: Job[] = [
  {
    id: 'job-1',
    canonical_url: 'https://techsolutions.de/careers/senior-python-dev',
    company_name: 'TechSolutions',
    title: 'Senior Python Developer',
    location: 'Germany • Remote • Full-time',
    country_code: 'DE',
    region_code: 'EU',
    description: 'We are looking for a Senior Python Developer to join our growing team. You will work on exciting projects, build scalable applications and collaborate with a talented team of engineers.',
    requirements: [
      'Develop and maintain scalable web applications',
      'Work with cross-functional teams',
      'Optimize application performance',
      'Participate in code reviews and technical discussions'
    ],
    work_arrangement: 'remote',
    salary_min: 120000,
    salary_max: 160000,
    salary_currency: 'EUR',
    published_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    source_name: 'TechCareers EU',
    match: {
      overall_score: 95,
      title_score: 20,
      skills_score: 18,
      experience_score: 19,
      location_score: 20,
      salary_score: 19,
      freshness_score: 19,
      is_eligible: true,
      matching_skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
      missing_skills: ['Kubernetes', 'Terraform'],
      explanation: '95% Match: Skills 18/20, Experience 19/20, Location 20/20, Salary 19/20, Education 19/20'
    },
    contacts: [
      {
        id: 'c-1',
        name: 'TechSolutions Hiring Team',
        email: 'talent@techsolutions.de',
        role: 'Recruitment Lead',
        verification_status: 'verified',
        verification_method: 'corporate_email'
      }
    ]
  },
  {
    id: 'job-2',
    canonical_url: 'https://nextgen.nl/careers/frontend-developer-react',
    company_name: 'NextGen',
    title: 'Frontend Developer (React)',
    location: 'Netherlands • Hybrid • Full-time',
    country_code: 'NL',
    region_code: 'EU',
    description: 'NextGen is hiring a Frontend Developer specializing in React, TypeScript, and modern component design systems.',
    requirements: [
      'Build responsive UI with React and TypeScript',
      'Implement design systems with Tailwind CSS',
      'Coordinate with backend teams'
    ],
    work_arrangement: 'hybrid',
    salary_min: 80000,
    salary_max: 105000,
    salary_currency: 'EUR',
    published_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    source_name: 'LinkedIn Jobs',
    match: {
      overall_score: 89,
      title_score: 18,
      skills_score: 19,
      experience_score: 18,
      location_score: 18,
      salary_score: 16,
      freshness_score: 18,
      is_eligible: true,
      matching_skills: ['React', 'TypeScript', 'Tailwind'],
      missing_skills: ['GraphQL'],
      explanation: '89% Match: Strong frontend component architecture alignment.'
    },
    contacts: []
  },
  {
    id: 'job-3',
    canonical_url: 'https://clouddata.ca/jobs/data-scientist',
    company_name: 'CloudData',
    title: 'Data Scientist',
    location: 'Canada • On-site • Full-time',
    country_code: 'CA',
    region_code: 'ASIA',
    description: 'Transform big data into actionable insights with Python, Machine Learning, and distributed SQL analytics.',
    requirements: [
      'Deploy machine learning models to production',
      'Optimize query pipelines',
      'Build predictive algorithms'
    ],
    work_arrangement: 'onsite',
    salary_min: 110000,
    salary_max: 135000,
    salary_currency: 'CAD',
    published_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    source_name: 'Indeed Global',
    match: {
      overall_score: 87,
      title_score: 18,
      skills_score: 17,
      experience_score: 18,
      location_score: 17,
      salary_score: 17,
      freshness_score: 17,
      is_eligible: true,
      matching_skills: ['Python', 'Machine Learning', 'SQL'],
      missing_skills: ['PySpark'],
      explanation: '87% Match: High quantitative Python and machine learning match.'
    },
    contacts: []
  },
  {
    id: 'job-4',
    canonical_url: 'https://webworks.ae/careers/fullstack',
    company_name: 'WebWorks',
    title: 'Full Stack Developer',
    location: 'UAE • Remote • Full-time',
    country_code: 'AE',
    region_code: 'ARAB',
    description: 'Full stack development with React, Node.js, and cloud backend architecture.',
    requirements: [
      'Deliver end-to-end full stack web applications',
      'Manage cloud infrastructure and deployments'
    ],
    work_arrangement: 'remote',
    salary_min: 25000,
    salary_max: 32000,
    salary_currency: 'AED',
    published_at: new Date(Date.now() - 120 * 3600000).toISOString(),
    source_name: 'NaukriGulf',
    match: {
      overall_score: 85,
      title_score: 17,
      skills_score: 18,
      experience_score: 17,
      location_score: 17,
      salary_score: 16,
      freshness_score: 17,
      is_eligible: true,
      matching_skills: ['React', 'Node.js', 'PostgreSQL'],
      missing_skills: ['Kubernetes'],
      explanation: '85% Match: Verified against Arab region profile.'
    },
    contacts: []
  },
  {
    id: 'job-5',
    canonical_url: 'https://innovatelab.co.uk/careers/ai-engineer',
    company_name: 'InnovateLab',
    title: 'AI Engineer',
    location: 'UK • Remote • Full-time',
    country_code: 'GB',
    region_code: 'EU',
    description: 'Build generative AI agents, LLM pipelines, and automated reasoning systems.',
    requirements: [
      'Implement multi-agent workflows',
      'Optimize LLM inference latency'
    ],
    work_arrangement: 'remote',
    salary_min: 75000,
    salary_max: 95000,
    salary_currency: 'GBP',
    published_at: new Date(Date.now() - 144 * 3600000).toISOString(),
    source_name: 'Google Jobs UK',
    match: {
      overall_score: 78,
      title_score: 16,
      skills_score: 16,
      experience_score: 15,
      location_score: 16,
      salary_score: 15,
      freshness_score: 16,
      is_eligible: true,
      matching_skills: ['Python', 'LLMs', 'PyTorch'],
      missing_skills: ['CUDA'],
      explanation: '78% Match: Meets threshold for autonomous AI roles.'
    },
    contacts: []
  },
  {
    id: 'job-6',
    canonical_url: 'https://dataforge.us/jobs/ml-engineer',
    company_name: 'DataForge',
    title: 'Machine Learning Engineer',
    location: 'USA • Hybrid • Full-time',
    country_code: 'US',
    region_code: 'ASIA',
    description: 'Develop and deploy machine learning models at scale.',
    requirements: [
      'Scale model training with distributed PyTorch',
      'Package models into Docker containers'
    ],
    work_arrangement: 'hybrid',
    salary_min: 130000,
    salary_max: 165000,
    salary_currency: 'USD',
    published_at: new Date(Date.now() - 168 * 3600000).toISOString(),
    source_name: 'Indeed USA',
    match: {
      overall_score: 72,
      title_score: 14,
      skills_score: 15,
      experience_score: 14,
      location_score: 15,
      salary_score: 14,
      freshness_score: 14,
      is_eligible: false,
      matching_skills: ['Machine Learning', 'Python', 'Docker'],
      missing_skills: ['TensorFlow', 'Kubernetes'],
      explanation: '72% Match: Below 75% threshold due to on-site US requirement.'
    },
    contacts: []
  }
];

export const FIGMA_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    job_id: 'job-1',
    job_title: 'Senior Python Developer',
    company_name: 'TechSolutions',
    region_code: 'EU',
    status: 'interview',
    channel: 'email',
    email_subject: 'Application for Senior Python Developer at TechSolutions',
    retry_count: 0,
    created_at: '2025-04-22T10:00:00.000Z'
  },
  {
    id: 'app-2',
    job_id: 'job-2',
    job_title: 'Frontend Developer',
    company_name: 'NextGen',
    region_code: 'EU',
    status: 'submitted',
    channel: 'email',
    email_subject: 'Application for Frontend Developer at NextGen',
    retry_count: 0,
    created_at: '2025-04-20T14:30:00.000Z'
  },
  {
    id: 'app-3',
    job_id: 'job-3',
    job_title: 'Data Scientist',
    company_name: 'CloudData',
    region_code: 'ASIA',
    status: 'ready_for_review',
    channel: 'portal',
    retry_count: 0,
    created_at: '2025-04-18T09:15:00.000Z'
  },
  {
    id: 'app-4',
    job_id: 'job-4',
    job_title: 'Full Stack Developer',
    company_name: 'WebWorks',
    region_code: 'ARAB',
    status: 'sent',
    channel: 'email',
    retry_count: 0,
    created_at: '2025-04-16T11:45:00.000Z'
  },
  {
    id: 'app-5',
    job_id: 'job-5',
    job_title: 'AI Engineer',
    company_name: 'InnovateLab',
    region_code: 'EU',
    status: 'interview',
    channel: 'email',
    retry_count: 0,
    created_at: '2025-04-14T16:20:00.000Z'
  },
  {
    id: 'app-6',
    job_id: 'job-6',
    job_title: 'Machine Learning Eng.',
    company_name: 'DataForge',
    region_code: 'ASIA',
    status: 'rejected',
    channel: 'portal',
    retry_count: 0,
    created_at: '2025-04-12T13:10:00.000Z'
  }
];

export const FIGMA_RESUMES: Resume[] = [
  {
    id: 'res-pk',
    filename: 'Talha_Aftab_CV_Pakistan.pdf',
    storage_path: 'user-default/PK/Talha_Aftab_CV_Pakistan.pdf',
    file_size_bytes: 2516582, // 2.4 MB
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: '2025-04-18T10:00:00.000Z',
    skills_extracted: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS']
  },
  {
    id: 'res-eu',
    filename: 'Talha_Aftab_CV_Europe.pdf',
    storage_path: 'user-default/EU/Talha_Aftab_CV_Europe.pdf',
    file_size_bytes: 2726297, // 2.6 MB
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: '2025-04-18T10:00:00.000Z',
    skills_extracted: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS']
  },
  {
    id: 'res-asia',
    filename: 'Talha_Aftab_CV_Asia.pdf',
    storage_path: 'user-default/ASIA/Talha_Aftab_CV_Asia.pdf',
    file_size_bytes: 2306867, // 2.2 MB
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: '2025-04-05T10:00:00.000Z',
    skills_extracted: ['Python', 'Machine Learning', 'SQL']
  },
  {
    id: 'res-arab',
    filename: 'Talha_Aftab_CV_Arab.pdf',
    storage_path: 'user-default/ARAB/Talha_Aftab_CV_Arab.pdf',
    file_size_bytes: 2621440, // 2.5 MB
    mime_type: 'application/pdf',
    version: 1,
    is_active: true,
    created_at: '2025-04-02T10:00:00.000Z',
    skills_extracted: ['Python', 'FastAPI', 'Cloud Architecture']
  }
];

export const FIGMA_INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'talha@jobpilot.ai',
    status: 'connected',
    account: 'talha@jobpilot.ai',
    required_for: 'Email Dispatch'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'EU-central-1',
    status: 'connected',
    account: 'EU-central-1',
    required_for: 'Database & CV Vault'
  },
  {
    id: 'job_sources',
    name: 'Job Sources',
    description: 'LinkedIn, Indeed, 3 more',
    status: 'connected',
    account: 'LinkedIn, Indeed, 3 more',
    required_for: 'Job Discovery'
  },
  {
    id: 'ai_provider',
    name: 'OpenAI',
    description: 'gpt-4o',
    status: 'connected',
    account: 'gpt-4o',
    required_for: 'AI Matching'
  }
];

export const FIGMA_ANALYTICS_DATA = {
  stats: [
    { label: 'Jobs Discovered', value: '248', change: '+12%', isUp: true },
    { label: 'Matches', value: '86', change: '+8%', isUp: true },
    { label: 'Applications', value: '42', change: '+16%', isUp: true },
    { label: 'Interviews', value: '8', change: '+3%', isUp: true }
  ],
  statusDonut: [
    { label: 'Applied', percent: 38, color: '#641E32' },
    { label: 'Interview', percent: 19, color: '#87364F' },
    { label: 'Offer', percent: 14, color: '#16845B' },
    { label: 'Rejected', percent: 14, color: '#C53030' },
    { label: 'Pending', percent: 10, color: '#B7791F' },
    { label: 'Others', percent: 5, color: '#737373' }
  ],
  regionBars: [
    { name: 'Europe', percent: 42, color: '#641E32' },
    { name: 'Arab Region', percent: 28, color: '#87364F' },
    { name: 'North America', percent: 18, color: '#431321' },
    { name: 'Pakistan', percent: 8, color: '#16845B' },
    { name: 'Asia', percent: 4, color: '#B7791F' }
  ]
};

export const FIGMA_EMAIL_TEMPLATES_LIST = [
  {
    id: 'general',
    name: 'General Application',
    subject: 'Application for [job_title] at [company_name]',
    body: `Dear Hiring Manager,

I am writing to express my interest in the [job_title] position at [company_name].

With my background in [skills], I am excited about the opportunity to contribute to your engineering team.

Attached is my tailored CV for your consideration.

Best regards,
Talha Aftab Alam`
  },
  {
    id: 'followup',
    name: 'Follow Up',
    subject: 'Following up on my application for [job_title] at [company_name]',
    body: `Dear Hiring Team,

I wanted to follow up on my recent application for the [job_title] role at [company_name]. I remain very enthusiastic about the opportunity to contribute my expertise in [skills].

Please let me know if you need any additional information.

Best regards,
Talha Aftab Alam`
  },
  {
    id: 'thankyou',
    name: 'Interview Thank You',
    subject: 'Thank you for the interview — [job_title] at [company_name]',
    body: `Dear Interview Team,

Thank you for taking the time to speak with me today about the [job_title] role at [company_name]. I really enjoyed learning more about the team's engineering goals and technical roadmap.

Looking forward to hearing from you.

Best regards,
Talha Aftab Alam`
  },
  {
    id: 'rejection',
    name: 'Rejection Response',
    subject: 'Thank you for the update — [candidate_name]',
    body: `Dear Hiring Team,

Thank you for informing me regarding the status of the [job_title] role. While disappointed, I appreciate your consideration and hope we can stay connected for future opportunities.

Best regards,
Talha Aftab Alam`
  }
];

export const FIGMA_VARIABLES = [
  '[job_title]',
  '[company_name]',
  '[skills]',
  '[location]',
  '[experience]',
  '[my_name]'
];
