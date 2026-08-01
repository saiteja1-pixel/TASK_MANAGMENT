'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckSquare, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMsg('Account created successfully! Check your email to confirm registration or sign in directly.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const redirectToUrl = `${window.location.origin}/dashboard`;

      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
        },
      });

      if (googleErr) {
        setError(googleErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[var(--bg-base)] transition-colors relative overflow-hidden font-sans">
      {/* Theme Switcher Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full neu-button neu-focus text-[var(--text-main)] transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#7C3AED]" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7C3AED] text-white shadow-[4px_4px_10px_var(--shadow-dark),-4px_-4px_10px_var(--shadow-light)] mb-4 hover:scale-105 transition-transform duration-200">
            <CheckSquare className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Create your TaskFlow Account
          </h1>
          <p className="mt-2 text-sm text-[var(--text-main)] opacity-70 font-semibold">
            Start organizing your tasks with persistent dashboard tracking
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-[var(--bg-base)] neu-raised p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Sign up failed</p>
                <p className="text-xs opacity-90 mt-0.5 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl neu-inset-sm text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Account created</p>
                <p className="text-xs opacity-90 mt-0.5 font-semibold">{successMsg}</p>
                <Link href="/login" className="mt-2 inline-block font-extrabold text-[#7C3AED] dark:text-[#8B5CF6] hover:underline text-xs">
                  Proceed to Login →
                </Link>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-[#363B52] text-gray-700 dark:text-gray-200 font-extrabold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#3E435D] shadow-sm flex items-center justify-center gap-3 transition disabled:opacity-60 neu-focus mb-5"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider Line */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-[var(--shadow-dark)]/20"></div>
            <span className="absolute bg-[var(--bg-base)] px-3 text-[10px] font-extrabold text-[var(--text-main)] opacity-50 uppercase tracking-widest">
              OR
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-main)] opacity-50">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus text-sm font-semibold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-main)] opacity-50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus text-sm font-semibold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-main)] opacity-60 hover:opacity-100 neu-focus"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-main)] opacity-50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus text-sm font-semibold transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 px-4 rounded-2xl neu-button-primary neu-focus font-extrabold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center pt-6 border-t border-[var(--shadow-dark)]/20">
            <p className="text-sm text-[var(--text-main)] opacity-80 font-semibold">
              Already have an account?{' '}
              <Link href="/login" className="font-extrabold text-[#7C3AED] dark:text-[#8B5CF6] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
