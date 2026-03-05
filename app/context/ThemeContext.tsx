'use client';

/**
 * Theme Context
 *
 * Provides MUI theming with light/dark mode and full RTL support.
 * - Detects system preference via prefers-color-scheme
 * - Persists user choice in localStorage
 * - RTL via stylis-plugin-rtl + Emotion CacheProvider
 */

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ThemeProvider,
  createTheme,
  type PaletteMode,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// ─── RTL Emotion Cache ──────────────────────────────────────────────────────

const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// ─── MUI Themes ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'theme-mode';

function buildTheme(mode: PaletteMode) {
  return createTheme({
    direction: 'rtl',
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#9c27b0' },
      ...(mode === 'dark' && {
        background: { default: '#121212', paper: '#1e1e1e' },
      }),
    },
    typography: {
      fontFamily: 'var(--font-cairo), Arial, sans-serif',
    },
    shape: { borderRadius: 12 },
  });
}

// ─── Context ────────────────────────────────────────────────────────────────

export interface ThemeContextValue {
  mode: PaletteMode;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggleMode: () => {},
});

// ─── Provider ───────────────────────────────────────────────────────────────

function getInitialMode(): PaletteMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const ctxValue = useMemo<ThemeContextValue>(
    () => ({ mode, toggleMode }),
    [mode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={ctxValue}>
      <CacheProvider value={rtlCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ThemeContext.Provider>
  );
}
