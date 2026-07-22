// LocalStorage Engine for Player & Bot Lifetime Career Statistics
import { auth, db } from '../firebase';
import { ref, set } from 'firebase/database';

const STORAGE_KEY = 'hand_cricket_career_stats';

const DEFAULT_PLAYER_STATS = {
  id: 'player_1',
  name: 'Champion Player',
  team: 'India Legends',
  role: 'All-Rounder',
  avatar: '🏏',
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  // Batting
  runs: 0,
  ballsFaced: 0,
  highestScore: 0,
  fours: 0,
  sixes: 0,
  fifties: 0,
  hundreds: 0,
  ducks: 0,
  notOuts: 0,
  // Bowling
  wickets: 0,
  oversBowled: 0,
  runsConceded: 0,
  maidens: 0,
  dotBalls: 0,
  bestBowlingWickets: 0,
  bestBowlingRuns: 999,
  // Extra
  motmAwards: 0,
  totalCareerPoints: 0,
  recentForm: ['W', 'W', 'L', 'W', 'W'],
};

const DEFAULT_BOT_STATS = {
  id: 'bot_1',
  name: 'AI Mastermind',
  team: 'Cyber Strikers',
  role: 'Bowler',
  avatar: '🤖',
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  // Batting
  runs: 0,
  ballsFaced: 0,
  highestScore: 0,
  fours: 0,
  sixes: 0,
  fifties: 0,
  hundreds: 0,
  ducks: 0,
  notOuts: 0,
  // Bowling
  wickets: 0,
  oversBowled: 0,
  runsConceded: 0,
  maidens: 0,
  dotBalls: 0,
  bestBowlingWickets: 0,
  bestBowlingRuns: 999,
  // Extra
  motmAwards: 0,
  totalCareerPoints: 0,
  recentForm: ['W', 'L', 'W', 'L', 'L'],
};

export function loadAllCareerStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        player: { ...DEFAULT_PLAYER_STATS, ...parsed.player },
        bot: { ...DEFAULT_BOT_STATS, ...parsed.bot },
      };
    }
  } catch {}
  return {
    player: DEFAULT_PLAYER_STATS,
    bot: DEFAULT_BOT_STATS,
  };
}

export function saveAllCareerStats(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (auth?.currentUser) {
      set(ref(db, `users/${auth.currentUser.uid}/stats`), data).catch(console.error);
    }
  } catch {}
}

export function updateCareerAfterMatch({ playerMatchStats, botMatchStats, motmWinner, playerWon }) {
  const current = loadAllCareerStats();

  const updateSide = (existing, match, isWinner, isMotm) => {
    const runs = existing.runs + (match.runs || 0);
    const ballsFaced = existing.ballsFaced + (match.ballsFaced || 0);
    const wickets = existing.wickets + (match.wickets || 0);
    const runsConceded = existing.runsConceded + (match.runsConceded || 0);
    const oversBowled = existing.oversBowled + Math.floor((match.ballsBowled || 0) / 6) + ((match.ballsBowled || 0) % 6) / 6;
    const fours = existing.fours + (match.fours || 0);
    const sixes = existing.sixes + (match.sixes || 0);
    const dotBalls = existing.dotBalls + (match.dotBalls || 0);
    const maidens = existing.maidens + (match.maidens || 0);

    const matchRuns = match.runs || 0;
    const highestScore = Math.max(existing.highestScore, matchRuns);
    const fifties = existing.fifties + (matchRuns >= 50 && matchRuns < 100 ? 1 : 0);
    const hundreds = existing.hundreds + (matchRuns >= 100 ? 1 : 0);
    const ducks = existing.ducks + (matchRuns === 0 && (match.ballsFaced || 0) > 0 ? 1 : 0);
    const notOuts = existing.notOuts + (match.isNotOut ? 1 : 0);

    // Best Bowling update logic
    let bestWickets = existing.bestBowlingWickets;
    let bestRuns = existing.bestBowlingRuns;
    if (match.wickets > bestWickets || (match.wickets === bestWickets && match.runsConceded < bestRuns)) {
      bestWickets = match.wickets;
      bestRuns = match.runsConceded;
    }

    const recentForm = [isWinner ? 'W' : 'L', ...(existing.recentForm || []).slice(0, 4)];

    return {
      ...existing,
      matchesPlayed: existing.matchesPlayed + 1,
      wins: existing.wins + (isWinner ? 1 : 0),
      losses: existing.losses + (isWinner ? 0 : 1),
      runs,
      ballsFaced,
      highestScore,
      fours,
      sixes,
      fifties,
      hundreds,
      ducks,
      notOuts,
      wickets,
      oversBowled: Number(oversBowled.toFixed(1)),
      runsConceded,
      maidens,
      dotBalls,
      bestBowlingWickets: bestWickets,
      bestBowlingRuns: bestRuns,
      motmAwards: existing.motmAwards + (isMotm ? 1 : 0),
      totalCareerPoints: existing.totalCareerPoints + (match.fantasyPoints || 0),
      recentForm,
    };
  };

  const updatedPlayer = updateSide(current.player, playerMatchStats, playerWon, motmWinner === 'player');
  const updatedBot = updateSide(current.bot, botMatchStats, !playerWon, motmWinner === 'bot');

  const updated = { player: updatedPlayer, bot: updatedBot };
  saveAllCareerStats(updated);
  return updated;
}
