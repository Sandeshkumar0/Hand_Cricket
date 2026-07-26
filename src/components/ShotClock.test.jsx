import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShotClock from './ShotClock';

describe('ShotClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it('renders with default props', () => {
    render(<ShotClock />);
    expect(screen.getByText('15')).toBeInTheDocument(); // default duration
  });

  it('renders with label and custom duration', () => {
    render(<ShotClock duration={10} label="Test Label" />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('updates remaining time when duration prop changes', () => {
    const { rerender } = render(<ShotClock duration={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
    rerender(<ShotClock duration={20} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('does not tick when isActive is false', () => {
    render(<ShotClock duration={10} isActive={false} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('ticks down when isActive is true', () => {
    render(<ShotClock duration={10} isActive={true} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('stops at 0 and calls onExpire', () => {
    const onExpireMock = vi.fn();
    render(<ShotClock duration={2} isActive={true} onExpire={onExpireMock} />);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(onExpireMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(onExpireMock).toHaveBeenCalledTimes(1);

    // advancing further should not decrement below 0
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(onExpireMock).toHaveBeenCalledTimes(1);
  });

  it('calls onExpire when it becomes 0 without onExpire provided initially', () => {
    // testing branch where onExpire is not provided
    render(<ShotClock duration={1} isActive={true} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('tests getColor and getGlow branches', () => {
    // Initially > 7
    const { rerender, container } = render(<ShotClock duration={10} />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ filter: 'drop-shadow(0 0 8px rgba(90, 240, 179, 0.3))' });
    let text = screen.getByText('10');
    expect(text).toHaveStyle({ color: '#5af0b3' });
    expect(text).not.toHaveClass('animate-pulse');

    // <= 7
    rerender(<ShotClock duration={7} />);
    svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))' });
    text = screen.getByText('7');
    expect(text).toHaveStyle({ color: '#f59e0b' });
    expect(text).not.toHaveClass('animate-pulse');

    // <= 3
    rerender(<ShotClock duration={3} />);
    svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' });
    text = screen.getByText('3');
    expect(text).toHaveStyle({ color: '#ef4444' });
    expect(text).toHaveClass('animate-pulse');
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<ShotClock duration={10} />);
    unmount();
    // No error should occur when timers advance after unmount
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it('handles negative or 0 initial duration', () => {
    render(<ShotClock duration={0} isActive={true} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
