import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LogIn, ArrowLeft, Users } from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';

function MPGateway() {
  const { state, dispatch } = useMultiplayer();
  const { notice } = state;
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const [playerName, setPlayerName] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleJoinCodeChange = (index, value) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const newCode = [...joinCode];
    newCode[index] = char;
    setJoinCode(newCode);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    /* v8 ignore next 3 */
    if (e.key === 'Backspace' && !joinCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleCreate = () => {
    dispatch({ type: 'MP_CREATE_ROOM', payload: { name: playerName || 'Player 1' } });
  };

  const handleJoin = () => {
    const code = joinCode.join('');
    /* v8 ignore next */
    if (code.length === 4) {
      dispatch({ type: 'MP_JOIN_ROOM', payload: { name: playerName || 'Player', code } });
    }
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-arena-surface" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(90,240,179,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.04),transparent_40%)]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-8 pt-10 sm:px-8">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="esports-headline text-4xl tracking-esports neon-text-primary sm:text-5xl">
            Play with Friends
          </h1>
          <p className="mt-3 font-display text-sm font-medium uppercase tracking-broadcast text-arena-on-surface-faint">
            Multiplayer Arena
          </p>
        </motion.div>

        {/* Name Input */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{notice}</span>
              <button
                onClick={() => dispatch({ type: 'MP_CLEAR_NOTICE' })}
                className="font-display text-[10px] font-bold uppercase tracking-broadcast text-red-100/80 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8 w-full max-w-md"
        >
          <label className="font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
            Your Display Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter name..."
            maxLength={16}
            className="mt-2 w-full rounded-lg border border-arena-outline-variant/20 bg-arena-container-high px-4 py-3 font-display text-sm text-white placeholder-arena-on-surface-faint outline-none transition focus:border-arena-primary/50 focus:ring-1 focus:ring-arena-primary/20"
          />
        </motion.div>

        {/* Mode Cards */}
        {!mode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 grid w-full max-w-md gap-4 sm:grid-cols-2"
          >
            {/* Create Room */}
            <button
              onClick={() => setMode('create')}
              className="group arena-panel rounded-xl p-6 text-left transition hover:border-arena-primary/30"
              id="mp-create-room-card"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-arena-primary/15 text-arena-primary transition group-hover:scale-110">
                <Plus size={28} />
              </div>
              <h2 className="esports-headline mt-4 text-xl tracking-esports text-white">
                Create Room
              </h2>
              <p className="mt-2 text-sm text-arena-on-surface-faint">
                Host a new match room and invite friends.
              </p>
            </button>

            {/* Join Room */}
            <button
              onClick={() => setMode('join')}
              className="group arena-panel rounded-xl p-6 text-left transition hover:border-blue-500/30"
              id="mp-join-room-card"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 transition group-hover:scale-110">
                <LogIn size={28} />
              </div>
              <h2 className="esports-headline mt-4 text-xl tracking-esports text-white">
                Join Room
              </h2>
              <p className="mt-2 text-sm text-arena-on-surface-faint">
                Enter a 4-digit room code to join.
              </p>
            </button>
          </motion.div>
        )}

        {/* Create Room Action */}
        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-md"
          >
            <div className="arena-panel rounded-xl p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-arena-primary/15 text-arena-primary">
                <Users size={28} />
              </div>
              <h3 className="esports-headline mt-4 text-xl tracking-esports text-white">
                Ready to Host?
              </h3>
              <p className="mt-2 text-sm text-arena-on-surface-faint">
                Create a room and configure match settings.
              </p>
              <button
                onClick={handleCreate}
                className="tactile-btn mt-5 w-full rounded-lg px-6 py-4 text-base"
                id="mp-create-room-btn"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode(null)}
                className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-arena-on-surface-faint transition hover:text-white"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </motion.div>
        )}

        {/* Join Room Action */}
        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-md"
          >
            <div className="arena-panel rounded-xl p-6 text-center">
              <p className="font-display text-xs font-bold uppercase tracking-broadcast text-arena-on-surface-dim">
                Enter Room Code
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                {joinCode.map((char, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    value={char}
                    onChange={(e) => handleJoinCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    maxLength={1}
                    className="room-code-cell"
                    id={`mp-join-code-${i}`}
                  />
                ))}
              </div>
              <button
                onClick={handleJoin}
                disabled={joinCode.join('').length < 4}
                className={`tactile-btn-secondary mt-5 w-full rounded-lg px-6 py-4 text-base ${
                  joinCode.join('').length < 4 ? 'opacity-40 pointer-events-none' : ''
                }`}
                id="mp-join-room-btn"
              >
                Join Room
              </button>
              <button
                onClick={() => setMode(null)}
                className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-arena-on-surface-faint transition hover:text-white"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default MPGateway;
