import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/audio';

export default function AuthModal({ open, onClose }) {
  const { signup, login, googleLogin, currentUser, logout } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    soundEngine.playUiClick();
    setError('');
    setLoading(true);

    try {
      const formattedEmail = `${email}@handcricket.local`;
      if (isLogin) {
        await login(formattedEmail, password);
      } else {
        await signup(formattedEmail, password, email);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-md apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
        >
          <div className="bmw-m-stripe absolute top-0 left-0 right-0 h-1" />
          
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition z-10"
          >
            <X size={18} />
          </button>

          <h2 className="esports-headline text-3xl font-black text-white text-center mb-6">
            {currentUser ? 'PROFILE' : (isLogin ? 'LOGIN' : 'SIGN UP')}
          </h2>

          {currentUser ? (
            <div className="text-center">
              <div className="mb-4 text-slate-300">
                Logged in as <strong className="text-white">{currentUser.displayName || currentUser.email}</strong>
              </div>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  logout();
                  onClose();
                }}
                className="w-full py-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase tracking-widest hover:bg-red-500/30 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono text-center">
                  {error}
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Username"
                  value={email} // We keep state name 'email' for simplicity but it holds username
                  onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold uppercase tracking-widest shadow-lg flex items-center justify-center hover:shadow-blue-500/25 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'LOGIN' : 'SIGN UP')}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-mono uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold uppercase tracking-widest shadow-lg flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-400 font-bold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
