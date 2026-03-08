/**
 * useDevices Hook Tests
 *
 * Strategy:
 *   Mock @/app/lib/api (getDevicesApi, trustDeviceApi, deleteDeviceApi)
 *   Mock @/app/hooks/useDeviceId (stable deviceId + info)
 *
 * Groups:
 *   • Initialization — auto-fetch, loading state, error handling
 *   • Trust — trustCurrent adds device, syncs localStorage
 *   • Remove — removeDevice removes from list, clears trust flag if current
 *   • isTrusted — derived from device list
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useDevices } from '@/app/hooks/useDevices';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/app/hooks/useDeviceId', () => ({
  useDeviceId: () => ({
    deviceId: 'dev-001',
    browser: 'Chrome',
    os: 'Windows',
    name: 'Chrome — Windows',
  }),
}));

let mockIsOnline = true;
vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockIsOnline,
}));

const mockCacheDevices = vi.fn().mockResolvedValue(undefined);
const mockGetCachedDevices = vi.fn().mockResolvedValue([]);
vi.mock('@/app/lib/db', () => ({
  cacheDevices: (...args: unknown[]) => mockCacheDevices(...args),
  getCachedDevices: (...args: unknown[]) => mockGetCachedDevices(...args),
}));

const mockGetDevicesApi = vi.fn();
const mockTrustDeviceApi = vi.fn();
const mockDeleteDeviceApi = vi.fn();

vi.mock('@/app/lib/api', () => ({
  getDevicesApi: (...args: unknown[]) => mockGetDevicesApi(...args),
  trustDeviceApi: (...args: unknown[]) => mockTrustDeviceApi(...args),
  deleteDeviceApi: (...args: unknown[]) => mockDeleteDeviceApi(...args),
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

const fakeDevice = {
  _id: 'd1',
  user: 'u1',
  deviceId: 'dev-001',
  name: 'Chrome — Windows',
  browser: 'Chrome',
  os: 'Windows',
  isCurrent: true,
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const otherDevice = {
  _id: 'd2',
  user: 'u1',
  deviceId: 'dev-002',
  name: 'Firefox — Linux',
  browser: 'Firefox',
  os: 'Linux',
  isCurrent: false,
  lastSeenAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockIsOnline = true;
  mockGetDevicesApi.mockResolvedValue({ data: [] });
  mockCacheDevices.mockResolvedValue(undefined);
  mockGetCachedDevices.mockResolvedValue([]);
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useDevices', () => {
  // ── Initialization ─────────────────────────────────────────────────────

  describe('initialization', () => {
    it('auto-fetches devices on mount', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      const { result } = renderHook(() => useDevices());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGetDevicesApi).toHaveBeenCalledWith('dev-001');
      expect(result.current.devices).toHaveLength(1);
    });

    it('starts in loading state', () => {
      const { result } = renderHook(() => useDevices());
      expect(result.current.loading).toBe(true);
    });

    it('sets error on fetch failure when no cache available', async () => {
      mockGetDevicesApi.mockRejectedValue(new Error('شبكة'));
      mockGetCachedDevices.mockResolvedValue([]);
      const { result } = renderHook(() => useDevices());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('شبكة');
      expect(result.current.devices).toHaveLength(0);
    });

    it('sets device-trusted in localStorage when current device is in list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      renderHook(() => useDevices());

      await waitFor(() => expect(localStorage.getItem('device-trusted')).toBe('true'));
    });

    it('removes device-trusted when current device is not in list', async () => {
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [otherDevice] });
      renderHook(() => useDevices());

      await waitFor(() => expect(localStorage.getItem('device-trusted')).toBeNull());
    });
  });

  // ── isTrusted ─────────────────────────────────────────────────────────

  describe('isTrusted', () => {
    it('is true when current device is in the list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      const { result } = renderHook(() => useDevices());

      await waitFor(() => expect(result.current.isTrusted).toBe(true));
    });

    it('is false when current device is not in the list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [otherDevice] });
      const { result } = renderHook(() => useDevices());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isTrusted).toBe(false);
    });
  });

  // ── trustCurrent ──────────────────────────────────────────────────────

  describe('trustCurrent', () => {
    it('calls trustDeviceApi with device info and adds to list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      mockTrustDeviceApi.mockResolvedValue({ data: fakeDevice, message: 'ok' });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.trustCurrent('testpass');
      });

      expect(mockTrustDeviceApi).toHaveBeenCalledWith({
        deviceId: 'dev-001',
        name: 'Chrome — Windows',
        browser: 'Chrome',
        os: 'Windows',
        password: 'testpass',
      });
      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].isCurrent).toBe(true);
    });

    it('sets localStorage device-trusted to true', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      mockTrustDeviceApi.mockResolvedValue({ data: fakeDevice, message: 'ok' });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.trustCurrent('testpass');
      });

      expect(localStorage.getItem('device-trusted')).toBe('true');
    });

    it('updates existing device instead of duplicating', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      mockTrustDeviceApi.mockResolvedValue({
        data: { ...fakeDevice, name: 'Updated' },
        message: 'ok',
      });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.trustCurrent('testpass');
      });

      expect(result.current.devices).toHaveLength(1);
    });

    it('sets error on trust failure and re-throws', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      mockTrustDeviceApi.mockRejectedValue(new Error('فشل'));

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.trustCurrent('testpass')).rejects.toThrow('فشل');
      });

      expect(result.current.error).toBe('فشل');
    });
  });

  // ── removeDevice ──────────────────────────────────────────────────────

  describe('removeDevice', () => {
    it('calls deleteDeviceApi and removes from list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice, otherDevice] });
      mockDeleteDeviceApi.mockResolvedValue({ message: 'ok' });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.devices).toHaveLength(2));

      await act(async () => {
        await result.current.removeDevice('dev-002', 'testpass');
      });

      expect(mockDeleteDeviceApi).toHaveBeenCalledWith('dev-002', 'testpass');
      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].deviceId).toBe('dev-001');
    });

    it('clears device-trusted when removing current device', async () => {
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      mockDeleteDeviceApi.mockResolvedValue({ message: 'ok' });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.devices).toHaveLength(1));

      await act(async () => {
        await result.current.removeDevice('dev-001', 'testpass');
      });

      expect(localStorage.getItem('device-trusted')).toBeNull();
    });

    it('keeps device-trusted when removing a different device', async () => {
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice, otherDevice] });
      mockDeleteDeviceApi.mockResolvedValue({ message: 'ok' });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.devices).toHaveLength(2));

      await act(async () => {
        await result.current.removeDevice('dev-002', 'testpass');
      });

      expect(localStorage.getItem('device-trusted')).toBe('true');
    });

    it('sets error on delete failure and re-throws', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      mockDeleteDeviceApi.mockRejectedValue(new Error('خطأ'));

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.removeDevice('dev-001', 'testpass')).rejects.toThrow('خطأ');
      });

      expect(result.current.error).toBe('خطأ');
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('re-fetches the device list', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetDevicesApi).toHaveBeenCalledTimes(2);
      expect(result.current.devices).toHaveLength(1);
    });
  });

  // ── Offline caching ──────────────────────────────────────────────────

  describe('offline caching', () => {
    it('caches devices after successful fetch', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });
      renderHook(() => useDevices());
      await waitFor(() => expect(mockCacheDevices).toHaveBeenCalledWith([fakeDevice]));
    });

    it('falls back to cached devices on network error', async () => {
      const cached = [{ ...fakeDevice, _cachedAt: Date.now() }];
      mockGetDevicesApi.mockRejectedValue(new Error('network'));
      mockGetCachedDevices.mockResolvedValue(cached);

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.devices).toEqual(cached);
      expect(result.current.error).toBeNull();
    });

    it('shows error when fetch fails and no cached data', async () => {
      mockGetDevicesApi.mockRejectedValue(new Error('network'));
      mockGetCachedDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.devices).toHaveLength(0);
      expect(result.current.error).toBe('network');
    });

    it('exposes isOnline from useOfflineStatus', async () => {
      mockIsOnline = false;
      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isOnline).toBe(false);
    });
  });

  // ── visibilitychange re-fetch ─────────────────────────────────────────

  describe('visibilitychange re-fetch', () => {
    it('re-fetches devices when tab becomes visible', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      renderHook(() => useDevices());
      await waitFor(() => expect(mockGetDevicesApi).toHaveBeenCalledTimes(1));

      // Simulate tab coming back into focus
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => expect(mockGetDevicesApi).toHaveBeenCalledTimes(2));
    });

    it('does not re-fetch when tab becomes hidden', async () => {
      mockGetDevicesApi.mockResolvedValue({ data: [] });
      renderHook(() => useDevices());
      await waitFor(() => expect(mockGetDevicesApi).toHaveBeenCalledTimes(1));

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Only the initial fetch — no extra call for hidden state
      expect(mockGetDevicesApi).toHaveBeenCalledTimes(1);
    });

    it('updates trust status when device was removed in another session', async () => {
      // Initial state: current device is trusted
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.isTrusted).toBe(true));

      // Another session removed the device — next fetch returns empty list
      mockGetDevicesApi.mockResolvedValue({ data: [otherDevice] });

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => expect(result.current.isTrusted).toBe(false));
      expect(localStorage.getItem('device-trusted')).toBeNull();
    });
  });

  // ── device:trust-revoked event ────────────────────────────────────────

  describe('device:trust-revoked event', () => {
    it('dispatches device:trust-revoked when trust transitions from true to false', async () => {
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });

      const { result } = renderHook(() => useDevices());
      await waitFor(() => expect(result.current.isTrusted).toBe(true));

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // Trust revoked — device removed from list on server
      mockGetDevicesApi.mockResolvedValue({ data: [otherDevice] });

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => expect(result.current.isTrusted).toBe(false));

      const revokedEvents = (dispatchSpy.mock.calls as [Event][]).filter(
        ([e]) => e instanceof CustomEvent && e.type === 'device:trust-revoked'
      );
      expect(revokedEvents.length).toBeGreaterThan(0);
      dispatchSpy.mockRestore();
    });

    it('does NOT dispatch device:trust-revoked when device was never trusted', async () => {
      // localStorage has no device-trusted key
      localStorage.removeItem('device-trusted');
      mockGetDevicesApi.mockResolvedValue({ data: [otherDevice] }); // current not in list

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      renderHook(() => useDevices());
      await waitFor(() => expect(mockGetDevicesApi).toHaveBeenCalled());

      const revokedEvents = (dispatchSpy.mock.calls as [Event][]).filter(
        ([e]) => e instanceof CustomEvent && e.type === 'device:trust-revoked'
      );
      expect(revokedEvents.length).toBe(0);
      dispatchSpy.mockRestore();
    });

    it('does NOT dispatch device:trust-revoked when device remains trusted', async () => {
      localStorage.setItem('device-trusted', 'true');
      mockGetDevicesApi.mockResolvedValue({ data: [fakeDevice] });

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      renderHook(() => useDevices());
      await waitFor(() => expect(mockGetDevicesApi).toHaveBeenCalled());

      const revokedEvents = (dispatchSpy.mock.calls as [Event][]).filter(
        ([e]) => e instanceof CustomEvent && e.type === 'device:trust-revoked'
      );
      expect(revokedEvents.length).toBe(0);
      dispatchSpy.mockRestore();
    });
  });
});
