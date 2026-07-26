import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MPToss from './MPToss';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
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
}));

describe('MPToss', () => {
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
    phase: 'MP_TOSS',
    captains: { teamA: 'p1', teamB: 'p2' },
    tossAssignment: { odd: null, even: null },
    tossMoves: { captainA: null, captainB: null },
    tossWinner: null,
    players: {
      p1: { id: 'p1', name: 'Player 1' },
      p2: { id: 'p2', name: 'Player 2' },
      p3: { id: 'p3', name: 'Player 3' },
    },
    currentPlayerId: 'p1',
    hostId: 'p1',
  };

  it('renders correctly initially with no claims', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    expect(screen.getByText('The Toss')).toBeInTheDocument();
    expect(screen.getByText('Claim Odd or Even')).toBeInTheDocument();
  });

  it('allows claiming odd or even', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    fireEvent.click(screen.getByRole('button', { name: /odd/i }));
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_CLAIM_TOSS_SIDE',
      payload: { side: 'odd' },
    });

    fireEvent.click(screen.getByRole('button', { name: /even/i }));
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_CLAIM_TOSS_SIDE',
      payload: { side: 'even' },
    });
  });

  it('shows waiting message when side is claimed but not complete', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        tossAssignment: { odd: 'p1', even: null },
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    expect(screen.getByText(/Waiting for the other captain/i)).toBeInTheDocument();
  });

  it('auto assigns if host and timer expires', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        tossAssignment: { odd: 'p1', even: null },
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_AUTO_ASSIGN_TOSS_SIDE' });
  });

  it('does not auto assign if not host', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2', // Not host
        tossAssignment: { odd: 'p1', even: null },
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('shows NumberPad and handles pick when assignment is complete', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        tossAssignment: { odd: 'p1', even: 'p2' },
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    expect(screen.getByText(/pick your toss number/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('num-3'));
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_SUBMIT_TOSS_MOVE',
      payload: { who: 'captainA', move: 3 },
    });
  });

  it('disables number pad when move is locked', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        tossAssignment: { odd: 'p1', even: 'p2' },
        tossMoves: { captainA: 3, captainB: null },
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    expect(screen.getByText(/You locked in your toss number/i)).toBeInTheDocument();
    const btn = screen.getByTestId('num-3');
    expect(btn).toBeDisabled();
  });

  it('shows toss result phase and advances after timer', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: 'MP_TOSS_RESULT',
        tossAssignment: { odd: 'p1', even: 'p2' },
        tossMoves: { captainA: 3, captainB: 2 },
        tossWinner: 'teamA',
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    
    expect(screen.getByText('5 (Odd)')).toBeInTheDocument();
    expect(screen.getByText(/Player 1 wins the toss/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'MP_ADVANCE_AFTER_TOSS' });
  });

  it('renders correctly for a non-captain player', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p3', // Not a captain
      },
      dispatch: dispatchMock,
    });

    render(<MPToss />);
    expect(screen.getByText(/Captains are claiming sides and getting ready/i)).toBeInTheDocument();
  });
});
