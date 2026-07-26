import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MPLobby from './MPLobby';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

vi.mock('../../components/CricketIcons', () => ({
  PlayerMarker: () => <div data-testid="player-marker">Marker</div>,
}));

vi.mock('../../components/PlayerProfileModal', () => ({
  default: ({ open, onClose }) => (open ? <div data-testid="profile-modal"><button onClick={onClose}>Close Profile</button></div> : null),
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, initial, animate, transition, ...props }) => <div {...props}>{children}</div>,
    },
  };
});

describe('MPLobby', () => {
  const mockDispatch = vi.fn();
  
  const defaultState = {
    roomCode: 'ABCD',
    hostId: 'p1',
    currentPlayerId: 'p1',
    settings: {
      maxPlayers: 4,
      oversPerInnings: 2,
      seriesLength: 1,
    },
    players: {
      p1: { id: 'p1', name: 'Host Player', isReady: true, isBot: false, isOnline: true },
      p2: { id: 'p2', name: 'Guest Player', isReady: false, isBot: false, isOnline: false },
      p3: { id: 'p3', name: 'Bot Player', isReady: true, isBot: true },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: mockDispatch,
    });
  });

  it('renders lobby info correctly', () => {
    render(<MPLobby />);
    
    expect(screen.getAllByText('ABCD').length).toBeGreaterThan(0);
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('Host Player')).toBeInTheDocument();
    expect(screen.getByText('Guest Player')).toBeInTheDocument();
    expect(screen.getByText('Bot Player')).toBeInTheDocument();
  });

  it('renders correctly with null overs', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        settings: { ...defaultState.settings, oversPerInnings: null },
      },
      dispatch: mockDispatch,
    });

    render(<MPLobby />);
    expect(screen.getByText('∞ Overs')).toBeInTheDocument();
  });

  it('dispatches MP_LEAVE_ROOM on back click', () => {
    render(<MPLobby />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); 
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_LEAVE_ROOM' });
  });

  it('dispatches MP_TOGGLE_READY', () => {
    render(<MPLobby />);
    
    const unreadyBtn = screen.getByText('Unready');
    fireEvent.click(unreadyBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_TOGGLE_READY', payload: 'p1' });
  });

  it('dispatches MP_REMOVE_PLAYER when host clicks remove', () => {
    render(<MPLobby />);
    
    const removeBtn = screen.getAllByText('Remove')[0];
    fireEvent.click(removeBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_REMOVE_PLAYER', payload: 'p2' });
  });

  it('dispatches MP_ADD_BOT when host clicks add bot', () => {
    render(<MPLobby />);
    
    const addBotBtn = screen.getByText('Add Bot');
    fireEvent.click(addBotBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_ADD_BOT' });
  });

  it('disables Start Game if not all ready', () => {
    render(<MPLobby />);
    
    const startBtn = screen.getByText('Waiting for everyone...');
    expect(startBtn).toBeDisabled();
  });

  it('shows need at least 2 players if alone', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        players: { p1: defaultState.players.p1 },
      },
      dispatch: mockDispatch,
    });

    render(<MPLobby />);
    
    const startBtn = screen.getByText('Need at least 2 players');
    expect(startBtn).toBeDisabled();
  });

  it('enables Start Game and dispatches MP_START_GAME when all ready', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        players: {
          ...defaultState.players,
          p2: { ...defaultState.players.p2, isReady: true },
        },
      },
      dispatch: mockDispatch,
    });

    render(<MPLobby />);
    
    const startBtn = screen.getByText('Start Game');
    expect(startBtn).not.toBeDisabled();
    
    fireEvent.click(startBtn);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_START_GAME' });
  });

  it('shows waiting message for non-host', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'p2', 
      },
      dispatch: mockDispatch,
    });

    render(<MPLobby />);
    
    expect(screen.getByText('Waiting for Host to start the game...')).toBeInTheDocument();
  });

  it('opens and closes player profile modal', () => {
    render(<MPLobby />);
    
    const avatars = screen.getAllByTestId('player-marker');
    fireEvent.click(avatars[0].parentElement); 
    
    expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    
    const closeBtn = screen.getByText('Close Profile');
    fireEvent.click(closeBtn);
    
    expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument();
  });

  it('copies room code to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(),
    };
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });

    render(<MPLobby />);
    
    const copyBtn = screen.getAllByText('ABCD')[0].closest('button');
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABCD');
  });
});
