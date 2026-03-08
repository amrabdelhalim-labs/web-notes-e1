/**
 * LanguageToggle Component Tests
 *
 * Verifies render, aria-label, and locale-switch behavior.
 */

import React from 'react';
import { render, screen, fireEvent } from '@/app/tests/utils';
import LanguageToggle from '@/app/components/common/LanguageToggle';

const mockReplace = vi.fn();

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'ar',
  };
});

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/notes',
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LanguageToggle', () => {
  it('renders the toggle button', () => {
    render(<LanguageToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows "EN" text when locale is Arabic', () => {
    render(<LanguageToggle />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('has correct aria-label for English when locale is Arabic', () => {
    render(<LanguageToggle />);
    expect(screen.getByLabelText('English')).toBeInTheDocument();
  });

  it('calls router.replace with "en" when clicked from Arabic', () => {
    render(<LanguageToggle />);
    fireEvent.click(screen.getByLabelText('English'));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/notes', { locale: 'en' });
  });
});
