'use client';

/**
 * useDeviceId
 *
 * Generates a stable, unique device identifier and persists it in localStorage.
 * Also derives browser and OS names from the User-Agent string.
 *
 * The deviceId is used to:
 *   - Link this device to the "trusted devices" feature
 *   - Associate push subscriptions with a specific device
 */

import { useMemo } from 'react';

const STORAGE_KEY = 'device-id';

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('CrOS')) return 'ChromeOS';
  return 'Unknown';
}

export interface DeviceIdInfo {
  deviceId: string;
  browser: string;
  os: string;
  name: string;
}

export function useDeviceId(): DeviceIdInfo {
  return useMemo(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    const browser = detectBrowser();
    const os = detectOS();
    return { deviceId: id, browser, os, name: `${browser} — ${os}` };
  }, []);
}
