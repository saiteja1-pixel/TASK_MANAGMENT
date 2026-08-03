'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ui/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/types/database';
import { getPresetAvatar, getLocalUserProfile } from '@/lib/avatars';
import {
  CheckSquare,
  LayoutDashboard,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial local profile load
    const local = getLocalUserProfile();
    if (local) setUserProfile(local);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email ?? 'User');
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            if (profileData) setUserProfile(profileData as UserProfile);
          });
      } else {
        setUserEmail(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? 'User');
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            if (profileData) setUserProfile(profileData as UserProfile);
          });
      } else {
        setUserEmail(null);
      }
    });

    // Event listener for real-time profile updates from Settings
    const handleProfileUpdated = () => {
      const updated = getLocalUserProfile();
      if (updated) setUserProfile(updated);
    };

    window.addEventListener('taskflow_profile_updated', handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('taskflow_profile_updated', handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle Escape key to close modals / popups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProfileCard) setShowProfileCard(false);
        if (showLogoutConfirm) setShowLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProfileCard, showLogoutConfirm]);

  // Handle click outside to close profile card popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileCardRef.current &&
        !profileCardRef.current.contains(e.target as Node)
      ) {
        setShowProfileCard(false);
      }
    };
    if (showProfileCard) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileCard]);

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      setShowLogoutConfirm(false);
      const supabase = createClient();
      await supabase.auth.signOut();
      setUserEmail(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!userEmail && href === '/settings') {
      e.preventDefault();
      router.push('/login?redirect=/settings');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: 'Phase 2' },
    { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-30 w-full bg-[var(--bg-base)] neu-raised-sm px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] shrink-0">
            <CheckSquare className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[var(--text-main)]">
            TaskFlow
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl neu-button neu-focus text-[var(--text-main)] flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-60 bg-[var(--bg-base)] dark:bg-[#171A26] dark:border-r dark:border-white/5 neu-raised flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-[var(--shadow-dark)]/20">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] group-hover:scale-105 transition-transform duration-200 shrink-0">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-main)] block leading-tight">
                TaskFlow
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-[#7C3AED] dark:text-[#8B5CF6] uppercase">
                Pro Workspace
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 min-h-[44px] min-w-[44px] rounded-xl neu-button text-[var(--text-main)] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3.5 space-y-2 flex-1 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-60">
            Main Menu
          </p>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavLinkClick(e, link.href)}
                className={`relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 neu-focus ${isActive
                  ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-bold'
                  : 'text-[var(--text-main)] opacity-80 hover:opacity-100 hover:neu-raised-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive
                      ? 'text-[#7C3AED] dark:text-[#8B5CF6]'
                      : 'text-[var(--text-main)] opacity-60'
                      }`}
                  />
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span className="px-2 py-0.5 rounded-xl neu-inset-sm text-[10px] font-bold text-[#7C3AED] dark:text-[#8B5CF6]">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Controls / User Account */}
        <div className="mt-auto p-3.5 space-y-2.5 border-t border-[var(--shadow-dark)]/20">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold neu-button neu-focus text-[var(--text-main)]"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#7C3AED]" />
              )}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg neu-inset-sm font-mono text-[var(--text-main)]">
              {theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          {/* User Email Card vs Guest Sign In Button */}
          {userEmail ? (
            <div className="relative" ref={profileCardRef}>
              {/* Profile Popover Card */}
              {showProfileCard && (
                <div className="absolute bottom-full left-0 right-0 mb-3 p-5 rounded-3xl bg-white dark:bg-[#363B52] border border-gray-200/80 dark:border-gray-700/60 shadow-[0_8px_24px_rgba(0,0,0,0.15)] animate-fade-in z-50">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-[#8B5CF6]" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#8B5CF6]">
                        User Profile
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProfileCard(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                      title="Close profile card"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Popover Content */}
                  <div className="flex flex-col items-center text-center">
                    {/* Large Avatar Preview */}
                    {(() => {
                      const preset = getPresetAvatar(userProfile?.avatar_id);
                      if (preset) {
                        const IconComp = preset.icon;
                        return (
                          <div className={`w-16 h-16 rounded-2xl ${preset.bgColor} text-white flex items-center justify-center shadow-md mb-2.5 shrink-0`}>
                            <IconComp className="w-9 h-9 stroke-[2.2]" />
                          </div>
                        );
                      }
                      return (
                        <div className="w-16 h-16 rounded-2xl bg-[#7C3AED] text-white font-extrabold text-xl flex items-center justify-center shadow-md mb-2.5 shrink-0">
                          {getInitials(userEmail)}
                        </div>
                      );
                    })()}

                    {/* Display Name */}
                    <h4 className="text-base font-extrabold text-[#1A202C] dark:text-white leading-snug break-words max-w-full">
                      {userProfile?.display_name || userEmail.split('@')[0]}
                    </h4>

                    {/* Email */}
                    <p className="text-[11px] font-semibold text-[#4A5568] dark:text-gray-300 truncate max-w-full mb-3">
                      {userEmail}
                    </p>

                    {/* Bio Text or Setup Prompt */}
                    {userProfile?.bio ? (
                      <div className="w-full p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/40 text-left">
                        <p className="text-xs text-[#2D3748] dark:text-gray-200 font-medium leading-relaxed break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {userProfile.bio}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/40 text-center space-y-1">
                        <p className="text-xs text-[#4A5568] dark:text-gray-400 font-semibold">
                          No bio set yet
                        </p>
                        <Link
                          href="/settings"
                          onClick={() => setShowProfileCard(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#7C3AED] dark:text-[#8B5CF6] hover:underline"
                        >
                          Set up your profile →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trigger Button: User Avatar & Name Card */}
              <div
                onClick={() => setShowProfileCard(!showProfileCard)}
                className="flex items-center gap-2.5 p-3 rounded-2xl neu-inset-sm cursor-pointer hover:neu-raised-sm transition-all duration-150 group"
                title="Click to view profile card"
              >
                {(() => {
                  const preset = getPresetAvatar(userProfile?.avatar_id);
                  if (preset) {
                    const IconComp = preset.icon;
                    return (
                      <div className={`w-8 h-8 rounded-xl ${preset.bgColor} text-white flex items-center justify-center shrink-0 shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                    );
                  }
                  return (
                    <div className="w-8 h-8 rounded-xl bg-[#7C3AED] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] group-hover:scale-105 transition-transform">
                      {getInitials(userEmail)}
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[var(--text-main)] truncate">
                    {userProfile?.display_name || userEmail}
                  </p>
                  <p
                    className="text-[10px] font-semibold text-[var(--text-main)] opacity-65 truncate"
                    title={userEmail}
                  >
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOutClick}
                disabled={loggingOut}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold neu-button neu-focus text-[var(--text-main)] hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login?redirect=/dashboard"
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus text-white transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Copyright Notice */}
          <div className="pt-2 text-center">
            <p className="text-[10px] font-semibold tracking-wide text-[var(--text-main)] opacity-50">
              © {new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--bg-base)] neu-raised-lg rounded-3xl overflow-hidden p-6 space-y-5"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--shadow-dark)]/20">
              <div className="p-2.5 rounded-2xl neu-inset-sm text-red-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-[var(--text-main)]">
                Sign Out Confirmation
              </h3>
            </div>

            <p className="text-sm font-semibold text-[var(--text-main)] opacity-80">
              Are you sure you want to sign out?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)] opacity-80 hover:opacity-100 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={loggingOut}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold neu-focus text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loggingOut && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
