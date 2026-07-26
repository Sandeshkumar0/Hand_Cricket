import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SuperOverReveal from './SuperOverReveal';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('lucide-react', () => ({
  Shield: () => <svg data-testid="shield-icon" />,
  Target: () => <svg data-testid="target-icon" />,
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: ({ token }) => <div data-testid="player-marker">{token}</div>,
}));

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

describe('SuperOverReveal', () => {
  let dispatchMock;

  beforeEach(() => {
    dispatchMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const defaultState = {
    phase: 'MP_SUPER_OVER_REVEAL',
    currentPlayerId: 'p1',
    hostId: 'p1',
    superOver: {
      sequence: 1,
      teamASelections: {
        batters: ['p1', 'p2'],
        bowler: 'p1'
      },
      teamBSelections: {
        batters: ['p3'],
        bowler: 'p4'
      }
    },
    players: {
      p1: { id: 'p1', name: 'Player 1', emoji: '😎' },
      p2: { id: 'p2', name: 'Player 2', emoji: '🤓' },
      p3: { id: 'p3', name: 'Player 3', emoji: '🤠' },
      p4: { id: 'p4', name: 'Player 4', emoji: '🤡' },
    }
  };

  it('renders correctly', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverReveal />);
    
    expect(screen.getByText('Super Over 1')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getAllByText('Player 1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player 2')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player 3')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player 4')[0]).toBeInTheDocument();
  });

  it('dispatches advance action automatically if host', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverReveal />);
    
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_ADVANCE_SUPER_OVER_REVEAL' });
  });

  it('does not dispatch advance action if not host', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2'
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverReveal />);
    
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('renders PlayerPill gracefully without a player', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          teamASelections: null, // No selections
        }
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverReveal />);
    expect(screen.getByText('Team A')).toBeInTheDocument();
  });
});
