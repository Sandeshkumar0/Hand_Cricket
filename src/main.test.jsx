import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const mockRender = vi.fn();
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: mockRender,
  })),
}));

describe('main.jsx', () => {
  it('renders without crashing', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main.jsx');
    const { createRoot } = await import('react-dom/client');
    expect(createRoot).toHaveBeenCalled();
    expect(mockRender).toHaveBeenCalled();
  });
});
