import { describe, it, expect } from 'vitest';
import { calculatePlayerPoints, determineManOfTheMatch } from './pointsCalculator';

describe('pointsCalculator', () => {
  describe('calculatePlayerPoints', () => {
    it('should return 0 points for empty stats', () => {
      const stats = {};
      const result = calculatePlayerPoints(stats);
      expect(result.totalPoints).toBe(0);
    });

    it('should calculate batting points correctly', () => {
      const stats = { runs: 20, fours: 2, sixes: 1 };
      // runs: 20*1 = 20
      // fours: 2*1.5 = 3
      // sixes: 1*2.0 = 2
      // total: 25
      const result = calculatePlayerPoints(stats);
      expect(result.battingPoints).toBe(25);
      expect(result.totalPoints).toBe(25);
    });

    it('should add 10 bonus points for >= 50 runs', () => {
      const stats = { runs: 50 };
      // runs: 50 + 10 (bonus)
      const result = calculatePlayerPoints(stats);
      expect(result.battingPoints).toBe(60);
    });

    it('should add 25 bonus points for >= 100 runs (no 50 bonus)', () => {
      const stats = { runs: 100 };
      // runs: 100 + 25 (bonus)
      const result = calculatePlayerPoints(stats);
      expect(result.battingPoints).toBe(125);
    });

    it('should calculate bowling points correctly', () => {
      const stats = { wickets: 2, dotBalls: 5, maidens: 1 };
      // wickets: 2*10 = 20
      // dotBalls: 5*1 = 5
      // maidens: 1*10 = 10
      // total: 35
      const result = calculatePlayerPoints(stats);
      expect(result.bowlingPoints).toBe(35);
      expect(result.totalPoints).toBe(35);
    });

    it('should add 10 bonus points for >= 3 wickets', () => {
      const stats = { wickets: 3 };
      // wickets: 3*10 + 10 (bonus) = 40
      const result = calculatePlayerPoints(stats);
      expect(result.bowlingPoints).toBe(40);
    });

    it('should add 25 bonus points for >= 5 wickets', () => {
      const stats = { wickets: 5 };
      // wickets: 5*10 + 25 (bonus) = 75
      const result = calculatePlayerPoints(stats);
      expect(result.bowlingPoints).toBe(75);
    });

    it('should calculate fielding points correctly', () => {
      const stats = { catches: 2, runOuts: 1, stumpings: 1 };
      // catches: 2*5 = 10
      // runOuts: 1*8 = 8
      // stumpings: 1*8 = 8
      // total: 26
      const result = calculatePlayerPoints(stats);
      expect(result.fieldingPoints).toBe(26);
      expect(result.totalPoints).toBe(26);
    });

    it('should calculate total points and round to 1 decimal place', () => {
      const stats = {
        runs: 35, // 35
        fours: 3, // 4.5
        wickets: 1, // 10
        dotBalls: 2, // 2
        catches: 1, // 5
      };
      // 35 + 4.5 + 10 + 2 + 5 = 56.5
      const result = calculatePlayerPoints(stats);
      expect(result.totalPoints).toBe(56.5);
    });
  });

  describe('determineManOfTheMatch', () => {
    it('should award MOTM to player if player has more points', () => {
      const playerStats = { runs: 100 }; // 125 pts
      const botStats = { runs: 50 }; // 60 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: true });
      expect(result.motmWinner).toBe('player');
      expect(result.isTie).toBe(false);
      expect(result.reason).toContain('dominant batting display');
    });

    it('should award MOTM to bot if bot has more points', () => {
      const playerStats = { runs: 10 }; // 10 pts
      const botStats = { wickets: 5 }; // 75 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: false });
      expect(result.motmWinner).toBe('bot');
      expect(result.isTie).toBe(false);
      expect(result.reason).toContain('lethal bowling spell');
    });

    it('should resolve tie based on winning team (player wins)', () => {
      const playerStats = { runs: 10 }; // 10 pts
      const botStats = { runs: 10 }; // 10 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: true });
      expect(result.motmWinner).toBe('player');
      expect(result.isTie).toBe(true);
    });

    it('should resolve tie based on winning team (bot wins)', () => {
      const playerStats = { runs: 10 }; // 10 pts
      const botStats = { runs: 10 }; // 10 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: false });
      expect(result.motmWinner).toBe('bot');
      expect(result.isTie).toBe(true);
    });

    it('should set appropriate reason for all-round performance', () => {
      const playerStats = { runs: 30, wickets: 2, ballsFaced: 15 }; // 30 + 20 = 50 pts
      const botStats = { runs: 10 }; // 10 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: true });
      expect(result.reason).toContain('all-round masterclass');
    });

    it('should set default reason if neither runs nor wickets are > 0', () => {
      const playerStats = { catches: 2 }; // 10 pts
      const botStats = { catches: 1 }; // 5 pts
      const result = determineManOfTheMatch({ playerStats, botStats, playerWon: true });
      expect(result.reason).toContain('Awarded for earning');
    });
  });
});
