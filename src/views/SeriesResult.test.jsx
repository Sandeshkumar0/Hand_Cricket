import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SeriesResult from './SeriesResult';
import { useGame } from '../context/GameContext';
import { soundEngine } from '../utils/audio';

vi.mock('../context/GameContext', () => ({
  useGame: vi.fn(),
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
    playCrowdCheer: vi.fn(),
    playWicketSound: vi.fn(),
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

describe('SeriesResult Component', () => {
  let mockDispatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
    
    useGame.mockReturnValue({
      state: {
        series_scores: { player: 2, bot: 1 },
        match_results: [
          { matchNumber: 1, winner: 'player', playerScore: 50, botScore: 40 },
          { matchNumber: 2, winner: 'bot', playerScore: 30, botScore: 35 },
          { matchNumber: 3, winner: 'player', playerScore: 60, botScore: 55 },
        ],
        series_winner: 'player',
        match_settings: { series_length: 3 },
      },
      dispatch: mockDispatch,
    });
  });

  it('renders victory state when player wins', () => {
    render(<SeriesResult />);
    
    expect(screen.getByTestId('motorsport-hud')).toHaveTextContent('BEST OF 3 CIRCUIT COMPLETED');
    expect(screen.getByText('🏆 SERIES VICTORY!')).toBeInTheDocument();
    expect(screen.getByText('SERIES RESULT: 2 - 1')).toBeInTheDocument();
    
    // Check match breakdown
    expect(screen.getByText('MATCH 1')).toBeInTheDocument();
    expect(screen.getAllByText('YOU WON').length).toBe(2);
    expect(screen.getByText('BOT WON')).toBeInTheDocument();
    
    expect(soundEngine.playCrowdCheer).toHaveBeenCalledWith(true);
    expect(soundEngine.playWicketSound).not.toHaveBeenCalled();
  });

  it('renders defeat state when bot wins', () => {
    useGame.mockReturnValue({
      state: {
        series_scores: { player: 1, bot: 2 },
        match_results: [
          { matchNumber: 1, winner: 'bot', playerScore: 20, botScore: 25 },
          { matchNumber: 2, winner: 'player', playerScore: 40, botScore: 30 },
          { matchNumber: 3, winner: 'bot', playerScore: 10, botScore: 15 },
        ],
        series_winner: 'bot',
        match_settings: { series_length: 3 },
      },
      dispatch: mockDispatch,
    });
    
    render(<SeriesResult />);
    
    expect(screen.getByText('🤖 BOT WINS SERIES')).toBeInTheDocument();
    expect(screen.getByText('SERIES RESULT: 1 - 2')).toBeInTheDocument();
    
    expect(soundEngine.playWicketSound).toHaveBeenCalled();
    expect(soundEngine.playCrowdCheer).not.toHaveBeenCalled();
  });

  it('handles new championship series button click', () => {
    render(<SeriesResult />);
    fireEvent.click(screen.getByText('NEW CHAMPIONSHIP SERIES'));
    
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_GAME' });
  });
});
