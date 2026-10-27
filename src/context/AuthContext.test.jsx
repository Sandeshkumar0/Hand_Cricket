import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { loadAllCareerStats, saveAllCareerStats } from '../utils/statsStorage';

vi.mock('../firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn()
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn()
}));

vi.mock('../utils/statsStorage', () => ({
  loadAllCareerStats: vi.fn(),
  saveAllCareerStats: vi.fn()
}));

const TestComponent = () => {
  const { currentUser, signup, login, googleLogin, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{currentUser ? currentUser.uid : 'none'}</div>
      <button onClick={() => signup('test@test.com', 'password', 'Test Name')}>Signup</button>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => googleLogin()}>Google</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  let user;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children when loading is false and sets currentUser (snapshot exists)', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'user1', displayName: 'Test User' });
      return vi.fn();
    });
    const mockSnapshot = {
      exists: () => true,
      val: () => ({ player: { name: 'Loaded from cloud' } })
    };
    get.mockResolvedValue(mockSnapshot);

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user1');
    });
    expect(saveAllCareerStats).toHaveBeenCalledWith(mockSnapshot.val());
  });

  it('handles auth state with missing stats (snapshot does not exist)', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'user2', displayName: 'New User' });
      return vi.fn();
    });
    const mockSnapshot = { exists: () => false };
    get.mockResolvedValue(mockSnapshot);
    loadAllCareerStats.mockReturnValue({ player: { name: 'Default' } });

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user2');
    });
    expect(set).toHaveBeenCalled();
    expect(saveAllCareerStats).toHaveBeenCalledWith({ player: { name: 'New User' } });
  });

  it('handles auth state with missing stats and missing displayName', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'user2_nodisp' }); // no displayName
      return vi.fn();
    });
    const mockSnapshot = { exists: () => false };
    get.mockResolvedValue(mockSnapshot);
    loadAllCareerStats.mockReturnValue({ player: { name: 'Default' } });

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user2_nodisp');
    });
    expect(saveAllCareerStats).toHaveBeenCalledWith({ player: { name: 'Default' } });
  });

  it('handles get error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'user3', displayName: 'Error User' });
      return vi.fn();
    });
    get.mockRejectedValue(new Error('Network error'));

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user3');
    });
    expect(consoleError).toHaveBeenCalledWith("Error syncing stats", expect.any(Error));
    consoleError.mockRestore();
  });

  it('handles null user (logged out)', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return vi.fn();
    });

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
  });

  it('calls signup and updates profile', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return vi.fn(); });
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'new1' } });
    loadAllCareerStats.mockReturnValue({ player: { name: 'Def' } });

    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    await user.click(screen.getByText('Signup'));
    
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@test.com', 'password');
    });
    expect(updateProfile).toHaveBeenCalledWith({ uid: 'new1' }, { displayName: 'Test Name' });
    expect(set).toHaveBeenCalled();
    expect(saveAllCareerStats).toHaveBeenCalled();
  });

  it('calls login', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return vi.fn(); });
    
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await user.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@test.com', 'password');
    });
  });

  it('calls googleLogin', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return vi.fn(); });
    
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await user.click(screen.getByText('Google'));
    
    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });

  it('calls logout', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return vi.fn(); });
    
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await user.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });
});
