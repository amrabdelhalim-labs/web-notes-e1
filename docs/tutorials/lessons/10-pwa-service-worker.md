# الدرس 10: تطبيق الويب التقدمي (PWA) و Service Worker

> هدف الدرس: فهم كيف تحوّل **ملاحظاتي** من موقع عادي إلى تطبيق قابل للتثبيت يعمل بدون إنترنت، باتباع مبدأ "البصمة الصفرية" الذي يجعل المتصفح لا يعرف بوجود أي ميزات PWA حتى يُقرّر المستخدم تفعيلها صراحةً.

---

[← فهرس الدروس](../README.md) | الدرس السابق → [الدرس 09: محرر النصوص الغني والتسجيل الصوتي — Tiptap وMediaRecorder](09-tiptap-and-media-recorder.md)

---

## فهرس هذا الدرس

1. [نظرة معمارية — البصمة الصفرية](#1-نظرة-معمارية--البصمة-الصفرية)
2. [sw.ts — Service Worker وSerwist](#2-swts--service-worker-وserwist)
3. [Background Sync وPush Notifications](#3-background-sync-وpush-notifications)
4. [lib/db.ts — قاعدة بيانات Dexie المحلية](#4-libdbts--قاعدة-بيانات-dexie-المحلية)
5. [طابور العمليات المعلّقة — PendingOperation](#5-طابور-العمليات-المعلّقة--pendingoperation)
6. [lib/warmUpCache.ts — بذر الكاش بعد التفعيل](#6-libwarmupcachets--بذر-الكاش-بعد-التفعيل)
7. [PwaActivationContext — البوابة الديناميكية](#7-pwaactivationcontext--البوابة-الديناميكية)
8. [activate و deactivate — التفعيل والإلغاء](#8-activate-و-deactivate--التفعيل-والإلغاء)
9. [usePwaStatus — ثلاثة effects وناتجهم](#9-usepwastatus--ثلاثة-effects-وناتجهم)
10. [PwaActivationDialog — سحّار التفعيل متعدد المراحل](#10-pwaactivationdialog--سحّار-التفعيل-متعدد-المراحل)
11. [OfflineBanner — بانر حالة الاتصال](#11-offlinebanner--بانر-حالة-الاتصال)
12. [ملخص](#12-ملخص)

---

## 1. نظرة معمارية — البصمة الصفرية

### تشبيه: بائع متجول بدون لافتة

تخيّل بائعًا يمشي في الشارع دون أي لافتة أو زيّ مميّز — يبدو لكل المارّة مجرد شخص عادي. لكن حين يتوقف أحد ويقول له "أريد أن أستفيد من خدمتك"، يَسحب البائع سترته، يُركّب شاشته، ويُعلن: "أنا هنا!". هذه هي فكرة **Zero PWA Footprint** (البصمة الصفرية):

- **بدون تفعيل:** المتصفح لا يرى أي `<link rel="manifest">` في الصفحة ولا يعرف بوجود Service Worker — يعاملها كموقع عادي
- **بعد التفعيل:** يُحقن المتصفح ديناميكيًا، يُسجَّل السيرفر ووركر، وتُفتح قاعدة البيانات المحلية

**لماذا؟** — أغلب المستخدمين لا يثبّتون التطبيقات. عرض شريط التثبيت على الجميع يُزعج من لا يريده. البصمة الصفرية تجعل الميزة على شكل "اشتراك اختياري" فقط للجهاز الموثوق.

---

### خريطة الملفات

```
src/
├── sw.ts                                    ← يُشغَّل في worker thread (وليس في React)
└── app/
    ├── context/PwaActivationContext.tsx     ← يُدير lifecycle التفعيل/الإلغاء
    ├── hooks/usePwaStatus.ts               ← يشتق حالة PWA للواجهة
    ├── components/common/
    │   ├── PwaActivationDialog.tsx          ← واجهة التفعيل متعددة المراحل
    │   └── OfflineBanner.tsx               ← بانر الاتصال
    └── lib/
        ├── db.ts                            ← Dexie — التخزين المحلي
        └── warmUpCache.ts                   ← بذر الكاش بعد التفعيل
```

**الترتيب المنطقي:** `sw.ts` (core) → `db.ts` (storage) → `warmUpCache.ts` (seeding) → `PwaActivationContext` (lifecycle) → `usePwaStatus` (state) → `PwaActivationDialog` (UI) → `OfflineBanner` (UI)

---

## 2. sw.ts — Service Worker وSerwist

**الملف:** `src/sw.ts` ← 153 سطرًا  
**البيئة:** worker thread مستقل — لا React، لا DOM، لا localStorage

### ما هو Serwist؟

**Serwist** مكتبة مبنية على **Workbox** (من Google) — هي نفسها لكن بدعم أفضل لـ Next.js App Router. توفّر:
- تسجيل تلقائي لقائمة precache (ملفات تُحدَّد وقت البناء)
- استراتيجيات كاش جاهزة (CacheFirst, NetworkFirst, NetworkOnly…)
- `skipWaiting` + `clientsClaim` لتحكم فوري

---

### إنشاء Serwist

```typescript
/// <reference lib="webworker" />
// ↑ يُخبر TypeScript أن هذا ملف SW Global (لا Window)

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, CacheFirst, NetworkOnly, ExpirationPlugin } from 'serwist';
import { defaultCache } from '@serwist/next/worker';

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST, // يُحقن بالبناء من @serwist/next
  skipWaiting: true,       // SW الجديد يستلم مباشرة بدون انتظار إغلاق جميع التبويبات
  clientsClaim: true,      // يسيطر على كل الصفحات المفتوحة فور تفعيله
  navigationPreload: true, // يبدأ جلب الصفحة قبل تشغيل SW للسرعة
  runtimeCaching: [ ... ],
});

serwist.addEventListeners(); // يُسجّل install/activate/fetch handlers تلقائيًا
```

**`self.__SW_MANIFEST`** — `@serwist/next` يُحقن هذا المصفوفة وقت **البناء** (`next build`) ليحتوي على جميع ملفات Next.js الثابتة مع هاشات المحتوى. الـ SW يُسبق تخزينها (precache) في `install` event.

**`skipWaiting: true`** — افتراضيًا، SW الجديد ينتظر إلى أن تُغلق كل تبويبات المتصفح قبل أن يُصبح نشطًا (لضمان الاتساق). `skipWaiting` يتخطى هذا الانتظار — السيناريو المناسب لتطبيقنا لأن تحديثات SW لا تُغيّر بنية البيانات.

**`navigationPreload: true`** — حين يزور المستخدم صفحة وSW نشط، المتصفح يبدأ جلب الصفحة من الشبكة **بالتوازي** مع إيقاظ SW (وليس بعده) — يُقلل زمن الاستجابة.

---

### استراتيجيات الكاش — أربع طبقات

```typescript
runtimeCaching: [
  // ── الطبقة 1: API routes — لا كاش أبدًا ────────────────────────────
  {
    matcher: /^https?:\/\/[^/]+\/api\//,
    handler: new NetworkOnly(),
  },

  // ── الطبقة 2: ملفات Next.js الثابتة — كاش دائم ──────────────────
  {
    matcher: /^\/_next\/static\//,
    handler: new CacheFirst({
      cacheName: 'next-static-assets',
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 365 * 24 * 60 * 60, // سنة كاملة
          maxEntries: 256,
        }),
      ],
    }),
  },

  // ── الطبقة 3: أيقونات PWA — كاش مع صلاحية ──────────────────────
  {
    matcher: /\/icons\/.*\.(png|svg|webp|jpg|ico)$/,
    handler: new CacheFirst({
      cacheName: 'pwa-icons',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 يومًا
        }),
      ],
    }),
  },

  // ── الطبقة 4: الصفحات وكل شيء آخر ─────────────────────────────
  ...defaultCache, // NetworkFirst مع fallback للصفحات المُسبق تخزينها
],
```

**لماذا `NetworkOnly` للـ API؟**

ثلاثة أسباب أمنية واتساقية:
1. **الطزاجة** — الملاحظات تتغير — نسخة مُخزَّنة قد تُظهر بيانات قديمة
2. **التحقق** — JWT token يُتحقق منه في كل طلب — كاش يتجاوز هذا الفحص
3. **الغموض** — `NetworkOnly` يُفشل الطلب صراحةً عند انقطاع الشبكة بدل إرجاع بيانات قديمة قد تُربك المستخدم

**لماذا `CacheFirst` لـ `_next/static/`؟**

ملفات `_next/static/` مُعنوَنة بهاش المحتوى: `/_next/static/chunks/abc123.js`. إذا تغيّر الملف في النسخة الجديدة، اسمه يتغير — إذن `CacheFirst` آمن تمامًا: ملف يُخزَّن مرة واحدة ويُقرأ دائمًا من الكاش.

**`defaultCache`** — Serwist يوفر استراتيجية افتراضية مُحسَّنة للصفحات: عادةً `NetworkFirst` (جرّب الشبكة أولًا، fallback للكاش عند الانقطاع).

---

### جدول الاستراتيجيات

| المسار | الاستراتيجية | السبب |
|--------|-------------|-------|
| `/api/*` | NetworkOnly | دائمًا طازج + أمان |
| `/_next/static/*` | CacheFirst (365 يوم) | مُعنوَن بالهاش — آمن |
| `/icons/*.png` | CacheFirst (30 يوم) | نادر التغيير |
| الصفحات وغيرها | NetworkFirst + fallback | تحديثات مع دعم offline |

---

## 3. Background Sync وPush Notifications

### Background Sync — مزامنة خلفية

```typescript
// نوع SyncEvent غير مدعوم في TypeScript بعد — نُعلن عنه يدويًا
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'notes-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
          });
        })
    );
  }
});
```

**كيف يعمل Background Sync؟**

1. المستخدم يكتب ملاحظة بدون إنترنت → تُحفظ في Dexie (طابور المعلّقات)
2. `useNotes.processQueue` يطلب `navigator.serviceWorker.ready.sync.register('notes-sync')`
3. حين يعود الإنترنت، المتصفح يُطلق `sync` event في SW مع tag `notes-sync`
4. SW يبحث عن كل النوافذ المفتوحة ويُرسل `PROCESS_OFFLINE_QUEUE`
5. `useNotes` في النافذة يستقبل الرسالة ويُفرّغ طابور Dexie

**لماذا SW يُرسل رسالة للنافذة وليس يُزامن مباشرة؟**

JWT token (رمز الجلسة) يعيش في `localStorage` — ولا يُسمح لـ SW بالوصول لـ `localStorage` (لأنه في سياق worker منفصل). المزامنة الفعلية يجب أن تحدث في الـ main thread حيث `localStorage` متاح.

---

### Push Notifications

```typescript
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? { title: 'ملاحظاتي', body: 'لديك إشعار جديد' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      data: { url: data.url ?? '/' }, // لفتح الرابط عند الضغط
      dir: 'auto',
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();          // أغلق الإشعار
  const url: string = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // ابحث عن تبويب مفتوح بنفس الرابط وركّز عليه
        for (const client of clients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        // لم يُجد تبويبًا — افتح جديدًا
        return self.clients.openWindow(url);
      })
  );
});
```

**`event.waitUntil()`** — يُخبر المتصفح بعدم إيقاظ SW (أو إغلاقه) حتى تنتهي الـ Promise. بدونه، SW قد يُغلق قبل إتمام العملية.

**`dir: 'auto'`** — المتصفح يكتشف اتجاه الإشعار تلقائيًا من النص — عربي يمين، إنجليزي يسار.

---

## 4. lib/db.ts — قاعدة بيانات Dexie المحلية

**الملف:** `src/app/lib/db.ts` ← 225 سطرًا

### ما هي Dexie؟

**Dexie** مكتبة TypeScript فوق **IndexedDB** — قاعدة بيانات مدمجة في المتصفح تُخزّن بيانات هيكلية. مزايا Dexie على IndexedDB الخام:
- API حديثة (Promises بدل callbacks)
- نظام مخطط (schema versioning)
- استعلامات بسيطة (orderBy, filter, bulkPut)

---

### مخطط قاعدة البيانات

```typescript
export class NotesDb extends Dexie {
  notes!: Table<CachedNote>;       // نسخة محلية من الملاحظات
  pendingOps!: Table<PendingOperation>; // طابور العمليات المعلّقة
  devices!: Table<CachedDevice>;   // قائمة الأجهزة الموثوقة (للعرض offline)

  constructor() {
    super('mynotes_offline_db');    // اسم قاعدة البيانات في IndexedDB

    // الإصدار 1 — البداية
    this.version(1).stores({
      notes:      '_id, type, createdAt, _cachedAt',
      // ↑ المفتاح الأساسي: _id (MongoDB ObjectId)
      // الأعمدة المُفهرَسة: type, createdAt, _cachedAt (للترتيب والفلترة)
      pendingOps: '++id, type, timestamp',
      // ↑ ++ = auto-increment PK (رقم تلقائي)
    });

    // الإصدار 2 — أضاف جدول devices
    this.version(2).stores({
      notes:      '_id, type, createdAt, _cachedAt',
      pendingOps: '++id, type, timestamp',
      devices:    'deviceId, _cachedAt',
    });
  }
}

export const db = new NotesDb(); // singleton — instance واحدة في كل التطبيق
```

**نظام التحديث في Dexie** — حين تُغيّر المخطط:
- المستخدمون الجدد يبدؤون مباشرة بآخر إصدار
- المستخدمون القدامى يمرّون عبر `upgrade()` functions للانتقال بأمان
- **لا تُعدَّل** مخطط إصدار قديم — أضف إصدارًا جديدًا دائمًا

**لماذا نُخزّن الأجهزة في Dexie؟** — صفحة الملف الشخصي تُظهر قائمة الأجهزة الموثوقة — لو كانت تحتاج الشبكة دائمًا، ستُعرض الصفحة فارغة offline. الكاش محلي يُتيح عرض القائمة حتى بدون اتصال.

---

### CachedNote و CachedDevice

```typescript
export type CachedNote = Note & {
  _cachedAt: number; // Date.now() وقت الكاش — لإدارة الصلاحية مستقبلًا
};

export type CachedDevice = Device & {
  _cachedAt: number;
};
```

**`_cachedAt`** — لا يُستخدم حاليًا للتصفية لكن يُوفّر أساسًا لـ "invalidate cache older than X" مستقبلًا بدون تغيير المخطط.

---

### cacheNotes — منطق حرج

```typescript
export async function cacheNotes(notes: Note[]): Promise<void> {
  const now = Date.now();
  const entries: CachedNote[] = notes.map((n) => ({ ...n, _cachedAt: now }));

  // ─── الحفاظ على audioData من عناصر موجودة ────────────────────────────
  const existing = await db.notes.bulkGet(entries.map((e) => e._id));
  const merged = entries.map((entry, i) => {
    const prev = existing[i];
    // API قائمة الملاحظات تحذف audioData للتوفير في bandwidth
    // لو عندنا نسخة كاملة محلية — نحافظ عليها
    if (prev?.audioData && !entry.audioData) {
      return {
        ...entry,
        audioData: prev.audioData,
        audioDuration: entry.audioDuration ?? prev.audioDuration,
      };
    }
    return entry;
  });

  await db.notes.bulkPut(merged); // أضف أو حدّث

  // ─── فرض حد الكاش ────────────────────────────────────────────────────
  const totalCount = await db.notes.count();
  if (totalCount > MAX_CACHED_NOTES) {
    const allNotes = await db.notes.orderBy('createdAt').reverse().toArray();
    const toDelete = allNotes.slice(MAX_CACHED_NOTES).map((n) => n._id);
    if (toDelete.length > 0) {
      await db.notes.bulkDelete(toDelete);
    }
  }
}
```

**المشكلة التي تُحلّها**: API قائمة الملاحظات (`GET /api/notes?page=1`) تُرجع كل الملاحظات لكن **بدون** `audioData` (ملفات الصوت قد تكون كبيرة جدًا). API الفردي (`GET /api/notes/[id]`) يُرجع الملاحظة **كاملة** مع `audioData`.

لو كنّا نُعيد كتابة الكاش بشكل أعمى عند كل `fetchNotes()`، ستُمحى الـ `audioData` التي جلبناها بshine كل طلب جلب! `bulkGet` قبل `bulkPut` يضمن الحفاظ على ما حُمّل مسبقًا.

---

## 5. طابور العمليات المعلّقة — PendingOperation

### هيكل PendingOperation

```typescript
export interface PendingOperation {
  id?: number;           // auto-increment PK (Dexie يُسنده)
  type: PendingOpType;   // 'create' | 'update' | 'delete'
  tempId?: string;       // معرّف مؤقت لعمليات الإنشاء (قبل رد الخادم)
  noteId?: string;       // معرّف فعلي (للتحديث والحذف)
  noteTitle?: string;    // عنوان الملاحظة للعرض في لوحة "العمليات المعلّقة"
  noteSnapshot?: Note;   // نسخة كاملة قبل التعديل (للتراجع)
  payload?: NoteInput | UpdateNoteInput; // البيانات لإرسالها للخادم
  timestamp: number;     // وقت الإضافة للطابور
  failureCount?: number; // عدد محاولات الإرسال الفاشلة
}
```

**لماذا `tempId` للإنشاء؟**

عند إنشاء ملاحظة offline:
1. نُنشئ معرّفًا محليًا: `_id: 'tmp_' + Date.now()`
2. نُخزّن الملاحظة في Dexie بهذا المعرف
3. نُضيف عملية pending بنوع `create` و `tempId: 'tmp_...'`
4. عند المزامنة، الخادم يُرجع الـ `_id` الحقيقي (MongoDB ObjectId)
5. نُزيل `tmp_*` من Dexie ونُضيف النسخة الخادمية

---

### دوال الطابور

```typescript
/** إضافة عملية للطابور */
export async function enqueuePendingOp(op: Omit<PendingOperation, 'id'>): Promise<number> {
  return db.pendingOps.add({ ...op, timestamp: Date.now() }) as Promise<number>;
  // يُعيد الـ id المُسنَد للعملية
}

/** قراءة كل العمليات بترتيب الإضافة (FIFO) */
export async function getPendingOps(): Promise<PendingOperation[]> {
  return db.pendingOps.orderBy('id').toArray();
  // id auto-increment = ترتيب زمني مضمون
}

/** إزالة عملية بعد نجاح مزامنتها */
export async function removePendingOp(id: number): Promise<void> {
  await db.pendingOps.delete(id);
}

/** هل يوجد عمليات معلّقة؟ */
export async function hasPendingOps(): Promise<boolean> {
  return (await db.pendingOps.count()) > 0;
}

/** زيادة عداد الفشل (لا نُزيل — نُعيد المحاولة) */
export async function incrementPendingOpFailure(id: number): Promise<void> {
  const op = await db.pendingOps.get(id);
  if (op) {
    await db.pendingOps.update(id, { failureCount: (op.failureCount ?? 0) + 1 });
  }
}
```

**لماذا نزيد failureCount ولا نُزيل؟** — الفشل قد يكون مؤقتًا (خادم زاحم). حذف العملية يعني فقدان تعديل المستخدم إلى الأبد. نُبقيها ونجرب مرة أخرى عند المحاولة التالية.

---

### cleanStaleNotes — تنظيف tmp_*

```typescript
export async function cleanStaleNotes(): Promise<number> {
  const all = await db.notes.toArray();
  const staleIds = all.filter((n) => n._id.startsWith('tmp_')).map((n) => n._id);
  if (staleIds.length > 0) {
    await db.notes.bulkDelete(staleIds);
  }
  return staleIds.length;
}
```

تُستدعى في نهاية كل `processQueue` ناجح. تُزيل أي `tmp_*` متبقية من:
- الملاحظات المُزامَنة حديثًا (جُلبت بـ `_id` حقيقي الآن)
- ملاحظات قديمة من إصدارات سابقة من التطبيق

---

### clearOfflineData — عند إلغاء الثقة

```typescript
export async function clearOfflineData(): Promise<void> {
  // Note: devices يُبقى عمدًا — هو فقط metadata ليس محتوى خاصًا
  await Promise.all([db.pendingOps.clear(), db.notes.clear()]);
}
```

**لماذا نُبقي `devices` ولا نُمسحها؟** — تعليق في الكود يُوضّح: `devices` بيانات وصفية فقط (أسماء وتواريخ)، ليست محتوى خاصًا مثل الملاحظات. تُمسح عند بدء الجلسة التالية بالمصادقة. العملية الرئيسية: حذف الملاحظات (محتوى خاص) وطابور المعلّقات (يجب ألّا تُرسل لخادم لجهاز انتهت ثقته).

---

## 6. lib/warmUpCache.ts — بذر الكاش بعد التفعيل

**الملف:** `src/app/lib/warmUpCache.ts` ← 134 سطرًا

### ماذا يعني "بذر الكاش"؟

عند تفعيل PWA للمرة الأولى، Service Worker نشط لكن كاشه **فارغ** — لو أغلق المستخدم الإنترنت مباشرة لن يرى شيئًا offline. نحتاج "بذر" الكاش بالبيانات الحالية فور التفعيل.

---

### waitForSWControl — انتظار السيطرة

```typescript
export async function waitForSWControl(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (navigator.serviceWorker.controller) return; // SW يسيطر بالفعل

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, SW_CONTROL_TIMEOUT); // 5 ثوان
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true } // يُزال تلقائيًا بعد أول إطلاق
    );
  });
}
```

**لماذا ننتظر؟** — لو بدأنا جلب الملاحظات قبل أن يُسيطر SW، طلبات `fetch()` لن تمر عبره ولن تُخزَّن في كاشه. `navigator.serviceWorker.controller` يُشير لـ SW المُسيطر حاليًا. `controllerchange` يُطلق حين يستلم SW السيطرة بعد `clients.claim()`.

---

### prefetchPageShells — جلب هياكل الصفحات

```typescript
export async function prefetchPageShells(noteIds: string[]): Promise<void> {
  const paths: string[] = SUPPORTED_LOCALES.flatMap((locale) => [
    `/${locale}/notes`,            // قائمة الملاحظات
    `/${locale}/notes/new`,         // إنشاء ملاحظة
    `/${locale}/profile`,           // الملف الشخصي
    ...noteIds
      .slice(0, 20)                 // أول 20 ملاحظة فقط (الأكثر حداثةً)
      .flatMap((id) => [
        `/${locale}/notes/${id}`,       // تفاصيل الملاحظة
        `/${locale}/notes/${id}/edit`,  // تعديل الملاحظة
      ]),
  ]);

  await Promise.allSettled(
    paths.map((url) =>
      fetch(url, { credentials: 'include' }).catch(() => {})
    )
  );
}
```

**`credentials: 'include'`** — يُرسل cookie الجلسة مع الطلب لأن صفحات الملاحظات محمية بالمصادقة. بدونه، الخادم يُعيد redirect للصفحة الرئيسية بدل الصفحة الفعلية.

**`Promise.allSettled`** — يُكمل حتى لو فشل بعض الطلبات — فشل صفحة واحدة لا يمنع باقيها.

**`slice(0, 20)`** — نُقيّد عدد الصفحات التفصيلية لتجنب جلب مئات الطلبات لحسابات بملاحظات كثيرة.

---

### warmUpOfflineCache — التدفق الكامل

```typescript
export async function warmUpOfflineCache(): Promise<void> {
  // ── Phase 0: انتظر سيطرة SW ──────────────────────────────────────────
  try {
    await waitForSWControl();
  } catch {
    // استمر حتى بدون تحكم كامل — Dexie على الأقل ستعمل
  }

  let notes: Note[] = [];

  // ── Phase 1: جلب قائمة الملاحظات وبذر Dexie ─────────────────────────
  try {
    const res = await getNotesApi({ page: 1, limit: MAX_CACHED_NOTES });
    notes = res.data.notes;
    await cacheNotes(notes);          // ← تُخزَّن في Dexie
    // getNotesApi() يمر عبر SW → يُخزَّن في كاش SW أيضًا
  } catch {
    return; // لو فشل الجلب — لا يمكن الاستمرار
  }

  const noteIds = notes.map((n) => n._id);
  const voiceNoteIds = notes.filter((n) => n.type === 'voice').map((n) => n._id);

  // ── Phase 2a: جلب الملاحظات الصوتية كاملة (مع audioData) ──────────────
  await Promise.allSettled(
    voiceNoteIds.slice(0, MAX_AUDIO_PREFETCH).map(async (id) => { // حد 20
      try {
        const res = await getNoteApi(id);
        await cacheNotes([res.data]); // ← cacheNotes يحفظ audioData
      } catch {
        // فشل ملاحظة صوتية واحدة ليس حرجًا
      }
    })
  );

  // ── Phase 2b: جلب هياكل الصفحات (awaited — يجب قبل نجاح Dialog) ──────
  await prefetchPageShells(noteIds);
  // ↑ بعد هذا، الصفحات موجودة في كاش SW جاهزة للـ offline
}
```

**ترتيب الـ phases حرج**:
1. SW يجب أن يُسيطر أولًا (Phase 0) — وإلا الطلبات لا تمر عبره
2. الملاحظات في Dexie (Phase 1) — للعرض offline بدون شبكة
3. الصوتيات (Phase 2a) — بيانات كبيرة، بعد الأساسيات
4. هياكل الصفحات (Phase 2b) — للتنقل offline

---

## 7. PwaActivationContext — البوابة الديناميكية

**الملف:** `src/app/context/PwaActivationContext.tsx` ← 267 سطرًا

### الثوابت والمفاهيم

```typescript
export const PWA_ENABLED_KEY = 'pwa-enabled';
// ↑ مُصدَّر للاستخدام في usePwaStatus والاختبارات
export const PWA_ACTIVATION_EVENT = 'pwa:activation-changed';
// ↑ CustomEvent لإخطار كل المستخدمين بتغيير الحالة

const TRUSTED_KEY = 'device-trusted';  // خاص — لا يُستخدم خارجًا
const SW_PATH = '/sw.js';
const MANIFEST_PATH = '/manifest.json';
```

**شرطان للبقاء "مُفعَّلًا":**
```
isActivated = localStorage['pwa-enabled'] === 'true'
           && localStorage['device-trusted'] === 'true'
```

لو أُلغيت ثقة الجهاز (`device-trusted` مُحذف)، يُعتبر غير مُفعَّل حتى لو `pwa-enabled` لا يزال موجودًا.

---

### DOM helpers — التلاعب بالـ manifest

```typescript
function injectManifest(): void {
  if (typeof document === 'undefined') return; // SSR-safe
  if (document.querySelector('link[rel="manifest"]')) return; // لا تُكرّر
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = MANIFEST_PATH;
  document.head.appendChild(link);
}

function removeManifest(): void {
  if (typeof document === 'undefined') return;
  document.querySelector('link[rel="manifest"]')?.remove();
}
```

**لماذا نُحقن manifest ديناميكيًا بدل وضعه في `<head>` الثابت؟**

حين يرى متصفح `<link rel="manifest">` في HTML، يبدأ **فورًا** في تحليل ما إذا كان يجب عرض شريط التثبيت. البصمة الصفرية تتطلب إبقاء المتصفح في جهل تام حتى تفعيل صريح من المستخدم.

---

### registerSW — تسجيل ذكي

```typescript
async function registerSW(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported in this browser');
  }
  // المسار الأفضل: Serwist API (يُحقنها next.config.mjs عند register: false)
  if (typeof window !== 'undefined' && window.serwist !== undefined) {
    await window.serwist.register();
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (reg) return reg;
  }
  // Fallback: تسجيل يدوي مباشر
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}
```

**`window.serwist`** — حين تُعيّن `register: false` في `next.config.mjs`، تُحقن `@serwist/next` كائن `window.serwist` يُتيح التحكم اليدوي بدورة حياة SW (بدل التسجيل التلقائي عند تحميل الصفحة). هذا مطلوب للبصمة الصفرية.

---

### broadcast — قناة الإشعار الداخلية

```typescript
const broadcast = useCallback((activated: boolean) => {
  window.dispatchEvent(
    new CustomEvent(PWA_ACTIVATION_EVENT, { detail: { activated } })
  );
}, []);
```

**نمط Pub/Sub عبر CustomEvent**: بدلًا من prop-drilling أو Context nesting، Context يُطلق أحداثًا. أي hook أو مكوّن يُضيف event listener يحصل على التحديث فورًا. `usePwaStatus` يستمع لهذا الحدث في Effect 1.

---

### الحماسات (Guards)

```typescript
const deactivatingRef = useRef(false);
// ↑ يمنع تنفيذ deactivate() مرتين متزامنتين (double-click أو استدعاء مزدوج)

const revokedRef = useRef(false);
// ↑ يمنع تنفيذ handleRevoked() أكثر من مرة
//   كلٌّ من processQueue و useDevices.fetchDevices قد يُطلقان device:trust-revoked
//   تقريبًا في نفس اللحظة عند استعادة الاتصال
```

---

## 8. activate و deactivate — التفعيل والإلغاء

### activate — خطوات التفعيل

```typescript
const activate = useCallback(async () => {
  injectManifest();              // ← الخطوة 1: أخبر المتصفح بوجود manifest
  try {
    await registerSW();          // ← الخطوة 2: سجّل SW (قد يستغرق ثوانٍ)
  } catch (err) {
    removeManifest();            // ← فشل: تراجع — أعد البصمة الصفرية
    throw err;                   // ← أُعِد الخطأ لـ PwaActivationDialog
  }
  localStorage.setItem(PWA_ENABLED_KEY, 'true'); // ← احفظ
  setIsActivated(true);
  broadcast(true);               // ← أخطر usePwaStatus وأي مستمع آخر
}, [broadcast]);
```

**الترتيب الدقيق مهم:** manifest أولًا ثم SW — لأن بعض المتصفحات تحتاج manifest لعرض شريط التثبيت. لو فشل SW، نُزيل manifest لإبقاء البصمة الصفرية.

---

### deactivate — خطوات الإلغاء

```typescript
const deactivate = useCallback(async () => {
  if (deactivatingRef.current) return; // منع التكرار
  deactivatingRef.current = true;
  setIsDeactivating(true);
  try {
    removeManifest();                    // أزل manifest
    await unregisterSW();               // أوقف SW
    await clearOfflineData().catch(()=>{}); // امسح Dexie (ignore errors)
    await clearCacheStorage().catch(()=>{}); // امسح كاش SW
    await clearPushSubscription();      // ألغِ اشتراك Push
    localStorage.removeItem(PWA_ENABLED_KEY);
    window.location.reload();           // ← ضروري (راجع التوضيح أدناه)
  } catch {
    deactivatingRef.current = false;
    setIsDeactivating(false);           // أتاح للمستخدم إعادة المحاولة
  }
}, []);
```

**لماذا `window.location.reload()` ضروري؟**

Next.js يُحمّل chunks JavaScript ديناميكيًا عند التنقل (code splitting). حين كان SW نشطًا، هذه الـ chunks تُخدَّم من كاشه. بعد إلغاء تسجيل SW وسط الجلسة:
- التنقل لصفحة جديدة يطلب chunk → يضرب الشبكة مباشرة → Chunk URL بهاش قديم قد لا يعود موجودًا على خادم محدَّث → **ChunkLoadError (HTTP 500)**

`reload()` يبدأ جلسة نظيفة — كل الـ chunks تُحمَّل من الشبكة مباشرة.

---

### useEffect mount — استعادة الحالة

```typescript
useEffect(() => {
  if (initDone.current) return; // React StrictMode يُشغّل effects مرتين في dev
  initDone.current = true;

  const pwaEnabled = localStorage.getItem(PWA_ENABLED_KEY) === 'true';
  const trusted = localStorage.getItem(TRUSTED_KEY) === 'true';

  if (pwaEnabled && trusted) {
    injectManifest(); // أعد حقن manifest (قد يُفقد بعد hard refresh)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then((reg) => {
        if (!reg) {
          // SW غائب (مُمسح من DevTools مثلًا) — حاول إعادة تسجيله
          registerSW().catch(() => {
            localStorage.removeItem(PWA_ENABLED_KEY);
            removeManifest();
            setIsActivated(false);
            broadcast(false);
          });
        }
      });
    }
    broadcast(true); // أخطر usePwaStatus أن Context جاهز
  } else if (pwaEnabled && !trusted) {
    // حالة متناقضة: pwa-enabled لكن الجهاز لم يعد موثوقًا
    // (حدث أثناء الـ offline — الخادم ألغى الثقة ولم نعرف بعد)
    localStorage.removeItem(PWA_ENABLED_KEY);
    removeManifest();
    unregisterSW().catch(() => {});
    clearOfflineData().catch(() => {});
    clearCacheStorage().catch(() => {});
  }

  // الاستماع لإلغاء الثقة من جهاز آخر
  const handleRevoked = () => {
    if (revokedRef.current) return; // منع التكرار
    revokedRef.current = true;
    removeManifest();
    localStorage.removeItem(PWA_ENABLED_KEY);
    unregisterSW().catch(() => {});
    clearOfflineData().catch(() => {});
    clearCacheStorage().catch(() => {});
    clearPushSubscription().catch(() => {});
    setIsActivated(false);
    broadcast(false);
    // لا reload() هنا — AuthContext.logout() يُعالج التنقل
  };

  window.addEventListener('device:trust-revoked', handleRevoked);
  return () => window.removeEventListener('device:trust-revoked', handleRevoked);
}, [broadcast]);
```

**`initDone.current`** — React StrictMode في وضع التطوير يُشغّل كل `useEffect` مرتين لكشف الآثار الجانبية غير النظيفة. `initDone.current` يضمن تنفيذ منطق الـ mount مرة واحدة فقط.

**handleRevoked vs deactivate:** الفرق الجوهري:
- `deactivate()` يُشغّل `window.location.reload()` — مناسب حين المستخدم يُلغّي يدويًا
- `handleRevoked()` لا يُعيد تحميل — `AuthContext.logout()` يُعالج التنقل للصفحة الرئيسية

---

## 9. usePwaStatus — ثلاثة effects وناتجهم

**الملف:** `src/app/hooks/usePwaStatus.ts` ← 275 سطرًا

### الأنواع المُصدَّرة

```typescript
export type SwState =
  | 'unsupported'  // المتصفح لا يدعم SWs
  | 'checking'     // لا نزال نتحقق
  | 'inactive'     // مدعوم لكن لا يوجد SW نشط
  | 'installing'   // SW يُثبَّت حاليًا
  | 'active';      // SW نشط ويعمل

export type InstallState =
  | 'standalone'             // مُثبَّت كـ PWA + جهاز موثوق
  | 'standalone-untrusted'   // مُثبَّت لكن الجهاز غير موثوق
  | 'installable'            // يمكن تثبيته (beforeinstallprompt جاهز) + موثوق
  | 'not-installable';       // PWA غير مُفعَّل أو المتصفح لا يدعمه
```

---

### installState — منطق useMemo

```typescript
const installState = useMemo<InstallState>(() => {
  if (!pwaActivated) return 'not-installable'; // البصمة الصفرية — لا شيء
  if (isStandalone && isTrusted) return 'standalone';
  if (isStandalone && !isTrusted) return 'standalone-untrusted';
  if (canInstall && isTrusted) return 'installable';
  return 'not-installable';
}, [pwaActivated, isStandalone, isTrusted, canInstall]);
```

**`standalone-untrusted` لماذا يوجد؟**

المستخدم قد يُثبّت التطبيق عبر قائمة المتصفح مباشرة (بدون زر التثبيت الداخلي). يُصبح `standalone` لكن بدون الثقة الصريحة التي يمنحها نظامنا. يُحتاج لنشر رسالة "اذهب للملف الشخصي وثق الجهاز لتفعيل المزامنة".

---

### Effect 1 — المستمعون الدائمون

```typescript
useEffect(() => {
  // beforeinstallprompt: المتصفح جاهز لعرض التثبيت
  const handleInstallPrompt = (e: Event) => {
    e.preventDefault(); // لا تُظهر شريط التثبيت التلقائي
    deferredPromptRef.current = e as BeforeInstallPromptEvent;
    setCanInstall(true);
    setInstallCheckPending(false); // انتهى التحقق
  };

  // appinstalled: المستخدم ثبّته — أزل زر التثبيت
  const handleAppInstalled = () => {
    deferredPromptRef.current = null;
    setCanInstall(false);
  };

  // storage: مزامنة تغيير TRUSTED_KEY من تبويب آخر
  const handleStorage = (e: StorageEvent) => {
    if (e.key === TRUSTED_KEY) setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');
  };

  // device-trust-changed: CustomEvent من نفس التبويب
  const handleTrustChanged = () => setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');

  // pwa:activation-changed: من PwaActivationContext
  const handleActivationChanged = (e: Event) => {
    const activated = (e as CustomEvent<{ activated: boolean }>).detail.activated;
    setPwaActivated(activated);
    if (!activated) {
      setSwState('inactive');
      setCanInstall(false);
      setInstallCheckPending(false);
      deferredPromptRef.current = null;
    }
  };

  // visibilitychange: المستخدم عاد للتبويب — تحقق من أي تغييرات
  const handleVisibility = () => {
    if (document.visibilityState !== 'visible') return;
    setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || ...
    );
  };

  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
  // ... باقي addEventListener
  return () => { /* cleanup */ };
}, []); // لا تبعيات — يعمل طوال عمر المكوّن
```

**لماذا `e.preventDefault()` لـ `beforeinstallprompt`؟**

المتصفح افتراضيًا يُظهر شريط تثبيت تلقائيًا. `preventDefault()` يُلغي هذا ويُبقي الـ prompt في `deferredPromptRef` لاستدعائه لاحقًا عبر `triggerInstall()` حين نشاء نحن.

---

### Effect 2 — كشف حالة SW

```typescript
useEffect(() => {
  if (!pwaActivated) return; // لا نُشغّل أي كشف قبل التفعيل

  navigator.serviceWorker.getRegistration('/').then((reg) => {
    if (!reg) { setSwState('inactive'); return; }

    // تحديد الحالة الآنية
    if (reg.active) setSwState('active');
    else if (reg.installing || reg.waiting) setSwState('installing');
    else setSwState('inactive');

    // مراقبة التغييرات المستقبلية
    const sw = reg.installing ?? reg.waiting ?? reg.active;
    if (sw) sw.addEventListener('statechange', () => updateSwState(reg));

    reg.addEventListener('updatefound', () => {
      setSwState('installing');
      reg.installing?.addEventListener('statechange', () => updateSwState(reg));
    });
  });
}, [pwaActivated]); // يُعاد تشغيله حين يتغير pwaActivated
```

**لماذا يتبع `pwaActivated` كتبعية؟** — في الجلسة نفسها، المستخدم قد يُفعّل PWA. يريد `usePwaStatus` كشف SW الجديد فورًا دون انتظار reload. تفعيله ببعد `pwaActivated` يضمن تشغيل Effect 2 مباشرة بعد التفعيل.

---

### Effect 3 — مؤقت 5 ثوانٍ

```typescript
useEffect(() => {
  if (!installCheckPending) return;
  const timer = setTimeout(() => setInstallCheckPending(false), 5_000);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // قصد: مرة واحدة عند mount
```

**لماذا يُعطَّل lint وتُجعل empty deps؟**

`installCheckPending` ليس في deps عمدًا — المؤقت يُشغَّل مرة واحدة عند mount. لو أضفنا `installCheckPending` كتبعية، كل مرة يتغيّر سيُعاد تشغيل المؤقت مما يُطيل فترة `pending` إلى الأبد. نريد: "بعد 5 ثوانٍ من أول تحميل، انته من التحقق".

---

### triggerInstall — زر التثبيت

```typescript
const triggerInstall = useCallback(async (): Promise<boolean> => {
  const prompt = deferredPromptRef.current;
  if (!prompt) return false;
  try {
    await prompt.prompt();              // أظهر الـ native install dialog
    const { outcome } = await prompt.userChoice; // انتظر قرار المستخدم
    if (outcome === 'accepted') {
      deferredPromptRef.current = null; // لا يمكن استخدام نفس prompt مرتين
      setCanInstall(false);
    }
    return outcome === 'accepted';
  } catch {
    return false;
  }
}, []);

// يُعرَّض فقط في حالة installable (أو null)
triggerInstall: installState === 'installable' ? triggerInstall : null,
```

**`deferredPromptRef` بدل state:** prompt هو كائن لحظي من المتصفح. تخزينه في state يُسبب re-render غير ضروري. ref يُتيح القراءة في `triggerInstall` closure دون stale-closure (لأن `deferredPromptRef.current` يُقرأ وقت الاستدعاء).

---

## 10. PwaActivationDialog — سحّار التفعيل متعدد المراحل

**الملف:** `src/app/components/common/PwaActivationDialog.tsx` ← 228 سطرًا

### آلة الحالة

```typescript
type DialogPhase = 'info' | 'activating' | 'done' | 'error';
type StepStatus  = 'pending' | 'active' | 'done' | 'error';
```

**4 مراحل للمربع الحواري:**
- `info` — يشرح للمستخدم ما سيُفعَّل (manifest + SW + IndexedDB)
- `activating` — تُنفَّذ الخطوات الفعلية مع Stepper متحرك
- `done` — نجاح — Alert خضراء وزر إغلاق
- `error` — فشل — Alert حمراء وزر إعادة المحاولة

---

### StepStatusIcon — أيقونة ديناميكية

```typescript
function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === 'active') return <CircularProgress size={20} sx={{ mx: 0.25 }} />;
  if (status === 'done')   return <CheckCircleIcon color="success" fontSize="small" />;
  if (status === 'error')  return <ErrorIcon color="error" fontSize="small" />;
  return null; // pending — يُظهر رقم الخطوة الافتراضي من MUI Stepper
}
```

**`StepIconComponent`** — prop في MUI `StepLabel` يُستبدل الأيقونة الافتراضية (رقم مُحاط بدائرة) بمكوّن مخصص — يُستخدم فقط حين الحالة ليست `pending` (لإبقاء الرقم الافتراضي للخطوات القادمة).

---

### handleActivate — التنسيق الكامل

```typescript
const handleActivate = useCallback(async () => {
  setPhase('activating');
  try {
    // ── الخطوة 0: Manifest (تأخير بصري 400ms) ──────────────────
    setActiveStep(0);
    setStepStatuses(['active', 'pending', 'pending']);
    await new Promise<void>((r) => setTimeout(r, 400));
    // ↑ Manifest يحدث بستة لا نراها — التأخير يُتيح المستخدم رؤية الخطوة
    // ولا تُضاف activate() هنا — تُضاف في الخطوة 1

    // ── الخطوة 1: تسجيل SW (العمل الحقيقي) ──────────────────────
    setActiveStep(1);
    setStepStatuses(['done', 'active', 'pending']);
    await activate(); // ← injectManifest + registerSW + localStorage

    // ── الخطوة 2: بذر الكاش ───────────────────────────────────────
    setActiveStep(2);
    setStepStatuses(['done', 'done', 'active']);
    await warmUpOfflineCache(); // ← waitForControl + cacheNotes + prefetch

    setStepStatuses(['done', 'done', 'done']);
    setPhase('done');
  } catch (err) {
    const msg = err instanceof Error ? err.message : t('errorBody');
    setErrorMessage(msg);
    setStepStatuses((prev) => prev.map((s) => (s === 'active' ? 'error' : s)));
    setPhase('error');
  }
}, [activate, t]);
```

**`setStepStatuses((prev) => prev.map(...))`** — تحديث وظيفي (functional update). عند الخطأ لا نعرف أي خطوة كانت `active` ثابتًا في `handleActivate` — نقرأ من الـ prev state الفعلي لتحديد الخطوة الفاشلة.

---

### منع الإغلاق أثناء التفعيل

```tsx
<Dialog
  open={open}
  onClose={phase === 'activating' ? undefined : handleClose}
  // ↑ undefined يُعطّل الإغلاق بالضغط خارج المربع أو Escape
  maxWidth="sm"
  fullWidth
>
```

**لماذا نمنع الإغلاق؟** — التفعيل يُعدّل DOM (manifest) ويُسجّل SW. إغلاق المربع في منتصف العملية يترك التطبيق في حالة غير متسقة (manifest موجود، SW قيد التسجيل). الحل أبسط من معالجة cleanup جزئي.

---

## 11. OfflineBanner — بانر حالة الاتصال

**الملف:** `src/app/components/common/OfflineBanner.tsx` ← 80 سطرًا

```typescript
export default function OfflineBanner() {
  const t = useTranslations('OfflineBanner');
  const isOnline = useOfflineStatus(); // hook يستمع لـ window online/offline events

  const [showReturnedOnline, setShowReturnedOnline] = useState(false);
  const prevOnline = useRef<boolean>(isOnline); // يتتبع الحالة السابقة

  useEffect(() => {
    const wasOffline = !prevOnline.current && isOnline; // offline → online
    prevOnline.current = isOnline;

    if (wasOffline) {
      const showTimer = setTimeout(() => setShowReturnedOnline(true), 0);
      const hideTimer = setTimeout(() => setShowReturnedOnline(false), 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOnline]);
  ...
}
```

**`prevOnline` ref** — لاكتشاف الانتقال تحديدًا من offline لـ online (لعرض Toast). `useState` لهذا الغرض يُتسبب في re-render إضافي. ref يُبقي القيمة دون re-render.

**`setTimeout(fn, 0)` لـ showTimer** — يُؤجل `setShowReturnedOnline(true)` للـ tick التالي. React 18 يُجمّع setState بذكاء — التأجيل يُضمن عرض البانر بعد اكتمال render لحالة `isOnline`.

**`setTimeout(fn, 4000)` لـ hideTimer** — بعد 4 ثوانٍ يختفي Toast. يُلغى كلا المؤقتين في cleanup لمنع setState على مكوّن unmounted.

---

### عرض البانر

```tsx
return (
  <Box
    role="status"          // ← ARIA: يُخبر قارئ الشاشة بالموقع
    aria-live="polite"     // ← يُعلن التغييرات بعد انتهاء القراءة الحالية
    aria-atomic="true"     // ← يقرأ محتوى الـ Box كاملًا وليس جزئيًا
    sx={{ width: '100%' }}
  >
    {/* بانر Offline — يظهر عند !isOnline */}
    <Collapse in={!isOnline} unmountOnExit>
      <Alert
        icon={<WifiOffIcon />}
        severity="warning"
        variant="filled"
        sx={{ borderRadius: 0 }} // يمتد من حافة لحافة
      >
        {t('offlineMessage')}
      </Alert>
    </Collapse>

    {/* Toast "عاد الاتصال — تُزامَن..." */}
    <Collapse in={isOnline && showReturnedOnline} unmountOnExit>
      <Alert icon={<WifiIcon />} severity="success" variant="filled" sx={{ borderRadius: 0 }}>
        {t('backOnlineMessage')}
      </Alert>
    </Collapse>
  </Box>
);
```

**`unmountOnExit`** — Collapse يُزيل محتوى DOM عند الإغلاق بدل إخفائه بـ CSS فقط. مهم لـ ARIA: قارئ الشاشة لا يجب أن يصل للبانر المختفي.

**`aria-live="polite"`** — يُعلن المحتوى المتغير للمستخدم بعد انتهاء قراءة ما هو جارٍ. `"assertive"` سيُقاطع — نُفضّل `polite` لأن انقطاع الإنترنت ليس طارئًا.

**`borderRadius: 0`** — البانر يمتد من حافة لحافة الشاشة بدون زوايا دائرية — يُعطي تأثير "شريط نظام".

---

## 12. ملخص

| ما تعلمناه | الملف | النمط أو التقنية |
|------------|-------|-----------------|
| Zero PWA Footprint — لا manifest حتى التفعيل | `PwaActivationContext` | injectManifest() ديناميكيًا |
| Serwist + 4 استراتيجيات كاش | `sw.ts` | NetworkOnly / CacheFirst / defaultCache |
| Background Sync عبر postMessage | `sw.ts` | PROCESS_OFFLINE_QUEUE للـ main thread |
| Push Notifications + deep-link | `sw.ts` | showNotification + clients.openWindow |
| Dexie — 3 جداول + schema versioning | `lib/db.ts` | version(1)→version(2) |
| الحفاظ على audioData عبر merging | `lib/db.ts` | bulkGet قبل bulkPut |
| طابور المعلّقات FIFO مع failureCount | `lib/db.ts` | enqueuePendingOp / removePendingOp |
| بذر الكاش بـ 4 مراحل متسلسلة | `lib/warmUpCache.ts` | waitForSWControl → cacheNotes → prefetch |
| activate مع rollback عند الفشل | `PwaActivationContext` | removeManifest() عند throw |
| reload() ضروري بعد deactivate | `PwaActivationContext` | ChunkLoadError prevention |
| useRef لمنع تنفيذ مزدوج (Guards) | `PwaActivationContext` | deactivatingRef + revokedRef + initDone |
| SwState/InstallState بـ useMemo | `usePwaStatus` | 4 حالات InstallState من متغيرات متعددة |
| 3 effects بمسؤولية واحدة لكل | `usePwaStatus` | always-on / pwaActivated / timeout |
| triggerInstall بـ deferredPromptRef | `usePwaStatus` | ref لتجنب stale-closure |
| Dialog آلة حالة + Stepper | `PwaActivationDialog` | StepStatus + DialogPhase |
| ARIA live region للبانر | `OfflineBanner` | role=status + aria-live=polite |
| prevOnline ref لكشف الانتقال | `OfflineBanner` | offline→online transition detection |

---

### نقطة المراقبة

قبل الانتقال للدرس التالي، تأكد من قدرتك على الإجابة:

1. لماذا يُرسل SW رسالة `PROCESS_OFFLINE_QUEUE` للنافذة بدل المزامنة مباشرة؟
2. ما الذي يُتيح `CacheFirst` آمنًا لـ `_next/static/` ولكن خطرًا للـ `/api/*`؟
3. لماذا `cacheNotes()` تُجري `bulkGet` قبل `bulkPut` وما المشكلة التي تحلّها؟
4. ما الحالة التي تُسبّب `ChunkLoadError` بعد deactivate وكيف يحلّها `window.location.reload()`؟
5. لماذا يتبع Effect 2 في `usePwaStatus` لـ `pwaActivated` كتبعية وما الحالة التي يُعالجها؟

---

الدرس السابق → [الدرس 09: محرر النصوص الغني والتسجيل الصوتي — Tiptap وMediaRecorder](09-tiptap-and-media-recorder.md) | الدرس التالي → [الدرس 11: الإشعارات الفورية وإدارة الأجهزة الموثوقة](11-push-notifications.md)
