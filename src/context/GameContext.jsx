import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { BOT, buildContextKey } from '../ai/botBrain.js';
import { getBotStats, recordMatchResult, recordMove } from '../ai/botDB.js';
import { getPlayerEmojiForId } from '../utils/firebaseUtils.js';

const PLAYER_ID = 'player_1';
const BOT_ID = BOT.id;

const OVER_OPTIONS = [1, 2, 5, 10, 20, 50, null];
const TIMER_OPTIONS = [0, 5, 10, 15];

const createCompetitorStats = () => ({
  runs: 0,
  ballsFaced: 0,
  wickets: 0,
  ballsBowled: 0,
  runsConceded: 0,
  dismissals: 0,
  fours: 0,
  sixes: 0,
  dotBalls: 0,
  inningsScores: [],
});

const createMatchState = () => ({
  batting_player: null,
  bowling_player: null,
  player_role: null,
  score: { batting: 0, bowling: 0 },
  wickets: { batting: 0, bowling: 0 },
  innings: 1,
  target: null,
  balls_bowled: 0,
  locked_moves: {
    batter_move: null,
    bowler_move: null,
  },
  toss_moves: { player: null, bot: null },
  ball_log: [],
  current_over_log: [],
  delivery_counter: 0,
  innings_results: [],
  result_meta: null,
  match_stats: {
    player: createCompetitorStats(),
    bot: createCompetitorStats(),
  },
});

const initialState = {
  currentPhase: 'MAIN_MENU',
  host_id: PLAYER_ID,
  players: {
    [PLAYER_ID]: { id: PLAYER_ID, name: 'You', emoji: getPlayerEmojiForId(PLAYER_ID), is_bot: false },
    [BOT_ID]: { id: BOT_ID, ...BOT, is_bot: true },
  },
  match_settings: {
    game_mode: 'vs_computer',
    series_length: 1,
    overs_per_innings: 2,
    timer_duration: 10,
    current_match: 1,
  },
  series_scores: { player: 0, bot: 0 },
  match_results: [],
  series_winner: null,
  bot_profile_stats: {
    movesRecorded: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    runsScored: 0,
    wicketsTaken: 0,
    highestScore: 0,
    dismissals: 0,
    recentMoves: [],
  },
  ...createMatchState(),
};

const GameContext = createContext();

const getSideKey = (playerId) => (playerId === PLAYER_ID ? 'player' : 'bot');

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

const appendInningsScore = (stats, sideKey, score) => ({
  ...stats,
  [sideKey]: {
    ...stats[sideKey],
    inningsScores: [...stats[sideKey].inningsScores, score],
  },
});

const getDisplayScore = (inningsResults, side, fallbackScore, fallbackWickets) => {
  const inningsEntry = inningsResults.find((entry) => entry.side === side);
  return `${inningsEntry?.score ?? fallbackScore}/${inningsEntry?.wickets ?? fallbackWickets}`;
};

const getLiveScoreStateForSide = (state, side) => {
  const currentBattingSide = getSideKey(state.batting_player);
  if (currentBattingSide === side) {
    return {
      score: state.score.batting,
      wickets: state.wickets.batting,
    };
  }

  return {
    score: state.score.bowling,
    wickets: state.wickets.bowling,
  };
};

const createResultMeta = (state, battingScore, battingWickets, defenderWon) => {
  const inningsResults = [
    ...state.innings_results,
    {
      side: getSideKey(state.batting_player),
      score: battingScore,
      wickets: battingWickets,
    },
  ];
  const playerChasing = state.player_role === 'batter';
  const playerWon = defenderWon ? !playerChasing : playerChasing;
  const marginRuns = state.target ? Math.max(0, state.target - 1 - battingScore) : 0;
  const winner = playerWon ? 'player' : 'bot';

  return {
    winner,
    playerWon,
    summary: playerWon
      ? defenderWon
        ? `You defended by ${marginRuns} runs.`
        : `You chased ${state.target} in style.`
      : defenderWon
        ? `BOT defended by ${marginRuns} runs.`
        : `BOT chased ${state.target} cleanly.`,
    playerScore: getDisplayScore(inningsResults, 'player', battingScore, battingWickets),
    botScore: getDisplayScore(inningsResults, 'bot', battingScore, battingWickets),
  };
};

