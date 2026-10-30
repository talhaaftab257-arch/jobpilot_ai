import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  Filter,
  SlidersHorizontal,
  Send,
  Sparkles,
  Globe2,
  ChevronDown,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  ArrowUpDown,
  X
} from 'lucide-react';
import { Job, RegionCode } from '../types';
import { GLOBAL_COUNTRIES, POPULAR_KEYWORDS } from '../data/countries';

interface JobPortalProps {
  jobs: Job[];
  savedJobIds: Set<string>;
  onToggleSaveJob: (jobId: string) => void;
  onPrepareApplication: (job: Job) => void;
}

const REGION_TABS = [
  { id: 'ALL', label: 'All Regions', emoji: '🌍' },
  { id: 'PK', label: 'Pakistan', emoji: '🇵🇰' },
  { id: 'EU', label: 'Europe', emoji: '🇪🇺' },
  { id: 'ASIA', label: 'Asia', emoji: '🌏' },
  { id: 'ARAB', label: 'Arab Region', emoji: '🇦🇪' },
  { id: 'US', label: 'N. America', emoji: '🇺🇸' },
  { id: 'AU', label: 'Australia', emoji: '🇦🇺' },
];

export const JobPortal: React.FC<JobPortalProps> = ({
  jobs,
  savedJobIds,
  onToggleSaveJob,
  onPrepareApplication,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [workArrangement, setWorkArrangement] = useState<string>('all');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'company'>('match');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Region filter
        if (selectedRegion !== 'ALL') {
          const regionCode = job.region_code || job.country_code || '';
          if (regionCode !== selectedRegion) {
            // Also check location text
            const regionTab = REGION_TABS.find(r => r.id === selectedRegion);
            if (regionTab && job.location && !job.location.toLowerCase().includes(regionTab.label.toLowerCase())) {
              return false;
            }
          }
        }

        // Work arrangement
        if (workArrangement !== 'all' && job.work_arrangement !== workArrangement) {
          return false;
        }

        // Min score
        const score = job.match?.overall_score ?? 80;
        if (score < minMatchScore) return false;

        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const inTitle = job.title?.toLowerCase().includes(q);
          const inCompany = job.company_name?.toLowerCase().includes(q);
          const inDesc = job.description?.toLowerCase().includes(q);
          const inSkills = job.match?.matching_skills?.some((s) => s.toLowerCase().includes(q));
          if (!inTitle && !inCompany && !inDesc && !inSkills) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (b.match?.overall_score ?? 0) - (a.match?.overall_score ?? 0);
        }
        if (sortBy === 'recent') {
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        }
        if (sortBy === 'company') {
          return a.company_name.localeCompare(b.company_name);
        }
        return 0;
      });
  }, [jobs, searchTerm, selectedRegion, workArrangement, minMatchScore, sortBy]);

  // Active job for detail panel
  const activeJob: Job | null = useMemo(() => {
    if (filteredJobs.length === 0) return null;
    if (!selectedJobId) return filteredJobs[0];
    return filteredJobs.find((j) => j.id === selectedJobId) || filteredJobs[0];
  }, [filteredJobs, selectedJobId]);

  const formatPublished = (iso: string) => {
    try {
      const diffHours = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 3600));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const days = Math.round(diffHours / 24);
      if (days < 7) return `${days}d ago`;
      return `${Math.round(days / 7)}w ago`;
    } catch {
      return 'Recently';
    }
  };

  const cvLabel = (code?: RegionCode) => {
    switch (code) {
      case 'PK': return 'Pakistan CV';
      case 'EU': return 'Europe CV';
      case 'ASIA': return 'Asia CV';
      case 'ARAB': return 'Arab & GCC CV';
      default: return 'Standard CV';
    }
  };

  // Export CSV
  const handleExportExcel = () => {
    if (!filteredJobs.length) return;
    const headers = ['Job Title','Company','Location','Match Score','Skills','Source','URL','Published'];
    const rows = filteredJobs.map(j => [
      `"${(j.title || '').replace(/"/g, '""')}"`,
      `"${(j.company_name || '').replace(/"/g, '""')}"`,
      `"${(j.location || 'Remote').replace(/"/g, '""')}"`,
      `"${j.match?.overall_score ?? 80}%"`,
      `"${(j.match?.matching_skills || []).join('; ')}"`,
      `"${j.source_name || ''}"`,
      `"${j.canonical_url || ''}"`,
      `"${j.published_at || ''}"`
    ].join(','));
    const csvData = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `JobPilot_Jobs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Match donut SVG
  const MatchDonut = ({ score }: { score: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E7E0E3" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="#641E32" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-[#171717] type-h2" style={{ fontSize: '20px', fontWeight: 800 }}>
          {score}%
        </text>
        <text x="50" y="62" textAnchor="middle" className="fill-[#737373]" style={{ fontSize: '10px' }}>
          match
        </text>
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div>
        <h1 className="type-h1 text-[#171717] tracking-tight">Find Your Next Opportunity</h1>
        <p className="type-body text-[#737373] mt-1">AI-powered job matching across 50+ global job boards</p>
      </div>

      {/* ── Search Bar ───────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search job titles, companies, keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E7E0E3] rounded-xl type-body text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#641E32] focus:ring-1 focus:ring-[#641E32]/20 transition-colors"
          />
        </div>
        <button
          onClick={() => {}}
          className="px-5 py-2.5 bg-[#641E32] hover:bg-[#431321] text-white type-body font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Search
        </button>
      </div>

      {/* ── Region Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedRegion(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg type-small font-semibold whitespace-nowrap transition-all cursor-pointer ${ selectedRegion === tab.id ? 'bg-[#641E32] text-white shadow-xs' : 'bg-white text-[#737373] border border-[#E7E0E3] hover:border-[#641E32] hover:text-[#641E32]' }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Filter Chips Row ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'remote', 'hybrid', 'onsite'].map((mode) => (
          <button
            key={mode}
            onClick={() => setWorkArrangement(mode)}
            className={`px-3 py-1.5 rounded-full type-small font-semibold border transition-all cursor-pointer ${ workArrangement === mode ? 'bg-[#F5E9ED] text-[#641E32] border-[#641E32]' : 'bg-white text-[#737373] border-[#E7E0E3] hover:border-[#641E32]' }`}
          >
            {mode === 'all' ? 'All Types' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}

        <div className="h-4 w-px bg-[#E7E0E3] mx-1" />

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 rounded-full type-small font-semibold border border-[#E7E0E3] bg-white text-[#737373] cursor-pointer focus:outline-none focus:border-[#641E32]"
        >
          <option value="match">Sort: Best Match</option>
          <option value="recent">Sort: Most Recent</option>
          <option value="company">Sort: Company A-Z</option>
        </select>

        {/* Export */}
        <button
          onClick={handleExportExcel}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full type-small font-semibold border border-[#E7E0E3] bg-white text-[#737373] hover:border-[#641E32] hover:text-[#641E32] transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {/* ── Job Count ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="type-body font-semibold text-[#171717]">
          <span className="text-[#641E32] font-bold">{filteredJobs.length.toLocaleString()}</span>{' '}
          jobs found
        </p>
        {(searchTerm || selectedRegion !== 'ALL' || workArrangement !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setSelectedRegion('ALL'); setWorkArrangement('all'); setMinMatchScore(0); }}
            className="flex items-center gap-1 type-small text-[#641E32] font-semibold hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Two-Panel Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ minHeight: 'calc(100vh - 380px)' }}>
        {/* LEFT: Job List (scrollable) */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Globe2 className="w-12 h-12 text-[#E7E0E3] mb-3" />
              <p className="type-body font-semibold text-[#737373]">No jobs match your filters</p>
              <p className="type-small text-[#A3A3A3] mt-1">Try adjusting your search or region</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const score = job.match?.overall_score ?? 80;
              const isSelected = activeJob?.id === job.id;
              const isSaved = savedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => { setSelectedJobId(job.id); setShowMobileDetail(true); }}
                  className={`relative bg-white rounded-xl border p-4 cursor-pointer transition-all group ${ isSelected ? 'border-[#641E32] shadow-sm ring-1 ring-[#641E32]/10' : 'border-[#E7E0E3] hover:border-[#641E32]/50 hover:shadow-xs' }`}
                >
                  {/* Active indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#641E32] rounded-r-full" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Company Logo Placeholder */}
                    <div className="w-10 h-10 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3] flex items-center justify-center shrink-0">
                      <span className="type-small font-bold text-[#641E32]">
                        {job.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="type-h3 text-[#171717] truncate leading-tight">
                            {job.title}
                          </h3>
                          <p className="type-small text-[#737373] truncate mt-0.5">
                            {job.company_name}
                          </p>
                        </div>
                        {/* Match Score Badge */}
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#641E32] text-white type-caption font-bold">
                          {score}%
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 type-caption text-[#737373]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatPublished(job.published_at)}
                        </span>
                        {job.work_arrangement && job.work_arrangement !== 'onsite' && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F5E9ED] text-[#641E32] font-semibold capitalize">
                            {job.work_arrangement}
                          </span>
                        )}
                      </div>

                      {/* Skills Tags */}
                      {job.match?.matching_skills && job.match.matching_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.match.matching_skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-[#F6F3F4] border border-[#E7E0E3] type-caption font-medium text-[#737373]">
                              {skill}
                            </span>
                          ))}
                          {job.match.matching_skills.length > 4 && (
                            <span className="type-caption text-[#737373] font-medium">
                              +{job.match.matching_skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: Job Detail Panel */}
        <div className={`lg:col-span-7 ${showMobileDetail ? 'fixed inset-0 z-50 bg-white lg:relative lg:inset-auto lg:z-auto' : 'hidden lg:block'}`}>
          {activeJob ? (
            <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs overflow-y-auto h-full" style={{ maxHeight: 'calc(100vh - 380px)' }}>
              {/* Mobile close button */}
              <button
                onClick={() => setShowMobileDetail(false)}
                className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg bg-[#F6F3F4] text-[#737373] hover:text-[#171717] z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 space-y-6">
                {/* Job Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#F6F3F4] border border-[#E7E0E3] flex items-center justify-center shrink-0">
                    <span className="type-h3 text-[#641E32]">
                      {activeJob.company_name?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="type-h2 text-[#171717] leading-tight">{activeJob.title}</h2>
                    <p className="type-body text-[#737373] mt-0.5">{activeJob.company_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F6F3F4] border border-[#E7E0E3] type-small text-[#737373]">
                        <MapPin className="w-3 h-3" /> {activeJob.location || 'Remote'}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F6F3F4] border border-[#E7E0E3] type-small text-[#737373]">
                        <Briefcase className="w-3 h-3" /> {activeJob.work_arrangement || 'On-site'}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F6F3F4] border border-[#E7E0E3] type-small text-[#737373]">
                        <Clock className="w-3 h-3" /> {formatPublished(activeJob.published_at)}
                      </span>
                      {activeJob.source_name && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5E9ED] border border-[#E7E0E3] type-small text-[#641E32] font-medium">
                          <Globe2 className="w-3 h-3" /> {activeJob.source_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onPrepareApplication(activeJob)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#641E32] hover:bg-[#431321] text-white type-body font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" /> Apply Externally
                  </button>
                  <button
                    onClick={() => onToggleSaveJob(activeJob.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 type-body font-semibold rounded-xl border transition-colors cursor-pointer ${ savedJobIds.has(activeJob.id) ? 'bg-[#F5E9ED] text-[#641E32] border-[#641E32]' : 'bg-white text-[#737373] border-[#E7E0E3] hover:border-[#641E32] hover:text-[#641E32]' }`}
                  >
                    {savedJobIds.has(activeJob.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {savedJobIds.has(activeJob.id) ? 'Saved' : 'Save Job'}
                  </button>
                  {activeJob.canonical_url && (
                    <a
                      href={activeJob.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#737373] border border-[#E7E0E3] type-body font-semibold rounded-xl hover:border-[#641E32] hover:text-[#641E32] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> View Original
                    </a>
                  )}
                </div>

                {/* Match Analysis Section */}
                <div className="bg-[#F6F3F4] rounded-xl border border-[#E7E0E3] p-5">
                  <h3 className="type-h3 text-[#171717] mb-4">Match Analysis</h3>
                  <div className="flex items-start gap-6">
                    {/* Donut */}
                    <MatchDonut score={activeJob.match?.overall_score ?? 80} />

                    <div className="flex-1 space-y-3">
                      {/* Matched Skills */}
                      {activeJob.match?.matching_skills && activeJob.match.matching_skills.length > 0 && (
                        <div>
                          <p className="type-small font-semibold text-[#16845B] mb-1.5">Matched Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeJob.match.matching_skills.map((s, i) => (
                              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 type-small text-green-700 font-medium">
                                <CheckCircle className="w-3 h-3" /> {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {activeJob.match?.missing_skills && activeJob.match.missing_skills.length > 0 && (
                        <div>
                          <p className="type-small font-semibold text-[#C53030] mb-1.5">Missing Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeJob.match.missing_skills.map((s, i) => (
                              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 type-small text-red-700 font-medium">
                                <XCircle className="w-3 h-3" /> {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CV Used */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="type-caption font-semibold text-[#737373] uppercase tracking-wider">Resume:</span>
                        <span className="type-small font-medium text-[#641E32]">
                          {cvLabel(activeJob.region_code)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                {activeJob.description && (
                  <div>
                    <h3 className="type-h3 text-[#171717] mb-2">Job Description</h3>
                    <div className="type-body text-[#737373] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-2">
                      {activeJob.description}
                    </div>
                  </div>
                )}

                {/* Salary */}
                {activeJob.salary_min && (
                  <div className="flex items-center gap-2 p-3 bg-[#F5E9ED] rounded-xl border border-[#E7E0E3]">
                    <span className="type-small font-semibold text-[#641E32]">Salary Range:</span>
                    <span className="type-body font-bold text-[#171717]">
                      {activeJob.salary_currency || '$'}{activeJob.salary_min.toLocaleString()}
                      {activeJob.salary_max ? ` – ${activeJob.salary_currency || '$'}${activeJob.salary_max.toLocaleString()}` : '+'}
                    </span>
                  </div>
                )}

                {/* Key Requirements */}
                {activeJob.requirements && activeJob.requirements.length > 0 && (
                  <div>
                    <h3 className="type-h3 text-[#171717] mb-2">Key Requirements</h3>
                    <ul className="space-y-1.5">
                      {activeJob.requirements.map((req: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 type-body text-[#737373]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#641E32] mt-2 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E7E0E3] flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-[#E7E0E3] mx-auto mb-3" />
                <p className="type-body font-semibold text-[#737373]">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPortal;
