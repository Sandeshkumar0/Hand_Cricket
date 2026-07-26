import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameProvider, useGame, gameReducer } from './GameContext';
import { getBotStats, recordMatchResult, recordMove } from '../ai/botDB.js';
import { getPlayerEmojiForId } from '../utils/firebaseUtils.js';

vi.mock('../ai/botDB.js', () => ({
  getBotStats: vi.fn(),
  recordMatchResult: vi.fn(),
  recordMove: vi.fn()
}));

vi.mock('../utils/firebaseUtils.js', () => ({
  getPlayerEmojiForId: vi.fn(() => '😀')
}));

const TestComponent = () => {
  const { state, dispatch } = useGame();
  return (
    <div>
      <div data-testid="phase">{state.currentPhase}</div>
      <div data-testid="bot-stats">{state.bot_profile_stats?.wins}</div>
      <button onClick={() => dispatch({ type: 'START_VS_COMPUTER' })}>Start</button>
    </div>
  );
};

const NonChild = () => {
  useGame();
  return null;
};

describe('GameContext Provider & Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error if useGame used outside GameProvider', () => {
    expect(() => render(<NonChild />)).toThrow('useGame must be used within a GameProvider');
  });

  it('provides state and loads bot stats on mount', async () => {
    getBotStats.mockResolvedValue({ wins: 42 });
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('bot-stats')).toHaveTextContent('42');
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('MAIN_MENU');
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<GameProvider><TestComponent /></GameProvider>);
    unmount();
  });
});

