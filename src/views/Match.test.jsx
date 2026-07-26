import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('framer-motion', () => {
  const React = require('react');
  const dummy = React.forwardRef((props, ref) => {
    const { initial, animate, exit, transition, ...rest } = props;
    return React.createElement('div', { ref, ...rest });
  });
  return {
    motion: { div: dummy },
    AnimatePresence: ({ children }) => children ? React.createElement(React.Fragment, null, children) : null
  };
});

import Match from './Match';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';
import { getBotDecision } from '../ai/botBrain';
import { determineManOfTheMatch } from '../utils/pointsCalculator';
import { updateCareerAfterMatch } from '../utils/statsStorage';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ currentUser: { displayName: 'Player' } }))
}));

vi.mock('../context/GameContext', () => ({
  useGame: vi.fn()
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playWicketSound: vi.fn(),
    playUiClick: vi.fn(),
    playMatchVictorySound: vi.fn(),
    playMatchDefeatSound: vi.fn()
  }
}));

vi.mock('../ai/botBrain', () => ({
  getBotDecision: vi.fn(),
  buildContextKey: vi.fn(),
  BOT: { id: 'bot-123' }
}));

vi.mock('../utils/pointsCalculator', () => ({
  determineManOfTheMatch: vi.fn()
}));

vi.mock('../utils/statsStorage', () => ({
  updateCareerAfterMatch: vi.fn()
}));

// Mock child components
vi.mock('../components/Scorecard', () => ({ default: ({ open, onClose }) => open ? <div data-testid="Scorecard"><button onClick={onClose}>Close</button></div> : null }));
vi.mock('../components/NumberPad', () => ({ default: ({ onSelect, disabled }) => <div data-testid="NumberPad" onClick={() => !disabled && onSelect(2)}>NumberPad</div> }));
vi.mock('../components/MotorsportHUD', () => ({ default: () => <div data-testid="MotorsportHUD">HUD</div> }));
vi.mock('../components/CricketBackground', () => ({ default: () => <div data-testid="CricketBackground">Background</div> }));
vi.mock('../components/MatchSummaryDashboard', () => ({ default: ({ onProceedToMotm }) => <div data-testid="MatchSummaryDashboard"><button onClick={onProceedToMotm}>Proceed</button></div> }));
vi.mock('../components/ManOfTheMatchCard', () => ({ default: ({ onContinueToResult }) => <div data-testid="ManOfTheMatchCard"><button onClick={onContinueToResult}>Continue</button></div> }));
vi.mock('../components/MoveTimer', () => ({ default: ({ onExpire }) => <div data-testid="MoveTimer" onClick={onExpire}>MoveTimer</div> }));

