export interface GlobalCountry {
  code: string;
  name: string;
  region: 'PK' | 'ARAB' | 'EU' | 'ASIA' | 'AMER' | 'OCEANIA' | 'GLOBAL';
}

export const GLOBAL_COUNTRIES: GlobalCountry[] = [
  { code: 'ALL', name: 'All Worldwide Markets', region: 'GLOBAL' },
  // Pakistan
  { code: 'PK', name: 'Pakistan', region: 'PK' },
  // Gulf & Middle East
  { code: 'AE', name: 'United Arab Emirates', region: 'ARAB' },
  { code: 'SA', name: 'Saudi Arabia', region: 'ARAB' },
  { code: 'QA', name: 'Qatar', region: 'ARAB' },
  { code: 'OM', name: 'Oman', region: 'ARAB' },
  { code: 'KW', name: 'Kuwait', region: 'ARAB' },
  { code: 'BH', name: 'Bahrain', region: 'ARAB' },
  // United Kingdom & Europe
  { code: 'GB', name: 'United Kingdom', region: 'EU' },
  { code: 'DE', name: 'Germany', region: 'EU' },
  { code: 'NL', name: 'Netherlands', region: 'EU' },
  { code: 'IE', name: 'Ireland', region: 'EU' },
  { code: 'SE', name: 'Sweden', region: 'EU' },
  { code: 'CH', name: 'Switzerland', region: 'EU' },
  { code: 'FR', name: 'France', region: 'EU' },
  // North America
  { code: 'US', name: 'United States', region: 'AMER' },
  { code: 'CA', name: 'Canada', region: 'AMER' },
  // Asia
  { code: 'SG', name: 'Singapore', region: 'ASIA' },
  { code: 'MY', name: 'Malaysia', region: 'ASIA' },
  { code: 'JP', name: 'Japan', region: 'ASIA' },
  { code: 'KR', name: 'South Korea', region: 'ASIA' },
  // Oceania
  { code: 'AU', name: 'Australia', region: 'OCEANIA' },
  { code: 'NZ', name: 'New Zealand', region: 'OCEANIA' },
];

export const POPULAR_KEYWORDS = [
  'AI Engineer',
  'Python Developer',
  'Machine Learning',
  'FastAPI',
  'Remote',
  'Dubai',
  'London',
  'Riyadh',
  'Lahore',
  'Full Stack',
  'LLM Engineer',
  'Cloud Architect'
];
