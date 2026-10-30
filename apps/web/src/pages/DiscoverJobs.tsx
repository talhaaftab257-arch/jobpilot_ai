import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
} from 'lucide-react';
import { Job } from '../types';

interface DiscoverJobsProps {
  jobs?: Job[];
  savedJobIds: Set<string>;
  onToggleSaveJob: (jobId: string) => void;
  onSelectJob: (job: Job) => void;
}

const REGIONS = [
  { id: 'all', label: 'All Regions' },
  { id: 'PK', label: 'Pakistan' },
  { id: 'EU', label: 'Europe' },
  { id: 'ASIA', label: 'Asia' },
  { id: 'ARAB', label: 'Arab Region' },
] as const;

const getCompanyBadgeClass = (name: string) => {
  const palette = [
    'bg-[#0F766E] text-white',
    'bg-[#1D4ED8] text-white',
    'bg-[#C2410C] text-white',
    'bg-[#0D9488] text-white',
    'bg-[#641E32] text-white',
    'bg-[#171717] text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % palette.length;
  return palette[hash];
};

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export const DiscoverJobs: React.FC<DiscoverJobsProps> = ({
  jobs = [],
  savedJobIds,
  onToggleSaveJob,
  onSelectJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [workFilter, setWorkFilter] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length, PK: 0, EU: 0, ASIA: 0, ARAB: 0 };
    jobs.forEach((j) => {
      const r = (j.region_code || '').toUpperCase();
      if (r in counts) counts[r] += 1;
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    return jobs.filter((job) => {
      if (regionFilter !== 'all' && (job.region_code || '').toUpperCase() !== regionFilter) {
        return false;
      }
      if (workFilter !== 'all' && job.work_arrangement !== workFilter) return false;
      if (q) {
        const hay = `${job.title} ${job.company_name} ${(job.match?.matching_skills || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (loc && !(job.location || '').toLowerCase().includes(loc)) return false;
      return true;
    });
  }, [jobs, workFilter, searchTerm, location, regionFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="type-h1 text-[#171717]">Find Your Next Opportunity</h1>
        <p className="type-body text-[#737373] mt-1">
          Discover global jobs with AI-powered matching and personalized recommendations.
        </p>
      </div>

      {/* Region tabs — Figma: Pakistan, Europe, Asia, Arab… */}
      <div className="flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => {
          const count = regionCounts[r.id] ?? 0;
          const active = regionFilter === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegionFilter(r.id)}
              className={`px-3.5 py-1.5 rounded-full type-small font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-[#641E32] text-white font-bold shadow-xs'
                  : 'bg-white text-[#737373] border border-[#E7E0E3] hover:text-[#171717]'
              }`}
            >
              {r.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E0E3] p-2.5 sm:p-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <div className="md:col-span-5 flex items-center gap-2.5 px-3 py-2 bg-[#F6F3F4] md:bg-transparent rounded-xl md:border-r md:border-[#E7E0E3]">
            <Search className="w-4 h-4 text-[#737373] shrink-0" />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full type-small bg-transparent outline-none text-[#171717] placeholder-[#737373] font-medium"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2.5 px-3 py-2 bg-[#F6F3F4] md:bg-transparent rounded-xl md:border-r md:border-[#E7E0E3]">
            <MapPin className="w-4 h-4 text-[#737373] shrink-0" />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full type-small bg-transparent outline-none text-[#171717] placeholder-[#737373] font-medium"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2.5 px-3 py-2 type-small text-[#737373]">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="font-medium">All types</span>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="button"
              className="w-full md:w-auto px-6 py-2.5 bg-[#641E32] hover:bg-[#431321] text-white type-small font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 type-small font-semibold">
        {(['remote', 'hybrid', 'onsite'] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWorkFilter(workFilter === w ? 'all' : w)}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer capitalize ${
              workFilter === w
                ? 'bg-[#641E32] text-white border-[#641E32]'
                : 'bg-white text-[#737373] border-[#E7E0E3] hover:text-[#171717]'
            }`}
          >
            {w === 'onsite' ? 'On-site' : w}
          </button>
        ))}
        {['Experience', 'Salary Range', 'Industry'].map((label) => (
          <button
            key={label}
            className="px-3 py-1.5 rounded-xl border bg-white text-[#737373] border-[#E7E0E3] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
          >
            <span>{label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between type-small text-[#737373] pt-2">
        <span className="font-bold text-[#171717] type-body">
          {filteredJobs.length.toLocaleString()} jobs found
          {regionFilter !== 'all' ? ` in ${REGIONS.find((r) => r.id === regionFilter)?.label}` : ''}
        </span>
        <div className="flex items-center gap-1 font-medium">
          <span>Sort: Newest</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-12 text-center shadow-xs space-y-2">
          <h3 className="type-h3 text-[#171717]">No jobs in this region</h3>
          <p className="type-small text-[#737373] max-w-md mx-auto">
            {regionFilter === 'PK' || regionFilter === 'ASIA'
              ? `No ${REGIONS.find((r) => r.id === regionFilter)?.label} jobs in the database yet. Run Discovery (Rozee.pk for Pakistan, Asia-targeted feeds) from Automation, then refresh.`
              : jobs.length === 0
              ? 'No jobs loaded. Run Job Search from Overview or Automation.'
              : 'No jobs match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredJobs.map((job) => {
            const isSaved = savedJobIds.has(job.id);
            const score = job.match?.overall_score;

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="bg-white rounded-2xl border border-[#E7E0E3] hover:border-[#641E32]/40 shadow-xs hover:shadow-md p-5 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold type-small shrink-0 shadow-xs ${getCompanyBadgeClass(
                      job.company_name
                    )}`}
                  >
                    {job.company_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="type-h3 text-[#171717] group-hover:text-[#641E32] transition-colors">
                      {job.title}
                    </h3>
                    <div className="type-caption text-[#737373] font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#171717]">{job.company_name}</span>
                      <span>•</span>
                      <span>{job.location || 'Remote'}</span>
                      {job.region_code && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-[#641E32]">{job.region_code}</span>
                        </>
                      )}
                      {job.work_arrangement && (
                        <>
                          <span>•</span>
                          <span className="capitalize">
                            {job.work_arrangement === 'onsite' ? 'On-site' : job.work_arrangement}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(job.match?.matching_skills?.length
                        ? job.match.matching_skills
                        : job.match?.missing_skills || []
                      )
                        .slice(0, 4)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-0.5 rounded-lg bg-[#F6F3F4] type-caption font-semibold text-[#737373] border border-[#E7E0E3]"
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7E0E3]">
                  {typeof score === 'number' && (
                    <span
                      className={`type-caption font-bold px-2.5 py-0.5 rounded-full border ${
                        score >= 75
                          ? 'bg-[#ECFDF5] text-[#16845B] border-emerald-200'
                          : 'bg-[#F6F3F4] text-[#737373] border-[#E7E0E3]'
                      }`}
                    >
                      {Math.round(score)}% match
                    </span>
                  )}
                  <div className="flex items-center gap-3 type-caption text-[#737373]">
                    <span>{timeAgo(job.published_at)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSaveJob(job.id);
                      }}
                      className="p-1 rounded-lg text-[#737373] hover:text-[#641E32] transition-colors cursor-pointer"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-[#641E32]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiscoverJobs;
