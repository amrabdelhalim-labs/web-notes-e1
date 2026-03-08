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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export type SwState = 'unsupported' | 'checking' | 'inactive' | 'installing' | 'active';
export type InstallState = 'standalone' | 'standalone-untrusted' | 'installable' | 'not-installable';

const TRUSTED_KEY = 'device-trusted';
const TRUST_CHANGED_EVENT = 'device-trust-changed';

// BeforeInstallPromptEvent is not yet in TypeScript's lib.dom.d.ts
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaStatus {
  swState: SwState;
  installState: InstallState;
  isReady: boolean; // true when SW is active AND (installed or installable)
  /** Triggers the native PWA install dialog. Returns true if accepted. null when unavailable. */
  triggerInstall: (() => Promise<boolean>) | null;
}

export function usePwaStatus(): PwaStatus {
  const [swState, setSwState] = useState<SwState>(
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'checking' : 'unsupported'
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

  // Stored deferred prompt — kept in a ref to avoid re-render churn.
  // triggerInstall reads the ref at call time, so no stale-closure issue.
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const installState = useMemo<InstallState>(() => {
    // Installed as a PWA and the device is trusted — full PWA experience.
    if (isStandalone && isTrusted) return 'standalone';
    // Installed via browser UI before the device was trusted (bypassed our in-app
    // install button). The app runs in standalone but offline sync is blocked until
    // the user goes to Profile and trusts the device.
    if (isStandalone && !isTrusted) return 'standalone-untrusted';
    // Not yet installed but the browser is ready AND the device is trusted.
    if (canInstall && isTrusted) return 'installable';
    return 'not-installable';
  }, [isStandalone, isTrusted, canInstall]);

  useEffect(() => {
    const readTrusted = () => setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');
    const readStandalone = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
          ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
      );
    };

    // Browser can install at this moment (prompt fired); trust is applied separately.
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    // App was installed in this session — clear the deferred prompt so the
    // install button disappears (the standalone window handles the new state).
    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TRUSTED_KEY) readTrusted();
    };

    const handleTrustChanged = () => readTrusted();

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
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
        window.removeEventListener('appinstalled', handleAppInstalled);
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
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(TRUST_CHANGED_EVENT, handleTrustChanged as EventListener);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // isReady: the app is fully operational (SW active, installed or installable, AND trusted).
  // 'standalone-untrusted' is intentionally NOT ready — offline sync is blocked for security.
  const isReady =
    swState === 'active' && (installState === 'standalone' || installState === 'installable');

  // Stable function: reads deferredPromptRef at call time — no stale closure.
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        deferredPromptRef.current = null;
        setCanInstall(false);
      }
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, []);

  return {
    swState,
    installState,
    isReady,
    triggerInstall: installState === 'installable' ? triggerInstall : null,
  };
}
