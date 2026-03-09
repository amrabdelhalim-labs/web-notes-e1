'use client';

/**
 * PwaActivationContext
 *
 * Manages "Zero PWA Footprint" — the browser never discovers this is a PWA
 * until the user explicitly activates offline mode from the Profile page
 * (only available to trusted devices).
 *
 * Activation injects the <link rel="manifest"> into <head> and registers
 * the Service Worker programmatically. Deactivation reverses both steps and
 * clears all offline-sensitive IndexedDB data.
 *
 * A CustomEvent (`pwa:activation-changed`) is dispatched on every state change
 * so that usePwaStatus and other hooks can react immediately.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { clearOfflineData } from '@/app/lib/db';
import { clearPushSubscription } from '@/app/lib/pushUtils';

// ─── Public constants (consumed by usePwaStatus and tests) ───────────────────

export const PWA_ENABLED_KEY = 'pwa-enabled';
export const PWA_ACTIVATION_EVENT = 'pwa:activation-changed';

// ─── Private constants ────────────────────────────────────────────────────────

const TRUSTED_KEY = 'device-trusted';
const SW_PATH = '/sw.js';
const MANIFEST_PATH = '/manifest.json';

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function injectManifest(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[rel="manifest"]')) return;
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = MANIFEST_PATH;
  document.head.appendChild(link);
}

function removeManifest(): void {
  if (typeof document === 'undefined') return;
  document.querySelector('link[rel="manifest"]')?.remove();
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported in this browser');
  }
  // Prefer the Serwist runtime API (injected when register: false in next.config.mjs).
  // It handles the SW lifecycle (skipWaiting, clients.claim) correctly.
  // Fall back to a raw registration only if window.serwist is unavailable.
  if (typeof window !== 'undefined' && window.serwist !== undefined) {
    await window.serwist.register();
    // After register(), getRegistration() returns the live registration.
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (reg) return reg;
  }
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}

async function unregisterSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration('/');
  if (reg) await reg.unregister();
}

/**
 * Delete every entry in CacheStorage (precache + runtime caches created by
 * the SW). Without this, orphaned caches persist even after the SW is removed
 * and could be picked up by a future registration.
 */
