/**
 * layout.ts — Centralized layout constants
 *
 * Single source of truth for all layout dimensions, z-indexes, transitions,
 * and spacing used across components. Import from here instead of hardcoding.
 *
 * Usage:
 *   import { APP_BAR_HEIGHT, DRAWER_WIDTH, TRANSITIONS } from '@/app/lib/ui-constants';
 */

// ─── AppBar ──────────────────────────────────────────────────────────────────
// MUI Toolbar default heights: 56px on mobile (xs), 64px on desktop (sm+)
export const APP_BAR_HEIGHT = {
  xs: 56,
  sm: 64,
} as const;

// ─── Sidebar Drawer ───────────────────────────────────────────────────────────
export const DRAWER_WIDTH = 240;

// ─── Z-index layers ───────────────────────────────────────────────────────────
// Aligned with MUI theme.zIndex.*:
//   mobileStepper=1000, fab=1050, appBar=1100, drawer=1200, modal=1300,
//   snackbar=1400, tooltip=1500
// Our AppBar uses drawer + 1 so it floats above the permanent sidebar.
export const Z_INDEX = {
  // AppBar floats above the permanent sidebar (drawer=1200)
  appBar: 1201,
  // Banner shares the same level so it's never buried under the sidebar
  offlineBanner: 1201,
} as const;

// ─── Transitions ──────────────────────────────────────────────────────────────
export const TRANSITIONS = {
  colorFast: 'color 0.2s ease-in-out',
  colorMedium: 'color 0.3s ease-in-out',
  bgFast: 'background-color 0.2s ease-in-out',
  bgMedium: 'background-color 0.3s ease-in-out',
  all: 'all 0.2s ease-in-out',
} as const;

// ─── Elevation / Box-shadows ──────────────────────────────────────────────────
// Consistent shadow scale for light and dark modes.
export const SHADOWS = {
  // sm — subtle card lift
  sm: { light: '0 2px 8px rgba(0,0,0,0.15)', dark: '0 2px 8px rgba(0,0,0,0.4)' },
  // md — button / floating element
  md: { light: '0 4px 14px rgba(0,0,0,0.2)', dark: '0 4px 14px rgba(0,0,0,0.6)' },
  // lg — modal / overlay
  lg: { light: '0 5px 15px rgba(0,0,0,0.2)', dark: '0 5px 15px rgba(0,0,0,0.7)' },
} as const;
