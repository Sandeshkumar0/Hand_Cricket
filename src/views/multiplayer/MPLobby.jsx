import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Copy, Check, Zap, Crown, Wifi, WifiOff } from 'lucide-react';
import { PlayerMarker } from '../../components/CricketIcons';
import { useMultiplayer } from '../../context/MultiplayerContext';
import PlayerProfileModal from '../../components/PlayerProfileModal';

function MPLobby() {
  const { state, dispatch } = useMultiplayer();
  const { players, settings, roomCode, hostId, currentPlayerId } = state;

  const playerList = Object.values(players);
  const allReady = playerList.every((p) => p.isReady);
  const playerCount = playerList.length;
  // If host is the only one in room, they need bots or players to start
  const canStart = allReady && playerCount >= 2;
  const amIHost = currentPlayerId === hostId;

  const [copied, setCopied] = React.useState(false);
  const [selectedProfile, setSelectedProfile] = React.useState(null);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-arena-surface">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.05),transparent_50%)]" />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-5 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => dispatch({ type: 'MP_LEAVE_ROOM' })}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-arena-container-highest text-arena-on-surface-dim transition hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-on-surface-faint">
              Room Code
            </p>
            <button
              onClick={copyCode}
              className="mt-1 flex items-center gap-2 rounded-lg bg-arena-container-high px-4 py-2 transition hover:bg-arena-container-highest"
            >
              <span className="esports-headline text-2xl tracking-[0.2em] text-arena-primary">
                {roomCode}
              </span>
              {copied ? (
                <Check size={16} className="text-arena-primary" />
              ) : (
                <Copy size={16} className="text-arena-on-surface-faint" />
              )}
            </button>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-arena-container-highest text-arena-on-surface-faint">
            <span className="font-display text-xs font-bold">
              {playerCount}/{settings.maxPlayers}
            </span>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="stat-chip text-arena-on-surface-dim">
            {settings.oversPerInnings === null ? '∞' : settings.oversPerInnings} Overs
          </span>
          <span className="stat-chip text-arena-on-surface-dim">
            BO{settings.seriesLength}
          </span>
          <span className="stat-chip text-arena-on-surface-dim">
            {settings.maxPlayers} Max
          </span>
        </div>

        {/* Player Grid */}
        <div className="mt-5 flex-1">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
            Players in Lobby
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {playerList.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`arena-panel relative rounded-xl p-4 text-center transition ${
                  player.isReady ? 'border-arena-primary/30' : ''
                }`}
              >
                {/* Host badge */}
                {player.id === hostId && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="captain-badge flex items-center gap-1">
                      <Crown size={10} /> Host
                    </span>
                  </div>
                )}

                {/* Avatar */}
                <div 
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-2xl cursor-pointer ${
                  player.isBot ? 'bg-blue-500/15' : 'bg-arena-container-highest hover:bg-arena-container-highest/80'
                }`}
                  onClick={() => setSelectedProfile(player)}
                  title="View Profile"
                >
                  <PlayerMarker token={player.emoji} className="h-8 w-8" />
                </div>

                {/* Name */}
                <p className="mt-2 truncate font-display text-sm font-bold text-white flex items-center justify-center gap-1">
                  {player.name}
                  {!player.isBot && (player.isOnline ? (
                    <Wifi size={10} className="text-emerald-400" title="Online" />
                  ) : (
                    <WifiOff size={10} className="text-red-400" title="Offline" />
                  ))}
                </p>

                {/* Ready status */}
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      player.isReady
                        ? 'bg-arena-primary pulse-ready'
                        : 'bg-arena-on-surface-faint'
                    }`}
                  />
                  <span
                    className={`font-display text-[10px] font-bold uppercase tracking-broadcast ${
                      player.isReady ? 'text-arena-primary' : 'text-arena-on-surface-faint'
                    }`}
                  >
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>

                {/* Toggle ready / Remove */}
                {!player.isBot && player.id === currentPlayerId && (
                  <button
                    onClick={() => dispatch({ type: 'MP_TOGGLE_READY', payload: player.id })}
                    className={`mt-2 w-full rounded-md px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-broadcast transition ${
                      player.isReady
                        ? 'bg-arena-primary/15 text-arena-primary hover:bg-arena-primary/25'
                        : 'bg-arena-container-highest text-arena-on-surface-dim hover:text-white'
                    }`}
                  >
                    {player.isReady ? 'Unready' : 'Ready Up'}
                  </button>
                )}

                {/* Remove button for Host to kick others */}
                {amIHost && player.id !== hostId && (
                  <button
                    onClick={() => dispatch({ type: 'MP_REMOVE_PLAYER', payload: player.id })}
                    className="mt-1 w-full rounded-md px-3 py-1 font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint transition hover:text-arena-secondary"
                  >
                    Remove
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add Bot slot (Host Only) */}
            {amIHost && playerCount < settings.maxPlayers && (
              <button
                onClick={() => dispatch({ type: 'MP_ADD_BOT' })}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-arena-outline-variant/20 p-4 text-arena-on-surface-faint transition hover:border-blue-500/30 hover:text-blue-400"
                id="mp-add-bot-btn"
              >
                <Bot size={24} />
                <span className="font-display text-[10px] font-bold uppercase tracking-broadcast">
                  Add Bot
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Start Game Button (Host Only) */}
        {amIHost ? (
          <div className="mt-6">
            <button
              onClick={() => dispatch({ type: 'MP_START_GAME' })}
              disabled={!canStart}
              className={`tactile-btn flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-base ${
                !canStart ? 'opacity-40 pointer-events-none' : ''
              }`}
              id="mp-start-game-btn"
            >
              <Zap size={20} />
              {!allReady
                ? 'Waiting for everyone...'
                : playerCount < 2
                  ? 'Need at least 2 players'
                  : 'Start Game'}
            </button>
            {!allReady && playerCount >= 2 && (
              <p className="mt-2 text-center font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                All players must be ready to start
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-arena-container-highest px-6 py-4 text-base text-arena-on-surface-faint">
              <span className="animate-pulse">Waiting for Host to start the game...</span>
            </div>
            {!allReady && (
              <p className="mt-2 text-center font-display text-[10px] uppercase tracking-broadcast text-arena-secondary">
                Ensure all players ready up!
              </p>
            )}
          </div>
        )}
      </div>

      <PlayerProfileModal
        open={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        playerStats={selectedProfile?.careerStats}
      />
    </div>
  );
}

export default MPLobby;
