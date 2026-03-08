'use client';

/**
 * usePwaStatus
 *
 * Hook to detect PWA setup state:
 *  - Service Worker support & registration state
 *  - Whether the app is running in standalone mode (already installed)
 *  - Whether the browser has fired a beforeinstallprompt (can install)
 *
 * All checks are client-only and fail gracefully in unsupported environments.
 */

import { useState, useEffect, useMemo } from 'react';

export type SwState = 'unsupported' | 'checking' | 'inactive' | 'installing' | 'active';
export type InstallState = 'standalone' | 'installable' | 'not-installable';

const TRUSTED_KEY = 'device-trusted';
const TRUST_CHANGED_EVENT = 'device-trust-changed';

export interface PwaStatus {
  swState: SwState;
  installState: InstallState;
  isReady: boolean; // true when SW is active AND (installed or installable)
}

export function usePwaStatus(): PwaStatus {
  const [swState, setSwState] = useState<SwState>(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? 'checking'
      : 'unsupported',
  );

  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
    );
  });

  // Browser capability state (independent from trust gate)
  const [canInstall, setCanInstall] = useState(false);
  const [isTrusted, setIsTrusted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TRUSTED_KEY) === 'true';
  });

  const installState = useMemo<InstallState>(() => {
    if (isStandalone) return 'standalone';
    if (canInstall && isTrusted) return 'installable';
    return 'not-installable';
  }, [isStandalone, canInstall, isTrusted]);

  useEffect(() => {
    const readTrusted = () => setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');
    const readStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
          ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true),
      );
    };

    // Browser can install at this moment (prompt fired); trust is applied separately.
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TRUSTED_KEY) readTrusted();
    };

    const handleTrustChanged = () => readTrusted();

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(TRUST_CHANGED_EVENT, handleTrustChanged as EventListener);

    // Keep status in sync when user returns to the tab.
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      readTrusted();
      readStandalone();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── Service Worker state ───────────────────────────────────────────────
    // swState is already initialized as 'unsupported' if SW is unavailable
    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(TRUST_CHANGED_EVENT, handleTrustChanged as EventListener);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    const updateSwState = (reg: ServiceWorkerRegistration) => {
      if (reg.active) {
        setSwState('active');
      } else if (reg.installing || reg.waiting) {
        setSwState('installing');
      } else {
        setSwState('inactive');
      }
    };

    navigator.serviceWorker
      .getRegistration('/')
      .then((reg) => {
        if (!reg) {
          setSwState('inactive');
          return;
        }
        updateSwState(reg);

        // Watch for state changes (e.g., installing → active)
        const sw = reg.installing ?? reg.waiting ?? reg.active;
        if (sw) {
          sw.addEventListener('statechange', () => updateSwState(reg));
        }
        reg.addEventListener('updatefound', () => {
          setSwState('installing');
          const newSw = reg.installing;
          if (newSw) {
            newSw.addEventListener('statechange', () => updateSwState(reg));
          }
        });
      })
      .catch(() => setSwState('inactive'));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(TRUST_CHANGED_EVENT, handleTrustChanged as EventListener);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const isReady = swState === 'active' && installState !== 'not-installable';

  return { swState, installState, isReady };
}
