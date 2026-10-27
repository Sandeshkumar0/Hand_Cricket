import { describe, it, expect } from 'vitest';
import {
  OVER_OPTIONS,
  SERIES_OPTIONS,
  DRAFT_TIMER,
  SELECTION_TIMER,
  SUPER_OVER_BALLS,
  EMOJIS,
  generateRoomCode,
  generatePlayerId,
  generateBotId,
  getPlayerEmojiForId,
  formatOvers,
  createPlayerStats,
  createMatchState,
  createSuperOverState,
  defaultSettings,
  mapFirebaseToState,
} from './firebaseUtils';

describe('firebaseUtils', () => {
  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(OVER_OPTIONS).toEqual([1, 2, 5, 10, 20, 50, null]);
      expect(SERIES_OPTIONS).toEqual([1, 3, 5]);
      expect(DRAFT_TIMER).toBe(15);
      expect(SELECTION_TIMER).toBe(15);
      expect(SUPER_OVER_BALLS).toBe(6);
      expect(EMOJIS).toEqual(['bat', 'ball']);
    });
  });

  describe('ID Generators', () => {
    it('should generate a 4-character room code', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(4);
      expect(typeof code).toBe('string');
      // Should only contain valid characters
      expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/.test(code)).toBe(true);
    });

    it('should generate unique player IDs', () => {
      const id1 = generatePlayerId();
      const id2 = generatePlayerId();
      expect(id1).toMatch(/^p_\d+_[a-z0-9]{4}$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique bot IDs', () => {
      const id1 = generateBotId();
      const id2 = generateBotId();
      expect(id1).toMatch(/^bot_\d+_[a-z0-9]{4}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getPlayerEmojiForId', () => {
    it('should consistently return an emoji for a given ID', () => {
      const emoji1 = getPlayerEmojiForId('player_1');
      const emoji2 = getPlayerEmojiForId('player_1');
      expect(emoji1).toBe(emoji2);
      expect(EMOJIS).toContain(emoji1);
    });

    it('should handle undefined or empty string', () => {
      expect(EMOJIS).toContain(getPlayerEmojiForId());
      expect(EMOJIS).toContain(getPlayerEmojiForId(''));
    });
  });

  describe('formatOvers', () => {
    it('should format balls into overs correctly', () => {
      expect(formatOvers(0)).toBe('0.0');
      expect(formatOvers(5)).toBe('0.5');
      expect(formatOvers(6)).toBe('1.0');
      expect(formatOvers(7)).toBe('1.1');
      expect(formatOvers(12)).toBe('2.0');
    });
  });

  describe('State Creators', () => {
    it('should create default player stats', () => {
      const stats = createPlayerStats();
      expect(stats).toEqual({
        runs: 0,
        ballsFaced: 0,
        wickets: 0,
        ballsBowled: 0,
        runsConceded: 0,
        dismissals: 0,
      });
    });

    it('should create default match state', () => {
      const state = createMatchState();
      expect(state.battingTeam).toBeNull();
      expect(state.innings).toBe(1);
      expect(state.score).toEqual({ batting: 0, bowling: 0 });
      expect(state.currentOverLog).toEqual([]);
    });

    it('should create default super over state', () => {
      const state = createSuperOverState();
      expect(state.sequence).toBe(1);
      expect(state.teamASelections.batters).toEqual([]);
      expect(state.teamBSelections.batters).toEqual([]);
      expect(state.score).toEqual({ teamA: 0, teamB: 0 });
    });
  });

  describe('mapFirebaseToState', () => {
    it('should return null if firebase object is missing or has no meta', () => {
      expect(mapFirebaseToState(null, {})).toBeNull();
      expect(mapFirebaseToState({}, {})).toBeNull();
      expect(mapFirebaseToState({ meta: null }, {})).toBeNull();
    });

    it('should map flat firebase data to structured state', () => {
      const localState = {
        roomCode: 'ABCD',
        userId: 'p1',
        notice: 'test notice',
      };
      const fbData = {
        meta: {
          status: 'playing',
          hostId: 'p1',
        },
        players: { p1: { name: 'Player 1' } },
        teams: {
          teamA: { id: 'teamA' }, // missing roster
        },
        matchToss: {
          moves: { captainA: 'heads' },
        },
        // missing superOver, match, series etc to test fallbacks
      };

      const result = mapFirebaseToState(fbData, localState);
      
      expect(result.phase).toBe('playing');
      expect(result.roomCode).toBe('ABCD');
      expect(result.hostId).toBe('p1');
      expect(result.currentPlayerId).toBe('p1');
      expect(result.notice).toBe('test notice');
      
      expect(result.players).toEqual({ p1: { name: 'Player 1' } });
      
      expect(result.teams.teamA).toEqual({ id: 'teamA', roster: [] }); // fallback roster added
      expect(result.teams.teamB).toBeNull(); // fallback when teamB missing
      
      expect(result.matchTossMoves).toEqual({ captainA: 'heads', captainB: null });
      
      expect(result.settings).toEqual(defaultSettings);
      
      // Test match state fallback
      expect(result.innings).toBe(1);
      expect(result.score).toEqual({ batting: 0, bowling: 0 });
      
      // Test super over fallback
      expect(result.superOver.sequence).toBe(1);
      expect(result.superOver.teamASelections.batters).toEqual([]);
      
      // Test arrays fallbacks
      expect(result.chatMessages).toEqual([]);
      expect(result.currentOverLog).toEqual([]);
      expect(result.draftPool).toEqual([]);
    });
    
    it('should sort chat messages by createdAt', () => {
      const fbData = {
        meta: { status: 'waiting' },
        chat: {
          messages: {
            msg2: { text: 'Second', createdAt: 200 },
            msg1: { text: 'First', createdAt: 100 },
            msg3: { text: 'Third' }, // missing createdAt, should be 0
          }
        }
      };
      
      const result = mapFirebaseToState(fbData, {});
      expect(result.chatMessages[0].text).toBe('Third');
      expect(result.chatMessages[1].text).toBe('First');
      expect(result.chatMessages[2].text).toBe('Second');
    });

    it('should properly map existing superOver and match data with missing nested properties', () => {
      const fbData = {
        meta: { status: 'playing' },
        teams: {
          teamB: { id: 'teamB' } // missing roster
        },
        match: {
          innings: 2,
          // score is missing
          wickets: null
        },
        chat: {
          messages: {
            msg1: { text: 'no time' },
            msg2: { text: 'also no time' }
          }
        },
        superOver: {
          // sequence missing
          // initialBattingTeam missing
          teamASelections: null, // missing batters/bowlers
          teamBSelections: { batters: null },
          score: { teamA: 15, teamB: 10 },
          lockedMoves: { batterMove: 'left' }
        },
        series: {
          // scores missing
          // results missing
          winner: 'teamA'
        }
      };

      const result = mapFirebaseToState(fbData, {});
      expect(result.innings).toBe(2);
      expect(result.score).toEqual({ batting: 0, bowling: 0 }); // fallback
      expect(result.superOver.sequence).toBe(1); // fallback
      expect(result.superOver.initialBattingTeam).toBeNull(); // fallback
      expect(result.superOver.score.teamA).toBe(15);
      expect(result.superOver.lockedMoves).toEqual({ batterMove: 'left', bowlerMove: null });
      expect(result.superOver.teamASelections.batters).toEqual([]);
      expect(result.superOver.teamBSelections.batters).toEqual([]);
      expect(result.teams.teamB).toEqual({ id: 'teamB', roster: [] }); // fallback
      expect(result.seriesScores).toEqual({ teamA: 0, teamB: 0 }); // fallback
      expect(result.matchResults).toEqual([]); // fallback
      expect(result.seriesWinner).toBe('teamA');
    });

    it('should properly map existing superOver and match data when nested properties are explicitly null', () => {
      const fbData = {
        meta: { status: 'playing' },
        match: {
          score: null,
          wickets: null
        },
        superOver: {
          lockedMoves: null,
          score: null,
          wickets: null,
          ballLog: null,
          teamASelections: null,
          teamBSelections: null
        }
      };

      const result = mapFirebaseToState(fbData, {});
      expect(result.score).toEqual({ batting: 0, bowling: 0 });
      expect(result.wickets).toEqual({ batting: 0, bowling: 0 });
      expect(result.superOver.lockedMoves).toEqual({ batterMove: null, bowlerMove: null });
      expect(result.superOver.score).toEqual({ teamA: 0, teamB: 0 });
      expect(result.superOver.wickets).toEqual({ teamA: 0, teamB: 0 });
      expect(result.superOver.ballLog).toEqual([]);
      expect(result.superOver.teamASelections).toEqual({ batters: [], bowler: null });
      expect(result.superOver.teamBSelections).toEqual({ batters: [], bowler: null });
    });
  });
});
