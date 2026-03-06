/**
 * Test render utilities.
 *
 * Wraps components with MUI ThemeProvider + RTL so tests
 * match the production rendering environment.
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({ direction: 'rtl' });

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

/** Drop-in replacement for @testing-library/react `render` with MUI theme. */
function renderWithTheme(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithTheme as render };
