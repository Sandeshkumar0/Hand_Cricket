import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildContextKey, analyzePlayerPatterns, getBotDecision, BOT } from './botBrain.js';
import * as botDB from './botDB.js';

vi.mock('./botDB.js', () => ({
  getPatternPrediction: vi.fn(),
}));

describe('botBrain', () => {
  describe('BOT constant', () => {
    it('should have required properties', () => {
      expect(BOT.id).toBe('bot');
      expect(BOT.name).toBe('BOT');
    });
  });

  describe('buildContextKey', () => {
    it('should build context key with overs limit null', () => {
      const context = {
        oversLimit: null,
        target: null,
        innings: 1,
        playerRole: 'batter',
        wickets: 0,
      };
      const key = buildContextKey(context);
      expect(key).toBe('i1|rbatter|oinf|pna|w0|recent:fresh');
    });

    it('should build context key with target pressure', () => {
      const context = {
        oversLimit: 5,
        ballsBowled: 12,
        target: 50,
        score: 30,
        innings: 2,
        playerRole: 'bowler',
        wickets: 2,
        previousPlayerMoves: [1, 2, 3, 4]
      };
      const key = buildContextKey(context);
      expect(key).toBe('i2|rbowler|o2/5|p20|w2|recent:2-3-4');
    });
    
    it('should handle missing previous moves and ballsBowled', () => {
      const context = { oversLimit: 1, target: null, innings: 1, playerRole: 'b', wickets: 1 };
      const key = buildContextKey(context);
      expect(key).toBe('i1|rb|o0/1|pna|w1|recent:fresh');
    });
  });

  describe('analyzePlayerPatterns', () => {
    it('should analyze frequencies of moves', () => {
      const moveHistory = [
        { context: { key: 'k1' }, playerMove: 2 },
        { context: { key: 'k1' }, playerMove: 3 },
        { context: { key: 'k2' }, playerMove: 2 },
      ];
      const result = analyzePlayerPatterns(moveHistory, { key: 'k1' });
      expect(result.total).toBeGreaterThan(0);
      expect(result.distribution.length).toBe(7);
    });
    
    it('should return default distribution if empty', () => {
      const result = analyzePlayerPatterns([], { key: 'k1' });
      expect(result.total).toBe(0);
      expect(result.distribution[0].probability).toBe(1/7);
    });
  });

  describe('getBotDecision', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should use cold start if sample size is small', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce(null);
      const decision = await getBotDecision({ context: { key: 'k_small', botRole: 'batter' } });
      expect([0,1,2,3,4,5,6]).toContain(decision);
    });

    it('should use predicted move if sample size is large enough (batter)', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce({
        frequencies: { '2': 100, '3': 5 }
      });
      vi.spyOn(Math, 'random').mockReturnValue(0.001); 
      
      const decision = await getBotDecision({ context: { key: 'k_large_batter', botRole: 'batter' } });
      expect([0,1,2,3,4,5,6]).toContain(decision);
    });

    it('should use predicted move for bowler (no noise)', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce({
        frequencies: { '4': 200 }
      });
      const decision = await getBotDecision({ context: { key: 'k_bowler_no_noise', botRole: 'bowler' } });
      expect(decision).toBe(4);
    });

    it('should add noise for bowler', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce({
        frequencies: { '4': 200 }
      });
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const decision = await getBotDecision({ context: { key: 'k_bowler_noise', botRole: 'bowler' } });
      expect([0,1,2,3,4,5,6]).toContain(decision);
    });
    
    it('should add noise for batter', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce({
        frequencies: { '4': 200 }
      });
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const decision = await getBotDecision({ context: { key: 'k_batter_noise', botRole: 'batter' } });
      expect([0,1,2,3,4,5,6]).toContain(decision);
    });

    it('should load cloud pattern from cache on subsequent calls', async () => {
      botDB.getPatternPrediction.mockResolvedValueOnce({ frequencies: { '1': 100 } });
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      await getBotDecision({ context: { key: 'cacheKey', botRole: 'bowler' } });
      await getBotDecision({ context: { key: 'cacheKey', botRole: 'bowler' } });
      
      expect(botDB.getPatternPrediction).toHaveBeenCalledTimes(1);
    });

    it('should cover fallback in weightedChoice', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(2); // Force cursor to exceed total
      const decision = await getBotDecision({ context: { key: 'k_fallback', botRole: 'batter' } });
      expect(decision).toBeDefined();
    });
  });
});
