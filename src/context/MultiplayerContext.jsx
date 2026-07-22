import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase.js';
import { remove, update, ref, runTransaction, set, get } from 'firebase/database';
import { useGameRoom } from '../hooks/useGameRoom.js';
import {
  OVER_OPTIONS, SERIES_OPTIONS, DRAFT_TIMER, SELECTION_TIMER, SUPER_OVER_BALLS,
  createMatchState, createSuperOverState, generateRoomCode, generatePlayerId, generateBotId, getPlayerEmojiForId, mapFirebaseToState, defaultSettings, formatOvers,
  BOT_NAMES
} from '../utils/firebaseUtils.js';

export { OVER_OPTIONS, SERIES_OPTIONS, DRAFT_TIMER, SELECTION_TIMER, SUPER_OVER_BALLS };

const MultiplayerContext = createContext();

const EMPTY_LOCKED_MOVES = { batterMove: null, bowlerMove: null };

const getOppositeTeam = (team) => (team === 'teamA' ? 'teamB' : 'teamA');

const getRequiredSuperOverBatters = (roster) => {
  const rosterSize = roster?.length ?? 0;
  return Math.min(2, rosterSize);
};

const normalizeSuperOverBatters = (roster, batters) => {
  const uniqueBatters = [...new Set(batters)].filter((id) => roster.includes(id));
  return uniqueBatters.slice(0, 2);
};

const isValidSuperOverSelection = (roster, batters, bowler) => {
  const requiredBatters = getRequiredSuperOverBatters(roster);
  const uniqueBatters = [...new Set(batters)];

  if (requiredBatters === 0 || !bowler || !roster.includes(bowler)) return false;
  if (uniqueBatters.length !== requiredBatters) return false;
  if (!uniqueBatters.every((id) => roster.includes(id))) return false;
  if (roster.length >= 3 && uniqueBatters.includes(bowler)) return false;

  return true;
};

const getRemainingTossSide = (assignment) => {
  const nextAssignment = { odd: null, even: null, ...(assignment || {}) };
  if (nextAssignment.odd && !nextAssignment.even) return 'even';
  if (nextAssignment.even && !nextAssignment.odd) return 'odd';
  return null;
};

const getPlayerTeam = (state, playerId) => {
  if (state.teams?.teamA?.roster?.includes(playerId)) return 'teamA';
  if (state.teams?.teamB?.roster?.includes(playerId)) return 'teamB';
  return null;
};

const computeSeriesWinner = (seriesScores, seriesLength) => {
  const needed = Math.ceil((seriesLength ?? 1) / 2);
  if ((seriesScores.teamA ?? 0) >= needed) return 'teamA';
  if ((seriesScores.teamB ?? 0) >= needed) return 'teamB';
  return null;
};

const getTeamScoreSummary = (state, battingScore) => ({
  teamAScore: state.battingTeam === 'teamA' ? battingScore : state.score.bowling,
  teamBScore: state.battingTeam === 'teamB' ? battingScore : state.score.bowling,
});

const buildSeriesState = (state, winner, teamScores, summary) => {
  const currentScores = state.seriesScores ?? { teamA: 0, teamB: 0 };
  const currentResults = state.matchResults ?? [];

  if (winner !== 'teamA' && winner !== 'teamB') {
    return {
      nextScores: currentScores,
      nextResults: currentResults,
      nextWinner: null,
    };
  }

  const nextScores = {
    ...currentScores,
    [winner]: (currentScores[winner] ?? 0) + 1,
  };
  const nextResults = [
    ...currentResults,
    {
      matchNumber: state.settings.currentMatch,
      winner,
      summary,
      teamAScore: teamScores.teamAScore,
      teamBScore: teamScores.teamBScore,
    },
  ];

  return {
    nextScores,
    nextResults,
    nextWinner: computeSeriesWinner(nextScores, state.settings.seriesLength),
  };
};

const buildNextMatchUpdates = (state, path) => ({
  [path('meta/status')]: 'MP_MATCH_TOSS',
  [path('settings/currentMatch')]: (state.settings.currentMatch ?? 1) + 1,
  [path('match')]: createMatchState(),
  [path('matchToss')]: {
    assignment: { odd: null, even: null },
    moves: { captainA: null, captainB: null },
    winner: null,
  },
  [path('resultMeta')]: null,
  [path('superOver')]: createSuperOverState(),
});

const buildSeriesResetUpdates = (state, path) => {
  const resetPlayers = Object.fromEntries(
    Object.entries(state.players || {}).map(([id, player]) => [
      id,
      {
        ...player,
        isReady: player.isBot ? true : false,
      },
    ])
  );

  return {
    [path('meta/status')]: 'MP_LOBBY',
    [path('settings/currentMatch')]: 1,
    [path('players')]: resetPlayers,
    [path('captains')]: { teamA: null, teamB: null },
    [path('teams')]: null,
    [path('draft')]: null,
    [path('toss')]: null,
    [path('matchToss')]: null,
    [path('match')]: createMatchState(),
    [path('series')]: { scores: { teamA: 0, teamB: 0 }, results: [], winner: null },
    [path('superOver')]: createSuperOverState(),
    [path('resultMeta')]: null,
    [path('chat/messages')]: null,
  };
};

const createSuperOverSetupState = (initialBattingTeam, previousSuperOver = null) => ({
  ...createSuperOverState(),
  sequence: previousSuperOver ? (previousSuperOver.sequence ?? 1) + 1 : 1,
  initialBattingTeam,
  battingTeam: initialBattingTeam,
  bowlingTeam: getOppositeTeam(initialBattingTeam),
});

