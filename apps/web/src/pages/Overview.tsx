import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  Briefcase,
  ChevronRight,
  Globe2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { DailyReport, Job, Application, Region } from '../types';
import { NavTab } from '../components/layout/Sidebar';

interface OverviewProps {
  report?: DailyReport;
  recentJobs?: Job[];
  recentApps?: Application[];
  regions?: Region[];
  onNavigate: (tab: NavTab) => void;
  onRunDiscovery?: () => void;
  isDiscovering?: boolean;
}

function candidateName(): string {
  try {
    return localStorage.getItem('jobpilot_candidate_name') || 'Talha Alam';
  } catch {
    return 'Talha Alam';
  }
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const Overview: React.FC<OverviewProps> = ({
  report,
  recentJobs = [],
  recentApps = [],
  regions = [],
  onNavigate,
  onRunDiscovery,
  isDiscovering = false,
}) => {
  const [taskTab, setTaskTab] = useState<'in_progress' | 'to_do' | 'upcoming'>('in_progress');
  const name = candidateName();

  const tasks = useMemo(() => {
    const pendingReview = recentApps.filter((a) =>
      ['ready_for_review', 'ready', 'draft', 'pending'].includes((a.status || '').toLowerCase())
    ).length;
    const interviews = recentApps.filter((a) => (a.status || '').toLowerCase() === 'interview').length;
    const failed = recentApps.filter((a) =>
      ['failed', 'bounced', 'needs_manual_action'].includes((a.status || '').toLowerCase())
    ).length;
    const matched = recentJobs.filter((j) => (j.match?.overall_score || 0) >= 75).length;
    const discovering = report?.jobs_discovered_today || 0;

    const inProgress = [
      discovering > 0 && {
        id: 't-search',
        title: 'Job searches running',
        subtitle: `${discovering} jobs discovered today`,
        priority: 'High',
        priorityColor: 'bg-red-50 text-red-700 border-red-200',
        actionTab: 'jobs' as NavTab,
      },
      matched > 0 && {
        id: 't-match',
        title: 'Matches awaiting review',
        subtitle: `${matched} jobs at or above match threshold`,
        priority: 'High',
        priorityColor: 'bg-red-50 text-red-700 border-red-200',
        actionTab: 'matched' as NavTab,
      },
      pendingReview > 0 && {
        id: 't-apps',
        title: 'Applications ready to send',
        subtitle: `${pendingReview} waiting for review`,
        priority: 'Med',
        priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
        actionTab: 'applications' as NavTab,
      },
      failed > 0 && {
        id: 't-fail',
        title: 'Failed actions',
        subtitle: `${failed} need attention`,
        priority: 'High',
        priorityColor: 'bg-red-50 text-red-700 border-red-200',
        actionTab: 'applications' as NavTab,
      },
    ].filter(Boolean) as Array<{
      id: string;
      title: string;
      subtitle: string;
      priority: string;
      priorityColor: string;
      actionTab: NavTab;
    }>;

    const toDo = [
      {
        id: 'td-1',
        title: 'Run a fresh job search',
        subtitle: 'Discover new listings across your regions',
        priority: 'Med',
        priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
        actionTab: 'jobs' as NavTab,
      },
      recentJobs.length === 0 && {
        id: 'td-2',
        title: 'No jobs loaded yet',
        subtitle: 'Trigger discovery to populate your pipeline',
        priority: 'High',
        priorityColor: 'bg-red-50 text-red-700 border-red-200',
        actionTab: 'automation' as NavTab,
      },
    ].filter(Boolean) as typeof inProgress;

    const upcoming = [
      interviews > 0 && {
        id: 'up-1',
        title: 'Upcoming interviews',
        subtitle: `${interviews} interview status applications`,
        priority: 'High',
        priorityColor: 'bg-red-50 text-red-700 border-red-200',
        actionTab: 'calendar' as NavTab,
      },
      {
        id: 'up-2',
        title: 'Daily quota remaining',
        subtitle: `${Math.max(0, (report?.max_quota || 30) - (report?.used_quota || 0))} of ${report?.max_quota || 30} left today`,
        priority: 'Low',
        priorityColor: 'bg-slate-50 text-slate-600 border-slate-200',
        actionTab: 'automation' as NavTab,
      },
    ].filter(Boolean) as typeof inProgress;

    return { inProgress, toDo, upcoming };
  }, [recentApps, recentJobs, report]);

  const currentTasks =
    taskTab === 'in_progress' ? tasks.inProgress : taskTab === 'to_do' ? tasks.toDo : tasks.upcoming;

  const goals = useMemo(() => {
    const discovered =
      Object.values(report?.region_breakdown || {}).reduce((s, r) => s + (r.jobs_discovered || 0), 0) ||
      recentJobs.length;
    const matched = recentJobs.filter((j) => (j.match?.overall_score || 0) >= 75).length;
    const sent = report?.applications_sent_today || recentApps.filter((a) =>
      ['sent', 'submitted', 'delivery_confirmed'].includes((a.status || '').toLowerCase())
    ).length;
    const profilePct = regions.filter((r) => r.active_resume_id).length;
    const profileMax = Math.max(regions.length, 1);

    return [
      { label: 'Jobs discovered', current: discovered, max: Math.max(discovered, 50), percent: Math.min(100, Math.round((discovered / Math.max(discovered, 50)) * 100)) },
      { label: 'Qualified matches', current: matched, max: Math.max(matched, 20), percent: Math.min(100, Math.round((matched / Math.max(matched, 20)) * 100)) },
      { label: 'Applications sent', current: sent, max: report?.max_quota || 30, percent: Math.min(100, Math.round((sent / (report?.max_quota || 30)) * 100)) },
      { label: 'Profile completion', current: profilePct, max: profileMax, percent: Math.round((profilePct / profileMax) * 100) },
    ];
  }, [report, recentJobs, recentApps, regions]);

  const projects = useMemo(() => {
    if (regions.length) {
      return regions.map((r) => ({
        name: `${r.name} Opportunities`,
        subtitle: r.active_resume_filename || 'No resume assigned',
        count: `${report?.region_breakdown?.[r.code]?.jobs_discovered ?? recentJobs.filter((j) => j.region_code === r.code).length} jobs`,
      }));
    }
    return [];
  }, [regions, report, recentJobs]);

  const activity = useMemo(() => {
    const items: Array<{ title: string; detail: string; time: string; dotColor: string }> = [];
    recentJobs.slice(0, 4).forEach((j) => {
      items.push({
        title: 'Job discovered',
        detail: `${j.title} · ${j.company_name}`,
        time: j.published_at
          ? new Date(j.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—',
        dotColor: 'bg-[#16845B]',
      });
    });
    recentApps.slice(0, 3).forEach((a) => {
      items.push({
        title: `Application ${a.status}`,
        detail: `${a.job_title} · ${a.company_name}`,
        time: a.created_at
          ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—',
        dotColor: 'bg-[#641E32]',
      });
    });
    return items.slice(0, 6);
  }, [recentJobs, recentApps]);

  const calendarItems = useMemo(() => {
    return recentApps
      .filter((a) => ['interview', 'ready_for_review', 'queued'].includes((a.status || '').toLowerCase()))
      .slice(0, 4)
      .map((a) => {
        const d = a.created_at ? new Date(a.created_at) : new Date();
        return {
          dateMonth: d.toLocaleDateString('en-US', { month: 'short' }),
          dateDay: String(d.getDate()),
          title: a.status === 'interview' ? 'Interview' : 'Follow-up',
          meta: `${a.company_name} · ${a.job_title}`,
          time: a.status,
        };
      });
  }, [recentApps]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <span className="type-small font-semibold text-[#737373]">{formatToday()}</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full type-small font-bold bg-[#ECFDF5] text-[#16845B] border border-emerald-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
          <span>Quota {report?.used_quota || 0}/{report?.max_quota || 30} today</span>
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="type-h1 text-[#171717]">
            Hello, {name} 👋
          </h1>
          <p className="type-body text-[#737373] mt-1">
            How can I help you find your{' '}
            <strong className="text-[#641E32] font-semibold">next opportunity?</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-center gap-2 px-4 py-2 bg-[#641E32] hover:bg-[#431321] text-white type-small font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
          <button
            onClick={() => {
              onRunDiscovery?.();
              onNavigate('jobs');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#171717] hover:bg-[#F6F3F4] type-small font-semibold rounded-xl border border-[#E7E0E3] shadow-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#737373]" />
            <span>{isDiscovering ? 'Scanning...' : 'Run Job Search'}</span>
          </button>
          <button
            onClick={() => onNavigate('matched')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#171717] hover:bg-[#F6F3F4] type-small font-semibold rounded-xl border border-[#E7E0E3] shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#737373]" />
            <span>Review Matches</span>
          </button>
          <button
            onClick={() => onNavigate('applications')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#171717] hover:bg-[#F6F3F4] type-small font-semibold rounded-xl border border-[#E7E0E3] shadow-xs transition-all cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#737373]" />
            <span>Manage Applications</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E0E3] mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="type-h2 text-[#171717]">My Tasks</h2>
                <div className="flex bg-[#F6F3F4] p-1 rounded-xl border border-[#E7E0E3] type-small ml-0 sm:ml-2">
                  {(
                    [
                      ['in_progress', 'In Progress', tasks.inProgress.length],
                      ['to_do', 'To Do', tasks.toDo.length],
                      ['upcoming', 'Upcoming', tasks.upcoming.length],
                    ] as const
                  ).map(([id, label, count]) => (
                    <button
                      key={id}
                      onClick={() => setTaskTab(id)}
                      className={`px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer ${
                        taskTab === id
                          ? 'bg-[#641E32] text-white shadow-xs font-bold'
                          : 'text-[#737373] hover:text-[#171717]'
                      }`}
                    >
                      {label}{' '}
                      <span className={taskTab === id ? 'text-white/90' : 'text-[#641E32]'}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('applications')}
                className="type-small text-[#737373] hover:text-[#641E32] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {currentTasks.length === 0 ? (
              <p className="type-small text-[#737373] py-6 text-center">No tasks in this tab right now.</p>
            ) : (
              <div className="divide-y divide-[#E7E0E3]">
                {currentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate(t.actionTab)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#F6F3F4]/60 px-2 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#F6F3F4] text-[#641E32] border border-[#E7E0E3] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="type-body font-bold text-[#171717] group-hover:text-[#641E32] truncate">
                            {t.title}
                          </span>
                          {t.priority && (
                            <span className={`type-caption font-bold px-2 py-0.5 rounded-full border ${t.priorityColor}`}>
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <p className="type-small text-[#737373] mt-0.5 truncate">{t.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#737373] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <h2 className="type-h2 text-[#171717] pb-2 border-b border-[#E7E0E3]">My Goals</h2>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.label} className="space-y-1.5">
                  <div className="flex items-center justify-between type-small">
                    <span className="font-semibold text-[#171717]">{goal.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#737373] font-medium">
                        {goal.current} / {goal.max}
                      </span>
                      <span className="font-bold text-[#171717] w-8 text-right">{goal.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F6F3F4] overflow-hidden">
                    <div className="h-full bg-[#641E32] rounded-full" style={{ width: `${goal.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E0E3]">
              <h2 className="type-h2 text-[#171717]">Job Search Projects</h2>
              <button
                onClick={() => onNavigate('jobs')}
                className="type-small text-[#737373] hover:text-[#641E32] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="type-small text-[#737373] py-4 text-center">No regions loaded from API yet.</p>
            ) : (
              <div className="divide-y divide-[#E7E0E3]">
                {projects.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => onNavigate('jobs')}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#F6F3F4]/60 px-2 rounded-xl cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#F6F3F4] flex items-center justify-center text-[#641E32] border border-[#E7E0E3] shrink-0">
                        <Globe2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="type-body font-bold text-[#171717] group-hover:text-[#641E32] truncate">
                          {p.name}
                        </div>
                        <div className="type-caption text-[#737373] truncate">{p.subtitle}</div>
                      </div>
                    </div>
                    <span className="type-small font-semibold text-[#737373] shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E0E3]">
              <h2 className="type-h2 text-[#171717]">Application Calendar</h2>
              <button
                onClick={() => onNavigate('calendar')}
                className="type-small text-[#737373] hover:text-[#641E32] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {calendarItems.length === 0 ? (
              <p className="type-small text-[#737373] py-4 text-center">No upcoming application events.</p>
            ) : (
              <div className="space-y-3">
                {calendarItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigate('calendar')}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#F6F3F4]/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F5E9ED] border border-[#E7E0E3] flex flex-col items-center justify-center shrink-0">
                        <span className="type-caption font-bold text-[#641E32] uppercase">{item.dateMonth}</span>
                        <span className="type-small font-black text-[#641E32] leading-none">{item.dateDay}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="type-small font-bold text-[#171717] block truncate">{item.title}</span>
                        <span className="type-caption text-[#737373] block truncate">{item.meta}</span>
                      </div>
                    </div>
                    <span className="type-small font-semibold text-[#737373] shrink-0 capitalize">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs p-6 space-y-4">
            <h2 className="type-h2 text-[#171717] pb-2 border-b border-[#E7E0E3]">
              Recent Activity
            </h2>
            {activity.length === 0 ? (
              <p className="type-small text-[#737373] py-4 text-center">No activity yet — run a job search.</p>
            ) : (
              <div className="space-y-3.5">
                {activity.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full ${act.dotColor} mt-1.5 shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="type-small font-bold text-[#171717] truncate">{act.title}</div>
                      <div className="type-caption text-[#737373] truncate">{act.detail}</div>
                    </div>
                    <span className="type-caption text-[#737373] shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
