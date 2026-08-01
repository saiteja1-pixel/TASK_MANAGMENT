'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(true);

  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // Listen for password recovery auth event from URL hash
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
              setHasValidSession(true);
            }
          });
          setTimeout(() => {
            setCheckingSession(false);
          }, 1000);
          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          setHasValidSession(true);
          setCheckingSession(false);
        }
      } catch (err) {
        setHasValidSession(false);
        setCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(updateErr.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while resetting password.');
    } finally {
      setLoading(false);
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
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-[var(--text-main)] opacity-70 font-semibold">
            Enter a new password for your TaskFlow account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-base)] neu-raised p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Reset error</p>
                <p className="text-xs opacity-90 mt-0.5 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="p-4 rounded-2xl neu-inset-sm text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3 bg-emerald-500/10 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <p className="font-extrabold text-base">Password updated!</p>
                  <p className="text-xs opacity-90 mt-1 font-semibold leading-relaxed">
                    Your password has been changed successfully. Redirecting you to sign in...
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 rounded-2xl neu-button-primary neu-focus font-extrabold text-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : !hasValidSession && !checkingSession ? (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="p-4 rounded-2xl neu-inset-sm text-amber-700 dark:text-amber-300 text-sm flex items-start gap-3 bg-amber-500/10 text-left">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-base">Link expired or invalid</p>
                  <p className="text-xs opacity-90 mt-1 font-semibold leading-relaxed">
                    This password reset link is invalid or has expired. Please request a new link.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="w-full py-3.5 px-4 rounded-2xl neu-button-primary neu-focus font-extrabold text-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Request a New Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-main)] opacity-70 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-main)] opacity-50">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-main)] opacity-50">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Must match new password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus text-sm font-semibold transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-main)] opacity-60 hover:opacity-100 neu-focus"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl neu-button-primary neu-focus font-extrabold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-main)] opacity-70 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected with Supabase Auth Security</span>
        </div>
      </div>
    </div>
  );
}
