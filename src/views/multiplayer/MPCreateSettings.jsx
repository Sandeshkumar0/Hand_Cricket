import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Users, Zap } from 'lucide-react';
import { useMultiplayer, OVER_OPTIONS, SERIES_OPTIONS } from '../../context/MultiplayerContext';

const SERIES_LABELS = {
  1: '1 Match',
  3: '3 Match',
  5: '5 Match',
};

function MPCreateSettings() {
  const { state, dispatch } = useMultiplayer();
  const { settings } = state;

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-arena-surface">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.05),transparent_50%)]" />

      <div className="relative z-10 flex flex-1 flex-col items-center px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="w-full max-w-lg">
          <button
            onClick={() => dispatch({ type: 'MP_LEAVE_ROOM' })}
            className="flex items-center gap-2 text-sm text-arena-on-surface-faint transition hover:text-white"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 w-full max-w-lg"
        >
          <div className="arena-panel rounded-xl p-5 sm:p-6">
            {/* Title */}
            <div className="accent-bar-left mb-6">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-arena-primary" />
                <h2 className="esports-headline text-2xl tracking-esports text-white">
                  Room Settings
                </h2>
              </div>
              <p className="mt-1 text-xs text-arena-on-surface-faint">
                Room Code: <span className="font-display font-bold text-arena-primary">{state.roomCode}</span>
              </p>
            </div>

            {/* ─── Max Players ─── */}
            <div className="mb-6">
              <p className="font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                <Users size={12} className="mr-1 inline" /> Max Players
              </p>
              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => dispatch({ type: 'MP_UPDATE_MAX_PLAYERS', payload: settings.maxPlayers - 1 })}
                  disabled={settings.maxPlayers <= 2}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-arena-container-highest text-lg font-bold text-arena-on-surface-dim transition hover:text-white disabled:opacity-30"
                >
                  −
                </button>
                <div className="flex-1 rounded-lg bg-arena-container-highest py-3 text-center">
                  <span className="esports-headline text-3xl tracking-esports text-arena-primary">
                    {settings.maxPlayers}
                  </span>
                  <p className="mt-1 font-display text-[10px] uppercase tracking-broadcast text-arena-on-surface-faint">
                    Players
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'MP_UPDATE_MAX_PLAYERS', payload: settings.maxPlayers + 1 })}
                  disabled={settings.maxPlayers >= 22}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-arena-container-highest text-lg font-bold text-arena-on-surface-dim transition hover:text-white disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1">
                {[2, 4, 6, 8, 10, 14, 22].map((n) => (
                  <button
                    key={n}
                    onClick={() => dispatch({ type: 'MP_UPDATE_MAX_PLAYERS', payload: n })}
                    className={`rounded px-2 py-1 font-display text-[10px] font-bold transition ${
                      settings.maxPlayers === n
                        ? 'bg-arena-primary/15 text-arena-primary'
                        : 'text-arena-on-surface-faint hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Overs per Innings ─── */}
            <div className="mb-6">
              <p className="font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                Overs per Innings
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {OVER_OPTIONS.map((option) => (
                  <button
                    key={String(option)}
                    onClick={() => dispatch({ type: 'MP_UPDATE_OVERS', payload: option })}
                    className={`rounded-md px-4 py-2.5 font-display text-sm font-bold transition ${
                      settings.oversPerInnings === option
                        ? 'bg-arena-primary/15 text-arena-primary border border-arena-primary/40'
                        : 'bg-arena-container-highest text-arena-on-surface-dim border border-transparent hover:text-white'
                    }`}
                  >
                    {option === null ? '∞' : option}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Series Length ─── */}
            <div className="mb-8">
              <p className="font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                Series Length
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  /* v8 ignore next */
                  ...SERIES_OPTIONS.map((length) => ({ length, label: SERIES_LABELS[length] || `${length} Matches` })),
                ].map(({ length, label }) => (
                  <button
                    key={length}
                    onClick={() => dispatch({ type: 'MP_UPDATE_SERIES', payload: length })}
                    className={`rounded-lg px-3 py-4 text-center transition ${
                      settings.seriesLength === length
                        ? 'bg-arena-primary/15 border border-arena-primary/40'
                        : 'bg-arena-container-highest border border-transparent hover:border-arena-outline-variant/30'
                    }`}
                  >
                    <span
                      className={`esports-headline text-xl tracking-esports ${
                        settings.seriesLength === length ? 'text-arena-primary' : 'text-white'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Confirm Button ─── */}
            <button
              onClick={() => dispatch({ type: 'MP_CONFIRM_SETTINGS' })}
              className="tactile-btn flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-base"
              id="mp-confirm-settings-btn"
            >
              <Zap size={20} />
              Open Lobby
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default MPCreateSettings;
