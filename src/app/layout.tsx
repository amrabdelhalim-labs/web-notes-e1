/**
 * Root layout — required by Next.js App Router.
 *
 * The actual <html> and <body> tags, fonts, theme script, and providers
 * are rendered in app/[locale]/layout.tsx, which is mounted as a nested
 * layout for every locale-prefixed route (/ar/*, /en/*).
 *
 * This file exists only to satisfy Next.js's requirement for a root layout.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
