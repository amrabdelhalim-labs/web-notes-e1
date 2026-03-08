/**
 * Locale-aware navigation helpers.
 *
 * Import `useRouter`, `usePathname`, `Link`, and `redirect` from HERE
 * instead of `next/navigation`. These wrappers automatically prefix
 * paths with the active locale (e.g. /notes → /ar/notes).
 *
 * `usePathname` returns the path WITHOUT the locale prefix so existing
 * startsWith('/notes') comparisons continue to work unchanged.
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
