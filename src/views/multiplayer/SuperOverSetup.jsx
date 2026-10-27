import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Lock, Check, AlertTriangle } from 'lucide-react';
import { PlayerMarker } from '../../components/CricketIcons';
import { useMultiplayer } from '../../context/MultiplayerContext';

const getRequiredBatters = (roster) => Math.min(2, roster.length);
const canReuseBowler = (roster) => roster.length < 3;

const getDefaultSelection = (roster) => {
  const requiredBatters = getRequiredBatters(roster);
  const batters = roster.slice(0, requiredBatters);
  const bowler = canReuseBowler(roster)
    ? roster[0] ?? null
    /* v8 ignore next */
    : roster.find((id) => !batters.includes(id)) ?? null;

  return { batters, bowler };
};

function SelectionSummary({ label, accentClass, players, selections }) {
  const batters = (selections?.batters ?? []).map((id) => players[id]).filter(Boolean);
  const bowler = players[selections?.bowler];

  return (
    <div className="rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-4">
      <p className={`font-display text-[10px] font-bold uppercase tracking-broadcast ${accentClass}`}>
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {batters.map((player) => (
          <span key={player.id} className="stat-chip text-arena-on-surface-dim">
            Batter: {player.name}
          </span>
        ))}
        {bowler && (
          <span className="stat-chip text-arena-on-surface-dim">
            Bowler: {bowler.name}
          </span>
        )}
      </div>
    </div>
  );
}

