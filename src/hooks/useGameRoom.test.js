import { renderHook, act } from '@testing-library/react';
import { useGameRoom } from './useGameRoom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as firebaseDB from 'firebase/database';
import * as firebaseUtils from '../utils/firebaseUtils';

vi.mock('../firebase.js', () => ({
  db: {}
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  onValue: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIME')
}));

vi.mock('../utils/firebaseUtils.js', () => ({
  BOT_NAMES: ['Bot1', 'Bot2'],
  getPlayerEmojiForId: vi.fn(() => '🏏'),
  generateBotId: vi.fn(() => 'bot-123')
}));

describe('useGameRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null state and empty actions if no roomCode', () => {
    const { result } = renderHook(() => useGameRoom(null, 'user1'));
    expect(result.current.roomState).toBeNull();
    expect(result.current.actions).toEqual({});
    expect(result.current.isHost).toBeFalsy();
  });

  it('sets up onValue listener when roomCode is provided', () => {
    let callback;
    firebaseDB.onValue.mockImplementation((ref, cb) => {
      callback = cb;
      return vi.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    
    expect(firebaseDB.onValue).toHaveBeenCalled();
    
    // Test snapshot exists
    act(() => {
      callback({ exists: () => true, val: () => ({ meta: { hostId: 'user1' } }) });
    });
    
    expect(result.current.roomState).toEqual({ meta: { hostId: 'user1' } });
    expect(result.current.isHost).toBe(true);

    // Test snapshot not exists
    act(() => {
      callback({ exists: () => false });
    });
    expect(result.current.roomState).toBeNull();
  });

  it('actions.createRoom', async () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    await act(async () => {
      await result.current.actions.createRoom('Player 1', { overs: 5 });
    });
    expect(firebaseDB.set).toHaveBeenCalled();
  });

  it('actions.joinRoom', async () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    await act(async () => {
      await result.current.actions.joinRoom('Player 2');
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.updateSettings', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.updateSettings('overs', 10);
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.confirmSettings', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.confirmSettings();
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.addBot', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.addBot(1);
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.toggleReady', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.toggleReady(true);
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.removePlayer', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.removePlayer('p2');
    });
    expect(firebaseDB.remove).toHaveBeenCalled();
  });

  it('actions.startGame', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.startGame();
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.submitTossMove', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.submitTossMove('user1', 3);
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.submitMatchTossMove', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.submitMatchTossMove('user1', 5);
    });
    expect(firebaseDB.update).toHaveBeenCalled();
  });

  it('actions.resetRoom', () => {
    const { result } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    act(() => {
      result.current.actions.resetRoom();
    });
    expect(firebaseDB.remove).toHaveBeenCalled();
  });

  it('cleans up onValue listener on unmount', () => {
    const unsubscribe = vi.fn();
    firebaseDB.onValue.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useGameRoom('ROOM1', 'user1'));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
