import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, Award, Target, Flame, Activity, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function PlayerProfileModal({ open, onClose, playerStats }) {
  const [activeTab, setActiveTab] = useState('batting'); // 'batting' | 'bowling' | 'extra'

  if (!open || !playerStats) return null;

  const {
    name = 'Player',
    team = 'India Legends',
    role = 'All-Rounder',
    avatar = '🏏',
    matchesPlayed = 0,
    wins = 0,
    runs = 0,
    ballsFaced = 0,
    highestScore = 0,
    fours = 0,
    sixes = 0,
    fifties = 0,
    hundreds = 0,
    ducks = 0,
    notOuts = 0,
    wickets = 0,
    oversBowled = 0,
    runsConceded = 0,
    maidens = 0,
    dotBalls = 0,
    bestBowlingWickets = 0,
    bestBowlingRuns = 0,
    motmAwards = 0,
    totalCareerPoints = 0,
    recentForm = ['W', 'W', 'L', 'W', 'W'],
  } = playerStats;

  // Calculated Career Metrics
  const battingDismissals = Math.max(1, matchesPlayed - notOuts);
  const battingAvg = matchesPlayed > 0 ? (runs / battingDismissals).toFixed(2) : '0.00';
  const strikeRate = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';
  const bowlingAvg = wickets > 0 ? (runsConceded / wickets).toFixed(2) : '0.00';
  const economy = oversBowled > 0 ? (runsConceded / oversBowled).toFixed(2) : '0.00';
  const winPercent = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(0) : '0';
  const careerRating = matchesPlayed > 0 ? Math.round((runs * 1.5 + wickets * 20 + motmAwards * 50) / Math.max(1, matchesPlayed)) : 85;

  const handleTabChange = (tab) => {
    soundEngine.playUiClick();
    setActiveTab(tab);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          className="relative w-full max-w-2xl apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Hairline Stripe */}
          <div className="bmw-m-stripe absolute top-0 left-0 right-0 h-1" />

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition z-10"
          >
            <X size={18} />
          </button>

          {/* Top Header Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-white/10">
            {/* Player Avatar */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600/30 via-slate-900 to-blue-950 border-2 border-blue-500/40 shadow-xl text-5xl">
              {avatar}
              <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-blue-500 text-[9px] font-mono font-black text-slate-950 uppercase tracking-widest">
                PRO
              </div>
            </div>

            {/* Player Details */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono font-bold uppercase">
                  {role}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold uppercase">
                  RATING {careerRating}
                </span>
              </div>

              <h2 className="esports-headline text-3xl font-black text-white tracking-wide">{name}</h2>
              <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mt-0.5">{team}</p>

              {/* Quick Bar Stats */}
              <div className="mt-3 flex items-center justify-center sm:justify-start space-x-4 text-xs font-mono text-slate-300">
                <div><span className="text-slate-500">MATCHES: </span><span className="font-bold text-white">{matchesPlayed}</span></div>
                <div><span className="text-slate-500">MOTM: </span><span className="font-bold text-amber-400">{motmAwards} 🏆</span></div>
                <div><span className="text-slate-500">WIN %: </span><span className="font-bold text-emerald-400">{winPercent}%</span></div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center space-x-2 my-5 bg-slate-950/80 p-1.5 rounded-xl border border-white/5">
            {[
              { id: 'batting', label: 'BATTING STATS' },
              { id: 'bowling', label: 'BOWLING STATS' },
              { id: 'extra', label: 'CAREER & FORM' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Batting Statistics */}
          {activeTab === 'batting' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'TOTAL RUNS', value: runs, color: 'text-white' },
                { label: 'MATCHES PLAYED', value: matchesPlayed, color: 'text-slate-300' },
                { label: 'BATTING AVERAGE', value: battingAvg, color: 'text-cyan-400' },
                { label: 'STRIKE RATE', value: strikeRate, color: 'text-blue-400' },
                { label: 'HIGHEST SCORE', value: highestScore, color: 'text-amber-400' },
                { label: 'BALLS FACED', value: ballsFaced, color: 'text-slate-300' },
                { label: 'FOURS (4s)', value: fours, color: 'text-blue-300' },
                { label: 'SIXES (6s)', value: sixes, color: 'text-amber-300' },
                { label: 'TOTAL 50s', value: fifties, color: 'text-emerald-400' },
                { label: 'TOTAL 100s', value: hundreds, color: 'text-amber-400' },
                { label: 'DUCKS', value: ducks, color: 'text-red-400' },
                { label: 'NOT OUTS', value: notOuts, color: 'text-emerald-300' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-center">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={`mt-1 font-mono text-xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab 2: Bowling Statistics */}
          {activeTab === 'bowling' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'TOTAL WICKETS', value: wickets, color: 'text-white' },
                { label: 'BOWLING AVERAGE', value: bowlingAvg, color: 'text-cyan-400' },
                { label: 'ECONOMY RATE', value: economy, color: 'text-blue-400' },
                { label: 'BEST FIGURES', value: bestBowlingWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : 'N/A', color: 'text-amber-400' },
                { label: 'OVERS BOWLED', value: oversBowled, color: 'text-slate-300' },
                { label: 'MAIDEN OVERS', value: maidens, color: 'text-emerald-400' },
                { label: 'DOT BALLS', value: dotBalls, color: 'text-blue-300' },
                { label: 'RUNS CONCEDED', value: runsConceded, color: 'text-red-400' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/90 border border-white/5 text-center">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={`mt-1 font-mono text-xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab 3: Extra Information */}
          {activeTab === 'extra' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] text-slate-400 font-bold uppercase">MOTM AWARDS</p>
                    <p className="font-mono text-2xl font-black text-white">{motmAwards} Trophies</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-mono text-[10px] text-slate-400 font-bold uppercase">WIN PERCENTAGE</p>
                    <p className="font-mono text-2xl font-black text-white">{winPercent}%</p>
                  </div>
                </div>
              </div>

              {/* Recent Form */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300 mb-3">RECENT MATCH FORM</p>
                <div className="flex items-center space-x-3">
                  {recentForm.map((result, idx) => (
                    <div
                      key={idx}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black border ${
                        result === 'W'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
