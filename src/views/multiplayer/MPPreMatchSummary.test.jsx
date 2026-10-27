import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MPPreMatchSummary from "./MPPreMatchSummary";
import { useMultiplayer } from "../../context/MultiplayerContext";

vi.mock("../../context/MultiplayerContext", () => ({
  useMultiplayer: vi.fn(),
}));

describe("MPPreMatchSummary", () => {
  let dispatchMock;
  const defaultState = {
    phase: "MP_PRE_MATCH",
    teams: { 
      teamA: { roster: ["p1"] },
      teamB: { roster: ["p2"] }
    },
    players: {
      p1: { id: "p1", name: "Player 1", emoji: "🏏" },
      p2: { id: "p2", name: "Player 2", emoji: "🚀" }
    },
    matchTossWinner: "teamA",
    tossChoice: "bat",
    currentPlayerId: "p1",
    hostId: "p1"
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

  it("renders rosters and toss decision", () => {
    render(<MPPreMatchSummary />);
    expect(screen.getAllByText(`Match Ready`)[0]).toBeInTheDocument();
    
    // Players
    expect(screen.getAllByText(`Player 1`)[0]).toBeInTheDocument();
    expect(screen.getAllByText(`Player 2`)[0]).toBeInTheDocument();

    // Toss winner tag
    expect(screen.getAllByText(`Toss Won`)[0]).toBeInTheDocument();
    
    // Toss choice
    expect(screen.getAllByText(`Team A chose to bat first`)[0]).toBeInTheDocument();
  });

  it("renders bowl choice", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, tossChoice: "bowl", matchTossWinner: "teamB" },
      dispatch: dispatchMock,
    });
    render(<MPPreMatchSummary />);
    expect(screen.getAllByText(`Team B chose to bowl first`)[0]).toBeInTheDocument();
  });

  it("auto-advances after 6000ms if host", () => {
    render(<MPPreMatchSummary />);
    act(() => {
      vi.advanceTimersByTime(6100);
    });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_ADVANCE_PRE_MATCH" });
  });

  it("does not auto-advance if not host", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, currentPlayerId: "p2" },
      dispatch: dispatchMock,
    });
    render(<MPPreMatchSummary />);
    act(() => {
      vi.advanceTimersByTime(6100);
    });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("handles missing team rosters gracefully", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, teams: {} },
      dispatch: dispatchMock,
    });
    render(<MPPreMatchSummary />);
    expect(screen.getAllByText(`Team A chose to bat first`)[0]).toBeInTheDocument();
  });
});
