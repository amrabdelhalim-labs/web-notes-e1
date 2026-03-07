/**
 * Test render utilities.
 *
 * Wraps components with NextIntlClientProvider (Arabic locale) + MUI
 * ThemeProvider + RTL so tests match the production rendering environment.
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NextIntlClientProvider } from 'next-intl';
import arMessages from '@/messages/ar.json';

const theme = createTheme({ direction: 'rtl' });

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

/** Drop-in replacement for @testing-library/react `render` with MUI theme + i18n. */
function renderWithTheme(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithTheme as render };