const createForfeitResultMeta = (state) => {
  const playerLive = getLiveScoreStateForSide(state, 'player');
  const botLive = getLiveScoreStateForSide(state, 'bot');

  return {
    winner: 'bot',
    playerWon: false,
    summary: 'You quit the match. It counts as a loss.',
    playerScore: getDisplayScore(
      state.innings_results,
      'player',
      playerLive.score,
      playerLive.wickets,
    ),
    botScore: getDisplayScore(
      state.innings_results,
      'bot',
      botLive.score,
      botLive.wickets,
    ),
  };
};

const computeSeriesWinner = (seriesScores, seriesLength) => {
  const needed = Math.ceil(seriesLength / 2);
  if (seriesScores.player >= needed) return 'player';
  if (seriesScores.bot >= needed) return 'bot';
  return null;
};

const buildMatchResultPayload = ({ nextState, state, resultMeta, updatedSeries }) => ({
  matchNumber: state.match_settings.current_match,
  winner: resultMeta.winner,
  summary: resultMeta.summary,
  playerScore: resultMeta.playerScore,
  botScore: resultMeta.botScore,
  botWon: resultMeta.winner === 'bot',
  currentMatch: state.match_settings.current_match,
  seriesLength: state.match_settings.series_length,
  seriesScoreline: `${updatedSeries.player}-${updatedSeries.bot}`,
  botBattingScore: nextState.match_stats.bot.inningsScores.at(-1) ?? 0,
  botBowlingConceded: nextState.match_stats.bot.runsConceded,
  timestamp: Date.now(),
});

const getCurrentRates = (state) => {
  const overs = state.balls_bowled / 6;
  const currentRunRate = overs > 0 ? state.score.batting / overs : 0;
  const remainingBalls =
    state.match_settings.overs_per_innings === null
      ? null
      : Math.max(0, state.match_settings.overs_per_innings * 6 - state.balls_bowled);
  const remainingRuns = state.target ? Math.max(0, state.target - state.score.batting) : 0;
  const requiredRunRate =
    remainingBalls && remainingRuns > 0 ? remainingRuns / (remainingBalls / 6) : 0;

  return {
    currentRunRate,
    requiredRunRate,
    playerStrikeRate:
      state.match_stats.player.ballsFaced > 0
        ? (state.match_stats.player.runs / state.match_stats.player.ballsFaced) * 100
        : 0,
    botEconomy:
      state.match_stats.bot.ballsBowled > 0
        ? state.match_stats.bot.runsConceded / (state.match_stats.bot.ballsBowled / 6)
        : 0,
  };
};

