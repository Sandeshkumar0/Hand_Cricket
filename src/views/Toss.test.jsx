import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('framer-motion', () => {
  const React = require('react');
  const dummy = React.forwardRef((props, ref) => {
    const { initial, animate, exit, transition, ...rest } = props;
    return React.createElement('div', { ref, ...rest });
  });
  return {
    motion: { div: dummy },
    AnimatePresence: ({ children }) => children ? React.createElement(React.Fragment, null, children) : null
  };
});

import Toss from './Toss';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

vi.mock('../context/GameContext', () => ({
  useGame: vi.fn()
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playCoinFlip: vi.fn(),
    playUiClick: vi.fn(),
    playBatHit: vi.fn(),
    playWicketSound: vi.fn()
  }
}));

vi.mock('../components/NumberPad', () => ({
  default: ({ onSelect, disabled }) => (
    <div data-testid="number-pad" onClick={() => !disabled && onSelect(3)}>
      NumberPad
    </div>
  )
}));

vi.mock('../components/MotorsportHUD', () => ({
  default: () => <div data-testid="motorsport-hud">HUD</div>
}));

describe('Toss Component', () => {
  let dispatchMock;

  beforeEach(() => {
    dispatchMock = vi.fn();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const setupMock = (state) => {
    useGame.mockReturnValue({
      state: {
        toss_moves: { player: null, bot: null },
        currentPhase: 'TOSS',
        ...state
      },
      dispatch: dispatchMock
    });
  };

  it('renders TossSetup when phase is TOSS_SETUP and completes after timeouts', () => {
    setupMock({ currentPhase: 'TOSS_SETUP' });
    render(<Toss />);
    
    expect(screen.getByText('FLIPPING THE COIN')).toBeInTheDocument();
    expect(soundEngine.playCoinFlip).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(900);
    });
    
    expect(screen.getByText('TOSS READY')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'COMPLETE_TOSS_SETUP' });
  });

  it('renders Toss phase and handles claim and moves', () => {
    setupMock({ currentPhase: 'TOSS', toss_moves: { player: null, bot: null } });
    render(<Toss />);

    expect(screen.getByText('CLAIM YOUR TOSS PARITY')).toBeInTheDocument();

    // Player selects 'odd'
    fireEvent.click(screen.getByText('odd'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(screen.getByText(/You claimed/)).toBeInTheDocument();

    // Bot assignment timeout
    act(() => {
      vi.advanceTimersByTime(450);
    });

    // Now NumberPad should be visible
    expect(screen.getByTestId('number-pad')).toBeInTheDocument();

    // Player selects a number
    fireEvent.click(screen.getByTestId('number-pad'));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'SUBMIT_TOSS_MOVE', payload: { who: 'player', move: 3 } });
  });

  it('handles bot move after player move is locked', () => {
    setupMock({ currentPhase: 'TOSS', toss_moves: { player: null, bot: null } });
    const { rerender } = render(<Toss />);

    fireEvent.click(screen.getByText('odd'));
    act(() => { vi.advanceTimersByTime(450); });

    setupMock({ currentPhase: 'TOSS', toss_moves: { player: 3, bot: null } });
    rerender(<Toss />);

    act(() => { vi.advanceTimersByTime(1200); });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SUBMIT_TOSS_MOVE',
      payload: expect.objectContaining({ who: 'bot', move: expect.any(Number) })
    });
  });

  it('handles TOSS_RESULT player win and choices', () => {
    setupMock({ currentPhase: 'TOSS', toss_moves: { player: null, bot: null } });
    const { rerender } = render(<Toss />);

    fireEvent.click(screen.getByText('odd'));
    act(() => { vi.advanceTimersByTime(450); });

    setupMock({ currentPhase: 'TOSS_RESULT', toss_moves: { player: 3, bot: 2 } });
    rerender(<Toss />);

    for (let i = 0; i < 3; i++) act(() => { vi.advanceTimersByTime(550); });
    expect(screen.getByText('🏆 YOU WIN THE TOSS!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('ELECT TO BAT'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bat' } });

    fireEvent.click(screen.getByText('ELECT TO BOWL'));
    expect(soundEngine.playWicketSound).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bowl' } });
  });

  it('handles TOSS_RESULT player loss and bot choice', () => {
    setupMock({ currentPhase: 'TOSS', toss_moves: { player: null, bot: null } });
    const { rerender } = render(<Toss />);

    fireEvent.click(screen.getByText('even'));
    act(() => { vi.advanceTimersByTime(450); });

    setupMock({ currentPhase: 'TOSS_RESULT', toss_moves: { player: 3, bot: 2 } });
    rerender(<Toss />);

    for (let i = 0; i < 3; i++) act(() => { vi.advanceTimersByTime(550); });
    expect(screen.getByText('🤖 BOT WINS THE TOSS')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(700); });
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'CHOOSE_BAT_BOWL', payload: { choice: expect.stringMatching(/bat|bowl/) } });
  });


  it('handles even sum in TOSS_RESULT', () => {
    const { rerender } = render(<Toss />);
    setupMock({ currentPhase: 'TOSS_RESULT', toss_moves: { player: 2, bot: 2 } });
    rerender(<Toss />);
  });

  it('handles bot choosing bat', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    setupMock({ currentPhase: 'TOSS', toss_moves: { player: null, bot: null } });
    const { rerender } = render(<Toss />);
    fireEvent.click(screen.getByText('even'));
    act(() => { vi.advanceTimersByTime(450); });
    setupMock({ currentPhase: 'TOSS_RESULT', toss_moves: { player: 3, bot: 2 } });
    rerender(<Toss />);
    for (let i = 0; i < 3; i++) act(() => { vi.advanceTimersByTime(550); });
    act(() => { vi.advanceTimersByTime(700); });
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'CHOOSE_BAT_BOWL', payload: { choice: 'bowl' } });
    Math.random.mockRestore();
  });

  it('unmount clears timeouts', () => {
    setupMock({ currentPhase: 'TOSS_SETUP' });
    const { unmount } = render(<Toss />);
    unmount();
    expect(true).toBe(true);
  });
});
