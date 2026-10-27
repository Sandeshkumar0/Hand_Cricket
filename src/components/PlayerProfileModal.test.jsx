import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlayerProfileModal from './PlayerProfileModal';
import { soundEngine } from '../utils/audio';

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
  },
}));

describe('PlayerProfileModal Component', () => {
  const defaultStats = {
    name: 'TestPlayer',
    team: 'TestTeam',
    role: 'Batter',
    avatar: '😎',
    matchesPlayed: 10,
    wins: 5,
    runs: 500,
    ballsFaced: 300,
    highestScore: 100,
    fours: 50,
    sixes: 20,
    fifties: 3,
    hundreds: 1,
    ducks: 0,
    notOuts: 2,
    wickets: 5,
    oversBowled: 20,
    runsConceded: 150,
    maidens: 1,
    dotBalls: 40,
    bestBowlingWickets: 3,
    bestBowlingRuns: 20,
    motmAwards: 2,
    totalCareerPoints: 1000,
    recentForm: ['W', 'L', 'W', 'W', 'L'],
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    playerStats: defaultStats,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<PlayerProfileModal {...defaultProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when playerStats is null', () => {
    const { container } = render(<PlayerProfileModal {...defaultProps} playerStats={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly with default props', () => {
    render(<PlayerProfileModal {...defaultProps} />);
    expect(screen.getAllByText('TestPlayer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TestTeam').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Batter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('😎').length).toBeGreaterThan(0);
  });

  it('calls onClose when close button is clicked', () => {
    render(<PlayerProfileModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    // First button is close
    fireEvent.click(closeButtons[0]);
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs', () => {
    render(<PlayerProfileModal {...defaultProps} />);
    
    // Default is batting
    expect(screen.getAllByText('BATTING AVERAGE').length).toBeGreaterThan(0);
    
    // Switch to bowling
    const bowlingTab = screen.getAllByText('BOWLING STATS')[0];
    fireEvent.click(bowlingTab);
    
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(screen.getAllByText('BOWLING AVERAGE').length).toBeGreaterThan(0);

    // Switch to extra
    const extraTab = screen.getAllByText('CAREER & FORM')[0];
    fireEvent.click(extraTab);
    expect(screen.getAllByText('MOTM AWARDS').length).toBeGreaterThan(0);
  });

  it('handles empty/zero stats correctly to avoid NaN', () => {
    const zeroStats = {
      matchesPlayed: 0,
      wins: 0,
      runs: 0,
      ballsFaced: 0,
      notOuts: 0,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
    };
    render(<PlayerProfileModal {...defaultProps} playerStats={zeroStats} />);
    
    // It should render 0.00 for averages and 0.0 for strike rate
    const zeros = screen.getAllByText('0.00');
    expect(zeros.length).toBeGreaterThan(0);
    
    
    const zeroPointZero = screen.getAllByText('0.0');
    expect(zeroPointZero.length).toBeGreaterThan(0);

    const bowlingTab = screen.getAllByText('BOWLING STATS')[0];
    fireEvent.click(bowlingTab);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
