import React, { useEffect } from 'react';
import {
  ArrowRight,
  Compass,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { JobPilotLogo } from '../components/common/JobPilotLogo';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const FEATURES = [
  { icon: Compass, label: 'Global Job Search' },
  { icon: Scale, label: 'AI Matching' },
  { icon: ShieldCheck, label: 'Auto Applications' },
  { icon: TrendingUp, label: 'Track & Grow' },
] as const;

/** Wireframe globe — matches Figma right-side background graphic */
function GlobeGraphic() {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -right-10 top-8 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] pointer-events-none opacity-[0.45]"
      aria-hidden
    >
      <defs>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#641E32" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#641E32" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="globeStroke" x1="40" y1="40" x2="280" y2="280">
          <stop offset="0%" stopColor="#FB7185" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#E11D48" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#641E32" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="160" r="130" fill="url(#globeGlow)" />

      {/* Outer rings */}
      <circle cx="160" cy="160" r="118" stroke="url(#globeStroke)" strokeWidth="1.2" />
      <circle cx="160" cy="160" r="98" stroke="#E11D48" strokeOpacity="0.35" strokeWidth="0.8" />
      <circle cx="160" cy="160" r="72" stroke="#FB7185" strokeOpacity="0.28" strokeWidth="0.8" />

      {/* Longitude arcs */}
      <ellipse cx="160" cy="160" rx="48" ry="118" stroke="#E11D48" strokeOpacity="0.45" strokeWidth="0.9" />
      <ellipse cx="160" cy="160" rx="85" ry="118" stroke="#E11D48" strokeOpacity="0.35" strokeWidth="0.8" />
      <ellipse cx="160" cy="160" rx="118" ry="118" stroke="#641E32" strokeOpacity="0.5" strokeWidth="1" />

      {/* Latitude lines */}
      <ellipse cx="160" cy="160" rx="118" ry="28" stroke="#FB7185" strokeOpacity="0.4" strokeWidth="0.8" />
      <ellipse cx="160" cy="125" rx="108" ry="22" stroke="#E11D48" strokeOpacity="0.3" strokeWidth="0.7" />
      <ellipse cx="160" cy="195" rx="108" ry="22" stroke="#E11D48" strokeOpacity="0.3" strokeWidth="0.7" />
      <ellipse cx="160" cy="95" rx="85" ry="16" stroke="#FB7185" strokeOpacity="0.22" strokeWidth="0.6" />
      <ellipse cx="160" cy="225" rx="85" ry="16" stroke="#FB7185" strokeOpacity="0.22" strokeWidth="0.6" />

      {/* Network dots */}
      {[
        [160, 42], [210, 58], [248, 95], [268, 145], [255, 200],
        [210, 248], [160, 278], [110, 248], [65, 200], [52, 145],
        [72, 95], [110, 58], [185, 110], [130, 130], [190, 175],
        [125, 185], [160, 160], [230, 160], [90, 160],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 4 === 0 ? 2.2 : 1.4}
          fill="#FB7185"
          fillOpacity={i % 3 === 0 ? 0.85 : 0.45}
        />
      ))}

      {/* Connecting arcs */}
      <path
        d="M72 95 C110 70, 210 70, 248 95"
        stroke="#E11D48"
        strokeOpacity="0.35"
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M65 200 C110 230, 210 230, 255 200"
        stroke="#E11D48"
        strokeOpacity="0.3"
        strokeWidth="0.7"
        fill="none"
      />
      <path
        d="M90 160 C120 120, 200 200, 230 160"
        stroke="#FB7185"
        strokeOpacity="0.28"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  );
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070204] px-4 py-6 sm:px-6 overflow-y-auto select-none">
      {/* Page ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 45% at 72% 32%, rgba(100,30,50,0.4) 0%, transparent 70%), radial-gradient(ellipse 40% 35% at 18% 78%, rgba(67,19,33,0.28) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-5 animate-[welcomeIn_0.45s_ease-out]">
        {/* ── Figma welcome card (coded, not an image) ─────────────── */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08] px-7 pt-7 pb-8 sm:px-8 sm:pt-8 sm:pb-9"
          style={{
            background:
              'linear-gradient(155deg, #1A060E 0%, #120409 42%, #0A0205 100%)',
            boxShadow:
              '0 28px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <GlobeGraphic />

          {/* Brand header */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#E11D48]/35 blur-md" />
              <JobPilotLogo size={46} showBadge />
            </div>
            <div>
              <h2 className="type-h2 tracking-tight text-white leading-tight">
                JobPilot AI
              </h2>
              <p className="type-caption text-[#A3A3A3] font-medium tracking-wide mt-0.5">
                Global Jobs. Smarter Search.
              </p>
            </div>
          </div>

          {/* Headline + pitch */}
          <div className="relative z-10 mt-7 space-y-3">
            <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-white leading-[1.25]">
              Your AI-Powered
              <br />
              Job Hunting Assistant
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[#D4D4D4] leading-relaxed font-normal max-w-[92%]">
              Discover global opportunities, match with your skills, automate
              applications, and build your future — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <ul className="relative z-10 mt-7 space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#260A13] border border-[#641E32]/45 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#FB7185]" strokeWidth={2} />
                </div>
                <span
                  className="w-0.5 h-3.5 rounded-full shrink-0 bg-[#E11D48]"
                  aria-hidden
                />
                <span className="type-small font-semibold text-[#F5F5F5] tracking-wide">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={onContinue}
          autoFocus
          className="w-full py-3.5 px-6 rounded-2xl bg-[#641E32] hover:bg-[#87364F] active:bg-[#431321] text-white type-body font-bold shadow-lg shadow-[#641E32]/40 hover:shadow-[#641E32]/55 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 group"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="type-caption text-[#A3A3A3] text-center font-medium -mt-2">
          Press{' '}
          <kbd className="px-1.5 py-0.5 type-caption bg-[#260A13] border border-[#641E32]/40 rounded text-[#D4D4D4] font-mono">
            Enter ↵
          </kbd>{' '}
          to start
        </p>
      </div>

      <style>{`
        @keyframes welcomeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
