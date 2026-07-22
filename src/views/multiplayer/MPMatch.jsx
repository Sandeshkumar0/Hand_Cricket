import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { CricketBallIcon, CricketBatIcon } from '../../components/CricketIcons';
import NumberPad from '../../components/NumberPad';
import MatchSummaryDashboard from '../../components/MatchSummaryDashboard';
import ManOfTheMatchCard from '../../components/ManOfTheMatchCard';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { determineManOfTheMatch } from '../../utils/pointsCalculator';
import { updateCareerAfterMatch } from '../../utils/statsStorage';

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const MOVE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

/* ─── OUT Overlay ─── */
function MPOutOverlay({ onContinue, score, wickets, balls, canContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-arena-void/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
        className="text-center"
      >
        <div className="inline-block rounded-md bg-red-500/20 border border-red-500/40 px-5 py-1.5">
          <span className="esports-headline text-sm tracking-esports text-arena-secondary">
            Wicket!
          </span>
        </div>
        <h2 className="esports-headline mt-4 text-[5rem] leading-none tracking-esports neon-text-out sm:text-[7rem]">
          OUT!
        </h2>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="rounded-lg bg-arena-container px-5 py-3 text-center">
            <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">Score</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {score}<span className="text-sm text-arena-secondary">/{wickets}</span>
            </p>
          </div>
          <div className="rounded-lg bg-arena-container px-5 py-3 text-center">
            <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">Overs</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">{formatOvers(balls)}</p>
          </div>
        </div>
        {canContinue ? (
          <button onClick={onContinue} className="tactile-btn mt-6 rounded-lg px-8 py-3 text-sm">
            Continue
          </button>
        ) : (
          <div className="mt-6 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
            Waiting for host to resolve the wicket...
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Main MP Match ─── */
function MPMatch() {
  const { state, dispatch } = useMultiplayer();
  const {
    phase,
    battingTeam,
    activeBatterId,
    activeBowlerId,
    score,
    wickets,
    innings,
    target,
    ballsBowled,
    lockedMoves,
    players,
    settings,
    currentOverLog,
    ballLog,
    resultMeta,
    seriesScores,
    seriesWinner,
    currentPlayerId,
    hostId,
  } = state;

  const [matchEndStep, setMatchEndStep] = React.useState('summary'); // 'summary' | 'motm' | 'result'
  const [motmDetails, setMotmDetails] = React.useState(null);
  const batter = players[activeBatterId];
  const bowler = players[activeBowlerId];
  const oversLimit = settings.oversPerInnings;
  const oversDisplay = formatOvers(ballsBowled);
  const showOutOverlay =
    phase === 'MP_RESOLVE_MOVE' &&
    lockedMoves.batterMove != null &&
    lockedMoves.batterMove === lockedMoves.bowlerMove;
  
  const amIBatter = currentPlayerId === batter?.id;
  const amIBowler = currentPlayerId === bowler?.id;
  const isHost = currentPlayerId === hostId;

  // Bot move logic — auto-play for bot players
  useEffect(() => {
    if (phase !== 'MP_MATCH' || !isHost) return;

    // Auto-play batter if bot
    if (batter?.isBot && lockedMoves.batterMove == null) {
      const timer = setTimeout(() => {
        dispatch({
          type: 'MP_SUBMIT_MATCH_MOVE',
          payload: { role: 'batter', move: Math.floor(Math.random() * 7) },
        });
      }, 600 + Math.random() * 500);
      return () => clearTimeout(timer);
    }

    // Auto-play bowler if bot
    if (bowler?.isBot && lockedMoves.bowlerMove == null) {
      const timer = setTimeout(() => {
        dispatch({
          type: 'MP_SUBMIT_MATCH_MOVE',
          payload: { role: 'bowler', move: Math.floor(Math.random() * 7) },
        });
      }, 600 + Math.random() * 500);
      return () => clearTimeout(timer);
    }
  }, [phase, batter, bowler, lockedMoves, dispatch, isHost]);

  // Process resolution
  useEffect(() => {
    if (phase !== 'MP_RESOLVE_MOVE') return;
    const delay = showOutOverlay ? 2200 : 600;
    const timer = setTimeout(() => {
      dispatch({ type: 'MP_PROCESS_RESOLUTION' });
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, dispatch, showOutOverlay]);

  const handleBatterMove = (value) => {
    if (lockedMoves.batterMove != null || !amIBatter) return;
    dispatch({ type: 'MP_SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: value } });
  };

  const handleBowlerMove = (value) => {
    if (lockedMoves.bowlerMove != null || !amIBowler) return;
    dispatch({ type: 'MP_SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: value } });
  };

  const needText =
    innings === 2 && target
      ? `${Math.max(0, target - score.batting)} needed from ${
          oversLimit === null ? 'unlimited balls' : `${Math.max(0, oversLimit * 6 - ballsBowled)} balls`
        }`
      : null;

  const lastBall = ballLog[ballLog.length - 1];

  /* ─── INNINGS BREAK ─── */
  if (phase === 'MP_INNINGS_BREAK') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-arena-surface px-4 py-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.08),transparent_50%)]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
          <h2 className="esports-headline text-4xl tracking-[0.15em] neon-text-primary sm:text-5xl">Innings Over</h2>
          <p className="mt-3 font-display text-sm uppercase tracking-broadcast text-arena-on-surface-faint">First Half Concluded</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="accent-bar-left arena-panel rounded-xl p-5 text-left">
              <h3 className="esports-headline text-sm tracking-esports text-arena-on-surface-dim">1st Innings Recap</h3>
              <p className="mt-3 font-display text-5xl font-bold text-white">
                {score.batting}<span className="text-xl text-arena-secondary">/{wickets.batting}</span>
              </p>
              <p className="mt-2 font-display text-xs uppercase tracking-broadcast text-arena-on-surface-faint">
                {oversDisplay} Overs
              </p>
            </div>

            <div className="arena-panel-high rounded-xl p-5 text-center border border-arena-outline-variant/20">
              <p className="font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">Target to Win</p>
              <p className="esports-headline mt-3 text-6xl tracking-esports text-white">
                {target}<span className="esports-headline ml-2 text-xl text-arena-on-surface-faint">Runs</span>
              </p>
            </div>
          </div>

          {isHost ? (
            <button onClick={() => dispatch({ type: 'MP_ADVANCE_INNINGS' })} className="tactile-btn mx-auto mt-8 flex items-center gap-3 rounded-lg px-8 py-4 text-base">
              <ArrowRight size={20} />
              Start 2nd Innings
            </button>
          ) : (
            <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
              Waiting for host to start the 2nd innings...
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── MATCH RESULT ─── */
  if (phase === 'MP_MATCH_RESULT') {
    const actionLabel = seriesWinner ? 'View Series Result' : 'Next Match';

    // Format matchStats structure for components
    const myStats = state.playerStats?.[currentPlayerId] || { runs: 0, ballsFaced: 0, wickets: 0, dotBalls: 0, fours: 0, sixes: 0 };
    const opponentId = Object.keys(state.playerStats || {}).find(id => id !== currentPlayerId) || 'bot';
    const oppStats = state.playerStats?.[opponentId] || { runs: 0, ballsFaced: 0, wickets: 0, dotBalls: 0, fours: 0, sixes: 0 };

    const formattedMatchStats = {
      player: { ...myStats, dismissals: myStats.wickets || 0 },
      bot: { ...oppStats, dismissals: oppStats.wickets || 0 },
    };

    if (matchEndStep === 'summary') {
      return (
        <MatchSummaryDashboard
          matchStats={formattedMatchStats}
          ballLog={ballLog}
          matchSettings={{ current_match: settings.currentMatch, series_length: settings.seriesLength }}
          onProceedToMotm={() => {
            const motm = determineManOfTheMatch({
              playerStats: formattedMatchStats.player,
              botStats: formattedMatchStats.bot,
              playerWon: resultMeta?.winner === (state.teams?.teamA?.roster?.includes(currentPlayerId) ? 'teamA' : 'teamB'),
            });
            setMotmDetails(motm);
            // Save & accumulate career stats in localStorage for local user from Multiplayer match!
            updateCareerAfterMatch({
              playerMatchStats: formattedMatchStats.player,
              botMatchStats: formattedMatchStats.bot,
              motmWinner: motm.motmWinner,
              playerWon: resultMeta?.winner === (state.teams?.teamA?.roster?.includes(currentPlayerId) ? 'teamA' : 'teamB'),
            });
            setMatchEndStep('motm');
          }}
        />
      );
    }

    if (matchEndStep === 'motm') {
      return (
        <ManOfTheMatchCard
          motmInfo={motmDetails}
          playerStats={formattedMatchStats.player}
          botStats={formattedMatchStats.bot}
          playerName={state.players[currentPlayerId]?.name || 'Player'}
          botName={state.players[opponentId]?.name || 'Opponent'}
          onContinueToResult={() => setMatchEndStep('result')}
        />
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-arena-surface px-4 py-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.08),transparent_50%)]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
          <h2 className={`esports-headline text-5xl tracking-[0.15em] sm:text-6xl ${
            resultMeta?.winner === 'tied' ? 'neon-text-super' : 'neon-text-primary'
          }`}>
            {resultMeta?.winner === 'tied' ? 'Tied!' : 'Match Over'}
          </h2>
          <p className="mt-3 font-display text-sm uppercase tracking-broadcast text-arena-on-surface-faint">
            {resultMeta?.summary}
          </p>

          {/* Score Comparison */}
          <div className="mt-6 accent-bar-left arena-panel rounded-xl p-5 text-left">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-primary">Team A</p>
                <p className="mt-2 font-display text-4xl font-bold text-arena-primary">{resultMeta?.teamAScore}</p>
              </div>
              <span className="esports-headline text-2xl tracking-esports text-arena-on-surface-faint">VS</span>
              <div className="text-center">
                <p className="font-display text-[10px] uppercase tracking-broadcast text-blue-400">Team B</p>
                <p className="mt-2 font-display text-4xl font-bold text-blue-400">{resultMeta?.teamBScore}</p>
              </div>
            </div>
          </div>

          {/* Series Scoreline */}
          <div className="mt-4 flex justify-center">
            <span className="stat-chip text-arena-on-surface-dim">
              Series: {seriesScores.teamA} - {seriesScores.teamB}
            </span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            {isHost ? (
              resultMeta?.winner === 'tied' ? (
                <button
                  onClick={() => dispatch({ type: 'MP_START_SUPER_OVER' })}
                  className="tactile-btn-amber rounded-lg px-8 py-3 text-sm"
                >
                  <Zap size={16} className="mr-2 inline" />
                  Super Over!
                </button>
              ) : (
                <button
                  onClick={() => dispatch({ type: 'MP_NEXT_MATCH' })}
                  className="tactile-btn rounded-lg px-8 py-3 text-sm"
                >
                  {actionLabel}
                </button>
              )
            ) : (
              <div className="rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
                Waiting for host to continue the series...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── MAIN MATCH / RESOLVE ─── */
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-arena-surface">
      {/* OUT Overlay */}
      <AnimatePresence>
        {showOutOverlay && phase === 'MP_RESOLVE_MOVE' && (
          <MPOutOverlay
            onContinue={() => dispatch({ type: 'MP_PROCESS_RESOLUTION' })}
            score={score.batting}
            wickets={wickets.batting + 1}
            balls={ballsBowled}
            canContinue={isHost}
          />
        )}
      </AnimatePresence>

      {/* ─── Top Bar ─── */}
      <div className="border-b border-arena-outline-variant/15 bg-arena-container-low px-4 pb-3 pt-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="esports-headline text-xl tracking-esports text-white sm:text-2xl">
                {battingTeam === 'teamA' ? 'Team A' : 'Team B'} Batting
              </h2>
              <span className="font-display text-xs text-arena-on-surface-faint">
                {oversDisplay}{oversLimit ? ` / ${oversLimit}` : ''}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="rounded-sm px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-broadcast bg-arena-primary/15 text-arena-primary">
                Innings {innings}
              </span>
              <span className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                M{settings.currentMatch}/{settings.seriesLength}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="stat-chip text-arena-on-surface-dim text-[10px]">
              {seriesScores.teamA}-{seriesScores.teamB}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Score & Clash Zone */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3 sm:px-5">
          {/* Score Display */}
          <div className="arena-panel relative rounded-xl p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                  Current Score
                </p>
                <div className="mt-1 flex items-end gap-1">
                  <span className="font-display text-6xl font-bold leading-none text-arena-primary sm:text-7xl">
                    {score.batting}
                  </span>
                  <span className="pb-1 font-display text-2xl font-bold text-arena-secondary">
                    /{wickets.batting}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {lastBall && !lastBall.isOut && lastBall.runs > 0 && phase !== 'MP_MATCH_RESULT' && (
                  <motion.div
                    key={lastBall.ballId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-md bg-arena-primary px-3 py-1 font-display text-sm font-bold text-arena-surface"
                  >
                    +{lastBall.runs} RUNS
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {target && innings === 2 && (
                <span className="stat-chip text-arena-primary">Target: {target}</span>
              )}
              <span className="stat-chip inline-flex items-center gap-2 text-arena-on-surface-dim">
                <CricketBatIcon className="h-4 w-4" />
                {batter?.name || '...'}
              </span>
              <span className="stat-chip inline-flex items-center gap-2 text-arena-on-surface-dim">
                <CricketBallIcon className="h-4 w-4" />
                {bowler?.name || '...'}
              </span>
            </div>
          </div>

          {needText && (
            <div className="mt-3 rounded-lg border border-arena-secondary/20 bg-arena-secondary/10 px-3 py-2.5 text-sm text-arena-secondary">
              {needText}
            </div>
          )}

          {/* ─── Clash Zone ─── */}
          <div className="mt-3 flex-1">
            <AnimatePresence mode="wait">
              {phase === 'MP_MATCH' && (
                <motion.div
                  key="match-clash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="clash-zone grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-4 sm:p-5"
                >
                  {/* Batter Move — hidden until both lock in */}
                  <div className="text-center">
                    <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                      {batter?.name || 'Batter'}
                    </p>
                    <div className={`mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-lg border-2 ${
                      lockedMoves.batterMove !== null ? 'border-arena-primary bg-arena-primary/10' : 'border-arena-outline-variant/30 bg-arena-container-highest'
                    }`}>
                      <span className="font-display text-4xl font-bold text-arena-primary">
                        {lockedMoves.batterMove !== null ? '✓' : '?'}
                      </span>
                    </div>
                    {lockedMoves.batterMove !== null && (
                      <p className="mt-1.5 font-display text-[10px] uppercase tracking-broadcast text-arena-primary">Locked</p>
                    )}
                  </div>
                  <div className="esports-headline text-xl tracking-esports text-arena-on-surface-faint">VS</div>
                  {/* Bowler Move — hidden until both lock in */}
                  <div className="text-center">
                    <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                      {bowler?.name || 'Bowler'}
                    </p>
                    <div className={`mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-lg border-2 ${
                      lockedMoves.bowlerMove !== null ? 'border-blue-400 bg-blue-500/10' : 'border-arena-outline-variant/30 bg-arena-container-highest'
                    }`}>
                      <span className="font-display text-4xl font-bold text-blue-400">
                        {lockedMoves.bowlerMove !== null ? '✓' : '?'}
                      </span>
                    </div>
                    {lockedMoves.bowlerMove !== null && (
                      <p className="mt-1.5 font-display text-[10px] uppercase tracking-broadcast text-blue-400">Locked</p>
                    )}
                  </div>
                </motion.div>
              )}

              {phase === 'MP_RESOLVE_MOVE' && !showOutOverlay && (
                <motion.div
                  key="resolve-wrap"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div className="clash-zone grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl p-4 sm:p-5">
                    <div className="text-center">
                      <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">Batter</p>
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-lg border-2 border-arena-primary/40 bg-arena-primary/10">
                        <span className="font-display text-4xl font-bold text-arena-primary">{lockedMoves.batterMove}</span>
                      </motion.div>
                    </div>
                    <div className="esports-headline text-xl tracking-esports text-arena-on-surface-faint">VS</div>
                    <div className="text-center">
                      <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">Bowler</p>
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-lg border-2 border-blue-400/40 bg-blue-500/10">
                        <span className="font-display text-4xl font-bold text-blue-400">{lockedMoves.bowlerMove}</span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    {lockedMoves.batterMove === lockedMoves.bowlerMove ? (
                      <div className="rounded-lg bg-arena-secondary/15 border border-arena-secondary/30 px-6 py-2.5 esports-headline text-xl tracking-esports text-arena-secondary">
                        Wicket!
                      </div>
                    ) : lockedMoves.batterMove === 0 ? (
                      <div className="rounded-lg border border-arena-outline-variant/25 bg-arena-container px-6 py-2.5 esports-headline text-xl tracking-esports text-arena-on-surface-dim">
                        Dot Ball
                      </div>
                    ) : (
                      <div className="rounded-lg bg-arena-primary/15 border border-arena-primary/30 px-6 py-2.5 esports-headline text-xl tracking-esports text-arena-primary">
                        +{lockedMoves.batterMove} Runs
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* This Over Feed */}
          <div className="mt-3 flex flex-wrap gap-2">
            {currentOverLog.length === 0 && (
              <span className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                This over will appear here
              </span>
            )}
            {currentOverLog.map((ball) => (
              <div
                key={ball.ballId}
                className={`ball-chip ${
                  ball.isOut ? 'ball-chip-wicket' : ball.runs === 0 ? 'ball-chip-dot' : 'ball-chip-runs'
                }`}
              >
                {ball.isOut ? 'W' : ball.runs}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Action Consoles (side panel on desktop, bottom on mobile) ─── */}
        {phase === 'MP_MATCH' && (
          <div className="border-t border-arena-outline-variant/15 bg-arena-container-low px-4 pb-4 pt-3 lg:w-[380px] lg:border-l lg:border-t-0 lg:overflow-y-auto">
            {/* Batting Captain's Controls */}
            {amIBatter && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-arena-primary" />
                  <h3 className="esports-headline text-xs tracking-esports text-arena-on-surface-dim">
                    Batter: {batter?.name} — Select Strike
                  </h3>
                </div>
                <NumberPad
                  options={MOVE_OPTIONS}
                  onSelect={handleBatterMove}
                  disabled={lockedMoves.batterMove !== null}
                  className="mt-3"
                  buttonClassName="py-3 text-xl"
                />
              </div>
            )}
            {!amIBatter && !batter?.isBot && !amIBowler && (
               <div className="mb-4 flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                 {batter?.name} is batting...
               </div>
            )}
            {batter?.isBot && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                <div className="h-2 w-2 animate-pulse rounded-full bg-arena-primary" />
                {batter?.name} (Bot) is batting...
              </div>
            )}

            {/* Bowling Captain's Controls */}
            {amIBowler && (
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-blue-400" />
                  <h3 className="esports-headline text-xs tracking-esports text-arena-on-surface-dim">
                    Bowler: {bowler?.name} — Bowl Delivery
                  </h3>
                </div>
                <NumberPad
                  options={MOVE_OPTIONS}
                  onSelect={handleBowlerMove}
                  disabled={lockedMoves.bowlerMove !== null}
                  className="mt-3"
                  buttonClassName="py-3 text-xl"
                />
              </div>
            )}
            {!amIBowler && !bowler?.isBot && !amIBatter && (
               <div className="mt-4 flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                 {bowler?.name} is bowling...
               </div>
            )}
            {bowler?.isBot && (
              <div className="flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                {bowler?.name} (Bot) is bowling...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MPMatch;
