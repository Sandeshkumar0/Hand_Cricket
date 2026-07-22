import React from 'react';
import HandGestureCard from './HandGestureCard';

const GRID_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-3 md:grid-cols-6',
};

function NumberPad({
  options = [1, 2, 3, 4, 5, 6],
  onSelect,
  disabled = false,
  className = '',
  buttonClassName = '',
}) {
  return (
    <div className={`w-full ${disabled ? 'pointer-events-none opacity-40' : ''} ${className}`.trim()}>
      {/* Shift Light & Power Rev Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            SELECT MOVE (1 - 6)
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="shift-light-dot cyan" />
          <div className="shift-light-dot yellow" />
          <div className="shift-light-dot red" />
        </div>
      </div>

      {/* Grid of Hand Gesture Cards */}
      <div className={`grid gap-3.5 ${GRID_CLASS[options.length] || 'grid-cols-3 md:grid-cols-6'}`}>
        {options.map((value) => (
          <HandGestureCard
            key={value}
            value={value}
            isDisabled={disabled}
            onClick={onSelect}
            label={value === 6 ? 'SIX' : value === 4 ? 'FOUR' : `RUN ${value}`}
          />
        ))}
      </div>
    </div>
  );
}

export default NumberPad;
