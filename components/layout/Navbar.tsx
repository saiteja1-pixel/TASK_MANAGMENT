'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ui/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { CheckSquare, LayoutDashboard, BarChart3, Calendar as CalendarIcon, Settings, Sun, Moon, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email ?? 'User');
      }
    });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-base)] neu-raised-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] group-hover:scale-105 transition-transform shrink-0">
                <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-main)]">
                TaskFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all neu-focus ${
                      isActive
                        ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-bold'
                        : 'text-[var(--text-main)] opacity-80 hover:opacity-100 hover:neu-raised-sm'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED] dark:text-[#8B5CF6]' : ''}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-[var(--text-main)] rounded-2xl neu-button neu-focus transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-[#7C3AED]" />
              )}
            </button>

            {/* User Profile pill */}
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl neu-inset-sm text-xs text-[var(--text-main)] font-semibold">
                <User className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
                <span className="max-w-[140px] truncate">{userEmail}</span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-semibold neu-button neu-focus text-[var(--text-main)] hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-[var(--shadow-dark)]/20">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold neu-focus ${
                  isActive
                    ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-bold'
                    : 'text-[var(--text-main)] opacity-70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
