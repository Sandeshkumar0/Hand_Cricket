import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DraftPhase from './DraftPhase';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
  DRAFT_TIMER: 15,
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
      button: ({ children, whileHover, whileTap, ...props }) => <button {...props}>{children}</button>,
    },
  };
});

describe('DraftPhase', () => {
  const mockDispatch = vi.fn();
  
  const defaultState = {
    teams: {
      teamA: { roster: ['p1'] },
      teamB: { roster: ['p2'] },
    },
    draftPool: ['p3', 'p4'],
    draftTurn: 'teamA',
    captains: { teamA: 'p1', teamB: 'p2' },
    players: {
      p1: { id: 'p1', name: 'Captain A', emoji: '🧑', isBot: false },
      p2: { id: 'p2', name: 'Captain B', emoji: '👩', isBot: false },
      p3: { id: 'p3', name: 'Player 3', emoji: '🧑', isBot: false },
      p4: { id: 'p4', name: 'Player 4', emoji: '👩', isBot: true },
    },
    currentPlayerId: 'p1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: mockDispatch,
    });
  });

  it('renders DraftPhase correctly', () => {
    render(<DraftPhase />);
    
    expect(screen.getByText('The Draft')).toBeInTheDocument();
    expect(screen.getByText('2 players remaining')).toBeInTheDocument();
    expect(screen.getByText('Captain A\'s Turn')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();
  });

  it('dispatches MP_DRAFT_PICK when a player is selected', () => {
    render(<DraftPhase />);
    
    const p3Button = screen.getByText('Player 3').closest('button');
    fireEvent.click(p3Button);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_DRAFT_PICK', payload: { playerId: 'p3' } });
  });

  it('disables pick when it is not current player\'s turn', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2',
      },
      dispatch: mockDispatch,
    });

    render(<DraftPhase />);
    
    const p3Button = screen.getByText('Player 3').closest('button');
    expect(p3Button).toBeDisabled();
    expect(screen.getByText('Waiting for Captain A to make the next draft pick...')).toBeInTheDocument();
  });

  it('dispatches auto pick when timer expires', () => {
    render(<DraftPhase />);
    
    const expireButton = screen.getByText('Expire');
    fireEvent.click(expireButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_DRAFT_AUTO_PICK' });
  });

  it('auto picks for bots', () => {
    vi.useFakeTimers();
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        draftTurn: 'teamB',
        captains: { teamA: 'p1', teamB: 'p4' }, // p4 is bot
      },
      dispatch: mockDispatch,
    });

    render(<DraftPhase />);
    
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_DRAFT_AUTO_PICK' });
    vi.useRealTimers();
  });

  it('shows Draft complete when pool is empty', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        draftPool: [],
      },
      dispatch: mockDispatch,
    });

    render(<DraftPhase />);
    
    expect(screen.getByText('Draft complete!')).toBeInTheDocument();
  });

  it('handles missing team roster and unknown players gracefully', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        teams: {
          teamA: { roster: [] }, 
          teamB: { roster: ['p999'] }, // unknown player
        },
      },
      dispatch: mockDispatch,
    });

    render(<DraftPhase />);
    expect(screen.getAllByText('No picks yet').length).toBeGreaterThan(0);
  });
});
