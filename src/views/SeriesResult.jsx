import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy, Sparkles } from 'lucide-react';
import MotorsportHUD from '../components/MotorsportHUD';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

function SeriesResult() {
  const { state, dispatch } = useGame();
  const { series_scores, match_results, series_winner, match_settings } = state;
  const playerWon = series_winner === 'player';

  useEffect(() => {
    if (playerWon) {
      soundEngine.playCrowdCheer(true);
    } else {
      soundEngine.playWicketSound();
    }
  }, [playerWon]);

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-[#040711] px-4 pb-8 pt-6">
      <div className="stadium-spotlight" />
      <MotorsportHUD title="SERIES CHAMPIONSHIP PODIUM" subTitle={`BEST OF ${match_settings.series_length} CIRCUIT COMPLETED`} phaseName="SERIES RESULT" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg mt-4">
        {/* Trophy / Winner Title */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/20 mb-4">
            <Trophy size={40} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-bold text-slate-300 uppercase">
            SERIES RESULT: {series_scores.player} - {series_scores.bot}
          </span>
          <h2 className="esports-headline mt-3 text-4xl sm:text-5xl font-black text-white">
            {playerWon ? '🏆 SERIES VICTORY!' : '🤖 BOT WINS SERIES'}
          </h2>
        </div>

        {/* Main Scores Card */}
        <div className="mt-8 apple-glass-card rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6 text-center">
            <div>
              <p className="font-mono text-xs font-bold text-blue-400 uppercase">YOU</p>
              <p className="mt-2 font-mono text-5xl font-black text-white">{series_scores.player}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">MATCHES WON</p>
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-red-400 uppercase">BOT</p>
              <p className="mt-2 font-mono text-5xl font-black text-slate-300">{series_scores.bot}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-400">MATCHES WON</p>
            </div>
          </div>

          {/* Match Breakdown */}
          <div className="pt-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">MATCH BREAKDOWN</h4>
            <div className="space-y-2.5">
              {match_results.map((match) => (
                <div key={match.matchNumber} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400">MATCH {match.matchNumber}</span>
                    <p className={`font-mono text-xs font-bold ${match.winner === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
                      {match.winner === 'player' ? 'YOU WON' : 'BOT WON'}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <div>{match.playerScore}</div>
                    <div className="text-slate-500">{match.botScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              dispatch({ type: 'RESET_GAME' });
            }}
            className="tactile-btn w-full py-4 text-base font-black tracking-wider flex items-center justify-center space-x-2"
          >
            <RotateCcw size={18} />
            <span>NEW CHAMPIONSHIP SERIES</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SeriesResult;
