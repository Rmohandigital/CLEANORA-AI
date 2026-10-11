import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; name: string; email: string }, token: string) => void;
  initialMode?: 'login' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        const idToken = await googleUser.getIdToken();
        onAuthSuccess(
          {
            id: googleUser.uid,
            name: googleUser.displayName || 'Google User',
            email: googleUser.email || '',
          },
          idToken
        );
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register account');

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset');

      setResetToken(data.resetToken);
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      }
      setResetStep(2);
      setSuccessMessage('Reset code generated. Enter your verification code and set a new password.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMessage('Password successfully updated! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setResetStep(1);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@cleanora.ai');
    setPassword('Cleanora2026!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-md p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Cleanora AI Account</span>
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {mode === 'login' && 'Sign in to Cleanora AI'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            {mode === 'login' && 'Access your processed media workspace and history.'}
            {mode === 'signup' && 'Save full-resolution media and keep past processing logs.'}
            {mode === 'reset' && 'Enter your verified account email to recover access.'}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-neutral-800 bg-neutral-900/90 p-3 text-xs text-neutral-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-white mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-neutral-700 bg-neutral-900/90 p-3 text-xs text-white">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-white mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('reset');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2.5 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Quick Demo Credentials Pill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-[11px] text-neutral-400 hover:text-white underline underline-offset-4"
              >
                Use sample demo account credentials (demo@cleanora.ai)
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('signup');
                }}
                className="font-medium text-white hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* Mode: SIGNUP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Vance"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2.5 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <div className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="font-medium text-white hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* Mode: RESET PASSWORD */}
        {mode === 'reset' && (
          <div className="space-y-4">
            {resetStep === 1 ? (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2.5 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending Request...' : 'Send Verification Code'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetConfirm} className="space-y-4">
                {demoCode && (
                  <div className="rounded-md border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-300">
                    <span className="text-neutral-500 block">Verification code for demo:</span>
                    <span className="font-mono text-white text-base tracking-widest font-bold">
                      {demoCode}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCodeInput}
                    onChange={(e) => setResetCodeInput(e.target.value)}
                    placeholder="e.g. 482910"
                    className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 px-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 px-3 text-sm text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-white py-2.5 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-400">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                  setResetStep(1);
                }}
                className="font-medium text-white hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