export function MultiplayerProvider({ children }) {
  const [localState, setLocalState] = useState({
    phase: 'MP_GATEWAY',
    roomCode: '',
    userId: generatePlayerId(),
    name: 'Player 1',
    notice: null,
  });

  const { roomState, actions, isHost } = useGameRoom(localState.roomCode, localState.userId);

  const state = useMemo(() => {
    const wasKickedOut =
      Boolean(localState.roomCode) &&
      Boolean(roomState?.players) &&
      !roomState.players[localState.userId];

    if (wasKickedOut) {
      return {
        phase: 'MP_GATEWAY',
        roomCode: '',
        hostId: '',
        currentPlayerId: localState.userId,
        notice: 'You were kicked out of the room by the admin.',
        settings: defaultSettings,
        players: {},
        captains: { teamA: null, teamB: null },
        teams: { teamA: null, teamB: null },
        draftPool: [],
        draftTurn: 'teamA',
        matchTossMoves: { captainA: null, captainB: null },
        tossMoves: { captainA: null, captainB: null },
        chatMessages: [],
        lockedMoves: { batterMove: null, bowlerMove: null },
        currentOverLog: [],
        ballLog: [],
        usedBowlersThisOver: [],
        inningsResults: [],
        playerStats: {},
        score: { batting: 0, bowling: 0 },
        wickets: { batting: 0, bowling: 0 },
        seriesScores: { teamA: 0, teamB: 0 },
        matchResults: [],
        seriesWinner: null,
        resultMeta: null,
      };
    }

    if (roomState) {
      const mapped = mapFirebaseToState(roomState, localState);
      if (mapped) return mapped;
    }
    return {
      phase: localState.phase,
      roomCode: localState.roomCode || '',
      hostId: localState.userId || '',
      currentPlayerId: localState.userId,
      notice: localState.notice,
      settings: defaultSettings,
      players: {},
      captains: { teamA: null, teamB: null },
      teams: { teamA: null, teamB: null },
      draftPool: [],
      draftTurn: 'teamA',
      matchTossMoves: { captainA: null, captainB: null },
      tossMoves: { captainA: null, captainB: null },
      chatMessages: [],
      lockedMoves: { batterMove: null, bowlerMove: null },
      currentOverLog: [],
      ballLog: [],
      usedBowlersThisOver: [],
      inningsResults: [],
      playerStats: {},
      score: { batting: 0, bowling: 0 },
      wickets: { batting: 0, bowling: 0 },
      seriesScores: { teamA: 0, teamB: 0 },
      matchResults: [],
      seriesWinner: null,
      resultMeta: null,
    };
  }, [roomState, localState]);

  // Provide access to the raw firebase update path tool
  const path = useCallback((subPath) => `rooms/${localState.roomCode}/${subPath}`, [localState.roomCode]);

  // -- Host Authority Effects --
  useEffect(() => {
    if (!isHost || !roomState || !state) return;

    // 1. DRAFT END DETECTION
    if (state.phase === 'MP_DRAFT' && state.draftPool.length === 0) {
      // Check if teams uneven -> add bot
      const rosterA = state.teams.teamA.roster;
      const rosterB = state.teams.teamB.roster;
      let updates = {
        [path('meta/status')]: 'MP_MATCH_TOSS',
        [path('matchToss/assignment')]: { odd: null, even: null },
        [path('matchToss/moves')]: { captainA: null, captainB: null },
        [path('matchToss/winner')]: null,
      };

      if (rosterA.length !== rosterB.length) {
        const smaller = rosterA.length < rosterB.length ? 'teamA' : 'teamB';
        const botId = generateBotId();
        const botIndex = Object.values(state.players).filter(p => p.isBot).length;
        
        updates[path(`players/${botId}`)] = {
          id: botId, name: BOT_NAMES[botIndex % BOT_NAMES.length], emoji: '🤖', isBot: true, isReady: true, isOnline: true
        };
        updates[path(`teams/${smaller}/roster`)] = [...state.teams[smaller].roster, botId];
      }
      update(ref(db), updates);
    }

    if (
      state.phase === 'MP_CAPTAIN_REVEAL' &&
      (!state.captains.teamA || !state.captains.teamB)
    ) {
      const playerIds = Object.keys(state.players);
      if (playerIds.length < 2) return;

      const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
      const [capA, capB] = shuffled;

      update(ref(db), {
        [path('captains')]: { teamA: capA, teamB: capB },
        [path('toss/assignment')]: { odd: null, even: null },
        [path('teams')]: {
          teamA: { captainId: capA, roster: [capA], score: 0, wickets: 0 },
          teamB: { captainId: capB, roster: [capB], score: 0, wickets: 0 },
        },
      });
    }

    // 2. CAPTAIN TOSS RESOLVE
    if (
      state.phase === 'MP_TOSS' &&
      state.tossAssignment.odd &&
      state.tossAssignment.even &&
      state.tossMoves.captainA != null &&
      state.tossMoves.captainB != null
    ) {
      const sum = state.tossMoves.captainA + state.tossMoves.captainB;
      const winnerTeam = (sum % 2 !== 0) 
        ? (state.tossAssignment.odd === state.captains.teamA ? 'teamA' : 'teamB')
        : (state.tossAssignment.even === state.captains.teamA ? 'teamA' : 'teamB');
        
      update(ref(db), {
        [path('toss/winner')]: winnerTeam,
        [path('meta/status')]: 'MP_TOSS_RESULT'
      });
    }

    // 3. MATCH TOSS RESOLVE
    if (
      state.phase === 'MP_MATCH_TOSS' &&
      state.matchTossAssignment.odd &&
      state.matchTossAssignment.even &&
      state.matchTossMoves.captainA != null &&
      state.matchTossMoves.captainB != null
    ) {
      const sum = state.matchTossMoves.captainA + state.matchTossMoves.captainB;
      const winnerTeam = (sum % 2 !== 0) 
        ? (state.matchTossAssignment.odd === state.captains.teamA ? 'teamA' : 'teamB')
        : (state.matchTossAssignment.even === state.captains.teamA ? 'teamA' : 'teamB');

      update(ref(db), {
        [path('matchToss/winner')]: winnerTeam,
        [path('meta/status')]: 'MP_MATCH_TOSS_RESULT'
      });
    }

    // 4. MATCH CLASH (Both selected moves)
    if (state.phase === 'MP_RESOLVE_MOVE' && state.lockedMoves.batterMove != null && state.lockedMoves.bowlerMove != null && state.resultMeta === null) {
      // Just waiting for timeout to reset in the action right now, but UI does timeout locally then dispatches.
      // Wait, we need the host to actually process the resolution when "MP_PROCESS_RESOLUTION" is dispatched by UI.
      // So no auto-resolve here, let the UI trigger it to show the OUT animation.
    }

    if (state.phase === 'MP_MATCH' && state.lockedMoves.batterMove != null && state.lockedMoves.bowlerMove != null) {
      update(ref(db), {
        [path('meta/status')]: 'MP_RESOLVE_MOVE',
      });
    }

    if (
      state.phase === 'MP_SUPER_OVER' &&
      state.superOver?.lockedMoves?.batterMove != null &&
      state.superOver?.lockedMoves?.bowlerMove != null
    ) {
      update(ref(db), {
        [path('meta/status')]: 'MP_RESOLVE_SO',
      });
    }

  }, [isHost, roomState, state, path]);


  // -- Dispatch Adapter --
  const dispatch = useCallback((action) => {
    switch (action.type) {
      // GATEWAY
      case 'MP_OPEN_GATEWAY': {
        setLocalState(s => ({ ...s, phase: 'MP_MENU' }));
        break;
      }
      case 'MP_CREATE_ROOM': {
        const rc = generateRoomCode();
        const playerName = action.payload?.name || 'Player 1';
        setLocalState(s => ({ ...s, roomCode: rc, phase: 'MP_CREATE_SETTINGS', notice: null }));
        
        set(ref(db, `rooms/${rc}`), {
          meta: { hostId: localState.userId, createdAt: Date.now(), status: 'MP_CREATE_SETTINGS' },
          settings: defaultSettings,
          players: {
            [localState.userId]: {
              id: localState.userId, name: playerName, emoji: getPlayerEmojiForId(localState.userId), isBot: false, isReady: true, isOnline: true
            }
          }
        });
        break;
      }
      case 'MP_JOIN_ROOM': {
        const name = action.payload?.name;
        const code = action.payload.code.toUpperCase();
        get(ref(db, `rooms/${code}`)).then((snapshot) => {
          if (!snapshot.exists()) {
            setLocalState(s => ({ ...s, roomCode: '', notice: `Room ${code} does not exist. Please check the code.` }));
            return;
          }
          const val = snapshot.val();
          const currentPlayers = val.players ? Object.keys(val.players).length : 0;
          const maxPlayers = val.settings?.maxPlayers || 22;
          if (currentPlayers >= maxPlayers && !val.players?.[localState.userId]) {
            setLocalState(s => ({ ...s, roomCode: '', notice: `Room ${code} is full (${currentPlayers}/${maxPlayers}).` }));
            return;
          }
          setLocalState(s => ({ ...s, roomCode: code, notice: null }));
          update(ref(db), {
            [`rooms/${code}/players/${localState.userId}`]: {
              id: localState.userId, name: name || 'Player', emoji: getPlayerEmojiForId(localState.userId), isBot: false, isReady: false, isOnline: true
            }
          });
        }).catch((err) => {
          setLocalState(s => ({ ...s, roomCode: '', notice: `Failed to join room: ${err.message}` }));
        });
        break;
      }
      case 'MP_CONFIRM_SETTINGS': actions.confirmSettings(); break;
      case 'MP_UPDATE_MAX_PLAYERS': actions.updateSettings('maxPlayers', Math.max(2, Math.min(22, action.payload))); break;
      case 'MP_UPDATE_OVERS': actions.updateSettings('oversPerInnings', action.payload); break;
      case 'MP_UPDATE_SERIES': actions.updateSettings('seriesLength', action.payload); break;
      case 'MP_CLEAR_NOTICE':
        setLocalState(s => ({ ...s, roomCode: '', notice: null }));
        break;
      case 'MP_ADD_BOT': actions.addBot(Object.keys(state.players).length); break;
      case 'MP_TOGGLE_READY': actions.toggleReady(!state.players[localState.userId]?.isReady); break;
      case 'MP_REMOVE_PLAYER':
        if (!isHost) break;
        actions.removePlayer(action.payload);
        break;
      case 'MP_START_GAME':
        if (!isHost) break;
        actions.startGame();
        break;
      case 'MP_BEGIN_TOSS':
        if (!isHost || !state.captains.teamA || !state.captains.teamB) break;
        update(ref(db), {
          [path('meta/status')]: 'MP_TOSS',
          [path('toss/assignment')]: { odd: null, even: null },
          [path('toss/moves')]: { captainA: null, captainB: null },
          [path('toss/winner')]: null,
        });
        break;

      // TOSS
      case 'MP_SUBMIT_TOSS_MOVE': actions.submitTossMove(action.payload.who, action.payload.move); break;
      case 'MP_CLAIM_TOSS_SIDE': {
        const { side } = action.payload;
        const team =
          state.currentPlayerId === state.captains.teamA
            ? 'teamA'
            : state.currentPlayerId === state.captains.teamB
              ? 'teamB'
              : null;
        if (!team || !['odd', 'even'].includes(side)) break;

        const captainId = state.captains[team];
        const currentAssignment = { odd: null, even: null, ...state.tossAssignment };
        if (currentAssignment.odd === captainId || currentAssignment.even === captainId) break;

        runTransaction(ref(db, path('toss/assignment')), (assignment) => {
          const nextAssignment = { odd: null, even: null, ...(assignment || {}) };
          if (nextAssignment.odd === captainId || nextAssignment.even === captainId) return;
          if (nextAssignment[side] && nextAssignment[side] !== captainId) return;
          nextAssignment[side] = captainId;
          return nextAssignment;
        });
        break;
      }
      case 'MP_AUTO_ASSIGN_TOSS_SIDE': {
        if (!isHost) break;
        const currentAssignment = { odd: null, even: null, ...state.tossAssignment };
        const remainingSide = getRemainingTossSide(currentAssignment);
        if (!remainingSide) break;
        const assignedCaptainId = currentAssignment.odd || currentAssignment.even;
        const remainingCaptainId =
          assignedCaptainId === state.captains.teamA ? state.captains.teamB : state.captains.teamA;
        if (!remainingCaptainId) break;

        update(ref(db), {
          [path(`toss/assignment/${remainingSide}`)]: remainingCaptainId,
        });
        break;
      }
      case 'MP_ADVANCE_AFTER_TOSS': {
        if (!isHost || !state.tossWinner) break;

        const draftPool = Object.keys(state.players).filter(
          (id) => id !== state.captains.teamA && id !== state.captains.teamB
        );
        const updates = {
          [path('draft/turn')]: state.tossWinner,
          [path('draft/pool')]: draftPool,
        };

        if (draftPool.length === 0) {
          updates[path('meta/status')] = 'MP_MATCH_TOSS';
          updates[path('matchToss/assignment')] = { odd: null, even: null };
          updates[path('matchToss/moves')] = { captainA: null, captainB: null };
          updates[path('matchToss/winner')] = null;
        } else {
          updates[path('meta/status')] = 'MP_DRAFT';
        }

        update(ref(db), updates);
        break;
      }

      // DRAFT
      case 'MP_DRAFT_PICK': {
        const activeCaptainId = state.draftTurn === 'teamA' ? state.captains.teamA : state.captains.teamB;
        const activeCaptain = state.players[activeCaptainId];
        if (!activeCaptainId) break;
        if (activeCaptain?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== activeCaptainId) {
          break;
        }

        const pid = action.payload.playerId;
        const nextTurn = state.draftTurn === 'teamA' ? 'teamB' : 'teamA';
        const newPool = state.draftPool.filter(id => id !== pid);
        const nextRoster = [...state.teams[state.draftTurn].roster, pid];

        update(ref(db), {
          [path(`teams/${state.draftTurn}/roster`)]: nextRoster,
          [path('draft/turn')]: nextTurn,
          [path('draft/pool')]: newPool
        });
        break;
      }
      case 'MP_DRAFT_AUTO_PICK': {
        if (!isHost || state.draftPool.length === 0) break;
        const pid = state.draftPool[Math.floor(Math.random() * state.draftPool.length)];
        const nextTurn = state.draftTurn === 'teamA' ? 'teamB' : 'teamA';
        const newPool = state.draftPool.filter(id => id !== pid);
        const nextRoster = [...state.teams[state.draftTurn].roster, pid];

        update(ref(db), {
          [path(`teams/${state.draftTurn}/roster`)]: nextRoster,
          [path('draft/turn')]: nextTurn,
          [path('draft/pool')]: newPool,
        });
        break;
      }

      // MATCH TOSS
      case 'MP_SUBMIT_MATCH_TOSS': actions.submitMatchTossMove(action.payload.who, action.payload.move); break;
      case 'MP_CLAIM_MATCH_TOSS_SIDE': {
        const { side } = action.payload;
        const team =
          state.currentPlayerId === state.captains.teamA
            ? 'teamA'
            : state.currentPlayerId === state.captains.teamB
              ? 'teamB'
              : null;
        if (!team || !['odd', 'even'].includes(side)) break;

        const captainId = state.captains[team];
        const currentAssignment = { odd: null, even: null, ...state.matchTossAssignment };
        if (currentAssignment.odd === captainId || currentAssignment.even === captainId) break;

        runTransaction(ref(db, path('matchToss/assignment')), (assignment) => {
          const nextAssignment = { odd: null, even: null, ...(assignment || {}) };
          if (nextAssignment.odd === captainId || nextAssignment.even === captainId) return;
          if (nextAssignment[side] && nextAssignment[side] !== captainId) return;
          nextAssignment[side] = captainId;
          return nextAssignment;
        });
        break;
      }
      case 'MP_AUTO_ASSIGN_MATCH_TOSS_SIDE': {
        if (!isHost) break;
        const currentAssignment = { odd: null, even: null, ...state.matchTossAssignment };
        const remainingSide = getRemainingTossSide(currentAssignment);
        if (!remainingSide) break;
        const assignedCaptainId = currentAssignment.odd || currentAssignment.even;
        const remainingCaptainId =
          assignedCaptainId === state.captains.teamA ? state.captains.teamB : state.captains.teamA;
        if (!remainingCaptainId) break;

        update(ref(db), {
          [path(`matchToss/assignment/${remainingSide}`)]: remainingCaptainId,
        });
        break;
      }
      case 'MP_CHOOSE_BAT_BOWL': {
        const winningCaptainId = state.captains[state.matchTossWinner];
        if (!winningCaptainId || state.currentPlayerId !== winningCaptainId) break;

        const choice = action.payload.choice;
        const winner = state.matchTossWinner;
        const loser = winner === 'teamA' ? 'teamB' : 'teamA';
        const batting = choice === 'bat' ? winner : loser;
        const bowling = choice === 'bat' ? loser : winner;

        const stats = {};
        [...state.teams.teamA.roster, ...state.teams.teamB.roster].forEach(id => {
          stats[id] = { runs: 0, ballsFaced: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, dismissals: 0 };
        });

        update(ref(db), {
          [path('meta/status')]: 'MP_PRE_MATCH',
          [path('match/battingTeam')]: batting,
          [path('match/bowlingTeam')]: bowling,
          [path('match/tossChoice')]: choice,
          [path('match/innings')]: 1,
          [path('match/playerStats')]: stats,
          [path('match/lockedMoves')]: { batterMove: null, bowlerMove: null },
          [path('match/score')]: { batting: 0, bowling: 0 },
          [path('match/wickets')]: { batting: 0, bowling: 0 },
          [path('match/ballsBowled')]: 0,
          [path('resultMeta')]: null,
        });
        break;
      }
      case 'MP_ADVANCE_PRE_MATCH': {
        if (!isHost) break;
        update(ref(db), {
          [path('meta/status')]: 'MP_SELECT_BATTER',
        });
        break;
      }
      case 'MP_ADVANCE_PLAYER_INTRO': {
        if (!isHost) break;
        update(ref(db), {
          [path('meta/status')]: 'MP_MATCH',
        });
        break;
      }
      case 'MP_ADVANCE_SUPER_OVER_REVEAL': {
        if (!isHost) break;
        update(ref(db), {
          [path('meta/status')]: 'MP_SUPER_OVER',
        });
        break;
      }

      // SELECT
      case 'MP_SELECT_BATTER': {
        const captainId = state.teams[state.battingTeam]?.captainId;
        const captain = state.players[captainId];
        if (!captainId) break;
        if (captain?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== captainId) {
          break;
        }

        const nextPhase = state.activeBowlerId ? 'MP_PLAYER_INTRO' : 'MP_SELECT_BOWLER';
        update(ref(db), { 
          [path('match/activeBatterId')]: action.payload,
          [path('meta/status')]: nextPhase
        });
        break;
      }
      case 'MP_SELECT_BOWLER': {
        const captainId = state.teams[state.bowlingTeam]?.captainId;
        const captain = state.players[captainId];
        if (!captainId) break;
        if (captain?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== captainId) {
          break;
        }

        update(ref(db), {
          [path('match/activeBowlerId')]: action.payload,
          [path('meta/status')]: 'MP_PLAYER_INTRO'
        });
        break;
      }
      case 'MP_AUTO_SELECT_BATTER': {
        if (!isHost) break;
        const roster = state.teams[state.battingTeam].roster;
        const dismissed = state.ballLog.filter(b => b.isOut).map(b => b.batterId);
        const avail = roster.filter(id => !dismissed.includes(id));
        if (avail.length > 0) {
          const nextPhase = state.activeBowlerId ? 'MP_PLAYER_INTRO' : 'MP_SELECT_BOWLER';
          update(ref(db), {
            [path('match/activeBatterId')]: avail[0],
            [path('meta/status')]: nextPhase,
          });
        }
        break;
      }
      case 'MP_AUTO_SELECT_BOWLER': {
        if (!isHost) break;
        const roster = state.teams[state.bowlingTeam].roster;
        const avail = roster.filter(id => id !== state.lastOverBowlerId || roster.length <= 1);
        if (avail.length > 0) {
          update(ref(db), {
            [path('match/activeBowlerId')]: avail[0],
            [path('meta/status')]: 'MP_PLAYER_INTRO',
          });
        }
        break;
      }

      // MATCH MOVES & RESOLVE
      case 'MP_SUBMIT_MATCH_MOVE': {
        if (state.phase !== 'MP_MATCH') break;
        const { role, move } = action.payload;
        const activePlayerId = role === 'batter' ? state.activeBatterId : state.activeBowlerId;
        const activePlayer = state.players[activePlayerId];
        if (!activePlayerId) break;
        if (activePlayer?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== activePlayerId) {
          break;
        }

        const moveKey = role === 'batter' ? 'batterMove' : 'bowlerMove';
        let updates = { [path(`match/lockedMoves/${moveKey}`)]: move };
        
        // Local Optimistic predict
        const otherKey = role === 'batter' ? state.lockedMoves.bowlerMove : state.lockedMoves.batterMove;
        if (otherKey != null) {
           updates[path('meta/status')] = 'MP_RESOLVE_MOVE';
        }
        update(ref(db), updates);
        break;
      }
      case 'MP_PROCESS_RESOLUTION': {
        if (state.phase !== 'MP_RESOLVE_MOVE') break;
        if (!isHost) break; // Host computes and writes result to prevent dupes
        const { batterMove, bowlerMove } = state.lockedMoves;
        if (batterMove == null || bowlerMove == null) break;
        const isOut = batterMove === bowlerMove;
        const runs = isOut ? 0 : batterMove;
        const newBalls = state.ballsBowled + 1;
        const bTeam = state.battingTeam;

        const newScore = { ...state.score, batting: state.score.batting + runs };
        const newWickets = { ...state.wickets, batting: state.wickets.batting + (isOut ? 1 : 0) };
        const isOverComplete = newBalls % 6 === 0;

        const ballEntry = {
          ballId: `m${state.settings.currentMatch}-i${state.innings}-b${newBalls}`,
          innings: state.innings, ballNumber: newBalls, over: formatOvers(newBalls),
          batterMove, bowlerMove, batterId: state.activeBatterId, bowlerId: state.activeBowlerId,
          runs, isOut, timestamp: Date.now()
        };

        let updates = {
          [path('match/score')]: newScore,
          [path('match/wickets')]: newWickets,
          [path('match/ballsBowled')]: newBalls,
          [path('match/lockedMoves')]: { batterMove: null, bowlerMove: null },
          [path('match/ballLog')]: [...state.ballLog, ballEntry],
          [path('match/currentOverLog')]: [...state.currentOverLog, ballEntry].slice(-6),
        };

        // Stats update
        const stats = { ...state.playerStats };
        if (stats[state.activeBatterId]) {
          stats[state.activeBatterId].runs += runs;
          stats[state.activeBatterId].ballsFaced += 1;
          if (isOut) stats[state.activeBatterId].dismissals += 1;
        }
        if (stats[state.activeBowlerId]) {
          stats[state.activeBowlerId].wickets += (isOut ? 1 : 0);
          stats[state.activeBowlerId].ballsBowled += 1;
          stats[state.activeBowlerId].runsConceded += runs;
        }
        updates[path('match/playerStats')] = stats;

        // Logic check
        const maxWickets = state.teams[bTeam].roster.length;
        const oversLimit = state.settings.oversPerInnings;
        
        let nextPhase = 'MP_MATCH';

        // 2nd innings chased 
        if (state.innings === 2 && state.target !== null && newScore.batting >= state.target) {
            nextPhase = 'MP_MATCH_RESULT';
            const teamScores = getTeamScoreSummary(state, newScore.batting);
            const summary = 'Chased successfully!';
            updates[path('resultMeta')] = { winner: bTeam, summary, ...teamScores };
            const series = buildSeriesState(state, bTeam, teamScores, summary);
            updates[path('series/scores')] = series.nextScores;
            updates[path('series/results')] = series.nextResults;
            updates[path('series/winner')] = series.nextWinner;
        } else if (isOut && newWickets.batting >= maxWickets) {
           if (state.innings === 1) nextPhase = 'MP_INNINGS_BREAK';
           else {
              nextPhase = 'MP_MATCH_RESULT';
              const teamScores = getTeamScoreSummary(state, newScore.batting);
              if (newScore.batting === state.target - 1) {
                updates[path('resultMeta')] = {
                  winner: 'tied',
                  summary: 'Match tied. Super Over coming up.',
                  ...teamScores,
                };
              } else {
                const summary = 'Defended successfully!';
                updates[path('resultMeta')] = { winner: state.bowlingTeam, summary, ...teamScores };
                const series = buildSeriesState(state, state.bowlingTeam, teamScores, summary);
                updates[path('series/scores')] = series.nextScores;
                updates[path('series/results')] = series.nextResults;
                updates[path('series/winner')] = series.nextWinner;
              }
           }
        } else if (oversLimit !== null && newBalls >= oversLimit * 6) {
           if (state.innings === 1) nextPhase = 'MP_INNINGS_BREAK';
           else {
               nextPhase = 'MP_MATCH_RESULT';
               const teamScores = getTeamScoreSummary(state, newScore.batting);
               if (newScore.batting >= state.target) {
                 const summary = 'Chased successfully!';
                 updates[path('resultMeta')] = { winner: bTeam, summary, ...teamScores };
                 const series = buildSeriesState(state, bTeam, teamScores, summary);
                 updates[path('series/scores')] = series.nextScores;
                 updates[path('series/results')] = series.nextResults;
                 updates[path('series/winner')] = series.nextWinner;
               } else if (newScore.batting < state.target - 1) {
                 const summary = 'Defended successfully!';
                 updates[path('resultMeta')] = { winner: state.bowlingTeam, summary, ...teamScores };
                 const series = buildSeriesState(state, state.bowlingTeam, teamScores, summary);
                 updates[path('series/scores')] = series.nextScores;
                 updates[path('series/results')] = series.nextResults;
                 updates[path('series/winner')] = series.nextWinner;
               } else {
                 updates[path('resultMeta')] = {
                   winner: 'tied',
                   summary: 'Match tied. Super Over coming up.',
                   ...teamScores,
                 };
               }
           }
        } else if (isOut) {
           nextPhase = 'MP_SELECT_BATTER';
           updates[path('match/activeBatterId')] = null;
        } else if (isOverComplete) {
           nextPhase = 'MP_SELECT_BOWLER';
           updates[path('match/lastOverBowlerId')] = state.activeBowlerId;
           updates[path('match/activeBowlerId')] = null;
           updates[path('match/currentOverLog')] = [];
        }

        updates[path('meta/status')] = nextPhase;
        update(ref(db), updates);
        break;
      }
      case 'MP_ADVANCE_INNINGS': {
        if (!isHost) break;
        update(ref(db), {
          [path('meta/status')]: 'MP_SELECT_BATTER',
          [path('match/innings')]: 2,
          [path('match/battingTeam')]: state.bowlingTeam,
          [path('match/bowlingTeam')]: state.battingTeam,
          [path('match/score')]: { batting: 0, bowling: state.score.batting },
          [path('match/wickets')]: { batting: 0, bowling: state.wickets.batting },
          [path('match/ballsBowled')]: 0,
          [path('match/lockedMoves')]: { batterMove: null, bowlerMove: null },
          [path('match/currentOverLog')]: [],
          [path('match/activeBatterId')]: null,
          [path('match/activeBowlerId')]: null,
          [path('match/lastOverBowlerId')]: null,
          [path('match/target')]: state.score.batting + 1,
          [path('resultMeta')]: null,
        });
        break;
      }
      case 'MP_NEXT_MATCH': {
        if (!isHost) break;
        if (state.seriesWinner) {
          update(ref(db), { [path('meta/status')]: 'MP_SERIES_RESULT' });
          break;
        }
        update(ref(db), buildNextMatchUpdates(state, path));
        break;
      }
      case 'MP_START_SUPER_OVER': {
        if (!isHost) break;
        const superOverBattingTeam = state.battingTeam ?? 'teamA';

        update(ref(db), {
          [path('meta/status')]: 'MP_SUPER_OVER_SETUP',
          // The team that batted second in the tied match bats first in the Super Over.
          [path('superOver')]: createSuperOverSetupState(superOverBattingTeam),
        });
        break;
      }
      case 'MP_LOCK_SUPER_OVER_SELECTIONS': {
        const { team, batters, bowler } = action.payload;
        const roster = state.teams[team]?.roster ?? [];
        const captainId = state.teams[team]?.captainId;
        const captain = state.players[captainId];
        if (!captainId) break;
        if (!isValidSuperOverSelection(roster, batters, bowler)) break;
        if (captain?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== captainId) {
          break;
        }

        const nextSelections = {
          batters: normalizeSuperOverBatters(roster, batters),
          bowler,
        };
        const nextTeamALocked = team === 'teamA' ? true : state.superOver.teamALocked;
        const nextTeamBLocked = team === 'teamB' ? true : state.superOver.teamBLocked;
        const teamASelections = team === 'teamA' ? nextSelections : state.superOver.teamASelections;
        const teamBSelections = team === 'teamB' ? nextSelections : state.superOver.teamBSelections;
        const updates = {
          [path(`superOver/${team}Selections`)]: nextSelections,
          [path(`superOver/${team === 'teamA' ? 'teamALocked' : 'teamBLocked'}`)]: true,
        };

        if (nextTeamALocked && nextTeamBLocked) {
          const superOverBattingTeam = state.superOver.battingTeam ?? state.battingTeam ?? 'teamA';
          const superOverBowlingTeam =
            state.superOver.bowlingTeam && state.superOver.bowlingTeam !== superOverBattingTeam
              ? state.superOver.bowlingTeam
              : getOppositeTeam(superOverBattingTeam);
          const battingSelections =
            superOverBattingTeam === 'teamA' ? teamASelections : teamBSelections;
          const bowlingSelections =
            superOverBowlingTeam === 'teamA' ? teamASelections : teamBSelections;

          updates[path('superOver/innings')] = 1;
          updates[path('superOver/battingTeam')] = superOverBattingTeam;
          updates[path('superOver/bowlingTeam')] = superOverBowlingTeam;
          updates[path('superOver/activeBatterId')] = battingSelections.batters[0] ?? null;
          updates[path('superOver/activeBowlerId')] = bowlingSelections.bowler ?? null;
          updates[path('superOver/currentBatterIndex')] = 0;
          updates[path('superOver/score')] = { teamA: 0, teamB: 0 };
          updates[path('superOver/wickets')] = { teamA: 0, teamB: 0 };
          updates[path('superOver/ballsBowled')] = 0;
          updates[path('superOver/ballLog')] = [];
          updates[path('superOver/lockedMoves')] = EMPTY_LOCKED_MOVES;
          updates[path('superOver/target')] = null;
          updates[path('meta/status')] = 'MP_SUPER_OVER_REVEAL';
        }

        update(ref(db), updates);
        break;
      }
      case 'MP_SUBMIT_SO_MOVE': {
        const { role, move } = action.payload;
        const activePlayerId = role === 'batter' ? state.superOver.activeBatterId : state.superOver.activeBowlerId;
        const activePlayer = state.players[activePlayerId];
        if (!activePlayerId) break;
        if (activePlayer?.isBot) {
          if (!isHost) break;
        } else if (state.currentPlayerId !== activePlayerId) {
          break;
        }

        const moveKey = role === 'batter' ? 'batterMove' : 'bowlerMove';
        const otherKey = role === 'batter' ? state.superOver.lockedMoves.bowlerMove : state.superOver.lockedMoves.batterMove;
        const updates = {
          [path(`superOver/lockedMoves/${moveKey}`)]: move,
        };

        if (otherKey != null) {
          updates[path('meta/status')] = 'MP_RESOLVE_SO';
        }

        update(ref(db), updates);
        break;
      }
      case 'MP_PROCESS_SO_RESOLUTION': {
        if (!isHost) break;

        const { superOver } = state;
        const { batterMove, bowlerMove } = superOver.lockedMoves;
        if (batterMove == null || bowlerMove == null) break;
        const isOut = batterMove === bowlerMove;
        const runs = isOut ? 0 : batterMove;
        const newBalls = superOver.ballsBowled + 1;
        const battingTeam = superOver.battingTeam;
        const bowlingTeam = superOver.bowlingTeam;
        const battingSelections = superOver[`${battingTeam}Selections`];
        const newScore = {
          ...superOver.score,
          [battingTeam]: (superOver.score[battingTeam] ?? 0) + runs,
        };
        const newWickets = {
          ...superOver.wickets,
          [battingTeam]: (superOver.wickets[battingTeam] ?? 0) + (isOut ? 1 : 0),
        };
        const nextBatterIndex = isOut ? superOver.currentBatterIndex + 1 : superOver.currentBatterIndex;
        const nextBatterId = battingSelections.batters[nextBatterIndex] ?? null;
        const inningsOver =
          newWickets[battingTeam] >= battingSelections.batters.length ||
          newBalls >= SUPER_OVER_BALLS;

        const ballEntry = {
          ballId: `so-i${superOver.innings}-b${newBalls}`,
          innings: superOver.innings,
          ballNumber: newBalls,
          over: formatOvers(newBalls),
          batterMove,
          bowlerMove,
          batterId: superOver.activeBatterId,
          bowlerId: superOver.activeBowlerId,
          runs,
          isOut,
          timestamp: Date.now(),
        };

        const updates = {
          [path('superOver/score')]: newScore,
          [path('superOver/wickets')]: newWickets,
          [path('superOver/ballsBowled')]: newBalls,
          [path('superOver/lockedMoves')]: EMPTY_LOCKED_MOVES,
          [path('superOver/ballLog')]: [...superOver.ballLog, ballEntry],
        };

        if (superOver.innings === 2 && superOver.target !== null && newScore[battingTeam] >= superOver.target) {
          const winner = battingTeam;
          const summary = `${winner === 'teamA' ? 'Team A' : 'Team B'} wins the Super Over.`;
          const teamScores = { teamAScore: newScore.teamA, teamBScore: newScore.teamB };
          const series = buildSeriesState(state, winner, teamScores, summary);

          updates[path('resultMeta')] = { winner, summary, ...teamScores };
          updates[path('series/scores')] = series.nextScores;
          updates[path('series/results')] = series.nextResults;
          updates[path('series/winner')] = series.nextWinner;
          updates[path('meta/status')] = 'MP_SUPER_OVER_RESULT';

          update(ref(db), updates);
          break;
        }

        if (inningsOver) {
          if (superOver.innings === 1) {
            updates[path('superOver/innings')] = 2;
            updates[path('superOver/battingTeam')] = bowlingTeam;
            updates[path('superOver/bowlingTeam')] = battingTeam;
            updates[path('superOver/activeBatterId')] = superOver[`${bowlingTeam}Selections`].batters[0] ?? null;
            updates[path('superOver/activeBowlerId')] = superOver[`${battingTeam}Selections`].bowler ?? null;
            updates[path('superOver/currentBatterIndex')] = 0;
            updates[path('superOver/ballsBowled')] = 0;
            updates[path('superOver/target')] = newScore[battingTeam] + 1;
            updates[path('meta/status')] = 'MP_SUPER_OVER';
          } else {
            if (newScore.teamA === newScore.teamB) {
              const initialBattingTeam = superOver.initialBattingTeam ?? superOver.bowlingTeam ?? 'teamA';
              updates[path('superOver')] = createSuperOverSetupState(initialBattingTeam, superOver);
              updates[path('meta/status')] = 'MP_SUPER_OVER_SETUP';
            } else {
              const winner = newScore.teamA > newScore.teamB ? 'teamA' : 'teamB';
              const summary = `${winner === 'teamA' ? 'Team A' : 'Team B'} wins the Super Over.`;
              const teamScores = { teamAScore: newScore.teamA, teamBScore: newScore.teamB };
              const series = buildSeriesState(state, winner, teamScores, summary);

              updates[path('resultMeta')] = { winner, summary, ...teamScores };
              updates[path('series/scores')] = series.nextScores;
              updates[path('series/results')] = series.nextResults;
              updates[path('series/winner')] = series.nextWinner;
              updates[path('meta/status')] = 'MP_SUPER_OVER_RESULT';
            }
          }
        } else {
          updates[path('superOver/currentBatterIndex')] = nextBatterIndex;
          updates[path('superOver/activeBatterId')] = nextBatterId;
          updates[path('meta/status')] = 'MP_SUPER_OVER';
        }

        update(ref(db), updates);
        break;
      }
      case 'MP_FORFEIT_MATCH': {
        if (!['MP_SUPER_OVER_SETUP', 'MP_SUPER_OVER_REVEAL', 'MP_SUPER_OVER', 'MP_RESOLVE_SO'].includes(state.phase)) break;

        const forfeitingTeam =
          state.currentPlayerId === state.captains.teamA
            ? 'teamA'
            : state.currentPlayerId === state.captains.teamB
              ? 'teamB'
              : null;
        if (!forfeitingTeam) break;

        const winner = getOppositeTeam(forfeitingTeam);
        const teamScores = {
          teamAScore: state.superOver?.score?.teamA ?? 0,
          teamBScore: state.superOver?.score?.teamB ?? 0,
        };
        const summary = `${forfeitingTeam === 'teamA' ? 'Team A' : 'Team B'} forfeited the match. ${winner === 'teamA' ? 'Team A' : 'Team B'} wins.`;
        const series = buildSeriesState(state, winner, teamScores, summary);

        update(ref(db), {
          [path('resultMeta')]: { winner, summary, ...teamScores },
          [path('series/scores')]: series.nextScores,
          [path('series/results')]: series.nextResults,
          [path('series/winner')]: series.nextWinner,
          [path('meta/status')]: 'MP_SUPER_OVER_RESULT',
        });
        break;
      }
      case 'MP_FINISH_SUPER_OVER': {
        if (!isHost) break;
        if (state.seriesWinner) {
          update(ref(db), { [path('meta/status')]: 'MP_SERIES_RESULT' });
          break;
        }
        update(ref(db), buildNextMatchUpdates(state, path));
        break;
      }

      // RESET
      case 'MP_RESET':
        if (!isHost) break;
        update(ref(db), buildSeriesResetUpdates(state, path));
        break;
      case 'MP_LEAVE_ROOM': {
        if (!localState.roomCode) {
          setLocalState(s => ({ ...s, roomCode: '', phase: 'MP_GATEWAY', notice: null }));
          break;
        }

        const currentId = localState.userId;
        const remainingIds = Object.keys(state.players || {}).filter((id) => id !== currentId);

        if (remainingIds.length === 0) {
          remove(ref(db, `rooms/${localState.roomCode}`));
        } else if (state.hostId === currentId) {
          const nextHostId = remainingIds.find((id) => !state.players[id]?.isBot) ?? remainingIds[0];
          update(ref(db), {
            [path(`players/${currentId}`)]: null,
            [path('meta/hostId')]: nextHostId,
          });
        } else {
          update(ref(db), {
            [path(`players/${currentId}`)]: null,
          });
        }

        setLocalState(s => ({ ...s, roomCode: '', phase: 'MP_GATEWAY', notice: null }));
        break;
      }
      case 'MP_BACK_TO_GATEWAY':
        setLocalState(s => ({ ...s, roomCode: '', phase: 'MP_GATEWAY', notice: null }));
        break;
      case 'MP_SEND_TEAM_CHAT': {
        const rawMessage = action.payload?.message ?? '';
        const message = rawMessage.trim();
        if (!message) break;

        const senderId = state.currentPlayerId;
        const sender = state.players[senderId];
        const team = getPlayerTeam(state, senderId);
        if (!senderId || !sender || sender.isBot || !team) break;

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set(ref(db, path(`chat/messages/${messageId}`)), {
          id: messageId,
          team,
          senderId,
          senderName: sender.name,
          text: message.slice(0, 240),
          createdAt: Date.now(),
        });
        break;
      }
      
      default:
        console.warn('Unhandled MP Action:', action.type);
    }
  }, [state, localState, actions, path, isHost]);

  return (
    <MultiplayerContext.Provider value={{ state, dispatch }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  return context;
}
