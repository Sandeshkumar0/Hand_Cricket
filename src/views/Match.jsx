import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  RotateCcw,
  Zap,
  X,
  TrendingUp,
  Award,
  Radio,
  Flame,
  Volume2,
} from 'lucide-react';
import { BOT, buildContextKey, getBotDecision } from '../ai/botBrain';
import { PlayerMarker } from '../components/CricketIcons';
import MoveTimer from '../components/MoveTimer';
import NumberPad from '../components/NumberPad';
import Scorecard from '../components/Scorecard';
import MotorsportHUD from '../components/MotorsportHUD';
import CricketBackground from '../components/CricketBackground';
import MatchSummaryDashboard from '../components/MatchSummaryDashboard';
import ManOfTheMatchCard from '../components/ManOfTheMatchCard';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';
import { determineManOfTheMatch } from '../utils/pointsCalculator';
import { updateCareerAfterMatch } from '../utils/statsStorage';

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const MOVE_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

/* Live Broadcast Commentary Generator */
const getCommentaryText = (ball) => {
  if (!ball) return 'STADIUM READY FOR FIRST DELIVERY';
  if (ball.isOut) return '💥 BOWLED HIM! DISASTER ON THE PITCH! WICKET TAKEN!';
  switch (ball.runs) {
    case 6:
      return '🚀 MASSIVE SIX! CLEARED THE STADIUM FLOODLIGHTS!';
    case 4:
      return '⚡ POWERFUL STRIKE! RACING PAST COVER FOR FOUR!';
    case 0:
      return '🎯 PRECISION DOT BALL. STIFLING THE RUN FLOW.';
    default:
      return `🏏 SOLID PLACEMENT! TAKING ${ball.runs} RUN(S).`;
  }
};

