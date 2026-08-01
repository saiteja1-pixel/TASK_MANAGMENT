'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((mode: ThemeMode) => {
    let effectiveTheme: 'light' | 'dark' = 'light';

    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = mode;
    }

    setResolvedTheme(effectiveTheme);

    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedMode = (localStorage.getItem('taskflow_theme_mode') ||
      localStorage.getItem('taskflow_theme')) as ThemeMode | null;

    const initialMode: ThemeMode =
      savedMode === 'dark' || savedMode === 'light' || savedMode === 'system'
        ? savedMode
        : 'system';

    setThemeModeState(initialMode);
    applyTheme(initialMode);

    // Listen for OS system theme changes if set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentMode = (localStorage.getItem('taskflow_theme_mode') as ThemeMode) || 'system';
      if (currentMode === 'system') {
        applyTheme('system');
      }
    };

    // Patch Element.prototype.releasePointerCapture safely to suppress Chrome touch emulator / dev overlay errors
    if (typeof window !== 'undefined' && Element.prototype.releasePointerCapture) {
      const origRelease = Element.prototype.releasePointerCapture;
      Element.prototype.releasePointerCapture = function (pointerId: number) {
        try {
          if (this.hasPointerCapture && this.hasPointerCapture(pointerId)) {
            origRelease.call(this, pointerId);
          }
        } catch (err) {
          // Ignore NotFoundError when pointer capture is released by browser DevTools or overlay
        }
      };
    }

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [applyTheme]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      localStorage.setItem('taskflow_theme_mode', mode);
      localStorage.setItem('taskflow_theme', mode);
      applyTheme(mode);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  }, [resolvedTheme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme: mounted ? resolvedTheme : 'light',
        themeMode: mounted ? themeMode : 'system',
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