function TeamLockPanel({
  team,
  roster,
  players,
  captain,
  canEdit,
  selectedBatters,
  selectedBowler,
  setSelectedBowler,
  onToggleBatter,
  onLock,
  isLocked,
  lockedSelections,
}) {
  const teamLabel = team === 'teamA' ? 'Team A' : 'Team B';
  const headingClass = team === 'teamA' ? 'text-arena-primary' : 'text-blue-400';
  const requiredBatters = getRequiredBatters(roster);
  const allowsSharedBowler = canReuseBowler(roster);
  const isValid = selectedBatters.length === requiredBatters && selectedBowler !== null;
  const batterSelectedClass =
    team === 'teamA'
      ? 'border-arena-primary/40 bg-arena-primary/15'
      : 'border-blue-500/40 bg-blue-500/15';
  const batterCheckClass = team === 'teamA' ? 'text-arena-primary' : 'text-blue-400';

  return (
    <div className="arena-panel w-full max-w-2xl rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className={`esports-headline text-xl tracking-esports ${headingClass}`}>
            {teamLabel}
          </h3>
          <p className="font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
            {captain?.name}'s Super Over Lock
          </p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-1 rounded-md bg-arena-primary/15 px-3 py-1.5">
            <Lock size={12} className="text-arena-primary" />
            <span className="font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-primary">
              Locked
            </span>
          </div>
        )}
      </div>

      {isLocked ? (
        <SelectionSummary
          label={`${teamLabel} Locked`}
          accentClass={headingClass}
          players={players}
          selections={lockedSelections}
        />
      ) : (
        <>
          <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
            <Target size={10} className="mr-1 inline" />
            {roster.length === 1
              ? 'Select 1 Batter - 1 wicket'
              : `Select ${requiredBatters} Batters${allowsSharedBowler ? '' : ' - cannot bowl'}`}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {roster.map((id) => {
              const player = players[id];
              if (!player) return null;
              const isSelected = selectedBatters.includes(id);
              const isBowlerSelected = selectedBowler === id;
              const isDisabledByRole = !allowsSharedBowler && isBowlerSelected;

              return (
                <button
                  key={`bat-${id}`}
                  onClick={() => !canEdit || isDisabledByRole ? undefined : onToggleBatter(id)}
                  disabled={!canEdit || isDisabledByRole}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition ${
                    isSelected
                      ? batterSelectedClass
                      : isDisabledByRole
                        ? 'cursor-not-allowed border-transparent bg-arena-container opacity-30'
                        : 'border-transparent bg-arena-container-high hover:border-arena-outline-variant/30'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -right-1 -top-1">
                      <Check size={14} className={batterCheckClass} />
                    </div>
                  )}
                  <PlayerMarker token={player.emoji} className="h-7 w-7" fallbackClassName="text-lg" />
                  <span className="w-full truncate font-display text-[10px] font-bold text-white">
                    {player.name}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-2 mt-5 font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
            <Shield size={10} className="mr-1 inline" />
            Select 1 Bowler{allowsSharedBowler ? ' - can also bat' : ' - from remaining players'}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {roster.map((id) => {
              const player = players[id];
              if (!player) return null;
              const isSelected = selectedBowler === id;
              const isBatterSelected = selectedBatters.includes(id);
              const isDisabledByRole = !allowsSharedBowler && isBatterSelected;

              return (
                <button
                  key={`bowl-${id}`}
                  onClick={() => !canEdit || isDisabledByRole ? undefined : setSelectedBowler(isSelected ? null : id)}
                  disabled={!canEdit || isDisabledByRole}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition ${
                    isSelected
                      ? 'border-amber-500/40 bg-amber-500/15'
                      : isDisabledByRole
                        ? 'cursor-not-allowed border-transparent bg-arena-container opacity-30'
                        : 'border-transparent bg-arena-container-high hover:border-arena-outline-variant/30'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -right-1 -top-1">
                      <Check size={14} className="text-amber-500" />
                    </div>
                  )}
                  <PlayerMarker token={player.emoji} className="h-7 w-7" fallbackClassName="text-lg" />
                  <span className="w-full truncate font-display text-[10px] font-bold text-white">
                    {player.name}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onLock}
            disabled={!isValid || !canEdit}
            className={`tactile-btn-amber mt-5 w-full rounded-lg px-4 py-3 text-sm ${
              !isValid || !canEdit ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <Lock size={14} className="mr-2 inline" />
            Lock Selections
          </button>
        </>
      )}

      {!canEdit && !captain?.isBot && (
        <div className="mt-4 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-4 py-3 text-sm text-arena-on-surface-faint">
          Waiting for {captain?.name} to finalize this lineup...
        </div>
      )}
    </div>
  );
}

function SuperOverSetup() {
  const { state, dispatch } = useMultiplayer();
  const { teams, players, captains, superOver, currentPlayerId, hostId, battingTeam } = state;

  const [teamABatters, setTeamABatters] = useState([]);
  const [teamABowler, setTeamABowler] = useState(null);
  const [teamBBatters, setTeamBBatters] = useState([]);
  const [teamBBowler, setTeamBBowler] = useState(null);

  const teamARoster = useMemo(() => teams.teamA?.roster || [], [teams.teamA?.roster]);
  const teamBRoster = useMemo(() => teams.teamB?.roster || [], [teams.teamB?.roster]);
  const currentTeam =
    teamARoster.includes(currentPlayerId) ? 'teamA' : teamBRoster.includes(currentPlayerId) ? 'teamB' : null;
  const visibleTeam = currentTeam;
  const superOverBattingTeam = superOver.initialBattingTeam ?? superOver.battingTeam ?? battingTeam;
  const superOverBattingLabel = superOverBattingTeam === 'teamA' ? 'Team A' : 'Team B';
  const { teamALocked, teamBLocked, teamASelections, teamBSelections } = superOver;

  useEffect(() => {
    if (currentPlayerId !== hostId) return undefined;

    const botTeamToLock = ['teamA', 'teamB'].find((team) => {
      const captainId = teams[team]?.captainId;
      const captain = players[captainId];
      const isLocked = team === 'teamA' ? teamALocked : teamBLocked;
      return captain?.isBot && !isLocked;
    });

    if (!botTeamToLock) return undefined;

    const timer = window.setTimeout(() => {
      const roster = teams[botTeamToLock]?.roster ?? [];
      const selection = getDefaultSelection(roster);
      dispatch({
        type: 'MP_LOCK_SUPER_OVER_SELECTIONS',
        payload: { team: botTeamToLock, batters: selection.batters, bowler: selection.bowler },
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [currentPlayerId, dispatch, hostId, players, teamALocked, teamBLocked, teams]);

  const toggleBatter = (team, id) => {
    const roster = team === 'teamA' ? teamARoster : teamBRoster;
    const requiredBatters = getRequiredBatters(roster);

    if (team === 'teamA') {
      setTeamABatters((prev) =>
        prev.includes(id)
          ? prev.filter((playerId) => playerId !== id)
          : prev.length < requiredBatters
            ? [...prev, id]
            : prev
      );
    } else {
      /* v8 ignore next 3 */
      setTeamBBatters((prev) =>
        prev.includes(id)
          ? prev.filter((playerId) => playerId !== id)
          : prev.length < requiredBatters
            ? [...prev, id]
            : prev
      );
    }
  };

  const lockTeam = (team) => {
    const batters = team === 'teamA' ? teamABatters : teamBBatters;
    const bowler = team === 'teamA' ? teamABowler : teamBBowler;

    dispatch({
      type: 'MP_LOCK_SUPER_OVER_SELECTIONS',
      payload: { team, batters, bowler },
    });
  };

  const handleForfeit = () => {
    if (!window.confirm('Forfeit this match and award the win to the other team?')) return;
    dispatch({ type: 'MP_FORFEIT_MATCH' });
  };

  const teamConfig = useMemo(() => ({
    teamA: {
      roster: teamARoster,
      captainId: captains.teamA,
      captain: players[captains.teamA],
      selectedBatters: teamABatters,
      selectedBowler: teamABowler,
      setSelectedBowler: setTeamABowler,
      isLocked: teamALocked,
      lockedSelections: teamASelections,
    },
    teamB: {
      roster: teamBRoster,
      captainId: captains.teamB,
      captain: players[captains.teamB],
      selectedBatters: teamBBatters,
      selectedBowler: teamBBowler,
      setSelectedBowler: setTeamBBowler,
      isLocked: teamBLocked,
      lockedSelections: teamBSelections,
    },
  }), [
    captains.teamA,
    captains.teamB,
    players,
    teamALocked,
    teamASelections,
    teamBLocked,
    teamBSelections,
    teamABatters,
    teamABowler,
    teamARoster,
    teamBBatters,
    teamBBowler,
    teamBRoster,
  ]);

  const activeTeamConfig = visibleTeam ? teamConfig[visibleTeam] : null;
  const canCurrentCaptainEdit =
    visibleTeam &&
    currentPlayerId === activeTeamConfig?.captainId &&
    !activeTeamConfig?.captain?.isBot;

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-arena-surface">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_50%)]" />

      <div className="relative z-10 flex flex-1 flex-col items-center px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="text-center"
        >
          <div className="super-over-banner inline-block px-6 py-3">
            <h2 className="esports-headline text-4xl tracking-[0.15em] neon-text-super sm:text-5xl">
              Super Over {superOver.sequence}
            </h2>
          </div>
          <p className="mt-3 font-display text-sm uppercase tracking-broadcast text-arena-on-surface-faint">
            1 player: reuse yourself. 2 players: both can bat. 3+ players: batters cannot bowl.
          </p>
          <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-broadcast text-amber-400">
            {superOverBattingLabel} bats first in this Super Over
          </p>
          {superOver.sequence > 1 && (
            <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-broadcast text-arena-secondary">
              Previous Super Over was tied. Lock a fresh lineup.
            </p>
          )}
        </motion.div>

        <div className="mt-6 flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
          {visibleTeam && activeTeamConfig ? (
            <>
              <TeamLockPanel
                team={visibleTeam}
                roster={activeTeamConfig.roster}
                players={players}
                captain={activeTeamConfig.captain}
                canEdit={canCurrentCaptainEdit}
                selectedBatters={activeTeamConfig.selectedBatters}
                selectedBowler={activeTeamConfig.selectedBowler}
                setSelectedBowler={activeTeamConfig.setSelectedBowler}
                onToggleBatter={(id) => toggleBatter(visibleTeam, id)}
                onLock={() => lockTeam(visibleTeam)}
                isLocked={activeTeamConfig.isLocked}
                lockedSelections={activeTeamConfig.lockedSelections}
              />

              {canCurrentCaptainEdit && (
                <button
                  onClick={handleForfeit}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-broadcast text-red-200 transition hover:bg-red-500/15"
                >
                  <AlertTriangle size={14} />
                  Forfeit Match
                </button>
              )}

              {(teamALocked || teamBLocked) && !(teamALocked && teamBLocked) && (
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-arena-outline-variant/20 bg-arena-container px-5 py-3 text-sm text-arena-on-surface-faint">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Waiting for the other captain to lock selections...
                </div>
              )}
            </>
          ) : (
            <div className="arena-panel w-full max-w-2xl rounded-xl p-5 text-center">
              <p className="font-display text-xs uppercase tracking-broadcast text-arena-on-surface-faint">
                Super Over Lineups
              </p>
              <p className="mt-3 text-sm text-arena-on-surface-dim">
                Waiting for captains to lock both teams for the next Super Over.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperOverSetup;
