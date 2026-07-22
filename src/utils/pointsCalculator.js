// Fantasy Points & Man of the Match Calculation Engine

export function calculatePlayerPoints(stats) {
  const runs = stats.runs || 0;
  const fours = stats.fours || 0;
  const sixes = stats.sixes || 0;
  const wickets = stats.wickets || 0;
  const dotBalls = stats.dotBalls || 0;
  const maidens = stats.maidens || 0;
  const catches = stats.catches || 0;
  const runOuts = stats.runOuts || 0;
  const stumpings = stats.stumpings || 0;

  // Batting Points
  let battingPoints = runs * 1;
  battingPoints += fours * 1.5;
  battingPoints += sixes * 2.0;
  if (runs >= 100) {
    battingPoints += 25;
  } else if (runs >= 50) {
    battingPoints += 10;
  }

  // Bowling Points
  let bowlingPoints = wickets * 10;
  bowlingPoints += dotBalls * 1;
  bowlingPoints += maidens * 10;
  if (wickets >= 5) {
    bowlingPoints += 25;
  } else if (wickets >= 3) {
    bowlingPoints += 10;
  }

  // Fielding Points
  const fieldingPoints = catches * 5 + runOuts * 8 + stumpings * 8;

  const totalPoints = battingPoints + bowlingPoints + fieldingPoints;

  return {
    runs,
    fours,
    sixes,
    wickets,
    dotBalls,
    maidens,
    catches,
    runOuts,
    stumpings,
    battingPoints,
    bowlingPoints,
    fieldingPoints,
    totalPoints: Math.round(totalPoints * 10) / 10,
  };
}

export function determineManOfTheMatch({ playerStats, botStats, playerWon }) {
  const pPts = calculatePlayerPoints(playerStats);
  const bPts = calculatePlayerPoints(botStats);

  let motmWinner = 'player';
  let isTie = false;

  if (pPts.totalPoints > bPts.totalPoints) {
    motmWinner = 'player';
  } else if (bPts.totalPoints > pPts.totalPoints) {
    motmWinner = 'bot';
  } else {
    // Tie-breaker logic:
    // 1. Winning Team
    // 2. Lower balls faced for higher runs, or lower economy
    isTie = true;
    motmWinner = playerWon ? 'player' : 'bot';
  }

  const winnerKey = motmWinner;
  const winnerPts = winnerKey === 'player' ? pPts : bPts;
  const winnerMatch = winnerKey === 'player' ? playerStats : botStats;

  // Build contextual selection reason
  let reason = `Awarded for earning ${winnerPts.totalPoints} fantasy points with an impactful performance on the pitch.`;
  if (winnerMatch.runs > 0 && winnerMatch.wickets > 0) {
    reason = `Awarded for an all-round masterclass scoring ${winnerMatch.runs} runs off ${winnerMatch.ballsFaced} balls and taking ${winnerMatch.wickets} wicket(s) for ${winnerPts.totalPoints} fantasy points.`;
  } else if (winnerMatch.runs > 0) {
    reason = `Awarded for a dominant batting display scoring ${winnerMatch.runs} runs off ${winnerMatch.ballsFaced} balls including ${winnerMatch.fours} fours and ${winnerMatch.sixes} sixes.`;
  } else if (winnerMatch.wickets > 0) {
    reason = `Awarded for a lethal bowling spell taking ${winnerMatch.wickets} wicket(s) with ${winnerMatch.dotBalls} dot balls for ${winnerPts.totalPoints} fantasy points.`;
  }

  return {
    motmWinner,
    isTie,
    playerPoints: pPts,
    botPoints: bPts,
    winnerStats: winnerPts,
    reason,
  };
}
