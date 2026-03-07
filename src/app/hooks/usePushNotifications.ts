'use client';

/**
 * usePushNotifications
 *
 * Manages the Web Push subscription lifecycle:
 *   - Detects browser/SW capability
 *   - Requests Notification permission on demand
 *   - Subscribes / unsubscribes via the /api/push/subscribe endpoint
 *   - Registers a background-sync SW listener so the offline queue is
 *     flushed when connectivity is restored (the SW posts PROCESS_OFFLINE_QUEUE)
 *
 * The VAPID public key is read from NEXT_PUBLIC_VAPID_PUBLIC_KEY so it is
 * available in the browser bundle without any server round-trip.
 *
 * Inspired by the reference project (Subscribe.jsx) but rewritten with:
 *   - TypeScript types
 *   - Persistent subscription state (localStorage)
 *   - Auto-recovery: re-subscribes if the stored subscription has been revoked
 *   - Unsubscribe support
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/app/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushStatus = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed' | 'loading';

export interface UsePushNotificationsReturn {
  status: PushStatus;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function getDeviceInfo(): string {
  return `${navigator.platform} — ${navigator.userAgent.slice(0, 80)}`;
}

const STORAGE_KEY = 'push-subscribed';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications(): UsePushNotificationsReturn {
  const [status, setStatus] = useState<PushStatus>('loading');

  // ── Capability check + initial state ─────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    setStatus(stored === 'true' ? 'subscribed' : 'unsubscribed');
  }, []);

  // ── SW message listener for PROCESS_OFFLINE_QUEUE (background sync) ──────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        // Emit a custom DOM event; useNotes (or any hook) can listen for it
        window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setStatus('loading');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const subJson = pushSubscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await fetchApi('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ ...subJson, deviceInfo: getDeviceInfo() }),
      });

      localStorage.setItem(STORAGE_KEY, 'true');
      setStatus('subscribed');
    } catch (err) {
      console.error('Push subscribe failed:', err);
      setStatus('unsubscribed');
    }
  }, []);

  // ── Unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    setStatus('loading');

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        const endpoint = pushSubscription.endpoint;
        await pushSubscription.unsubscribe();

        // Best-effort: remove from server (ignore errors)
        await fetchApi('/api/push/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }

      localStorage.removeItem(STORAGE_KEY);
      setStatus('unsubscribed');
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
      setStatus('subscribed'); // revert
    }
  }, []);

  return { status, subscribe, unsubscribe };
}
