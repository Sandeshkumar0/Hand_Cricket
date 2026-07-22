import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundEngine } from '../utils/audio';

export default function AuthModal({ open, onClose }) {
  const { signup, login, currentUser, logout } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    soundEngine.playUiClick();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) throw new Error("Name is required");
        await signup(email, password, name);
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

              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