describe('gameReducer', () => {
  let initialState;

  beforeEach(() => {
    initialState = gameReducer(undefined, { type: '@@INIT' });
  });

  it('handles START_VS_COMPUTER', () => {
    const state = gameReducer(initialState, { type: 'START_VS_COMPUTER' });
    expect(state.currentPhase).toBe('LOBBY');
  });

  it('handles GO_TO_MAIN_MENU', () => {
    const state = gameReducer(initialState, { type: 'GO_TO_MAIN_MENU' });
    expect(state.currentPhase).toBe('MAIN_MENU');
  });

  it('handles UPDATE_SERIES_LENGTH', () => {
    const state = gameReducer(initialState, { type: 'UPDATE_SERIES_LENGTH', payload: 5 });
    expect(state.match_settings.series_length).toBe(5);
  });

  it('handles UPDATE_OVERS', () => {
    const state = gameReducer(initialState, { type: 'UPDATE_OVERS', payload: 10 });
    expect(state.match_settings.overs_per_innings).toBe(10);
  });

  it('handles UPDATE_TIMER', () => {
    const state = gameReducer(initialState, { type: 'UPDATE_TIMER', payload: 15 });
    expect(state.match_settings.timer_duration).toBe(15);
  });

  it('handles START_MATCH', () => {
    const state = gameReducer(initialState, { type: 'START_MATCH' });
    expect(state.currentPhase).toBe('TOSS_SETUP');
    expect(state.match_settings.current_match).toBe(1);
    expect(state.score.batting).toBe(0);
  });

  it('handles COMPLETE_TOSS_SETUP', () => {
    const state = gameReducer(initialState, { type: 'COMPLETE_TOSS_SETUP' });
    expect(state.currentPhase).toBe('TOSS');
  });

  it('handles BACK_TO_LOBBY', () => {
    const state = gameReducer(initialState, { type: 'BACK_TO_LOBBY' });
    expect(state.currentPhase).toBe('LOBBY');
  });

  it('handles SUBMIT_TOSS_MOVE', () => {
    let state = gameReducer(initialState, { type: 'SUBMIT_TOSS_MOVE', payload: { who: 'player', move: 2 } });
    expect(state.toss_moves.player).toBe(2);
    expect(state.currentPhase).not.toBe('TOSS_RESULT');
    state = gameReducer(state, { type: 'SUBMIT_TOSS_MOVE', payload: { who: 'bot', move: 3 } });
    expect(state.toss_moves.bot).toBe(3);
    expect(state.currentPhase).toBe('TOSS_RESULT');
  });

  it('handles CHOOSE_BAT_BOWL bat', () => {
    const state = gameReducer(initialState, { type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bat' } });
    expect(state.currentPhase).toBe('MATCH');
    expect(state.player_role).toBe('batter');
    expect(state.batting_player).toBe('player_1');
  });

  it('handles CHOOSE_BAT_BOWL bowl', () => {
    const state = gameReducer(initialState, { type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bowl' } });
    expect(state.currentPhase).toBe('MATCH');
    expect(state.player_role).toBe('bowler');
    expect(state.batting_player).toBe('bot');
  });

  it('handles SUBMIT_MATCH_MOVE', () => {
    let state = gameReducer(initialState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } });
    expect(state.locked_moves.batter_move).toBe(4);
    state = gameReducer(state, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 2 } });
    expect(state.locked_moves.bowler_move).toBe(2);
    expect(state.currentPhase).toBe('RESOLVE_MOVE');
  });

  describe('PROCESS_RESOLUTION', () => {
    let matchState;
    beforeEach(() => {
      matchState = gameReducer(initialState, { type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bat' } });
    });

    it('processes run', () => {
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.score.batting).toBe(4);
      expect(st.balls_bowled).toBe(1);
      expect(st.currentPhase).toBe('MATCH');
      expect(st.match_stats.player.runs).toBe(4);
      expect(st.match_stats.player.fours).toBe(1);
    });

    it('processes run with ball_log history', () => {
      matchState.ball_log = [{ playerMove: 1 }, { playerMove: 2 }];
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      expect(st.current_over_log[0].context.previousPlayerMoves).toEqual([1, 2]);
    });

    it('processes six', () => {
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 6 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      expect(st.match_stats.player.sixes).toBe(1);
    });
    
    it('processes dot ball', () => {
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 0 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      expect(st.match_stats.player.dotBalls).toBe(1);
    });

    it('processes out in 1st innings', () => {
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 2 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 2 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.wickets.batting).toBe(1);
      expect(st.currentPhase).toBe('INNINGS_BREAK');
      expect(st.target).toBe(1);
    });

    it('processes overs limit in 1st innings', () => {
      matchState.match_settings.overs_per_innings = 1 / 6; // 1 ball limit
      let st = gameReducer(matchState, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 1 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 2 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.currentPhase).toBe('INNINGS_BREAK');
      expect(st.target).toBe(2);
    });

    it('processes successful chase in 2nd innings', () => {
      let st = gameReducer(matchState, { type: 'ADVANCE_INNINGS' });
      st.target = 5;
      
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 6 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 2 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.currentPhase).toBe('MATCH_RESULT');
      expect(st.result_meta.winner).toBe('bot'); // because player batted 1st
    });

    it('processes out in 2nd innings', () => {
      let st = gameReducer(matchState, { type: 'ADVANCE_INNINGS' });
      st.target = 5;
      
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 3 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.currentPhase).toBe('MATCH_RESULT');
      expect(st.result_meta.winner).toBe('player');
    });

    it('processes overs limit in 2nd innings', () => {
      let st = gameReducer(matchState, { type: 'ADVANCE_INNINGS' });
      st.target = 5;
      st.match_settings.overs_per_innings = 1 / 6; // 1 ball
      
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 1 } });
      st = gameReducer(st, { type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 2 } });
      st = gameReducer(st, { type: 'PROCESS_RESOLUTION' });
      
      expect(st.currentPhase).toBe('MATCH_RESULT');
      expect(st.result_meta.winner).toBe('player');
    });
  });

  it('handles ADVANCE_INNINGS', () => {
    let st = gameReducer(initialState, { type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bat' } });
    st.score.batting = 10;
    st.wickets.batting = 1;
    st = gameReducer(st, { type: 'ADVANCE_INNINGS' });
    
    expect(st.innings).toBe(2);
    expect(st.player_role).toBe('bowler');
    expect(st.score.bowling).toBe(10);
    expect(st.wickets.bowling).toBe(1);
    expect(st.score.batting).toBe(0);
  });

  it('handles NEXT_MATCH to SERIES_RESULT when series won', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st.series_winner = 'player';
    st = gameReducer(st, { type: 'NEXT_MATCH' });
    expect(st.currentPhase).toBe('SERIES_RESULT');
  });

  it('handles NEXT_MATCH to TOSS_SETUP when series not won', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st.match_settings.series_length = 3;
    st.match_settings.current_match = 1;
    st = gameReducer(st, { type: 'NEXT_MATCH' });
    expect(st.currentPhase).toBe('TOSS_SETUP');
    expect(st.match_settings.current_match).toBe(2);
  });

  it('computes bot series win on forfeit', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st.match_settings.series_length = 3;
    st.series_scores.bot = 1;
    st = gameReducer(st, { type: 'FORFEIT_MATCH' });
    expect(st.series_winner).toBe('bot');
  });

  it('computes series winner as null when no one reached needed wins', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st.match_settings.series_length = 3;
    st = gameReducer(st, { type: 'FORFEIT_MATCH' });
    expect(st.series_winner).toBe(null);
  });

  it('handles FORFEIT_MATCH', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st = gameReducer(st, { type: 'FORFEIT_MATCH' });
    expect(st.currentPhase).toBe('MATCH_RESULT');
    expect(st.result_meta.winner).toBe('bot');
    expect(st.result_meta.summary).toContain('You quit');
  });

  it('handles SET_BOT_PROFILE_STATS', () => {
    const st = gameReducer(initialState, { type: 'SET_BOT_PROFILE_STATS', payload: { wins: 99 } });
    expect(st.bot_profile_stats.wins).toBe(99);
  });

  it('handles RESET_GAME', () => {
    let st = gameReducer(initialState, { type: 'START_MATCH' });
    st = gameReducer(st, { type: 'RESET_GAME' });
    expect(st.currentPhase).toBe('MAIN_MENU');
  });

  it('handles default', () => {
    const st = gameReducer(initialState, { type: 'UNKNOWN' });
    expect(st).toBe(initialState);
  });
});

