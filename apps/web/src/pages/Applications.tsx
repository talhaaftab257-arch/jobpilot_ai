import React, { useState, useMemo } from 'react';
import { ChevronDown, MoreVertical, Briefcase, Search } from 'lucide-react';
import { Application } from '../types';

interface ApplicationsProps {
  applications?: Application[];
  onRetry?: (id: string) => void;
  onSelectApplication?: (app: Application) => void;
  onNavigateToJobs?: () => void;
}

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
  for (let i = 0; i < (name || '').length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % palette.length;
  return palette[hash];
};

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'interview':
      return { label: 'Interview', className: 'bg-[#FEF3C7] text-[#B45309] border-amber-200' };
    case 'applied':
    case 'submitted':
    case 'delivery_confirmed':
      return { label: 'Applied', className: 'bg-[#D1FAE5] text-[#047857] border-emerald-200' };
    case 'review':
    case 'draft':
    case 'ready_for_review':
    case 'ready':
    case 'pending':
    case 'queued':
      return { label: 'Review', className: 'bg-[#FEF3C7] text-[#92400E] border-amber-100' };
    case 'sent':
    case 'sending':
      return { label: 'Sent', className: 'bg-[#DBEAFE] text-[#1D4ED8] border-blue-200' };
    case 'rejected':
    case 'failed':
    case 'bounced':
      return { label: 'Rejected', className: 'bg-[#FEE2E2] text-[#B91C1C] border-red-200' };
    default:
      return { label: status || 'Unknown', className: 'bg-[#F6F3F4] text-[#737373] border-[#E7E0E3]' };
  }
};

export const Applications: React.FC<ApplicationsProps> = ({
  applications = [],
  onSelectApplication,
  onNavigateToJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'interview' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    let applied = 0;
    let interview = 0;
    let pending = 0;
    let rejected = 0;
    applications.forEach((app) => {
      const s = (app.status || '').toLowerCase();
      if (s === 'interview') interview++;
      else if (['applied', 'submitted', 'delivery_confirmed', 'sent'].includes(s)) applied++;
      else if (['review', 'draft', 'pending', 'ready_for_review', 'ready', 'queued'].includes(s)) pending++;
      else if (['rejected', 'failed', 'bounced'].includes(s)) rejected++;
    });
    return { all: applications.length, applied, interview, pending, rejected };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const s = (app.status || '').toLowerCase();
      if (activeTab === 'applied' && !['applied', 'submitted', 'delivery_confirmed', 'sent'].includes(s)) return false;
      if (activeTab === 'interview' && s !== 'interview') return false;
      if (
        activeTab === 'pending' &&
        !['review', 'draft', 'pending', 'ready_for_review', 'ready', 'queued'].includes(s)
      )
        return false;
      if (activeTab === 'rejected' && !['rejected', 'failed', 'bounced'].includes(s)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${app.job_title} ${app.company_name} ${app.region_code || ''} ${app.location || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const tabs: Array<{ id: typeof activeTab; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'applied', label: 'Applied', count: counts.applied },
    { id: 'interview', label: 'Interview', count: counts.interview },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="type-h1 text-[#171717]">Applications</h1>
        <p className="type-body text-[#737373] mt-1">
          Track and manage all your job applications in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 type-small font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#641E32] text-white font-bold shadow-xs'
                : 'bg-white text-[#737373] border border-[#E7E0E3] hover:text-[#171717]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-xl border border-[#E7E0E3] type-small focus-within:border-[#641E32] transition-all">
          <Search className="w-4 h-4 text-[#737373] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full bg-transparent outline-none text-[#171717] placeholder-[#737373] font-medium"
          />
        </div>
        <div className="flex items-center gap-2 type-small font-semibold shrink-0">
          {['All Regions', 'All Status', 'Sort'].map((label) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#E7E0E3] text-[#737373]"
            >
              <span>{label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>
      </div>

      {filteredApplications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left type-small border-collapse">
              <thead>
                <tr className="border-b border-[#E7E0E3] bg-[#F6F3F4]/50 text-[#737373] font-semibold">
                  <th className="py-3 px-5">Job Title</th>
                  <th className="py-3 px-5">Company</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Match</th>
                  <th className="py-3 px-5">Applied On</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0E3]">
                {filteredApplications.map((app) => {
                  const badge = getStatusBadge(app.status || '');
                  const dateStr = app.created_at
                    ? new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';
                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication?.(app)}
                      className="hover:bg-[#F6F3F4]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold type-small shrink-0 ${getCompanyBadgeClass(
                              app.company_name
                            )}`}
                          >
                            {(app.company_name || 'JB').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-[#171717] group-hover:text-[#641E32]">
                            {app.job_title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-[#171717] font-semibold">{app.company_name}</td>
                      <td className="py-4 px-5 text-[#737373]">
                        {app.location || app.region_code || '—'}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full type-caption font-bold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-[#171717]">
                        {typeof app.match_score === 'number' ? `${Math.round(app.match_score)}%` : '—'}
                      </td>
                      <td className="py-4 px-5 text-[#737373]">{dateStr}</td>
                      <td className="py-4 px-5 text-right">
                        <button className="p-1 rounded-lg text-[#737373] hover:text-[#171717] hover:bg-[#F6F3F4] cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F5E9ED] border border-[#E7E0E3] flex items-center justify-center text-[#641E32] mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="type-h3 text-[#171717]">No applications yet</h3>
            <p className="type-small text-[#737373] leading-relaxed">
              When you dispatch applications from live jobs, they will appear here with real status tracking.
            </p>
          </div>
          <button
            onClick={onNavigateToJobs}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#641E32] hover:bg-[#431321] text-white type-small font-bold rounded-xl cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Browse Jobs</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Applications;
