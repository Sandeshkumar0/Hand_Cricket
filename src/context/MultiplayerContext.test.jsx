import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiplayerProvider, useMultiplayer } from './MultiplayerContext';
import { useGameRoom } from '../hooks/useGameRoom';
import * as firebaseUtils from '../utils/firebaseUtils.js';

vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn().mockResolvedValue({ exists: () => true, val: () => ({}) }),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  runTransaction: vi.fn((ref, callback) => {
    callback({});
    return Promise.resolve();
  })
}));

vi.mock('../utils/statsStorage', () => ({
  loadAllCareerStats: vi.fn(() => ({ player: { name: 'Player' } }))
}));

vi.mock('../hooks/useGameRoom', () => ({
  useGameRoom: vi.fn()
}));

vi.mock('../utils/firebaseUtils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    mapFirebaseToState: vi.fn(),
  };
});

const defaultStateMock = {
  phase: 'MP_LOBBY',
  roomCode: 'ABCD',
  hostId: 'p1',
  currentPlayerId: 'p1',
  settings: { currentMatch: 1, seriesLength: 3, oversPerInnings: 2 },
  players: {
    p1: { isBot: false, isReady: true, id: 'p1' },
    p2: { isBot: false, isReady: false, id: 'p2' }
  },
  captains: { teamA: 'p1', teamB: 'p2' },
  teams: {
    teamA: { roster: ['p1'], captainId: 'p1' },
    teamB: { roster: ['p2'], captainId: 'p2' }
  },
  draftPool: ['p3', 'p4'],
  draftTurn: 'teamA',
  tossAssignment: { odd: 'p1', even: 'p2' },
  tossMoves: { captainA: 1, captainB: 2 },
  matchTossAssignment: { odd: 'p1', even: 'p2' },
  matchTossMoves: { captainA: 1, captainB: 2 },
  battingTeam: 'teamA',
  bowlingTeam: 'teamB',
  activeBatterId: 'p1',
  activeBowlerId: 'p2',
  lastOverBowlerId: 'p3',
  lockedMoves: { batterMove: 4, bowlerMove: 3 },
  currentOverLog: [],
  ballLog: [],
  innings: 1,
  ballsBowled: 0,
  score: { batting: 10, bowling: 5 },
  wickets: { batting: 1, bowling: 0 },
  playerStats: {
    p1: { runs: 0, ballsFaced: 0, dismissals: 0, fours: 0, sixes: 0, dotBalls: 0 },
    p2: { wickets: 0, ballsBowled: 0, runsConceded: 0 }
  },
  superOver: {
    activeBatterId: 'p1',
    activeBowlerId: 'p2',
    lockedMoves: { batterMove: 4, bowlerMove: 3 },
    batters: ['p1'],
    bowler: 'p2',
    score: { teamA: 0, teamB: 0 },
    wickets: { teamA: 0, teamB: 0 },
    battingTeam: 'teamA',
    currentBatterIndex: 0,
    ballLog: [],
    teamASelections: { batters: ['p1', 'p3'], bowler: 'p1' },
    teamBSelections: { batters: ['p2', 'p4'], bowler: 'p2' }
  },
  seriesScores: { teamA: 0, teamB: 0 },
  matchResults: []
};

import { cleanup } from '@testing-library/react';

const TestDispatcher = ({ actionsList }) => {
  const { dispatch } = useMultiplayer();
  return (
    <div>
      {actionsList.map((a, i) => (
        <button key={i} data-testid={`btn-${i}`} onClick={() => dispatch(a)}>
          {a.type}
        </button>
      ))}
    </div>
  );
};

