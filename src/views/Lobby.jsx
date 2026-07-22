import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock3, Zap, Shield } from 'lucide-react';
import MotorsportHUD from '../components/MotorsportHUD';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

const SERIES_OPTIONS = [
  { length: 1, label: '1 MATCH QUICK' },
  { length: 3, label: '3 MATCH SERIES' },
  { length: 5, label: '5 MATCH CHAMPIONSHIP' },
];

function Lobby() {
  const { state, dispatch } = useGame();
  const { match_settings, timerOptions, overOptions } = state;

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#040711] px-4 py-6">
      <div className="stadium-spotlight" />
      <MotorsportHUD title="MATCH SETUP PROTOCOLS" subTitle="CONFIGURING CIRCUIT RULES & TIMINGS" phaseName="GARAGE SETUP" />

      <div className="relative z-10 flex flex-1 flex-col items-center max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full apple-glass-card rounded-2xl p-6 sm:p-8 border border-white/10"
        >
          {/* M Motorsport Tricolor Stripe Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="bmw-m-stripe-vertical h-8" />
            <div>
              <h2 className="esports-headline text-2xl font-black text-white">MATCH PROTOCOLS</h2>
              <p className="font-mono text-xs text-slate-400">CONFIGURE OVERS, SERIES LENGTH & MOVE TIMERS</p>
            </div>
          </div>

          {/* Overs per Innings */}
          <div className="mb-6">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">OVERS PER INNINGS</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {overOptions.map((option) => (
                <button
                  key={String(option)}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    dispatch({ type: 'UPDATE_OVERS', payload: option });
                  }}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-extrabold transition-all ${
                    match_settings.overs_per_innings === option
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 border border-white/10 hover:border-slate-600'
                  }`}
                >
                  {option === null ? 'UNLIMITED (∞)' : `${option} OVERS`}
                </button>
              ))}
            </div>
          </div>

          {/* Series Length */}
          <div className="mb-6">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">SERIES FORMAT</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SERIES_OPTIONS.map(({ length, label }) => (
                <button
                  key={length}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    dispatch({ type: 'UPDATE_SERIES_LENGTH', payload: length });
                  }}
                  className={`p-3.5 rounded-xl text-center font-mono text-xs font-extrabold transition-all ${
                    match_settings.series_length === length
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 border border-white/10 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Move Timer */}
          <div className="mb-8">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">DECISION TIMER</label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {timerOptions.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    dispatch({ type: 'UPDATE_TIMER', payload: duration });
                  }}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-mono text-xs font-extrabold transition-all ${
                    match_settings.timer_duration === duration
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 border border-white/10 hover:border-slate-600'
                  }`}
                >
                  <Clock3 size={14} />
                  <span>{duration === 0 ? 'OFF' : `${duration} SEC`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              dispatch({ type: 'START_MATCH' });
            }}
            className="tactile-btn w-full py-4 text-base font-black tracking-wider flex items-center justify-center space-x-2"
          >
            <Zap size={20} />
            <span>START MATCH SERIES</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Lobby;
