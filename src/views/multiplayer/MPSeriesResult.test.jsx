import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MPSeriesResult from "./MPSeriesResult";
import { useMultiplayer } from "../../context/MultiplayerContext";

vi.mock("../../context/MultiplayerContext", () => ({
  useMultiplayer: vi.fn(),
}));

describe("MPSeriesResult", () => {
  let dispatchMock;
  const defaultState = {
    series: {
      winner: "teamA",
      scores: { teamA: 2, teamB: 1 },
      results: [
        { matchNumber: 1, winner: "teamA", teamAScore: 20, teamBScore: 10 },
        { matchNumber: 2, winner: "teamB", teamAScore: 15, teamBScore: 25 },
        { matchNumber: 3, winner: "draw", teamAScore: 30, teamBScore: 30 },
      ],
    },
    teams: {
      teamA: { roster: ["p1"] },
      teamB: { roster: ["p2"] },
    },
    currentPlayerId: "p1",
  };

  beforeEach(() => {
    dispatchMock = vi.fn();
    useMultiplayer.mockReturnValue({ state: defaultState, dispatch: dispatchMock, isHost: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders player victory correctly (teamA wins, user in teamA)", () => {
    render(<MPSeriesResult />);
    expect(screen.getByText("SERIES RESULT: 2 - 1")).toBeInTheDocument();
    expect(screen.getByText("🏆 SERIES VICTORY!")).toBeInTheDocument();
    
    // Check match breakdown
    expect(screen.getByText("MATCH 1")).toBeInTheDocument();
    expect(screen.getByText("TEAM A WON")).toBeInTheDocument();
    expect(screen.getByText("TEAM B WON")).toBeInTheDocument();
    expect(screen.getByText("DRAW")).toBeInTheDocument();
  });

  it("renders player defeat correctly (teamA wins, user in teamB)", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, currentPlayerId: "p2" },
      dispatch: dispatchMock,
      isHost: true,
    });
    render(<MPSeriesResult />);
    expect(screen.getByText("💔 SERIES DEFEAT")).toBeInTheDocument();
  });

  it("renders draw correctly", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, series: { ...defaultState.series, winner: "draw" } },
      dispatch: dispatchMock,
      isHost: true,
    });
    render(<MPSeriesResult />);
    expect(screen.getByText("SERIES DRAW")).toBeInTheDocument();
  });

  it("renders default fallback when missing series/results", () => {
    useMultiplayer.mockReturnValue({
      state: { teams: defaultState.teams, currentPlayerId: "p3", series: null },
      dispatch: dispatchMock,
      isHost: false,
    });
    render(<MPSeriesResult />);
    expect(screen.getByText("SERIES RESULT: 0 - 0")).toBeInTheDocument();
    expect(screen.getByText("SERIES DRAW")).toBeInTheDocument();
  });

  it("handles NEW SERIES button click if host", () => {
    render(<MPSeriesResult />);
    const btn = screen.getByRole("button", { name: /NEW SERIES/i });
    fireEvent.click(btn);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_REMATCH" });
  });

  it("handles LEAVE ROOM button click", () => {
    render(<MPSeriesResult />);
    const btn = screen.getByRole("button", { name: /LEAVE ROOM/i });
    fireEvent.click(btn);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_LEAVE_ROOM" });
  });

  it("does not render NEW SERIES button if not host", () => {
    useMultiplayer.mockReturnValue({
      state: defaultState,
      dispatch: dispatchMock,
      isHost: false,
    });
    render(<MPSeriesResult />);
    expect(screen.queryByRole("button", { name: /NEW SERIES/i })).not.toBeInTheDocument();
  });
});
