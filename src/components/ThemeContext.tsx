import React, { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem('kirana-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // useLayoutEffect so the class is applied before paint
  useLayoutEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem('kirana-theme', theme);
    } catch { /* ignore */ }
  }, [theme]);

  // Also apply immediately on mount (SSR fallback)
  useLayoutEffect(() => {
    applyThemeToDOM(getInitialTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Apply immediately so there's no flash
      applyThemeToDOM(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, toggleTheme, isDark: theme === 'dark' }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