/* ─── OUT Overlay ─── */
function OutOverlay({ onContinue, score, wickets, balls, botName }) {
  useEffect(() => {
    soundEngine.playWicketSound();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
        className="text-center px-4"
      >
        <div className="inline-block rounded-lg bg-red-500/20 border border-red-500/40 px-6 py-2 shadow-lg shadow-red-500/20">
          <span className="esports-headline text-base tracking-widest text-red-400">
            DISMISSAL CONFIRMED
          </span>
        </div>

        <h2 className="esports-headline mt-4 text-7xl sm:text-9xl font-black leading-none tracking-tight neon-text-out">
          OUT!
        </h2>

        <div className="mx-auto mt-6 w-64 apple-glass-card rounded-2xl p-6 text-center border border-white/10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30 text-4xl shadow-inner">
            🤖
          </div>
          <p className="mt-4 font-mono text-base font-extrabold uppercase tracking-wide text-white">
            {botName}
          </p>
          <p className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-red-400">
            WICKET STRIKE
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="rounded-xl bg-slate-900/90 border border-white/10 px-6 py-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">TOTAL SCORE</p>
            <p className="mt-1 font-mono text-2xl font-black text-white">
              {score}<span className="text-sm text-red-400">/{wickets}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-white/10 px-6 py-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">OVERS</p>
            <p className="mt-1 font-mono text-2xl font-black text-white">{formatOvers(balls)}</p>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onContinue();
            }}
            className="tactile-btn-danger rounded-xl px-10 py-4 text-base font-extrabold tracking-wider"
          >
            CONTINUE MATCH
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Innings Break ─── */
function InningsBreak({ score, wickets, oversDisplay, target, onAdvance, matchSettings }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center bg-[#040711] relative">
      <CricketBackground />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-blue-300 uppercase">INNINGS 1 CONCLUDED</span>
        </div>

        <h2 className="esports-headline text-5xl sm:text-6xl font-black text-white">
          INNINGS BREAK
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="apple-glass-card rounded-2xl p-6 text-left border border-white/10">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">1ST INNINGS TOTAL</h3>
            <p className="mt-3 font-mono text-5xl font-black text-white">
              {score}<span className="text-2xl text-red-400">/{wickets}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-slate-400">{oversDisplay} Overs Completed</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-6 text-center border border-blue-500/30 bg-blue-950/20">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-400">TARGET TO WIN</p>
            <p className="esports-headline mt-2 text-6xl font-black text-white">{target}</p>
            <p className="mt-2 font-mono text-xs text-slate-400">Required RR: {((target - 1) / (matchSettings.overs_per_innings || 20)).toFixed(2)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onAdvance();
          }}
          className="tactile-btn mx-auto mt-8 flex items-center space-x-3 px-10 py-4 text-base font-extrabold tracking-wider"
        >
          <span>START CHASE INNINGS</span>
          <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Victory Result ─── */
function VictoryResult({ resultMeta, matchStats, matchSettings, ballLog, oversDisplay, onAction, actionLabel }) {
  useEffect(() => {
    // Play distinctive MATCH VICTORY audio tune!
    soundEngine.playMatchVictorySound();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 text-center bg-[#040711] relative">
      <CricketBackground />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-3xl">
        <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold tracking-widest uppercase">
          🏆 MATCH VICTORY
        </span>
        <h2 className="esports-headline mt-3 text-6xl sm:text-7xl font-black text-white drop-shadow">
          VICTORY!
        </h2>
        <p className="mt-2 font-mono text-xs text-slate-300 uppercase tracking-widest">
          Match {matchSettings.current_match} of {matchSettings.series_length}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 text-left">
          <div className="apple-glass-card rounded-2xl p-6 border border-white/10">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">FINAL SCORE</p>
            <p className="mt-2 font-mono text-5xl font-black text-white">
              {matchStats.player.runs}
              <span className="text-xl text-slate-400">/{matchStats.player.dismissals}</span>
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">{oversDisplay} Overs</p>
          </div>

          <div className="apple-glass-card rounded-2xl p-6 border border-blue-500/30 bg-blue-950/30">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-400">MATCH MVP</p>
            <div className="mt-3 flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <PlayerMarker token="bat" className="h-8 w-8" />
              </div>
              <div>
                <p className="font-mono text-base font-extrabold text-white">CHAMPION PLAYER</p>
                <p className="text-xs font-mono text-blue-400">STADIUM RANK #1</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onAction();
            }}
            className="tactile-btn px-10 py-4 text-base font-extrabold tracking-wider"
          >
            {actionLabel || 'CONTINUE'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Defeat Result ─── */
function DefeatResult({ resultMeta, matchStats, onAction, actionLabel }) {
  useEffect(() => {
    // Play distinctive MATCH DEFEAT drop tune!
    soundEngine.playMatchDefeatSound();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 text-center bg-[#040711] relative">
      <CricketBackground />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-2xl">
        <h2 className="esports-headline text-6xl font-black text-red-500">DEFEAT</h2>
        <p className="mt-2 font-mono text-xs text-slate-300 uppercase tracking-widest">{resultMeta.summary}</p>

        <div className="mt-8 apple-glass-card rounded-2xl p-6 border border-red-500/30 bg-red-950/20">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="font-mono text-xs text-slate-400 uppercase">YOUR SCORE</p>
              <p className="mt-2 font-mono text-5xl font-black text-white">{resultMeta.playerScore}</p>
            </div>
            <span className="font-mono text-xl font-bold text-slate-500">VS</span>
            <div className="text-center">
              <p className="font-mono text-xs text-slate-400 uppercase">OPPONENT</p>
              <p className="mt-2 font-mono text-5xl font-black text-amber-400">{resultMeta.botScore}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onAction();
            }}
            className="tactile-btn-danger px-10 py-4 text-base font-extrabold tracking-wider"
          >
            <RotateCcw size={18} className="mr-2 inline" />
            {actionLabel || 'RETRY MATCH'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QuitConfirmModal({ onCancel, onConfirm }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="apple-glass-card w-full max-w-md rounded-2xl p-6 text-center border border-red-500/30">
        <h3 className="esports-headline text-3xl font-extrabold text-white">FORFEIT MATCH?</h3>
        <p className="mt-2 text-xs text-slate-400">Quitting early will award victory to your opponent.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onConfirm} className="tactile-btn-danger py-3 text-xs font-bold">
            CONFIRM QUIT
          </button>
          <button type="button" onClick={onCancel} className="tactile-btn-secondary py-3 text-xs font-bold">
            RESUME PLAYING
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Match() {
  const { state, dispatch } = useGame();
  const {
    currentPhase,
    player_role,
    bowling_player,
    score,
    wickets,
    innings,
    target,
    balls_bowled,
    locked_moves,
    players,
    match_settings,
    match_stats,
    current_over_log,
    ball_log,
    result_meta,
    derivedStats,
    series_winner,
  } = state;

  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [quitPromptOpen, setQuitPromptOpen] = useState(false);
  const [matchEndStep, setMatchEndStep] = useState('summary'); // 'summary' | 'motm' | 'result'
  const [motmDetails, setMotmDetails] = useState(null);
  const bowler = players[bowling_player];
  const myMove = player_role === 'batter' ? locked_moves.batter_move : locked_moves.bowler_move;
  const oversLimit = match_settings.overs_per_innings;
  const oversDisplay = formatOvers(balls_bowled);
  const timerDuration = match_settings.timer_duration;
  const showOutOverlay = currentPhase === 'RESOLVE_MOVE' && locked_moves.batter_move === locked_moves.bowler_move;

  // Bot move AI decision
  useEffect(() => {
    if (currentPhase !== 'MATCH') return undefined;
    const botRole = player_role === 'batter' ? 'bowler' : 'batter';
    const botLocked = botRole === 'batter' ? locked_moves.batter_move : locked_moves.bowler_move;
    if (botLocked !== null) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const context = {
        innings,
        playerRole: player_role,
        score: score.batting,
        wickets: wickets.batting,
        ballsBowled: balls_bowled,
        oversLimit,
        target,
        botRole,
        previousPlayerMoves: ball_log.slice(-3).map((entry) => entry.playerMove),
      };
      context.key = buildContextKey(context);
      const move = await getBotDecision({ context, moveHistory: ball_log });
      if (!cancelled) {
        dispatch({ type: 'SUBMIT_MATCH_MOVE', payload: { role: botRole, move } });
      }
    }, 500 + Math.random() * 550);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentPhase, player_role, locked_moves, innings, score.batting, wickets.batting, balls_bowled, oversLimit, target, ball_log, dispatch]);

  // Resolution advancement
  useEffect(() => {
    if (currentPhase !== 'RESOLVE_MOVE') return undefined;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'PROCESS_RESOLUTION' });
    }, showOutOverlay ? 2500 : 600);
    return () => window.clearTimeout(timer);
  }, [currentPhase, dispatch, showOutOverlay]);

  const handleMove = (value) => {
    if (myMove !== null) return;
    dispatch({ type: 'SUBMIT_MATCH_MOVE', payload: { role: player_role, move: value } });
  };

  const summary = useMemo(() => {
    const overRuns = [];
    ball_log.forEach((ball, index) => {
      const overIndex = Math.floor(index / 6);
      overRuns[overIndex] = overRuns[overIndex] ?? { label: `${overIndex + 1}`, runs: 0 };
      overRuns[overIndex].runs += ball.runs ?? 0;
    });
    return {
      overRuns,
      playerRuns: match_stats.player.runs,
      botRuns: match_stats.bot.runs,
      playerWickets: match_stats.player.wickets,
      oversDisplay,
    };
  }, [ball_log, match_stats, oversDisplay]);

  const lastBall = ball_log[ball_log.length - 1];
  const commentaryText = useMemo(() => getCommentaryText(lastBall), [lastBall]);
  const lightbarState = showOutOverlay ? 'red' : lastBall?.runs >= 4 ? 'gold' : 'blue';

  if (currentPhase === 'INNINGS_BREAK') {
    return (
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <InningsBreak
          score={score.batting}
          wickets={wickets.batting}
          oversDisplay={oversDisplay}
          target={target}
          onAdvance={() => dispatch({ type: 'ADVANCE_INNINGS' })}
          matchSettings={match_settings}
        />
      </div>
    );
  }

  if (currentPhase === 'MATCH_RESULT') {
    if (matchEndStep === 'summary') {
      return (
        <MatchSummaryDashboard
          matchStats={match_stats}
          ballLog={ball_log}
          matchSettings={match_settings}
          onProceedToMotm={() => {
            const motm = determineManOfTheMatch({
              playerStats: match_stats.player,
              botStats: match_stats.bot,
              playerWon: result_meta?.playerWon,
            });
            setMotmDetails(motm);
            // Automatically update and persist career stats to localStorage!
            updateCareerAfterMatch({
              playerMatchStats: match_stats.player,
              botMatchStats: match_stats.bot,
              motmWinner: motm.motmWinner,
              playerWon: result_meta?.playerWon,
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
          playerStats={match_stats.player}
          botStats={match_stats.bot}
          playerName="CHAMPION PLAYER"
          botName={players[BOT?.id]?.name || 'BOT'}
          onContinueToResult={() => setMatchEndStep('result')}
        />
      );
    }

    return result_meta?.playerWon ? (
      <VictoryResult
        resultMeta={result_meta}
        matchStats={match_stats}
        matchSettings={match_settings}
        ballLog={ball_log}
        oversDisplay={oversDisplay}
        onAction={() => dispatch({ type: 'NEXT_MATCH' })}
        actionLabel={series_winner ? 'View Series Result' : 'Next Match'}
      />
    ) : (
      <DefeatResult
        resultMeta={result_meta}
        matchStats={match_stats}
        onAction={() => dispatch({ type: 'NEXT_MATCH' })}
        actionLabel={series_winner ? 'View Series Result' : 'Next Match'}
      />
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#040711]">
      <CricketBackground />

      <Scorecard
        open={scorecardOpen}
        onClose={() => setScorecardOpen(false)}
        inningsLog={ball_log}
        currentOver={current_over_log}
        stats={derivedStats}
        summary={summary}
      />

      {/* OUT Overlay */}
      <AnimatePresence>
        {showOutOverlay && currentPhase === 'RESOLVE_MOVE' && (
          <OutOverlay
            onContinue={() => dispatch({ type: 'PROCESS_RESOLUTION' })}
            score={score.batting}
            wickets={wickets.batting + 1}
            balls={balls_bowled}
            botName={bowler?.name ?? 'BOT'}
          />
        )}
      </AnimatePresence>

      {/* Top Telemetry Header */}
      <MotorsportHUD
        title="LIVE STADIUM MATCH"
        subTitle={`SESSION ${innings} • OVERS ${oversDisplay}/${oversLimit || '∞'}`}
        lightbarState={lightbarState}
        currentRunRate={derivedStats.currentRunRate}
        requiredRunRate={innings === 2 ? derivedStats.requiredRunRate : null}
        wicketsRemaining={10 - wickets.batting}
        phaseName={player_role === 'batter' ? 'BATTING' : 'BOWLING'}
      />

      {/* Action Controls Top Row */}
      <div className="px-4 flex items-center justify-between z-20 mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${player_role === 'batter' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            ROLE: {player_role.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-slate-300 hidden sm:inline">
            MATCH {match_settings.current_match} / {match_settings.series_length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setScorecardOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono font-bold text-slate-200 hover:bg-slate-800 transition"
          >
            <BarChart3 size={14} className="text-blue-400" />
            <span>SCORECARD</span>
          </button>
          <button
            type="button"
            onClick={() => setQuitPromptOpen(true)}
            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
            title="Quit Match"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Pitch & Gameplay Area */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden px-4 pb-4 gap-4 z-10">
        {/* Left Pitch View & Clash Stage */}
        <div className="flex flex-1 flex-col overflow-y-auto space-y-4">
          {/* Main Score & Target HUD Card */}
          <div className="apple-glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">CURRENT BATTING SCORE</p>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="font-mono text-6xl sm:text-7xl font-black text-white drop-shadow">
                    {score.batting}
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-red-400">
                    /{wickets.batting}
                  </span>
                </div>
              </div>

              {/* Floating Boundary Run Badge */}
              <AnimatePresence>
                {lastBall && lastBall.runs > 0 && currentPhase !== 'MATCH_RESULT' && (
                  <motion.div
                    key={lastBall.ballId}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-2 rounded-xl font-mono font-black text-sm border shadow-lg ${lastBall.runs >= 4 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'}`}
                  >
                    +{lastBall.runs} RUNS
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Over Ball Chips */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400 mr-2">THIS OVER:</span>
              {current_over_log.map((ball) => (
                <div
                  key={ball.ballId}
                  className={`ball-chip ${ball.isOut ? 'ball-chip-wicket' : ball.runs === 0 ? 'ball-chip-dot' : 'ball-chip-runs'}`}
                >
                  {ball.isOut ? 'W' : ball.runs}
                </div>
              ))}
            </div>
          </div>

          {/* Move Timer if active */}
          {currentPhase === 'MATCH' && timerDuration > 0 && (
            <MoveTimer
              key={`${innings}-${balls_bowled}-${player_role}`}
              duration={timerDuration}
              isActive={currentPhase === 'MATCH' && myMove === null}
              onExpire={() => handleMove(Math.floor(Math.random() * 7))}
            />
          )}

          {/* Clash Stage (Player Hand vs CPU Hand) */}
          <div className="apple-glass-card flex-1 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-h-[220px]">
            <AnimatePresence mode="wait">
              {currentPhase === 'MATCH' && (
                <motion.div key="match-clash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full grid grid-cols-3 items-center text-center max-w-md">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">YOUR MOVE</p>
                    <div className="mt-2 mx-auto w-20 h-20 rounded-2xl bg-blue-950/80 border-2 border-blue-500/40 flex items-center justify-center font-mono text-4xl font-black text-blue-400 shadow-lg">
                      {myMove ?? '?'}
                    </div>
                  </div>

                  <div className="esports-headline text-2xl font-black text-slate-600">VS</div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">CPU MOVE</p>
                    <div className="mt-2 mx-auto w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-mono text-4xl font-black text-slate-500">
                      ?
                    </div>
                  </div>
                </motion.div>
              )}

              {currentPhase === 'RESOLVE_MOVE' && !showOutOverlay && (
                <motion.div key="resolve-clash" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full flex flex-col items-center">
                  <div className="w-full grid grid-cols-3 items-center text-center max-w-md mb-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">BATTER</p>
                      <div className="mt-2 mx-auto w-20 h-20 rounded-2xl bg-blue-500/20 border-2 border-blue-500/60 flex items-center justify-center font-mono text-4xl font-black text-white shadow-lg">
                        {locked_moves.batter_move}
                      </div>
                    </div>

                    <div className="esports-headline text-2xl font-black text-slate-500">VS</div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">BOWLER</p>
                      <div className="mt-2 mx-auto w-20 h-20 rounded-2xl bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center font-mono text-4xl font-black text-white shadow-lg">
                        {locked_moves.bowler_move}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono text-sm font-extrabold uppercase tracking-wide">
                    {locked_moves.batter_move === 0 ? 'DOT BALL' : `+${locked_moves.batter_move} RUNS SCORED`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Broadcast Commentary Ticker */}
          <div className="apple-glass-card px-4 py-3 rounded-xl border border-white/10 flex items-center space-x-3 text-xs font-mono">
            <Radio className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
            <span className="text-slate-200 truncate">{commentaryText}</span>
          </div>
        </div>

        {/* Right Action Console / NumberPad */}
        {currentPhase === 'MATCH' && (
          <div className="apple-glass-card lg:w-80 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
            <NumberPad
              options={MOVE_OPTIONS}
              onSelect={handleMove}
              disabled={myMove !== null}
            />

            {/* Live Feed History */}
            <div className="mt-4 pt-3 border-t border-white/5 hidden lg:block">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">LIVE FEED</span>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto text-[11px] font-mono">
                {ball_log.slice(-4).reverse().map((b) => (
                  <div key={b.ballId} className="flex items-center justify-between text-slate-300 py-0.5">
                    <span>OVER {b.over}</span>
                    <span className={b.isOut ? 'text-red-400 font-bold' : b.runs >= 4 ? 'text-amber-400 font-bold' : 'text-blue-400'}>
                      {b.isOut ? 'WICKET' : `+${b.runs} R`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {quitPromptOpen && (
          <QuitConfirmModal
            onCancel={() => setQuitPromptOpen(false)}
            onConfirm={() => {
              setQuitPromptOpen(false);
              dispatch({ type: 'FORFEIT_MATCH' });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Match;
