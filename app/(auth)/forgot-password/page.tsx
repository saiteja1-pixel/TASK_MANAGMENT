'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetErr) {
        console.warn('Supabase reset password notice:', resetErr.message);
      }

      // Always show generic security success message regardless of user existence
      setSubmitted(true);
    } catch (err: any) {
      console.warn('Unexpected error during password reset request:', err);
      setSubmitted(true);
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
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-[var(--text-main)] opacity-70 font-semibold">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-base)] neu-raised p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Request error</p>
                <p className="text-xs opacity-90 mt-0.5 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="p-4 rounded-2xl neu-inset-sm text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3 bg-emerald-500/10 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <p className="font-extrabold text-base">Check your inbox</p>
                  <p className="text-xs opacity-90 mt-1 font-semibold leading-relaxed">
                    If an account exists for this email, a reset link has been sent. Check your inbox.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-[var(--text-main)] neu-button neu-focus"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl neu-button-primary neu-focus font-extrabold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-6 text-center pt-5 border-t border-[var(--shadow-dark)]/20">
                <Link
                  href="/login"
                  className="text-xs font-extrabold text-[#7C3AED] dark:text-[#8B5CF6] hover:underline inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
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
