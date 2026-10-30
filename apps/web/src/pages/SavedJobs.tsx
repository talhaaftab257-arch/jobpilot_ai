import React from 'react';
import { Bookmark, Building2, MapPin, Send, Trash2, ExternalLink, Briefcase } from 'lucide-react';
import { Job } from '../types';

interface SavedJobsProps {
  jobs: Job[];
  savedJobIds: Set<string>;
  onToggleSaveJob: (jobId: string) => void;
  onPrepareApplication: (job: Job) => void;
  onBrowseJobs: () => void;
}

export const SavedJobs: React.FC<SavedJobsProps> = ({
  jobs,
  savedJobIds,
  onToggleSaveJob,
  onPrepareApplication,
  onBrowseJobs,
}) => {
  const savedJobs = jobs.filter((j) => savedJobIds.has(j.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E7E0E3] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full type-small font-bold bg-[#F5E9ED] text-[#641E32] border border-[#E7E0E3] mb-2">
            <Bookmark className="w-3.5 h-3.5 text-[#641E32] fill-current" />
            <span>Bookmarked Positions</span>
          </div>
          <h2 className="type-h1 text-[#171717] tracking-tight">Saved Jobs Vault</h2>
          <p className="type-small text-[#737373] mt-0.5">
            Keep track of high-priority opportunities you plan to review or apply to later.
          </p>
        </div>

        <div className="type-body font-bold px-4 py-2 rounded-2xl bg-[#F6F3F4] border border-[#E7E0E3] text-[#202020] shrink-0">
          {savedJobs.length} Saved Opportunities
        </div>
      </div>

      {/* List */}
      {savedJobs.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#E7E0E3] shadow-xs space-y-3">
          <Bookmark className="w-12 h-12 text-[#737373] mx-auto opacity-40" />
          <h3 className="type-h3 text-[#171717]">You haven't saved any jobs yet</h3>
          <p className="type-small text-[#737373] max-w-sm mx-auto">
            Click the bookmark icon on any job card in the Discover Jobs portal to save it here for later.
          </p>
          <button
            onClick={onBrowseJobs}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#641E32] hover:bg-[#431321] text-white font-bold type-small shadow-xs transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Worldwide Jobs</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedJobs.map((job) => {
            const score = job.match?.overall_score ?? 80;
            const initials = job.company_name ? job.company_name.slice(0, 2).toUpperCase() : 'CO';

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl border border-[#E7E0E3] hover:border-[#641E32]/40 hover:shadow-md p-6 flex flex-col justify-between space-y-4 transition-all relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F5E9ED] border border-[#E7E0E3] flex items-center justify-center font-black text-[#641E32] type-body shrink-0">
                      {initials}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="type-small font-black px-2 py-0.5 rounded-md bg-[#F5E9ED] text-[#641E32] border border-[#E7E0E3]">
                        {score}% Match
                      </span>
                      <button
                        onClick={() => onToggleSaveJob(job.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="type-h3 text-[#171717] line-clamp-1">{job.title}</h3>
                    <div className="flex items-center gap-2 type-small text-[#737373] font-medium mt-1">
                      <Building2 className="w-3.5 h-3.5 text-[#737373]" />
                      <span>{job.company_name}</span>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-[#737373]" />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                  </div>

                  <p className="type-small text-[#202020] line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E7E0E3] flex items-center justify-between gap-2">
                  <a
                    href={job.canonical_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 type-small font-bold text-[#737373] hover:text-[#171717]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Original</span>
                  </a>

                  <button
                    onClick={() => onPrepareApplication(job)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#641E32] hover:bg-[#431321] text-white font-bold type-small shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
