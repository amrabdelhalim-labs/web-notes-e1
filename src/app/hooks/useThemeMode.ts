'use client';

/**
 * useThemeMode
 *
 * Custom hook that exposes the current palette mode and its toggle function.
 * Must be used inside <ThemeProviderWrapper>.
 */

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/app/context/ThemeContext';

export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}
