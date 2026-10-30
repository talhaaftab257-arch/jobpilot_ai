import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DailyReport, Application, Job } from '../types';

interface AnalyticsProps {
  report?: DailyReport;
  applications?: Application[];
  jobs?: Job[];
}

export const Analytics: React.FC<AnalyticsProps> = ({
  report,
  applications = [],
  jobs = [],
}) => {
  const [timeRange] = useState('Today (live)');

  const discoveredTotal =
    Object.values(report?.region_breakdown || {}).reduce((s, r) => s + (r.jobs_discovered || 0), 0) ||
    jobs.length;
  const matches = jobs.filter((j) => (j.match?.overall_score || 0) >= 75).length;
  const appsCount = applications.length || report?.applications_sent_today || 0;
  const interviews = applications.filter((a) => (a.status || '').toLowerCase() === 'interview').length;

  const stats = [
    { label: 'Jobs Discovered', value: discoveredTotal },
    { label: 'Matches', value: matches },
    { label: 'Applications', value: appsCount },
    { label: 'Interviews', value: interviews },
  ];

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach((a) => {
      const s = (a.status || 'unknown').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({
      label,
      count,
      percent: applications.length ? Math.round((count / applications.length) * 100) : 0,
    }));
  }, [applications]);

  const regionBars = useMemo(() => {
    const breakdown = report?.region_breakdown || {};
    const entries = Object.entries(breakdown);
    const max = Math.max(1, ...entries.map(([, v]) => v.jobs_discovered || 0));
    return entries.map(([code, v]) => ({
      name: code,
      count: v.jobs_discovered || 0,
      percent: Math.round(((v.jobs_discovered || 0) / max) * 100),
    }));
  }, [report]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-[#171717]">Analytics</h1>
          <p className="type-body text-[#737373] mt-1">Track your progress and performance.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7E0E3] type-small font-semibold text-[#171717] shadow-xs">
          <span>{timeRange}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#E7E0E3] p-5 sm:p-6 shadow-xs space-y-2"
          >
            <span className="type-small font-semibold text-[#737373] block">{stat.label}</span>
            <span className="type-h2 font-tabular text-[#171717] tracking-tight">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs space-y-5">
          <h2 className="type-h2 text-[#171717]">Applications by Status</h2>
          {statusCounts.length === 0 ? (
            <p className="type-small text-[#737373] py-8 text-center">No applications in the database yet.</p>
          ) : (
            <div className="space-y-3">
              {statusCounts.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between type-small">
                    <span className="font-semibold text-[#171717] capitalize">{item.label}</span>
                    <span className="text-[#737373]">
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F6F3F4] overflow-hidden">
                    <div className="h-full bg-[#641E32] rounded-full" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E7E0E3] p-6 shadow-xs space-y-5">
          <h2 className="type-h2 text-[#171717]">Jobs by Region</h2>
          {regionBars.length === 0 ? (
            <p className="type-small text-[#737373] py-8 text-center">No region breakdown from API yet.</p>
          ) : (
            <div className="space-y-4 py-2">
              {regionBars.map((r) => (
                <div key={r.name} className="space-y-1.5">
                  <div className="flex items-center justify-between type-small">
                    <span className="font-semibold text-[#171717]">{r.name}</span>
                    <span className="font-bold text-[#171717]">{r.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F6F3F4] overflow-hidden">
                    <div className="h-full bg-[#641E32] rounded-full" style={{ width: `${r.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
