import React from 'react';

interface JobPilotLogoProps {
  size?: number; // size in px, default 36
  className?: string;
  showBadge?: boolean;
}

export const JobPilotLogo: React.FC<JobPilotLogoProps> = ({
  size = 36,
  className = '',
  showBadge = true
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-xl shadow-xs ${className}`}
      style={{
        width: size,
        height: size,
        background: showBadge
          ? 'radial-gradient(circle at 35% 35%, #431321 0%, #260A13 60%, #150308 100%)'
          : 'transparent',
        border: showBadge ? '1px solid rgba(225, 29, 72, 0.25)' : 'none'
      }}
    >
      {/* Fallback to extracted PNG if needed, but vector SVG gives crisp rendering at any retina scale */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[78%] h-[78%] transition-transform hover:scale-105"
      >
        <defs>
          {/* Main Top Wing Gradient: Bright Vibrant Coral-Pink to Rose */}
          <linearGradient id="wingTopGrad" x1="12" y1="36" x2="38" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BE123C" />
            <stop offset="50%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>

          {/* Under Wing Shadow Gradient: Deep Dark Burgundy */}
          <linearGradient id="underWingGrad" x1="18" y1="28" x2="32" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4C0519" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>

          {/* Right Wing Gradient: Rich Crimson */}
          <linearGradient id="wingRightGrad" x1="22" y1="22" x2="40" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#881337" />
            <stop offset="60%" stopColor="#9F1239" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>

          {/* Core Crease Highlight */}
          <linearGradient id="spineGleam" x1="10" y1="38" x2="40" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FFE4E6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Under-wing Fold (Dark Shadow) */}
        <polygon
          points="10,38 24,28 32,32 10,38"
          fill="url(#underWingGrad)"
          opacity="0.9"
        />

        {/* 2. Right Wing (Deep Maroon / Rose shade) */}
        <polygon
          points="40,8 24,28 32,32 40,8"
          fill="url(#wingRightGrad)"
        />

        {/* 3. Main Upper Wing (Bright Vibrant Origami Fold) */}
        <polygon
          points="40,8 10,38 24,28 40,8"
          fill="url(#wingTopGrad)"
        />

        {/* 4. Leading Edge Highlight Spine */}
        <line
          x1="10"
          y1="38"
          x2="40"
          y2="8"
          stroke="url(#spineGleam)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* 5. Center Crease Line */}
        <line
          x1="24"
          y1="28"
          x2="40"
          y2="8"
          stroke="#FFFFFF"
          strokeOpacity="0.5"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
};

export default JobPilotLogo;
