import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MPCreateSettings from './MPCreateSettings';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
  OVER_OPTIONS: [1, 2, 5, null],
  SERIES_OPTIONS: [1, 3, 5],
}));

vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, initial, animate, ...props }) => <div {...props}>{children}</div>,
    },
  };
});

describe('MPCreateSettings', () => {
  const mockDispatch = vi.fn();
  
  const defaultState = {
    settings: {
      maxPlayers: 4,
      oversPerInnings: 2,
      seriesLength: 1,
    },
    roomCode: 'ABCD',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: mockDispatch,
    });
  });

  it('renders settings options', () => {
    render(<MPCreateSettings />);
    
    expect(screen.getByText('Room Settings')).toBeInTheDocument();
    expect(screen.getByText('ABCD')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('dispatches MP_LEAVE_ROOM on back click', () => {
    render(<MPCreateSettings />);
    
    const backBtn = screen.getByText('Back');
    fireEvent.click(backBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_LEAVE_ROOM' });
  });

  it('dispatches MP_UPDATE_MAX_PLAYERS on increment/decrement', () => {
    render(<MPCreateSettings />);
    
    const minusBtn = screen.getByText('−');
    const plusBtn = screen.getByText('+');
    
    fireEvent.click(minusBtn);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_UPDATE_MAX_PLAYERS', payload: 3 });
    
    fireEvent.click(plusBtn);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_UPDATE_MAX_PLAYERS', payload: 5 });
  });

  it('dispatches MP_UPDATE_MAX_PLAYERS on preset click', () => {
    render(<MPCreateSettings />);
    
    const preset6Btn = screen.getByText('6');
    fireEvent.click(preset6Btn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_UPDATE_MAX_PLAYERS', payload: 6 });
  });

  it('dispatches MP_UPDATE_OVERS on option click', () => {
    render(<MPCreateSettings />);
    
    const over5Btn = screen.getByText('5'); 
    fireEvent.click(over5Btn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_UPDATE_OVERS', payload: 5 });
  });

  it('dispatches MP_UPDATE_SERIES on option click', () => {
    render(<MPCreateSettings />);
    
    const series3Btn = screen.getByText('3 Match');
    fireEvent.click(series3Btn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_UPDATE_SERIES', payload: 3 });
  });

  it('dispatches MP_CONFIRM_SETTINGS on Open Lobby click', () => {
    render(<MPCreateSettings />);
    
    const confirmBtn = screen.getByText('Open Lobby');
    fireEvent.click(confirmBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_CONFIRM_SETTINGS' });
  });

  it('disables minus button if maxPlayers <= 2', () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, settings: { ...defaultState.settings, maxPlayers: 2 } },
      dispatch: mockDispatch,
    });

    render(<MPCreateSettings />);
    
    const minusBtn = screen.getByText('−');
    expect(minusBtn).toBeDisabled();
  });

  it('disables plus button if maxPlayers >= 22', () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, settings: { ...defaultState.settings, maxPlayers: 22 } },
      dispatch: mockDispatch,
    });

    render(<MPCreateSettings />);
    
    const plusBtn = screen.getByText('+');
    expect(plusBtn).toBeDisabled();
  });
});
