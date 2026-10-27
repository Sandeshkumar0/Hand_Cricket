import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadAllCareerStats, saveAllCareerStats, updateCareerAfterMatch } from './statsStorage';
import { auth } from '../firebase';
import { ref, set } from 'firebase/database';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
}));

describe('statsStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.currentUser = null;
  });

  describe('loadAllCareerStats', () => {
    it('should load default stats if localStorage is empty', () => {
      const stats = loadAllCareerStats();
      expect(stats.player.id).toBe('player_1');
      expect(stats.bot.id).toBe('bot_1');
      expect(stats.player.matchesPlayed).toBe(0);
    });

    it('should return default stats if localStorage contains invalid JSON', () => {
      localStorage.setItem('hand_cricket_career_stats', 'invalid-json');
      const stats = loadAllCareerStats();
      expect(stats.player.id).toBe('player_1');
      expect(stats.bot.id).toBe('bot_1');
    });

    it('should load parsed stats from localStorage and merge with defaults', () => {
      const savedStats = {
        player: { matchesPlayed: 5, runs: 100 },
        bot: { matchesPlayed: 5, wickets: 10 }
      };
      localStorage.setItem('hand_cricket_career_stats', JSON.stringify(savedStats));
      const stats = loadAllCareerStats();
      expect(stats.player.matchesPlayed).toBe(5);
      expect(stats.player.runs).toBe(100);
      expect(stats.player.id).toBe('player_1'); // default fallback
      expect(stats.bot.matchesPlayed).toBe(5);
      expect(stats.bot.wickets).toBe(10);
    });
  });

  describe('saveAllCareerStats', () => {
    it('should save stats to localStorage', () => {
      const data = { player: { runs: 50 }, bot: { runs: 20 } };
      saveAllCareerStats(data);
      expect(localStorage.getItem('hand_cricket_career_stats')).toEqual(JSON.stringify(data));
    });

    it('should not save to firebase if currentUser is null', () => {
      const data = { player: { runs: 50 }, bot: { runs: 20 } };
      saveAllCareerStats(data);
      expect(set).not.toHaveBeenCalled();
    });

    it('should save to firebase if currentUser exists', () => {
      auth.currentUser = { uid: 'user_123' };
      const data = { player: { runs: 50 }, bot: { runs: 20 } };
      saveAllCareerStats(data);
      expect(ref).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
    });

    it('should handle errors gracefully without crashing', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => { throw new Error('Quota Exceeded'); });
      
      expect(() => {
        saveAllCareerStats({ player: {}, bot: {} });
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('updateCareerAfterMatch', () => {
    it('should update stats correctly when player wins', () => {
      const playerMatchStats = {
        runs: 55,
        ballsFaced: 30,
        fours: 5,
        sixes: 2,
        isNotOut: true,
        fantasyPoints: 60,
        wickets: 2,
        ballsBowled: 12,
        runsConceded: 15,
      };
      const botMatchStats = {
        runs: 40,
        ballsFaced: 20,
        fours: 2,
        sixes: 1,
        fantasyPoints: 30,
        wickets: 0,
        ballsBowled: 30,
        runsConceded: 55,
      };

      const updated = updateCareerAfterMatch({
        playerMatchStats,
        botMatchStats,
        motmWinner: 'player',
        playerWon: true
      });

      // Player checks
      expect(updated.player.matchesPlayed).toBe(1);
      expect(updated.player.wins).toBe(1);
      expect(updated.player.losses).toBe(0);
      expect(updated.player.runs).toBe(55);
      expect(updated.player.highestScore).toBe(55);
      expect(updated.player.fifties).toBe(1);
      expect(updated.player.hundreds).toBe(0);
      expect(updated.player.notOuts).toBe(1);
      expect(updated.player.motmAwards).toBe(1);
      expect(updated.player.oversBowled).toBe(2.0); // 12 balls
      expect(updated.player.bestBowlingWickets).toBe(2);
      expect(updated.player.bestBowlingRuns).toBe(15);
      expect(updated.player.recentForm[0]).toBe('W');

      // Bot checks
      expect(updated.bot.matchesPlayed).toBe(1);
      expect(updated.bot.wins).toBe(0);
      expect(updated.bot.losses).toBe(1);
      expect(updated.bot.runs).toBe(40);
      expect(updated.bot.highestScore).toBe(40);
      expect(updated.bot.fifties).toBe(0);
      expect(updated.bot.notOuts).toBe(0);
      expect(updated.bot.motmAwards).toBe(0);
      expect(updated.bot.recentForm[0]).toBe('L');
    });

    it('should correctly handle hundreds, ducks, and best bowling', () => {
      // First match
      updateCareerAfterMatch({
        playerMatchStats: { runs: 120, wickets: 1, runsConceded: 20 },
        botMatchStats: { runs: 0, ballsFaced: 5, wickets: 3, runsConceded: 15 },
        motmWinner: 'bot',
        playerWon: false
      });

      // Second match (update)
      const updated = updateCareerAfterMatch({
        playerMatchStats: { runs: 0, ballsFaced: 2, wickets: 2, runsConceded: 15 },
        botMatchStats: { runs: 10, wickets: 3, runsConceded: 10 },
        motmWinner: 'bot',
        playerWon: false
      });

      expect(updated.player.hundreds).toBe(1);
      expect(updated.player.ducks).toBe(1);
      expect(updated.player.highestScore).toBe(120);
      
      // Best bowling checks
      // Player: Match 1 -> 1/20, Match 2 -> 2/15 => Best: 2/15
      expect(updated.player.bestBowlingWickets).toBe(2);
      expect(updated.player.bestBowlingRuns).toBe(15);
      
      // Bot: Match 1 -> 3/15, Match 2 -> 3/10 => Best: 3/10
      expect(updated.bot.bestBowlingWickets).toBe(3);
      expect(updated.bot.bestBowlingRuns).toBe(10);
    });

    it('should calculate overs correctly for odd numbers of balls', () => {
      const updated = updateCareerAfterMatch({
        playerMatchStats: { ballsBowled: 15 }, // 2.3 overs
        botMatchStats: {},
        motmWinner: 'player',
        playerWon: true
      });

      // 15 balls / 6 = 2. 15 % 6 = 3. So 2 + 3/6 = 2.5
      expect(updated.player.oversBowled).toBe(2.5);
    });
    
    it('should handle undefined recentForm', () => {
      localStorage.setItem('hand_cricket_career_stats', JSON.stringify({
        player: { recentForm: null },
        bot: { recentForm: null }
      }));
      
      const updated = updateCareerAfterMatch({
        playerMatchStats: {},
        botMatchStats: {},
        motmWinner: 'player',
        playerWon: true
      });
      
      expect(updated.player.recentForm).toEqual(['W']);
      expect(updated.bot.recentForm).toEqual(['L']);
    });
    
    it('should handle undefined values gracefully', () => {
      const updated = updateCareerAfterMatch({
        playerMatchStats: {}, // Completely empty
        botMatchStats: {},
        motmWinner: 'player',
        playerWon: true
      });
      
      expect(updated.player.runs).toBe(0);
      expect(updated.bot.runs).toBe(0);
      expect(updated.player.oversBowled).toBe(0);
    });
  });
});