async function clearCacheStorage(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface PwaActivationContextValue {
  /** True when offline mode is active (manifest injected + SW registered). */
  isActivated: boolean;
  /**
   * True while deactivate() is running (before the page reload).
   * Use this to disable the deactivate button and show a loading indicator.
   */
  isDeactivating: boolean;
  /**
   * Activate offline mode: inject manifest + register SW + persist flag.
   * Only call when `localStorage['device-trusted'] === 'true'`.
   * Throws on SW registration failure.
   */
  activate: () => Promise<void>;
  /**
   * Deactivate offline mode: remove manifest, unregister SW, clear IndexedDB,
   * then reload the page. Reloading is required so React's dynamic chunk
   * imports fetch fresh files directly from the server (not the now-gone SW).
   * Called automatically when device trust is revoked (via internal event
   * handler that bypasses the reload since AuthContext handles navigation).
   */
  deactivate: () => Promise<void>;
}

const PwaActivationContext = createContext<PwaActivationContextValue>({
  isActivated: false,
  isDeactivating: false,
  activate: async () => {},
  deactivate: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PwaActivationProvider({ children }: { children: ReactNode }) {
  // Initialize synchronously from localStorage to avoid a setState-in-effect
  // anti-pattern. Both flags must be true for the app to be in activated state.
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem(PWA_ENABLED_KEY) === 'true' &&
      localStorage.getItem(TRUSTED_KEY) === 'true'
    );
  });
  const [isDeactivating, setIsDeactivating] = useState(false);
  const initDone = useRef(false);
  // Guards against concurrent deactivation (e.g. user double-clicks the button).
  const deactivatingRef = useRef(false);
  // Guards against handleRevoked running more than once — both processQueue and
  // useDevices.fetchDevices can dispatch `device:trust-revoked` nearly
  // simultaneously on reconnect (each independently verifies trust with the server).
  const revokedRef = useRef(false);

  /** Notify usePwaStatus and any other listeners of the new state. */
  const broadcast = useCallback((activated: boolean) => {
    window.dispatchEvent(new CustomEvent(PWA_ACTIVATION_EVENT, { detail: { activated } }));
  }, []);

  const deactivate = useCallback(async () => {
    if (deactivatingRef.current) return;
    deactivatingRef.current = true;
    setIsDeactivating(true);
    try {
      removeManifest();
      await unregisterSW();
      await clearOfflineData().catch(() => {});
      await clearCacheStorage().catch(() => {});
      await clearPushSubscription();
      localStorage.removeItem(PWA_ENABLED_KEY);
      // Reload so React fetches fresh chunk hashes directly from the server.
      // Unregistering the SW mid-session would cause ChunkLoadError (HTTP 500)
      // because dynamic imports would hit the now-missing SW cache.
      // setIsActivated/broadcast are skipped — the reload re-derives state from localStorage.
      window.location.reload();
    } catch {
      // SW unregistration failed — reset so the user can retry.
      deactivatingRef.current = false;
      setIsDeactivating(false);
    }
  }, []);

  /** On mount: restore activation state + subscribe to trust revocation. */
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const pwaEnabled = localStorage.getItem(PWA_ENABLED_KEY) === 'true';
    const trusted = localStorage.getItem(TRUSTED_KEY) === 'true';

    if (pwaEnabled && trusted) {
      injectManifest();
      // Re-register SW if somehow the page loaded without one (e.g., after a site-data clear).
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/').then((reg) => {
          if (!reg) {
            registerSW().catch(() => {
              // SW is gone and can't be re-registered → roll back activation.
              localStorage.removeItem(PWA_ENABLED_KEY);
              removeManifest();
              setIsActivated(false);
              broadcast(false);
            });
          }
        });
      }
      // isActivated already set via lazy useState initializer — only broadcast
      // so other hooks (usePwaStatus) know the context is ready.
      broadcast(true);
    } else if (pwaEnabled && !trusted) {
      // Trust was revoked while the app was offline (flag is stale).
      // Full cleanup: remove manifest + SW + caches + IndexedDB so the next
      // session starts with zero PWA footprint.
      localStorage.removeItem(PWA_ENABLED_KEY);
      removeManifest();
      unregisterSW().catch(() => {});
      clearOfflineData().catch(() => {});
      clearCacheStorage().catch(() => {});
    }

    /**
     * Trust revoked by another device.
     *
     * AuthContext.logout() already handles SW unregistration, cache clearing,
     * and navigation to the login page. We only need to remove the PWA
     * activation flag and update local React state.
     *
     * We intentionally do NOT call the full deactivate() here — that would
     * trigger window.location.reload() and race with AuthContext's redirect.
     */
    const handleRevoked = () => {
      // Prevent concurrent/duplicate cleanup when multiple sources dispatch
      // the event at the same time (processQueue + useDevices.fetchDevices).
      if (revokedRef.current) return;
      revokedRef.current = true;
      removeManifest();
      localStorage.removeItem(PWA_ENABLED_KEY);
      // Full cleanup: SW + caches + IndexedDB + push — all fire-and-forget
      // because AuthContext.logout() will also run and do the same, but we
      // don't leave a window where sensitive data is accessible.
      unregisterSW().catch(() => {});
      clearOfflineData().catch(() => {});
      clearCacheStorage().catch(() => {});
      clearPushSubscription().catch(() => {});
      setIsActivated(false);
      broadcast(false);
    };
    window.addEventListener('device:trust-revoked', handleRevoked);
    return () => window.removeEventListener('device:trust-revoked', handleRevoked);
  }, [broadcast]);

  const activate = useCallback(async () => {
    injectManifest();
    try {
      await registerSW();
    } catch (err) {
      // SW registration failed — roll back manifest so the page stays footprint-free.
      removeManifest();
      throw err;
    }
    localStorage.setItem(PWA_ENABLED_KEY, 'true');
    setIsActivated(true);
    broadcast(true);
  }, [broadcast]);

  return (
    <PwaActivationContext.Provider value={{ isActivated, isDeactivating, activate, deactivate }}>
      {children}
    </PwaActivationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Access PWA activation state and controls. Must be used inside PwaActivationProvider. */
export function usePwaActivation(): PwaActivationContextValue {
  return useContext(PwaActivationContext);
}