describe('GameProvider effects', () => {
  it('calls recordMove and recordMatchResult on state changes', async () => {
    const TestApp = () => {
      const { state, dispatch } = useGame();
      
      return (
        <div>
          <button onClick={() => dispatch({ type: 'START_MATCH' })}>1</button>
          <button onClick={() => dispatch({ type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bat' } })}>2</button>
          <button onClick={() => dispatch({ type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } })}>3</button>
          <button onClick={() => dispatch({ type: 'SUBMIT_MATCH_MOVE', payload: { role: 'bowler', move: 3 } })}>4</button>
          <button onClick={() => dispatch({ type: 'PROCESS_RESOLUTION' })}>5</button>
          <button onClick={() => dispatch({ type: 'FORFEIT_MATCH' })}>6</button>
        </div>
      );
    };

    render(
      <GameProvider>
        <TestApp />
      </GameProvider>
    );

    await waitFor(() => {
      expect(getBotStats).toHaveBeenCalled();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('1'));
    await user.click(screen.getByText('2'));
    await user.click(screen.getByText('3'));
    await user.click(screen.getByText('4'));
    await user.click(screen.getByText('5')); // creates ball_log entry
    
    await waitFor(() => {
      expect(recordMove).toHaveBeenCalled();
    });

    await user.click(screen.getByText('6')); // creates match_result entry
    
    await waitFor(() => {
      expect(recordMatchResult).toHaveBeenCalled();
    });
    
    // Clicking again should not record duplicates due to syncedIds
    recordMove.mockClear();
    recordMatchResult.mockClear();
    
    // Rerender to trigger effect again without changes
    await user.click(screen.getByText('1'));
    
    // wait a tick
    await new Promise(r => setTimeout(r, 50));
    expect(recordMove).not.toHaveBeenCalled();
  });
});
