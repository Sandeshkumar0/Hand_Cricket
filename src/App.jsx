import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, User, Volume2, VolumeX } from 'lucide-react';
import { useGame } from './context/GameContext';
import { useMultiplayer } from './context/MultiplayerContext';
import MainMenu from './views/MainMenu';
import Lobby from './views/Lobby';
import Toss from './views/Toss';
import Match from './views/Match';
import SeriesResult from './views/SeriesResult';

// Multiplayer Views
import MPGateway from './views/multiplayer/MPGateway';
import MPCreateSettings from './views/multiplayer/MPCreateSettings';
import MPLobby from './views/multiplayer/MPLobby';
import CaptainReveal from './views/multiplayer/CaptainReveal';
import MPToss from './views/multiplayer/MPToss';
import DraftPhase from './views/multiplayer/DraftPhase';
import MPMatchToss from './views/multiplayer/MPMatchToss';
import MPPreMatchSummary from './views/multiplayer/MPPreMatchSummary';
import MPPlayerIntro from './views/multiplayer/MPPlayerIntro';
import CaptainSelect from './views/multiplayer/CaptainSelect';
import MPMatch from './views/multiplayer/MPMatch';
import SuperOverSetup from './views/multiplayer/SuperOverSetup';
import SuperOverReveal from './views/multiplayer/SuperOverReveal';
import SuperOverMatch from './views/multiplayer/SuperOverMatch';
import TeamChatWidget from './views/multiplayer/TeamChatWidget';
import PlayerProfileModal from './components/PlayerProfileModal';
import { loadAllCareerStats } from './utils/statsStorage';
import { soundEngine } from './utils/audio';

const TEAM_CHAT_PHASES = new Set([
  'MP_MATCH_TOSS',
  'MP_MATCH_TOSS_RESULT',
  'MP_PRE_MATCH',
  'MP_PLAYER_INTRO',
  'MP_SELECT_BATTER',
  'MP_SELECT_BOWLER',
  'MP_MATCH',
  'MP_RESOLVE_MOVE',
  'MP_INNINGS_BREAK',
  'MP_MATCH_RESULT',
  'MP_SUPER_OVER_SETUP',
  'MP_SUPER_OVER_REVEAL',
  'MP_SUPER_OVER',
  'MP_RESOLVE_SO',
  'MP_SUPER_OVER_RESULT',
  'MP_SERIES_RESULT',
]);

