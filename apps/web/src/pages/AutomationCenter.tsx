import React from 'react';
import { Play, Pause, RefreshCw, ShieldCheck } from 'lucide-react';
import { DailyReport } from '../types';

interface AutomationCenterProps {
  isPaused?: boolean;
  onTogglePause?: () => void;
  onTriggerDiscovery?: () => void;
  isDiscovering?: boolean;
  report?: DailyReport;
}

export const AutomationCenter: React.FC<AutomationCenterProps> = ({
  isPaused = false,
  onTogglePause,
  onTriggerDiscovery,
  isDiscovering = false,
  report,
}) => {
  const used = report?.used_quota ?? 0;
  const max = report?.max_quota ?? 30;
  const regionRows = Object.entries(report?.region_breakdown || {}).map(([code, v]) => ({
    code,
    discovered: v.jobs_discovered || 0,
    applications: v.applications || 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-[#171717]">Automation Center</h1>
          <p className="type-body text-[#737373] mt-1">
            Live discovery status, daily quota, and region telemetry from the API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl type-small font-bold cursor-pointer border ${
              isPaused
                ? 'bg-[#FEF3C7] text-[#B7791F] border-[#FDE68A]'
                : 'bg-[#ECFDF5] text-[#16845B] border-[#A7F3D0]'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Automation' : 'Pause Automation'}</span>
          </button>
          <button
            onClick={onTriggerDiscovery}
            className="flex items-center gap-2 px-4 py-2 bg-[#641E32] hover:bg-[#431321] text-white type-small font-bold rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span>{isDiscovering ? 'Scanning...' : 'Run Discovery Now'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-5 shadow-xs space-y-1">
          <span className="type-small font-semibold text-[#737373]">Engine Status</span>
          <div className="flex items-center gap-2 pt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-[#B7791F]' : 'bg-[#16845B] animate-pulse'}`}
            />
            <span className="type-h3 text-[#171717]">{isPaused ? 'Paused' : 'Active'}</span>
          </div>
          <p className="type-caption text-[#737373]">From live config emergency pause flag</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-5 shadow-xs space-y-1">
          <span className="type-small font-semibold text-[#737373]">Daily Quota Cap</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="type-h2 font-tabular text-[#641E32]">
              {used} / {max}
            </span>
            <span className="type-small font-bold text-[#737373]">
              {max ? Math.round((used / max) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#F6F3F4] overflow-hidden mt-1">
            <div
              className="h-full bg-[#641E32] rounded-full"
              style={{ width: `${max ? Math.min(100, (used / max) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-5 shadow-xs space-y-1">
          <span className="type-small font-semibold text-[#737373]">Jobs Today</span>
          <div className="type-h2 font-tabular text-[#171717] pt-1">
            {report?.jobs_discovered_today ?? 0}
          </div>
          <p className="type-caption text-[#737373]">
            Eligible matches: {report?.eligible_matches_today ?? 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E0E3] p-5 shadow-xs space-y-1">
          <span className="type-small font-semibold text-[#737373]">Safety</span>
          <div className="flex items-center gap-1.5 type-h3 text-[#16845B] pt-1">
            <ShieldCheck className="w-5 h-5" />
            <span>
              {(report?.failed_applications || 0) === 0 ? 'Healthy' : `${report?.failed_applications} failures`}
            </span>
          </div>
          <p className="type-caption text-[#737373]">
            Pending manual: {report?.pending_manual_actions ?? 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E0E3] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E7E0E3] flex items-center justify-between">
          <h2 className="type-h2 text-[#171717]">Region Telemetry (live report)</h2>
          <span className="type-small font-semibold text-[#737373]">{report?.date || '—'}</span>
        </div>
        {regionRows.length === 0 ? (
          <p className="p-8 text-center type-small text-[#737373]">No region breakdown from API yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left type-small border-collapse">
              <thead>
                <tr className="border-b border-[#E7E0E3] bg-[#F6F3F4]/50 text-[#737373] font-semibold">
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">Jobs Discovered</th>
                  <th className="py-3 px-5">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0E3]">
                {regionRows.map((r) => (
                  <tr key={r.code} className="hover:bg-[#F6F3F4]/40">
                    <td className="py-3.5 px-5 font-semibold text-[#171717]">{r.code}</td>
                    <td className="py-3.5 px-5 font-bold text-[#171717]">{r.discovered}</td>
                    <td className="py-3.5 px-5 font-bold text-[#641E32]">{r.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationCenter;
