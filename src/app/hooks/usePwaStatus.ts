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

import { useState, useEffect } from 'react';

export type SwState = 'unsupported' | 'checking' | 'inactive' | 'installing' | 'active';
export type InstallState = 'standalone' | 'installable' | 'not-installable';

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

  // Derive initial install state without firing setState in the effect body
  const [installState, setInstallState] = useState<InstallState>(() => {
    if (typeof window === 'undefined') return 'not-installable';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);
    return isStandalone ? 'standalone' : 'not-installable';
  });

  useEffect(() => {
    // ── Install state (only needs to watch for beforeinstallprompt) ────────
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault(); // prevent auto-prompt
      setInstallState('installable');
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // ── Service Worker state ───────────────────────────────────────────────
    // swState is already initialized as 'unsupported' if SW is unavailable
    if (!('serviceWorker' in navigator)) {
      return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
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

    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const isReady = swState === 'active' && installState !== 'not-installable';

  return { swState, installState, isReady };
}
