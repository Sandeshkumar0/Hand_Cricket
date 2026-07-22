import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Swords, Sparkles, ChevronRight, Trophy, Play } from 'lucide-react';
import CricketBackground from '../components/CricketBackground';
import { useGame } from '../context/GameContext';
import { useMultiplayer } from '../context/MultiplayerContext';
import { soundEngine } from '../utils/audio';

function MainMenu() {
  const { dispatch } = useGame();
  const { dispatch: mpDispatch } = useMultiplayer();

  const handleVsBot = () => {
    soundEngine.playUiClick();
    dispatch({ type: 'START_VS_COMPUTER' });
  };

  const handleMultiplayer = () => {
    soundEngine.playUiClick();
    mpDispatch({ type: 'MP_OPEN_GATEWAY' });
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#040711]">
      {/* Cricket Stadium & Players Background */}
      <CricketBackground />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 max-w-5xl mx-auto w-full">
        {/* Main Title & Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-blue-500/30 mb-4 shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-300 uppercase">
              HAND CRICKET CHAMPIONSHIP
            </span>
          </div>

          <h1 className="esports-headline text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-2xl">
            HAND <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">CRICKET</span>
          </h1>
          <p className="mt-3 font-mono text-xs sm:text-sm tracking-widest text-slate-300 uppercase">
            REALISTIC GAME ARENA • LIVE STADIUM SHOWDOWN
          </p>
        </motion.div>

        {/* Clean & Simple Game Mode Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 grid w-full grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl"
        >
          {/* Card 1: VS BOT (Solo Match) */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVsBot}
            className="group relative cursor-pointer apple-glass-card rounded-2xl p-6 overflow-hidden border border-white/10 hover:border-blue-500/50"
          >
            <div className="flex flex-col h-full justify-between space-y-6">
              <div className="flex items-start justify-between">
                <div className="p-4 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg">
                  <Bot size={32} />
                </div>
                <span className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md bg-slate-900/90 text-cyan-300 border border-cyan-500/30">
                  SINGLE PLAYER
                </span>
              </div>

              <div>
                <h2 className="esports-headline text-3xl font-extrabold text-white group-hover:text-blue-300 transition-colors">
                  VS BOT MATCH
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Test your cricket instincts against an adaptive AI opponent with real-time pitch telemetry and momentum tracking.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono font-bold text-blue-400 group-hover:text-blue-300">
                <span className="flex items-center space-x-2">
                  <Play size={14} />
                  <span>PLAY NOW</span>
                </span>
                <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: MULTIPLAYER (Friends Showdown) */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMultiplayer}
            className="group relative cursor-pointer apple-glass-card rounded-2xl p-6 overflow-hidden border border-white/10 hover:border-amber-500/50"
          >
            <div className="flex flex-col h-full justify-between space-y-6">
              <div className="flex items-start justify-between">
                <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg">
                  <Swords size={32} />
                </div>
                <span className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md bg-slate-900/90 text-amber-300 border border-amber-500/30">
                  MULTIPLAYER
                </span>
              </div>

              <div>
                <h2 className="esports-headline text-3xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  FRIENDS SHOWDOWN
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join or host multiplayer rooms, draft team rosters, play Super Overs, and compete live with friends.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300">
                <span className="flex items-center space-x-2">
                  <Trophy size={14} />
                  <span>ENTER ARENA</span>
                </span>
                <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-between w-full max-w-3xl px-5 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 text-xs font-mono gap-3"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>DISTINCT AUDIO TONES FOR DIGITS 0–6</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>REALISTIC STADIUM AUDIO & FANFARES</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default MainMenu;
