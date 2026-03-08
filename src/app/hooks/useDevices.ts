'use client';

/**
 * useDevices
 *
 * Manages the trusted-devices lifecycle for the current user:
 *   - Fetches the list of trusted devices
 *   - Trusts the current device (explicit user action)
 *   - Deletes a device (also removes its push subscription server-side)
 *   - Exposes whether the current device is trusted
 */

import { useState, useEffect, useCallback } from 'react';
import { getDevicesApi, trustDeviceApi, deleteDeviceApi } from '@/app/lib/api';
import { cacheDevices, getCachedDevices } from '@/app/lib/db';
import { useDeviceId, type DeviceIdInfo } from '@/app/hooks/useDeviceId';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import type { Device } from '@/app/types';

const TRUSTED_KEY = 'device-trusted';
const TRUST_CHANGED_EVENT = 'device-trust-changed';

function publishTrustChanged(trusted: boolean) {
  window.dispatchEvent(new CustomEvent(TRUST_CHANGED_EVENT, { detail: { trusted } }));
}

export interface UseDevicesReturn {
  devices: Device[];
  loading: boolean;
  error: string | null;
  isTrusted: boolean;
  isOnline: boolean;
  deviceInfo: DeviceIdInfo;
  /** Trust the current device. Requires the user's password for confirmation. */
  trustCurrent: (password: string) => Promise<void>;
  /** Delete a device by its deviceId. Requires the user's password for confirmation. */
  removeDevice: (deviceId: string, password: string) => Promise<void>;
  /** Refresh the device list. */
  refresh: () => Promise<void>;
}

export function useDevices(): UseDevicesReturn {
  const deviceInfo = useDeviceId();
  const isOnline = useOfflineStatus();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setError(null);
      const res = await getDevicesApi(deviceInfo.deviceId);
      setDevices(res.data);
      // Sync trust status to localStorage for usePwaStatus
      const trusted = res.data.some((d) => d.deviceId === deviceInfo.deviceId);
      if (trusted) localStorage.setItem(TRUSTED_KEY, 'true');
      else localStorage.removeItem(TRUSTED_KEY);
      publishTrustChanged(trusted);
      // Cache devices for offline access
      cacheDevices(res.data).catch(() => {});
    } catch (err) {
      // Network / server error — try local cache as fallback
      try {
        const cached = await getCachedDevices();
        if (cached.length > 0) {
          setDevices(cached);
          // Don't show error when we have cached data
          return;
        }
      } catch { /* ignore db errors */ }
      setError(err instanceof Error ? err.message : 'فشل تحميل الأجهزة');
    } finally {
      setLoading(false);
    }
  }, [deviceInfo.deviceId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const trustCurrent = useCallback(async (password: string) => {
    try {
      setError(null);
      const res = await trustDeviceApi({
        deviceId: deviceInfo.deviceId,
        password,
        name: deviceInfo.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });
      // Add or update in local list
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === res.data.deviceId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...res.data, isCurrent: true };
          return updated;
        }
        return [...prev, { ...res.data, isCurrent: true }];
      });
      localStorage.setItem(TRUSTED_KEY, 'true');
      publishTrustChanged(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الوثوق بالجهاز');
      throw err;
    }
  }, [deviceInfo]);

  const removeDevice = useCallback(async (deviceId: string, password: string) => {
    try {
      setError(null);
      await deleteDeviceApi(deviceId, password);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      // If removing current device, clear trust flag
      if (deviceId === deviceInfo.deviceId) {
        localStorage.removeItem(TRUSTED_KEY);
        publishTrustChanged(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إزالة الجهاز');
      throw err;
    }
  }, [deviceInfo.deviceId]);

  const isTrusted = devices.some((d) => d.deviceId === deviceInfo.deviceId);

  return {
    devices,
    loading,
    error,
    isTrusted,
    isOnline,
    deviceInfo,
    trustCurrent,
    removeDevice,
    refresh: fetchDevices,
  };
}
