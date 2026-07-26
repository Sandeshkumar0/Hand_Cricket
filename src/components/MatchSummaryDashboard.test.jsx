import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MatchSummaryDashboard from './MatchSummaryDashboard';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/audio';

// Mock contexts and utils
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
  },
}));

describe('MatchSummaryDashboard Component', () => {
  const defaultProps = {
    matchStats: {
      player: {
        runs: 50,
        ballsFaced: 25,
        dismissals: 1,
        fours: 4,
        sixes: 3,
        dotBalls: 5,
        wickets: 2,
        runsConceded: 20,
        ballsBowled: 12,
      },
      bot: {
        runs: 45,
        ballsFaced: 30,
        dismissals: 2,
        fours: 3,
        sixes: 2,
        dotBalls: 10,
        wickets: 1,
        runsConceded: 50,
        ballsBowled: 25,
      },
    },
    ballLog: [
      { innings: 1, runs: 4, playerRole: 'batter' },
      { innings: 1, runs: 6, playerRole: 'batter' },
      { innings: 2, runs: 2, playerRole: 'bowler' },
      { innings: 2, runs: 0, playerRole: 'bowler' },
    ],
    matchSettings: {},
    onProceedToMotm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      currentUser: { displayName: 'TestUser' },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders correctly with default props', () => {
    render(<MatchSummaryDashboard {...defaultProps} />);
    expect(screen.getAllByText('MATCH SUMMARY DASHBOARD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TestUser').length).toBeGreaterThan(0); // Top scorer
  });

  it('handles default player name if user is not authenticated', () => {
    useAuth.mockReturnValue({ currentUser: null });
    render(<MatchSummaryDashboard {...defaultProps} />);
    // "Player" should appear in top scorer/bowler if they are top
    expect(screen.getAllByText('Player').length).toBeGreaterThan(0);
  });

  it('switches between charts', () => {
    render(<MatchSummaryDashboard {...defaultProps} />);
    
    // Default is manhattan (Worm Chart)
    expect(screen.getAllByText('INN 1: TestUser').length).toBeGreaterThan(0);
    
    // Switch to boundaries
    const boundaryTab = screen.getByRole('button', { name: /BOUNDARY BREAKDOWN/i });
    fireEvent.click(boundaryTab);
    
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(screen.getByText('4s SCORED')).toBeInTheDocument();
    expect(screen.queryByText('INN 1: TestUser')).not.toBeInTheDocument();
  });

  it('calls onProceedToMotm when button is clicked', () => {
    render(<MatchSummaryDashboard {...defaultProps} />);
    const proceedBtn = screen.getAllByText('REVEAL MAN OF THE MATCH')[0];
    fireEvent.click(proceedBtn);
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(defaultProps.onProceedToMotm).toHaveBeenCalledTimes(1);
  });

  it('handles empty stats and ballLog safely', () => {
    const emptyProps = {
      matchStats: {
        player: {},
        bot: {},
      },
      ballLog: [],
      matchSettings: {},
      onProceedToMotm: vi.fn(),
    };
    render(<MatchSummaryDashboard {...emptyProps} />);
    expect(screen.getAllByText('MATCH SUMMARY DASHBOARD').length).toBeGreaterThan(0);
    // Default STRIKE RATE should be 0.0
    const zeroRates = screen.getAllByText('0.0');
    expect(zeroRates.length).toBeGreaterThan(0);
  });

  it('determines bot as top performer if bot stats are higher', () => {
    const botHighProps = {
      ...defaultProps,
      matchStats: {
        player: {
          runs: 10,
          wickets: 0,
          runsConceded: 50,
          ballsBowled: 12,
          fours: 0,
          sixes: 0,
        },
        bot: {
          runs: 100,
          wickets: 5,
          runsConceded: 10,
          ballsBowled: 12,
          fours: 10,
          sixes: 5,
        },
      },
      ballLog: [
        { innings: 1, runs: 0, playerRole: 'bowler' }
      ]
    };
    render(<MatchSummaryDashboard {...botHighProps} />);
    
    // Bot AI should be top scorer and bowler
    const botLabels = screen.getAllByText('Bot AI');
    expect(botLabels.length).toBeGreaterThan(1);
  });

  it('covers branches for bot batting first', () => {
    const reversedProps = {
      ...defaultProps,
      ballLog: [
        { innings: 1, runs: 0, playerRole: 'bowler' },
        { innings: 2, runs: 4, playerRole: 'batter' }
      ]
    };
    render(<MatchSummaryDashboard {...reversedProps} />);
    const boundaryTab = screen.getByRole('button', { name: /BOUNDARY BREAKDOWN/i });
    fireEvent.click(boundaryTab);
    expect(screen.getByText('4s SCORED')).toBeInTheDocument();
  });
});
