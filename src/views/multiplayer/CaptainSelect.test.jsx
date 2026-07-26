import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CaptainSelect from './CaptainSelect';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
  SELECTION_TIMER: 15,
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: () => <div data-testid="player-marker">Marker</div>,
}));

vi.mock('../../components/ShotClock', () => ({
  default: ({ onExpire }) => (
    <div data-testid="shot-clock">
      <button onClick={onExpire}>Expire</button>
    </div>
  ),
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: ({ children, whileTap, ...props }) => <button {...props}>{children}</button>,
    },
  };
});

describe('CaptainSelect', () => {
  const mockDispatch = vi.fn();
  
  const defaultState = {
    phase: 'MP_SELECT_BATTER',
    battingTeam: 'teamA',
    bowlingTeam: 'teamB',
    teams: {
      teamA: { captainId: 'p1', roster: ['p1', 'p2'] },
      teamB: { captainId: 'p3', roster: ['p3', 'p4'] },
    },
    players: {
      p1: { id: 'p1', name: 'Player 1', emoji: '🧑', isBot: false },
      p2: { id: 'p2', name: 'Player 2', emoji: '👩', isBot: false },
      p3: { id: 'p3', name: 'Player 3', emoji: '🧑', isBot: true },
      p4: { id: 'p4', name: 'Player 4', emoji: '👩', isBot: false },
    },
    ballLog: [],
    lastOverBowlerId: null,
    currentPlayerId: 'p1',
    playerStats: {
      p1: { runs: 10, ballsFaced: 5, wickets: 0, runsConceded: 0 },
      p2: { runs: 0, ballsFaced: 0, wickets: 0, runsConceded: 0 },
      p3: { runs: 0, ballsFaced: 0, wickets: 1, runsConceded: 5 },
      p4: { runs: 0, ballsFaced: 0, wickets: 0, runsConceded: 0 },
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: mockDispatch,
    });
  });

  it('renders batter select for captain', () => {
    render(<CaptainSelect />);
    
    expect(screen.getByText('Select Batter')).toBeInTheDocument();
    expect(screen.getByText('Available Batters')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('renders bowler select for bowling captain', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SELECT_BOWLER',
        currentPlayerId: 'p3',
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Select Bowler')).toBeInTheDocument();
    expect(screen.getByText('Team B: Player 3\'s Decision')).toBeInTheDocument();
  });

  it('dispatches MP_SELECT_BATTER when batter is selected', () => {
    render(<CaptainSelect />);
    
    const p2Button = screen.getByText('Player 2').closest('button');
    fireEvent.click(p2Button);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_SELECT_BATTER', payload: 'p2' });
  });

  it('dispatches MP_SELECT_BOWLER when bowler is selected', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SELECT_BOWLER',
        currentPlayerId: 'p4', 
        teams: {
          ...defaultState.teams,
          teamB: { captainId: 'p4', roster: ['p3', 'p4'] }
        }
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    const p3Button = screen.getByText('Player 3').closest('button');
    fireEvent.click(p3Button);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_SELECT_BOWLER', payload: 'p3' });
  });

  it('disables dismissed batters', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        ballLog: [{ isOut: true, batterId: 'p2' }],
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Dismissed')).toBeInTheDocument();
    const p2Button = screen.getByText('Player 2').closest('button');
    expect(p2Button).toBeDisabled();
  });

  it('disables last over bowler if roster > 1', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SELECT_BOWLER',
        currentPlayerId: 'p4',
        teams: {
          ...defaultState.teams,
          teamB: { captainId: 'p4', roster: ['p3', 'p4'] }
        },
        lastOverBowlerId: 'p3',
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Last Over')).toBeInTheDocument();
    const p3Button = screen.getByText('Player 3').closest('button');
    expect(p3Button).toBeDisabled();
  });

  it('dispatches auto select when timer expires', () => {
    render(<CaptainSelect />);
    
    const expireButton = screen.getByText('Expire');
    fireEvent.click(expireButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_AUTO_SELECT_BATTER' });
  });

  it('auto selects for bot captains', () => {
    vi.useFakeTimers();
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SELECT_BOWLER',
        currentPlayerId: 'p1', 
        teams: {
          ...defaultState.teams,
          teamB: { captainId: 'p3', roster: ['p3', 'p4'] } 
        },
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_AUTO_SELECT_BOWLER' });
    vi.useRealTimers();
  });

  it('shows waiting message for non-captain team members', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2',
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Waiting for Player 1 to choose the next batter...')).toBeInTheDocument();
  });

  it('shows waiting message for non-captain team members (bowler)', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SELECT_BOWLER',
        currentPlayerId: 'p4',
        players: {
          ...defaultState.players,
          p3: { ...defaultState.players.p3, isBot: false }, // Must not be bot to show waiting message
        }
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Waiting for Player 3 to choose the next bowler...')).toBeInTheDocument();
  });

  it('shows waiting panel for opposite team members', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p3',
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    
    expect(screen.getByText('Team A is making the next call')).toBeInTheDocument();
  });

  it('handles missing team roster', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        teams: {
          teamA: { captainId: 'p1' }, // no roster
        },
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    expect(screen.queryByText('Player 2')).not.toBeInTheDocument();
  });

  it('handles player not found in roster', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        teams: {
          teamA: { captainId: 'p1', roster: ['p1', 'p999'] }, // p999 doesn't exist
        },
      },
      dispatch: mockDispatch,
    });

    render(<CaptainSelect />);
    expect(screen.queryByText('Player 999')).not.toBeInTheDocument();
  });
});
