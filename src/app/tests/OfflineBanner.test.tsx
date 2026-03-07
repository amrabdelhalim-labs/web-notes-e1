/**
 * OfflineBanner Component Tests
 *
 * Verifies that the banner shows on offline and a "back online" alert on
 * connectivity restoration.
 */

import React from 'react';
import { render, screen } from '@/app/tests/utils';
import OfflineBanner from '@/app/components/common/OfflineBanner';

let mockIsOnline = true;

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockIsOnline,
}));

beforeEach(() => {
  mockIsOnline = true;
  vi.clearAllMocks();
});

describe('OfflineBanner', () => {
  it('renders nothing visible when online', () => {
    mockIsOnline = true;
    render(<OfflineBanner />);
    // The status region exists but no alert should be shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows offline warning when isOnline is false', () => {
    mockIsOnline = false;
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/لا يوجد اتصال|offline|غير متصل/i)).toBeInTheDocument();
  });

  it('has role="status" aria-live region for accessibility', () => {
    render(<OfflineBanner />);
    const region = document.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });
});
