import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CricketBatIcon, CricketBallIcon, PlayerMarker } from './CricketIcons';

describe('CricketIcons components', () => {
  it('renders CricketBatIcon without crashing', () => {
    const { container } = render(<CricketBatIcon className="test-bat" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('test-bat');
  });

  it('renders CricketBallIcon without crashing', () => {
    const { container } = render(<CricketBallIcon className="test-ball" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('test-ball');
  });
});

describe('PlayerMarker component', () => {
  it('renders bat icon for bat token', () => {
    const { container } = render(<PlayerMarker token="bat" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders bat icon for 🏏 token', () => {
    const { container } = render(<PlayerMarker token="🏏" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ball icon for ball token', () => {
    const { container } = render(<PlayerMarker token="ball" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ball icon for ⚡ token', () => {
    const { container } = render(<PlayerMarker token="⚡" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders fallback token when not recognized', () => {
    const { getByText } = render(<PlayerMarker token="XYZ" className="custom-cls" fallbackClassName="custom-fallback" />);
    const el = getByText('XYZ');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('custom-cls');
    expect(el).toHaveClass('custom-fallback');
  });

  it('renders default fallback when token is missing', () => {
    const { getByText } = render(<PlayerMarker />);
    expect(getByText('❔')).toBeInTheDocument();
  });
});
