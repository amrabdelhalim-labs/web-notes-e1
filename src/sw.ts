/// <reference lib="webworker" />
/**
 * Service Worker — src/sw.ts
 *
 * Built by @serwist/next (Workbox fork).  The plugin injects the precache
 * manifest into self.__SW_MANIFEST at build time.
 *
 * Responsibilities:
 *   1. Precache & serve all static Next.js assets (offline page-shell)
 *   2. Runtime caching strategy per resource type:
 *        • _next/static/*  → CacheFirst  (content-hashed, safe forever)
 *        • *.png / icons   → CacheFirst  (32-entry LRU, 30 days)
 *        • /api/*          → NetworkOnly (always fresh; offline opaqueness avoided)
 *        • pages           → NetworkFirst with offline fallback (defaultCache)
 *   3. Background Sync — when the SW receives a 'notes-sync' tag it tells all
 *        open windows to flush their offline mutation queue (the JWT token lives
 *        in the browser's localStorage so syncing must happen in the main thread)
 *   4. Push Notifications — display a notification; deep-link on click
 */

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, CacheFirst, NetworkOnly, ExpirationPlugin } from 'serwist';
import { defaultCache } from '@serwist/next/worker';

// ─── Type augmentation for SW global scope ────────────────────────────────────

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// SyncEvent is not yet in TS dom lib — declare it manually
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

// PushEvent & NotificationEvent type augmentations
interface PushEvent extends ExtendableEvent {
  readonly data: PushMessageData | null;
}

interface NotificationEvent extends ExtendableEvent {
  readonly notification: Notification;
  readonly action: string;
}

declare const self: ServiceWorkerGlobalScope;

// ─── Serwist instance ─────────────────────────────────────────────────────────

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ── API routes — always go to the network, never cache ────────────────
    {
      matcher: /^https?:\/\/[^/]+\/api\//,
      handler: new NetworkOnly(),
    },

    // ── Next.js content-hashed static bundle — cache forever ──────────────
    {
      matcher: /^\/_next\/static\//,
      handler: new CacheFirst({
        cacheName: 'next-static-assets',
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 365 * 24 * 60 * 60,
            maxEntries: 256,
          }),
        ],
      }),
    },

    // ── PWA icons & images — cache locally with expiry ────────────────────
    {
      matcher: /\/icons\/.*\.(png|svg|webp|jpg|ico)$/,
      handler: new CacheFirst({
        cacheName: 'pwa-icons',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },

    // ── Everything else (pages, fonts, …) ─────────────────────────────────
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// ─── Background Sync ──────────────────────────────────────────────────────────
// When connectivity is restored the browser fires a 'sync' event.
// We forward a PROCESS_OFFLINE_QUEUE message to all open windows so they can
// flush the Dexie pendingOps queue using the auth token in localStorage.

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'notes-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
        });
      })
    );
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
  const data: { title: string; body: string; url?: string } = event.data?.json() ?? {
    title: 'ملاحظاتي',
    body: 'لديك إشعار جديد',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      data: { url: data.url ?? '/' },
      dir: 'auto',
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url: string = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab if there is one pointing to the given URL
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(url);
    })
  );
});
