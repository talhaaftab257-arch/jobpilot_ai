import React from 'react';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  CheckSquare,
  Mail,
  FileText,
  Bot,
  Calendar,
  BarChart3,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  SendHorizontal,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { JobPilotLogo } from '../common/JobPilotLogo';

export type NavTab =
  | 'overview'
  | 'jobs'
  | 'details'
  | 'matched'
  | 'applications'
  | 'templates'
  | 'resumes'
  | 'assistant'
  | 'calendar'
  | 'analytics'
  | 'integrations'
  | 'automation'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  savedCount: number;
  isPaused: boolean;
  quotaUsed: number;
  quotaMax: number;
  candidateName?: string;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'jobs', label: 'Discover Jobs', icon: Search },
  { id: 'matched', label: 'Matched Jobs', icon: Sparkles },
  { id: 'applications', label: 'Applications', icon: CheckSquare },
  { id: 'templates', label: 'Email Templates', icon: Mail },
  { id: 'resumes', label: 'Resume Library', icon: FileText, badge: '4' },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  savedCount,
  isPaused,
  quotaUsed,
  quotaMax,
  candidateName = 'User',
}) => {
  const activeNavId = currentTab === 'details' ? 'jobs' : currentTab;
  const initials = candidateName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'U';

  return (
    <aside
      className={`relative flex flex-col bg-[#171717] border-r border-[#262626] text-white transition-all duration-300 z-30 select-none shrink-0 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header with Paper Airplane Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#262626] bg-[#171717]">
        <div className={`flex items-center gap-3 flex-1 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0">
            <JobPilotLogo size={36} />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#171717] ${
                isPaused ? 'bg-[#B7791F]' : 'bg-[#16845B]'
              }`}
              title={isPaused ? 'Agent Paused' : 'Automation Active'}
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <span className="font-extrabold type-body tracking-tight text-white block leading-tight">
                JobPilot AI
              </span>
              <p className="type-caption text-[#A3A3A3] font-medium truncate mt-0.5">
                Global Jobs. Smarter Search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Block under logo (Talha Aftab Alam) */}
      {!collapsed && (
        <div className="px-3.5 py-3 border-b border-[#262626] flex items-center gap-2.5 bg-[#171717]">
          <div className="w-8 h-8 rounded-full bg-[#641E32] text-white flex items-center justify-center type-small font-black shrink-0 border border-[#87364F]/40 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="type-small font-bold text-white truncate">{candidateName}</div>
            <div className="type-caption text-[#A3A3A3] truncate font-medium">Candidate • Global</div>
          </div>
        </div>
      )}

      {/* Navigation Items (Single Clean Vertical List matching board) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNavId === item.id;
          const badgeValue = item.badge;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl type-small font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#641E32] text-white shadow-xs font-bold'
                  : 'text-[#D4D4D4] hover:text-white hover:bg-[#262626]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-[#A3A3A3] group-hover:text-white'
                }`}
              />

              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {badgeValue !== undefined && (
                    <span
                      className={`type-caption font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#431321] text-white border border-[#87364F]'
                          : 'bg-[#262626] text-[#A3A3A3]'
                      }`}
                    >
                      {badgeValue}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Card matching reference image wave container */}
      <div className="p-3 border-t border-[#262626] bg-[#171717] space-y-2">
        {!collapsed ? (
          <div className="relative overflow-hidden p-3 rounded-2xl bg-gradient-to-br from-[#260A13] via-[#1A070D] to-[#120509] border border-[#431321]/60 shadow-lg space-y-2">
            {/* Red / Maroon Wave Overlay */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#641E32]/30 blur-md pointer-events-none" />

            <div className="flex items-center gap-2 relative z-10">
              <div className="w-6 h-6 rounded-lg bg-[#641E32] flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="type-small font-bold text-white tracking-tight">Pro Automation</span>
            </div>

            <div className="type-caption text-[#D4D4D4] leading-tight relative z-10 font-medium">
              Daily quota: <strong className="text-white">{quotaUsed}/{quotaMax || 30}</strong> applications
            </div>

            <div className="w-full h-1.5 rounded-full bg-[#33111C] overflow-hidden relative z-10">
              <div
                className="h-full rounded-full bg-[#87364F] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((quotaUsed / (quotaMax || 30)) * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`Quota: ${quotaUsed}/${quotaMax || 30}`}>
            <div className="w-8 h-8 rounded-lg bg-[#202020] border border-[#2E2E2E] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#B7791F]" />
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="flex justify-end">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
