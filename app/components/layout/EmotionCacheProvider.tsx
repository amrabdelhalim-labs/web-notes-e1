'use client';

/**
 * EmotionCacheProvider
 *
 * Wraps AppRouterCacheProvider with RTL-aware Emotion cache configuration.
 * Must be a Client Component so we can pass non-serializable stylisPlugins.
 * layout.tsx (Server Component) imports this instead of using
 * AppRouterCacheProvider directly.
 */

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import type { ReactNode } from 'react';

// Mutable array required by AppRouterCacheProvider (not readonly)
const OPTIONS = {
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
};

export default function EmotionCacheProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={OPTIONS}>
      {children}
    </AppRouterCacheProvider>
  );
}
