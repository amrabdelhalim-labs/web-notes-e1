import createNextIntlPlugin from 'next-intl/plugin';
import withSerwist from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

/**
 * @serwist/next configuration
 *
 * swSrc  — TypeScript Service Worker source compiled by the plugin.
 * swDest — Output path inside public/ (must be served at the root).
 * disable in development so hot-reload isn't disrupted by the SW cache.
 * Set NEXT_PUBLIC_SW_DISABLED=false to test PWA features in dev mode.
 */
const withSerwistConfig = withSerwist({
  swSrc: 'src/sw.ts',
  // Emit into public/ so Next can serve it at /sw.js.
  swDest: 'public/sw.js',
  disable:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_SW_DISABLED !== 'false',
  register: true,
  reloadOnOnline: true,
});

export default withSerwistConfig(withNextIntl(nextConfig));
