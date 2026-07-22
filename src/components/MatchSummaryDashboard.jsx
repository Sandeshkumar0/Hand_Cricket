import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Award, Zap, Shield, ChevronRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function MatchSummaryDashboard({
  matchStats,
  ballLog,
  matchSettings,
  onProceedToMotm,
}) {
  const [activeChart, setActiveChart] = useState('manhattan'); // 'manhattan' | 'worm' | 'boundaries'

  const playerRuns = matchStats.player.runs || 0;
  const playerBalls = matchStats.player.ballsFaced || 0;
  const playerWickets = matchStats.player.dismissals || 0;
  const playerFours = matchStats.player.fours || 0;
  const playerSixes = matchStats.player.sixes || 0;
  const playerDots = matchStats.player.dotBalls || 0;
  const playerSR = playerBalls > 0 ? ((playerRuns / playerBalls) * 100).toFixed(1) : '0.0';

  const botRuns = matchStats.bot.runs || 0;
  const botBalls = matchStats.bot.ballsFaced || 0;
  const botWickets = matchStats.bot.dismissals || 0;
  const botFours = matchStats.bot.fours || 0;
  const botSixes = matchStats.bot.sixes || 0;
  const botDots = matchStats.bot.dotBalls || 0;
  const botSR = botBalls > 0 ? ((botRuns / botBalls) * 100).toFixed(1) : '0.0';

  // Compute over-by-over runs for Manhattan & Worm charts
  const overData = [];
  const maxOvers = Math.max(1, Math.ceil(ballLog.length / 6));

  for (let o = 0; o < maxOvers; o++) {
    const start = o * 6;
    const overBalls = ballLog.slice(start, start + 6);
    const runsInOver = overBalls.reduce((acc, b) => acc + (b.runs || 0), 0);
    overData.push({
      over: o + 1,
      runs: runsInOver,
    });
  }

  const maxOverRuns = Math.max(6, ...overData.map((d) => d.runs));

  // Top Performers calculation
  const topScorer = playerRuns >= botRuns
    ? { name: 'Player', runs: playerRuns, balls: playerBalls, sr: playerSR }
    : { name: 'Bot AI', runs: botRuns, balls: botBalls, sr: botSR };

  const topBowler = matchStats.player.wickets >= matchStats.bot.wickets
    ? { name: 'Player', wickets: matchStats.player.wickets, economy: (matchStats.player.runsConceded / Math.max(1, matchStats.player.ballsBowled / 6)).toFixed(2), dots: matchStats.player.dotBalls }
    : { name: 'Bot AI', wickets: matchStats.bot.wickets, economy: (matchStats.bot.runsConceded / Math.max(1, matchStats.bot.ballsBowled / 6)).toFixed(2), dots: matchStats.bot.dotBalls };

  const mostSixes = playerSixes >= botSixes ? { name: 'Player', count: playerSixes } : { name: 'Bot AI', count: botSixes };
  const mostFours = playerFours >= botFours ? { name: 'Player', count: playerFours } : { name: 'Bot AI', count: botFours };

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#040711] px-4 py-6 max-w-5xl mx-auto w-full">
      {/* Top Section */}
      <div className="text-center mb-6">
        <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold uppercase tracking-widest">
          MATCH END ANALYTICS
        </span>
        <h2 className="esports-headline mt-3 text-4xl sm:text-5xl font-black text-white">
          MATCH SUMMARY DASHBOARD
        </h2>
        <p className="font-mono text-xs text-slate-400 mt-1 uppercase">ESPN CRICINFO TELEMETRY BREAKDOWN</p>
      </div>

      {/* Team Comparison Grid */}
      <div className="apple-glass-card rounded-2xl p-6 border border-white/10 mb-6">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">TEAM METRIC COMPARISON</h3>
        <div className="grid grid-cols-3 items-center text-center font-mono text-xs sm:text-sm border-b border-white/10 pb-3 mb-3 text-slate-400 font-bold">
          <span>YOU (PLAYER)</span>
          <span>METRIC</span>
          <span>OPPONENT (BOT)</span>
        </div>

        {[
          { label: 'RUNS / WICKETS', p: `${playerRuns}/${playerWickets}`, b: `${botRuns}/${botWickets}` },
          { label: 'BOUNDARIES (4s)', p: playerFours, b: botFours },
          { label: 'SIXES (6s)', p: playerSixes, b: botSixes },
          { label: 'DOT BALLS', p: playerDots, b: botDots },
          { label: 'STRIKE RATE', p: playerSR, b: botSR },
        ].map((row) => (
          <div key={row.label} className="grid grid-cols-3 items-center text-center font-mono py-2.5 border-b border-white/5 text-xs sm:text-sm">
            <span className="font-black text-blue-400">{row.p}</span>
            <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase">{row.label}</span>
            <span className="font-black text-amber-400">{row.b}</span>
          </div>
        ))}
      </div>

      {/* Interactive Chart Selector & Display */}
      <div className="apple-glass-card rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300">ANALYTICS GRAPHS</h3>
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-white/5">
            {[
              { id: 'manhattan', label: 'MANHATTAN (OVERS)' },
              { id: 'boundaries', label: 'BOUNDARY BREAKDOWN' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setActiveChart(tab.id);
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition ${
                  activeChart === tab.id ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manhattan Chart (Runs per Over) */}
        {activeChart === 'manhattan' && (
          <div>
            <div className="h-48 flex items-end justify-between space-x-2 pt-6 pb-2 border-b border-white/10 px-4">
              {overData.map((d) => (
                <div key={d.over} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white pointer-events-none">
                    Over {d.over}: {d.runs} runs
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500"
                    style={{ height: `${(d.runs / maxOverRuns) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 mt-2 font-mono text-[10px] text-slate-400">
              <span>OVER 1</span>
              <span>OVER {maxOvers}</span>
            </div>
          </div>
        )}

        {/* Boundary Breakdown */}
        {activeChart === 'boundaries' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center py-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
              <p className="font-mono text-[10px] text-slate-400 font-bold">4s SCORED</p>
              <p className="font-mono text-3xl font-black text-blue-400 mt-1">{playerFours}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
              <p className="font-mono text-[10px] text-slate-400 font-bold">6s SCORED</p>
              <p className="font-mono text-3xl font-black text-amber-400 mt-1">{playerSixes}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
              <p className="font-mono text-[10px] text-slate-400 font-bold">DOT BALLS</p>
              <p className="font-mono text-3xl font-black text-slate-300 mt-1">{playerDots}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5">
              <p className="font-mono text-[10px] text-slate-400 font-bold">TOTAL BALLS</p>
              <p className="font-mono text-3xl font-black text-cyan-400 mt-1">{playerBalls}</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Performers Cards */}
      <div className="mb-6">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">MATCH TOP PERFORMERS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="apple-glass-card rounded-2xl p-4 border border-white/10">
            <p className="font-mono text-[10px] font-bold uppercase text-blue-400">TOP SCORER</p>
            <p className="font-mono text-lg font-black text-white mt-1">{topScorer.name}</p>
            <p className="font-mono text-xs text-slate-400">{topScorer.runs} runs off {topScorer.balls} balls (SR {topScorer.sr})</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-4 border border-white/10">
            <p className="font-mono text-[10px] font-bold uppercase text-red-400">TOP BOWLER</p>
            <p className="font-mono text-lg font-black text-white mt-1">{topBowler.name}</p>
            <p className="font-mono text-xs text-slate-400">{topBowler.wickets} wickets (Econ {topBowler.economy})</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-4 border border-white/10">
            <p className="font-mono text-[10px] font-bold uppercase text-amber-400">MOST SIXES</p>
            <p className="font-mono text-lg font-black text-white mt-1">{mostSixes.name}</p>
            <p className="font-mono text-xs text-slate-400">{mostSixes.count} Sixes</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-4 border border-white/10">
            <p className="font-mono text-[10px] font-bold uppercase text-emerald-400">MOST FOURS</p>
            <p className="font-mono text-lg font-black text-white mt-1">{mostFours.name}</p>
            <p className="font-mono text-xs text-slate-400">{mostFours.count} Fours</p>
          </div>
        </div>
      </div>

      {/* Action Button to Proceed to Step 2 (Man of the Match Screen) */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onProceedToMotm();
          }}
          className="tactile-btn px-10 py-4 text-base font-black tracking-wider flex items-center space-x-3 shadow-xl"
        >
          <span>REVEAL MAN OF THE MATCH</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
