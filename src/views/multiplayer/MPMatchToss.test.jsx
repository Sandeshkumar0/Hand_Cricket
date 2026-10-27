import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MPMatchToss from "./MPMatchToss";
import { useMultiplayer } from "../../context/MultiplayerContext";

vi.mock("../../context/MultiplayerContext", () => ({
  useMultiplayer: vi.fn(),
}));
vi.mock("../../components/NumberPad", () => ({
  default: ({ onSelect, disabled, options }) => (
    <div data-testid="mock-number-pad">
      {options.map((opt) => (
        <button key={opt} disabled={disabled} onClick={() => onSelect(opt)} data-testid={"pad-btn-" + opt}>{opt}</button>
      ))}
    </div>
  ),
}));

describe("MPMatchToss", () => {
  let dispatchMock;
  const defaultState = {
    phase: "MP_MATCH_TOSS",
    captains: { teamA: "p1", teamB: "p2" },
    matchTossAssignment: { odd: null, even: null },
    matchTossMoves: { captainA: null, captainB: null },
    matchTossWinner: null,
    players: {
      p1: { id: "p1", name: "Player 1", isBot: false },
      p2: { id: "p2", name: "Player 2", isBot: false }
    },
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

  it("renders claim odd/even buttons when no assignment", () => {
    render(<MPMatchToss />);
    expect(screen.getByText("Claim Odd or Even")).toBeInTheDocument();
    
    const oddBtn = screen.getAllByText(`Odd`)[1];
    const evenBtn = screen.getAllByText(`Even`)[1];
    expect(oddBtn).not.toBeDisabled();
    
    fireEvent.click(oddBtn);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_CLAIM_MATCH_TOSS_SIDE", payload: { side: "odd" } });
  });

  it("disables claim button if already assigned", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, matchTossAssignment: { odd: "p2", even: null } },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getAllByText(`Odd`)[1]).toBeDisabled();
    
    fireEvent.click(screen.getAllByText(`Even`)[1]);
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_CLAIM_MATCH_TOSS_SIDE", payload: { side: "even" } });
  });

  it("shows waiting message after claiming a side", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, matchTossAssignment: { odd: "p1", even: null } },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getByText(/You claimed/)).toBeInTheDocument();
    expect(screen.getByText("odd")).toBeInTheDocument();
  });

  it("renders NumberPad when both sides claimed", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, matchTossAssignment: { odd: "p1", even: "p2" } },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getByTestId("mock-number-pad")).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId("pad-btn-4"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_SUBMIT_MATCH_TOSS", payload: { who: "captainA", move: 4 } });
  });

  it("shows locked state if move is submitted", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, matchTossAssignment: { odd: "p1", even: "p2" }, matchTossMoves: { captainA: 4, captainB: null } },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getByText("You locked in your toss number. Waiting for opponent...")).toBeInTheDocument();
  });

  it("auto-assigns after delay when host and partial assignment", () => {
    useMultiplayer.mockReturnValue({
      state: { ...defaultState, matchTossAssignment: { odd: "p1", even: null } },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    act(() => {
      vi.advanceTimersByTime(4600);
    });
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_AUTO_ASSIGN_MATCH_TOSS_SIDE" });
  });

  it("renders toss result and shows bat/bowl options if winner", () => {
    useMultiplayer.mockReturnValue({
      state: { 
        ...defaultState, 
        phase: "MP_MATCH_TOSS_RESULT", 
        matchTossAssignment: { odd: "p1", even: "p2" }, 
        matchTossMoves: { captainA: 3, captainB: 2 },
        matchTossWinner: "teamA"
      },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getByText("5 (Odd)")).toBeInTheDocument();
    expect(screen.getByText("Player 1 wins the toss")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Bat First"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_CHOOSE_BAT_BOWL", payload: { choice: "bat" } });
    
    fireEvent.click(screen.getByText("Bowl First"));
    expect(dispatchMock).toHaveBeenCalledWith({ type: "MP_CHOOSE_BAT_BOWL", payload: { choice: "bowl" } });
  });

  it("renders waiting for choice if not winner in result phase", () => {
    useMultiplayer.mockReturnValue({
      state: { 
        ...defaultState, 
        phase: "MP_MATCH_TOSS_RESULT", 
        matchTossAssignment: { odd: "p1", even: "p2" }, 
        matchTossMoves: { captainA: 2, captainB: 2 },
        matchTossWinner: "teamB"
      },
      dispatch: dispatchMock,
    });
    render(<MPMatchToss />);
    expect(screen.getByText("Player 2 wins the toss")).toBeInTheDocument();
    expect(screen.getByText("Waiting for match toss winner to choose...")).toBeInTheDocument();
  });
});
