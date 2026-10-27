import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Lobby from './Lobby';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

vi.mock('../context/GameContext', () => ({
  useGame: vi.fn(),
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
  },
}));

vi.mock('../components/MotorsportHUD', () => ({
  default: ({ title, subTitle, phaseName }) => (
    <div data-testid="motorsport-hud">
      {title} {subTitle} {phaseName}
    </div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('Lobby Component', () => {
  let mockDispatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
    
    useGame.mockReturnValue({
      state: {
        match_settings: {
          overs_per_innings: 5,
          series_length: 3,
          timer_duration: 15,
        },
        timerOptions: [0, 15, 30],
        overOptions: [1, 5, null],
      },
      dispatch: mockDispatch,
    });
  });

  it('renders correctly', () => {
    render(<Lobby />);
    
    expect(screen.getByTestId('motorsport-hud')).toBeInTheDocument();
    expect(screen.getByText('MATCH PROTOCOLS')).toBeInTheDocument();
    
    // Check Overs Options
    expect(screen.getByText('1 OVERS')).toBeInTheDocument();
    expect(screen.getByText('5 OVERS')).toBeInTheDocument();
    expect(screen.getByText('UNLIMITED (∞)')).toBeInTheDocument();
    
    // Check Series Length Options
    expect(screen.getByText('1 MATCH QUICK')).toBeInTheDocument();
    expect(screen.getByText('3 MATCH SERIES')).toBeInTheDocument();
    expect(screen.getByText('5 MATCH CHAMPIONSHIP')).toBeInTheDocument();
    
    // Check Timer Options
    expect(screen.getByText('OFF')).toBeInTheDocument();
    expect(screen.getByText('15 SEC')).toBeInTheDocument();
    expect(screen.getByText('30 SEC')).toBeInTheDocument();
  });

  it('handles overs update', () => {
    render(<Lobby />);
    fireEvent.click(screen.getByText('1 OVERS'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_OVERS', payload: 1 });
    
    fireEvent.click(screen.getByText('UNLIMITED (∞)'));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_OVERS', payload: null });
  });

  it('handles series length update', () => {
    render(<Lobby />);
    fireEvent.click(screen.getByText('1 MATCH QUICK'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_SERIES_LENGTH', payload: 1 });
  });

  it('handles timer update', () => {
    render(<Lobby />);
    fireEvent.click(screen.getByText('OFF'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_TIMER', payload: 0 });
  });

  it('handles start match button click', () => {
    render(<Lobby />);
    fireEvent.click(screen.getByText('START MATCH SERIES'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'START_MATCH' });
  });
});
