import type { Metadata } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { APP_DESCRIPTION, APP_NAME_EN } from './config';

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
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
