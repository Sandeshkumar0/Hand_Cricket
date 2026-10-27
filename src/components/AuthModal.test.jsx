import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/audio';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/audio', () => ({
  soundEngine: {
    playUiClick: vi.fn(),
  },
}));

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('returns null when open is false', () => {
    useAuth.mockReturnValue({});
    const { container } = render(<AuthModal open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders when open is true, and handles login flow', async () => {
    const loginMock = vi.fn().mockResolvedValue();
    const onCloseMock = vi.fn();
    
    useAuth.mockReturnValue({
      login: loginMock,
      signup: vi.fn(),
      googleLogin: vi.fn(),
      currentUser: null,
      logout: vi.fn(),
    });
    
    render(<AuthModal open={true} onClose={onCloseMock} />);
    
    expect(screen.getAllByText('LOGIN')[0]).toBeInTheDocument(); // Title

    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.change(usernameInput, { target: { value: 'Test_User! ' } });
    expect(usernameInput.value).toBe('test_user'); // lowercase and replace logic

    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    // The form submission is triggered by clicking the submit button
    const submitBtn = screen.getByRole('button', { name: 'LOGIN' });
    fireEvent.click(submitBtn);

    expect(soundEngine.playUiClick).toHaveBeenCalled();
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test_user@handcricket.local', 'pass123');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('handles signup flow and error', async () => {
    const signupMock = vi.fn().mockRejectedValue(new Error('Signup failed'));
    
    useAuth.mockReturnValue({
      login: vi.fn(),
      signup: signupMock,
      googleLogin: vi.fn(),
      currentUser: null,
      logout: vi.fn(),
    });
    
    render(<AuthModal open={true} onClose={vi.fn()} />);
    
    // Switch to Sign Up
    fireEvent.click(screen.getByText('Sign Up'));
    expect(screen.getAllByText('SIGN UP')[0]).toBeInTheDocument();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    
    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    const submitBtn = screen.getByRole('button', { name: 'SIGN UP' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith('newuser@handcricket.local', 'pass123', 'newuser');
      expect(screen.getByText('Signup failed')).toBeInTheDocument();
    });
    
    // Switch back to Login
    fireEvent.click(screen.getByText('Login'));
  });

  it('handles google login success', async () => {
    const googleMock = vi.fn().mockResolvedValue();
    const onCloseMock = vi.fn();
    
    useAuth.mockReturnValue({
      login: vi.fn(),
      signup: vi.fn(),
      googleLogin: googleMock,
      currentUser: null,
      logout: vi.fn(),
    });
    
    render(<AuthModal open={true} onClose={onCloseMock} />);
    
    fireEvent.click(screen.getByText(/Continue with Google/));
    
    await waitFor(() => {
      expect(googleMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('handles google login error', async () => {
    const googleMock = vi.fn().mockRejectedValue(new Error('Google failed'));
    
    useAuth.mockReturnValue({
      login: vi.fn(),
      signup: vi.fn(),
      googleLogin: googleMock,
      currentUser: null,
      logout: vi.fn(),
    });
    
    render(<AuthModal open={true} onClose={vi.fn()} />);
    
    fireEvent.click(screen.getByText(/Continue with Google/));
    
    await waitFor(() => {
      expect(screen.getByText('Google failed')).toBeInTheDocument();
    });
  });

  it('handles close button', () => {
    const onCloseMock = vi.fn();
    useAuth.mockReturnValue({ currentUser: null });
    render(<AuthModal open={true} onClose={onCloseMock} />);
    
    // By matching the svg X icon or just the first button
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons[0]; 
    fireEvent.click(closeBtn);
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('shows profile when currentUser is present and handles logout', () => {
    const logoutMock = vi.fn();
    const onCloseMock = vi.fn();
    
    useAuth.mockReturnValue({
      currentUser: { displayName: 'John Doe', email: 'john@example.com' },
      logout: logoutMock,
    });
    
    render(<AuthModal open={true} onClose={onCloseMock} />);
    
    expect(screen.getByText('PROFILE')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Logout'));
    expect(soundEngine.playUiClick).toHaveBeenCalled();
    expect(logoutMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('shows profile fallback to email when displayName is null', () => {
    useAuth.mockReturnValue({
      currentUser: { email: 'john@example.com' },
      logout: vi.fn(),
    });
    
    render(<AuthModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
