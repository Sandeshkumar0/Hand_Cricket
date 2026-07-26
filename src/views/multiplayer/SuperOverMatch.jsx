import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { CricketBallIcon, CricketBatIcon } from '../../components/CricketIcons';
import NumberPad from '../../components/NumberPad';
import { useMultiplayer, SUPER_OVER_BALLS } from '../../context/MultiplayerContext';

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const MOVE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

function SuperOverMatch() {
  const { state, dispatch } = useMultiplayer();
  const { phase, superOver, players, currentPlayerId, hostId, seriesWinner } = state;
  const {
    innings,
    battingTeam,
    activeBatterId,
    activeBowlerId,
    score,
    wickets,
    ballsBowled,
    lockedMoves,
    ballLog,
    target,
  } = superOver;

  const batter = players[activeBatterId];
  const bowler = players[activeBowlerId];
  const showOut =
    phase === 'MP_RESOLVE_SO' &&
    lockedMoves.batterMove != null &&
    lockedMoves.batterMove === lockedMoves.bowlerMove;

  const amIBatter = currentPlayerId === batter?.id;
  const amIBowler = currentPlayerId === bowler?.id;
  const isHost = currentPlayerId === hostId;

  // Bot auto-play
  useEffect(() => {
    if (phase !== 'MP_SUPER_OVER' || !isHost) return;

    if (batter?.isBot && lockedMoves.batterMove == null) {
      const t = setTimeout(() => {
        dispatch({ type: 'MP_SUBMIT_SO_MOVE', payload: { role: 'batter', move: Math.floor(Math.random() * 7) } });
      }, 600 + Math.random() * 500);
      return () => clearTimeout(t);
    }

    if (bowler?.isBot && lockedMoves.bowlerMove == null) {
      const t = setTimeout(() => {
        dispatch({ type: 'MP_SUBMIT_SO_MOVE', payload: { role: 'bowler', move: Math.floor(Math.random() * 7) } });
      }, 600 + Math.random() * 500);
      return () => clearTimeout(t);
    }
  }, [phase, batter, bowler, lockedMoves, dispatch, isHost]);

  // Resolution processing
  useEffect(() => {
    if (phase !== 'MP_RESOLVE_SO') return;
    const delay = showOut ? 1800 : 500;
    const t = setTimeout(() => {
      dispatch({ type: 'MP_PROCESS_SO_RESOLUTION' });
    }, delay);
    return () => clearTimeout(t);
  }, [phase, dispatch, showOut]);

  const handleBatterMove = (v) => {
    if (lockedMoves.batterMove != null || !amIBatter) return;
    dispatch({ type: 'MP_SUBMIT_SO_MOVE', payload: { role: 'batter', move: v } });
  };

  const handleBowlerMove = (v) => {
    if (lockedMoves.bowlerMove != null || !amIBowler) return;
    dispatch({ type: 'MP_SUBMIT_SO_MOVE', payload: { role: 'bowler', move: v } });
  };

  const battingLabel = battingTeam === 'teamA' ? 'Team A' : 'Team B';
  const battingScore = score[battingTeam];
  const battingWickets = wickets[battingTeam];

  /* ─── SUPER OVER RESULT ─── */
  if (phase === 'MP_SUPER_OVER_RESULT') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-arena-surface px-4 py-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_55%)]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
          <div className="super-over-banner px-6 py-3 mb-4 inline-block">
            <h2 className="esports-headline text-3xl tracking-[0.15em] neon-text-super">
              Super Over Complete
            </h2>
          </div>

          <div className="arena-panel rounded-xl p-6">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-primary">Team A</p>
                <p className="mt-2 font-display text-4xl font-bold text-arena-primary">
                  {score.teamA}<span className="text-lg text-arena-secondary">/{wickets.teamA}</span>
                </p>
              </div>
              <span className="esports-headline text-2xl tracking-esports text-arena-on-surface-faint">VS</span>
              <div className="text-center">
                <p className="font-display text-[10px] uppercase tracking-broadcast text-blue-400">Team B</p>
                <p className="mt-2 font-display text-4xl font-bold text-blue-400">
                  {score.teamB}<span className="text-lg text-arena-secondary">/{wickets.teamB}</span>
                </p>
              </div>
            </div>
          </div>

          {isHost ? (
            <button
              onClick={() => dispatch({ type: 'MP_FINISH_SUPER_OVER' })}
              className="tactile-btn-amber mt-6 rounded-lg px-8 py-4 text-base"
            >
              <Zap size={18} className="mr-2 inline" />
              {seriesWinner ? 'View Series Result' : 'Next Match'}
            </button>
          ) : (
            <div className="mt-6 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
              Waiting for host to continue the series...
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── SUPER OVER MATCH ─── */
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-arena-surface">
      {/* OUT Overlay */}
      <AnimatePresence>
        {showOut && phase === 'MP_RESOLVE_SO' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-arena-void/90 backdrop-blur-xl"
          >
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-center">
              <h2 className="esports-headline text-[5rem] leading-none tracking-esports neon-text-out">OUT!</h2>
              {isHost ? (
                <button onClick={() => dispatch({ type: 'MP_PROCESS_SO_RESOLUTION' })} className="tactile-btn mt-4 rounded-lg px-6 py-3 text-sm">Continue</button>
              ) : (
                <div className="mt-4 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
                  Waiting for host to resolve the wicket...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="border-b border-arena-outline-variant/15 bg-arena-container-low px-4 pb-3 pt-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="super-over-banner px-3 py-1">
                <span className="esports-headline text-xs tracking-esports text-amber-400">Super Over</span>
              </div>
              <span className="font-display text-xs text-arena-on-surface-faint">
                Innings {innings} · {formatOvers(ballsBowled)} / {formatOvers(SUPER_OVER_BALLS)}
              </span>
            </div>
            <p className="mt-1 font-display text-sm font-bold text-white">
              {battingLabel} Batting
            </p>
          </div>
          {target && (
            <span className="stat-chip text-amber-400">Target: {target}</span>
          )}
        </div>
      </div>

      {/* Score & Clash */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3 sm:px-5">
          {/* Score */}
          <div className="arena-panel rounded-xl p-4">
            <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">{battingLabel} Score</p>
            <div className="mt-1 flex items-end gap-1">
              <span className="font-display text-5xl font-bold leading-none text-amber-400">{battingScore}</span>
              <span className="pb-1 font-display text-xl font-bold text-arena-secondary">/{battingWickets}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <span className="stat-chip inline-flex items-center gap-2 text-arena-on-surface-dim">
                <CricketBatIcon className="h-4 w-4" />
                {batter?.name}
              </span>
              <span className="stat-chip inline-flex items-center gap-2 text-arena-on-surface-dim">
                <CricketBallIcon className="h-4 w-4" />
                {bowler?.name}
              </span>
            </div>
          </div>

          {/* Clash Zone */}
          <div className="mt-3">
            {phase === 'MP_SUPER_OVER' && (
              <div className="clash-zone grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-4">
                <div className="text-center">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">{batter?.name}</p>
                  <div className={`mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-lg border-2 ${
                    /* v8 ignore next */
                    lockedMoves.batterMove !== null ? 'border-amber-400 bg-amber-500/10' : 'border-arena-outline-variant/30 bg-arena-container-highest'
                  }`}>
                    <span className="font-display text-3xl font-bold text-amber-400">{lockedMoves.batterMove !== null ? '✓' : '?'}</span>
                  </div>
                  {lockedMoves.batterMove !== null && (
                    <p className="mt-1 font-display text-[10px] uppercase tracking-broadcast text-amber-400">Locked</p>
                  )}
                </div>
                <span className="esports-headline text-lg tracking-esports text-arena-on-surface-faint">VS</span>
                <div className="text-center">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">{bowler?.name}</p>
                  <div className={`mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-lg border-2 ${
                    /* v8 ignore next */
                    lockedMoves.bowlerMove !== null ? 'border-blue-400 bg-blue-500/10' : 'border-arena-outline-variant/30 bg-arena-container-highest'
                  }`}>
                    <span className="font-display text-3xl font-bold text-blue-400">{lockedMoves.bowlerMove !== null ? '✓' : '?'}</span>
                  </div>
                  {lockedMoves.bowlerMove !== null && (
                    <p className="mt-1 font-display text-[10px] uppercase tracking-broadcast text-blue-400">Locked</p>
                  )}
                </div>
              </div>
            )}
            {phase === 'MP_RESOLVE_SO' && !showOut && (
              <div className="clash-zone grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-4">
                <div className="text-center">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">{batter?.name}</p>
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-amber-400 bg-amber-500/10">
                    <span className="font-display text-3xl font-bold text-amber-400">{lockedMoves.batterMove}</span>
                  </motion.div>
                </div>
                <span className="esports-headline text-lg tracking-esports text-arena-on-surface-faint">VS</span>
                <div className="text-center">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">{bowler?.name}</p>
                  <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-500/10">
                    <span className="font-display text-3xl font-bold text-blue-400">{lockedMoves.bowlerMove}</span>
                  </motion.div>
                </div>
              </div>
            )}

            {phase === 'MP_RESOLVE_SO' && !showOut && lockedMoves.batterMove !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex justify-center">
                {/* v8 ignore next 3 */}
                {lockedMoves.batterMove === lockedMoves.bowlerMove ? (
                  <div className="rounded-lg bg-arena-secondary/15 border border-arena-secondary/30 px-6 py-2 esports-headline text-lg tracking-esports text-arena-secondary">Wicket!</div>
                ) : lockedMoves.batterMove === 0 ? (
                  <div className="rounded-lg border border-arena-outline-variant/25 bg-arena-container px-6 py-2 esports-headline text-lg tracking-esports text-arena-on-surface-dim">Dot Ball</div>
                ) : (
                  <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-6 py-2 esports-headline text-lg tracking-esports text-amber-400">+{lockedMoves.batterMove} Runs</div>
                )}
              </motion.div>
            )}
          </div>

          {/* Ball log */}
          <div className="mt-3 flex flex-wrap gap-2">
            {ballLog.filter((b) => b.innings === innings).map((ball, i) => (
              <div key={i} className={`ball-chip ${ball.isOut ? 'ball-chip-wicket' : ball.runs === 0 ? 'ball-chip-dot' : 'ball-chip-runs'}`}>
                {ball.isOut ? 'W' : ball.runs}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {phase === 'MP_SUPER_OVER' && (
          <div className="border-t border-arena-outline-variant/15 bg-arena-container-low px-4 pb-4 pt-3 lg:w-[360px] lg:border-l lg:border-t-0">
            {amIBatter && (
              <div className="mb-4">
                <h3 className="esports-headline text-xs tracking-esports text-arena-on-surface-dim mb-2">
                  {batter?.name}: Strike
                </h3>
                <NumberPad
                  options={MOVE_OPTIONS}
                  onSelect={handleBatterMove}
                  disabled={lockedMoves.batterMove !== null}
                  buttonClassName="py-3 text-xl"
                />
              </div>
            )}
            {!amIBatter && !batter?.isBot && !amIBowler && (
               <div className="mb-4 flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                 {batter?.name} is batting...
               </div>
            )}
            {amIBowler && (
              <div>
                <h3 className="esports-headline text-xs tracking-esports text-arena-on-surface-dim mb-2">
                  {bowler?.name}: Bowl
                </h3>
                <NumberPad
                  options={MOVE_OPTIONS}
                  onSelect={handleBowlerMove}
                  disabled={lockedMoves.bowlerMove !== null}
                  buttonClassName="py-3 text-xl"
                />
              </div>
            )}
            {!amIBowler && !bowler?.isBot && !amIBatter && (
               <div className="flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                 {bowler?.name} is bowling...
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperOverMatch;
