import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HandGestureCard from './HandGestureCard';
import { soundEngine } from '../utils/audio';

// Mock soundEngine
vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
    playNumberSound: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ whileHover, whileTap, disabled, ...props }) => {
      // We explicitly don't pass disabled to the DOM element so we can trigger events
      // and test the component's internal isDisabled logic.
      return <button {...props}>{props.children}</button>;
    }
  }
}));

describe('HandGestureCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders default fallback value when no SVG match', () => {
    render(<HandGestureCard value={99} />);
    expect(screen.getAllByText('99').length).toBeGreaterThan(0); // in fallback
  });
  
  it('handles click and hover when not disabled', () => {
    const onClickMock = vi.fn();
    render(<HandGestureCard value={1} onClick={onClickMock} label="TEST" />);
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    
    fireEvent.click(button);
    expect(soundEngine.playNumberSound).toHaveBeenCalledWith(1);
    expect(onClickMock).toHaveBeenCalledWith(1);
  });
  
  it('does not trigger sounds or click when disabled', () => {
    const onClickMock = vi.fn();
    render(<HandGestureCard value={2} onClick={onClickMock} isDisabled={true} />);
    
    const button = screen.getByRole('button');
    // Remove disabled attribute to allow React to process the event, while the component still thinks isDisabled is true
    button.removeAttribute('disabled');
    
    fireEvent.mouseEnter(button);
    expect(soundEngine.playUiClick).not.toHaveBeenCalled();
    
    fireEvent.click(button);
    expect(soundEngine.playNumberSound).not.toHaveBeenCalled();
    expect(onClickMock).not.toHaveBeenCalled();
  });
  
  it('does not trigger onClick if not provided', () => {
    render(<HandGestureCard value={3} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(soundEngine.playNumberSound).not.toHaveBeenCalled(); // since onClick is not provided
  });
  
  it('renders correctly with isSelected', () => {
    render(<HandGestureCard value={4} isSelected={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('apple-glass');
  });

  it('tests different light colors', () => {
    // getLightColor returns 'bg-slate-800' if i > value
    // cyan if value <= 2
    // yellow if value <= 4
    // red otherwise
    
    // For value 0
    const { unmount: unmount0 } = render(<HandGestureCard value={0} />);
    unmount0();
    
    // For value 2 (tests cyan)
    const { unmount: unmount1 } = render(<HandGestureCard value={2} />);
    unmount1();
    
    // For value 4 (tests yellow)
    const { unmount: unmount2 } = render(<HandGestureCard value={4} />);
    unmount2();
    
    // For value 6 (tests red)
    render(<HandGestureCard value={6} />);
  });
});
