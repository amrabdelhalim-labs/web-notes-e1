import type { Metadata, Viewport } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import { Providers } from '../providers';
import EmotionCacheProvider from '../components/layout/EmotionCacheProvider';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { APP_DESCRIPTION } from '../config';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ملاحظاتي | MyNotes',
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ملاحظاتي',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
    icon: '/icons/icon-512x512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1565c0',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Reject any unrecognised locale segment
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const messages = await getMessages();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/*
          Blocking script: runs synchronously before React hydration.
          Reads the stored theme preference from localStorage and sets
          data-color-scheme on <html> so the MUI ThemeProvider always
          starts in the correct mode — no flash of wrong theme.
        */}
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
        {/*
          NextIntlClientProvider makes translations available to all
          Client Components via useTranslations() without prop drilling.
        */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/*
            EmotionCacheProvider receives the text direction so it can
            switch between the RTL Stylis plugin (Arabic) and the plain
            LTR prefixer (English) without a page reload.
          */}
          <EmotionCacheProvider dir={dir}>
            <Providers>{children}</Providers>
          </EmotionCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
