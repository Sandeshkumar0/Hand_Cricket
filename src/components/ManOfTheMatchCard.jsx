import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Award, Star, ChevronRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function ManOfTheMatchCard({
  motmInfo,
  playerStats,
  botStats,
  onContinueToResult,
}) {
  useEffect(() => {
    soundEngine.playMatchVictorySound();
  }, []);

  if (!motmInfo) return null;

  const isPlayer = motmInfo.motmWinner === 'player';
  const winnerMatch = isPlayer ? playerStats : botStats;
  const winnerPoints = motmInfo.winnerStats;

  const winnerName = isPlayer ? 'CHAMPION PLAYER' : 'AI MASTERMIND';
  const winnerTeam = isPlayer ? 'India Legends' : 'Cyber Strikers';
  const winnerRole = isPlayer ? 'All-Rounder' : 'Bowler';
  const winnerAvatar = isPlayer ? '🏏' : '🤖';

  const runs = winnerMatch.runs || 0;
  const balls = winnerMatch.ballsFaced || 0;
  const fours = winnerMatch.fours || 0;
  const sixes = winnerMatch.sixes || 0;
  const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  const wickets = winnerMatch.wickets || 0;
  const overs = winnerMatch.ballsBowled ? Math.floor(winnerMatch.ballsBowled / 6) : 0;
  const economy = overs > 0 ? (winnerMatch.runsConceded / overs).toFixed(2) : '0.00';
  const dots = winnerMatch.dotBalls || 0;

  const matchRating = Math.min(99, Math.round(75 + winnerPoints.totalPoints / 3));

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[#040711] px-4 py-8 text-center min-h-[100dvh]">
      {/* Stadium Spotlight Beams */}
      <div className="stadium-spotlight" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        className="relative z-10 w-full max-w-xl apple-glass-card rounded-3xl p-6 sm:p-10 border border-amber-500/40 shadow-2xl shadow-amber-500/10 overflow-hidden"
      >
        {/* Shiny Gold Hairline Stripe */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_15px_#ffce21]" />

        {/* Animated Trophy Banner */}
        <motion.div
          initial={{ rotate: -10, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-2xl shadow-amber-500/40 mb-4"
        >
          <Trophy size={54} className="drop-shadow" />
        </motion.div>

        {/* Title */}
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>MAN OF THE MATCH</span>
        </div>

        <h2 className="esports-headline text-4xl sm:text-5xl font-black text-white tracking-wide">
          {winnerName}
        </h2>
        <p className="font-mono text-xs text-amber-400/90 uppercase tracking-widest mt-1">
          {winnerTeam} • {winnerRole}
        </p>

        {/* Total Points & Rating Callout */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
            <p className="font-mono text-[10px] uppercase font-bold text-amber-400">TOTAL FANTASY POINTS</p>
            <p className="font-mono text-4xl font-black text-amber-300 mt-1">{winnerPoints.totalPoints}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-center">
            <p className="font-mono text-[10px] uppercase font-bold text-slate-400">MATCH RATING</p>
            <p className="font-mono text-4xl font-black text-emerald-400 mt-1">{matchRating} / 99</p>
          </div>
        </div>

        {/* Performance Stats Breakdown */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">RUNS</p>
            <p className="text-lg font-black text-white">{runs}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">BALLS</p>
            <p className="text-lg font-black text-white">{balls}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">FOURS</p>
            <p className="text-lg font-black text-blue-400">{fours}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">SIXES</p>
            <p className="text-lg font-black text-amber-400">{sixes}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">WICKETS</p>
            <p className="text-lg font-black text-red-400">{wickets}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold">ECONOMY</p>
            <p className="text-lg font-black text-cyan-400">{economy}</p>
          </div>
        </div>

        {/* Selection Reason Box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/90 border border-white/10 text-left text-xs font-mono text-slate-300 leading-relaxed">
          <span className="font-bold text-amber-400 uppercase tracking-widest block mb-1">SELECTION REASON</span>
          {motmInfo.reason}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onContinueToResult();
            }}
            className="tactile-btn px-10 py-4 text-base font-black tracking-wider flex items-center space-x-2"
          >
            <span>CONTINUE TO FINAL RESULT</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
