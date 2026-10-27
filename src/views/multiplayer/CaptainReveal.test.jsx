import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CaptainReveal from './CaptainReveal';
import { useMultiplayer } from '../../context/MultiplayerContext';

// Mock dependencies
vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: ({ token }) => <div data-testid="player-marker">{token}</div>,
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }) => {
        const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props;
        return <div {...rest}>{children}</div>;
      },
      h2: ({ children, ...props }) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <h2 {...rest}>{children}</h2>;
      },
      p: ({ children, ...props }) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <p {...rest}>{children}</p>;
      },
      span: ({ children, ...props }) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <span {...rest}>{children}</span>;
      },
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

describe('CaptainReveal', () => {
  const mockDispatch = vi.fn();
  
  const defaultState = {
    players: {
      p1: { id: 'p1', name: 'Player 1', emoji: '🧑' },
      p2: { id: 'p2', name: 'Player 2', emoji: '👩' },
    },
    captains: { teamA: 'p1', teamB: 'p2' },
    currentPlayerId: 'p1',
    hostId: 'p1',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: mockDispatch,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders intro stage initially', () => {
    render(<CaptainReveal />);
    
    expect(screen.getByText('Selecting Captains...')).toBeInTheDocument();
    expect(screen.getByText('The system is randomly choosing')).toBeInTheDocument();
    expect(screen.getAllByTestId('player-marker')).toHaveLength(2);
  });

  it('transitions to reveal stage after 1500ms', () => {
    render(<CaptainReveal />);
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Captains Revealed')).toBeInTheDocument();
    expect(screen.getByText('Captain A')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Captain B')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('dispatches MP_BEGIN_TOSS after 5500ms if current player is host', () => {
    render(<CaptainReveal />);
    
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_BEGIN_TOSS' });
  });

  it('does not dispatch MP_BEGIN_TOSS if current player is not host', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2',
      },
      dispatch: mockDispatch,
    });

    render(<CaptainReveal />);
    
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('handles missing captain gracefully', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        captains: { teamA: null, teamB: null },
      },
      dispatch: mockDispatch,
    });

    render(<CaptainReveal />);
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getAllByText('Pending')).toHaveLength(2);
  });

  it('clears timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<CaptainReveal />);
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
  });
});
