import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import MotorsportHUD from './MotorsportHUD';

describe('MotorsportHUD', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders with default props', () => {
    const { container } = render(<MotorsportHUD />);
    expect(screen.getByText('HAND CRICKET ARENA')).toBeInTheDocument();
    expect(screen.getByText('LIVE MATCH TELEMETRY')).toBeInTheDocument();
    expect(screen.getByText('INNINGS 1')).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument(); // CRR 0.0
    
    // Default lightbar should be blue
    const lightbar = container.firstChild.firstChild; // first child of main div
    expect(lightbar).toHaveClass('ps-lightbar-blue');
  });

  it('renders with lightbarState red', () => {
    const { container } = render(<MotorsportHUD lightbarState="red" />);
    const lightbar = container.firstChild.firstChild;
    expect(lightbar).toHaveClass('ps-lightbar-red');
  });

  it('renders with lightbarState gold', () => {
    const { container } = render(<MotorsportHUD lightbarState="gold" />);
    const lightbar = container.firstChild.firstChild;
    expect(lightbar).toHaveClass('ps-lightbar-gold');
  });

  it('renders currentRunRate appropriately', () => {
    render(<MotorsportHUD currentRunRate={10.5} />);
    expect(screen.getByText('10.5')).toBeInTheDocument();
  });

  it('renders requiredRunRate when provided', () => {
    render(<MotorsportHUD requiredRunRate={12.5} />);
    expect(screen.getByText('RRR')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
  });

  it('does not render requiredRunRate when null', () => {
    render(<MotorsportHUD requiredRunRate={null} />);
    expect(screen.queryByText('RRR')).not.toBeInTheDocument();
  });

  it('renders wicketsRemaining correctly and applies styles for <= 2', () => {
    const { rerender } = render(<MotorsportHUD wicketsRemaining={5} />);
    expect(screen.getByText('5 LEFT')).toBeInTheDocument();
    expect(screen.getByText('5 LEFT')).toHaveClass('text-slate-200');

    rerender(<MotorsportHUD wicketsRemaining={2} />);
    expect(screen.getByText('2 LEFT')).toBeInTheDocument();
    expect(screen.getByText('2 LEFT')).toHaveClass('text-red-400');
  });

  it('clamps crrPercentage and rrrPercentage between 5 and 100', () => {
    const { container, rerender } = render(<MotorsportHUD currentRunRate={0} requiredRunRate={0} />);
    
    const progressBars = container.querySelectorAll('.bg-gradient-to-r');
    expect(progressBars[0]).toHaveStyle({ width: '5%' }); // CRR
    expect(progressBars[1]).toHaveStyle({ width: '5%' }); // RRR

    rerender(<MotorsportHUD currentRunRate={36} requiredRunRate={36} />);
    const progressBarsMax = container.querySelectorAll('.bg-gradient-to-r');
    expect(progressBarsMax[0]).toHaveStyle({ width: '100%' }); // CRR
    expect(progressBarsMax[1]).toHaveStyle({ width: '100%' }); // RRR
  });
});
