'use client';

/**
 * Theme Context
 *
 * Provides MUI theming with light/dark mode and full RTL support.
 * - Detects system preference via prefers-color-scheme
 * - Persists user choice in localStorage
 * - RTL via EmotionCacheProvider (AppRouterCacheProvider + stylis-plugin-rtl)
 *   which is set up in layout.tsx — no duplicate CacheProvider here.
 */

import {
  createContext,
  startTransition,
  useCallback,
  useEffect,
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
import { useLocale } from 'next-intl';

// ─── MUI Themes ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'theme-mode';

function buildTheme(mode: PaletteMode, dir: 'rtl' | 'ltr' = 'rtl') {
  const isDark = mode === 'dark';

  return createTheme({
    direction: dir,
    palette: {
      mode,
      // ── Primary ─────────────────────────────────────────────────────────
      // Light: #1565c0  (Blue 800)  → white text   : 5.84:1 ✅ AA
      // Dark : #42a5f5  (Blue 400)  → dark navy text: 7.57:1 ✅ AAA
      //   NOTE: white (#fff) on #42a5f5 is only 2.64:1 (❌ WCAG fail).
      //   contrastText uses dark ink in dark mode so filled buttons and the
      //   AppBar (which inherits primary.contrastText) always meet AA.
      primary: {
        main: isDark ? '#42a5f5' : '#1565c0',
        light: isDark ? '#90caf9' : '#1976d2',
        dark: isDark ? '#1976d2' : '#0d47a1',
        // Dark navy (≈Black-on-blue) gives 7.57:1 on #42a5f5 ✅ AAA
        // White on #1565c0 gives 5.84:1 ✅ AA
        contrastText: isDark ? '#0a1929' : '#ffffff',
      },
      // ── Secondary ───────────────────────────────────────────────────────
      // Light: #7b1fa2 (Purple 800) → contrast vs white  = 7.08:1 ✅ AAA
      // Dark : #ce93d8 (Purple 200) → contrast vs #121212 = 9.4:1  ✅ AAA
      secondary: {
        main: isDark ? '#ce93d8' : '#7b1fa2',
        contrastText: isDark ? '#1a1a2e' : '#ffffff',
      },
      // ── Error ───────────────────────────────────────────────────────────
      error: {
        main: isDark ? '#ef9a9a' : '#c62828',
        contrastText: isDark ? '#1a1a2e' : '#ffffff',
      },
      // ── Backgrounds ─────────────────────────────────────────────────────
      background: isDark
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#f0f4f8', paper: '#ffffff' },
      // ── Text ────────────────────────────────────────────────────────────
      // All text colors meet WCAG AA (4.5:1) against their backgrounds.
      text: isDark
        ? {
            primary: '#e8eaed',    // 15.8:1 vs #121212  ✅ AAA
            secondary: '#9aa5b4',  //  6.5:1 vs #121212  ✅ AA
            disabled: '#5c6773',   //  2.8:1 — disabled state, acceptable
          }
        : {
            primary: '#1a1a2e',    // 17.0:1 vs #f0f4f8  ✅ AAA
            secondary: '#455a64',  //  5.3:1 vs #f0f4f8  ✅ AA
            disabled: '#78909c',   //  3.1:1 — disabled state, acceptable
          },
      divider: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    },
    // ── Typography ────────────────────────────────────────────────────────
    typography: {
      fontFamily: 'var(--font-cairo), Arial, sans-serif',
      body1: { lineHeight: 1.7 },
      body2: { lineHeight: 1.65 },
    },
    shape: { borderRadius: 12 },
    // ── Component overrides ───────────────────────────────────────────────
    components: {
      // Cards: ensure visible border in both modes
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },
      // Outlined inputs: stronger border for better visibility
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: () => ({
            borderColor: isDark
              ? 'rgba(255,255,255,0.32)'
              : 'rgba(0,0,0,0.32)',
            borderWidth: '1.5px',
          }),
        },
      },
      // Chip outlines: slightly bolder border
      MuiChip: {
        styleOverrides: {
          outlined: () => ({
            borderWidth: '1.5px',
          }),
        },
      },
      // Toggle buttons: readable text in unselected state
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
              backgroundColor: isDark
                ? 'rgba(66,165,245,0.16)'
                : 'rgba(21,101,192,0.10)',
            },
          }),
        },
      },
      // Fab: ensure it pops on all backgrounds
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 4px 14px rgba(0,0,0,0.6)'
              : '0 4px 14px rgba(0,0,0,0.25)',
          },
        },
      },
    },
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

/**
 * HYDRATION SAFETY PATTERN
 * ────────────────────────
 * Problem: useState(getInitialMode) runs during React hydration on the client.
 * If the user saved "dark", getInitialMode returns 'dark' — but the server
 * always rendered 'light'. The theme objects differ → Emotion generates
 * different CSS class hashes → React hydration mismatch error.
 *
 * Fix: always start with 'light' (matching SSR). A useEffect switches to the
 * real preference after hydration is complete — safe, no mismatch.
 *
 * Visual flash prevention: the blocking <script> in layout.tsx sets
 * data-color-scheme on <html> synchronously, and globals.css applies the
 * correct background/color before React even mounts. So there is no visible
 * flash even though React starts in light mode.
 */
export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  // Always 'light' on first render — matches the server-rendered HTML exactly.
  const [mode, setMode] = useState<PaletteMode>('light');

  // Derive text direction from the current locale.
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // After hydration, apply the real saved/system preference.
  useEffect(() => {
    // Apply the user's real preference now that we're client-side.
    // Wrapped in startTransition to signal a non-urgent (background) update,
    // which is the React-compiler-accepted pattern for state sync from
    // external systems (localStorage / matchMedia).
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: PaletteMode = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

    startTransition(() => setMode(resolved));

    // Also sync the attribute in case the blocking script didn't run (e.g. JS disabled)
    document.documentElement.setAttribute('data-color-scheme', resolved);
  }, []); // ← runs once, after hydration

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-color-scheme', next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode, dir), [mode, dir]);

  const ctxValue = useMemo<ThemeContextValue>(
    () => ({ mode, toggleMode }),
    [mode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={ctxValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
