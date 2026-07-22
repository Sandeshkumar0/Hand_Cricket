import React from 'react';

export default function CricketBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#060c18]">
      {/* Stadium Night Sky Radial Light Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.25)_0%,rgba(15,23,42,0.8)_60%,#060c18_100%)]" />

      {/* Stadium Floodlight Beams (Top Left & Top Right) */}
      <div className="absolute -top-24 left-10 w-96 h-[500px] bg-gradient-to-b from-blue-400/20 via-cyan-400/5 to-transparent blur-2xl transform -rotate-12" />
      <div className="absolute -top-24 right-10 w-96 h-[500px] bg-gradient-to-b from-blue-400/20 via-cyan-400/5 to-transparent blur-2xl transform rotate-12" />

      {/* Cricket Pitch Overlay (Turf Texture & Crease Lines) at Bottom */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-emerald-950/40 via-slate-900/30 to-transparent opacity-60">
        <svg className="w-full h-full opacity-20" viewBox="0 0 1000 250" preserveAspectRatio="none">
          {/* Pitch boundary oval */}
          <ellipse cx="500" cy="200" rx="450" ry="100" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" />
          {/* Pitch crease rectangle */}
          <rect x="420" y="160" width="160" height="70" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="1" />
          {/* Popping Creases */}
          <line x1="420" y1="180" x2="580" y2="180" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
          <line x1="420" y1="210" x2="580" y2="210" stroke="#ffffff" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>

      {/* Cricket Batter Silhouette (Right Side) */}
      <div className="absolute bottom-10 right-4 sm:right-16 opacity-15 text-blue-400">
        <svg className="w-64 h-64 sm:w-80 sm:h-80" viewBox="0 0 200 200" fill="currentColor">
          {/* Batter in position */}
          <circle cx="95" cy="40" r="14" />
          {/* Body posture */}
          <path d="M75 58 L115 58 L125 110 L105 175 L90 175 L105 115 L80 115 L65 175 L50 175 L70 105 Z" />
          {/* Cricket Bat in hands */}
          <path d="M110 70 L160 120 L150 130 L100 80 Z" fill="#38bdf8" opacity="0.8" />
          {/* Bat Handle */}
          <line x1="100" y1="70" x2="115" y2="85" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Bowler / Wicketkeeper Silhouette (Left Side) */}
      <div className="absolute bottom-12 left-4 sm:left-12 opacity-15 text-cyan-400">
        <svg className="w-56 h-56 sm:w-72 sm:h-72" viewBox="0 0 200 200" fill="currentColor">
          {/* Bowler release pose */}
          <circle cx="100" cy="30" r="13" />
          <path d="M85 45 L115 45 L125 95 L145 165 L130 165 L110 105 L90 105 L70 165 L55 165 L80 95 Z" />
          {/* Raised Bowling Arm */}
          <path d="M115 45 L145 15 L155 25 L125 55 Z" fill="#38bdf8" opacity="0.8" />
          {/* Cricket Ball in hand */}
          <circle cx="150" cy="18" r="6" fill="#ef4444" />
        </svg>
      </div>

      {/* Floating Red Cricket Ball with Seam */}
      <div className="absolute top-16 right-1/4 opacity-25 animate-pulse">
        <svg className="w-16 h-16" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#dc2626" />
          {/* White seam */}
          <path d="M20 50 Q50 10 80 50 Q50 90 20 50" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="3 2" />
        </svg>
      </div>
    </div>
  );
}
