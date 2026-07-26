import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';

function TeamChatWidget({ open, onClose }) {
  const { state, dispatch } = useMultiplayer();
  const { teams, players, currentPlayerId, chatMessages } = state;
  const [message, setMessage] = useState('');

  const currentTeam = useMemo(() => {
    if (teams.teamA?.roster?.includes(currentPlayerId)) return 'teamA';
    /* v8 ignore next */
    if (teams.teamB?.roster?.includes(currentPlayerId)) return 'teamB';
    return null;
  }, [currentPlayerId, teams.teamA?.roster, teams.teamB?.roster]);

  const teamLabel = currentTeam === 'teamA' ? 'Team A' : 'Team B';
  const accentClass = currentTeam === 'teamA' ? 'text-arena-primary' : 'text-blue-400';
  const accentBorderClass =
    currentTeam === 'teamA'
      ? 'border-arena-primary/30 bg-arena-primary/10'
      : 'border-blue-500/30 bg-blue-500/10';
  const messages = useMemo(
    () => chatMessages.filter((entry) => entry.team === currentTeam),
    [chatMessages, currentTeam]
  );

  const handleSend = () => {
    if (!message.trim()) return;
    dispatch({ type: 'MP_SEND_TEAM_CHAT', payload: { message } });
    setMessage('');
  };

  if (!currentTeam || players[currentPlayerId]?.isBot) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-arena-void/50"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-3 bottom-3 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-arena-outline-variant/20 bg-arena-surface shadow-2xl sm:inset-x-auto sm:right-4 sm:top-[88px] sm:bottom-4 sm:w-[340px]"
          >
            <div className="flex items-center justify-between border-b border-arena-outline-variant/15 px-4 py-3">
              <div>
                <p className={`font-display text-xs font-bold uppercase tracking-broadcast ${accentClass}`}>
                  {teamLabel} Chat
                </p>
                <p className="mt-1 text-xs text-arena-on-surface-faint">
                  Only your team can see these messages
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-arena-on-surface-faint transition hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="rounded-xl border border-dashed border-arena-outline-variant/20 bg-arena-container px-4 py-5 text-center text-sm text-arena-on-surface-faint">
                    No team messages yet.
                  </div>
                )}
                {messages.map((entry) => {
                  const isMine = entry.senderId === currentPlayerId;
                  return (
                    <div
                      key={entry.id}
                      /* v8 ignore next */
                      className={`rounded-xl px-4 py-3 ${
                        isMine ? accentBorderClass : 'bg-arena-container'
                      }`}
                    >
                      <p className="font-display text-[10px] font-bold uppercase tracking-broadcast text-arena-on-surface-faint">
                        {entry.senderName}
                      </p>
                      <p className="mt-1 text-sm text-white">{entry.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-arena-outline-variant/15 px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    /* v8 ignore next */
                    if (e.key === 'Enter') handleSend();
                  }}
                  maxLength={240}
                  placeholder={`Message ${teamLabel}...`}
                  className="w-full rounded-xl border border-arena-outline-variant/20 bg-arena-container-high px-4 py-3 text-sm text-white outline-none transition focus:border-arena-primary/40"
                />
                <button
                  onClick={handleSend}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-arena-primary/15 text-arena-primary transition hover:bg-arena-primary/25"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TeamChatWidget;
