import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordMove, getPatternPrediction, getBotStats, recordMatchResult } from './botDB.js';
import { get, push, ref, runTransaction, set, update } from 'firebase/database';

vi.mock('firebase/database', () => ({
  get: vi.fn(),
  push: vi.fn(() => ({ key: 'mock-key' })),
  ref: vi.fn((db, path) => path),
  runTransaction: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../firebase.js', () => ({
  db: {}
}));

describe('botDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordMove', () => {
    it('should record a move and update patterns and stats', async () => {
      runTransaction.mockImplementation(async (ref, callback) => {
        const next = callback(null);
        return { snapshot: { val: () => next } };
      });
      
      const payload = {
        playerMove: '3',
        botRole: 'batter',
        runs: 4,
        botInningsScore: 12,
        context: { key: 'i1|r2|o3|pna|w0|recent:1-2-3' }
      };

      await recordMove(payload);

      expect(push).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(runTransaction).toHaveBeenCalledTimes(2);
    });

    it('should cover existing data in transactions', async () => {
      runTransaction.mockImplementation(async (ref, callback) => {
        if (ref.includes('patterns')) {
          callback({ total: 5, lastUpdated: 1000, frequencies: { '3': 2 } });
        } else if (ref.includes('stats')) {
          callback({ movesRecorded: 10, recentMoves: [] });
        }
      });
      
      const payload = {
        playerMove: '3',
        botRole: 'bowler',
        isOut: true,
        context: { key: 'some-key' }
      };

      await recordMove(payload);
    });
    
    it('should cover batter isOut', async () => {
      runTransaction.mockImplementation(async (ref, callback) => callback(null));
      await recordMove({ botRole: 'batter', isOut: true });
    });

    it('should handle stats with missing optional properties', async () => {
      runTransaction.mockImplementation(async (ref, callback) => {
        if (ref.includes('stats')) {
          callback({ movesRecorded: 1 }); // Missing recentMoves, highestScore
        } else {
          callback(null);
        }
      });
      await recordMove({ botRole: 'batter', botInningsScore: 50 });
    });

    it('should handle errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      push.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      await recordMove({});
      expect(consoleError).toHaveBeenCalledWith('Failed to record bot move', expect.any(Error));
    });
  });

  describe('getPatternPrediction', () => {
    it('should return data if snapshot exists', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ total: 10 }) });
      const result = await getPatternPrediction('testKey');
      expect(result).toEqual({ total: 10 });
    });

    it('should return null if snapshot does not exist', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const result = await getPatternPrediction('testKey');
      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      get.mockRejectedValueOnce(new Error('DB Error'));
      const result = await getPatternPrediction('testKey');
      expect(result).toBeNull();
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('getBotStats', () => {
    it('should return data if snapshot exists', async () => {
      get.mockResolvedValueOnce({ exists: () => true, val: () => ({ matches: 5 }) });
      const result = await getBotStats();
      expect(result).toEqual({ matches: 5 });
    });

    it('should return default stats if snapshot does not exist', async () => {
      get.mockResolvedValueOnce({ exists: () => false });
      const result = await getBotStats();
      expect(result.matches).toBe(0);
    });

    it('should handle errors and return default stats', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      get.mockRejectedValueOnce(new Error('DB Error'));
      const result = await getBotStats();
      expect(result.matches).toBe(0);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('recordMatchResult', () => {
    it('should record a match result and update stats (botWon)', async () => {
      runTransaction.mockImplementation(async (ref, callback) => callback(null));
      const payload = {
        botWon: true,
        botBattingScore: 50,
        currentMatch: 2,
        seriesLength: 3,
        seriesScoreline: '1-1'
      };

      await recordMatchResult(payload);
      expect(push).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
      expect(runTransaction).toHaveBeenCalled();
      expect(update).toHaveBeenCalled();
    });

    it('should update stats when bot lost and has current stats', async () => {
      runTransaction.mockImplementation(async (ref, callback) => {
        callback({ highestScore: 10, matches: 5, wins: 2, losses: 3 });
      });
      const payload = {
        botWon: false,
        botBowlingConceded: 60
      };

      await recordMatchResult(payload);
    });

    it('should handle stats with missing highestScore in match result', async () => {
      runTransaction.mockImplementation(async (ref, callback) => {
        callback({ matches: 1 }); // Missing highestScore
      });
      await recordMatchResult({ botWon: true, botBattingScore: 100 });
    });

    it('should handle errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      push.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      await recordMatchResult({});
      expect(consoleError).toHaveBeenCalled();
    });
  });
});
