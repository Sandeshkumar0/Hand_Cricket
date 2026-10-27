import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SuperOverSetup from './SuperOverSetup';
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
  Lock: () => <svg data-testid="lock-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  AlertTriangle: () => <svg data-testid="alert-icon" />,
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: ({ token }) => <div data-testid="player-marker">{token}</div>,
}));

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

describe('SuperOverSetup', () => {
  let dispatchMock;

  beforeEach(() => {
    dispatchMock = vi.fn();
    vi.useFakeTimers();
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const defaultState = {
    teams: {
      teamA: { roster: ['p1', 'p2', 'p3'], captainId: 'p1' },
      teamB: { roster: ['p4', 'p5'], captainId: 'p4' },
    },
    players: {
      p1: { id: 'p1', name: 'Player 1', emoji: '1️⃣', isBot: false },
      p2: { id: 'p2', name: 'Player 2', emoji: '2️⃣', isBot: false },
      p3: { id: 'p3', name: 'Player 3', emoji: '3️⃣', isBot: false },
      p4: { id: 'p4', name: 'Player 4', emoji: '4️⃣', isBot: false },
      p5: { id: 'p5', name: 'Player 5', emoji: '5️⃣', isBot: false },
      bot1: { id: 'bot1', name: 'Bot 1', emoji: '🤖', isBot: true },
    },
    captains: { teamA: 'p1', teamB: 'p4' },
    superOver: {
      sequence: 1,
      teamALocked: false,
      teamBLocked: false,
      teamASelections: null,
      teamBSelections: null,
      initialBattingTeam: 'teamA',
    },
    currentPlayerId: 'p1',
    hostId: 'p1',
    battingTeam: 'teamA',
  };

  it('renders correctly for team A captain', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    expect(screen.getByText('Super Over 1')).toBeInTheDocument();
    expect(screen.getByText('Team A bats first in this Super Over')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText(/Player 1's Super Over Lock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lock Selections/i })).toBeDisabled();
  });

  it('allows captain to toggle batters and select bowler', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    
    // Select batters (requires 2 for team A since roster length > 1)
    const p1BatBtn = screen.getAllByText('Player 1')[0].closest('button');
    const p2BatBtn = screen.getAllByText('Player 2')[0].closest('button');
    const p3BatBtn = screen.getAllByText('Player 3')[0].closest('button');
    
    fireEvent.click(p1BatBtn);
    fireEvent.click(p2BatBtn);
    
    // Try to select a 3rd batter (should be ignored or just remain 2)
    fireEvent.click(p3BatBtn);
    
    // Select bowler
    // Since roster is 3, bowler cannot be a batter
    const p3BowlBtns = screen.getAllByText('Player 3');
    // The second 'Player 3' is the bowler button
    const p3BowlBtn = p3BowlBtns[1].closest('button');
    
    fireEvent.click(p3BowlBtn);

    const lockBtn = screen.getByRole('button', { name: /Lock Selections/i });
    expect(lockBtn).not.toBeDisabled();
    
    fireEvent.click(lockBtn);
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_LOCK_SUPER_OVER_SELECTIONS',
      payload: {
        team: 'teamA',
        batters: ['p1', 'p2'],
        bowler: 'p3'
      }
    });
  });

  it('handles forfeit', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    const forfeitBtn = screen.getByRole('button', { name: /Forfeit Match/i });
    fireEvent.click(forfeitBtn);
    
    expect(window.confirm).toHaveBeenCalledWith('Forfeit this match and award the win to the other team?');
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_FORFEIT_MATCH' });
  });

  it('auto locks for bot captain', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        teams: {
          ...defaultState.teams,
          teamA: { roster: ['bot1'], captainId: 'bot1' }
        },
        captains: { teamA: 'bot1', teamB: 'p4' },
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_LOCK_SUPER_OVER_SELECTIONS',
      payload: expect.objectContaining({ team: 'teamA' })
    });
  });

  it('renders spectator view if not in a team', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'spectator1'
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    expect(screen.getByText('Super Over Lineups')).toBeInTheDocument();
  });
  
  it('renders locked view', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          teamALocked: true,
          teamASelections: {
            batters: ['p1', 'p2'],
            bowler: 'p3'
          }
        }
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    expect(screen.getByText('Team A Locked')).toBeInTheDocument();
    expect(screen.getByText('Batter: Player 1')).toBeInTheDocument();
    expect(screen.getByText('Batter: Player 2')).toBeInTheDocument();
    expect(screen.getByText('Bowler: Player 3')).toBeInTheDocument();
  });

  it('allows deselecting a batter', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverSetup />);
    const p1BatBtn = screen.getAllByText('Player 1')[0].closest('button');
    fireEvent.click(p1BatBtn); // select
    fireEvent.click(p1BatBtn); // deselect
    // lock should be disabled
    expect(screen.getByRole('button', { name: /Lock Selections/i })).toBeDisabled();
  });
  
  it('shows waiting text if one team is locked and other is not', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          teamALocked: true,
          teamASelections: { batters: ['p1'], bowler: 'p1' }
        }
      },
      dispatch: dispatchMock,
    });
    
    render(<SuperOverSetup />);
    expect(screen.getByText(/Waiting for the other captain to lock selections/i)).toBeInTheDocument();
  });

});
