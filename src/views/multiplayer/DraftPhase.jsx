import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMultiplayer, DRAFT_TIMER } from '../../context/MultiplayerContext';
import { PlayerMarker } from '../../components/CricketIcons';
import ShotClock from '../../components/ShotClock';

function DraftRosterColumn({ title, accentClass, borderClass, active, count, players, captainId }) {
  return (
    <div className={`flex flex-col rounded-xl border p-3 ${active ? borderClass : 'border-arena-outline-variant/15'}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`font-display text-xs font-bold uppercase tracking-broadcast ${accentClass}`}>
          {title}
        </span>
        <span className="ml-auto font-display text-[10px] text-arena-on-surface-faint">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {players.length === 0 && (
          <div className="rounded-lg bg-arena-container px-3 py-3 text-center text-xs text-arena-on-surface-faint">
            No picks yet
          </div>
        )}
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-arena-container-high p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-arena-container-highest text-sm">
              <PlayerMarker token={p.emoji} className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xs font-bold text-white">{p.name}</p>
              {p.id === captainId && (
                <span className="captain-badge text-[8px]">Captain</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraftPoolPanel({ poolPlayers, canPick, onPick, activeCaptain }) {
  return (
    <div className="flex flex-col rounded-xl border border-arena-outline-variant/15 p-3">
      <p className="mb-3 font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
        Available Players
      </p>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {poolPlayers.map((p) => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => canPick && onPick(p.id)}
              className="draft-card flex items-center gap-3 text-left"
              disabled={!canPick}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                p.isBot ? 'bg-blue-500/15' : 'bg-arena-container-highest'
              }`}>
                <PlayerMarker token={p.emoji} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-white">
                  {p.name}
                </p>
                <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                  {p.isBot ? 'Smart Bot' : 'Player'}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {poolPlayers.length === 0 && (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="font-display text-sm text-arena-on-surface-faint">
              Draft complete!
            </p>
          </div>
        )}
      </div>
      {!canPick && !activeCaptain?.isBot && poolPlayers.length > 0 && (
        <div className="mt-3 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
          Waiting for {activeCaptain?.name} to make the next draft pick...
        </div>
      )}
    </div>
  );
}

function DraftPhase() {
  const { state, dispatch } = useMultiplayer();
  const { teams, draftPool, draftTurn, players, captains, currentPlayerId } = state;

  const activeCaptainId = draftTurn === 'teamA' ? captains.teamA : captains.teamB;
  const activeCaptain = players[activeCaptainId];
  const canPick = currentPlayerId === activeCaptainId && !activeCaptain?.isBot;
  /* v8 ignore next 2 */
  const teamAPlayers = teams.teamA?.roster.map((id) => players[id]).filter(Boolean) || [];
  const teamBPlayers = teams.teamB?.roster.map((id) => players[id]).filter(Boolean) || [];
  const poolPlayers = draftPool.map((id) => players[id]).filter(Boolean);

  const handlePick = (playerId) => {
    dispatch({ type: 'MP_DRAFT_PICK', payload: { playerId } });
  };

  const handleAutoExpire = useCallback(() => {
    dispatch({ type: 'MP_DRAFT_AUTO_PICK' });
  }, [dispatch]);

  useEffect(() => {
    if (!activeCaptain?.isBot || draftPool.length === 0) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'MP_DRAFT_AUTO_PICK' });
    }, 1200 + Math.random() * 800);
    return () => clearTimeout(timer);
  }, [activeCaptain, draftPool.length, dispatch]);

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-arena-surface">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.05),transparent_50%)]" />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-5 sm:px-6">
        <div className="text-center">
          <h2 className="esports-headline text-3xl tracking-esports text-white sm:text-4xl">
            The Draft
          </h2>
          <p className="mt-2 font-display text-xs uppercase tracking-broadcast text-arena-on-surface-faint">
            {draftPool.length} players remaining
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div
            className={`w-full max-w-sm rounded-lg px-5 py-3 text-center ${
              draftTurn === 'teamA'
                ? 'border border-arena-primary/30 bg-arena-primary/15'
                : 'border border-blue-500/30 bg-blue-500/15'
            }`}
          >
            <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
              Now Picking
            </p>
            <p className="mt-1 font-display text-base font-bold text-white">
              {activeCaptain?.name}&apos;s Turn
            </p>
          </div>
          <ShotClock
            key={`${draftTurn}-${draftPool.length}`}
            duration={DRAFT_TIMER}
            isActive={!activeCaptain?.isBot}
            onExpire={handleAutoExpire}
            size={56}
            label="Shot Clock"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(180px,1fr)]">
          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1 lg:grid-cols-1">
            <DraftRosterColumn
              title="Team A"
              accentClass="text-arena-primary"
              borderClass="active-turn-glow border-arena-primary/30"
              active={draftTurn === 'teamA'}
              count={teamAPlayers.length}
              players={teamAPlayers}
              captainId={captains.teamA}
            />
            <DraftRosterColumn
              title="Team B"
              accentClass="text-blue-400"
              borderClass="active-turn-glow border-blue-500/30"
              active={draftTurn === 'teamB'}
              count={teamBPlayers.length}
              players={teamBPlayers}
              captainId={captains.teamB}
            />
          </div>

          <div className="order-1 lg:order-2">
            <DraftPoolPanel
              poolPlayers={poolPlayers}
              canPick={canPick}
              onPick={handlePick}
              activeCaptain={activeCaptain}
            />
          </div>

          <div className="order-3 hidden lg:block" />
        </div>
      </div>
    </div>
  );
}

export default DraftPhase;
