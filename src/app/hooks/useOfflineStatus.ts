'use client';

/**
 * useOfflineStatus
 *
 * Returns `true` when the browser has network access, `false` when offline.
 * Responds instantly to online/offline events emitted by the browser.
 *
 * SSR-safe: initial value is always `true` on the server
 * (navigator.onLine is only available in a browser context).
 */

import { useState, useEffect } from 'react';

export function useOfflineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
