import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Scorecard from './Scorecard';

describe('Scorecard Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    inningsLog: [],
    currentOver: [],
    stats: {
      currentRunRate: 5.5,
      requiredRunRate: 8.0,
      playerStrikeRate: 120.5,
      botEconomy: 6.2,
    },
    summary: {
      overRuns: [],
      playerRuns: 45,
      botRuns: 40,
      playerWickets: 2,
      botWickets: 1,
      oversDisplay: '5.0',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<Scorecard {...defaultProps} open={false} />);
    // Framer motion AnimatePresence might still keep things in DOM momentarily, but we can check if the main text is absent.
    // Alternatively just check the wrapper.
    expect(screen.queryByText('Match Analytics')).toBeNull();
  });

  it('renders correctly with default props', () => {
    render(<Scorecard {...defaultProps} />);
    expect(screen.getByText('Match Analytics')).toBeInTheDocument();
    expect(screen.getByText('No deliveries yet.')).toBeInTheDocument();
    expect(screen.getByText('Over bars will appear as the innings grows.')).toBeInTheDocument();
    expect(screen.getByText('No balls yet in this over.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Scorecard {...defaultProps} />);
    // The close button has an X icon. We can find the button by its onClick handler or by testing library queries.
    // X icon is rendered via lucide-react, which renders an SVG. The button wraps it.
    const closeButtons = screen.getAllByRole('button'); // there is only one button
    fireEvent.click(closeButtons[0]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the background overlay', () => {
    const { container } = render(<Scorecard {...defaultProps} />);
    // Background overlay is the first motion.div
    const overlay = container.querySelector('.bg-arena-void\\/80');
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders inningsLog correctly', () => {
    const inningsLog = [
      { ballId: 1, runs: 0, isOut: false },
      { ballId: 2, runs: 4, isOut: false },
      { ballId: 3, runs: 0, isOut: true },
    ];
    render(<Scorecard {...defaultProps} inningsLog={inningsLog} />);
    
    // Check dot ball
    expect(screen.getByText('0')).toBeInTheDocument();
    // Check runs
    expect(screen.getByText('4')).toBeInTheDocument();
    // Check wicket
    expect(screen.getAllByText('W')).toHaveLength(1); // One from innings log, maybe another if in currentOver, but currentOver is empty
  });

  it('renders run rate graph (overRuns)', () => {
    const summary = {
      ...defaultProps.summary,
      overRuns: [
        { label: 'O1', runs: 12 },
        { label: 'O2', runs: 5 },
      ],
    };
    render(<Scorecard {...defaultProps} summary={summary} />);
    expect(screen.getByText('O1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('O2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders currentOver correctly', () => {
    const currentOver = [
      { ballId: 1, runs: 1, isOut: false },
      { ballId: 2, runs: 6, isOut: false },
      { ballId: 3, runs: 0, isOut: true },
      { ballId: 4, runs: 0, isOut: false },
    ];
    render(<Scorecard {...defaultProps} currentOver={currentOver} />);
    // Need to differentiate balls from currentOver and inningsLog. Since inningsLog is empty here:
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    const ws = screen.getAllByText('W');
    expect(ws.length).toBeGreaterThan(0);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('formats rates correctly handling non-finite values', () => {
    const stats = {
      currentRunRate: NaN,
      requiredRunRate: Infinity,
      playerStrikeRate: undefined,
      botEconomy: null,
    };
    render(<Scorecard {...defaultProps} stats={stats} />);
    
    // Should render 0.0 for non-finite
    const zeroPoinZeroElements = screen.getAllByText('0.0');
    expect(zeroPoinZeroElements.length).toBe(4); // 4 metrics
  });
});
