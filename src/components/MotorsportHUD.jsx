import React from 'react';
import { ShieldAlert, Zap, Activity } from 'lucide-react';

export default function MotorsportHUD({
  title = 'HAND CRICKET ARENA',
  subTitle = 'LIVE MATCH TELEMETRY',
  lightbarState = 'blue',
  currentRunRate = 0,
  requiredRunRate = null,
  wicketsRemaining = 10,
  phaseName = 'INNINGS 1',
}) {
  const getLightbarClass = () => {
    switch (lightbarState) {
      case 'red':
        return 'ps-lightbar-red';
      case 'gold':
        return 'ps-lightbar-gold';
      default:
        return 'ps-lightbar-blue';
    }
  };

  const crrPercentage = Math.min(Math.max((currentRunRate / 18) * 100, 5), 100);
  const rrrPercentage = requiredRunRate !== null ? Math.min(Math.max((requiredRunRate / 18) * 100, 5), 100) : null;

  return (
    <div className="relative w-full z-20 mb-4">
      {/* Stadium Ambient Beam */}
      <div className={`h-1 w-full transition-all duration-500 rounded-t-lg ${getLightbarClass()}`} />

      {/* Clean Telemetry Container */}
      <div className="apple-glass px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-b border-white/10">
        {/* Status Badge */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-400 font-black">
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="esports-headline text-xs tracking-wider text-white">{title}</span>
              <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
                {phaseName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">{subTitle}</p>
          </div>
        </div>

        {/* Cricket Run Rate & Telemetry Gauge */}
        <div className="flex items-center space-x-6 px-4 py-1.5 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-xs">
          {/* Current Run Rate */}
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="flex items-center justify-between space-x-3 text-[10px] uppercase text-slate-400">
                <span>CRR</span>
                <span className="text-cyan-400 font-bold">{currentRunRate ? currentRunRate.toFixed(1) : '0.0'}</span>
              </div>
              <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${crrPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Required Run Rate */}
          {requiredRunRate !== null && (
            <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
              <div>
                <div className="flex items-center justify-between space-x-3 text-[10px] uppercase text-slate-400">
                  <span>RRR</span>
                  <span className="text-amber-400 font-bold">{requiredRunRate.toFixed(1)}</span>
                </div>
                <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300 rounded-full"
                    style={{ width: `${rrrPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wicket Pressure Indicator */}
          <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-4">
            <ShieldAlert className={`w-4 h-4 ${wicketsRemaining <= 2 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
            <div className="text-[11px]">
              <span className="text-slate-400">WICKETS: </span>
              <span className={wicketsRemaining <= 2 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                {wicketsRemaining} LEFT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
