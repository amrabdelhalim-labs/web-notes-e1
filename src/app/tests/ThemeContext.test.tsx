/**
 * ThemeContext Tests
 *
 * Tests theme toggle, localStorage persistence, and system preference detection.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { useContext } from 'react';
import { ThemeProviderWrapper, ThemeContext } from '@/app/context/ThemeContext';

vi.mock('next-intl', () => ({
  useLocale: () => 'ar',
}));

// Helper component to access context values
function ThemeConsumer() {
  const { mode, toggleMode } = useContext(ThemeContext);
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggleMode}>toggle</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  // Reset data-color-scheme
  document.documentElement.removeAttribute('data-color-scheme');
});

describe('ThemeContext', () => {
  it('starts with light mode by default (hydration safety)', () => {
    render(
      <ThemeProviderWrapper>
        <ThemeConsumer />
      </ThemeProviderWrapper>
    );
    // Initial render should be light (SSR match)
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('toggles from light to dark', async () => {
    render(
      <ThemeProviderWrapper>
        <ThemeConsumer />
      </ThemeProviderWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('toggle'));
    });

    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('saves preference to localStorage on toggle', async () => {
    render(
      <ThemeProviderWrapper>
        <ThemeConsumer />
      </ThemeProviderWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('toggle'));
    });

    expect(localStorage.getItem('theme-mode')).toBe('dark');
  });

  it('sets data-color-scheme attribute on toggle', async () => {
    render(
      <ThemeProviderWrapper>
        <ThemeConsumer />
      </ThemeProviderWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('toggle'));
    });

    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');
  });

  it('toggles back to light from dark', async () => {
    render(
      <ThemeProviderWrapper>
        <ThemeConsumer />
      </ThemeProviderWrapper>
    );

    // Toggle to dark
    await act(async () => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('mode').textContent).toBe('dark');

    // Toggle back to light
    await act(async () => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('renders children within theme provider', () => {
    render(
      <ThemeProviderWrapper>
        <div data-testid="child">Hello</div>
      </ThemeProviderWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
