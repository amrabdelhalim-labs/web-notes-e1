'use client';

/**
 * EmotionCacheProvider
 *
 * Wraps AppRouterCacheProvider with an RTL-aware (or LTR) Emotion cache.
 * Accepts a `dir` prop so the locale layout can switch configuration
 * dynamically when the user changes language.
 *
 * Must be a Client Component — non-serialisable stylisPlugins cannot be
 * passed across the Server/Client boundary.
 */

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import type { ReactNode } from 'react';

const RTL_OPTIONS = {
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
};

const LTR_OPTIONS = {
  key: 'mui',
  stylisPlugins: [prefixer],
};

interface EmotionCacheProviderProps {
  children: ReactNode;
  dir?: 'rtl' | 'ltr';
}

export default function EmotionCacheProvider({ children, dir = 'rtl' }: EmotionCacheProviderProps) {
  return (
    <AppRouterCacheProvider options={dir === 'rtl' ? RTL_OPTIONS : LTR_OPTIONS}>
      {children}
    </AppRouterCacheProvider>
  );
}