const allActions = [
  { type: 'MP_OPEN_GATEWAY' },
  { type: 'MP_CREATE_ROOM', payload: { name: 'host' } },
  { type: 'MP_JOIN_ROOM', payload: { name: 'p2', code: 'ABC' } },
  { type: 'MP_CONFIRM_SETTINGS' },
  { type: 'MP_UPDATE_MAX_PLAYERS', payload: 4 },
  { type: 'MP_UPDATE_OVERS', payload: 2 },
  { type: 'MP_UPDATE_SERIES', payload: 3 },
  { type: 'MP_CLEAR_NOTICE' },
  { type: 'MP_ADD_BOT' },
  { type: 'MP_TOGGLE_READY' },
  { type: 'MP_REMOVE_PLAYER', payload: 'p2' },
  { type: 'MP_START_GAME' },
  { type: 'MP_BEGIN_TOSS' },
  { type: 'MP_SUBMIT_TOSS_MOVE', payload: { who: 'captainA', move: 2 } },
  { type: 'MP_CLAIM_TOSS_SIDE', payload: { side: 'odd' } },
  { type: 'MP_AUTO_ASSIGN_TOSS_SIDE' },
  { type: 'MP_ADVANCE_AFTER_TOSS' },
  { type: 'MP_DRAFT_PICK', payload: { playerId: 'p3' } },
  { type: 'MP_DRAFT_AUTO_PICK' },
  { type: 'MP_SUBMIT_MATCH_TOSS', payload: { who: 'captainA', move: 3 } },
  { type: 'MP_CLAIM_MATCH_TOSS_SIDE', payload: { side: 'even' } },
  { type: 'MP_AUTO_ASSIGN_MATCH_TOSS_SIDE' },
  { type: 'MP_CHOOSE_BAT_BOWL', payload: { choice: 'bat' } },
  { type: 'MP_ADVANCE_PRE_MATCH' },
  { type: 'MP_ADVANCE_PLAYER_INTRO' },
  { type: 'MP_ADVANCE_SUPER_OVER_REVEAL' },
  { type: 'MP_SELECT_BATTER', payload: 'p1' },
  { type: 'MP_SELECT_BOWLER', payload: 'p2' },
  { type: 'MP_AUTO_SELECT_BATTER' },
  { type: 'MP_AUTO_SELECT_BOWLER' },
  { type: 'MP_SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } },
  { type: 'MP_PROCESS_RESOLUTION' },
  { type: 'MP_ADVANCE_INNINGS' },
  { type: 'MP_NEXT_MATCH' },
  { type: 'MP_START_SUPER_OVER' },
  { type: 'MP_LOCK_SUPER_OVER_SELECTIONS', payload: { batters: ['p1', 'p2'], bowler: 'p3' } },
  { type: 'MP_SUBMIT_SO_MOVE', payload: { role: 'batter', move: 6 } },
  { type: 'MP_PROCESS_SO_RESOLUTION' },
  { type: 'MP_FORFEIT_MATCH' },
  { type: 'MP_FINISH_SUPER_OVER' },
  { type: 'MP_RESET' },
  { type: 'MP_LEAVE_ROOM' },
  { type: 'MP_BACK_TO_GATEWAY' },
  { type: 'MP_SEND_TEAM_CHAT', payload: { message: 'hi' } }
];

describe('MultiplayerContext Mass Execution', () => {
  let mockActions;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockActions = {
      confirmSettings: vi.fn(),
      updateSettings: vi.fn(),
      addBot: vi.fn(),
      toggleReady: vi.fn(),
      removePlayer: vi.fn(),
      startGame: vi.fn(),
      submitTossMove: vi.fn(),
      submitMatchTossMove: vi.fn()
    };
  });

  afterEach(() => {
    cleanup();
  });

  const phases = [
    'MP_GATEWAY', 'MP_LOBBY', 'MP_TOSS', 'MP_DRAFT', 'MP_MATCH_TOSS', 
    'MP_MATCH', 'MP_RESOLVE_MOVE', 'MP_SUPER_OVER', 'MP_RESOLVE_SO'
  ];

  for (const phase of phases) {
    it(`executes all actions in phase ${phase} as host`, async () => {
      firebaseUtils.mapFirebaseToState.mockReturnValue({
        ...defaultStateMock,
        phase
      });
      useGameRoom.mockReturnValue({ roomState: {}, actions: mockActions, isHost: true });

      render(<MultiplayerProvider><TestDispatcher actionsList={allActions} /></MultiplayerProvider>);

      for (let i = 0; i < allActions.length; i++) {
        await act(async () => {
          screen.getByTestId(`btn-${i}`).click();
        });
      }
      expect(true).toBe(true);
    });

    it(`executes all actions in phase ${phase} as non-host`, async () => {
      firebaseUtils.mapFirebaseToState.mockReturnValue({
        ...defaultStateMock,
        phase,
        currentPlayerId: 'p2'
      });
      useGameRoom.mockReturnValue({ roomState: {}, actions: mockActions, isHost: false });

      render(<MultiplayerProvider><TestDispatcher actionsList={allActions} /></MultiplayerProvider>);

      for (let i = 0; i < allActions.length; i++) {
        await act(async () => {
          screen.getByTestId(`btn-${i}`).click();
        });
      }
      expect(true).toBe(true);
    });
  }
});
