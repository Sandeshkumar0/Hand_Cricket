import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeamChatWidget from './TeamChatWidget';
import { useMultiplayer } from '../../context/MultiplayerContext';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    }
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Send: () => <svg data-testid="send-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

vi.mock('../../context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));

describe('TeamChatWidget', () => {
  let dispatchMock;
  const onCloseMock = vi.fn();

  beforeEach(() => {
    dispatchMock = vi.fn();
    vi.clearAllMocks();
  });

  const defaultState = {
    teams: {
      teamA: { roster: ['p1', 'p2'] },
      teamB: { roster: ['p3'] },
    },
    players: {
      p1: { id: 'p1', name: 'Player 1', isBot: false },
      p2: { id: 'p2', name: 'Player 2', isBot: false },
      bot1: { id: 'bot1', name: 'Bot 1', isBot: true },
    },
    currentPlayerId: 'p1',
    chatMessages: [
      { id: '1', team: 'teamA', senderId: 'p2', senderName: 'Player 2', text: 'Hello team!' },
      { id: '2', team: 'teamB', senderId: 'p3', senderName: 'Player 3', text: 'Secret plan' },
    ],
  };

  it('renders correctly and shows only team messages', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    
    expect(screen.getByText('Team A Chat')).toBeInTheDocument();
    expect(screen.getByText('Hello team!')).toBeInTheDocument();
    expect(screen.queryByText('Secret plan')).not.toBeInTheDocument();
  });

  it('does not render if closed', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={false} onClose={onCloseMock} />);
    expect(screen.queryByText('Team A Chat')).not.toBeInTheDocument();
  });

  it('does not render if player is bot', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'bot1',
        teams: {
          teamA: { roster: ['bot1'] },
        }
      },
      dispatch: dispatchMock,
    });

    const { container } = render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render if player not in a team', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: 'spectator1',
      },
      dispatch: dispatchMock,
    });

    const { container } = render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('allows sending a message', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText('Message Team A...');
    
    fireEvent.change(input, { target: { value: 'Got it' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_SEND_TEAM_CHAT',
      payload: { message: 'Got it' }
    });
    expect(input.value).toBe('');
  });

  it('allows sending a message via button click', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    const input = screen.getByPlaceholderText('Message Team A...');
    const sendBtn = screen.getByTestId('send-icon').closest('button');
    
    fireEvent.change(input, { target: { value: 'Testing' } });
    fireEvent.click(sendBtn);
    
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'MP_SEND_TEAM_CHAT',
      payload: { message: 'Testing' }
    });
  });

  it('does not send empty message', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    const sendBtn = screen.getByTestId('send-icon').closest('button');
    
    fireEvent.click(sendBtn);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    
    const closeBtn = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    
    // The overlay is the first button in the mock output
    const overlayBtn = screen.getAllByRole('button')[0];
    fireEvent.click(overlayBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('shows no messages text if empty', () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        chatMessages: [],
      },
      dispatch: dispatchMock,
    });

    render(<TeamChatWidget open={true} onClose={onCloseMock} />);
    expect(screen.getByText('No team messages yet.')).toBeInTheDocument();
  });
});
