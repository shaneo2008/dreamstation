/**
 * 🌙 AppWithAuth — Auth wrapper
 *
 * After login, renders the main DreamStation app directly.
 * Login screen styled with Finch warm pastel aesthetic.
 * Supabase auth flow is UNTOUCHED.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { supabase } from './lib/supabase';
import AuthenticatedApp from './components/AuthenticatedApp';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/* ─────────────────────────────────────────────
   Login Screen — Finch-style warm pastels
   ───────────────────────────────────────────── */
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email for confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sleep-gradient px-4 py-8 sm:py-6 text-cream-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,149,106,0.14),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(140,96,255,0.08),_transparent_32%)] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 sm:w-20 sm:h-20 bg-[#f8f1e7] rounded-[28px] shadow-card mb-3 sm:mb-4 border border-white/40"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Moon className="w-9 h-9 sm:w-10 sm:h-10 text-dream-glow" />
          </motion.div>
          <h1 className="text-3xl sm:text-3xl font-display font-bold text-cream-100 mb-2">
            DreamStation
          </h1>
          <p className="text-sm text-cream-300/75 font-body">Magical bedtime stories, reflections, and bedtime support.</p>
        </div>

        {/* Form card */}
        <div className="glass-card-solid p-5 sm:p-6 shadow-card">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-display font-bold text-cream-100 mb-1">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-cream-300/72 font-body">
              {isSignUp ? 'Start your DreamStation setup.' : 'Sign in to continue your evening routine.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field text-base sm:text-sm"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field text-base sm:text-sm"
              />
            </div>

            {error && (
              <div className={`text-xs text-center font-display font-semibold px-3 py-2.5 rounded-2xl border ${error.includes('Check your email')
                  ? 'text-success bg-success/10 border-success/20'
                  : 'text-[#F2A180] bg-[#F2A180]/10 border-[#F2A180]/20'
                }`}>
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full py-4 sm:py-3.5 rounded-2xl font-display font-bold text-base sm:text-sm transition-all ${loading
                ? 'bg-white/10 text-cream-400/55 cursor-not-allowed'
                : 'btn-primary shadow-glow-sm active:scale-[0.98]'
                }`}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Loading…
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </motion.button>
          </form>

          <p className="text-center mt-4 text-sm sm:text-xs text-cream-300/72 font-body">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-bold text-dream-glow hover:text-dream-aurora transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main App with Auth Wrapper
   ───────────────────────────────────────────── */
function AppWithAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sleep-gradient text-cream-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Moon className="w-8 h-8 text-dream-glow" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // After login → straight to the real authenticated app
  return <AuthenticatedApp />;
}

export default function AppWithAuthProvider() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}
