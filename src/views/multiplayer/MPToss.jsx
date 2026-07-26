import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import NumberPad from '../../components/NumberPad';
import { useMultiplayer } from '../../context/MultiplayerContext';

const AUTO_ASSIGN_DELAY_MS = 4500;

function MPToss() {
  const { state, dispatch } = useMultiplayer();
  const {
    phase,
    captains,
    tossAssignment,
    tossMoves,
    tossWinner,
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
    tossAssignment.odd === currentPlayerId
      ? 'odd'
      : tossAssignment.even === currentPlayerId
        ? 'even'
        : null;
  /* v8 ignore next */
  const assignmentComplete = Boolean(tossAssignment.odd && tossAssignment.even);
  const hasPartialAssignment =
    phase === 'MP_TOSS' &&
    !assignmentComplete &&
    Boolean(tossAssignment.odd || tossAssignment.even);
  const myMoveLocked = myRole ? tossMoves[myRole] != null : true;
  const showNumberPad = phase === 'MP_TOSS' && myRole !== null && assignmentComplete;

  useEffect(() => {
    if (!isHost || !hasPartialAssignment) return undefined;

    const timer = window.setTimeout(() => {
      dispatch({ type: 'MP_AUTO_ASSIGN_TOSS_SIDE' });
    }, AUTO_ASSIGN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [dispatch, hasPartialAssignment, isHost]);

  useEffect(() => {
    if (phase !== 'MP_TOSS_RESULT' || !isHost) return undefined;

    const timer = window.setTimeout(() => {
      dispatch({ type: 'MP_ADVANCE_AFTER_TOSS' });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [dispatch, isHost, phase]);

  const tossResult = useMemo(() => {
    if (tossMoves.captainA == null || tossMoves.captainB == null) return null;
    const sum = tossMoves.captainA + tossMoves.captainB;
    return { sum, isOdd: sum % 2 !== 0 };
  }, [tossMoves]);

  const oddCaptain = players[tossAssignment.odd];
  const evenCaptain = players[tossAssignment.even];

  const handleClaimSide = (side) => {
    if (!myRole || myAssignedSide) return;
    dispatch({ type: 'MP_CLAIM_TOSS_SIDE', payload: { side } });
  };

  const handleCaptainPick = (num) => {
    if (!myRole || tossMoves[myRole] != null || !assignmentComplete) return;
    dispatch({ type: 'MP_SUBMIT_TOSS_MOVE', payload: { who: myRole, move: num } });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-arena-surface px-4 pb-6 pt-6 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h2 className="esports-headline text-4xl tracking-[0.15em] text-white sm:text-5xl">
            The Toss
          </h2>
          <p className="mt-2 font-display text-xs uppercase tracking-broadcast text-arena-on-surface-faint">
            Winner gets first draft pick
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

          {phase === 'MP_TOSS' && myRole !== null && !myAssignedSide && (
            <div className="mt-5">
              <p className="text-center font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                Claim Odd or Even
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleClaimSide('odd')}
                  disabled={Boolean(tossAssignment.odd)}
                  className={`rounded-lg border px-4 py-3 font-display text-sm font-bold uppercase tracking-broadcast transition ${
                    tossAssignment.odd
                      ? 'cursor-not-allowed border-arena-outline-variant/20 bg-arena-container text-arena-on-surface-faint opacity-40'
                      : 'border-arena-primary/30 bg-arena-primary/15 text-arena-primary hover:bg-arena-primary/20'
                  }`}
                >
                  Odd
                </button>
                <button
                  onClick={() => handleClaimSide('even')}
                  disabled={Boolean(tossAssignment.even)}
                  className={`rounded-lg border px-4 py-3 font-display text-sm font-bold uppercase tracking-broadcast transition ${
                    tossAssignment.even
                      ? 'cursor-not-allowed border-arena-outline-variant/20 bg-arena-container text-arena-on-surface-faint opacity-40'
                      : 'border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  Even
                </button>
              </div>
            </div>
          )}

          {phase === 'MP_TOSS' && myRole !== null && myAssignedSide && !assignmentComplete && (
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
                  /* v8 ignore next */
                  : `${myAssignedSide === 'odd' ? 'Odd' : 'Even'} captain: pick your toss number (1-6)`}
              </p>
              <NumberPad
                options={[1, 2, 3, 4, 5, 6]}
                onSelect={handleCaptainPick}
                disabled={myMoveLocked}
                className="mt-4"
                buttonClassName="py-5 text-2xl"
              />
            </div>
          )}

          {phase === 'MP_TOSS' && myRole === null && (
            <div className="mt-5 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-4 text-center text-sm text-arena-on-surface-faint">
              Captains are claiming sides and getting ready for the toss...
            </div>
          )}
        </div>

        {phase === 'MP_TOSS_RESULT' && tossResult && (
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
                    {tossMoves.captainA}
                  </div>
                </div>
                <div className="font-display text-sm font-bold uppercase tracking-broadcast text-arena-on-surface-faint">
                  +
                </div>
                <div className="rounded-lg bg-arena-container-highest px-5 py-4">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    {capB?.name}
                  </p>
                  <div className="mt-1 font-display text-3xl font-bold text-blue-400">
                    {tossMoves.captainB}
                  </div>
                </div>
                <div className="font-display text-sm font-bold uppercase tracking-broadcast text-arena-on-surface-faint">
                  =
                </div>
                <div className="rounded-lg border border-arena-outline-variant/30 bg-arena-container px-5 py-4">
                  <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    Total
                  </p>
                  <div className="esports-headline mt-1 text-2xl tracking-esports text-white">
                    {/* v8 ignore next */}
                    {tossResult.sum} ({tossResult.isOdd ? 'Odd' : 'Even'})
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mt-5 rounded-lg px-5 py-3 ${
                  /* v8 ignore next 3 */
                  tossWinner === 'teamA'
                    ? 'border border-arena-primary/30 bg-arena-primary/15'
                    : 'border border-blue-500/30 bg-blue-500/15'
                }`}
              >
                <h3 className="esports-headline text-lg tracking-esports text-white">
                  {/* v8 ignore next */}
                  {tossWinner === 'teamA' ? capA?.name : capB?.name} wins the toss
                </h3>
                <p className="mt-2 font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                  Proceeding to the draft. Toss winner gets the first pick.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default MPToss;
