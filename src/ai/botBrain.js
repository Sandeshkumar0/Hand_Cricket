import { getPatternPrediction } from './botDB.js';

export const BOT = {
  id: 'bot',
  name: 'BOT',
  emoji: '🤖',
  tagline: 'Learns from your habits and adjusts ball by ball.',
};

const MOVES = [0, 1, 2, 3, 4, 5, 6];
const memoryCache = new Map();

const weightedChoice = (weights) => {
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weights) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }
  return weights[weights.length - 1].value;
};

const normalizeFrequencies = (frequencies = {}) => {
  const entries = MOVES.map((move) => ({
    move,
    count: Number(frequencies[move] ?? frequencies[String(move)] ?? 0),
  }));
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  return {
    total,
    distribution: entries.map((item) => ({
      move: item.move,
      probability: total ? item.count / total : 1 / MOVES.length,
      count: item.count,
    })),
  };
};

export function buildContextKey(context) {
  const oversBucket =
    context.oversLimit === null
      ? 'inf'
      : `${Math.floor((context.ballsBowled ?? 0) / 6)}/${context.oversLimit}`;
  const pressureBucket =
    context.target && context.innings === 2
      ? Math.max(0, context.target - context.score).toString()
      : 'na';
  const recent = (context.previousPlayerMoves ?? []).slice(-3).join('-') || 'fresh';

  return [
    `i${context.innings}`,
    `r${context.playerRole}`,
    `o${oversBucket}`,
    `p${pressureBucket}`,
    `w${context.wickets}`,
    `recent:${recent}`,
  ].join('|');
}

export function analyzePlayerPatterns(moveHistory = [], context) {
  const relevant = moveHistory.filter((entry) => entry.context?.key === context.key);
  const recent = moveHistory.slice(-18);
  const frequencies = {};

  for (const entry of [...recent, ...relevant]) {
    frequencies[entry.playerMove] = (frequencies[entry.playerMove] ?? 0) + (entry.context?.key === context.key ? 2 : 1);
  }

  return normalizeFrequencies(frequencies);
}

async function loadCloudPattern(contextKey) {
  if (memoryCache.has(contextKey)) {
    return memoryCache.get(contextKey);
  }

  const cloud = await getPatternPrediction(contextKey);
  if (cloud) {
    memoryCache.set(contextKey, cloud);
  }
  return cloud;
}

const combinePredictions = (localPattern, cloudPattern) => {
  const merged = {};

  for (const item of localPattern.distribution) {
    merged[item.move] = (merged[item.move] ?? 0) + item.count * 1.25;
  }

  if (cloudPattern?.frequencies) {
    for (const move of MOVES) {
      merged[move] = merged[move] + Number(cloudPattern.frequencies[move] ?? cloudPattern.frequencies[String(move)] ?? 0);
    }
  }

  return normalizeFrequencies(merged);
};

const getColdStartMove = () =>
  weightedChoice([
    { value: 0, weight: 0.8 },
    { value: 1, weight: 1.05 },
    { value: 2, weight: 1.15 },
    { value: 3, weight: 1.3 },
    { value: 4, weight: 1.2 },
    { value: 5, weight: 1.15 },
    { value: 6, weight: 1.05 },
  ]);

const pickPredictedMove = (distribution) =>
  [...distribution].sort((a, b) => b.probability - a.probability)[0].move;

export async function getBotDecision({
  context,
  moveHistory = [],
}) {
  const localPattern = analyzePlayerPatterns(moveHistory, context);
  const cloudPattern = await loadCloudPattern(context.key);
  const mergedPattern = combinePredictions(localPattern, cloudPattern);
  const sampleSize = mergedPattern.total;

  const predictedPlayerMove =
    sampleSize < 15
      ? getColdStartMove()
      : pickPredictedMove(mergedPattern.distribution);

  const shouldAddNoise = Math.random() < 0.3;

  if (context.botRole === 'bowler') {
    if (shouldAddNoise) return getColdStartMove();
    return predictedPlayerMove;
  }

  const candidateWeights = MOVES.map((move) => {
    const prediction = mergedPattern.distribution.find((item) => item.move === move).probability;
    const distanceBoost = Math.abs(move - predictedPlayerMove) * 0.18;
    return {
      value: move,
      weight: Math.max(0.1, 1.1 - prediction + distanceBoost),
    };
  });

  return shouldAddNoise ? getColdStartMove() : weightedChoice(candidateWeights);
}
