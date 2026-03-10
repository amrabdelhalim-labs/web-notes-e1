# دليل PWA — الخدمة، التخزين الاوف لاين، والإشعارات 📱

> **الغرض:** توثيق كامل لطبقة PWA في **ملاحظاتي** — تشمل Service Worker، Dexie، Background Sync، وWeb Push
> **الملفات:** `src/app/sw.ts` + `src/app/lib/db.ts` + `src/app/lib/webpush.ts`

---

## جدول المحتويات

1. [نظرة عامة على الـ PWA](#1-نظرة-عامة-على-الـ-pwa)
2. [مبدأ Zero PWA Footprint](#2-مبدأ-zero-pwa-footprint)
3. [Service Worker — استراتيجيات التخزين المؤقت](#3-service-worker--استراتيجيات-التخزين-المؤقت)
4. [قاعدة البيانات الاوف لاين (Dexie)](#4-قاعدة-البيانات-الاوف-لاين-dexie)
5. [Background Sync — المزامنة في الخلفية](#5-background-sync--المزامنة-في-الخلفية)
6. [Web Push — الإشعارات](#6-web-push--الإشعارات)
7. [تشغيل وتعطيل الـ PWA](#7-تشغيل-وتعطيل-الـ-pwa)
8. [ملف Manifest](#8-ملف-manifest)

---

## 1. نظرة عامة على الـ PWA

**ملاحظاتي** PWA يوفر:

| الميزة | الوصف |
|--------|-------|
| **التخزين المؤقت** | الموارد الثابتة تخزَّن محلياً لأداء أسرع |
| **الوضع الاوف لاين** | قراءة وكتابة الملاحظات بدون إنترنت |
| **Background Sync** | إرسال التعديلات للخادم عند عودة الاتصال |
| **Push Notifications** | إشعارات من الخادم عبر Web Push API |
| **قابل التثبيت** | يمكن تثبيته كتطبيق مستقل على الجهاز |

**المنظومة التقنية:**

```
@serwist/next     ← إطار عمل Service Worker
Dexie (IndexedDB) ← قاعدة البيانات الاوف لاين
Web Push API      ← الإشعارات
VAPID             ← مصادقة Push Server
```

---

## 2. مبدأ Zero PWA Footprint

**المشكلة:** تسجيل Service Worker لكل مستخدم — حتى غير المهتمين بـ PWA — يُبطئ التطبيق ويُعقّد التجربة.

**الحل:** الـ PWA **معطّل بالكامل افتراضياً**. المستخدم يختار تفعيله من صفحة الملف الشخصي.

```
المستخدم الجديد
    │
    ├─ [يتجاهل PWA] → لا Service Worker، لا Manifest، صفحات عادية
    │
    └─ [يثق الجهاز من الملف الشخصي]
           │
           ├─ PwaActivationContext يضيف <link rel="manifest">
           ├─ Service Worker يُسجَّل
           └─ الجهاز يُضاف إلى قائمة الأجهزة الموثوقة
```

**ثوابت التخزين المحلي:**

```typescript
const PWA_ENABLED_KEY  = 'pwa-enabled';    // 'true' أو غير موجود
const TRUSTED_KEY      = 'device-trusted'; // 'true' أو غير موجود
```

**ملاحظة:** يمكن تعطيل الـ PWA كلياً عبر متغير البيئة `NEXT_PUBLIC_SW_DISABLED=true`.

---

## 3. Service Worker — استراتيجيات التخزين المؤقت

**الملف:** `src/app/sw.ts`  
**الإطار:** `@serwist/next`

### استراتيجيات التخزين

| المسار | الاستراتيجية | المدة | عدد المداخل | السبب |
|--------|-------------|-------|------------|-------|
| `/api/*` | NetworkOnly | — | — | البيانات دائماً من الخادم |
| `/_next/static/*` | CacheFirst | 365 يومًا | 256 مدخل | ملفات ثابتة نادراً تتغير |
| `/icons/*.{png,svg,webp}` | CacheFirst | 30 يومًا | 32 مدخل | أيقونات ثابتة |
| الصفحات الأخرى | `defaultCache` | من @serwist | — | استراتيجية serwist الافتراضية |

### شرح الاستراتيجيات

**NetworkOnly** (لـ `/api/*`):
```
الطلب → الشبكة مباشرةً → الاستجابة
                ↓ (إذا فشل)
           خطأ شبكة — Dexie تتولى
```

**CacheFirst** (للموارد الثابتة):
```
الطلب → الـ Cache → وُجد؟ أرجعه
              ↓ (لم يوجد)
         الشبكة → تخزين في Cache → الاستجابة
```

### تهيئة الـ @serwist في next.config

```javascript
// next.config.mjs
import withSerwist from '@serwist/next';

const serwistConfig = {
  swSrc: 'src/app/sw.ts',  // ملف SW المخصص
  swDest: 'public/sw.js',  // ملف SW المُجمَّع
  disable: process.env.NEXT_PUBLIC_SW_DISABLED === 'true',
};
```

---

## 4. قاعدة البيانات الاوف لاين (Dexie)

**الملف:** `src/app/lib/db.ts`  
**المكتبة:** Dexie.js (واجهة IndexedDB)

### تعريف قاعدة البيانات

```typescript
const db = new Dexie('mynotes_offline_db');
// الإصدار 2 (تم إضافة جدول devices في v2)
```

### جدول `notes` — الملاحظات المخزّنة مؤقتاً

**النوع:** `CachedNote = INote & { _cachedAt: number }`

| الحقل | النوع | وصف |
|-------|----|-----|
| `_id` | String (index) | معرّف الملاحظة في MongoDB |
| `title` | String | عنوان الملاحظة |
| `content` | String? | المحتوى النصي |
| `type` | String (index) | `'text'` أو `'voice'` |
| `createdAt` | Date (index) | تاريخ الإنشاء |
| `_cachedAt` | Number (index) | وقت التخزين المؤقت (timestamp) |

### جدول `pendingOps` — العمليات المعلّقة

**النوع:** `PendingOperation`

| الحقل | النوع | وصف |
|-------|----|-----|
| `id` | Number (++, primary) | معرّف تلقائي |
| `type` | String (index) | `'create'`، `'update'`، أو `'delete'` |
| `tempId` | String | معرّف مؤقت (للعمليات الجديدة) |
| `noteId` | String? | معرّف MongoDB (لعمليات update/delete) |
| `noteTitle` | String? | عنوان الملاحظة (للعرض في لوحة العمليات المعلّقة) |
| `noteSnapshot` | Note? | نسخة كاملة قبل التعديل (للتراجع / Undo) |
| `payload` | Object | بيانات العملية |
| `timestamp` | Number (index) | وقت إضافة العملية |
| `failureCount` | Number | عدد محاولات الإرسال الفاشلة |

### جدول `devices` — الأجهزة المخزّنة مؤقتاً

**النوع:** `CachedDevice = IDevice & { _cachedAt: number }`

| الحقل | النوع | وصف |
|-------|----|-----|
| `deviceId` | String (index) | UUID الجهاز |
| `_cachedAt` | Number (index) | وقت التخزين المؤقت |

---

### دوال `db.ts`

#### عمليات الملاحظات

```typescript
// تخزين الملاحظات مؤقتاً (مع حد أقصى MAX_CACHED_NOTES)
await db.cacheNotes(notes: INote[]): Promise<void>
// تضيف _cachedAt = Date.now() وتحافظ على audioData الموجودة مسبقاً
// تحذف أقدم المداخل إذا تجاوز العدد الحد الأقصى

// جلب الملاحظات من الـ Cache
const notes = await db.getCachedNotes(): Promise<CachedNote[]>
// مرتبة من الأحدث إلى الأقدم

// حذف ملاحظة من الـ Cache
await db.removeCachedNote(noteId: string): Promise<void>

// حذف الملاحظات المؤقتة (tmp_*) المتبقية بعد المزامنة
await db.cleanStaleNotes(): Promise<number>
// تُرجع عدد المداخل المحذوفة
```

#### عمليات قائمة الانتظار (Pending Operations)

```typescript
// إضافة عملية للانتظار
await db.enqueuePendingOp(op: Omit<PendingOperation, 'id'>): Promise<number>
// تُرجع المعرّف التلقائي (id) للعملية

// جلب جميع العمليات المعلّقة (مرتبة بالتسلسل)
const ops = await db.getPendingOps(): Promise<PendingOperation[]>

// حذف عملية بعد نجاحها
await db.removePendingOp(id: number): Promise<void>

// هل يوجد عمليات معلّقة؟
const hasPending = await db.hasPendingOps(): Promise<boolean>

// تسجيل فشل محاولة إرسال
await db.incrementPendingOpFailure(id: number): Promise<void>
```

#### عمليات الأجهزة

```typescript
// تخزين الأجهزة مؤقتاً
await db.cacheDevices(devices: IDevice[]): Promise<void>

// جلب الأجهزة من الـ Cache
const devices = await db.getCachedDevices(): Promise<CachedDevice[]>
```

#### إعادة الضبط

```typescript
// مسح البيانات الحساسة (عند تسجيل الخروج أو إلغاء الثقة)
await db.clearOfflineData(): Promise<void>
// تمسح: notes + pendingOps (تبقي devices لأنها بيانات وصفية فقط)
```

---

## 5. Background Sync — المزامنة في الخلفية

### مبدأ العمل

عندما يكتب المستخدم ملاحظة أثناء الاوف لاين:

```
المستخدم يكتب ملاحظة (اوف لاين)
    │
    ├─ Dexie.enqueuePendingOp() ← تخزين العملية محلياً
    ├─ UI يعرض الملاحظة فوراً (optimistic update)
    │
    └─ [عودة الاتصال]
           │
           ├─ SW يستلم sync event بـ tag = 'notes-sync'
           ├─ SW يرسل رسالة 'PROCESS_OFFLINE_QUEUE' لجميع النوافذ المفتوحة
           └─ React Context يعالج القائمة ويرسلها للخادم
```

**ملاحظة مهمة:** الـ JWT يعيش في `localStorage`، وليس في الـ Service Worker. لذلك يُرسل SW رسالةً للصفحة بدلاً من إرسال الطلبات مباشرةً.

### تسجيل Background Sync في SW

```typescript
// src/app/sw.ts
self.addEventListener('sync', (event) => {
  if (event.tag === 'notes-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' })
        );
      })
    );
  }
});
```

### تشغيل Background Sync (من الـ UI)

```typescript
// يُستدعى من React hook عند وجود عمليات معلّقة
const registration = await navigator.serviceWorker.ready;
await registration.sync.register('notes-sync');
```

---

## 6. Web Push — الإشعارات

### البنية العامة

```
خادم ملاحظاتي
    │
    │ (VAPID + الـ subscription)
    ↓
خدمة Push (FCM/APNs/...)
    │
    ↓
Service Worker
    │
    ├─ يعرض الإشعار (title, body, icon)
    └─ click → يفتح الـ URL المحدد في الإشعار
```

### مفاتيح VAPID

```typescript
// webpush.ts يستخدم:
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  // للعميل (يبدأ بـ NEXT_PUBLIC_)
process.env.VAPID_PRIVATE_KEY              // للخادم فقط (سري!)
process.env.VAPID_EMAIL                    // بريد المسؤول
```

> تحذير أمني: `VAPID_PRIVATE_KEY` يجب ألا يُرسل أبداً للعميل — متغير بيئة خادم فقط.
> لإعداد هذه المتغيرات في بيئة الإنتاج: [deployment.md](deployment.md#2-متغيرات-البيئة)

### إرسال إشعار من الخادم

```typescript
// src/app/lib/webpush.ts
import { sendPushNotification } from '@/app/lib/webpush';

const success = await sendPushNotification(subscription, {
  title: 'عنوان الإشعار',
  body: 'نص الإشعار',
  url: '/notes',   // الرابط عند النقر
});

// true  = نجح الإرسال
// false = انتهى الاشتراك (410/404 Gone) → يُحذف تلقائياً
```

### معالجة الإشعار في SW

```typescript
// src/app/sw.ts
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // يُعيد التركيز على تبويب مفتوح، أو يفتح تبويباً جديداً
      const existing = clients.find((c) => c.url.includes(data.url));
      return existing ? existing.focus() : self.clients.openWindow(data.url);
    })
  );
});
```

### تسجيل اشتراك Push (العميل)

```typescript
// الحصول على المفتاح العام + الاشتراك
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
});

// إرسال الاشتراك للخادم
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify({ subscription, deviceId }),
});
```

---

## 7. تشغيل وتعطيل الـ PWA

### تفعيل من صفحة الملف الشخصي

1. المستخدم يفتح صفحة الملف الشخصي (`/profile`)
2. يُضغط على "ثق بهذا الجهاز"
3. `PwaActivationContext` يُعيّن `localStorage['device-trusted'] = 'true'`
4. يُضاف الجهاز إلى قاعدة البيانات عبر `POST /api/devices`
5. `PwaActivationContext` يُضيف `<link rel="manifest">` للـ DOM
6. Service Worker يُسجَّل تلقائياً عبر `@serwist/next`

### إلغاء الثقة / تسجيل الخروج

```typescript
// عند تسجيل الخروج أو إلغاء الثقة:
await db.clearOfflineData();                          // مسح الـ Cache
localStorage.removeItem('pwa-enabled');
localStorage.removeItem('device-trusted');
// SW يُلغى تسجيله تلقائياً
```

### تعطيل SW في بيئة التطوير

```bash
# في .env.local
NEXT_PUBLIC_SW_DISABLED=true
```

---

## 8. ملف Manifest

**الملف:** `public/manifest.json`

```json
{
  "name": "ملاحظاتي",
  "short_name": "ملاحظاتي",
  "description": "تطبيق ملاحظات ذكي",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ]
}
```

**ملاحظة مهمة:** الـ manifest لا يُضاف في `<head>` في ملف layout افتراضياً — يُضاف فقط عند تفعيل الـ PWA من قِبل المستخدم (مبدأ Zero Footprint).

---

*للتعمق في API الإشعارات: [api-endpoints.md](api-endpoints.md#post-apipushsubscribe)*  
*للدرس التعليمي: [الدرس 10: PWA و Service Worker](tutorials/lessons/10-pwa-service-worker.md) و [الدرس 11: الإشعارات والأجهزة](tutorials/lessons/11-push-notifications.md)*
