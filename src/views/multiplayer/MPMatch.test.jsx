import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MPMatch from "./MPMatch";
import { useMultiplayer } from "../../context/MultiplayerContext";
import * as pointsCalculator from "../../utils/pointsCalculator";
import * as statsStorage from "../../utils/statsStorage";

vi.mock("../../context/MultiplayerContext", () => ({
  useMultiplayer: vi.fn(),
}));
vi.mock("../../components/NumberPad", () => ({
  default: ({ onSelect, disabled, options }) => (
    <div data-testid="mock-number-pad">
      {options.map((opt) => (
        <button key={opt} onClick={() => onSelect(opt)} data-testid={"pad-btn-" + opt}>{opt}</button>
      ))}
    </div>
  ),
}));
vi.mock("../../components/MatchSummaryDashboard", () => ({
  default: ({ onProceedToMotm }) => (
    <div data-testid="mock-match-summary"><button onClick={onProceedToMotm} data-testid="proceed-to-motm-btn">Proceed</button></div>
  ),
}));
vi.mock("../../components/ManOfTheMatchCard", () => ({
  default: ({ onContinueToResult }) => (
    <div data-testid="mock-motm-card"><button onClick={onContinueToResult} data-testid="continue-to-result-btn">Continue</button></div>
  ),
}));
vi.mock("../../utils/pointsCalculator", () => ({
  determineManOfTheMatch: vi.fn(() => ({ motmWinner: "p1" })),
}));
vi.mock("../../utils/statsStorage", () => ({
  updateCareerAfterMatch: vi.fn(),
}));

