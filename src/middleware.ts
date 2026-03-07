import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * next-intl locale middleware
 *
 * Automatically:
 *   - Redirects requests without a locale prefix to the default locale (/ar)
 *   - Sets the locale cookie so server components can read it
 *   - Handles alternateLinks headers for SEO
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  //   - /api/   → API routes handled by Next.js
  //   - /_next/ → Next.js internals
  //   - /.*\..* → Static files (e.g. favicon.ico, robots.txt)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
