import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MainMenu from './MainMenu';
import { useGame } from '../context/GameContext';
import { useMultiplayer } from '../context/MultiplayerContext';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/audio';

// Mock contexts and audio
vi.mock('../context/GameContext', () => ({
  useGame: vi.fn(),
}));

vi.mock('../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
  },
}));

vi.mock('../components/CricketBackground', () => ({
  default: () => <div data-testid="cricket-background" />,
}));

// Mock framer-motion to avoid animation delays in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('MainMenu Component', () => {
  let mockGameDispatch;
  let mockMpDispatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameDispatch = vi.fn();
    mockMpDispatch = vi.fn();

    useGame.mockReturnValue({ dispatch: mockGameDispatch });
    useMultiplayer.mockReturnValue({ dispatch: mockMpDispatch });
  });

  it('renders auth warning when user is not logged in', () => {
    useAuth.mockReturnValue({ currentUser: null });
    render(<MainMenu />);
    
    expect(screen.getByText('AUTHENTICATION REQUIRED')).toBeInTheDocument();
    expect(screen.getByText(/Please login or create an account/)).toBeInTheDocument();
    expect(screen.getByTestId('cricket-background')).toBeInTheDocument();
  });

  it('renders game modes when user is logged in', () => {
    useAuth.mockReturnValue({ currentUser: { uid: '123', name: 'Test User' } });
    render(<MainMenu />);
    
    expect(screen.getByText('VS BOT MATCH')).toBeInTheDocument();
    expect(screen.getByText('FRIENDS SHOWDOWN')).toBeInTheDocument();
  });

  it('handles vs bot click', () => {
    useAuth.mockReturnValue({ currentUser: { uid: '123' } });
    render(<MainMenu />);
    
    const vsBotCard = screen.getByText('VS BOT MATCH').closest('div.group');
    fireEvent.click(vsBotCard);
    
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockGameDispatch).toHaveBeenCalledWith({ type: 'START_VS_COMPUTER' });
  });

  it('handles multiplayer click', () => {
    useAuth.mockReturnValue({ currentUser: { uid: '123' } });
    render(<MainMenu />);
    
    const multiplayerCard = screen.getByText('FRIENDS SHOWDOWN').closest('div.group');
    fireEvent.click(multiplayerCard);
    
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(mockMpDispatch).toHaveBeenCalledWith({ type: 'MP_OPEN_GATEWAY' });
  });
});
