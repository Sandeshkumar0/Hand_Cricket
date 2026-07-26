import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy, LogOut } from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';

function MPSeriesResult() {
  const { state, dispatch, isHost } = useMultiplayer();
  const { series, settings } = state;

  const teamAWon = series?.winner === 'teamA';
  const teamBWon = series?.winner === 'teamB';
  const isDraw = !teamAWon && !teamBWon;

  const currentTeam = useMemo(() => {
    if (state.teams?.teamA?.roster?.includes(state.currentPlayerId)) return 'teamA';
    if (state.teams?.teamB?.roster?.includes(state.currentPlayerId)) return 'teamB';
    return null;
  }, [state.currentPlayerId, state.teams]);

  const playerWon = currentTeam === series?.winner;

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-arena-surface px-4 pb-8 pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.05),transparent_50%)]" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg mt-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/20 mb-4">
            <Trophy size={40} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-arena-container-highest border border-white/10 text-xs font-mono font-bold text-arena-on-surface-dim uppercase">
            SERIES RESULT: {series?.scores?.teamA || 0} - {series?.scores?.teamB || 0}
          </span>
          <h2 className="esports-headline mt-3 text-4xl sm:text-5xl font-black text-white">
            {isDraw ? 'SERIES DRAW' : playerWon ? '🏆 SERIES VICTORY!' : '💔 SERIES DEFEAT'}
          </h2>
        </div>

        <div className="mt-8 arena-panel rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6 text-center">
            <div>
              <p className="font-mono text-xs font-bold text-blue-400 uppercase">TEAM A</p>
              <p className="mt-2 font-mono text-5xl font-black text-white">{series?.scores?.teamA || 0}</p>
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-red-400 uppercase">TEAM B</p>
              <p className="mt-2 font-mono text-5xl font-black text-slate-300">{series?.scores?.teamB || 0}</p>
            </div>
          </div>

          <div className="pt-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-arena-on-surface-faint mb-3">MATCH BREAKDOWN</h4>
            <div className="space-y-2.5">
              {(series?.results || []).map((match) => (
                <div key={match.matchNumber} className="flex items-center justify-between p-3.5 rounded-xl bg-arena-container-high border border-white/5">
                  <div>
                    <span className="font-mono text-[10px] text-arena-on-surface-faint">MATCH {match.matchNumber}</span>
                    <p className={`font-mono text-xs font-bold ${match.winner === 'teamA' ? 'text-blue-400' : match.winner === 'teamB' ? 'text-red-400' : 'text-slate-400'}`}>
                      {match.winner === 'teamA' ? 'TEAM A WON' : match.winner === 'teamB' ? 'TEAM B WON' : 'DRAW'}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <div>{match.teamAScore}</div>
                    <div className="text-slate-500">{match.teamBScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {isHost && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'MP_REMATCH' })}
              className="tactile-btn w-full py-4 text-base flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              <span>NEW SERIES</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch({ type: 'MP_LEAVE_ROOM' })}
            className="tactile-btn-secondary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            <span>LEAVE ROOM</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default MPSeriesResult;
