import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManOfTheMatchCard from './ManOfTheMatchCard';
import { soundEngine } from '../utils/audio';

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playMatchVictorySound: vi.fn(),
    playUiClick: vi.fn(),
  },
}));

describe('ManOfTheMatchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('returns null if no motmInfo', () => {
    const { container } = render(<ManOfTheMatchCard motmInfo={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  const playerStats = {
    runs: 50,
    ballsFaced: 25,
    fours: 5,
    sixes: 2,
    wickets: 1,
    ballsBowled: 12,
    runsConceded: 10,
    dotBalls: 4,
  };

  const botStats = {
    runs: 30,
    ballsFaced: 20,
    fours: 3,
    sixes: 1,
    wickets: 2,
    ballsBowled: 18,
    runsConceded: 15,
    dotBalls: 5,
  };

  it('renders player as winner', () => {
    const motmInfo = {
      motmWinner: 'player',
      winnerStats: { totalPoints: 100 },
      reason: 'Great performance',
    };
    
    const onContinue = vi.fn();
    
    render(
      <ManOfTheMatchCard 
        motmInfo={motmInfo} 
        playerStats={playerStats} 
        botStats={botStats} 
        onContinueToResult={onContinue}
        playerName="John"
        botName="AI"
      />
    );
    
    expect(soundEngine.playMatchVictorySound).toHaveBeenCalled();
    expect(screen.getByText('John')).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalled();
  });

  it('renders bot as winner and handles empty stats', () => {
    const motmInfo = {
      motmWinner: 'bot',
      winnerStats: { totalPoints: 120 },
      reason: 'Bot smashed it',
    };
    
    render(
      <ManOfTheMatchCard 
        motmInfo={motmInfo} 
        playerStats={{}} 
        botStats={{}} 
        onContinueToResult={vi.fn()}
      />
    );
    
    expect(screen.getByText('AI MASTERMIND')).toBeInTheDocument();
  });
});