describe("MPMatch", () => {
  let dispatchMock;
  const defaultState = {
    phase: "MP_MATCH", battingTeam: "teamA", activeBatterId: "p1", activeBowlerId: "p2",
    score: { batting: 10, bowling: 0 }, wickets: { batting: 1, bowling: 0 },
    innings: 1, target: null, ballsBowled: 6,
    lockedMoves: { batterMove: null, bowlerMove: null },
    players: { p1: { id: "p1", name: "Player 1", isBot: false }, p2: { id: "p2", name: "Player 2", isBot: false } },
    settings: { oversPerInnings: 2, currentMatch: 1, seriesLength: 3 },
    currentOverLog: [], ballLog: [], resultMeta: null, seriesScores: { teamA: 0, teamB: 0 },
    seriesWinner: null, currentPlayerId: "p1", hostId: "p1",
    teams: { teamA: { roster: ["p1"] }, teamB: { roster: ["p2"] } },
    playerStats: { p1: { runs: 10 }, p2: { runs: 0 } },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    dispatchMock = vi.fn();
    useMultiplayer.mockReturnValue({ state: defaultState, dispatch: dispatchMock });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders innings break correctly", () => {
    useMultiplayer.mockReturnValue({ state: { ...defaultState, phase: "MP_INNINGS_BREAK", target: 11 }, dispatch: dispatchMock });
    render(<MPMatch />);
    expect(screen.getByText("Innings Over")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start 2nd Innings"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_ADVANCE_INNINGS" });
  });

  it("renders innings break for non-host", () => {
    useMultiplayer.mockReturnValue({ state: { ...defaultState, phase: "MP_INNINGS_BREAK", currentPlayerId: "p2" }, dispatch: dispatchMock });
    render(<MPMatch />);
    expect(screen.getByText(/Waiting for host/)).toBeInTheDocument();
  });

  it("renders match result flow (summary -> motm -> result)", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_MATCH_RESULT", resultMeta: { winner: "teamA", summary: "Team A won", teamAScore: "20", teamBScore: "10" } },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("proceed-to-motm-btn"));
    fireEvent.click(screen.getByTestId("continue-to-result-btn"));
    expect(screen.getByText("Match Over")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Next Match"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_NEXT_MATCH" });
  });

  it("handles batter move", () => {
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("pad-btn-4"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_SUBMIT_MATCH_MOVE", payload: { role: "batter", move: 4 } });
  });

  it("auto-plays bot when host", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, players: { ...defaultState.players, p1: { id: "p1", isBot: true } } },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    act(() => { vi.advanceTimersByTime(1200); });
    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining({ type: "MP_SUBMIT_MATCH_MOVE" }));
  });

  it("shows out overlay and handles auto-resolve", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_RESOLVE_MOVE", lockedMoves: { batterMove: 4, bowlerMove: 4 } },
      dispatch: dispatchMock,
      isHost: true,
    });
    render(<MPMatch />);
    expect(screen.getByText("OUT!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_PROCESS_RESOLUTION" });
  });

  it("auto-resolves non-wicket balls", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_RESOLVE_MOVE", lockedMoves: { batterMove: 4, bowlerMove: 2 } },
      dispatch: dispatchMock,
      isHost: true,
    });
    render(<MPMatch />);
    act(() => { vi.advanceTimersByTime(1600); });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_PROCESS_RESOLUTION" });
  });

  it("handles super over tied match", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_MATCH_RESULT", resultMeta: { winner: "tied" } },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("proceed-to-motm-btn"));
    fireEvent.click(screen.getByTestId("continue-to-result-btn"));
    fireEvent.click(screen.getByText("Super Over!"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_START_SUPER_OVER" });
  });

  it("early returns in handleBatterMove if not batter or already locked", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, lockedMoves: { batterMove: 4, bowlerMove: null }, currentPlayerId: "p1" },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    const btn = screen.getByTestId("pad-btn-4");
    fireEvent.click(btn);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("early returns in handleBowlerMove if not bowler or already locked", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, lockedMoves: { batterMove: null, bowlerMove: 2 }, currentPlayerId: "p2" },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    const btn = screen.getByTestId("pad-btn-2");
    fireEvent.click(btn);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("auto-plays bot handles empty batter/bowler names gracefully", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        players: {},
        activeBatterId: "missing",
        activeBowlerId: "missing2",
        currentOverLog: []
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("This over will appear here")).toBeInTheDocument();
  });

  it("cleans up bot timer on unmount", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        players: { p1: { id: "p1", isBot: true }, p2: { id: "p2", isBot: true } },
        currentPlayerId: "p1",
        hostId: "p1"
      },
      dispatch: dispatchMock,
    });
    const { unmount } = render(<MPMatch />);
    unmount();
    act(() => { vi.advanceTimersByTime(1200); });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("hits early returns in handleBatterMove and handleBowlerMove", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_MATCH", currentPlayerId: "p1", lockedMoves: { batterMove: 4, bowlerMove: null } },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("pad-btn-4"));
    expect(dispatchMock).not.toHaveBeenCalled();

    useMultiplayer.mockReturnValue({
      state: { ...defaultState, phase: "MP_MATCH", currentPlayerId: "p2", lockedMoves: { batterMove: null, bowlerMove: 4 } },
      dispatch: dispatchMock,
    });
    cleanup();
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("pad-btn-4"));
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("covers missing branches in JSX (teamB batting, no oversLimit)", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        battingTeam: "teamB",
        settings: { ...defaultState.settings, oversPerInnings: null },
        innings: 2,
        target: 50,
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("Team B Batting")).toBeInTheDocument();
  });

  it("covers missing branches in JSX (lockedMoves in MP_MATCH)", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: "MP_MATCH",
        lockedMoves: { batterMove: 4, bowlerMove: 4 },
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getAllByText("✓").length).toBe(2);
    expect(screen.getAllByText("Locked").length).toBe(2);
  });

  it("handles bowler move", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, currentPlayerId: "p2" },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("pad-btn-3"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_SUBMIT_MATCH_MOVE", payload: { role: "bowler", move: 3 } });
  });

  it("auto-plays bot bowler when host", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        players: { ...defaultState.players, p2: { id: "p2", name: "Bot Bowler", isBot: true } },
        currentPlayerId: "p1",
        hostId: "p1",
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    act(() => { vi.advanceTimersByTime(1200); });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: "MP_SUBMIT_MATCH_MOVE",
      payload: expect.objectContaining({ role: "bowler" })
    });
  });

  it("shows non-host out overlay waiting message", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: "MP_RESOLVE_MOVE",
        lockedMoves: { batterMove: 4, bowlerMove: 4 },
        currentPlayerId: "p2",
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("Waiting for host to resolve the wicket...")).toBeInTheDocument();
  });

  it("displays target and need text in second innings", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        innings: 2,
        target: 20,
        score: { batting: 5 },
        ballsBowled: 2,
        settings: { ...defaultState.settings, oversPerInnings: 2 }
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("15 needed from 10 balls")).toBeInTheDocument();
  });

  it("handles dot ball in clash zone display", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: "MP_RESOLVE_MOVE",
        lockedMoves: { batterMove: 0, bowlerMove: 3 },
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("Dot Ball")).toBeInTheDocument();
  });

  it("displays bot actions in the action console", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: "p3",
        players: {
          ...defaultState.players,
          p1: { id: "p1", name: "Bot Batter", isBot: true },
          p2: { id: "p2", name: "Bot Bowler", isBot: true }
        }
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("Bot Batter (Bot) is batting...")).toBeInTheDocument();
    expect(screen.getByText("Bot Bowler (Bot) is bowling...")).toBeInTheDocument();
  });

  it("displays human opponent actions in the action console", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentPlayerId: "p3",
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("Player 1 is batting...")).toBeInTheDocument();
    expect(screen.getByText("Player 2 is bowling...")).toBeInTheDocument();
  });

  it("displays this over log", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        currentOverLog: [
          { ballId: 1, runs: 0, isOut: false },
          { ballId: 2, runs: 4, isOut: false },
          { ballId: 3, runs: 0, isOut: true }
        ]
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getAllByText("0")[0]).toBeInTheDocument();
    expect(screen.getAllByText(`4`)[0]).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("displays animated last ball score addition", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        ballLog: [
          { ballId: 1, runs: 6, isOut: false }
        ]
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    expect(screen.getByText("+6 RUNS")).toBeInTheDocument();
  });

  it("does not crash if playerStats is missing", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: "MP_MATCH_RESULT",
        resultMeta: { winner: "teamA", summary: "Win" },
        playerStats: undefined
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("proceed-to-motm-btn"));
    expect(screen.getByTestId("mock-motm-card")).toBeInTheDocument();
  });

  it("renders match result for non-host", () => {
    useMultiplayer.mockReturnValue({
      state: {
        ...defaultState,
        phase: "MP_MATCH_RESULT",
        currentPlayerId: "p2",
        resultMeta: { winner: "teamA", summary: "Team A won" }
      },
      dispatch: dispatchMock,
    });
    render(<MPMatch />);
    fireEvent.click(screen.getByTestId("proceed-to-motm-btn"));
    fireEvent.click(screen.getByTestId("continue-to-result-btn"));
    expect(screen.getByText("Waiting for host to continue the series...")).toBeInTheDocument();
  });
});
