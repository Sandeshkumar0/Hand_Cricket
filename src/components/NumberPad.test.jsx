import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import NumberPad from './NumberPad';
import HandGestureCard from './HandGestureCard';

vi.mock('./HandGestureCard', () => ({
  default: ({ value, isDisabled, onClick, label }) => {
    return (
      <button
        data-testid="hand-gesture-card"
        disabled={isDisabled ? true : undefined}
        onClick={() => onClick(value)}
      >
        {label}
      </button>
    );
  }
}));

afterEach(() => {
  cleanup();
});

describe('NumberPad', () => {
  it('renders correctly with default options', () => {
    const { getAllByTestId, getByText } = render(<NumberPad onSelect={() => {}} />);
    const cards = getAllByTestId('hand-gesture-card');
    expect(cards).toHaveLength(6);
    expect(getByText('RUN 1')).toBeInTheDocument();
    expect(getByText('FOUR')).toBeInTheDocument();
    expect(getByText('SIX')).toBeInTheDocument();
  });

  it('calls onSelect when an option is clicked', () => {
    const onSelectMock = vi.fn();
    const { getByText } = render(<NumberPad onSelect={onSelectMock} />);
    fireEvent.click(getByText('RUN 3'));
    expect(onSelectMock).toHaveBeenCalledWith(3);
  });

  it('applies disabled classes when disabled is true', () => {
    const { container, getAllByTestId } = render(<NumberPad disabled={true} onSelect={() => {}} />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('pointer-events-none');
    expect(wrapper).toHaveClass('opacity-40');
    
    const cards = getAllByTestId('hand-gesture-card');
    expect(cards[0]).toBeDisabled();
  });

  it('renders correctly with custom grid classes for different option lengths', () => {
    const { container, rerender } = render(<NumberPad options={[1]} onSelect={() => {}} />);
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-1');

    rerender(<NumberPad options={[1, 2]} onSelect={() => {}} />);
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-2');

    rerender(<NumberPad options={[1, 2, 3]} onSelect={() => {}} />);
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-3');

    rerender(<NumberPad options={[1, 2, 3, 4]} onSelect={() => {}} />);
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-4');
    
    rerender(<NumberPad options={[1, 2, 3, 4, 5]} onSelect={() => {}} />);
    // 5 falls back to default mapping in GRID_CLASS which gives undefined, returning 'grid-cols-3 md:grid-cols-6'
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-3');
    expect(container.querySelector('.grid')).toHaveClass('md:grid-cols-6');
  });

  it('applies additional className properly', () => {
    const { container } = render(<NumberPad className="custom-class" onSelect={() => {}} />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
