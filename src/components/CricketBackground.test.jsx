import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import CricketBackground from './CricketBackground';

describe('CricketBackground', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders without crashing', () => {
    const { container } = render(<CricketBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
