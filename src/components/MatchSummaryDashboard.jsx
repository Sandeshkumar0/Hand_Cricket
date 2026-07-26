import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Award, Zap, Shield, ChevronRight } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

export default function MatchSummaryDashboard({
  matchStats,
  ballLog,
  matchSettings,
  onProceedToMotm,
}) {
  const [activeChart, setActiveChart] = useState('manhattan'); // 'manhattan' | 'worm' | 'boundaries'
  const { currentUser } = useAuth();
  const playerName = currentUser?.displayName || 'Player';

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

  // Worm Chart Calculation
  const getWormData = (inningsNum) => {
    const inningsBalls = ballLog.filter((b) => b.innings === inningsNum);
    const maxInningsOvers = Math.max(1, Math.ceil(inningsBalls.length / 6));
    let cumulativeRuns = 0;
    const worm = [{ over: 0, runs: 0 }]; // start at 0
    for (let o = 0; o < maxInningsOvers; o++) {
      const start = o * 6;
      const overBalls = inningsBalls.slice(start, start + 6);
      const runsInOver = overBalls.reduce((acc, b) => acc + (b.runs || 0), 0);
      cumulativeRuns += runsInOver;
      worm.push({ over: o + 1, runs: cumulativeRuns });
    }
    return worm;
  };

  const worm1 = getWormData(1);
  const worm2 = getWormData(2);
  const maxOversBoth = Math.max(worm1.length - 1, worm2.length - 1, 1);
  const maxRunsBoth = Math.max(...worm1.map((w) => w.runs), ...worm2.map((w) => w.runs), 10);

  const getBattingSideKey = (inningsNum) => {
    const firstBall = ballLog.find((b) => b.innings === inningsNum);
    if (!firstBall) return null;
    return firstBall.playerRole === 'batter' ? 'player' : 'bot';
  };
  const innings1Side = getBattingSideKey(1);
  const innings2Side = getBattingSideKey(2);

  const svgWidth = 1000;
  const svgHeight = 400;

  const worm1Points = worm1.map((w) => `${(w.over / maxOversBoth) * svgWidth},${svgHeight - (w.runs / maxRunsBoth) * svgHeight}`).join(' ');
  const worm2Points = worm2.map((w) => `${(w.over / maxOversBoth) * svgWidth},${svgHeight - (w.runs / maxRunsBoth) * svgHeight}`).join(' ');

  const colorPlayer = "#3B82F6"; // blue-500
  const colorBot = "#F59E0B"; // amber-500

  const color1 = innings1Side === 'player' ? colorPlayer : colorBot;
  const color2 = innings2Side === 'player' ? colorPlayer : colorBot;
  const label1 = innings1Side === 'player' ? playerName : 'Bot AI';
  const label2 = innings2Side === 'player' ? playerName : 'Bot AI';

  // Top Performers calculation
  const topScorer = playerRuns >= botRuns
    ? { name: playerName, runs: playerRuns, balls: playerBalls, sr: playerSR }
    : { name: 'Bot AI', runs: botRuns, balls: botBalls, sr: botSR };

  const topBowler = matchStats.player.wickets >= matchStats.bot.wickets
    ? { name: playerName, wickets: matchStats.player.wickets, economy: (matchStats.player.runsConceded / Math.max(1, matchStats.player.ballsBowled / 6)).toFixed(2), dots: matchStats.player.dotBalls }
    : { name: 'Bot AI', wickets: matchStats.bot.wickets, economy: (matchStats.bot.runsConceded / Math.max(1, matchStats.bot.ballsBowled / 6)).toFixed(2), dots: matchStats.bot.dotBalls };

  const mostSixes = playerSixes >= botSixes ? { name: playerName, count: playerSixes } : { name: 'Bot AI', count: botSixes };
  const mostFours = playerFours >= botFours ? { name: playerName, count: playerFours } : { name: 'Bot AI', count: botFours };

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
              { id: 'manhattan', label: 'WORM CHART (CUMULATIVE)' },
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

        {/* Worm Chart (Cumulative Runs) */}
        {activeChart === 'manhattan' && (
          <div className="mt-4 mb-2">
            <div className="flex items-center justify-center space-x-6 mb-4 font-mono text-[10px] font-bold uppercase">
              {innings1Side && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }} />
                  <span className="text-slate-300">INN 1: {label1}</span>
                </div>
              )}
              {innings2Side && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color2 }} />
                  <span className="text-slate-300">INN 2: {label2}</span>
                </div>
              )}
            </div>

            <div className="relative w-full h-48 sm:h-64 bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full p-4 overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#ffffff20" strokeWidth="2" strokeDasharray="10,10" />
                <line x1="0" y1={svgHeight} x2={svgWidth} y2={svgHeight} stroke="#ffffff40" strokeWidth="2" />
                
                {/* Worm 1 */}
                {worm1.length > 1 && (
                  <polyline
                    points={worm1Points}
                    fill="none"
                    stroke={color1}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                  />
                )}
                {/* Worm 2 */}
                {worm2.length > 1 && (
                  <polyline
                    points={worm2Points}
                    fill="none"
                    stroke={color2}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                  />
                )}
              </svg>
            </div>
            
            <div className="flex justify-between px-2 mt-2 font-mono text-[10px] text-slate-400 font-bold uppercase">
              <span>OVER 0</span>
              <span>OVER {maxOversBoth}</span>
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
