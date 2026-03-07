/**
 * useOfflineStatus Hook Tests
 *
 * Verifies that the hook returns true when online, false when offline,
 * and responds to browser online/offline events.
 */

import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';

describe('useOfflineStatus', () => {
  beforeEach(() => {
    // Default: online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  it('returns true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(false);
  });

  it('switches to false when "offline" event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('switches to true when "online" event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOfflineStatus());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
