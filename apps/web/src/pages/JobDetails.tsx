import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Share2,
  Phone,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { Job } from '../types';

interface JobDetailsProps {
  job?: Job;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onApply?: () => void;
  onBack?: () => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  job,
  isSaved = false,
  onToggleSave,
  onApply,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'company' | 'similar'>('overview');
  const [saved, setSaved] = useState(isSaved);

  if (!job) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E0E3] p-10 text-center type-body text-[#737373]">
        No job selected.
      </div>
    );
  }

  const score = Math.round(job.match?.overall_score ?? 0);
  const matchedSkills = job.match?.matching_skills || [];
  const missingSkills = job.match?.missing_skills || [];
  const reqSkills = matchedSkills.length
    ? matchedSkills
    : missingSkills.slice(0, 6);
  const criteria = [
    { name: 'Title', score: job.match?.title_score, max: 25 },
    { name: 'Skills', score: job.match?.skills_score, max: 30 },
    { name: 'Experience', score: job.match?.experience_score, max: 15 },
    { name: 'Location', score: job.match?.location_score, max: 10 },
    { name: 'Salary', score: job.match?.salary_score, max: 10 },
    { name: 'Freshness', score: job.match?.freshness_score, max: 10 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 type-small font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Job Search
        </button>
      )}

      <div className="rounded-2xl overflow-hidden border border-[#E7E0E3] bg-white shadow-xs">
        <div className="relative h-36 sm:h-44 w-full bg-gradient-to-r from-[#171717] via-[#2A1520] to-[#431321]" />
        <div className="p-6 sm:p-8 -mt-12 relative z-10">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#641E32] text-white flex items-center justify-center font-black text-xl shrink-0">
                {job.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="type-h1 text-[#171717] tracking-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 type-small text-[#737373] mt-1.5 font-medium">
                  <span className="font-bold text-[#171717]">{job.company_name}</span>
                  <span>•</span>
                  <span>{job.location || 'Remote'}</span>
                  {job.work_arrangement && (
                    <>
                      <span>•</span>
                      <span className="capitalize">
                        {job.work_arrangement === 'onsite' ? 'On-site' : job.work_arrangement}
                      </span>
                    </>
                  )}
                  {job.source_name && (
                    <>
                      <span>•</span>
                      <span>{job.source_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center gap-1 type-small font-bold px-3 py-1 rounded-full border ${ score >= 75 ? 'bg-[#ECFDF5] text-[#16845B] border-emerald-200' : 'bg-[#F6F3F4] text-[#737373] border-[#E7E0E3]' }`}
              >
                {score}% Match
              </span>
              <button
                onClick={() => {
                  setSaved(!saved);
                  onToggleSave?.();
                }}
                className={`flex items-center gap-1.5 px-4 py-2 type-small font-semibold rounded-xl border cursor-pointer ${ saved ? 'bg-[#F5E9ED] text-[#641E32] border-[#641E32]' : 'bg-white text-[#737373] border-[#E7E0E3]' }`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-[#E7E0E3] px-2 type-body font-semibold">
        {(['overview', 'requirements', 'company', 'similar'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize cursor-pointer ${ activeTab === tab ? 'text-[#641E32] border-b-2 border-[#641E32] font-bold' : 'text-[#737373] hover:text-[#171717]' }`}
          >
            {tab === 'similar' ? 'Similar Jobs' : tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs space-y-4">
            <h2 className="type-h2 text-[#171717]">Job Description</h2>
            <p className="type-body text-[#737373] leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description available from the source.'}
            </p>
            {job.match?.explanation && (
              <p className="type-small text-[#641E32] bg-[#F5E9ED] border border-[#E7E0E3] rounded-xl p-3">
                {job.match.explanation}
              </p>
            )}
            {job.match?.disqualification_reason && (
              <p className="type-small text-[#C53030] bg-[#FEE2E2] border border-red-200 rounded-xl p-3">
                {job.match.disqualification_reason}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs space-y-3">
            <h2 className="type-h2 text-[#171717]">Required / Related Skills</h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {reqSkills.length === 0 ? (
                <span className="type-small text-[#737373]">No skills extracted for this listing.</span>
              ) : (
                reqSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl bg-[#F6F3F4] type-small font-semibold text-[#171717] border border-[#E7E0E3]"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>

          {job.canonical_url && (
            <a
              href={job.canonical_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex type-small font-bold text-[#641E32] hover:underline"
            >
              Open original listing ↗
            </a>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs space-y-5">
            <h2 className="type-h2 text-[#171717]">Match Analysis</h2>
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-[#F6F3F4]" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-[#641E32]"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - Math.min(1, score / 100))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="type-h1 text-[#171717] font-tabular">{score}%</span>
                  <span className="type-caption font-semibold text-[#737373]">Match Score</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 type-small border-t border-b border-[#E7E0E3] py-4">
              {criteria.map((c) => {
                const val = Number(c.score || 0);
                const pct = c.max ? Math.round((val / c.max) * 100) : 0;
                return (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-[#737373] font-medium">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[#F6F3F4] overflow-hidden">
                        <div className="h-full bg-[#641E32] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-bold text-[#171717] w-10 text-right">
                        {val}/{c.max}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <span className="type-small font-bold text-[#16845B] block">Matched Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.length === 0 ? (
                  <span className="type-small text-[#737373]">None</span>
                ) : (
                  matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-lg bg-[#ECFDF5] text-[#16845B] border border-emerald-200 type-small font-medium"
                    >
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="type-small font-bold text-[#C53030] block">Missing Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.length === 0 ? (
                  <span className="type-small text-[#737373]">None</span>
                ) : (
                  missingSkills.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-lg bg-[#FEE2E2] text-[#C53030] border border-red-200 type-small font-medium"
                    >
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 sm:left-[240px] bg-white border-t border-[#E7E0E3] p-4 z-20 flex items-center gap-3 shadow-lg">
        <button
          onClick={onApply}
          className="px-8 py-3 bg-[#641E32] hover:bg-[#431321] text-white type-body font-bold rounded-xl cursor-pointer flex items-center gap-2"
        >
          Apply Now <ArrowRight className="w-4 h-4" />
        </button>
        {job.contacts?.[0]?.email ? (
          <a
            href={`mailto:${job.contacts[0].email}`}
            className="px-5 py-3 bg-white text-[#171717] type-body font-semibold rounded-xl border border-[#E7E0E3] flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#737373]" /> Contact
          </a>
        ) : (
          <button className="px-5 py-3 bg-white text-[#737373] type-body font-semibold rounded-xl border border-[#E7E0E3] flex items-center gap-2 cursor-not-allowed opacity-60">
            <Phone className="w-4 h-4" /> No contact
          </button>
        )}
        {job.canonical_url && (
          <a
            href={job.canonical_url}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 bg-white text-[#171717] type-body font-semibold rounded-xl border border-[#E7E0E3] flex items-center gap-2"
          >
            <Share2 className="w-4 h-4 text-[#737373]" /> Share
          </a>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
