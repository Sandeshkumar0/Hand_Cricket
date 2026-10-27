import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MPGateway from './MPGateway';
import { useMultiplayer } from '../../context/MultiplayerContext';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="icon-plus" />,
  LogIn: () => <div data-testid="icon-login" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />,
  Users: () => <div data-testid="icon-users" />,
}));

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

describe('MPGateway Component', () => {
  let mockDispatch;

  beforeEach(() => {
    mockDispatch = vi.fn();
    useMultiplayer.mockReturnValue({
      state: { notice: null },
      dispatch: mockDispatch,
    });
    vi.clearAllMocks();
  });

  it('renders default gateway correctly', () => {
    render(<MPGateway />);
    expect(screen.getByText('Play with Friends')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name...')).toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeInTheDocument();
    expect(screen.getByText('Join Room')).toBeInTheDocument();
  });

  it('renders notice and handles dismiss', () => {
    useMultiplayer.mockReturnValue({
      state: { notice: 'Connection Error' },
      dispatch: mockDispatch,
    });
    render(<MPGateway />);
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    
    const dismissBtn = screen.getByText('Dismiss');
    fireEvent.click(dismissBtn);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'MP_CLEAR_NOTICE' });
  });

  it('updates player name input', () => {
    render(<MPGateway />);
    const nameInput = screen.getByPlaceholderText('Enter name...');
    fireEvent.change(nameInput, { target: { value: 'NewName' } });
    expect(nameInput.value).toBe('NewName');
  });

  it('handles create room mode', () => {
    render(<MPGateway />);
    
    // Open create room view
    fireEvent.click(screen.getByText('Host a new match room and invite friends.').parentElement);
    expect(screen.getByText('Ready to Host?')).toBeInTheDocument();
    
    // Test create room button
    const createBtn = screen.getByText('Create Room', { selector: 'button' });
    fireEvent.click(createBtn);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MP_CREATE_ROOM',
      payload: { name: 'Player 1' },
    });

    // Test back button
    const backBtn = screen.getByText('Back');
    fireEvent.click(backBtn);
    expect(screen.queryByText('Ready to Host?')).not.toBeInTheDocument();
  });

  it('handles create room with a specified player name', () => {
    render(<MPGateway />);
    
    const nameInput = screen.getByPlaceholderText('Enter name...');
    fireEvent.change(nameInput, { target: { value: 'JohnDoe' } });
    
    fireEvent.click(screen.getByText('Host a new match room and invite friends.').parentElement);
    
    const createBtn = screen.getByText('Create Room', { selector: 'button' });
    fireEvent.click(createBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MP_CREATE_ROOM',
      payload: { name: 'JohnDoe' },
    });
  });

  it('handles join room mode', () => {
    render(<MPGateway />);
    
    // Open join room view
    fireEvent.click(screen.getByText('Enter a 4-digit room code to join.').parentElement);
    expect(screen.getByText('Enter Room Code')).toBeInTheDocument();
    
    const inputs = screen.getAllByRole('textbox').filter(input => input.maxLength === 1);
    expect(inputs.length).toBe(4);
    
    // Join button should be disabled
    const joinBtn = screen.getByText('Join Room', { selector: 'button' });
    expect(joinBtn).toBeDisabled();
    
    // Type first character
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0].value).toBe('A'); // Uppercased
    
    // Backspace from second input
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    // This should focus the first input, but checking focus in JSDOM can be tricky.
    
    // Fill all inputs
    fireEvent.change(inputs[0], { target: { value: 'A' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(inputs[2], { target: { value: 'B' } });
    fireEvent.change(inputs[3], { target: { value: '2' } });
    
    expect(joinBtn).not.toBeDisabled();
    fireEvent.click(joinBtn);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MP_JOIN_ROOM',
      payload: { name: 'Player', code: 'A1B2' },
    });

    // Test back button
    const backBtn = screen.getByText('Back');
    fireEvent.click(backBtn);
    expect(screen.queryByText('Enter Room Code')).not.toBeInTheDocument();
  });

  it('ignores invalid characters in join code', () => {
    render(<MPGateway />);
    fireEvent.click(screen.getByText('Enter a 4-digit room code to join.').parentElement);
    
    const inputs = screen.getAllByRole('textbox').filter(input => input.maxLength === 1);
    
    fireEvent.change(inputs[0], { target: { value: '!' } });
    expect(inputs[0].value).toBe('');
  });

  it('handles player name in join room', () => {
    render(<MPGateway />);
    
    const nameInput = screen.getByPlaceholderText('Enter name...');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    
    fireEvent.click(screen.getByText('Enter a 4-digit room code to join.').parentElement);
    
    const inputs = screen.getAllByRole('textbox').filter(input => input.maxLength === 1);
    fireEvent.change(inputs[0], { target: { value: 'T' } });
    fireEvent.change(inputs[1], { target: { value: 'E' } });
    fireEvent.change(inputs[2], { target: { value: 'S' } });
    fireEvent.change(inputs[3], { target: { value: 'T' } });
    
    const joinBtn = screen.getByText('Join Room', { selector: 'button' });
    fireEvent.click(joinBtn);
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'MP_JOIN_ROOM',
      payload: { name: 'Alice', code: 'TEST' },
    });
  });
});
