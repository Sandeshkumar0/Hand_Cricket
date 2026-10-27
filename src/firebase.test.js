import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({ type: 'database' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ type: 'auth' })),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({ type: 'analytics' })),
}));

describe('firebase.js', () => {
  it('initializes firebase services', async () => {
    const { analytics, db, auth } = await import('./firebase');
    expect(analytics).toBeDefined();
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
  });
});