function App() {
  const { state, dispatch: gameDispatch } = useGame();
  const { state: mpState, dispatch: mpDispatch } = useMultiplayer();
  const [teamChatOpen, setTeamChatOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const careerStats = loadAllCareerStats();

  const [isMuted, setIsMuted] = useState(soundEngine.muted);

  const toggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playUiClick();
    }
  };

  const currentTeam = useMemo(() => {
    if (mpState.teams?.teamA?.roster?.includes(mpState.currentPlayerId)) return 'teamA';
    if (mpState.teams?.teamB?.roster?.includes(mpState.currentPlayerId)) return 'teamB';
    return null;
  }, [mpState.currentPlayerId, mpState.teams]);

  const canOpenTeamChat =
    TEAM_CHAT_PHASES.has(mpState.phase) &&
    Boolean(currentTeam) &&
    !mpState.players?.[mpState.currentPlayerId]?.isBot;

  const backConfig = useMemo(() => {
    if (mpState.phase !== 'MP_GATEWAY') {
      if (mpState.phase === 'MP_MENU') {
        return { label: 'Main Menu', action: 'mp-main-menu' };
      }

      if (['MP_CREATE_SETTINGS', 'MP_LOBBY'].includes(mpState.phase)) {
        return { label: 'Back', action: 'mp-leave-room' };
      }

      return null;
    }

    if (state.currentPhase === 'LOBBY') {
      return { label: 'Main Menu', action: 'sp-main-menu' };
    }

    if (['TOSS_SETUP', 'TOSS', 'TOSS_RESULT'].includes(state.currentPhase)) {
      return { label: 'Lobby', action: 'sp-lobby' };
    }

    return null;
  }, [mpState.phase, state.currentPhase]);

  const handleBack = () => {
    soundEngine.playUiClick();
    switch (backConfig?.action) {
      case 'mp-main-menu':
        mpDispatch({ type: 'MP_BACK_TO_GATEWAY' });
        break;
      case 'mp-leave-room':
        mpDispatch({ type: 'MP_LEAVE_ROOM' });
        break;
      case 'sp-main-menu':
        gameDispatch({ type: 'GO_TO_MAIN_MENU' });
        break;
      case 'sp-lobby':
        gameDispatch({ type: 'BACK_TO_LOBBY' });
        break;
      default:
        break;
    }
  };

  const renderPhase = () => {
    // ─── Multiplayer Phases ───
    if (mpState.phase !== 'MP_GATEWAY') {
      switch (mpState.phase) {
        case 'MP_CREATE_SETTINGS':
          return <MPCreateSettings />;
        case 'MP_LOBBY':
          return <MPLobby />;
        case 'MP_CAPTAIN_REVEAL':
          return <CaptainReveal />;
        case 'MP_TOSS':
        case 'MP_TOSS_RESULT':
          return <MPToss />;
        case 'MP_DRAFT':
          return <DraftPhase />;
        case 'MP_MATCH_TOSS':
        case 'MP_MATCH_TOSS_RESULT':
          return <MPMatchToss />;
        case 'MP_PRE_MATCH':
          return <MPPreMatchSummary />;
        case 'MP_PLAYER_INTRO':
          return <MPPlayerIntro />;
        case 'MP_SELECT_BATTER':
        case 'MP_SELECT_BOWLER':
          return <CaptainSelect />;
        case 'MP_MATCH':
        case 'MP_RESOLVE_MOVE':
        case 'MP_INNINGS_BREAK':
        case 'MP_MATCH_RESULT':
          return <MPMatch />;
        case 'MP_SUPER_OVER_SETUP':
          return <SuperOverSetup />;
        case 'MP_SUPER_OVER_REVEAL':
          return <SuperOverReveal />;
        case 'MP_SUPER_OVER':
        case 'MP_RESOLVE_SO':
        case 'MP_SUPER_OVER_RESULT':
          return <SuperOverMatch />;
        case 'MP_SERIES_RESULT':
          return <MPSeriesResult />;
        default:
          return <MPGateway />;
      }
    }

    // ─── Single-Player Phases ───
    switch (state.currentPhase) {
      case 'MAIN_MENU':
        return <MainMenu />;
      case 'LOBBY':
        return <Lobby />;
      case 'TOSS_SETUP':
      case 'TOSS':
      case 'TOSS_RESULT':
        return <Toss />;
      case 'MATCH':
      case 'RESOLVE_MOVE':
      case 'INNINGS_BREAK':
      case 'MATCH_RESULT':
        return <Match />;
      case 'SERIES_RESULT':
        return <SeriesResult />;
      default:
        return <MainMenu />;
    }
  };

  const getViewKey = () => {
    if (mpState.phase !== 'MP_GATEWAY') {
      const mp = mpState.phase;
      if (['MP_CREATE_SETTINGS'].includes(mp)) return 'mp-settings';
      if (['MP_LOBBY'].includes(mp)) return 'mp-lobby';
      if (['MP_CAPTAIN_REVEAL'].includes(mp)) return 'mp-captain-reveal';
      if (['MP_TOSS', 'MP_TOSS_RESULT'].includes(mp)) return 'mp-toss';
      if (['MP_DRAFT'].includes(mp)) return 'mp-draft';
      if (['MP_MATCH_TOSS', 'MP_MATCH_TOSS_RESULT'].includes(mp)) return 'mp-match-toss';
      if (['MP_PRE_MATCH'].includes(mp)) return 'mp-pre-match';
      if (['MP_PLAYER_INTRO'].includes(mp)) return 'mp-player-intro';
      if (['MP_SELECT_BATTER', 'MP_SELECT_BOWLER'].includes(mp)) return 'mp-captain-select';
      if (['MP_MATCH', 'MP_RESOLVE_MOVE', 'MP_INNINGS_BREAK', 'MP_MATCH_RESULT'].includes(mp)) return 'mp-match';
      if (['MP_SUPER_OVER_SETUP'].includes(mp)) return `mp-so-setup-${mpState.superOver?.sequence ?? 1}`;
      if (['MP_SUPER_OVER_REVEAL'].includes(mp)) return `mp-so-reveal-${mpState.superOver?.sequence ?? 1}`;
      if (['MP_SUPER_OVER', 'MP_RESOLVE_SO', 'MP_SUPER_OVER_RESULT'].includes(mp)) return `mp-super-over-${mpState.superOver?.sequence ?? 1}`;
      if (['MP_SERIES_RESULT'].includes(mp)) return 'mp-series-result';
      return mp;
    }
    const sp = state.currentPhase;
    if (['TOSS_SETUP', 'TOSS', 'TOSS_RESULT'].includes(sp)) {
      return `sp-toss-${state.match_settings.current_match}`;
    }
    if (['MATCH', 'RESOLVE_MOVE', 'INNINGS_BREAK', 'MATCH_RESULT'].includes(sp)) return 'sp-match';
    return sp;
  };

  const viewKey = getViewKey();
  const showNavbar = viewKey !== 'MAIN_MENU' && viewKey !== 'MP_GATEWAY';

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#040711] text-slate-100 font-sans">
      {/* Top Navbar */}
      {showNavbar && (
        <header className="relative z-30 apple-glass border-b border-white/10 px-4 py-2.5 sm:px-6">
          <div className="bmw-m-stripe absolute top-0 left-0 right-0 h-0.5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {backConfig && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition"
                >
                  <ArrowLeft size={14} />
                  <span>{backConfig.label}</span>
                </button>
              )}
              <div className="flex items-center space-x-2">
                <h1 className="esports-headline text-lg font-black tracking-wide text-white">
                  HAND <span className="text-blue-400">CRICKET</span>
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  PRO ARENA
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleSound}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition"
              >
                {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-cyan-400" />}
                <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setProfileModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-mono font-bold text-blue-300 hover:bg-blue-500/30 transition"
              >
                <User size={14} />
                <span>PROFILE STATS</span>
              </button>

              {mpState.phase !== 'MP_GATEWAY' && (
                <span className="rounded-md bg-amber-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  MULTIPLAYER
                </span>
              )}
              {canOpenTeamChat && (
                <button
                  type="button"
                  onClick={() => setTeamChatOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-mono font-bold text-blue-300 hover:bg-blue-500/30 transition"
                >
                  <MessageSquare size={14} />
                  <span className="hidden sm:inline">
                    {currentTeam === 'teamA' ? 'TEAM A CHAT' : 'TEAM B CHAT'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main View Container */}
      <div className="relative flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex min-h-0 w-full flex-1 flex-col"
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </div>

      <PlayerProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        playerStats={careerStats.player}
      />

      {mpState.phase !== 'MP_GATEWAY' && (
        <TeamChatWidget open={canOpenTeamChat && teamChatOpen} onClose={() => setTeamChatOpen(false)} />
      )}
    </div>
  );
}

/* ─── Multiplayer Series Result ─── */
function MPSeriesResult() {
  const { state, dispatch } = useMultiplayer();
  const { seriesScores, matchResults, seriesWinner, settings, players, captains, currentPlayerId, hostId } = state;
  const isHost = currentPlayerId === hostId;

  const winnerLabel = seriesWinner === 'teamA' ? 'Team A' : 'Team B';

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto bg-[#040711] px-4 pb-8 pt-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-lg mt-4 text-center">
        <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-bold text-slate-300 uppercase">
          MULTIPLAYER SERIES: {seriesScores.teamA} - {seriesScores.teamB}
        </span>
        <h2 className="esports-headline mt-3 text-4xl sm:text-5xl font-black text-white">
          🏆 {winnerLabel.toUpperCase()} WINS SERIES!
        </h2>

        <div className="mt-8 apple-glass-card rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="font-mono text-xs font-bold text-blue-400 uppercase">TEAM A</p>
              <p className="mt-2 font-mono text-5xl font-black text-white">{seriesScores.teamA}</p>
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-amber-400 uppercase">TEAM B</p>
              <p className="mt-2 font-mono text-5xl font-black text-white">{seriesScores.teamB}</p>
            </div>
          </div>

          <div className="pt-6 text-left">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">MATCH BREAKDOWN</h4>
            <div className="space-y-2.5">
              {matchResults.map((match) => (
                <div key={match.matchNumber} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">MATCH {match.matchNumber}</span>
                    <p className={match.winner === 'teamA' ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>
                      {match.winner === 'teamA' ? 'TEAM A WON' : 'TEAM B WON'}
                    </p>
                  </div>
                  <div className="text-right text-slate-300">
                    <div>{match.teamAScore}</div>
                    <div className="text-slate-500">{match.teamBScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {isHost ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                dispatch({ type: 'MP_RESET' });
              }}
              className="tactile-btn w-full py-4 text-base font-black tracking-wider"
            >
              START NEW MULTIPLAYER SERIES
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-xs font-mono text-slate-400">
              WAITING FOR HOST TO START NEW SERIES...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default App;
