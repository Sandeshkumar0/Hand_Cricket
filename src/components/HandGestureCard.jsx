import React from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../utils/audio';

// Detailed SVG Hand Gestures representing 0 through 6
const GESTURE_SVGS = {
  0: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Closed Fist Gesture for 0 / Dot */}
      <circle cx="12" cy="12" r="7" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 9v6" />
    </svg>
  ),
  1: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Index Finger Raised */}
      <path d="M12 3v9" />
      <path d="M12 12a3 3 0 0 1 3 3v2a3 3 0 0 1-6 0v-2a3 3 0 0 1 3-3z" fill="currentColor" fillOpacity="0.1" />
      <path d="M9 14h6" />
      <path d="M9 17h6" />
    </svg>
  ),
  2: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Victory / 2 Fingers */}
      <path d="M9 3v8" />
      <path d="M15 3v8" />
      <path d="M7 11a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3" fill="currentColor" fillOpacity="0.1" />
      <path d="M8 17h8" />
    </svg>
  ),
  3: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* 3 Fingers (Index, Middle, Ring) */}
      <path d="M7 3v9" />
      <path d="M12 2v10" />
      <path d="M17 3v9" />
      <path d="M6 12a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  4: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* 4 Fingers */}
      <path d="M6 3v9" />
      <path d="M10 2v10" />
      <path d="M14 2v10" />
      <path d="M18 3v9" />
      <path d="M5 12a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  5: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* Open Palm 5 Fingers */}
      <path d="M4 8l2-4" />
      <path d="M8 3v8" />
      <path d="M12 2v9" />
      <path d="M16 3v8" />
      <path d="M20 7l-2 4" />
      <path d="M5 11a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4" fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  6: (
    <svg className="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {/* 6 Gesture / Power Strike */}
      <path d="M3 7l4 4" />
      <path d="M21 7l-4 4" />
      <path d="M7 11v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6" fill="currentColor" fillOpacity="0.1" />
      <circle cx="12" cy="14" r="3" strokeWidth="2" />
    </svg>
  ),
};

export default function HandGestureCard({
  value,
  isSelected,
  isDisabled,
  onClick,
  label = '',
}) {
  const handleHover = () => {
    if (!isDisabled) {
      soundEngine.playUiClick();
    }
  };

  const handleClick = () => {
    if (!isDisabled && onClick) {
      // Play DISTINCT audio sound for this specific digit (0 through 6)!
      soundEngine.playNumberSound(value);
      onClick(value);
    }
  };

  const getLightColor = (dotIndex) => {
    if (dotIndex > value) return 'bg-slate-800';
    if (value <= 2) return 'cyan';
    if (value <= 4) return 'yellow';
    return 'red';
  };

  return (
    <motion.button
      type="button"
      whileHover={!isDisabled ? { scale: 1.04, y: -3 } : {}}
      whileTap={!isDisabled ? { scale: 0.95, y: 1 } : {}}
      onMouseEnter={handleHover}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative group flex flex-col items-center justify-between p-3 rounded-xl border transition-all duration-200 overflow-hidden
        ${isDisabled ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40' : 'cursor-pointer'}
        ${
          isSelected
            ? 'apple-glass border-blue-500 shadow-lg shadow-blue-500/30 text-blue-400 bg-blue-950/50'
            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/90'
        }
      `}
    >
      {/* Top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="bmw-m-stripe h-full" />
      </div>

      {/* LEDs at top */}
      <div className="flex items-center space-x-1 mt-1 mb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`shift-light-dot ${getLightColor(i)}`} />
        ))}
      </div>

      {/* SVG Hand Gesture Icon */}
      <div className={`transition-transform duration-200 ${isSelected ? 'scale-110 text-blue-400' : 'group-hover:scale-105 text-slate-300'}`}>
        {GESTURE_SVGS[value] || (
          <span className="text-3xl font-extrabold">{value}</span>
        )}
      </div>

      {/* Digit Display */}
      <div className="mt-2 text-center">
        <span className="font-mono text-2xl font-black tracking-tight text-white drop-shadow">
          {value}
        </span>
        {label && <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">{label}</div>}
      </div>

      {/* Bottom Glow on Selected */}
      {isSelected && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 shadow-[0_0_12px_#0070d1]" />
      )}
    </motion.button>
  );
}
