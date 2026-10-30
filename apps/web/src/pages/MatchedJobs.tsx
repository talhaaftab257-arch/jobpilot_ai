import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  Sliders,
  Coins,
  ChevronDown,
  Info
} from 'lucide-react';
import { Job, RegionCode } from '../types';

interface MatchedJobsProps {
  jobs: Job[];
  onPrepareApplication: (job: Job) => void;
}

export const MatchedJobs: React.FC<MatchedJobsProps> = ({ jobs, onPrepareApplication }) => {
  const [minScore, setMinScore] = useState<number>(75);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const matchedList = jobs.filter((j) => {
    const score = j.match?.overall_score || 0;
    if (score < minScore) return false;
    if (selectedRegion !== 'all' && j.region_code !== selectedRegion) return false;
    return true;
  });

  const getRegionCVName = (code?: RegionCode) => {
    switch (code) {
      case 'PK':
        return 'Pakistan CV';
      case 'EU':
        return 'Europe CV';
      case 'ASIA':
        return 'Asia CV';
      case 'ARAB':
        return 'Arab-region CV';
      default:
        return 'Standard Regional CV';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7E0E3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-caption font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#641E32] text-white">
              AI Match Engine
            </span>
            <span className="type-small text-[#737373]">100-Point Transparent Scoring Engine</span>
          </div>
          <h2 className="type-h2 text-[#171717] tracking-tight">Qualified Job Matches</h2>
          <p className="type-small text-[#737373] mt-0.5 max-w-2xl">
            Positions exceeding minimum threshold of {minScore}/100, verified against hard eligibility rules (skills 30, title 25, experience 15, location 10, salary 10, freshness 10).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Threshold Filter */}
          <div className="flex items-center gap-2 bg-[#F6F3F4] px-3 py-1.5 rounded-xl border border-[#E7E0E3] type-small">
            <span className="text-[#737373] font-semibold">Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="bg-transparent font-bold text-[#641E32] focus:outline-hidden cursor-pointer"
            >
              <option value={70}>≥ 70 / 100</option>
              <option value={75}>≥ 75 / 100 (Default)</option>
              <option value={80}>≥ 80 / 100</option>
              <option value={85}>≥ 85 / 100</option>
              <option value={90}>≥ 90 / 100</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/30 type-small font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{matchedList.length} Qualified Roles</span>
          </div>
        </div>
      </div>

      {/* Scoring Weight Info Banner */}
      <div className="p-4 rounded-xl bg-[#F5E9ED] border border-[#E7E0E3] flex flex-wrap items-center justify-between gap-3 type-small">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#641E32] shrink-0" />
          <span className="text-[#202020] font-semibold">
            Scoring Criteria:
          </span>
          <span className="text-[#737373]">
            Skills (30 pts) • Title (25 pts) • Experience (15 pts) • Location (10 pts) • Salary (10 pts) • Freshness (10 pts)
          </span>
        </div>
        <span className="type-caption font-bold text-[#641E32]">Hard eligibility checked separately</span>
      </div>

      {/* Matched Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matchedList.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-[#E7E0E3] type-small text-[#737373]">
            No jobs currently match this score threshold. Adjust the threshold slider above or trigger a fresh discovery run.
          </div>
        ) : (
          matchedList.map((job) => {
            const match = job.match;
            const score = match?.overall_score || 85;

            return (
              <div
                key={job.id}
                className="p-6 rounded-2xl bg-white border border-[#E7E0E3] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#641E32]/50 transition-all"
              >
                <div>
                  {/* Top Bar: Region & Score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="type-caption font-extrabold px-2 py-0.5 rounded bg-[#F6F3F4] text-[#171717] border border-[#E7E0E3]">
                        {job.region_code} • {job.country_code}
                      </span>
                      <span className="type-small text-[#737373]">{job.source_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="type-h3 font-tabular px-2.5 py-0.5 rounded-full bg-[#641E32] text-white shadow-xs">
                        {score}/100 Match
                      </span>
                    </div>
                  </div>

                  <h3 className="type-h3 text-[#171717]">{job.title}</h3>
                  <div className="flex items-center gap-2 type-small text-[#737373] mt-1">
                    <span className="font-semibold text-[#202020]">{job.company_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#737373]" />
                      {job.location || 'Remote'}
                    </span>
                  </div>

                  {/* 6-part Score Breakdown Pill Grid */}
                  {match && (
                    <div className="grid grid-cols-6 gap-1.5 my-3 text-center type-caption">
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Skills</span>
                        <span className="font-extrabold text-[#171717]">{match.skills_score}/30</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Title</span>
                        <span className="font-extrabold text-[#171717]">{match.title_score}/25</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Exp</span>
                        <span className="font-extrabold text-[#171717]">{match.experience_score}/15</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Loc</span>
                        <span className="font-extrabold text-[#171717]">{match.location_score}/10</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Salary</span>
                        <span className="font-extrabold text-[#171717]">{match.salary_score}/10</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#F6F3F4] border border-[#E7E0E3]">
                        <span className="text-[#737373] block">Fresh</span>
                        <span className="font-extrabold text-[#171717]">{match.freshness_score}/10</span>
                      </div>
                    </div>
                  )}

                  {/* AI Explanation */}
                  <p className="type-small text-[#202020] p-3 rounded-xl bg-[#F6F3F4] border border-[#E7E0E3] leading-relaxed">
                    {match?.explanation}
                  </p>

                  {/* Matching Skills */}
                  {match?.matching_skills && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {match.matching_skills.map((s) => (
                        <span
                          key={s}
                          className="type-caption px-2 py-0.5 rounded-md bg-[#16845B]/10 text-[#16845B] border border-[#16845B]/30 font-semibold"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CV & Eligibility */}
                  <div className="mt-3 pt-3 border-t border-[#E7E0E3] flex items-center justify-between type-small text-[#737373]">
                    <span className="flex items-center gap-1 font-semibold text-[#202020]">
                      <FileText className="w-3.5 h-3.5 text-[#641E32]" />
                      CV: {getRegionCVName(job.region_code)}
                    </span>
                    <span className="type-caption font-semibold text-[#16845B] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Hard Eligibility Passed
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#E7E0E3] flex items-center justify-between">
                  <a
                    href={job.canonical_url}
                    target="_blank"
                    rel="noreferrer"
                    className="type-small text-[#737373] hover:text-[#171717] inline-flex items-center gap-1 font-semibold"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => onPrepareApplication(job)}
                    className="px-4 py-2 rounded-xl bg-[#641E32] hover:bg-[#431321] text-white type-small font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Prepare Application</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
