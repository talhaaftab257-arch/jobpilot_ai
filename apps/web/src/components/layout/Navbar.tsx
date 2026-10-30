import React from 'react';
import {
  Briefcase,
  Bookmark,
  Send,
  FileText,
  Mail,
  BarChart3,
  Boxes,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Globe2,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export type NavTab =
  | 'jobs'
  | 'saved'
  | 'applications'
  | 'resumes'
  | 'templates'
  | 'analytics'
  | 'integrations'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  savedCount: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onTriggerDiscovery: () => void;
  isDiscovering: boolean;
  discoveryStatus?: string;
  dryRunMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  savedCount,
  isPaused,
  onTogglePause,
  onTriggerDiscovery,
  isDiscovering,
  discoveryStatus,
  dryRunMode
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string }[] = [
    { id: 'jobs', label: 'Find Jobs', icon: Briefcase },
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark, badge: savedCount > 0 ? savedCount : undefined },
    { id: 'applications', label: 'Applications', icon: Send },
    { id: 'resumes', label: 'Resume Library', icon: FileText, badge: '4 Reg' },
    { id: 'templates', label: 'Email Templates', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Product Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('jobs')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-all">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold type-body tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                    JobPilot
                  </span>
                  <span className="type-caption font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Global
                  </span>
                </div>
                <div className="type-caption text-slate-400 font-semibold leading-none mt-0.5">
                  AI Recruitment Engine
                </div>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Horizontal) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl type-small font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`type-caption font-black px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Run Discovery, Pause, Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Discovery Progress */}
            {discoveryStatus && (
              <span className="hidden xl:inline-flex items-center gap-1.5 type-small text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="truncate max-w-[140px]">{discoveryStatus}</span>
              </span>
            )}

            {/* Run Discovery Button */}
            <button
              onClick={onTriggerDiscovery}
              disabled={isDiscovering}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl type-small font-bold transition-all shadow-sm cursor-pointer ${
                isDiscovering
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isDiscovering ? 'Scanning...' : 'Run Discovery'}</span>
            </button>

            {/* Pause/Resume Toggle */}
            <button
              onClick={onTogglePause}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl type-small font-bold transition-all border shadow-xs cursor-pointer ${
                isPaused
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={isPaused ? 'Resume AI Agent' : 'Emergency Pause AI'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-emerald-600" /> : <Pause className="w-3.5 h-3.5 fill-current text-slate-500" />}
              <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black type-small text-slate-700" title="Talha Aftab">
              TA
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl type-small font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="type-caption font-black px-1.5 rounded-md bg-emerald-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
