import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SuperOverMatch from './SuperOverMatch';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Zap: () => <svg data-testid="zap-icon" />,
}));

vi.mock('../../components/CricketIcons', () => ({
  CricketBallIcon: () => <svg data-testid="cricket-ball" />,
  CricketBatIcon: () => <svg data-testid="cricket-bat" />,
}));

vi.mock('../../components/NumberPad', () => ({
  default: ({ options, onSelect, disabled }) => (
    <div data-testid="number-pad">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onSelect(opt)}
          data-testid={`num-${opt}`}
        >
          {opt}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
  SUPER_OVER_BALLS: 6,
}));

describe('SuperOverMatch', () => {
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
    phase: 'MP_SUPER_OVER',
    currentPlayerId: 'p1',
    hostId: 'p1',
    seriesWinner: null,
    players: {
      p1: { id: 'p1', name: 'Player 1', isBot: false },
      p2: { id: 'p2', name: 'Player 2', isBot: false },
      bot1: { id: 'bot1', name: 'Bot 1', isBot: true },
    },
    superOver: {
      innings: 1,
      battingTeam: 'teamA',
      activeBatterId: 'p1',
      activeBowlerId: 'p2',
      score: { teamA: 10, teamB: 0 },
      wickets: { teamA: 0, teamB: 0 },
      ballsBowled: 2,
      lockedMoves: { batterMove: null, bowlerMove: null },
      ballLog: [],
      target: null,
    }
  };

  it('renders correctly for MP_SUPER_OVER_RESULT', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SUPER_OVER_RESULT',
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByText('Super Over Complete')).toBeInTheDocument();
    
    const nextBtn = screen.getByRole('button', { name: /Next Match/i });
    fireEvent.click(nextBtn);
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_FINISH_SUPER_OVER' });
  });

  it('shows View Series Result when seriesWinner exists', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SUPER_OVER_RESULT',
        seriesWinner: 'teamA',
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByRole('button', { name: /View Series Result/i })).toBeInTheDocument();
  });

  it('shows waiting message for non-host on RESULT phase', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_SUPER_OVER_RESULT',
        currentPlayerId: 'p2',
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByText(/Waiting for host to continue the series/i)).toBeInTheDocument();
  });

  it('shows out overlay and handles continue click', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_RESOLVE_SO',
        superOver: {
          ...defaultState.superOver,
          lockedMoves: { batterMove: 4, bowlerMove: 4 },
        }
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByText('OUT!')).toBeInTheDocument();
    
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_PROCESS_SO_RESOLUTION' });
  });

  it('allows batter to pick a move', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    const numPad = screen.getByTestId('num-3');
    fireEvent.click(numPad);
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_SUBMIT_SO_MOVE',
      payload: { role: 'batter', move: 3 }
    });
  });

  it('allows bowler to pick a move', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2',
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    const numPad = screen.getByTestId('num-4');
    fireEvent.click(numPad);
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_SUBMIT_SO_MOVE',
      payload: { role: 'bowler', move: 4 }
    });
  });

  it('does not allow action if not batter or bowler', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'bot1',
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByText(/Player 1 is batting/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 2 is bowling/i)).toBeInTheDocument();
  });

  it('auto plays for bot batter', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          activeBatterId: 'bot1',
        },
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MP_SUBMIT_SO_MOVE',
        payload: expect.objectContaining({ role: 'batter' })
      })
    );
  });

  it('auto plays for bot bowler', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          activeBowlerId: 'bot1',
        },
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MP_SUBMIT_SO_MOVE',
        payload: expect.objectContaining({ role: 'bowler' })
      })
    );
  });

  it('processes resolution automatically after delay', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_RESOLVE_SO',
        superOver: {
          ...defaultState.superOver,
          lockedMoves: { batterMove: 2, bowlerMove: 4 }, // Not out
        }
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_PROCESS_SO_RESOLUTION' });
  });

  it('renders ball log correctly', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        superOver: {
          ...defaultState.superOver,
          ballLog: [
            { innings: 1, runs: 0, isOut: true },
            { innings: 1, runs: 4, isOut: false },
            { innings: 1, runs: 0, isOut: false },
          ]
        }
      },
      dispatch: dispatchMock,
    });

    render(<SuperOverMatch />);
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();
  });
});
