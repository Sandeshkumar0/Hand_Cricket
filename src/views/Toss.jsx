import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, ShieldCheck } from 'lucide-react';
import NumberPad from '../components/NumberPad';
import MotorsportHUD from '../components/MotorsportHUD';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

const TOSS_NUMBERS = [0, 1, 2, 3, 4, 5, 6];

function TossSetup({ onDone }) {
  const [stage, setStage] = useState('flip');

  useEffect(() => {
    soundEngine.playCoinFlip();
    const revealTimer = window.setTimeout(() => setStage('ready'), 900);
    const doneTimer = window.setTimeout(() => onDone(), 1800);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="apple-glass-card w-full max-w-md rounded-2xl p-8 text-center border border-white/10">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 ${stage === 'flip' ? 'coin-orbit' : ''}`}>
          <Coins size={36} />
        </div>
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-blue-400">
          STADIUM COIN FLIP
        </p>

        <AnimatePresence mode="wait">
          {stage === 'flip' ? (
            <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="esports-headline mt-3 text-3xl font-extrabold text-white">
                FLIPPING THE COIN
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Initializing odd-even stadium sequence...
              </p>
            </motion.div>
          ) : (
            <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="esports-headline mt-3 text-3xl font-extrabold text-white">
                TOSS READY
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Claim Odd or Even, then lock in your toss digit.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TossReveal({ tossResult, tossMoves, playerSide, botSide, onChoose }) {
  const [revealCountdown, setRevealCountdown] = useState(3);

  useEffect(() => {
    if (revealCountdown === 0) return undefined;
    const timer = window.setTimeout(() => {
      soundEngine.playUiClick();
      setRevealCountdown((count) => Math.max(0, count - 1));
    }, 550);
    return () => window.clearTimeout(timer);
  }, [revealCountdown]);

  useEffect(() => {
    if (revealCountdown > 0 || tossResult.playerWon) return undefined;
    const timer = window.setTimeout(() => {
      const botChoice = Math.random() > 0.5 ? 'bat' : 'bowl';
      onChoose(botChoice === 'bat' ? 'bowl' : 'bat');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [revealCountdown, tossResult.playerWon, onChoose]);

  const showReveal = revealCountdown === 0;
  const sideText = tossResult.parity === 'even' ? 'EVEN' : 'ODD';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="apple-glass-card rounded-2xl p-6 border border-white/10">
      {!showReveal ? (
        <div className="py-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            COIN FLIP REVEAL
          </p>
          <div className="esports-headline mt-4 text-6xl font-black text-blue-400 animate-pulse">
            {revealCountdown}
          </div>
          <p className="mt-3 text-xs sm:text-sm text-slate-400">Calculating combined toss digits...</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-blue-400 font-bold">YOUR SIDE</p>
              <p className="mt-1 text-xl font-mono font-extrabold text-white uppercase">{playerSide}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">BOT SIDE</p>
              <p className="mt-1 text-xl font-mono font-extrabold text-slate-300 uppercase">{botSide}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">YOU</p>
              <div className="mt-1 text-3xl font-mono font-black text-blue-400">{tossMoves.player}</div>
            </div>
            <div className="font-mono text-xl font-extrabold text-slate-500">+</div>
            <div className="rounded-xl bg-slate-900/90 border border-white/10 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">BOT</p>
              <div className="mt-1 text-3xl font-mono font-black text-amber-400">{tossMoves.bot}</div>
            </div>
            <div className="font-mono text-xl font-extrabold text-slate-500">=</div>
            <div className="rounded-xl bg-blue-950/60 border border-blue-500/40 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-blue-400 font-bold">SUM</p>
              <div className="esports-headline mt-1 text-2xl font-black text-white">
                {tossResult.sum} ({sideText})
              </div>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mt-6 rounded-xl p-4 ${
              tossResult.playerWon
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}
          >
            <h3 className="esports-headline text-xl font-extrabold tracking-wide">
              {tossResult.playerWon ? '🏆 YOU WIN THE TOSS!' : '🤖 BOT WINS THE TOSS'}
            </h3>
          </motion.div>

          {tossResult.playerWon ? (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBatHit(4);
                  onChoose('bat');
                }}
                className="tactile-btn flex items-center justify-center space-x-2 py-4 text-sm font-bold"
              >
                <Zap size={18} />
                <span>ELECT TO BAT</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playWicketSound();
                  onChoose('bowl');
                }}
                className="tactile-btn-secondary flex items-center justify-center space-x-2 py-4 text-sm font-bold"
              >
                <ShieldCheck size={18} />
                <span>ELECT TO BOWL</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>BOT IS DECIDING DECISION...</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Toss() {
  const { state, dispatch } = useGame();
  const { toss_moves, currentPhase } = state;
  const [playerSide, setPlayerSide] = useState(null);
  const [botSide, setBotSide] = useState(null);

  useEffect(() => {
    if (currentPhase !== 'TOSS' || !playerSide || botSide) return undefined;
    const timer = window.setTimeout(() => {
      setBotSide(playerSide === 'odd' ? 'even' : 'odd');
    }, 450);
    return () => window.clearTimeout(timer);
  }, [botSide, currentPhase, playerSide]);

  useEffect(() => {
    if (
      currentPhase !== 'TOSS' ||
      !playerSide ||
      !botSide ||
      toss_moves.player === null ||
      toss_moves.bot !== null
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      dispatch({
        type: 'SUBMIT_TOSS_MOVE',
        payload: { who: 'bot', move: Math.floor(Math.random() * 7) },
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [botSide, currentPhase, dispatch, playerSide, toss_moves.bot, toss_moves.player]);

  const tossResult = useMemo(() => {
    if (toss_moves.player === null || toss_moves.bot === null || !playerSide) return null;
    const sum = toss_moves.player + toss_moves.bot;
    const parity = sum % 2 === 0 ? 'even' : 'odd';
    return { sum, parity, playerWon: parity === playerSide };
  }, [playerSide, toss_moves]);

  const assignmentComplete = Boolean(playerSide && botSide);
  const locked = toss_moves.player !== null;

  if (currentPhase === 'TOSS_SETUP') {
    return <TossSetup onDone={() => dispatch({ type: 'COMPLETE_TOSS_SETUP' })} />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
      <MotorsportHUD title="STADIUM TOSS ARENA" subTitle="ODD / EVEN COIN FLIP TELEMETRY" phaseName="PRE-MATCH" />

      <div className="w-full mt-4">
        {currentPhase === 'TOSS' && (
          <div className="apple-glass-card rounded-2xl p-6 border border-white/10">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">YOUR CLAIM</p>
                <p className="mt-1 text-lg font-mono font-bold text-blue-400">
                  {playerSide ? playerSide.toUpperCase() : 'UNCLAIMED'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">BOT CLAIM</p>
                <p className="mt-1 text-lg font-mono font-bold text-slate-400">
                  {botSide ? botSide.toUpperCase() : 'WAITING'}
                </p>
              </div>
            </div>

            {!playerSide && (
              <div className="mt-6">
                <p className="text-center font-mono text-xs font-bold uppercase tracking-widest text-slate-300">
                  CLAIM YOUR TOSS PARITY
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {['odd', 'even'].map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick();
                        setPlayerSide(side);
                      }}
                      className="tactile-btn py-4 text-base tracking-wider font-extrabold uppercase"
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {playerSide && !assignmentComplete && (
              <div className="mt-6 rounded-xl border border-white/10 bg-slate-950 p-4 text-center text-xs font-mono text-slate-400">
                You claimed <span className="font-bold text-blue-400 uppercase">{playerSide}</span>. BOT assignment in progress...
              </div>
            )}

            {assignmentComplete && (
              <div className="mt-6">
                <p className="text-center font-mono text-xs font-bold uppercase tracking-widest text-slate-300 mb-3">
                  {locked ? `LOCKED DIGIT: ${toss_moves.player}. WAITING FOR BOT...` : 'SELECT TOSS DIGIT (0 - 6)'}
                </p>
                <NumberPad
                  options={TOSS_NUMBERS}
                  disabled={locked}
                  onSelect={(number) => {
                    soundEngine.playUiClick();
                    dispatch({
                      type: 'SUBMIT_TOSS_MOVE',
                      payload: { who: 'player', move: number },
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {currentPhase === 'TOSS_RESULT' && tossResult && (
          <TossReveal
            key={`${toss_moves.player}-${toss_moves.bot}`}
            tossResult={tossResult}
            tossMoves={toss_moves}
            playerSide={playerSide}
            botSide={botSide}
            onChoose={(choice) =>
              dispatch({ type: 'CHOOSE_BAT_BOWL', payload: { choice } })
            }
          />
        )}
      </div>
    </div>
  );
}

export default Toss;
