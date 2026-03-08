/**
 * useOfflineStatus Hook Tests
 *
 * Two-layer connectivity detection:
 *   1. Instant: browser online/offline events
 *   2. Verified: HEAD ping to /api/health
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useOfflineStatus,
  CONNECTIVITY_CHECK_EVENT,
  CONNECTIVITY_STATUS_EVENT,
} from '@/app/hooks/useOfflineStatus';

/* ── helpers ────────────────────────────────────────────────────────── */

/** Stub fetch to resolve/reject for the health ping */
function mockFetchOnline() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);
}
function mockFetchOffline() {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
}

describe('useOfflineStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    mockFetchOnline();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when browser is online and ping succeeds', async () => {
    const { result } = renderHook(() => useOfflineStatus());
    // Initial state from navigator.onLine
    expect(result.current).toBe(true);
    // After mount ping resolves
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when navigator.onLine is false (skips ping)', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('switches to false when "offline" event fires', async () => {
    const { result } = renderHook(() => useOfflineStatus());
    await waitFor(() => expect(result.current).toBe(true));

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('verifies with ping when "online" event fires', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    mockFetchOffline();
    const { result } = renderHook(() => useOfflineStatus());
    await waitFor(() => expect(result.current).toBe(false));

    // Simulate reconnection: browser goes online and ping succeeds
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    mockFetchOnline();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('detects server-unreachable even when navigator.onLine is true', async () => {
    mockFetchOffline();
    const { result } = renderHook(() => useOfflineStatus());
    // navigator.onLine is true but ping fails → should be false
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('responds to manual connectivity:check event', async () => {
    const { result } = renderHook(() => useOfflineStatus());
    await waitFor(() => expect(result.current).toBe(true));

    // Simulate server going down
    mockFetchOffline();

    await act(async () => {
      window.dispatchEvent(new Event(CONNECTIVITY_CHECK_EVENT));
    });

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('broadcasts connectivity:status event after verification', async () => {
    const handler = vi.fn();
    window.addEventListener(CONNECTIVITY_STATUS_EVENT, handler);

    renderHook(() => useOfflineStatus());
    await waitFor(() => expect(handler).toHaveBeenCalled());

    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toEqual({ online: true });

    window.removeEventListener(CONNECTIVITY_STATUS_EVENT, handler);
  });

  it('removes event listeners on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOfflineStatus());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith(CONNECTIVITY_CHECK_EVENT, expect.any(Function));
    removeSpy.mockRestore();
  });
});