export function gameReducer(state = initialState, action) {
  switch (action.type) {
    case 'START_VS_COMPUTER':
      return {
        ...initialState,
        currentPhase: 'LOBBY',
        bot_profile_stats: state.bot_profile_stats,
      };

    case 'GO_TO_MAIN_MENU':
      return {
        ...initialState,
        bot_profile_stats: state.bot_profile_stats,
      };

    case 'UPDATE_SERIES_LENGTH':
      return {
        ...state,
        match_settings: {
          ...state.match_settings,
          series_length: action.payload,
        },
      };

    case 'UPDATE_OVERS':
      return {
        ...state,
        match_settings: {
          ...state.match_settings,
          overs_per_innings: action.payload,
        },
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        match_settings: {
          ...state.match_settings,
          timer_duration: action.payload,
        },
      };

    case 'START_MATCH':
      return {
        ...state,
        currentPhase: 'TOSS_SETUP',
        match_settings: {
          ...state.match_settings,
          current_match: 1,
        },
        series_scores: { player: 0, bot: 0 },
        match_results: [],
        series_winner: null,
        ...createMatchState(),
      };

    case 'COMPLETE_TOSS_SETUP':
      return {
        ...state,
        currentPhase: 'TOSS',
      };

    case 'BACK_TO_LOBBY':
      return {
        ...state,
        currentPhase: 'LOBBY',
        ...createMatchState(),
      };

    case 'SUBMIT_TOSS_MOVE': {
      const { who, move } = action.payload;
      const nextToss = { ...state.toss_moves, [who]: move };
      return {
        ...state,
        toss_moves: nextToss,
        currentPhase:
          nextToss.player !== null && nextToss.bot !== null ? 'TOSS_RESULT' : state.currentPhase,
      };
    }

    case 'CHOOSE_BAT_BOWL': {
      const { choice } = action.payload;
      return {
        ...state,
        currentPhase: 'MATCH',
        player_role: choice === 'bat' ? 'batter' : 'bowler',
        batting_player: choice === 'bat' ? PLAYER_ID : BOT_ID,
        bowling_player: choice === 'bat' ? BOT_ID : PLAYER_ID,
        innings: 1,
        target: null,
        balls_bowled: 0,
        score: { batting: 0, bowling: 0 },
        wickets: { batting: 0, bowling: 0 },
        locked_moves: { batter_move: null, bowler_move: null },
        current_over_log: [],
        innings_results: [],
        result_meta: null,
        ball_log: [],
        delivery_counter: 0,
        match_stats: {
          player: createCompetitorStats(),
          bot: createCompetitorStats(),
        },
      };
    }

    case 'SUBMIT_MATCH_MOVE': {
      const { role, move } = action.payload;
      const nextLocked = {
        ...state.locked_moves,
        [role === 'batter' ? 'batter_move' : 'bowler_move']: move,
      };
      return {
        ...state,
        locked_moves: nextLocked,
        currentPhase:
          nextLocked.batter_move !== null && nextLocked.bowler_move !== null
            ? 'RESOLVE_MOVE'
            : state.currentPhase,
      };
    }

    case 'PROCESS_RESOLUTION': {
      const { batter_move, bowler_move } = state.locked_moves;
      const isOut = batter_move === bowler_move;
      const runs = isOut ? 0 : batter_move;
      const newBalls = state.balls_bowled + 1;

      const batterSide = getSideKey(state.batting_player);
      const bowlerSide = getSideKey(state.bowling_player);
      const playerMove = state.player_role === 'batter' ? batter_move : bowler_move;
      const botMove = state.player_role === 'batter' ? bowler_move : batter_move;

      const newScore = { ...state.score, batting: state.score.batting + runs };
      const newWickets = {
        ...state.wickets,
        batting: state.wickets.batting + (isOut ? 1 : 0),
      };

      let nextStats = {
        player: { ...state.match_stats.player },
        bot: { ...state.match_stats.bot },
      };

      nextStats = {
        ...nextStats,
        [batterSide]: {
          ...nextStats[batterSide],
          runs: nextStats[batterSide].runs + runs,
          ballsFaced: nextStats[batterSide].ballsFaced + 1,
          dismissals: nextStats[batterSide].dismissals + (isOut ? 1 : 0),
          fours: nextStats[batterSide].fours + (!isOut && runs === 4 ? 1 : 0),
          sixes: nextStats[batterSide].sixes + (!isOut && runs === 6 ? 1 : 0),
          dotBalls: nextStats[batterSide].dotBalls + (!isOut && runs === 0 ? 1 : 0),
        },
        [bowlerSide]: {
          ...nextStats[bowlerSide],
          wickets: nextStats[bowlerSide].wickets + (isOut ? 1 : 0),
          ballsBowled: nextStats[bowlerSide].ballsBowled + 1,
          runsConceded: nextStats[bowlerSide].runsConceded + runs,
        },
      };

      const context = {
        innings: state.innings,
        playerRole: state.player_role,
        score: state.score.batting,
        wickets: state.wickets.batting,
        ballsBowled: state.balls_bowled,
        oversLimit: state.match_settings.overs_per_innings,
        target: state.target,
        previousPlayerMoves: state.ball_log.slice(-3).map((entry) => entry.playerMove),
      };
      context.key = buildContextKey(context);

      const ballEntry = {
        ballId: `m${state.match_settings.current_match}-i${state.innings}-b${state.delivery_counter + 1}`,
        innings: state.innings,
        ballNumber: newBalls,
        over: formatOvers(newBalls),
        batterMove: batter_move,
        bowlerMove: bowler_move,
        playerMove,
        botMove,
        playerRole: state.player_role,
        botRole: state.player_role === 'batter' ? 'bowler' : 'batter',
        runs,
        isOut,
        context,
        playerScoreAfter: getSideKey(state.batting_player) === 'player' ? newScore.batting : state.score.bowling,
        botInningsScore: getSideKey(state.batting_player) === 'bot' ? newScore.batting : state.score.bowling,
        timestamp: Date.now(),
      };

      let nextState = {
        ...state,
        score: newScore,
        wickets: newWickets,
        balls_bowled: newBalls,
        locked_moves: { batter_move: null, bowler_move: null },
        current_over_log: [...state.current_over_log, ballEntry].slice(-6),
        ball_log: [...state.ball_log, ballEntry],
        delivery_counter: state.delivery_counter + 1,
        match_stats: nextStats,
      };

      const closeInnings = (phase) => {
        const inningsEntry = {
          innings: state.innings,
          side: batterSide,
          score: newScore.batting,
          wickets: newWickets.batting,
          balls: newBalls,
        };

        nextState = {
          ...nextState,
          innings_results: [...state.innings_results, inningsEntry],
          match_stats: appendInningsScore(nextStats, batterSide, newScore.batting),
          currentPhase: phase,
        };
      };

      if (state.innings === 2 && state.target !== null && newScore.batting >= state.target) {
        closeInnings('MATCH_RESULT');
        const winner = state.player_role === 'batter' ? 'player' : 'bot';
        const updatedSeries = {
          ...state.series_scores,
          [winner]: state.series_scores[winner] + 1,
        };
        const resultMeta = {
          winner,
          playerWon: winner === 'player',
          summary:
            winner === 'player'
              ? `You chased ${state.target} with authority.`
              : `BOT chased ${state.target} with authority.`,
          playerScore: getDisplayScore(
            nextState.innings_results,
            'player',
            newScore.batting,
            newWickets.batting,
          ),
          botScore: getDisplayScore(
            nextState.innings_results,
            'bot',
            newScore.batting,
            newWickets.batting,
          ),
        };
        const matchResult = buildMatchResultPayload({
          nextState,
          state,
          resultMeta,
          updatedSeries,
        });

        nextState = {
          ...nextState,
          series_scores: updatedSeries,
          series_winner: computeSeriesWinner(updatedSeries, state.match_settings.series_length),
          result_meta: resultMeta,
          match_results: [...state.match_results, matchResult],
        };

        return nextState;
      }

      if (isOut) {
        if (state.innings === 1) {
          closeInnings('INNINGS_BREAK');
          nextState = {
            ...nextState,
            target: newScore.batting + 1,
          };
        } else {
          closeInnings('MATCH_RESULT');
          const resultMeta = createResultMeta(state, newScore.batting, newWickets.batting, true);
          const updatedSeries = {
            ...state.series_scores,
            [resultMeta.winner]: state.series_scores[resultMeta.winner] + 1,
          };
          nextState = {
            ...nextState,
            series_scores: updatedSeries,
            series_winner: computeSeriesWinner(updatedSeries, state.match_settings.series_length),
            result_meta: resultMeta,
            match_results: [
              ...state.match_results,
              buildMatchResultPayload({
                nextState,
                state,
                resultMeta,
                updatedSeries,
              }),
            ],
          };
        }
        return nextState;
      }

      const oversLimit = state.match_settings.overs_per_innings;
      if (oversLimit !== null && newBalls >= oversLimit * 6) {
        if (state.innings === 1) {
          closeInnings('INNINGS_BREAK');
          nextState = {
            ...nextState,
            target: newScore.batting + 1,
          };
        } else {
          closeInnings('MATCH_RESULT');
          const resultMeta = createResultMeta(state, newScore.batting, newWickets.batting, true);
          const updatedSeries = {
            ...state.series_scores,
            [resultMeta.winner]: state.series_scores[resultMeta.winner] + 1,
          };
          nextState = {
            ...nextState,
            series_scores: updatedSeries,
            series_winner: computeSeriesWinner(updatedSeries, state.match_settings.series_length),
            result_meta: resultMeta,
            match_results: [
              ...state.match_results,
              buildMatchResultPayload({
                nextState,
                state,
                resultMeta,
                updatedSeries,
              }),
            ],
          };
        }
        return nextState;
      }

      nextState.currentPhase = 'MATCH';
      return nextState;
    }

    case 'ADVANCE_INNINGS': {
      const wasPlayerBatter = state.player_role === 'batter';
      return {
        ...state,
        currentPhase: 'MATCH',
        innings: 2,
        player_role: wasPlayerBatter ? 'bowler' : 'batter',
        batting_player: wasPlayerBatter ? BOT_ID : PLAYER_ID,
        bowling_player: wasPlayerBatter ? PLAYER_ID : BOT_ID,
        balls_bowled: 0,
        score: { ...state.score, bowling: state.score.batting, batting: 0 },
        wickets: { ...state.wickets, bowling: state.wickets.batting, batting: 0 },
        locked_moves: { batter_move: null, bowler_move: null },
        current_over_log: [],
      };
    }

    case 'NEXT_MATCH':
      if (state.series_winner) {
        return {
          ...state,
          currentPhase: 'SERIES_RESULT',
        };
      }

      return {
        ...state,
        currentPhase: 'TOSS_SETUP',
        match_settings: {
          ...state.match_settings,
          current_match: state.match_settings.current_match + 1,
        },
        ...createMatchState(),
      };

    case 'FORFEIT_MATCH': {
      const resultMeta = createForfeitResultMeta(state);
      const updatedSeries = {
        ...state.series_scores,
        bot: state.series_scores.bot + 1,
      };
      const nextState = {
        ...state,
        currentPhase: 'MATCH_RESULT',
        series_scores: updatedSeries,
        series_winner: computeSeriesWinner(updatedSeries, state.match_settings.series_length),
        result_meta: resultMeta,
      };

      return {
        ...nextState,
        match_results: [
          ...state.match_results,
          buildMatchResultPayload({
            nextState,
            state,
            resultMeta,
            updatedSeries,
          }),
        ],
      };
    }

    case 'SET_BOT_PROFILE_STATS':
      return {
        ...state,
        bot_profile_stats: {
          ...state.bot_profile_stats,
          ...action.payload,
        },
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        bot_profile_stats: state.bot_profile_stats,
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const syncedBallIds = useRef(new Set());
  const syncedMatchIds = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    getBotStats().then((stats) => {
      if (isMounted) {
        dispatch({ type: 'SET_BOT_PROFILE_STATS', payload: stats });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    state.ball_log.forEach((entry) => {
      if (syncedBallIds.current.has(entry.ballId)) return;
      syncedBallIds.current.add(entry.ballId);
      recordMove(entry);
    });
  }, [state.ball_log]);

  useEffect(() => {
    state.match_results.forEach((entry) => {
      const key = `${entry.matchNumber}-${entry.timestamp}`;
      if (syncedMatchIds.current.has(key)) return;
      syncedMatchIds.current.add(key);
      recordMatchResult(entry);
    });
  }, [state.match_results]);

  const contextValue = {
    state: {
      ...state,
      derivedStats: getCurrentRates(state),
      overOptions: OVER_OPTIONS,
      timerOptions: TIMER_OPTIONS,
    },
    dispatch,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