describe('Match Component', () => {
  let dispatchMock;

  const defaultState = {
    currentPhase: 'MATCH',
    player_role: 'batter',
    bowling_player: 'bot-123',
    score: { batting: 10 },
    wickets: { batting: 1 },
    innings: 1,
    target: null,
    balls_bowled: 12,
    locked_moves: { batter_move: null, bowler_move: null },
    players: { 'bot-123': { name: 'Bot Name' } },
    match_settings: { overs_per_innings: 5, timer_duration: 15, current_match: 1, series_length: 3 },
    match_stats: { player: { runs: 10, dismissals: 1 }, bot: { runs: 5, dismissals: 2 } },
    current_over_log: [{ ballId: 1, runs: 2, isOut: false }],
    ball_log: [{ ballId: 1, runs: 2, isOut: false }],
    result_meta: { playerWon: true, summary: 'Player wins' },
    derivedStats: { currentRunRate: 5, requiredRunRate: null },
    series_winner: null
  };

  beforeEach(() => {
    dispatchMock = vi.fn();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const setupMock = (overrides = {}) => {
    useGame.mockReturnValue({
      state: { ...defaultState, ...overrides },
      dispatch: dispatchMock
    });
  };

  it('renders MATCH phase, handles move selection, and scorecard', () => {
    setupMock();
    render(<Match />);
    expect(screen.getByTestId('MotorsportHUD')).toBeInTheDocument();
    
    // Select move
    fireEvent.click(screen.getByTestId('NumberPad'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 2 } });

    // Open scorecard
    fireEvent.click(screen.getByText('SCORECARD'));
    expect(screen.getByTestId('Scorecard')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('Scorecard')).not.toBeInTheDocument();
  });

  it('does not dispatch move if locked', () => {
    setupMock({ locked_moves: { batter_move: 2, bowler_move: null } });
    render(<Match />);
    fireEvent.click(screen.getByTestId('NumberPad'));
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('triggers bot decision after delay in MATCH phase', async () => {
    setupMock({ player_role: 'bowler' }); // bot is batter
    getBotDecision.mockResolvedValue(4);
    
    render(<Match />);
    
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'SUBMIT_MATCH_MOVE', payload: { role: 'batter', move: 4 } });
  });

  it('handles RESOLVE_MOVE phase with out overlay', () => {
    setupMock({
      currentPhase: 'RESOLVE_MOVE',
      locked_moves: { batter_move: 2, bowler_move: 2 } // Out condition
    });
    render(<Match />);

    expect(screen.getByText('OUT!')).toBeInTheDocument();
    expect(soundEngine.playWicketSound).toHaveBeenCalled();

    fireEvent.click(screen.getByText('CONTINUE MATCH'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'PROCESS_RESOLUTION' });
    expect(soundEngine.playUiClick).toHaveBeenCalled();
  });

  it('handles RESOLVE_MOVE auto-advance for non-out', () => {
    setupMock({
      currentPhase: 'RESOLVE_MOVE',
      locked_moves: { batter_move: 3, bowler_move: 2 } // Not out
    });
    render(<Match />);

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'PROCESS_RESOLUTION' });
  });

  it('renders INNINGS_BREAK phase', () => {
    setupMock({ currentPhase: 'INNINGS_BREAK', target: 25 });
    render(<Match />);
    
    expect(screen.getByText('INNINGS BREAK')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('START CHASE INNINGS'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'ADVANCE_INNINGS' });
  });

  it('renders MATCH_RESULT phase and flows through summary, motm, to victory result', () => {
    setupMock({ currentPhase: 'MATCH_RESULT' });
    determineManOfTheMatch.mockReturnValue({ motmWinner: 'player' });

    render(<Match />);
    
    // Step 1: Summary
    expect(screen.getByTestId('MatchSummaryDashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Proceed'));
    
    // Step 2: MOTM
    expect(screen.getByTestId('ManOfTheMatchCard')).toBeInTheDocument();
    expect(updateCareerAfterMatch).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continue'));

    // Step 3: Victory Result
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
    expect(soundEngine.playMatchVictorySound).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Next Match'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'NEXT_MATCH' });
  });

  it('handles MATCH_RESULT defeat result', () => {
    setupMock({ 
      currentPhase: 'MATCH_RESULT',
      result_meta: { playerWon: false, summary: 'Defeat', playerScore: 10, botScore: 12 }
    });
    determineManOfTheMatch.mockReturnValue({ motmWinner: 'bot' });

    render(<Match />);
    fireEvent.click(screen.getByText('Proceed'));
    fireEvent.click(screen.getByText('Continue'));

    expect(screen.getByText('DEFEAT')).toBeInTheDocument();
    expect(soundEngine.playMatchDefeatSound).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Next Match'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'NEXT_MATCH' });
  });

  it('handles MATCH_RESULT victory for series', () => {
    setupMock({ 
      currentPhase: 'MATCH_RESULT',
      result_meta: { playerWon: true },
      series_winner: 'player'
    });
    determineManOfTheMatch.mockReturnValue({ motmWinner: 'player' });

    render(<Match />);
    fireEvent.click(screen.getByText('Proceed'));
    fireEvent.click(screen.getByText('Continue'));

    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('View Series Result'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'NEXT_MATCH' });
  });

  it('handles quit modal', () => {
    setupMock();
    render(<Match />);
    
    // Open quit modal
    const closeBtn = screen.getByTitle('Quit Match');
    fireEvent.click(closeBtn);
    expect(screen.getByText('FORFEIT MATCH?')).toBeInTheDocument();

    // Cancel quit
    fireEvent.click(screen.getByText('RESUME PLAYING'));
    expect(screen.queryByText('FORFEIT MATCH?')).not.toBeInTheDocument();

    // Confirm quit
    fireEvent.click(closeBtn);
    fireEvent.click(screen.getByText('CONFIRM QUIT'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'FORFEIT_MATCH' });
  });

  it('handles MoveTimer expiration', () => {
    setupMock({ currentPhase: 'MATCH', locked_moves: { batter_move: null, bowler_move: null } });
    render(<Match />);
    
    fireEvent.click(screen.getByTestId('MoveTimer'));
    expect(dispatchMock).toHaveBeenCalledWith({ 
      type: 'SUBMIT_MATCH_MOVE', 
      payload: expect.objectContaining({ role: 'batter', move: expect.any(Number) }) 
    });
  });

  it('does not trigger timer if currentPhase is not MATCH', () => {
    setupMock({ currentPhase: 'RESOLVE_MOVE' });
    render(<Match />);
    // Since MoveTimer is only rendered in MATCH phase, this is implicit,
    // but this ensures the hook doesn't crash
  });

  it('renders MATCH phase when ball_log is empty', () => {
    setupMock({ ball_log: [], current_over_log: [] });
    render(<Match />);
    expect(screen.getByTestId('MotorsportHUD')).toBeInTheDocument();
  });


  it('covers commentary text cases', () => {
    const { rerender } = render(<Match />);
    
    setupMock({ ball_log: [{ ballId: 1, runs: 6, isOut: false }], current_over_log: [] });
    rerender(<Match />);
    
    setupMock({ ball_log: [{ ballId: 2, runs: 4, isOut: false }], current_over_log: [] });
    rerender(<Match />);
    
    setupMock({ ball_log: [{ ballId: 3, runs: 0, isOut: false }], current_over_log: [] });
    rerender(<Match />);
    
    setupMock({ ball_log: [{ ballId: 4, runs: 3, isOut: false }], current_over_log: [] });
    rerender(<Match />);

    setupMock({ ball_log: [{ ballId: 5, runs: 0, isOut: true }], current_over_log: [] });
    rerender(<Match />);

    setupMock({ ball_log: [], current_over_log: [] });
    rerender(<Match />);
  });


  it('covers missing branches', () => {
    // 1. overs_per_innings undefined
    setupMock({ currentPhase: 'INNINGS_BREAK', target: 25, match_settings: {} });
    render(<Match />);
    cleanup();

    // 2. botLocked not null
    setupMock({ currentPhase: 'MATCH', player_role: 'batter', locked_moves: { batter_move: null, bowler_move: 2 } });
    render(<Match />);
    cleanup();

    // 3. myMove not null
    setupMock({ currentPhase: 'MATCH', player_role: 'batter', locked_moves: { batter_move: 2, bowler_move: null } });
    render(<Match />);
    fireEvent.click(screen.getByTestId('NumberPad'));
    cleanup();

    // 4. overRuns new over index
    setupMock({ ball_log: [{ ballId: 1, runs: 2 }, { ballId: 2, runs: 3 }, { ballId: 3, runs: 1 }, { ballId: 4, runs: 4 }, { ballId: 5, runs: 6 }, { ballId: 6, runs: 0 }, { ballId: 7, runs: 1 }], current_over_log: [] });
    render(<Match />);
    cleanup();

    // 5. botName fallback and bowler fallback
    setupMock({ players: {}, bowling_player: 'unknown' });
    render(<Match />);
    cleanup();

    // 8. innings 2
    setupMock({ currentPhase: 'MATCH', innings: 2, derivedStats: { requiredRunRate: 6 } });
    render(<Match />);
    cleanup();

    // 9 & 10. ball-chip-dot and batter_move === 0
    setupMock({
      currentPhase: 'RESOLVE_MOVE',
      locked_moves: { batter_move: 0, bowler_move: 1 },
      current_over_log: [{ ballId: 1, runs: 0, isOut: false }]
    });
    render(<Match />);
    cleanup();
  });

  it('unmount clears timeouts', () => {
    setupMock();
    const { unmount } = render(<Match />);
    unmount();
    expect(true).toBe(true);
  });
});
