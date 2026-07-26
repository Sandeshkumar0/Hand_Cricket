import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as GameContext from './context/GameContext';
import * as MultiplayerContext from './context/MultiplayerContext';
import * as AuthContext from './context/AuthContext';
import { soundEngine } from './utils/audio';

// Mock contexts
vi.mock('./context/GameContext', () => ({
  useGame: vi.fn(),
}));
vi.mock('./context/MultiplayerContext', () => ({
  useMultiplayer: vi.fn(),
}));
vi.mock('./context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock utils
vi.mock('./utils/audio', () => ({
  soundEngine: {
    muted: false,
    toggleMute: vi.fn(() => true),
    playUiClick: vi.fn(),
  },
}));
vi.mock('./utils/statsStorage', () => ({
  loadAllCareerStats: vi.fn(() => ({ player: {} })),
}));

// Mock all views as simple stubs
vi.mock('./views/MainMenu', () => ({ default: () => <div data-testid="mock-MainMenu">MainMenu</div> }));
vi.mock('./views/Lobby', () => ({ default: () => <div data-testid="mock-Lobby">Lobby</div> }));
vi.mock('./views/Toss', () => ({ default: () => <div data-testid="mock-Toss">Toss</div> }));
vi.mock('./views/Match', () => ({ default: () => <div data-testid="mock-Match">Match</div> }));
vi.mock('./views/SeriesResult', () => ({ default: () => <div data-testid="mock-SeriesResult">SeriesResult</div> }));
vi.mock('./views/multiplayer/MPGateway', () => ({ default: () => <div data-testid="mock-MPGateway">MPGateway</div> }));
vi.mock('./views/multiplayer/MPCreateSettings', () => ({ default: () => <div data-testid="mock-MPCreateSettings">MPCreateSettings</div> }));
vi.mock('./views/multiplayer/MPLobby', () => ({ default: () => <div data-testid="mock-MPLobby">MPLobby</div> }));
vi.mock('./views/multiplayer/CaptainReveal', () => ({ default: () => <div data-testid="mock-CaptainReveal">CaptainReveal</div> }));
vi.mock('./views/multiplayer/MPToss', () => ({ default: () => <div data-testid="mock-MPToss">MPToss</div> }));
vi.mock('./views/multiplayer/DraftPhase', () => ({ default: () => <div data-testid="mock-DraftPhase">DraftPhase</div> }));
vi.mock('./views/multiplayer/MPMatchToss', () => ({ default: () => <div data-testid="mock-MPMatchToss">MPMatchToss</div> }));
vi.mock('./views/multiplayer/MPPreMatchSummary', () => ({ default: () => <div data-testid="mock-MPPreMatchSummary">MPPreMatchSummary</div> }));
vi.mock('./views/multiplayer/MPPlayerIntro', () => ({ default: () => <div data-testid="mock-MPPlayerIntro">MPPlayerIntro</div> }));
vi.mock('./views/multiplayer/CaptainSelect', () => ({ default: () => <div data-testid="mock-CaptainSelect">CaptainSelect</div> }));
vi.mock('./views/multiplayer/MPMatch', () => ({ default: () => <div data-testid="mock-MPMatch">MPMatch</div> }));
vi.mock('./views/multiplayer/SuperOverSetup', () => ({ default: () => <div data-testid="mock-SuperOverSetup">SuperOverSetup</div> }));
vi.mock('./views/multiplayer/SuperOverReveal', () => ({ default: () => <div data-testid="mock-SuperOverReveal">SuperOverReveal</div> }));
vi.mock('./views/multiplayer/SuperOverMatch', () => ({ default: () => <div data-testid="mock-SuperOverMatch">SuperOverMatch</div> }));
vi.mock('./views/multiplayer/MPSeriesResult', () => ({ default: () => <div data-testid="mock-MPSeriesResult">MPSeriesResult</div> }));
vi.mock('./views/multiplayer/TeamChatWidget', () => ({ default: () => null }));
vi.mock('./components/PlayerProfileModal', () => ({
  default: ({ open }) => (open ? <div data-testid="mock-ProfileModal">Profile</div> : null)
}));
vi.mock('./components/AuthModal', () => ({
  default: ({ open }) => (open ? <div data-testid="mock-AuthModal">Auth</div> : null)
}));

const defaultMpState = {
  phase: 'MP_GATEWAY',
  players: {},
  teams: { teamA: { roster: [] }, teamB: { roster: [] } },
  currentPlayerId: 'user1',
  superOver: {},
};

const defaultSpState = {
  currentPhase: 'MAIN_MENU',
  match_settings: { current_match: 1 },
};

describe('App Component', () => {
  let mockGameDispatch;
  let mockMpDispatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameDispatch = vi.fn();
    mockMpDispatch = vi.fn();

    AuthContext.useAuth.mockReturnValue({ currentUser: null });
    GameContext.useGame.mockReturnValue({
      state: defaultSpState,
      dispatch: mockGameDispatch,
    });
    MultiplayerContext.useMultiplayer.mockReturnValue({
      state: defaultMpState,
      dispatch: mockMpDispatch,
    });
  });

  // --- SP Phases ---
  it('renders SP MainMenu by default', () => {
    render(<App />);
    expect(screen.getByTestId('mock-MainMenu')).toBeInTheDocument();
  });

  it('renders SP Lobby', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'LOBBY' }, dispatch: mockGameDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-Lobby')).toBeInTheDocument();
  });

  it('renders SP Toss', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'TOSS' }, dispatch: mockGameDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-Toss')).toBeInTheDocument();
  });

  it('renders SP Match', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'MATCH' }, dispatch: mockGameDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-Match')).toBeInTheDocument();
  });

  it('renders SP SeriesResult', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'SERIES_RESULT' }, dispatch: mockGameDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-SeriesResult')).toBeInTheDocument();
  });

  // --- MP Phases ---
  it('renders MP CreateSettings', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_CREATE_SETTINGS' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPCreateSettings')).toBeInTheDocument();
  });

  it('renders MP Lobby', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_LOBBY' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPLobby')).toBeInTheDocument();
  });

  it('renders CaptainReveal', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_CAPTAIN_REVEAL' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-CaptainReveal')).toBeInTheDocument();
  });

  it('renders MPToss', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_TOSS' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPToss')).toBeInTheDocument();
  });

  it('renders DraftPhase', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_DRAFT' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-DraftPhase')).toBeInTheDocument();
  });

  it('renders MPMatchToss', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_MATCH_TOSS' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPMatchToss')).toBeInTheDocument();
  });

  it('renders MPPreMatchSummary', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_PRE_MATCH' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPPreMatchSummary')).toBeInTheDocument();
  });

  it('renders MPPlayerIntro', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_PLAYER_INTRO' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPPlayerIntro')).toBeInTheDocument();
  });

  it('renders CaptainSelect for MP_SELECT_BATTER', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_SELECT_BATTER' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-CaptainSelect')).toBeInTheDocument();
  });

  it('renders MPMatch', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_MATCH' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPMatch')).toBeInTheDocument();
  });

  it('renders SuperOverSetup', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_SUPER_OVER_SETUP' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-SuperOverSetup')).toBeInTheDocument();
  });

  it('renders SuperOverReveal', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_SUPER_OVER_REVEAL' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-SuperOverReveal')).toBeInTheDocument();
  });

  it('renders SuperOverMatch', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_SUPER_OVER' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-SuperOverMatch')).toBeInTheDocument();
  });

  it('renders MPSeriesResult', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_SERIES_RESULT' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPSeriesResult')).toBeInTheDocument();
  });

  it('renders MPGateway for unknown MP phase', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_UNKNOWN' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByTestId('mock-MPGateway')).toBeInTheDocument();
  });

  // --- UI Interactions ---
  it('toggles sound', () => {
    render(<App />);
    const audioBtn = screen.getByRole('button', { name: /AUDIO ON/i });
    fireEvent.click(audioBtn);
    expect(soundEngine.toggleMute).toHaveBeenCalled();
  });

  it('opens AuthModal', () => {
    render(<App />);
    const loginBtn = screen.getByRole('button', { name: /LOGIN/i });
    fireEvent.click(loginBtn);
    expect(screen.getByTestId('mock-AuthModal')).toBeInTheDocument();
  });

  it('shows profile button when logged in', () => {
    AuthContext.useAuth.mockReturnValue({ currentUser: { displayName: 'Aarzoo' } });
    render(<App />);
    const profileBtn = screen.getByRole('button', { name: /PROFILE STATS/i });
    fireEvent.click(profileBtn);
    expect(screen.getByTestId('mock-ProfileModal')).toBeInTheDocument();
  });

  // --- Back Button ---
  it('back from SP LOBBY goes to main menu', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'LOBBY' }, dispatch: mockGameDispatch });
    render(<App />);
    const backBtn = screen.getByRole('button', { name: /Main Menu/i });
    fireEvent.click(backBtn);
    expect(mockGameDispatch).toHaveBeenCalledWith({ type: 'GO_TO_MAIN_MENU' });
  });

  it('back from SP TOSS goes to lobby', () => {
    GameContext.useGame.mockReturnValue({ state: { ...defaultSpState, currentPhase: 'TOSS_SETUP' }, dispatch: mockGameDispatch });
    render(<App />);
    const backBtn = screen.getByRole('button', { name: /Lobby/i });
    fireEvent.click(backBtn);
    expect(mockGameDispatch).toHaveBeenCalledWith({ type: 'BACK_TO_LOBBY' });
  });

  it('back from MP_MENU goes to gateway', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_MENU' }, dispatch: mockMpDispatch });
    render(<App />);
    const backBtn = screen.getByRole('button', { name: /Main Menu/i });
    fireEvent.click(backBtn);
    expect(mockMpDispatch).toHaveBeenCalledWith({ type: 'MP_BACK_TO_GATEWAY' });
  });

  it('back from MP_LOBBY leaves room', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_LOBBY' }, dispatch: mockMpDispatch });
    render(<App />);
    const backBtn = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backBtn);
    expect(mockMpDispatch).toHaveBeenCalledWith({ type: 'MP_LEAVE_ROOM' });
  });

  it('shows MULTIPLAYER badge in MP mode', () => {
    MultiplayerContext.useMultiplayer.mockReturnValue({ state: { ...defaultMpState, phase: 'MP_LOBBY' }, dispatch: mockMpDispatch });
    render(<App />);
    expect(screen.getByText('MULTIPLAYER')).toBeInTheDocument();
  });
});
