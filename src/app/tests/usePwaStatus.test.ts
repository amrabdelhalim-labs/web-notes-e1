/**
 * usePwaStatus — trust-gate integration test
 *
 * Verifies that the install state is gated by device trust:
 *   - 'installable' only when device-trusted is 'true' in localStorage
 *   - 'not-installable' when device is not trusted, even if browser fires beforeinstallprompt
 */

import { renderHook, act } from '@testing-library/react';
import { usePwaStatus } from '@/app/hooks/usePwaStatus';

// Mock ServiceWorker API
const mockGetRegistration = vi.fn();
Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  value: {
    getRegistration: mockGetRegistration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

beforeEach(() => {
  localStorage.clear();
  mockGetRegistration.mockResolvedValue(undefined);
});

describe('usePwaStatus trust gate', () => {
  it('defaults to not-installable when not standalone', () => {
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.installState).toBe('not-installable');
  });

  it('stays not-installable on beforeinstallprompt when device is not trusted', () => {
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(result.current.installState).toBe('not-installable');
  });

  it('becomes installable on beforeinstallprompt when device is trusted', () => {
    localStorage.setItem('device-trusted', 'true');
    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(result.current.installState).toBe('installable');
  });

  it('becomes installable when trust is added after prompt already fired', async () => {
    const { result } = renderHook(() => usePwaStatus());

    // Browser reported install capability first while the device is untrusted.
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    expect(result.current.installState).toBe('not-installable');

    // User trusts device later; hook should promote state without waiting for another prompt.
    act(() => {
      localStorage.setItem('device-trusted', 'true');
      window.dispatchEvent(new CustomEvent('device-trust-changed', { detail: { trusted: true } }));
    });

    await vi.waitFor(() => {
      expect(result.current.installState).toBe('installable');
    });
  });

  it('returns swState based on ServiceWorker registration', async () => {
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(result.current.swState).toBe('active');
    });
  });

  it('marks swState as inactive when no registration exists', async () => {
    mockGetRegistration.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePwaStatus());

    await vi.waitFor(() => {
      expect(result.current.swState).toBe('inactive');
    });
  });

  it('isReady is true when SW is active and installState is not not-installable', async () => {
    localStorage.setItem('device-trusted', 'true');
    mockGetRegistration.mockResolvedValue({
      active: { state: 'activated', addEventListener: vi.fn() },
      installing: null,
      waiting: null,
      addEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePwaStatus());

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    await vi.waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });
});
