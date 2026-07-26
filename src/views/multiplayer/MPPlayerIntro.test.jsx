import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MPPlayerIntro from './MPPlayerIntro';
import { useMultiplayer } from '../../context/MultiplayerContext';

// Mock dependencies
vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon" />,
  Target: () => <div data-testid="target-icon" />,
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: ({ token, className, fallbackClassName }) => (
    <div data-testid="player-marker">{token}</div>
  ),
}));

describe('MPPlayerIntro', () => {
  const dispatchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_PLAYER_INTRO',
        activeBatterId: 'p1',
        activeBowlerId: 'p2',
        players: {
          p1: { name: 'Player 1', emoji: '🏏' },
          p2: { name: 'Player 2', emoji: '🎾' },
        },
        battingTeam: 'teamA',
        bowlingTeam: 'teamB',
        currentPlayerId: 'p1',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the intro correctly', () => {
    render(<MPPlayerIntro />);

    expect(screen.getByText('Next Battle')).toBeInTheDocument();
    expect(screen.getByText('Team A batting vs Team B bowling')).toBeInTheDocument();
    
    expect(screen.getByText('Now Batting')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    
    expect(screen.getByText('Coming To Bowl')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();

    const markers = screen.getAllByTestId('player-marker');
    expect(markers[0]).toHaveTextContent('🏏');
    expect(markers[1]).toHaveTextContent('🎾');
  });

  it('renders correctly with teamB batting and teamA bowling', () => {
    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_PLAYER_INTRO',
        activeBatterId: 'p1',
        activeBowlerId: 'p2',
        players: {
          p1: { name: 'Player 1', emoji: '🏏' },
          p2: { name: 'Player 2', emoji: '🎾' },
        },
        battingTeam: 'teamB',
        bowlingTeam: 'teamA',
        currentPlayerId: 'p1',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });

    render(<MPPlayerIntro />);
    expect(screen.getByText('Team B batting vs Team A bowling')).toBeInTheDocument();
  });

  it('handles missing player data', () => {
    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_PLAYER_INTRO',
        activeBatterId: 'p1',
        activeBowlerId: 'p2',
        players: {},
        battingTeam: 'teamA',
        bowlingTeam: 'teamB',
        currentPlayerId: 'p1',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });

    render(<MPPlayerIntro />);
    const pendingNames = screen.getAllByText('Pending');
    expect(pendingNames).toHaveLength(2);
  });

  it('dispatches MP_ADVANCE_PLAYER_INTRO after 2 seconds if host', () => {
    render(<MPPlayerIntro />);

    expect(dispatchMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_ADVANCE_PLAYER_INTRO' });
  });

  it('does not dispatch if not in MP_PLAYER_INTRO phase', () => {
    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_MATCH',
        activeBatterId: 'p1',
        activeBowlerId: 'p2',
        players: {
          p1: { name: 'Player 1', emoji: '🏏' },
          p2: { name: 'Player 2', emoji: '🎾' },
        },
        battingTeam: 'teamA',
        bowlingTeam: 'teamB',
        currentPlayerId: 'p1',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });

    render(<MPPlayerIntro />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('does not dispatch if not host', () => {
    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_PLAYER_INTRO',
        activeBatterId: 'p1',
        activeBowlerId: 'p2',
        players: {
          p1: { name: 'Player 1', emoji: '🏏' },
          p2: { name: 'Player 2', emoji: '🎾' },
        },
        battingTeam: 'teamA',
        bowlingTeam: 'teamB',
        currentPlayerId: 'p2',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });

    render(<MPPlayerIntro />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('does not dispatch if no activeBatterId', () => {
    useMultiplayer.mockReturnValue({
      state: {
        phase: 'MP_PLAYER_INTRO',
        activeBatterId: null,
        activeBowlerId: 'p2',
        players: {
          p1: { name: 'Player 1', emoji: '🏏' },
          p2: { name: 'Player 2', emoji: '🎾' },
        },
        battingTeam: 'teamA',
        bowlingTeam: 'teamB',
        currentPlayerId: 'p1',
        hostId: 'p1',
      },
      dispatch: dispatchMock,
    });

    render(<MPPlayerIntro />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('cleans up timeout on unmount', () => {
    const { unmount } = render(<MPPlayerIntro />);
    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
