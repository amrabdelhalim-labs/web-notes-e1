import type { Metadata } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { APP_DESCRIPTION, APP_NAME_EN } from './config';
import EmotionCacheProvider from './components/layout/EmotionCacheProvider';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME_EN,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      {/*
        Blocking script — runs synchronously BEFORE React hydration.
        Sets data-color-scheme on <html> so ThemeContext reads the correct
        value on the very first client render, eliminating SSR/client mismatch.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var m = localStorage.getItem('theme-mode');
                if (m !== 'light' && m !== 'dark') {
                  m = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-color-scheme', m);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${cairo.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <EmotionCacheProvider>
          <Providers>{children}</Providers>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
