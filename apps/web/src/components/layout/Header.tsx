import React from 'react';
import {
  Bell,
  Search,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  pageTitle: string;
  currentTab: NavTab;
  isPaused: boolean;
  onTogglePause: () => void;
  onTriggerDiscovery: () => void;
  isDiscovering: boolean;
  dryRunMode: boolean;
  discoveryStatus?: string;
  onNavigate: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  currentTab,
  isPaused,
  onTogglePause,
  dryRunMode,
  onNavigate
}) => {
  return (
    <header className="border-b border-[#E7E0E3] bg-white sticky top-0 z-20 shrink-0">
      <div className="px-6 py-3.5 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Global Search Input */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#F6F3F4] rounded-xl border border-[#E7E0E3] type-small text-[#737373] focus-within:border-[#641E32] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-[#737373] shrink-0" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              className="w-full bg-transparent outline-none text-[#171717] placeholder-[#737373] type-small font-medium"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded type-caption font-mono bg-white border border-[#E7E0E3] text-[#737373] shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Date, Automation status pill, Bell & User Profile */}
        <div className="flex items-center gap-3.5">
          {/* Current Date */}
          <span className="hidden lg:inline type-small font-semibold text-[#737373]">
            Monday, 28 April 2025
          </span>

          {/* Automation status pill with toggle */}
          <button
            onClick={onTogglePause}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full type-small font-semibold border transition-all cursor-pointer ${
              isPaused
                ? 'bg-[#FEF3C7] text-[#B7791F] border-[#FDE68A]'
                : 'bg-[#ECFDF5] text-[#16845B] border-[#A7F3D0]'
            }`}
            title="Toggle pause/resume"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-[#B7791F] animate-pulse' : 'bg-[#16845B]'
              }`}
            />
            <span className="hidden sm:inline font-bold">
              {isPaused ? 'Automation Paused' : 'Automation Running'}
            </span>
          </button>

          {dryRunMode && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full type-caption font-semibold bg-[#F6F3F4] text-[#737373] border border-[#E7E0E3]">
              <ShieldCheck className="w-3 h-3 text-[#737373]" /> Dry-Run
            </span>
          )}

          {/* Notifications */}
          <button
            className="p-2 rounded-xl text-[#737373] hover:text-[#171717] hover:bg-[#F6F3F4] transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#641E32]" />
          </button>

          {/* User Avatar Circle */}
          <div
            onClick={() => onNavigate('settings')}
            className="w-8 h-8 rounded-full bg-[#641E32] text-white flex items-center justify-center type-small font-black cursor-pointer shadow-xs border border-[#87364F]/30"
            title="Settings"
          >
            {(() => {
              try {
                const name = localStorage.getItem('jobpilot_candidate_name') || 'TA';
                return name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() || '')
                  .join('') || 'U';
              } catch {
                return 'U';
              }
            })()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
