import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import NumberPad from '../../components/NumberPad';
import { useMultiplayer } from '../../context/MultiplayerContext';

const AUTO_ASSIGN_DELAY_MS = 4500;

function MPMatchToss() {
  const { state, dispatch } = useMultiplayer();
  const {
    phase,
    captains,
    matchTossAssignment,
    matchTossMoves,
    matchTossWinner,
    players,
    currentPlayerId,
    hostId,
  } = state;

  const capA = players[captains.teamA];
  const capB = players[captains.teamB];
  const myRole =
    currentPlayerId === captains.teamA
      ? 'captainA'
      : currentPlayerId === captains.teamB
        ? 'captainB'
        : null;
  const isHost = currentPlayerId === hostId;

  const myAssignedSide =
    matchTossAssignment.odd === currentPlayerId
      ? 'odd'
      : matchTossAssignment.even === currentPlayerId
        ? 'even'
        : null;
  const assignmentComplete = Boolean(matchTossAssignment.odd && matchTossAssignment.even);
  const hasPartialAssignment =
    phase === 'MP_MATCH_TOSS' &&
    !assignmentComplete &&
    Boolean(matchTossAssignment.odd || matchTossAssignment.even);
  const myMoveLocked = myRole ? matchTossMoves[myRole] != null : true;
  const showNumberPad = phase === 'MP_MATCH_TOSS' && myRole !== null && assignmentComplete;
  const winningCaptainId = matchTossWinner ? captains[matchTossWinner] : null;
  const canChooseInnings = currentPlayerId === winningCaptainId;

  useEffect(() => {
    if (!isHost || !hasPartialAssignment) return undefined;

    const timer = window.setTimeout(() => {
      dispatch({ type: 'MP_AUTO_ASSIGN_MATCH_TOSS_SIDE' });
    }, AUTO_ASSIGN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [dispatch, hasPartialAssignment, isHost]);

  const tossResult = useMemo(() => {
    if (matchTossMoves.captainA == null || matchTossMoves.captainB == null) return null;
    const sum = matchTossMoves.captainA + matchTossMoves.captainB;
    return { sum, isOdd: sum % 2 !== 0 };
  }, [matchTossMoves]);

  const oddCaptain = players[matchTossAssignment.odd];
  const evenCaptain = players[matchTossAssignment.even];

  const handleClaimSide = (side) => {
    if (!myRole || myAssignedSide) return;
    dispatch({ type: 'MP_CLAIM_MATCH_TOSS_SIDE', payload: { side } });
  };

  const handlePick = (num) => {
    /* v8 ignore next */
    if (!myRole || matchTossMoves[myRole] != null || !assignmentComplete) return;
    dispatch({ type: 'MP_SUBMIT_MATCH_TOSS', payload: { who: myRole, move: num } });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-arena-surface px-4 pb-6 pt-6 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h2 className="esports-headline text-4xl tracking-[0.15em] text-white sm:text-5xl">
            Match Toss
          </h2>
          <p className="mt-2 font-display text-xs uppercase tracking-broadcast text-arena-on-surface-faint">
            Toss winner chooses whether to bat or bowl first
          </p>
        </div>

        <div className="arena-panel rounded-xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-center">
              <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                Odd
              </p>
              <p className="mt-1 font-display text-lg font-bold text-arena-primary">
                {oddCaptain?.name ?? 'Unclaimed'}
              </p>
            </div>
            <div className="rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-center">
              <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                Even
              </p>
              <p className="mt-1 font-display text-lg font-bold text-blue-400">
                {evenCaptain?.name ?? 'Unclaimed'}
              </p>
            </div>
          </div>

          {phase === 'MP_MATCH_TOSS' && myRole !== null && !myAssignedSide && (
            <div className="mt-5">
              <p className="text-center font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                Claim Odd or Even
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClaimSide('odd')}
                  disabled={Boolean(matchTossAssignment.odd)}
                  className={`rounded-lg border px-4 py-3 font-display text-sm font-bold uppercase tracking-broadcast transition ${
                    matchTossAssignment.odd
                      ? 'cursor-not-allowed border-arena-outline-variant/20 bg-arena-container text-arena-on-surface-faint opacity-40'
                      : 'border-arena-primary/30 bg-arena-primary/15 text-arena-primary hover:bg-arena-primary/20'
                  }`}
                >
                  Odd
                </button>
                <button
                  onClick={() => handleClaimSide('even')}
                  disabled={Boolean(matchTossAssignment.even)}
                  className={`rounded-lg border px-4 py-3 font-display text-sm font-bold uppercase tracking-broadcast transition ${
                    /* v8 ignore next */
                    matchTossAssignment.even
                      ? 'cursor-not-allowed border-arena-outline-variant/20 bg-arena-container text-arena-on-surface-faint opacity-40'
                      : 'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  Even
                </button>
              </div>
            </div>
          /* v8 ignore start */
          )}

          {phase === 'MP_MATCH_TOSS' && myRole !== null && myAssignedSide && !assignmentComplete && (
            <div className="mt-5 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-4 text-center text-sm text-arena-on-surface-faint">
              You claimed <span className="font-bold uppercase text-white">{myAssignedSide}</span>.
              Waiting for the other captain to confirm the remaining side...
            </div>
          )}

          {showNumberPad && (
            <div className="mt-5">
              <p className="text-center font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                {myMoveLocked
                  ? 'You locked in your toss number. Waiting for opponent...'
                  : /* v8 ignore next */
                    `${myAssignedSide === 'odd' ? 'Odd' : 'Even'} captain: pick your toss number (1-6)`}
              </p>
              <NumberPad
                options={[1, 2, 3, 4, 5, 6]}
                onSelect={handlePick}
                disabled={myMoveLocked}
                className="mt-4"
                buttonClassName="py-5 text-2xl"
              />
            </div>
          )}

          {phase === 'MP_MATCH_TOSS' && myRole === null && (
            <div className="mt-5 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-4 text-center text-sm text-arena-on-surface-faint">
              Captains are claiming sides and getting ready for the toss...
            </div>
          )}
        </div>
        /* v8 ignore stop */

        {phase === 'MP_MATCH_TOSS_RESULT' && tossResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="arena-panel mt-5 rounded-xl p-5"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="rounded-lg bg-arena-container-highest px-5 py-4">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    {capA?.name}
                  </p>
                  <div className="mt-1 font-display text-3xl font-bold text-arena-primary">
                    {matchTossMoves.captainA}
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-arena-on-surface-faint">+</span>
                <div className="rounded-lg bg-arena-container-highest px-5 py-4">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    {capB?.name}
                  </p>
                  <div className="mt-1 font-display text-3xl font-bold text-blue-400">
                    {matchTossMoves.captainB}
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-arena-on-surface-faint">=</span>
                <div className="rounded-lg border border-arena-outline-variant/30 bg-arena-container px-5 py-4">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    Total
                  </p>
                  <div className="esports-headline mt-1 text-2xl tracking-esports text-white">
                    {tossResult.sum} ({tossResult.isOdd ? 'Odd' : 'Even'})
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mt-5 rounded-lg px-5 py-3 ${
                  matchTossWinner === 'teamA'
                    ? 'border border-arena-primary/30 bg-arena-primary/15'
                    : 'border border-blue-500/30 bg-blue-500/15'
                }`}
              >
                <h3 className="esports-headline text-lg tracking-esports text-white">
                  {matchTossWinner === 'teamA' ? capA?.name : capB?.name} wins the toss
                </h3>
              </motion.div>

              {canChooseInnings ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => dispatch({ type: 'MP_CHOOSE_BAT_BOWL', payload: { choice: 'bat' } })}
                    className="tactile-btn rounded-lg px-4 py-3 text-sm"
                  >
                    <Zap size={14} className="mr-1 inline" />
                    Bat First
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'MP_CHOOSE_BAT_BOWL', payload: { choice: 'bowl' } })}
                    className="tactile-btn-secondary rounded-lg px-4 py-3 text-sm"
                  >
                    Bowl First
                  </button>
                </div>
              ) : (
                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
                  Waiting for match toss winner to choose...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default MPMatchToss;
