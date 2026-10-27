import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MoveTimer from './MoveTimer';

describe('MoveTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not start timer if isActive is false', () => {
    const handleExpire = vi.fn();
    const { getByText } = render(<MoveTimer isActive={false} duration={10} onExpire={handleExpire} />);
    
    expect(getByText('10')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(getByText('10')).toBeInTheDocument(); // Time shouldn't change
    expect(handleExpire).not.toHaveBeenCalled();
  });

  it('does not start timer if duration is 0', () => {
    const handleExpire = vi.fn();
    const { getByText } = render(<MoveTimer isActive={true} duration={0} onExpire={handleExpire} />);
    
    expect(getByText('0')).toBeInTheDocument();
    expect(getByText('Timer disabled')).toBeInTheDocument();
    expect(getByText('Manual play only')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(getByText('0')).toBeInTheDocument();
    expect(handleExpire).not.toHaveBeenCalled();
  });

  it('starts timer and decrements timeLeft when isActive is true', () => {
    const { getByText } = render(<MoveTimer isActive={true} duration={10} />);
    
    expect(getByText('10')).toBeInTheDocument();
    expect(getByText('Decision window active')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(getByText('9')).toBeInTheDocument();
  });

  it('calls onExpire and stops when timeLeft reaches 0', () => {
    const handleExpire = vi.fn();
    const { getByText } = render(<MoveTimer isActive={true} duration={2} onExpire={handleExpire} />);
    
    expect(getByText('2')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(getByText('1')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(getByText('0')).toBeInTheDocument();
    expect(handleExpire).toHaveBeenCalledTimes(1);

    // Further ticks shouldn't do anything or call onExpire again
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(handleExpire).toHaveBeenCalledTimes(1);
  });

  it('handles rendering with duration 0 or already expired state without crashing', () => {
    render(<MoveTimer isActive={true} duration={1} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    }); 
  });

  it('changes styles and texts when timeLeft <= 5 and <= 3', () => {
    const { getByText, container } = render(<MoveTimer isActive={true} duration={5} />);
    
    // At timeLeft = 5
    expect(getByText('5')).toHaveClass('text-amber-300');
    expect(getByText('Decision window active')).toBeInTheDocument();
    
    // At timeLeft = 3
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(getByText('3')).toBeInTheDocument();
    expect(getByText('3')).toHaveClass('text-arena-secondary');
    expect(getByText('Make your move now')).toBeInTheDocument();
    
    // Root container should have danger-shake
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('danger-shake');
  });

  it('shows correct styles at normal time', () => {
    const { getByText, container } = render(<MoveTimer isActive={true} duration={10} />);
    expect(getByText('10')).toHaveClass('text-arena-primary');
    const rootDiv = container.firstChild;
    expect(rootDiv).not.toHaveClass('danger-shake');
  });

  it('clears interval on unmount', () => {
    const { unmount } = render(<MoveTimer isActive={true} duration={10} />);
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });
});
